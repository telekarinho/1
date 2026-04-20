package com.milkypot.tv

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Abre o app automaticamente quando a TV liga.
 * Escuta BOOT_COMPLETED + variantes (QuickBoot em TVs chinesas, HTC).
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.i("MilkyPotBoot", "onReceive action=$action")
        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_LOCKED_BOOT_COMPLETED -> {
                val launch = Intent(context, SelectorActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                try {
                    context.startActivity(launch)
                    Log.i("MilkyPotBoot", "SelectorActivity iniciada pelo BootReceiver")
                } catch (e: Exception) {
                    Log.w("MilkyPotBoot", "Falha ao iniciar app no boot: ${e.message}")
                }
            }
        }
    }
}
