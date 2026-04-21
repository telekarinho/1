package com.milkypot.tv

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.FileProvider
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Verifica se ha versao mais nova do APK em milkypot.com/tv.apk e baixa.
 * Compara o Content-Length do servidor com o tamanho do APK instalado.
 * Se diferente, baixa e dispara o instalador (usuario confirma 1x).
 *
 * Roda a cada 6h.
 */
object AutoUpdater {
    private const val TAG = "MilkyPotAutoUpdater"
    private const val APK_URL = "https://milkypot.com/tv.apk"
    private const val CHECK_INTERVAL_HOURS = 6L

    private val io = Executors.newSingleThreadScheduledExecutor()
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.MINUTES)
        .build()

    private var running = false

    fun start(context: Context) {
        if (running) return
        running = true
        // Primeira checagem em 2min apos o boot
        io.schedule({ check(context) }, 2, TimeUnit.MINUTES)
        io.scheduleAtFixedRate({ check(context) }, CHECK_INTERVAL_HOURS, CHECK_INTERVAL_HOURS, TimeUnit.HOURS)
    }

    private fun check(context: Context) {
        try {
            val req = Request.Builder().url(APK_URL).head().build()
            val resp = http.newCall(req).execute()
            if (!resp.isSuccessful) { Log.w(TAG, "HEAD failed: ${resp.code}"); return }
            val remoteSize = resp.header("Content-Length")?.toLongOrNull() ?: return
            val localSize = installedApkSize(context) ?: -1L

            if (remoteSize == localSize) {
                Log.i(TAG, "APK up-to-date ($remoteSize bytes)")
                return
            }

            Log.i(TAG, "new APK detected (local=$localSize remote=$remoteSize). downloading…")
            downloadAndInstall(context, remoteSize)
        } catch (e: Exception) {
            Log.w(TAG, "check failed: ${e.message}")
        }
    }

    private fun installedApkSize(context: Context): Long? {
        return try {
            val info = context.packageManager.getApplicationInfo(context.packageName, 0)
            File(info.sourceDir).length()
        } catch (e: Exception) { null }
    }

    private fun downloadAndInstall(context: Context, expectedSize: Long) {
        try {
            val req = Request.Builder().url(APK_URL).build()
            val resp = http.newCall(req).execute()
            if (!resp.isSuccessful) { Log.w(TAG, "download failed ${resp.code}"); return }
            val body = resp.body ?: return
            val target = File(context.getExternalFilesDir(null), "milkypot-tv-update.apk")
            body.byteStream().use { input ->
                target.outputStream().use { out -> input.copyTo(out) }
            }
            if (expectedSize > 0 && target.length() != expectedSize) {
                Log.w(TAG, "download size mismatch: ${target.length()} vs $expectedSize")
                return
            }
            launchInstaller(context, target)
        } catch (e: Exception) {
            Log.w(TAG, "download/install failed: ${e.message}")
        }
    }

    private fun launchInstaller(context: Context, apkFile: File) {
        try {
            val uri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(
                    context, context.packageName + ".fileprovider", apkFile
                )
            } else {
                Uri.fromFile(apkFile)
            }
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(intent)
            Log.i(TAG, "installer launched")
        } catch (e: Exception) {
            Log.w(TAG, "installer launch failed: ${e.message}")
        }
    }
}
