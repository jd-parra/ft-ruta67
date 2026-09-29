package expo.modules.pasajehce

import android.util.Base64

/**
 * Estado compartido entre el módulo (lo llama JS) y el servicio HCE (lo crea Android aparte).
 * Vive solo en memoria: la pantalla Pagar lo vuelve a cargar cada vez que se abre.
 */
internal object EstadoHce {
  // Contrato 8.1: [version:1][bid:16][uid:16][categoria:1][montoReservado:4][expira:4][firma:64]
  const val LARGO_BOLETO = 106
  private const val INICIO_BID = 1
  private const val INICIO_EXPIRA = 38

  private const val FLAGS_B64 = Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP

  private val lock = Any()
  private val boletos = ArrayDeque<ByteArray>()
  private val recibos = mutableListOf<Map<String, Any>>()
  private var frecuentes: Map<Int, Int> = emptyMap()

  /** Solo con la pantalla Pagar abierta (contrato 9). */
  @Volatile
  var activo = false

  /** Avisa a JS que llegó un recibo (evento «onRecibo»). */
  @Volatile
  var alRecibir: (() -> Unit)? = null

  fun setBoletos(raws: List<String>) {
    val decodificados = raws.mapNotNull { raw ->
      runCatching { Base64.decode(raw, FLAGS_B64) }.getOrNull()?.takeIf { it.size == LARGO_BOLETO }
    }
    synchronized(lock) {
      boletos.clear()
      boletos.addAll(decodificados)
    }
  }

  /** { lineaCodigo: tramoCodigo } con el tramo más frecuente del pasajero en cada línea. */
  fun setFrecuentes(f: Map<String, Double>) {
    frecuentes = f.mapNotNull { (linea, tramo) -> linea.toIntOrNull()?.let { it to tramo.toInt() } }.toMap()
  }

  fun tramoSugerido(lineaCodigo: Int): Int = frecuentes[lineaCodigo] ?: 0

  /**
   * Siguiente boleto vigente. Se manda al final de la cola: si el RECIBO no llega (se separaron
   * los teléfonos), el próximo toque ofrece otro boleto en vez de repetir uno que ya se cobró.
   */
  fun ofrecerBoleto(ahoraSeg: Long): ByteArray? {
    synchronized(lock) {
      repeat(boletos.size) {
        val b = boletos.removeFirst()
        boletos.addLast(b)
        if (leerU32(b, INICIO_EXPIRA) > ahoraSeg) return b
      }
      return null
    }
  }

  /** Paso 3: guarda el recibo y retira el boleto usado. false si el bid no es de un boleto de este teléfono. */
  fun registrarRecibo(bid: ByteArray, lineaCodigo: Int, unidadCodigo: Int, tramoCodigo: Int, monto: Long, ocurridoSeg: Long): Boolean {
    synchronized(lock) {
      val i = boletos.indexOfFirst { it.copyOfRange(INICIO_BID, INICIO_BID + 16).contentEquals(bid) }
      if (i < 0) return false
      boletos.removeAt(i)
      // Mismas claves que ReciboNativo (nucleo/hce/PasajeHce.ts).
      recibos.add(
        mapOf(
          "bid" to Base64.encodeToString(bid, FLAGS_B64),
          "lineaCodigo" to lineaCodigo,
          "unidadCodigo" to unidadCodigo,
          "tramoCodigo" to tramoCodigo,
          "monto" to monto.toDouble(),
          "ocurridoEn" to ocurridoSeg.toDouble(),
        )
      )
    }
    alRecibir?.invoke()
    return true
  }

  fun drenarRecibos(): List<Map<String, Any>> {
    synchronized(lock) {
      val copia = recibos.toList()
      recibos.clear()
      return copia
    }
  }

  fun leerU16(b: ByteArray, i: Int): Int =
    ((b[i].toInt() and 0xff) shl 8) or (b[i + 1].toInt() and 0xff)

  fun leerU32(b: ByteArray, i: Int): Long =
    ((b[i].toLong() and 0xff) shl 24) or ((b[i + 1].toLong() and 0xff) shl 16) or
      ((b[i + 2].toLong() and 0xff) shl 8) or (b[i + 3].toLong() and 0xff)
}
