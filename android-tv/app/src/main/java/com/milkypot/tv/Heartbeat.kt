package com.milkypot.tv

import android.content.Context
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Envia um ping pro Firestore com status/versão/last-seen a cada 5min.
 * Doc: datastore/tv_heartbeat_{franchiseId}_{tvId}
 *
 * Valor JSON armazenado:
 *   {
 *     "online": true,
 *     "lastSeen": "2026-04-20T12:34:00Z",
 *     "version": "1.2.0",
 *     "device": "ChromeCast NS.TV",
 *     "cacheMB": 134.2,
 *     "network": "wifi",
 *     "playing": "m_abc123"
 *   }
 */
object Heartbeat {
    private const val TAG = "MilkyPotHeartbeat"
    private val io = Executors.newSingleThreadScheduledExecutor()

    private var running = false
    private var fid: String? = null
    private var tvId: String? = null
    private var currentlyPlayingId: String? = null

    fun start(context: Context, franchiseId: String, tvId: String) {
        this.fid = franchiseId
        this.tvId = tvId
        if (running) return
        running = true
        // Envia já o primeiro, depois agenda a cada 5min
        io.schedule({ send(context) }, 10, TimeUnit.SECONDS)
        io.scheduleAtFixedRate({ send(context) }, 5, 5, TimeUnit.MINUTES)
    }

    fun setNowPlaying(mediaId: String?) {
        currentlyPlayingId = mediaId
    }

    private fun send(context: Context) {
        val f = fid ?: return
        val t = tvId ?: return
        try {
            val payload = JSONObject().apply {
                put("online", true)
                put("lastSeen", java.time.Instant.now().toString())
                put("version", "1.2.0")
                put("device", Build.MANUFACTURER + " " + Build.MODEL)
                put("sdk", Build.VERSION.SDK_INT)
                put("cacheMB", "%.1f".format(OfflineCache.sizeBytes(context) / (1024.0 * 1024.0)))
                put("playing", currentlyPlayingId ?: "")
            }

            // Envelope Firestore REST: fields.value.stringValue = <json-escapado>
            val escaped = JSONObject.quote(payload.toString())
            val body = """
                {
                  "fields": {
                    "value": { "stringValue": $escaped }
                  }
                }
            """.trimIndent()

            val docId = "tv_heartbeat_${f}_${t}"
            val ok = CachedRepo.writeRaw(docId, body)
            if (ok) Log.i(TAG, "heartbeat ok $docId")
        } catch (e: Exception) {
            Log.w(TAG, "heartbeat failed: ${e.message}")
        }
    }
}
