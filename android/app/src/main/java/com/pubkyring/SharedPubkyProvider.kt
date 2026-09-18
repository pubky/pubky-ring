package to.pubkyring

import android.content.ContentProvider
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Binder

/** Read-only, signature-protected identity provider for the production Bitkit package. */
class SharedPubkyProvider : ContentProvider() {
  override fun onCreate(): Boolean = true

  override fun query(
    uri: Uri,
    projection: Array<out String>?,
    selection: String?,
    selectionArgs: Array<out String>?,
    sortOrder: String?,
  ): Cursor {
    enforceCaller()
    require(selection == null && selectionArgs == null && sortOrder == null) { "Unsupported query" }

    val providerContext = requireNotNull(context) { "Provider is unavailable" }
    require(uri.authority == "${providerContext.packageName}.sharedpubky") { "Unsupported authority" }
    val segments = uri.pathSegments
    return when {
      segments == listOf("v1", "identities") -> {
        val columns = validatedProjection(projection, SharedPubkyContract.PUBLIC_COLUMNS)
        MatrixCursor(columns).also { result ->
          SharedPubkyStore(providerContext).list().forEach { identity ->
            result.addRow(
              columns.map { column ->
                when (column) {
                  SharedPubkyContract.COLUMN_PROTOCOL_VERSION -> SharedPubkyContract.VERSION
                  SharedPubkyContract.COLUMN_SOURCE_PACKAGE ->
                    SharedPubkyContract.RING_SOURCE_PACKAGE
                  SharedPubkyContract.COLUMN_PUBKY -> identity.pubky
                  else -> error("Unsupported column")
                }
              },
            )
          }
        }
      }
      segments.size == 4 &&
        segments[0] == "v1" &&
        segments[1] == "identities" &&
        segments[3] == SharedPubkyContract.CREDENTIAL_SEGMENT -> {
        val pubky = segments[2]
        require(SharedPubkyContract.isValidPubky(pubky)) { "Invalid pubky" }
        val columns = validatedProjection(projection, SharedPubkyContract.CREDENTIAL_COLUMNS)
        MatrixCursor(columns).also { result ->
          SharedPubkyStore(providerContext).get(pubky)?.let { identity ->
            result.addRow(
              columns.map { column ->
                when (column) {
                  SharedPubkyContract.COLUMN_PROTOCOL_VERSION -> SharedPubkyContract.VERSION
                  SharedPubkyContract.COLUMN_SOURCE_PACKAGE ->
                    SharedPubkyContract.RING_SOURCE_PACKAGE
                  SharedPubkyContract.COLUMN_PUBKY -> identity.pubky
                  SharedPubkyContract.COLUMN_SECRET_KEY -> identity.secretKey
                  else -> error("Unsupported column")
                }
              },
            )
          }
        }
      }
      else -> throw IllegalArgumentException("Unsupported URI")
    }
  }

  private fun enforceCaller() {
    val providerContext = context ?: throw SecurityException("Provider is unavailable")
    val allowedPackages =
      if (BuildConfig.DEBUG) DEBUG_BITKIT_PACKAGES else setOf(PRODUCTION_BITKIT_PACKAGE)
    val caller = callingPackage
    val callingUidPackages = providerContext.packageManager.getPackagesForUid(Binder.getCallingUid())
    if (
      caller !in allowedPackages ||
        callingUidPackages == null ||
        caller !in callingUidPackages ||
        providerContext.packageManager.checkSignatures(providerContext.packageName, caller!!) !=
          PackageManager.SIGNATURE_MATCH
    ) {
      throw SecurityException("Caller is not authorized")
    }
  }

  private fun validatedProjection(
    projection: Array<out String>?,
    allowed: Array<String>,
  ): Array<String> {
    val requested = projection?.map { it.trim() }?.toTypedArray() ?: allowed
    require(requested.isNotEmpty() && requested.distinct().size == requested.size) {
      "Invalid projection"
    }
    require(requested.all { it in allowed }) { "Unsupported projection" }
    return requested
  }

  override fun getType(uri: Uri): String {
    enforceCaller()
    return "vnd.android.cursor.dir/vnd.pubkyring.shared-pubky"
  }

  override fun insert(uri: Uri, values: ContentValues?): Uri? =
    rejectWrite()

  override fun update(
    uri: Uri,
    values: ContentValues?,
    selection: String?,
    selectionArgs: Array<out String>?,
  ): Int = rejectWrite()

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int =
    rejectWrite()

  private fun <T> rejectWrite(): T {
    enforceCaller()
    throw UnsupportedOperationException("Provider is read-only")
  }

  companion object {
    private const val PRODUCTION_BITKIT_PACKAGE = "to.bitkit"
    private val DEBUG_BITKIT_PACKAGES =
      setOf(PRODUCTION_BITKIT_PACKAGE, "to.bitkit.dev", "to.bitkit.tnet")
  }
}
