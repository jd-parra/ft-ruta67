package expo.modules.pasajehce

import android.content.pm.PackageManager
import android.nfc.NfcAdapter
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Lado JS del HCE. Interfaz en nucleo/hce/PasajeHce.ts; la usa nucleo/hce/servicioPago.ts. */
class PasajeHceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PasajeHce")

    Events("onRecibo")

    OnCreate {
      EstadoHce.alRecibir = { sendEvent("onRecibo", emptyMap<String, Any>()) }
    }

    OnDestroy {
      EstadoHce.alRecibir = null
      EstadoHce.activo = false
    }

    Function("soportado") {
      soportado()
    }

    Function("setBoletos") { boletos: List<String> ->
      EstadoHce.setBoletos(boletos)
    }

    Function("setFrecuentes") { frecuentes: Map<String, Double> ->
      EstadoHce.setFrecuentes(frecuentes)
    }

    Function("setActivo") { activo: Boolean ->
      EstadoHce.activo = activo
    }

    Function("drenarRecibos") {
      EstadoHce.drenarRecibos()
    }
  }

  /** El teléfono tiene NFC y puede emular una tarjeta (HCE). */
  private fun soportado(): Boolean {
    val contexto = appContext.reactContext ?: return false
    return contexto.packageManager.hasSystemFeature(PackageManager.FEATURE_NFC_HOST_CARD_EMULATION) &&
      NfcAdapter.getDefaultAdapter(contexto) != null
  }
}
