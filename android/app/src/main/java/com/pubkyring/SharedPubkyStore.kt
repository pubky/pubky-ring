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

private const val KEYSTORE = "AndroidKeyStore"
private const val KEY_ALIAS = "shared_pubky"
private const val PREFS_NAME = "shared_pubky"
private const val TRANSFORMATION = "AES/GCM/NoPadding"
private const val IV_LENGTH = 12
private const val TAG_LENGTH_BITS = 128

/** Ring-owned pubky secrets, encrypted with an AndroidKeyStore key and served by [SharedPubkyProvider]. */
class SharedPubkyStore(context: Context) {
  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun pubkys(): Set<String> = prefs.all.keys

  fun get(pubky: String): String? {
    val stored = Base64.decode(prefs.getString(pubky, null) ?: return null, Base64.NO_WRAP)
    val cipher =
        Cipher.getInstance(TRANSFORMATION).apply {
          init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(TAG_LENGTH_BITS, stored, 0, IV_LENGTH))
        }
    return String(cipher.doFinal(stored, IV_LENGTH, stored.size - IV_LENGTH))
  }

  fun put(pubky: String, secretKey: String) {
    val cipher = Cipher.getInstance(TRANSFORMATION).apply { init(Cipher.ENCRYPT_MODE, key()) }
    val stored = cipher.iv + cipher.doFinal(secretKey.toByteArray())
    prefs.edit().putString(pubky, Base64.encodeToString(stored, Base64.NO_WRAP)).apply()
  }

  fun remove(pubky: String) {
    prefs.edit().remove(pubky).apply()
  }

  fun removeAll() {
    prefs.edit().clear().apply()
  }

  private fun key(): SecretKey {
    val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
    (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let {
      return it.secretKey
    }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
        .apply {
          init(
              KeyGenParameterSpec.Builder(
                      KEY_ALIAS,
                      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                  )
                  .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                  .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                  .build(),
          )
        }
        .generateKey()
  }
}
