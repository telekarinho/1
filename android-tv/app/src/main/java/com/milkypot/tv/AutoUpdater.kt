package com.milkypot.tv

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
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
 *
 * Update SILENCIOSO via PackageInstaller (Android 12+):
 *   - Primeira instalacao: usuario precisa confirmar UMA vez (politica do
 *     Android, nao tem como pular sem ser system app).
 *   - Apos isso, com setRequestUpdateOwnership(true), updates futuros do mesmo
 *     pacote (mesma assinatura) instalam sem dialogo nenhum.
 *
 * Fallback para Android < 12: dispara o instalador via Intent.ACTION_VIEW
 * (mostra dialogo). Mesmo assim, o usuario so confirma uma vez se a fonte
 * ja foi liberada em "Fontes desconhecidas".
 *
 * Roda a cada 1h + ja no boot (2 min depois).
 */
object AutoUpdater {
    private const val TAG = "MilkyPotAutoUpdater"
    private const val APK_URL = "https://milkypot.com/tv.apk"
    private const val CHECK_INTERVAL_HOURS = 1L
    private const val INSTALL_RESULT_ACTION = "com.milkypot.tv.INSTALL_RESULT"

    private val io = Executors.newSingleThreadScheduledExecutor()
    private val http = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.MINUTES)
        .build()

    private var running = false
    private var resultReceiverRegistered = false

    fun start(context: Context) {
        if (running) return
        running = true
        registerInstallResultReceiver(context.applicationContext)
        // Primeira checagem em 2min apos o boot
        io.schedule({ check(context.applicationContext) }, 2, TimeUnit.MINUTES)
        io.scheduleAtFixedRate(
            { check(context.applicationContext) },
            CHECK_INTERVAL_HOURS, CHECK_INTERVAL_HOURS, TimeUnit.HOURS
        )
    }

    private fun registerInstallResultReceiver(context: Context) {
        if (resultReceiverRegistered) return
        try {
            val filter = IntentFilter(INSTALL_RESULT_ACTION)
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(c: Context?, intent: Intent?) {
                    val status = intent?.getIntExtra(PackageInstaller.EXTRA_STATUS, -999) ?: -999
                    val msg = intent?.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)
                    when (status) {
                        PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                            // Primeira instalacao: precisa abrir tela de confirmacao
                            val confirm = intent.getParcelableExtra<Intent>(Intent.EXTRA_INTENT)
                            confirm?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            try { context.startActivity(confirm) } catch (_: Exception) {}
                        }
                        PackageInstaller.STATUS_SUCCESS -> Log.i(TAG, "install OK")
                        else -> Log.w(TAG, "install status=$status msg=$msg")
                    }
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                context.registerReceiver(receiver, filter)
            }
            resultReceiverRegistered = true
        } catch (e: Exception) {
            Log.w(TAG, "register receiver failed: ${e.message}")
        }
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
            installViaPackageInstaller(context, target)
        } catch (e: Exception) {
            Log.w(TAG, "download/install failed: ${e.message}")
        }
    }

    /**
     * Instala via PackageInstaller. Em Android 12+ com setRequestUpdateOwnership(true),
     * apos o primeiro install confirmado, updates seguintes sao silenciosos.
     * Falha → fallback pra Intent.ACTION_VIEW.
     */
    private fun installViaPackageInstaller(context: Context, apkFile: File) {
        try {
            val installer = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(
                PackageInstaller.SessionParams.MODE_FULL_INSTALL
            )
            // Mantem mesmo nome de pacote
            params.setAppPackageName(context.packageName)
            // Android 12+ — reivindica que so este app pode atualizar a si mesmo,
            // permitindo updates silenciosos no futuro.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try {
                    params.javaClass
                        .getMethod("setRequestUpdateOwnership", Boolean::class.javaPrimitiveType)
                        .invoke(params, true)
                } catch (_: Throwable) {}
            }

            val sessionId = installer.createSession(params)
            installer.openSession(sessionId).use { session ->
                apkFile.inputStream().use { input ->
                    session.openWrite("milkypot-update", 0, apkFile.length()).use { output ->
                        input.copyTo(output)
                        session.fsync(output)
                    }
                }

                val intent = Intent(INSTALL_RESULT_ACTION).setPackage(context.packageName)
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
                else PendingIntent.FLAG_UPDATE_CURRENT
                val pending = PendingIntent.getBroadcast(context, sessionId, intent, flags)
                session.commit(pending.intentSender)
            }
            Log.i(TAG, "PackageInstaller commit OK (session=$sessionId)")
        } catch (e: Exception) {
            Log.w(TAG, "PackageInstaller failed: ${e.message} — fallback Intent")
            launchInstallerFallback(context, apkFile)
        }
    }

    private fun launchInstallerFallback(context: Context, apkFile: File) {
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
            Log.i(TAG, "fallback installer launched")
        } catch (e: Exception) {
            Log.w(TAG, "installer launch failed: ${e.message}")
        }
    }
}
