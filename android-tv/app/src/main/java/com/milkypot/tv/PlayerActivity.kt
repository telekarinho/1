package com.milkypot.tv

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.ImageView
import android.widget.TextView
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Player principal v1.3.0 — suporta:
 *   video / image / html   (multi-tipo em sequência)
 *   wall-mode (3 TVs sincronizadas por timestamp Firestore)
 *   dayparting (config.schedules muda playlist por horário)
 *   orientation forçada (landscape/portrait via tv_config.orientation)
 *   overlays já existentes (ticker, clock, qr, emergency, pause, closed)
 */
@OptIn(UnstableApi::class)
class PlayerActivity : AppCompatActivity() {

    private val TAG = "MilkyPotTV"
    private val RELOAD_AFTER_MS = 60L * 60L * 1000L

    private lateinit var playerView: PlayerView
    private lateinit var slideImage: ImageView
    private lateinit var slideWebView: WebView
    private lateinit var statusView: TextView
    private lateinit var clockView: TextView
    private lateinit var tickerView: TextView
    private lateinit var qrView: ImageView
    private lateinit var emergencyView: TextView
    private lateinit var closedView: View
    private lateinit var closedText: TextView
    private lateinit var pausedView: View
    // FASE F — Challenge Live overlay
    private lateinit var challengeOverlay: View
    private lateinit var challengeTitle: TextView
    private lateinit var challengePlayer: TextView
    private lateinit var challengeTimer: TextView
    private lateinit var challengeResult: TextView
    private var challengeStartMs: Long = 0
    private var challengeTickRunnable: Runnable? = null

