package com.milkypot.tv

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * Belinha AI em modo tablet/kiosk Android.
 * Abre milkypot.com/painel/copilot-belinha.html?kiosk=1 em WebView fullscreen.
 *
 * Offline: o copiloto-belinha.html tem DataStore local; perguntas ficam
 * em queue até a internet voltar. Isso é híbrido PC+Android:
 *   - Online: chama localhost:5757 (se .bat rodando na rede) ou API Anthropic
 *   - Offline: fica em queue, mostra alerta, tenta de novo ao reconectar
 *
 * Long-press BACK: volta pro selector.
 */
class BelinhaActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        fullscreen()

        webView = WebView(this).apply {
            setBackgroundColor(0xFFF9FAFB.toInt())
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                loadWithOverviewMode = true
                useWideViewPort = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                databaseEnabled = true
                userAgentString = "MilkyPotAPK/1.7 " + userAgentString
            }
            webViewClient = object : WebViewClient() {
                override fun onReceivedError(v: WebView?, errorCode: Int, desc: String?, failingUrl: String?) {
                    loadDataWithBaseURL(null,
                        "<html><body style='background:#F9FAFB;color:#1F2937;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:40px'>" +
                        "<div><h1 style='font-size:36px;margin:0'>🐑 Belinha AI</h1>" +
                        "<p style='font-size:18px;margin-top:16px'>Sem conexão. Reconectando em 15s…</p></div>" +
                        "</body></html>",
                        "text/html", "UTF-8", null
                    )
                    v?.postDelayed({ v.loadUrl(BELINHA_URL) }, 15000)
                }
            }
        }
        setContentView(webView)
        webView.loadUrl(BELINHA_URL)
    }

    private fun fullscreen() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
    }

    override fun onResume() { super.onResume(); fullscreen() }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Clique curto: volta no WebView. Long-press: sai pro selector.
            event?.startTracking()
            if (webView.canGoBack()) { webView.goBack(); return true }
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            val i = Intent(this, SelectorActivity::class.java)
            i.putExtra("reset", true)
            i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            startActivity(i); finish()
            return true
        }
        return super.onKeyLongPress(keyCode, event)
    }

    override fun onDestroy() {
        try { webView.destroy() } catch(_:Exception){}
        super.onDestroy()
    }

    companion object {
        private const val BELINHA_URL = "https://milkypot.com/painel/copilot-belinha.html?kiosk=1"
    }
}
