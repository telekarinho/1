package com.milkypot.tv

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

/**
 * Primeira tela do app. Se o usuário já escolheu um modo antes,
 * pula direto pra Activity correspondente (PlayerActivity pras TVs normais
 * ou ChallengeActivity pra TV do Desafio). Senão mostra os modos.
 */
class SelectorActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )

        val forceSelect = intent.getBooleanExtra("reset", false)
        if (!forceSelect) {
            // Modo desafio salvo?
            if (Prefs.isChallengeMode(this)) { startChallenge(); finish(); return }
            // Código de TV salvo?
            val savedCode = Prefs.getTvCode(this)
            if (!savedCode.isNullOrBlank()) { startPlayer(savedCode); finish(); return }
        }

        setContentView(R.layout.activity_selector)

        findViewById<Button>(R.id.btnTv1).setOnClickListener { pickTv("tv1") }
        findViewById<Button>(R.id.btnTv2).setOnClickListener { pickTv("tv2") }
        findViewById<Button>(R.id.btnTv3).setOnClickListener { pickTv("tv3") }

        // Botão especial: TV dedicada ao Desafio
        findViewById<Button>(R.id.btnChallenge)?.setOnClickListener { pickChallenge() }

        val customEdit = findViewById<EditText>(R.id.customCode)
        findViewById<Button>(R.id.btnCustom).setOnClickListener {
            val v = customEdit.text.toString().trim().lowercase()
            if (v.isNotBlank()) pickTv(v)
        }
    }

    private fun pickTv(code: String) {
        Prefs.setChallengeMode(this, false)
        Prefs.setTvCode(this, code)
        startPlayer(code)
        finish()
    }

    private fun pickChallenge() {
        Prefs.setChallengeMode(this, true)
        Prefs.clearTvCode(this)
        startChallenge()
        finish()
    }

    private fun startPlayer(code: String) {
        val i = Intent(this, PlayerActivity::class.java)
        i.putExtra("code", code)
        startActivity(i)
    }

    private fun startChallenge() {
        startActivity(Intent(this, ChallengeActivity::class.java))
    }
}