    private var player: ExoPlayer? = null
    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).build()

    private var tvCode: String? = null
    private var franchiseId: String? = null
    private var tvId: String? = null
    private var startTime = System.currentTimeMillis()

    private var configJson: JSONObject = JSONObject()
    private var playlist: List<PlaylistItem> = emptyList()
    private var playIndex = -1
    private var nextSlideTick: Runnable? = null

    data class PlaylistItem(
        val id: String,
        val type: String,    // "video" | "image" | "html"
        val url: String,
        val duration: Int,   // segundos
        val wallSync: Boolean = false  // FASE E — se true, seek sincronizado por timestamp
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goFullscreen()
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.playerView)
        slideImage = findViewById(R.id.slideImage)
        slideWebView = findViewById(R.id.slideWebView)
        statusView = findViewById(R.id.statusView)
        clockView = findViewById(R.id.clockView)
        tickerView = findViewById(R.id.tickerView)
        qrView = findViewById(R.id.qrView)
        emergencyView = findViewById(R.id.emergencyView)
        closedView = findViewById(R.id.closedView)
        closedText = findViewById(R.id.closedText)
        pausedView = findViewById(R.id.pausedView)
        challengeOverlay = findViewById(R.id.challengeOverlay)
        challengeTitle = findViewById(R.id.challengeTitle)
        challengePlayer = findViewById(R.id.challengePlayer)
        challengeTimer = findViewById(R.id.challengeTimer)
        challengeResult = findViewById(R.id.challengeResult)

        // WebView config enxuta pra HTML slides
        slideWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
        }

        tvCode = intent.getStringExtra("code") ?: Prefs.getTvCode(this)
        if (tvCode.isNullOrBlank()) { showStatus("Nenhuma TV selecionada"); openSelector(true); return }

        initPlayer()
        showStatus("Resolvendo TV $tvCode…")
        resolveAndLoad()

        AutoUpdater.start(this)
        main.postDelayed(autoRestartTick, 60_000)
        main.post(clockTick)
        main.postDelayed(configRefreshTick, 2 * 60_000)
        main.postDelayed(playlistRefreshTick, 30_000)
        main.post(challengeLivePoll)
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
                p.repeatMode = Player.REPEAT_MODE_OFF  // nao repete, a sequencia controla
                p.playWhenReady = true
                p.volume = 0f
                p.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        if (state == Player.STATE_ENDED) {
                            main.post { playNext() }
                        }
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
                Log.i(TAG, "auto-restart preventivo"); recreate(); return
            }
            main.postDelayed(this, 60_000)
        }
    }
    private val clockTick = object : Runnable {
        override fun run() { updateClock(); main.postDelayed(this, 30_000) }
    }
    private val configRefreshTick = object : Runnable {
        override fun run() { reloadConfigOnly(); main.postDelayed(this, 2 * 60_000) }
    }
    // Atualiza biblioteca + playlist a cada 30s (igual ao tv.html web). Garante
    // que mídias novas adicionadas no painel apareçam quase instantâneo, sem
    // esperar o auto-restart de 1h. Não interrompe a mídia tocando agora — só
    // troca a lista pra próxima rodada.
    private val playlistRefreshTick = object : Runnable {
        override fun run() {
            if (franchiseId != null) loadPlaylist()
            main.postDelayed(this, 30_000)
        }
    }

    /**
     * FASE F — Challenge Live poll.
     * A cada 3s consulta challenge_live_{fid} no Firestore. Se active=true,
     * mostra overlay com timer contando. Se result != null, mostra resultado
     * por 6s e some.
     */
    private val challengeLivePoll = object : Runnable {
        override fun run() {
            val fid = franchiseId
            if (fid == null) { main.postDelayed(this, 3_000); return }
            io.execute {
                val raw = CachedRepo.fetch(this@PlayerActivity, "challenge_live_$fid")
                val obj = parseObj(raw)
                main.post {
                    applyChallengeLive(obj)
                    main.postDelayed(this, 3_000)
                }
            }
        }
    }

    private fun applyChallengeLive(live: JSONObject) {
        val active = live.optBoolean("active", false)
        val result = live.optString("result").ifBlank { null }
        val cleared = live.optBoolean("_clearedFromTv", false)

        if (!active && (result == null || cleared)) {
            // Nao ha desafio em andamento
            challengeOverlay.visibility = View.GONE
            challengeTickRunnable?.let { main.removeCallbacks(it) }
            challengeTickRunnable = null
            return
        }

        val type = live.optString("type", "10s")
        val playerName = live.optString("playerName", "Cliente")
        challengeTitle.text = if (type == "10s") "🎯 DESAFIO 10 SEGUNDOS" else "⚖️ DESAFIO 300 GRAMAS"

        challengeOverlay.visibility = View.VISIBLE

        if (active) {
            challengePlayer.text = "$playerName está jogando…"
            challengeResult.text = ""
            val startedAt = live.optString("startedAt")
            if (startedAt.isNotBlank()) {
                challengeStartMs = runCatching { java.time.Instant.parse(startedAt).toEpochMilli() }.getOrDefault(System.currentTimeMillis())
            } else {
                challengeStartMs = System.currentTimeMillis()
            }
            // Tick 50ms pra timer fluido (apenas pra 10s)
            if (type == "10s" && challengeTickRunnable == null) {
                val tick = object : Runnable {
                    override fun run() {
                        if (challengeOverlay.visibility != View.VISIBLE) return
                        val secs = (System.currentTimeMillis() - challengeStartMs) / 1000.0
                        challengeTimer.text = "%.2f".format(secs)
                        main.postDelayed(this, 50)
                    }
                }
                challengeTickRunnable = tick
                main.post(tick)
            } else if (type == "300g") {
                challengeTimer.text = "⚖️"
            }
        } else if (result != null) {
            challengeTickRunnable?.let { main.removeCallbacks(it) }
            challengeTickRunnable = null
            val finalValue = live.optDouble("finalValue", 0.0)
            challengePlayer.text = playerName
            challengeTimer.text = if (type == "10s") "%.2fs".format(finalValue) else "%.1fg".format(finalValue)
            challengeTimer.setTextColor(if (result == "won") 0xFF16A34A.toInt() else 0xFFDC2626.toInt())
            challengeResult.text = if (result == "won") "🎉 GANHOU 🎉" else "😢 PERDEU"
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
            if (fid == null || tid == null) { showStatus("Código \"$code\" não encontrado."); return@execute }
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
            main.post { applyOrientation(); applyOverlays(); applyStateFromConfig() }
        }
    }

    /**
     * FASE E — Wall Mode: descobre o papel desta TV ("left"/"center"/"right"/"none").
     * O papel vem de tv_config.wallRoles[tvId], ou alternativamente de
     * tv_shortcodes_{fid}[code].wallRole. Se nada setado, retorna "none".
     */
    private fun resolveWallRole(config: JSONObject): String? {
        val tid = tvId ?: return null
        val wallRoles = config.optJSONObject("wallRoles") ?: return null
        val role = wallRoles.optString(tid).ifBlank { null }
        return role
    }

    /** Escolhe a playlist certa pro horário atual (dayparting). */
    private fun pickPlaylistKey(fid: String, config: JSONObject): String {
        val schedules = config.optJSONArray("schedules") ?: return "tv_playlist_$fid"
        val now = java.util.Calendar.getInstance()
        val hhmm = "%02d:%02d".format(now.get(java.util.Calendar.HOUR_OF_DAY), now.get(java.util.Calendar.MINUTE))
        for (i in 0 until schedules.length()) {
            val s = schedules.optJSONObject(i) ?: continue
            val from = s.optString("from")
            val to = s.optString("to")
            val playlistKey = s.optString("playlistKey")
            if (playlistKey.isBlank()) continue
            if (from.isBlank() || to.isBlank()) continue
            if (hhmm in from..to) return playlistKey
        }
        return "tv_playlist_$fid"
    }

    private fun applyOrientation() {
        val orientation = configJson.optString("orientation", "landscape")
        requestedOrientation = when (orientation) {
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            "auto" -> ActivityInfo.SCREEN_ORIENTATION_SENSOR
            else -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }
    }

    private fun loadPlaylist() {
        val fid = franchiseId ?: return
        io.execute {
            val mediaRaw = CachedRepo.fetch(this, "tv_media_$fid") ?: "[]"
            val configRaw = CachedRepo.fetch(this, "tv_config_$fid") ?: "{}"
            configJson = parseObj(configRaw)

            val playlistDocKey = pickPlaylistKey(fid, configJson)
            val playlistRaw = CachedRepo.fetch(this, playlistDocKey) ?: "[]"

            val mediaArr = parseArr(mediaRaw)
            val byId = HashMap<String, JSONObject>()
            for (i in 0 until mediaArr.length()) {
                val m = mediaArr.optJSONObject(i) ?: continue
                val id = m.optString("id"); if (id.isNotBlank()) byId[id] = m
            }

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
                val type = m.optString("type").ifBlank { "video" }

                // FASE E — Wall Mode: mídia pode ter wallParts = { left, center, right }
                // cada TV escolhe a URL conforme seu wallRole no tv_config
                val wallParts = m.optJSONObject("wallParts")
                val wallRole = resolveWallRole(configJson)
                val pickedUrl = if (wallParts != null && wallRole != null && wallRole != "none") {
                    wallParts.optString(wallRole).ifBlank { null }
                } else null

                val url = (pickedUrl
                    ?: m.optString("url").ifBlank { m.optString("dataUrl") })
                    .ifBlank { null } ?: continue

                val wallSync = wallParts != null && pickedUrl != null

                val expiresAt = m.optString("expiresAt").ifBlank { null }
                if (expiresAt != null) {
                    val expMs = runCatching { java.time.Instant.parse(expiresAt).toEpochMilli() }.getOrNull()
                    if (expMs != null && expMs < nowMs) continue
                }

                val duration = m.optInt("duration", 10)
                val weight = m.optInt("weight", 1).coerceIn(1, 5)
                repeat(weight) { items.add(PlaylistItem(mid, type, url, duration, wallSync)) }
            }

            playlist = items
            main.post {
                applyOrientation(); applyOverlays(); applyStateFromConfig()
                if (items.isEmpty()) {
                    showStatus("Playlist vazia. Abra o painel e adicione mídias."); return@post
                }
                hideStatus()
                if (playIndex < 0) { playIndex = -1; playNext() }
            }
        }
    }

    // =============== Máquina de estados — 1 item por vez ===============
    private fun playNext() {
        if (playlist.isEmpty()) return
        // Cancela timer anterior
        nextSlideTick?.let { main.removeCallbacks(it) }

        playIndex = (playIndex + 1) % playlist.size
        val item = playlist[playIndex]
        Heartbeat.setNowPlaying(item.id)
        Analytics.recordPlay(this, franchiseId, item.id)

        // Wait fade-out curto, depois troca
        fadeAll(0f) {
            switchView(item)
        }
    }

    private fun fadeAll(target: Float, after: () -> Unit) {
        val views = listOf(playerView, slideImage, slideWebView)
        val duration = 220L
        views.forEach { it.animate().alpha(target).setDuration(duration).start() }
        main.postDelayed(after, duration)
    }

    private fun switchView(item: PlaylistItem) {
        when (item.type) {
            "video" -> showVideo(item)
            "image" -> showImage(item)
            "html"  -> showHtml(item)
            else    -> { main.postDelayed({ playNext() }, 1000); return }
        }
    }

    private fun showVideo(item: PlaylistItem) {
        hideNonVideo()
        playerView.visibility = View.VISIBLE
        playerView.alpha = 0f
        player?.let { p ->
            p.clearMediaItems()
            p.setMediaItem(MediaItem.Builder().setMediaId(item.id).setUri(item.url).build())
            p.prepare()

            // FASE E — Wall sync: seek pro offset correto baseado no relogio do sistema
            // Assume duracao == item.duration. Todas as 3 TVs calculam o mesmo offset.
            if (item.wallSync && item.duration > 0) {
                val dMs = item.duration * 1000L
                val offsetMs = System.currentTimeMillis() % dMs
                p.seekTo(offsetMs)
            }
            p.play()
        }
        playerView.animate().alpha(1f).setDuration(400).start()
    }

    private fun showImage(item: PlaylistItem) {
        hideNonImage()
        slideImage.visibility = View.VISIBLE
        slideImage.alpha = 0f

        io.execute {
            val bmp = loadBitmap(item.url)
            main.post {
                if (bmp != null) slideImage.setImageBitmap(bmp)
                slideImage.animate().alpha(1f).setDuration(400).start()
                scheduleNext(item.duration * 1000L)
            }
        }
    }

    private fun showHtml(item: PlaylistItem) {
        hideNonHtml()
        slideWebView.visibility = View.VISIBLE
        slideWebView.alpha = 0f
        slideWebView.loadUrl(item.url)
        slideWebView.animate().alpha(1f).setDuration(400).start()
        scheduleNext(item.duration * 1000L)
    }

    private fun hideNonVideo() {
        slideImage.visibility = View.GONE
        slideWebView.visibility = View.GONE
        slideWebView.loadUrl("about:blank")
    }
    private fun hideNonImage() {
        playerView.visibility = View.GONE
        player?.pause()
        slideWebView.visibility = View.GONE
        slideWebView.loadUrl("about:blank")
    }
    private fun hideNonHtml() {
        playerView.visibility = View.GONE
        player?.pause()
        slideImage.visibility = View.GONE
    }

    private fun scheduleNext(delayMs: Long) {
        val r = Runnable { playNext() }
        nextSlideTick = r
        main.postDelayed(r, delayMs)
    }

    private fun loadBitmap(url: String): Bitmap? {
        return try {
            if (url.startsWith("data:image")) {
                val base64 = url.substringAfter(",", "")
                val bytes = Base64.decode(base64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            } else {
                val req = Request.Builder().url(url).build()
                httpClient.newCall(req).execute().use { r ->
                    if (!r.isSuccessful) return null
                    val bytes = r.body?.bytes() ?: return null
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                }
            }
        } catch (e: Exception) { Log.w(TAG, "loadBitmap failed: ${e.message}"); null }
    }

    // =============== Overlays (inalterados) ===============
    private fun applyOverlays() {
        val cfg = configJson
        val showNews = cfg.optBoolean("showNews", true)
        val tickerText = if (showNews)
            (cfg.optString("ticker").ifBlank { cfg.optString("newsTicker") }).takeIf { it.isNotBlank() }
        else null
        if (tickerText != null) {
            tickerView.text = tickerText
            tickerView.visibility = View.VISIBLE
            startTickerAnimation()
        } else tickerView.visibility = View.GONE

        if (cfg.optBoolean("showClock", false)) {
            clockView.visibility = View.VISIBLE; updateClock()
        } else clockView.visibility = View.GONE

        val qrData = cfg.optString("qrUrl").takeIf { it.isNotBlank() }
        if (qrData != null) {
            val bmp = QrGenerator.generate(qrData, 256)
            if (bmp != null) { qrView.setImageBitmap(bmp); qrView.visibility = View.VISIBLE }
            else qrView.visibility = View.GONE
        } else qrView.visibility = View.GONE

        val emergency = cfg.optString("emergencyMessage").takeIf { it.isNotBlank() }
        if (emergency != null) { emergencyView.text = emergency; emergencyView.visibility = View.VISIBLE }
        else emergencyView.visibility = View.GONE
    }

    private fun startTickerAnimation() {
        tickerView.post {
            tickerView.translationX = tickerView.width.toFloat()
            val distance = tickerView.width.toFloat() + tickerView.paint.measureText(tickerView.text.toString())
            val anim = android.animation.ObjectAnimator.ofFloat(tickerView, "translationX", tickerView.width.toFloat(), -distance)
            anim.duration = (distance * 20).toLong()
            anim.repeatCount = android.animation.ObjectAnimator.INFINITE
            anim.start()
        }
    }

    private fun applyStateFromConfig() {
        val cfg = configJson
        val sched = Schedule.isOpenNow(cfg)
        val paused = cfg.optBoolean("pauseRemote", false)
        when {
            paused -> { pausedView.visibility = View.VISIBLE; closedView.visibility = View.GONE; player?.pause() }
            !sched.open -> { pausedView.visibility = View.GONE; closedView.visibility = View.VISIBLE; closedText.text = sched.reason; player?.pause() }
            else -> { pausedView.visibility = View.GONE; closedView.visibility = View.GONE; player?.play() }
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
        main.removeCallbacks(playlistRefreshTick)
        main.removeCallbacks(challengeLivePoll)
        challengeTickRunnable?.let { main.removeCallbacks(it) }
        nextSlideTick?.let { main.removeCallbacks(it) }
        player?.release(); player = null
        super.onDestroy()
    }

    // =============== Helpers ===============
    private fun parseArr(s: String?): JSONArray = try { JSONArray(s ?: "[]") } catch (_: Exception) { JSONArray() }
    private fun parseObj(s: String?): JSONObject = try { JSONObject(s ?: "{}") } catch (_: Exception) { JSONObject() }
}
