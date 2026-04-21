package com.milkypot.tv

import org.json.JSONObject
import java.util.Calendar

/**
 * Lê openHour / closeHour do tv_config da franquia e decide se a loja
 * está aberta agora. Formato aceito:
 *   { "openHour": 8, "closeHour": 22 }        // simples: abre 8h, fecha 22h
 *   { "openHour": 8, "closeHour": 22, "openDays": [1,2,3,4,5,6] } // seg-sab
 *
 * Se campos ausentes, assume sempre aberto (comportamento legado).
 */
object Schedule {
    data class Status(val open: Boolean, val reason: String)

    fun isOpenNow(config: JSONObject): Status {
        val now = Calendar.getInstance()
        val hour = now.get(Calendar.HOUR_OF_DAY)
        val minute = now.get(Calendar.MINUTE)
        val weekDay = now.get(Calendar.DAY_OF_WEEK) // 1=dom...7=sab

        // Dias permitidos (opcional)
        val openDaysArr = config.optJSONArray("openDays")
        if (openDaysArr != null && openDaysArr.length() > 0) {
            var found = false
            for (i in 0 until openDaysArr.length()) {
                if (openDaysArr.optInt(i) == weekDay) { found = true; break }
            }
            if (!found) return Status(false, "Fechado hoje. Volte amanhã!")
        }

        val openHour = config.optInt("openHour", -1)
        val closeHour = config.optInt("closeHour", -1)
        if (openHour < 0 || closeHour < 0) {
            return Status(true, "") // sem config = sempre aberto
        }

        val hourF = hour + (minute / 60.0)
        // Suporta janela virada (ex: 18h → 02h do dia seguinte)
        val isOpen = if (closeHour > openHour) {
            hourF in openHour.toDouble()..closeHour.toDouble()
        } else {
            hourF >= openHour || hourF < closeHour
        }

        if (isOpen) return Status(true, "")
        return Status(false, "Fechado. Abrimos às ${padHour(openHour)}")
    }

    private fun padHour(h: Int): String = "${h.toString().padStart(2, '0')}h"
}
