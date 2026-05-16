package com.milkypot.tv

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * WebPlayerActivity v2.0 — paridade total com a URL https://milkypot.com/tv.html.
 *
 * Estratégia: WebView fullscreen carregando o próprio tv.html. TODO o catálogo
 * (28 Milkshakes + 28 Sundaes + Buffet + Ice Protein + Alcoólicos + Monte Seu +
 * Promos + Story Desafio + tudo que for adicionado no futuro) vem pronto do
 * web — não precisamos portar nada pro Kotlin.
 *
 * Por que substituímos a PlayerActivity nativa antiga:
 *   - PlayerActivity nativa só renderizava `image` / `video` / `html` da
 *     playlist do Firestore. Tipos especiais injetados pelo JS (`milkshake-card`,
 *     `promo`, `story`, `combo`, `menu`, `text`, `product`) eram silenciosamente
 *     pulados → na TV só passavam as fotos da biblioteca, sem catálogo.
 *   - Manter duplicado em Kotlin = promete bug toda vez que o tv.html ganhar
 *     um tipo novo de slide.
 *
 * Recursos nativos preservados (rodam em paralelo com a WebView):
 *   - Heartbeat (status online da TV no painel admin)
 *   - AutoUpdater (auto-instalar nova versão do APK)
 *   - SelectorActivity (escolher TV1/2/3 na primeira vez)
 *   - Auto-fullscreen + keep-screen-on
 *   - Long-press BACK volta pro Selector
 *   - Auto-restart preventivo a cada 1h
 *
 * Resolução do "code" → "fid+tvId":
 *   Lê tv_shortcodes_{fid} de cada franquia até encontrar o code.
 *   Mesma lógica do PlayerActivity legacy.
 */
class WebPlayerActivity : AppCompatActivity() {

    private val TAG = "MilkyPotWebTV"
    private val TV_HTML_URL = "https://milkypot.com/tv.html"
    private val RELOAD_AFTER_MS = 60L * 60L * 1000L  // 1h

    private lateinit var webView: WebView
    private lateinit var statusView: TextView

    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val startTime = System.currentTimeMillis()

    private var tvCode: String? = null
    private var franchiseId: String? = null
    private var tvId: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goFullscreen()
        setContentView(R.layout.activity_web_player)

        webView = findViewById(R.id.tvWebView)
        statusView = findViewById(R.id.statusView)

        // Configura WebView pra rodar a tv.html como signage:
        //  - JS habilitado (a tv.html é toda JS)
        //  - DOM storage pra localStorage (cache da playlist)
        //  - Cache padrão (a tv.html já gerencia versão por query string)
        //  - Autoplay de mídia sem gesto do usuário
        //  - HW acceleration
        webView.setBackgroundColor(Color.BLACK)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                statusView.visibility = View.GONE
            }
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                Log.w(TAG, "WebView err $errorCode: $description ($failingUrl)")
                showStatus("Conexão lenta. Tentando…")
                // Retry simples em 10s
                main.postDelayed({ webView.reload() }, 10_000)
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(msg: ConsoleMessage?): Boolean {
                if (msg != null) Log.d(TAG, "tv.html: ${msg.message()} @${msg.lineNumber()}")
                return true
            }
        }

        tvCode = intent.getStringExtra("code") ?: Prefs.getTvCode(this)
        if (tvCode.isNullOrBlank()) {
            showStatus("Nenhuma TV selecionada")
            openSelector(true)
            return
        }

        showStatus("Resolvendo TV $tvCode…")
        resolveAndLoad()

        AutoUpdater.start(this)
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

    private fun showStatus(text: String) = main.post {
        statusView.text = text
        statusView.visibility = if (text.isBlank()) View.GONE else View.VISIBLE
    }

    /**
     * Auto-restart preventivo a cada 1h pra recuperar de leaks de memória do
     * WebView (problema conhecido em sessões longas de digital signage).
     */
    private val autoRestartTick = object : Runnable {
        override fun run() {
            if (System.currentTimeMillis() - startTime >= RELOAD_AFTER_MS) {
                Log.i(TAG, "auto-restart preventivo")
                recreate()
                return
            }
            main.postDelayed(this, 60_000)
        }
    }

    /**
     * Resolve o code (ex: "tv1") -> franchiseId + tvId, gravar em Prefs,
     * iniciar Heartbeat, e carregar a URL final na WebView.
     */
    private fun resolveAndLoad() {
        // Se já temos resolvido no Prefs, usa direto (rápido). Caso contrário, scan.
        val cachedFid = Prefs.getFranchiseId(this)
        val cachedTid = Prefs.getResolvedTvId(this)
        if (!cachedFid.isNullOrBlank() && !cachedTid.isNullOrBlank()) {
            franchiseId = cachedFid
            tvId = cachedTid
            Heartbeat.start(this, cachedFid, cachedTid)
            loadTvHtml(cachedFid, cachedTid)
            // Mesmo com cache, valida em background pra detectar code reassign
            io.execute { resolveFromShortcodes(silent = true) }
            return
        }
        io.execute { resolveFromShortcodes(silent = false) }
    }

    private fun resolveFromShortcodes(silent: Boolean) {
        val code = tvCode ?: return
        val franchisesRaw = CachedRepo.fetch(this, "franchises")
        if (franchisesRaw == null) {
            if (!silent) {
                showStatus("Sem conexão e sem cache. Tentando em 10s…")
                main.postDelayed({ resolveAndLoad() }, 10_000)
            }
            return
        }
        val franchises = try { JSONArray(franchisesRaw) } catch (_: Exception) { JSONArray() }
        var fid: String? = null
        var tid: String? = null
        for (i in 0 until franchises.length()) {
            val f = franchises.optJSONObject(i) ?: continue
            val cand = f.optString("id")
            val scRaw = CachedRepo.fetch(this, "tv_shortcodes_$cand") ?: continue
            val map = try { JSONObject(scRaw) } catch (_: Exception) { continue }
            val entry = map.optJSONObject(code) ?: continue
            val found = entry.optString("tvId")
            if (found.isNotBlank()) { fid = cand; tid = found; break }
        }
        if (fid == null || tid == null) {
            if (!silent) showStatus("Código \"$code\" não encontrado.")
            return
        }
        // Se já tava carregado com os mesmos IDs, nao recarrega
        if (silent && fid == franchiseId && tid == tvId) return
        franchiseId = fid
        tvId = tid
        Prefs.setResolved(this, fid, tid)
        Heartbeat.start(this, fid, tid)
        main.post { loadTvHtml(fid, tid) }
    }

    private fun loadTvHtml(fid: String, tid: String) {
        // Cache buster `t=` força fetch fresh do tv.html quando muda no servidor
        // (caso o SW da página esteja servindo stale).
        val cacheBuster = System.currentTimeMillis()
        val url = "$TV_HTML_URL?f=$fid&tv=$tid&t=$cacheBuster"
        Log.i(TAG, "Loading $url")
        webView.loadUrl(url)
    }

    // =============== Navigation: long-press BACK volta pro selector ===============
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

    override fun onResume() {
        super.onResume()
        goFullscreen()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        main.removeCallbacks(autoRestartTick)
        webView.stopLoading()
        webView.loadUrl("about:blank")
        webView.removeAllViews()
        webView.destroy()
        super.onDestroy()
    }
}
