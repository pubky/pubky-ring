package to.pubkyring

import android.content.pm.PackageManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

private const val ERROR_CODE = "shared_pubky"
private val BITKIT_PACKAGES = listOf("to.bitkit", "to.bitkit.tnet", "to.bitkit.dev")

class SharedPubkyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  private val store by lazy { SharedPubkyStore(reactContext) }

  override fun getName(): String = "SharedPubky"

  @ReactMethod
  fun listExternal(promise: Promise) {
    try {
      val records = Arguments.createArray()
      BITKIT_PACKAGES.forEach { sourceApp ->
        val authority = trustedAuthority(sourceApp) ?: return@forEach
        reactContext.contentResolver
            .query(Uri.parse("content://$authority/$SHARED_PUBKY_IDENTITIES_PATH"), null, null, null, null)
            ?.use { cursor ->
              val pubkyColumn = cursor.getColumnIndexOrThrow(SHARED_PUBKY_COLUMN_PUBKY)
              while (cursor.moveToNext()) {
                records.pushMap(
                    Arguments.createMap().apply {
                      putString("pubky", cursor.getString(pubkyColumn))
                      putString("sourceApp", sourceApp)
                    },
                )
              }
            }
      }
      promise.resolve(records)
    } catch (e: Exception) {
      promise.reject(ERROR_CODE, e)
    }
  }

  @ReactMethod
  fun getExternalSecret(pubky: String, sourceApp: String, promise: Promise) {
    try {
      val authority = trustedAuthority(sourceApp) ?: return promise.resolve("")
      val uri = Uri.parse("content://$authority/$SHARED_PUBKY_IDENTITIES_PATH/$pubky/credential")
      val secretKey =
          reactContext.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
              cursor.getString(cursor.getColumnIndexOrThrow(SHARED_PUBKY_COLUMN_SECRET_KEY))
            } else {
              null
            }
          }
      promise.resolve(secretKey ?: "")
    } catch (e: Exception) {
      promise.reject(ERROR_CODE, e)
    }
  }

  @ReactMethod
  fun setOwned(pubky: String, secretKey: String, promise: Promise) {
    try {
      store.put(pubky, secretKey)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(ERROR_CODE, e)
    }
  }

  @ReactMethod
  fun removeOwned(pubky: String, promise: Promise) {
    try {
      store.remove(pubky)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(ERROR_CODE, e)
    }
  }

  @ReactMethod
  fun removeAllOwned(promise: Promise) {
    try {
      store.removeAll()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(ERROR_CODE, e)
    }
  }

  private fun trustedAuthority(sourceApp: String): String? {
    if (sourceApp !in BITKIT_PACKAGES) {
      return null
    }
    val packageManager = reactContext.packageManager
    val authority = sourceApp + SHARED_PUBKY_AUTHORITY_SUFFIX
    val provider = packageManager.resolveContentProvider(authority, 0) ?: return null
    val signaturesMatch =
        packageManager.checkSignatures(reactContext.packageName, sourceApp) ==
            PackageManager.SIGNATURE_MATCH
    return authority.takeIf { provider.packageName == sourceApp && signaturesMatch }
  }
}
