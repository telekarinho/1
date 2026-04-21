package com.milkypot.tv

import android.animation.ObjectAnimator
import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.TextView
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * Player principal — carrega playlist, aplica schedule/pause, renderiza
 * overlays (ticker / relógio / QR / emergency) e dispara heartbeat +
 * auto-update. Cache offline integrado via OfflineCache.
 */
@OptIn(UnstableApi::class)
class PlayerActivity : AppCompatActivity() {

    private val TAG = "MilkyPotTV"
    private val RELOAD_AFTER_MS = 60L * 60L * 1000L // 60 min

    private lateinit var playerView: PlayerView
    private lateinit var statusView: TextView
    private lateinit var clockView: TextView
    private lateinit var tickerView: TextView
    private lateinit var qrView: ImageView
    private lateinit var emergencyView: TextView
    private lateinit var closedView: View
    private lateinit var closedText: TextView
    private lateinit var pausedView: View

    private var player: ExoPlayer? = null
    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    private var tvCode: String? = null
    private var franchiseId: String? = null
    private var tvId: String? = null
    private var startTime = System.currentTimeMillis()

    private var configJson: JSONObject = JSONObject()
    private var currentPlaylist: List<PlaylistItem> = emptyList()

    data class PlaylistItem(val id: String, val url: String, val duration: Int)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goFullscreen()
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.playerView)
        statusView = findViewById(R.id.statusView)
        clockView = findViewById(R.id.clockView)
        tickerView = findViewById(R.id.tickerView)
        qrView = findViewById(R.id.qrView)
        emergencyView = findViewById(R.id.emergencyView)
        closedView = findViewById(R.id.closedView)
        closedText = findViewById(R.id.closedText)
        pausedView = findViewById(R.id.pausedView)

        tvCode = intent.getStringExtra("code") ?: Prefs.getTvCode(this)
        if (tvCode.isNullOrBlank()) {
            showStatus("Nenhuma TV selecionada")
            openSelector(true); return
        }

        initPlayer()
        showStatus("Resolvendo TV $tvCode…")
        resolveAndLoad()

        // Background services
        AutoUpdater.start(this)
        main.postDelayed(autoRestartTick, 60_000)
        main.post(clockTick)
        main.postDelayed(configRefreshTick, 2 * 60_000)
    }

    private fun goFullscreen() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
    }

    private fun initPlayer() {
        player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(OfflineCache.mediaSourceFactory(this))
            .build().also { p ->
                playerView.player = p
                playerView.useController = false
                p.repeatMode = Player.REPEAT_MODE_ALL
                p.playWhenReady = true
                p.volume = 0f
                p.addListener(object : Player.Listener {
                    override fun onMediaItemTransition(item: MediaItem?, reason: Int) {
                        val tag = item?.mediaId ?: ""
                        Heartbeat.setNowPlaying(tag.ifBlank { null })
                        // Analytics: contador por mídia
                        Analytics.recordPlay(this@PlayerActivity, franchiseId, tag)
                        // Fade-in suave (transição entre itens)
                        playerView.alpha = 0f
                        playerView.animate().alpha(1f).setDuration(400).start()
                    }
                })
            }
    }

    private fun showStatus(text: String) = main.post {
        statusView.text = text
        statusView.visibility = if (text.isBlank()) View.GONE else View.VISIBLE
    }
    private fun hideStatus() = main.post { statusView.visibility = View.GONE }

    // =============== Loops ===============

    private val autoRestartTick = object : Runnable {
        override fun run() {
            if (System.currentTimeMillis() - startTime >= RELOAD_AFTER_MS) {
                Log.i(TAG, "auto-restart preventivo")
                recreate(); return
            }
            main.postDelayed(this, 60_000)
        }
    }

    private val clockTick = object : Runnable {
        override fun run() {
            updateClock()
            main.postDelayed(this, 30_000)
        }
    }

    private val configRefreshTick = object : Runnable {
        override fun run() {
            reloadConfigOnly()
            main.postDelayed(this, 2 * 60_000)
        }
    }

    // =============== Loader ===============

    private fun resolveAndLoad() {
        io.execute {
            val code = tvCode ?: return@execute
            val franchisesRaw = CachedRepo.fetch(this, "franchises")
            if (franchisesRaw == null) {
                showStatus("Sem conexão e sem cache. Tentando em 10s…")
                main.postDelayed({ resolveAndLoad() }, 10_000); return@execute
            }
            val franchises = parseArr(franchisesRaw)
            var fid: String? = null; var tid: String? = null
            for (i in 0 until franchises.length()) {
                val f = franchises.optJSONObject(i) ?: continue
                val cand = f.optString("id")
                val scRaw = CachedRepo.fetch(this, "tv_shortcodes_$cand") ?: continue
                val map = parseObj(scRaw)
                val entry = map.optJSONObject(code) ?: continue
                val found = entry.optString("tvId")
                if (found.isNotBlank()) { fid = cand; tid = found; break }
            }
            if (fid == null || tid == null) {
                showStatus("Código \"$code\" não encontrado."); return@execute
            }
            franchiseId = fid; tvId = tid
            Prefs.setResolved(this, fid!!, tid!!)
            Heartbeat.start(this, fid!!, tid!!)
            loadPlaylist()
        }
    }

    private fun reloadConfigOnly() {
        val fid = franchiseId ?: return
        io.execute {
            val raw = CachedRepo.fetch(this, "tv_config_$fid") ?: return@execute
            configJson = parseObj(raw)
            main.post { applyOverlays(); applyStateFromConfig() }
        }
    }

    private fun loadPlaylist() {
        val fid = franchiseId ?: return
        io.execute {
            val mediaRaw = CachedRepo.fetch(this, "tv_media_$fid") ?: "[]"
            val playlistRaw = CachedRepo.fetch(this, "tv_playlist_$fid") ?: "[]"
            val configRaw = CachedRepo.fetch(this, "tv_config_$fid") ?: "{}"

            val mediaArr = parseArr(mediaRaw)
            val byId = HashMap<String, JSONObject>()
            for (i in 0 until mediaArr.length()) {
                val m = mediaArr.optJSONObject(i) ?: continue
                val id = m.optString("id"); if (id.isNotBlank()) byId[id] = m
            }

            // Playlist base
            var playlistArr = parseArr(playlistRaw)
            if (playlistArr.length() == 0 && mediaArr.length() > 0) {
                val arr = JSONArray()
                for (i in 0 until mediaArr.length()) {
                    val m = mediaArr.optJSONObject(i) ?: continue
                    arr.put(JSONObject().put("mediaId", m.optString("id")).put("duration", m.optInt("duration", 10)))
                }
                playlistArr = arr
            }

            val nowMs = System.currentTimeMillis()
            val items = mutableListOf<PlaylistItem>()
            for (i in 0 until playlistArr.length()) {
                val entry = playlistArr.opt(i)
                val mid = when (entry) {
                    is String -> entry
                    is JSONObject -> entry.optString("mediaId")
                    else -> null
                } ?: continue
                val m = byId[mid] ?: continue
                val type = m.optString("type")
                if (type != "video") continue
                val url = m.optString("url").ifBlank { null } ?: continue

                // Expiracao
                val expiresAt = m.optString("expiresAt").ifBlank { null }
                if (expiresAt != null) {
                    val expMs = runCatching { java.time.Instant.parse(expiresAt).toEpochMilli() }.getOrNull()
                    if (expMs != null && expMs < nowMs) continue
                }

                val duration = m.optInt("duration", 10)
                val weight = m.optInt("weight", 1).coerceIn(1, 5)

                // Replica pela weight (1 = normal, 2 = dobro de aparições, etc.)
                repeat(weight) { items.add(PlaylistItem(mid, url, duration)) }
            }

            configJson = parseObj(configRaw)
            currentPlaylist = items

            main.post {
                applyOverlays()
                applyStateFromConfig()
                if (items.isEmpty()) {
                    showStatus("Playlist vazia ou sem videos MP4.\nAbra o painel e adicione um video.")
                    return@post
                }
                val mediaItems = items.map {
                    MediaItem.Builder().setMediaId(it.id).setUri(it.url).build()
                }
                player?.let { p ->
                    p.clearMediaItems()
                    p.setMediaItems(mediaItems)
                    p.prepare()
                    p.play()
                }
                hideStatus()
            }
        }
    }

    // =============== Overlays ===============

    private fun applyOverlays() {
        val cfg = configJson

        // Ticker
        val tickerText = cfg.optString("ticker").takeIf { it.isNotBlank() }
        if (tickerText != null) {
            tickerView.text = tickerText
            tickerView.visibility = View.VISIBLE
            startTickerAnimation()
        } else {
            tickerView.visibility = View.GONE
        }

        // Relógio
        if (cfg.optBoolean("showClock", false)) {
            clockView.visibility = View.VISIBLE
            updateClock()
        } else {
            clockView.visibility = View.GONE
        }

        // QR code
        val qrData = cfg.optString("qrUrl").takeIf { it.isNotBlank() }
        if (qrData != null) {
            val bmp: Bitmap? = QrGenerator.generate(qrData, 256)
            if (bmp != null) {
                qrView.setImageBitmap(bmp)
                qrView.visibility = View.VISIBLE
            } else {
                qrView.visibility = View.GONE
            }
        } else {
            qrView.visibility = View.GONE
        }

        // Emergency banner
        val emergency = cfg.optString("emergencyMessage").takeIf { it.isNotBlank() }
        if (emergency != null) {
            emergencyView.text = emergency
            emergencyView.visibility = View.VISIBLE
        } else {
            emergencyView.visibility = View.GONE
        }
    }

    private fun startTickerAnimation() {
        tickerView.post {
            tickerView.translationX = tickerView.width.toFloat()
            val distance = tickerView.width.toFloat() + tickerView.paint.measureText(tickerView.text.toString())
            val anim = ObjectAnimator.ofFloat(tickerView, "translationX",
                tickerView.width.toFloat(), -distance)
            anim.duration = (distance * 20).toLong() // velocidade proporcional
            anim.repeatCount = ObjectAnimator.INFINITE
            anim.start()
        }
    }

    private fun applyStateFromConfig() {
        val cfg = configJson
        // Schedule
        val sched = Schedule.isOpenNow(cfg)
        // Pause remoto
        val paused = cfg.optBoolean("pauseRemote", false)

        when {
            paused -> {
                pausedView.visibility = View.VISIBLE
                closedView.visibility = View.GONE
                player?.pause()
            }
            !sched.open -> {
                pausedView.visibility = View.GONE
                closedView.visibility = View.VISIBLE
                closedText.text = sched.reason
                player?.pause()
            }
            else -> {
                pausedView.visibility = View.GONE
                closedView.visibility = View.GONE
                player?.play()
            }
        }
    }

    private fun updateClock() {
        if (!this::clockView.isInitialized) return
        val d = java.util.Calendar.getInstance()
        val hh = "%02d".format(d.get(java.util.Calendar.HOUR_OF_DAY))
        val mm = "%02d".format(d.get(java.util.Calendar.MINUTE))
        clockView.text = "$hh:$mm"
    }

    // =============== Navigation ===============

    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) { openSelector(true); return true }
        return super.onKeyLongPress(keyCode, event)
    }
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) { event?.startTracking(); return true }
        return super.onKeyDown(keyCode, event)
    }

    private fun openSelector(forceSelect: Boolean) {
        val i = Intent(this, SelectorActivity::class.java)
        if (forceSelect) i.putExtra("reset", true)
        i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(i); finish()
    }

    override fun onResume() {
        super.onResume(); goFullscreen()
        if (configJson.optBoolean("pauseRemote", false)) return
        if (!Schedule.isOpenNow(configJson).open) return
        player?.play()
    }
    override fun onPause()  { super.onPause(); player?.pause() }
    override fun onDestroy() {
        main.removeCallbacks(autoRestartTick)
        main.removeCallbacks(clockTick)
        main.removeCallbacks(configRefreshTick)
        player?.release(); player = null
        super.onDestroy()
    }

    // =============== Helpers ===============

    private fun parseArr(s: String?): JSONArray = try { JSONArray(s ?: "[]") } catch (_: Exception) { JSONArray() }
    private fun parseObj(s: String?): JSONObject = try { JSONObject(s ?: "{}") } catch (_: Exception) { JSONObject() }
}
