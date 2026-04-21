package com.milkypot.tv

import android.content.Context
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Contador simples de exibições por mídia. Acumula localmente em
 * SharedPreferences + enviam snapshot a cada 30min pro Firestore.
 *
 * Doc remoto:
 *   datastore/tv_analytics_{fid}_{tvId} =
 *     { "exhibitions": { "m_abc": 142, "m_def": 87 }, "syncedAt": "..." }
 */
object Analytics {
    private const val PREFS = "milkypot_tv_analytics"
    private val io = Executors.newSingleThreadScheduledExecutor()
    private var started = false

    fun recordPlay(context: Context, franchiseId: String?, mediaId: String) {
        if (mediaId.isBlank() || franchiseId.isNullOrBlank()) return
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val prev = prefs.getInt(mediaId, 0)
        prefs.edit().putInt(mediaId, prev + 1).apply()
        ensureUploader(context)
    }

    private fun ensureUploader(context: Context) {
        if (started) return
        started = true
        io.scheduleAtFixedRate({ uploadSnapshot(context) }, 1, 30, TimeUnit.MINUTES)
    }

    private fun uploadSnapshot(context: Context) {
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val map = prefs.all.mapNotNull { (k, v) -> (v as? Int)?.let { k to it } }
            if (map.isEmpty()) return
            val fid = Prefs.getFranchiseId(context) ?: return
            val tvId = Prefs.getResolvedTvId(context) ?: return

            val obj = JSONObject().apply {
                val exhibitions = JSONObject()
                map.forEach { (k, v) -> exhibitions.put(k, v) }
                put("exhibitions", exhibitions)
                put("syncedAt", java.time.Instant.now().toString())
            }
            val escaped = JSONObject.quote(obj.toString())
            val body = """
                { "fields": { "value": { "stringValue": $escaped } } }
            """.trimIndent()
            CachedRepo.writeRaw("tv_analytics_${fid}_${tvId}", body)
        } catch (_: Exception) {}
    }
}
