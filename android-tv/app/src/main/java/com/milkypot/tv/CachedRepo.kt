package com.milkypot.tv

import android.content.Context
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Cache de leitura do Firestore.
 *
 * Estratégia offline-first:
 *   1. Tenta buscar do Firestore REST em até 8s.
 *   2. Se falhar (offline / timeout / erro), retorna o último valor cacheado.
 *   3. Se a requisição tiver sucesso, atualiza o cache.
 *
 * Guardamos em SharedPreferences. Cada documento = uma chave (`ck_<docId>`) com o JSON bruto.
 */
object CachedRepo {
    private const val TAG = "MilkyPotCachedRepo"
    private const val PREFS = "milkypot_tv_cache"
    private const val FIRESTORE_BASE =
        "https://firestore.googleapis.com/v1/projects/milkypot-ad945/databases/(default)/documents/datastore/"

    private val http = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    /**
     * Retorna o stringValue do doc/datastore/{docId}.
     * null = sem rede e sem cache.
     */
    fun fetch(context: Context, docId: String): String? {
        val fresh = tryRemote(docId)
        if (fresh != null) {
            saveCache(context, docId, fresh)
            return fresh
        }
        return readCache(context, docId)
    }

    private fun tryRemote(docId: String): String? {
        return try {
            val req = Request.Builder().url(FIRESTORE_BASE + docId).build()
            val r = http.newCall(req).execute()
            if (!r.isSuccessful) return null
            val body = r.body?.string() ?: return null
            val stringValue = Regex("\"stringValue\"\\s*:\\s*\"((?:\\\\\"|[^\"])*)\"")
                .find(body)?.groupValues?.getOrNull(1) ?: return null
            // Unescape JSON-in-JSON (aspas e barras)
            stringValue
                .replace("\\\\", "\\")
                .replace("\\\"", "\"")
                .replace("\\n", "\n")
                .replace("\\/", "/")
        } catch (e: Exception) {
            Log.w(TAG, "remote fetch failed for $docId: ${e.message}")
            null
        }
    }

    private fun readCache(context: Context, docId: String): String? {
        val cached = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString("ck_$docId", null)
        if (cached != null) Log.i(TAG, "serving $docId from cache (offline)")
        return cached
    }

    private fun saveCache(context: Context, docId: String, value: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString("ck_$docId", value).apply()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }

    /**
     * PATCH no Firestore pra enviar dados (usado pelo heartbeat).
     * Retorna true em sucesso. Silencioso em falha — heartbeat é best-effort.
     */
    fun writeRaw(docId: String, jsonBodyRaw: String): Boolean {
        return try {
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val body = jsonBodyRaw.toRequestBody(mediaType)
            val req = Request.Builder()
                .url(FIRESTORE_BASE + docId + "?updateMask.fieldPaths=value")
                .patch(body)
                .build()
            http.newCall(req).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            Log.w(TAG, "writeRaw failed for $docId: ${e.message}")
            false
        }
    }
}
