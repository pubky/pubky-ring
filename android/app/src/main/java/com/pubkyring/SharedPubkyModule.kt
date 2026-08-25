package to.pubkyring

import android.content.pm.PackageManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import org.json.JSONArray
import org.json.JSONObject

class SharedPubkyModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "SharedPubky"

  @ReactMethod
  fun mirror(pubky: String, secretKey: String, promise: Promise) {
    try {
      val normalized =
        requireNotNull(SharedPubkyContract.normalizePubky(pubky)) { "Invalid pubky" }
      SharedPubkyStore(reactContext).upsert(normalized, secretKey)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("mirror_failed", error)
    }
  }

  @ReactMethod
  fun remove(pubky: String, promise: Promise) {
    try {
      val normalized =
        requireNotNull(SharedPubkyContract.normalizePubky(pubky)) { "Invalid pubky" }
      SharedPubkyStore(reactContext).remove(normalized)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("remove_failed", error)
    }
  }

  @ReactMethod
  fun reconcile(identities: ReadableArray, promise: Promise) {
    try {
      val json = JSONArray()
      for (index in 0 until identities.size()) {
        val identity = identities.getMap(index) ?: throw IllegalArgumentException("Invalid identity")
        val pubky =
          requireNotNull(
            SharedPubkyContract.normalizePubky(
              requireNotNull(identity.getString("pubky")) { "Missing pubky" },
            ),
          ) {
            "Invalid pubky"
          }
        val secretKey = requireNotNull(identity.getString("secretKey")) { "Missing secret key" }
        json.put(
          JSONObject()
            .put("pubky", pubky)
            .put("secretKey", secretKey),
        )
      }
      SharedPubkyStore(reactContext).reconcile(json.toString())
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("reconcile_failed", error)
    }
  }

  @ReactMethod
  fun clear(promise: Promise) {
    try {
      SharedPubkyStore(reactContext).clear()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("clear_failed", error)
    }
  }

  @ReactMethod
  fun list(promise: Promise) {
    val identities = Arguments.createArray()
    val seen = mutableSetOf<String>()
    val authorities =
      if (BuildConfig.DEBUG) BITKIT_AUTHORITIES else listOf(PRODUCTION_BITKIT_AUTHORITY)
    var available = false
    authorities.forEach { authority ->
      try {
        if (!isTrustedBitkitProvider(authority)) return@forEach
        val cursor =
          reactContext.contentResolver.query(
            Uri.parse("content://$authority/${SharedPubkyContract.IDENTITIES_PATH}"),
            SharedPubkyContract.PUBLIC_COLUMNS,
            null,
            null,
            null,
          ) ?: return@forEach
        cursor.use {
          available = true
            val versionIndex =
              it.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_PROTOCOL_VERSION)
            val sourceIndex =
              it.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_SOURCE_PACKAGE)
            val pubkyIndex = it.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_PUBKY)
            while (it.moveToNext()) {
              val version = it.getInt(versionIndex)
              val sourcePackage = it.getString(sourceIndex) ?: continue
              val pubky = it.getString(pubkyIndex) ?: continue
              if (
                version != SharedPubkyContract.VERSION ||
                  sourcePackage != SharedPubkyContract.BITKIT_SOURCE_PACKAGE ||
                  !SharedPubkyContract.isValidPubky(pubky) ||
                  !seen.add(pubky)
              ) {
                continue
              }
              identities.pushMap(
                Arguments.createMap().apply {
                  putInt("version", version)
                  putString("sourceApp", sourcePackage)
                  putString("pubky", pubky)
                },
              )
            }
        }
      } catch (_: Exception) {
        // A missing provider or denied permission must not hide results from another authority.
      }
    }
    promise.resolve(
      Arguments.createMap().apply {
        putBoolean("available", available)
        putArray("identities", identities)
      },
    )
  }

  @ReactMethod
  fun credential(pubky: String, promise: Promise) {
    val normalized = SharedPubkyContract.normalizePubky(pubky)
    if (normalized == null) {
      promise.reject("invalid_pubky", "Invalid pubky")
      return
    }
    val authorities =
      if (BuildConfig.DEBUG) BITKIT_AUTHORITIES else listOf(PRODUCTION_BITKIT_AUTHORITY)
    authorities.forEach { authority ->
      try {
        if (!isTrustedBitkitProvider(authority)) return@forEach
        val uri =
          Uri.Builder()
            .scheme("content")
            .authority(authority)
            .appendPath("v1")
            .appendPath("identities")
            .appendPath(normalized)
            .appendPath(SharedPubkyContract.CREDENTIAL_SEGMENT)
            .build()
        reactContext.contentResolver
          .query(uri, SharedPubkyContract.CREDENTIAL_COLUMNS, null, null, null)
          ?.use { cursor ->
            if (!cursor.moveToFirst() || !cursor.isLast) return@use
            val version =
              cursor.getInt(
                cursor.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_PROTOCOL_VERSION),
              )
            val sourcePackage =
              cursor.getString(
                cursor.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_SOURCE_PACKAGE),
              )
            val returnedPubky =
              cursor.getString(cursor.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_PUBKY))
            val secretKey =
              cursor.getString(cursor.getColumnIndexOrThrow(SharedPubkyContract.COLUMN_SECRET_KEY))
            if (
              version == SharedPubkyContract.VERSION &&
                sourcePackage == SharedPubkyContract.BITKIT_SOURCE_PACKAGE &&
                returnedPubky == normalized &&
                secretKey != null &&
                SharedPubkyContract.isValidSecretKey(secretKey)
            ) {
              promise.resolve(
                Arguments.createMap().apply {
                  putInt("version", version)
                  putString("sourceApp", sourcePackage)
                  putString("pubky", returnedPubky)
                  putString("secretKey", secretKey)
                },
              )
              return
            }
          }
      } catch (_: Exception) {
        // Try another installed debug variant.
      }
    }
    promise.reject("credential_unavailable", "Shared Pubky credential is unavailable")
  }

  private fun isTrustedBitkitProvider(authority: String): Boolean {
    val provider =
      reactContext.packageManager.resolveContentProvider(
        authority,
        PackageManager.MATCH_DIRECT_BOOT_AWARE or PackageManager.MATCH_DIRECT_BOOT_UNAWARE,
      ) ?: return false
    val expectedPackage = AUTHORITY_PACKAGES[authority] ?: return false
    return provider.packageName == expectedPackage &&
      reactContext.packageManager.checkSignatures(reactContext.packageName, provider.packageName) ==
        PackageManager.SIGNATURE_MATCH
  }

  companion object {
    private const val PRODUCTION_BITKIT_AUTHORITY = "to.bitkit.sharedpubky"
    private val BITKIT_AUTHORITIES =
      listOf(
        PRODUCTION_BITKIT_AUTHORITY,
        "to.bitkit.dev.sharedpubky",
        "to.bitkit.tnet.sharedpubky",
      )
    private val AUTHORITY_PACKAGES =
      mapOf(
        "to.bitkit.sharedpubky" to "to.bitkit",
        "to.bitkit.dev.sharedpubky" to "to.bitkit.dev",
        "to.bitkit.tnet.sharedpubky" to "to.bitkit.tnet",
      )
  }
}
