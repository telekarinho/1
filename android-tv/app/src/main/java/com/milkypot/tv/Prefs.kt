package com.milkypot.tv

import android.content.Context

object Prefs {
    private const val NAME = "milkypot_tv"
    private const val KEY_CODE = "tv_code"

    fun getTvCode(c: Context): String? =
        c.getSharedPreferences(NAME, Context.MODE_PRIVATE).getString(KEY_CODE, null)

    fun setTvCode(c: Context, code: String) {
        c.getSharedPreferences(NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_CODE, code).apply()
    }

    fun clearTvCode(c: Context) {
        c.getSharedPreferences(NAME, Context.MODE_PRIVATE).edit().remove(KEY_CODE).apply()
    }
}
