package to.pubkyring

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SharedPubkyModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "SharedPubky"

  @ReactMethod
  fun mirror(pubky: String, secretKey: String, promise: Promise) {
    try {
      SharedPubkyStore(reactContext).upsert(pubky, secretKey)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("mirror_failed", error)
    }
  }

  @ReactMethod
  fun remove(pubky: String, promise: Promise) {
    try {
      SharedPubkyStore(reactContext).remove(pubky)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("remove_failed", error)
    }
  }

  @ReactMethod
  fun discover(promise: Promise) {
    val results = Arguments.createArray()
    val seen = mutableSetOf<String>()
    val authorities =
      if (BuildConfig.DEBUG) BITKIT_AUTHORITIES else listOf(PRODUCTION_BITKIT_AUTHORITY)
    authorities.forEach { authority ->
      try {
        reactContext.contentResolver
          .query(Uri.parse("content://$authority/identities"), COLUMNS, null, null, null)
          ?.use { cursor ->
            val pubkyIndex = cursor.getColumnIndexOrThrow("pubky")
            val secretKeyIndex = cursor.getColumnIndexOrThrow("secret_key")
            while (cursor.moveToNext()) {
              val pubky = cursor.getString(pubkyIndex) ?: continue
              val secretKey = cursor.getString(secretKeyIndex) ?: continue
              if (!seen.add(pubky)) continue
              results.pushMap(
                Arguments.createMap().apply {
                  putString("pubky", pubky)
                  putString("secretKey", secretKey)
                },
              )
            }
          }
      } catch (_: Exception) {
        // A missing provider or denied permission must not hide results from another authority.
      }
    }
    promise.resolve(results)
  }

  companion object {
    private const val PRODUCTION_BITKIT_AUTHORITY = "to.bitkit.sharedpubky"
    private val BITKIT_AUTHORITIES =
      listOf(
        PRODUCTION_BITKIT_AUTHORITY,
        "to.bitkit.dev.sharedpubky",
        "to.bitkit.tnet.sharedpubky",
      )
    private val COLUMNS = arrayOf("pubky", "secret_key")
  }
}
