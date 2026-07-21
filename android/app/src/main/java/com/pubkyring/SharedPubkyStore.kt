package to.pubkyring

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONObject

/** App-private AES-GCM encrypted mirror used by the native ContentProvider. */
class SharedPubkyStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  data class Identity(val pubky: String, val secretKey: String)

  fun list(): List<Identity> =
    prefs.all.mapNotNull { (pubky, stored) ->
      if (stored !is String) return@mapNotNull null
      val plaintext = decrypt(stored) ?: return@mapNotNull null
      try {
        val json = JSONObject(plaintext)
        val secretKey = json.optString("secretKey")
        if (pubky.isBlank() || secretKey.isBlank()) null else Identity(pubky, secretKey)
      } catch (_: Exception) {
        null
      }
    }

  fun upsert(pubky: String, secretKey: String) {
    require(pubky.isNotBlank()) { "pubky must not be blank" }
    require(secretKey.isNotBlank()) { "secretKey must not be blank" }
    val plaintext = JSONObject().put("secretKey", secretKey).toString()
    prefs.edit().putString(pubky, encrypt(plaintext)).apply()
  }

  fun remove(pubky: String) {
    prefs.edit().remove(pubky).apply()
  }

  private fun encrypt(plaintext: String): String {
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, secretKey())
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
    return Base64.encodeToString(cipher.iv + ciphertext, Base64.NO_WRAP)
  }

  private fun decrypt(stored: String): String? {
    return try {
      val combined = Base64.decode(stored, Base64.NO_WRAP)
      if (combined.size <= IV_LENGTH) return null
      val cipher = Cipher.getInstance(TRANSFORMATION)
      cipher.init(
        Cipher.DECRYPT_MODE,
        secretKey(),
        GCMParameterSpec(GCM_TAG_BITS, combined.copyOfRange(0, IV_LENGTH)),
      )
      String(cipher.doFinal(combined.copyOfRange(IV_LENGTH, combined.size)), Charsets.UTF_8)
    } catch (_: Exception) {
      null
    }
  }

  private fun secretKey(): SecretKey {
    val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
    generator.init(
      KeyGenParameterSpec.Builder(
          KEY_ALIAS,
          KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build(),
    )
    return generator.generateKey()
  }

  companion object {
    private const val PREFS_NAME = "shared_pubky_store"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val KEY_ALIAS = "shared_pubky"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val IV_LENGTH = 12
    private const val GCM_TAG_BITS = 128
  }
}
