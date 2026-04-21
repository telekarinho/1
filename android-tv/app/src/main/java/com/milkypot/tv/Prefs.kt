package com.milkypot.tv

import android.content.Context

object Prefs {
    private const val NAME = "milkypot_tv"
    private const val KEY_CODE = "tv_code"
    private const val KEY_FID = "franchise_id"
    private const val KEY_TVID = "tv_id_resolved"

    private fun p(c: Context) = c.getSharedPreferences(NAME, Context.MODE_PRIVATE)

    fun getTvCode(c: Context): String? = p(c).getString(KEY_CODE, null)
    fun setTvCode(c: Context, code: String) { p(c).edit().putString(KEY_CODE, code).apply() }
    fun clearTvCode(c: Context) { p(c).edit().remove(KEY_CODE).apply() }

    fun setResolved(c: Context, fid: String, tvId: String) {
        p(c).edit().putString(KEY_FID, fid).putString(KEY_TVID, tvId).apply()
    }
    fun getFranchiseId(c: Context): String? = p(c).getString(KEY_FID, null)
    fun getResolvedTvId(c: Context): String? = p(c).getString(KEY_TVID, null)
}
