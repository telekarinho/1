package com.milkypot.tv

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import java.io.File

/**
 * Cache de vídeo em disco pra playback offline.
 *
 * Funciona assim:
 *   - Primeira vez que o vídeo toca online, os chunks vão sendo gravados em
 *     filesDir/media_cache (até 500 MB — LRU).
 *   - Se a internet cair no meio, o player continua lendo do cache sem piscar.
 *   - Próxima abertura do app: se estiver offline, ExoPlayer lê 100% do cache.
 */
@OptIn(UnstableApi::class)
object OfflineCache {
    private const val MAX_CACHE_BYTES = 500L * 1024L * 1024L // 500 MB

    @Volatile private var cache: SimpleCache? = null

    fun get(context: Context): SimpleCache {
        val existing = cache
        if (existing != null) return existing
        synchronized(this) {
            val again = cache
            if (again != null) return again
            val dir = File(context.filesDir, "media_cache").apply { mkdirs() }
            val evictor = LeastRecentlyUsedCacheEvictor(MAX_CACHE_BYTES)
            val db = StandaloneDatabaseProvider(context.applicationContext)
            val made = SimpleCache(dir, evictor, db)
            cache = made
            return made
        }
    }

    fun mediaSourceFactory(context: Context): DefaultMediaSourceFactory {
        val simple = get(context)
        val upstream = DefaultHttpDataSource.Factory()
            .setUserAgent("MilkyPotTV/1.0")
            .setConnectTimeoutMs(15000)
            .setReadTimeoutMs(30000)
            .setAllowCrossProtocolRedirects(true)
        val cacheFactory = CacheDataSource.Factory()
            .setCache(simple)
            .setUpstreamDataSourceFactory(DefaultDataSource.Factory(context, upstream))
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        return DefaultMediaSourceFactory(cacheFactory)
    }

    fun sizeBytes(context: Context): Long = try {
        get(context).cacheSpace
    } catch (e: Exception) { 0L }

    fun clear(context: Context) {
        try {
            val simple = cache ?: return
            simple.release()
            cache = null
            File(context.filesDir, "media_cache").deleteRecursively()
        } catch (_: Exception) {}
    }
}
