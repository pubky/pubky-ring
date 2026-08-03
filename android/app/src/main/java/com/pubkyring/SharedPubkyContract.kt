package to.pubkyring

/** Wire contract shared by Pubky Ring and Bitkit. */
object SharedPubkyContract {
  const val VERSION = 1
  const val RING_SOURCE_PACKAGE = "app.pubkyring"
  const val BITKIT_SOURCE_PACKAGE = "to.bitkit"
  const val IDENTITIES_PATH = "v1/identities"
  const val CREDENTIAL_SEGMENT = "credential"

  const val COLUMN_PROTOCOL_VERSION = "protocol_version"
  const val COLUMN_SOURCE_PACKAGE = "source_package"
  const val COLUMN_PUBKY = "pubky"
  const val COLUMN_SECRET_KEY = "secret_key"

  val PUBLIC_COLUMNS =
    arrayOf(COLUMN_PROTOCOL_VERSION, COLUMN_SOURCE_PACKAGE, COLUMN_PUBKY)
  val CREDENTIAL_COLUMNS =
    arrayOf(COLUMN_PROTOCOL_VERSION, COLUMN_SOURCE_PACKAGE, COLUMN_PUBKY, COLUMN_SECRET_KEY)

  private val PUBKY_PATTERN = Regex("^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}$")
  private val SECRET_KEY_PATTERN = Regex("^[0-9a-f]{64}$")

  /** Canonical wire values are always the bare, lowercase 52-character z-base32 key. */
  fun normalizePubky(value: String): String? {
    val trimmed = value.trim()
    if (isValidPubky(trimmed)) return trimmed
    val raw =
      if (trimmed.length == 57 && trimmed.startsWith("pubky")) {
        trimmed.removePrefix("pubky")
      } else {
        return null
      }
    return raw.takeIf(::isValidPubky)
  }

  fun isValidPubky(pubky: String): Boolean = PUBKY_PATTERN.matches(pubky)

  fun isValidSecretKey(secretKey: String): Boolean = SECRET_KEY_PATTERN.matches(secretKey)
}
