package com.milkypot.tv

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
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
 * Player fullscreen baseado em ExoPlayer (Media3).
 * Busca playlist via Firestore REST, toca os videos/imagens em loop.
 * ZERO WebView. Decoder nativo Android = consumo minimo de memoria.
 */
@OptIn(UnstableApi::class)
class PlayerActivity : AppCompatActivity() {

    private val TAG = "MilkyPotTV"
    private val RELOAD_AFTER_MS = 60L * 60L * 1000L // 60 min — bem mais tolerante que WebView

    private lateinit var playerView: PlayerView
    private lateinit var statusView: TextView
    private var player: ExoPlayer? = null

    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    private var tvCode: String? = null
    private var franchiseId: String? = null
    private var tvId: String? = null
    private var startTime = System.currentTimeMillis()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goFullscreen()
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.playerView)
        statusView = findViewById(R.id.statusView)

        tvCode = intent.getStringExtra("code") ?: Prefs.getTvCode(this)
        if (tvCode.isNullOrBlank()) {
            showStatus("Nenhuma TV selecionada")
            openSelector(true)
            return
        }

        initPlayer()
        showStatus("Resolvendo TV $tvCode…")
        resolveAndLoad()

        // Auto-restart preventivo (60min)
        main.postDelayed(autoRestartTick, 60_000)
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
        player = ExoPlayer.Builder(this).build().also { p ->
            playerView.player = p
            playerView.useController = false
            p.repeatMode = Player.REPEAT_MODE_ALL
            p.playWhenReady = true
            p.volume = 0f // muted por padrao (autoplay requer)
        }
    }

    private fun showStatus(text: String) {
        main.post {
            statusView.text = text
            statusView.visibility = if (text.isBlank()) View.GONE else View.VISIBLE
        }
    }

    private fun hideStatus() = main.post { statusView.visibility = View.GONE }

    private val autoRestartTick = object : Runnable {
        override fun run() {
            if (System.currentTimeMillis() - startTime >= RELOAD_AFTER_MS) {
                Log.i(TAG, "auto-restart preventivo de memoria")
                recreate()
                return
            }
            main.postDelayed(this, 60_000)
        }
    }

    // ================= Firestore REST =================
    private val FIRESTORE_BASE =
        "https://firestore.googleapis.com/v1/projects/milkypot-ad945/databases/(default)/documents/datastore/"

    private fun fetchDoc(docId: String): JSONObject? {
        return try {
            val r = http.newCall(Request.Builder().url(FIRESTORE_BASE + docId).build()).execute()
            if (!r.isSuccessful) return null
            val body = r.body?.string() ?: return null
            val doc = JSONObject(body)
            val fields = doc.optJSONObject("fields") ?: return null
            val valueStr = fields.optJSONObject("value")?.optString("stringValue") ?: return null
            if (valueStr.isBlank()) null else JSONObject().put("value", JSONObject().put("__raw", valueStr))
        } catch (e: Exception) {
            Log.w(TAG, "fetchDoc err $docId: ${e.message}")
            null
        }
    }

    private fun parseJsonArray(str: String?): JSONArray = try { JSONArray(str ?: "[]") } catch (_: Exception) { JSONArray() }
    private fun parseJsonObject(str: String?): JSONObject = try { JSONObject(str ?: "{}") } catch (_: Exception) { JSONObject() }

    // Busca direta do valueStr bruto (sem wrapper)
    private fun rawDoc(docId: String): String? {
        return try {
            val r = http.newCall(Request.Builder().url(FIRESTORE_BASE + docId).build()).execute()
            if (!r.isSuccessful) return null
            val body = r.body?.string() ?: return null
            JSONObject(body).optJSONObject("fields")?.optJSONObject("value")?.optString("stringValue")
        } catch (e: Exception) {
            Log.w(TAG, "rawDoc err $docId: ${e.message}")
            null
        }
    }

    private fun resolveAndLoad() {
        io.execute {
            // 1. Resolve codigo -> franchiseId + tvId (via tv_shortcodes_*)
            val code = tvCode ?: return@execute
            val franchisesRaw = rawDoc("franchises") ?: run {
                showStatus("Sem conexão. Tentando de novo em 10s…")
                main.postDelayed({ resolveAndLoad() }, 10_000)
                return@execute
            }
            val franchises = parseJsonArray(franchisesRaw)
            var fid: String? = null
            var tid: String? = null
            for (i in 0 until franchises.length()) {
                val f = franchises.optJSONObject(i) ?: continue
                val fidCandidate = f.optString("id")
                val shortcodesRaw = rawDoc("tv_shortcodes_$fidCandidate") ?: continue
                val map = parseJsonObject(shortcodesRaw)
                val entry = map.optJSONObject(code) ?: continue
                val foundTv = entry.optString("tvId")
                if (foundTv.isNotBlank()) { fid = fidCandidate; tid = foundTv; break }
            }

            if (fid == null || tid == null) {
                showStatus("Código \"$code\" não encontrado. Toque em VOLTAR pra trocar.")
                return@execute
            }
            franchiseId = fid; tvId = tid
            loadPlaylist()
        }
    }

    private fun loadPlaylist() {
        val fid = franchiseId ?: return
        io.execute {
            val mediaRaw = rawDoc("tv_media_$fid")
            val playlistRaw = rawDoc("tv_playlist_$fid")
            val configRaw = rawDoc("tv_config_$fid")

            val mediaArr = parseJsonArray(mediaRaw)
            val byId = HashMap<String, JSONObject>()
            for (i in 0 until mediaArr.length()) {
                val m = mediaArr.optJSONObject(i) ?: continue
                val id = m.optString("id"); if (id.isNotBlank()) byId[id] = m
            }

            var playlistArr = parseJsonArray(playlistRaw)
            // fallback: biblioteca inteira
            if (playlistArr.length() == 0 && mediaArr.length() > 0) {
                val arr = JSONArray()
                for (i in 0 until mediaArr.length()) {
                    val m = mediaArr.optJSONObject(i) ?: continue
                    arr.put(JSONObject().put("mediaId", m.optString("id")).put("duration", m.optInt("duration", 10)))
                }
                playlistArr = arr
            }

            val videoUrls = ArrayList<String>()
            for (i in 0 until playlistArr.length()) {
                val entry = playlistArr.opt(i)
                val mid = when (entry) {
                    is String -> entry
                    is JSONObject -> entry.optString("mediaId")
                    else -> null
                } ?: continue
                val m = byId[mid] ?: continue
                val type = m.optString("type")
                val url = m.optString("url").ifBlank { null } ?: continue
                if (type == "video" || type == "image") videoUrls.add(url) // imagem tb vai (ExoPlayer nao renderiza, vamos priorizar video)
            }

            val onlyVideos = videoUrls.filter { it.endsWith(".mp4", ignoreCase = true) || it.contains("video/mp4") || !it.endsWith(".jpg", ignoreCase = true) && !it.endsWith(".png", ignoreCase = true) && !it.endsWith(".jpeg", ignoreCase = true) }

            main.post {
                if (onlyVideos.isEmpty()) {
                    showStatus("Playlist vazia ou só com imagens.\nAbra o painel e adicione um vídeo MP4.")
                    return@post
                }
                val items = onlyVideos.map { MediaItem.fromUri(it) }
                val p = player ?: return@post
                p.clearMediaItems()
                p.setMediaItems(items)
                p.prepare()
                p.play()
                hideStatus()
            }
        }
    }

    // Long-press BACK → volta pro selector
    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            openSelector(true)
            return true
        }
        return super.onKeyLongPress(keyCode, event)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            event?.startTracking()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun openSelector(forceSelect: Boolean) {
        val i = Intent(this, SelectorActivity::class.java)
        if (forceSelect) i.putExtra("reset", true)
        i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(i)
        finish()
    }

    override fun onResume() { super.onResume(); goFullscreen(); player?.play() }
    override fun onPause()  { super.onPause();  player?.pause() }
    override fun onDestroy() {
        main.removeCallbacks(autoRestartTick)
        player?.release(); player = null
        super.onDestroy()
    }
}
