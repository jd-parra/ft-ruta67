package expo.modules.pasajehce

import android.nfc.cardemulation.HostApduService
import android.os.Bundle

/**
 * Tarjeta emulada del pasajero, protocolo NFC v2 (contrato sección 9).
 * La contraparte es nucleo/nfc/apdu.ts + ejecutarCobro.ts en el teléfono del recolector.
 *
 *   1. SELECT        00 A4 04 00 07 [AID] 00                          → 90 00
 *   2. PEDIR_BOLETO  80 10 00 00 04 [linea:2][unidad:2]               → [boleto:106][tramoSugerido:2] 90 00 · sin boletos: 6A 82
 *   3. RECIBO        80 20 00 00 1A [bid:16][tramo:2][monto:4][seg:4] → 90 00
 */
class PasajeHceService : HostApduService() {
  // Un toque = una sesión: se reinicia al separar los teléfonos (onDeactivated).
  private var seleccionado = false
  private var lineaCodigo = -1
  private var unidadCodigo = -1
  private var bidOfrecido: ByteArray? = null

  // Mismas respuestas que el pasajero simulado de nucleo/nfc/ejecutarCobro.test.ts.
  override fun processCommandApdu(apdu: ByteArray, extras: Bundle?): ByteArray {
    // Fuera de la pantalla Pagar no se responde: nadie puede cobrar acercando un lector en la cola.
    if (!EstadoHce.activo) return SW_DESCONOCIDO
    if (apdu.size < 4) return SW_DESCONOCIDO
    val cla = apdu[0].toInt() and 0xff
    val ins = apdu[1].toInt() and 0xff
    return when {
      cla == 0x00 && ins == 0xa4 -> seleccionar(apdu)
      !seleccionado -> SW_NO_SELECCIONADO
      cla == 0x80 && ins == 0x10 -> pedirBoleto(apdu)
      cla == 0x80 && ins == 0x20 -> recibo(apdu)
      else -> SW_DESCONOCIDO
    }
  }

  override fun onDeactivated(reason: Int) {
    seleccionado = false
    lineaCodigo = -1
    unidadCodigo = -1
    bidOfrecido = null
  }

  private fun seleccionar(apdu: ByteArray): ByteArray {
    val datos = datosDe(apdu) ?: return SW_DESCONOCIDO
    if ((apdu[2].toInt() and 0xff) != 0x04 || !datos.contentEquals(AID)) return SW_DESCONOCIDO
    seleccionado = true
    return SW_OK
  }

  private fun pedirBoleto(apdu: ByteArray): ByteArray {
    val datos = datosDe(apdu)?.takeIf { it.size == 4 } ?: return SW_DATOS_INVALIDOS
    lineaCodigo = EstadoHce.leerU16(datos, 0)
    unidadCodigo = EstadoHce.leerU16(datos, 2)

    val boleto = EstadoHce.ofrecerBoleto(System.currentTimeMillis() / 1000) ?: return SW_SIN_BOLETOS
    bidOfrecido = boleto.copyOfRange(1, 17)
    val tramo = EstadoHce.tramoSugerido(lineaCodigo)
    return boleto + byteArrayOf((tramo shr 8).toByte(), tramo.toByte()) + SW_OK
  }

  private fun recibo(apdu: ByteArray): ByteArray {
    val datos = datosDe(apdu)?.takeIf { it.size == 26 } ?: return SW_DATOS_INVALIDOS
    // Solo vale el recibo del boleto que se ofreció en este mismo toque.
    val bid = datos.copyOfRange(0, 16)
    if (bidOfrecido?.contentEquals(bid) != true) return SW_DATOS_INVALIDOS

    val ok = EstadoHce.registrarRecibo(
      bid = bid,
      lineaCodigo = lineaCodigo,
      unidadCodigo = unidadCodigo,
      tramoCodigo = EstadoHce.leerU16(datos, 16),
      monto = EstadoHce.leerU32(datos, 18),
      ocurridoSeg = EstadoHce.leerU32(datos, 22),
    )
    return if (ok) SW_OK else SW_DATOS_INVALIDOS
  }

  /** Datos del comando (Lc bytes a partir del índice 5), o null si el APDU viene truncado. */
  private fun datosDe(apdu: ByteArray): ByteArray? {
    if (apdu.size < 5) return null
    val lc = apdu[4].toInt() and 0xff
    if (apdu.size < 5 + lc) return null
    return apdu.copyOfRange(5, 5 + lc)
  }

  private companion object {
    val AID = byteArrayOf(0xF0.toByte(), 0x50, 0x41, 0x53, 0x45, 0x00, 0x02)

    val SW_OK = byteArrayOf(0x90.toByte(), 0x00)
    val SW_SIN_BOLETOS = byteArrayOf(0x6A, 0x82.toByte())
    val SW_DESCONOCIDO = byteArrayOf(0x6D, 0x00)
    // Fuera del contrato; el recolector trata cualquier SW distinto de 90 00 como error.
    val SW_NO_SELECCIONADO = byteArrayOf(0x69, 0x85.toByte()) // condiciones no cumplidas
    val SW_DATOS_INVALIDOS = byteArrayOf(0x6A, 0x80.toByte())
  }
}
