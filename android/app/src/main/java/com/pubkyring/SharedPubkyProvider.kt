package to.pubkyring

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri

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
    require(uri.authority == AUTHORITY && uri.path == IDENTITIES_PATH) { "Unsupported URI" }
    require(selection == null && selectionArgs == null && sortOrder == null) { "Unsupported query" }

    val cursor = MatrixCursor(COLUMNS)
    val providerContext = context ?: return cursor
    SharedPubkyStore(providerContext).list().forEach { identity ->
      cursor.addRow(arrayOf(identity.pubky, identity.secretKey))
    }
    return cursor
  }

  private fun enforceCaller() {
    if (callingPackage != BITKIT_PACKAGE) {
      throw SecurityException("Caller is not authorized")
    }
  }

  override fun getType(uri: Uri): String? = null
  override fun insert(uri: Uri, values: ContentValues?): Uri? =
    throw UnsupportedOperationException("Provider is read-only")

  override fun update(
    uri: Uri,
    values: ContentValues?,
    selection: String?,
    selectionArgs: Array<out String>?,
  ): Int = throw UnsupportedOperationException("Provider is read-only")

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int =
    throw UnsupportedOperationException("Provider is read-only")

  companion object {
    private const val AUTHORITY = "app.pubkyring.sharedpubky"
    private const val IDENTITIES_PATH = "/identities"
    private const val BITKIT_PACKAGE = "to.bitkit"
    private val COLUMNS = arrayOf("pubky", "secret_key")
  }
}
