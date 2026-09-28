package to.pubkyring

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.UriMatcher
import android.content.pm.PackageManager
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Binder

const val SHARED_PUBKY_AUTHORITY_SUFFIX = ".sharedpubky"
const val SHARED_PUBKY_IDENTITIES_PATH = "v1/identities"
const val SHARED_PUBKY_COLUMN_PUBKY = "pubky"
const val SHARED_PUBKY_COLUMN_SECRET_KEY = "secret_key"

private const val IDENTITIES = 1
private const val CREDENTIAL = 2

/** Read-only export of the Ring-owned pubkys to apps signed with the same certificate. */
class SharedPubkyProvider : ContentProvider() {
  private lateinit var matcher: UriMatcher

  override fun onCreate(): Boolean {
    val authority = (context ?: return false).packageName + SHARED_PUBKY_AUTHORITY_SUFFIX
    matcher =
        UriMatcher(UriMatcher.NO_MATCH).apply {
          addURI(authority, SHARED_PUBKY_IDENTITIES_PATH, IDENTITIES)
          addURI(authority, "$SHARED_PUBKY_IDENTITIES_PATH/*/credential", CREDENTIAL)
        }
    return true
  }

  override fun query(
      uri: Uri,
      projection: Array<String>?,
      selection: String?,
      selectionArgs: Array<String>?,
      sortOrder: String?
  ): Cursor? {
    val context = context ?: return null
    requireTrustedCaller(context)
    val store = SharedPubkyStore(context)
    return when (matcher.match(uri)) {
      IDENTITIES ->
          MatrixCursor(arrayOf(SHARED_PUBKY_COLUMN_PUBKY)).apply {
            store.pubkys().forEach { addRow(arrayOf(it)) }
          }
      CREDENTIAL -> {
        val pubky = uri.pathSegments[2]
        MatrixCursor(arrayOf(SHARED_PUBKY_COLUMN_PUBKY, SHARED_PUBKY_COLUMN_SECRET_KEY)).apply {
          runCatching { store.get(pubky) }.getOrNull()?.let { addRow(arrayOf(pubky, it)) }
        }
      }
      else -> null
    }
  }

  override fun getType(uri: Uri): String? =
      when (matcher.match(uri)) {
        IDENTITIES -> "vnd.android.cursor.dir/vnd.to.pubkyring.identity"
        CREDENTIAL -> "vnd.android.cursor.item/vnd.to.pubkyring.credential"
        else -> null
      }

  override fun insert(uri: Uri, values: ContentValues?): Uri =
      throw UnsupportedOperationException()

  override fun update(
      uri: Uri,
      values: ContentValues?,
      selection: String?,
      selectionArgs: Array<String>?
  ): Int = throw UnsupportedOperationException()

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int =
      throw UnsupportedOperationException()

  private fun requireTrustedCaller(context: Context) {
    val packageManager = context.packageManager
    val callers = packageManager.getPackagesForUid(Binder.getCallingUid()).orEmpty()
    val trusted =
        callers.isNotEmpty() &&
            callers.all {
              packageManager.checkSignatures(context.packageName, it) ==
                  PackageManager.SIGNATURE_MATCH
            }
    if (!trusted) {
      throw SecurityException("Caller is not signed with the Pubky Ring certificate")
    }
  }
}
