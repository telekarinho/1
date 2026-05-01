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
 * TV dedicada ao Desafio MilkyPot. Abre milkypot.com/desafio.html em
 * WebView fullscreen com hardware acceleration + cache agressivo.
 * Offline funciona porque desafio.html tem Service Worker (sw-desafio.js).
 *
 * Long-press BACK → volta pro SelectorActivity.
 */
class ChallengeActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        fullscreen()

        webView = WebView(this).apply {
            setBackgroundColor(0xFF0F0C29.toInt())
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                loadWithOverviewMode = true
                useWideViewPort = true
                cacheMode = WebSettings.LOAD_DEFAULT    // usa SW cache
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                databaseEnabled = true
            }
            webViewClient = object : WebViewClient() {
                override fun onReceivedError(v: WebView?, errorCode: Int, desc: String?, failingUrl: String?) {
                    // Offline: o SW deve servir do cache. Se nada existir, exibe mensagem leve.
                    loadDataWithBaseURL(null,
                        "<html><body style='background:#0F0C29;color:#FFF;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center'>"+
                        "<div><h1 style='font-size:40px;margin:0'>🎯 Desafio MilkyPot</h1>"+
                        "<p style='opacity:.7;margin-top:16px'>Sem conexão e sem cache. Reconectando em 15s…</p></div>"+
                        "</body></html>",
                        "text/html", "UTF-8", null
                    )
                    v?.postDelayed({ v.loadUrl(CHALLENGE_URL) }, 15000)
                }
            }
        }
        setContentView(webView)
        webView.loadUrl(CHALLENGE_URL)
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
        if (keyCode == KeyEvent.KEYCODE_BACK) { event?.startTracking(); return true }
        return super.onKeyDown(keyCode, event)
    }
    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Reset: volta pro selector
            Prefs.setChallengeMode(this, false)
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
        private const val CHALLENGE_URL = "https://milkypot.com/desafio.html?kiosk=1"
    }
}
