package com.milkypot.tv

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Primeira tela do app. Se o usuário já escolheu uma TV antes,
 * pula direto pro PlayerActivity. Senão mostra botões TV1/TV2/TV3
 * e campo pra código custom.
 */
class SelectorActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen + keep screen on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )

        // Se já configurou, pula direto ao player (a menos que usuario peca reset via long-press)
        val savedCode = Prefs.getTvCode(this)
        val forceSelect = intent.getBooleanExtra("reset", false)
        if (!savedCode.isNullOrBlank() && !forceSelect) {
            startPlayer(savedCode)
            finish()
            return
        }

        setContentView(R.layout.activity_selector)

        findViewById<Button>(R.id.btnTv1).setOnClickListener { pick("tv1") }
        findViewById<Button>(R.id.btnTv2).setOnClickListener { pick("tv2") }
        findViewById<Button>(R.id.btnTv3).setOnClickListener { pick("tv3") }

        val customEdit = findViewById<EditText>(R.id.customCode)
        findViewById<Button>(R.id.btnCustom).setOnClickListener {
            val v = customEdit.text.toString().trim().lowercase()
            if (v.isNotBlank()) pick(v)
        }
    }

    private fun pick(code: String) {
        Prefs.setTvCode(this, code)
        startPlayer(code)
        finish()
    }

    private fun startPlayer(code: String) {
        val intent = Intent(this, PlayerActivity::class.java)
        intent.putExtra("code", code)
        startActivity(intent)
    }
}
