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
import org.json.JSONArray
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
        val version = json.optInt("version")
        val sourcePackage = json.optString("sourcePackage")
        val storedPubky = json.optString("pubky")
        val secretKey = json.optString("secretKey")
        if (
          version != SharedPubkyContract.VERSION ||
            sourcePackage != SharedPubkyContract.RING_SOURCE_PACKAGE ||
            pubky != storedPubky ||
            !SharedPubkyContract.isValidPubky(pubky) ||
            !SharedPubkyContract.isValidSecretKey(secretKey)
        ) {
          null
        } else {
          Identity(pubky, secretKey)
        }
      } catch (_: Exception) {
        null
      }
    }.sortedBy { it.pubky }

  fun get(pubky: String): Identity? = list().firstOrNull { it.pubky == pubky }

  fun upsert(pubky: String, secretKey: String) {
    require(SharedPubkyContract.isValidPubky(pubky)) { "pubky is invalid" }
    require(SharedPubkyContract.isValidSecretKey(secretKey)) { "secretKey is invalid" }
    val plaintext =
      JSONObject()
        .put("version", SharedPubkyContract.VERSION)
        .put("sourcePackage", SharedPubkyContract.RING_SOURCE_PACKAGE)
        .put("pubky", pubky)
        .put("secretKey", secretKey)
        .toString()
    check(prefs.edit().putString(pubky, encrypt(plaintext)).commit()) {
      "Unable to persist shared pubky mirror"
    }
    check(get(pubky)?.secretKey == secretKey) { "Shared pubky mirror read-back failed" }
  }

  fun remove(pubky: String) {
    check(prefs.edit().remove(pubky).commit()) { "Unable to remove shared pubky mirror" }
    check(get(pubky) == null) { "Shared pubky mirror still exists after removal" }
  }

  /**
   * Replaces the mirror with the complete set of identities owned by Ring.
   *
   * The caller has already read and validated these values from Ring's canonical private
   * keychain. Borrowed Bitkit identities are deliberately never passed to this method.
   */
  fun reconcile(identitiesJson: String) {
    val identities = JSONArray(identitiesJson)
    val desired = linkedMapOf<String, String>()
    for (index in 0 until identities.length()) {
      val identity = identities.getJSONObject(index)
      val pubky = identity.getString("pubky")
      val secretKey = identity.getString("secretKey")
      require(SharedPubkyContract.isValidPubky(pubky)) { "pubky is invalid" }
      require(SharedPubkyContract.isValidSecretKey(secretKey)) { "secretKey is invalid" }
      check(desired.put(pubky, secretKey) == null) { "Duplicate pubky" }
    }

    desired.forEach { (pubky, secretKey) -> upsert(pubky, secretKey) }
    prefs.all.keys.filterNot(desired::containsKey).forEach(::remove)
    check(list().associate { it.pubky to it.secretKey } == desired) {
      "Shared pubky reconciliation read-back failed"
    }
  }

  fun clear() {
    check(prefs.edit().clear().commit()) { "Unable to clear shared pubky mirrors" }
    check(prefs.all.isEmpty()) { "Shared pubky mirrors still exist after clear" }

    val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    if (keyStore.containsAlias(KEY_ALIAS)) {
      keyStore.deleteEntry(KEY_ALIAS)
      check(!keyStore.containsAlias(KEY_ALIAS)) { "Shared pubky encryption key still exists after clear" }
    }
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
