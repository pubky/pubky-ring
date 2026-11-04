package to.pubkyring

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Local user-presence gate only. It does not create keys or change credential storage. */
class DeviceAuthenticationModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var requestId: String? = null
  private var pending: Promise? = null
  private var prompt: BiometricPrompt? = null
  private var credentialRequestCode: Int? = null
  private var nextCredentialCode = 4100
  private var credentialSucceeded = false
  private val keyguard get() = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
  private val mainExecutor get() = ContextCompat.getMainExecutor(context)

  init {
    context.addLifecycleEventListener(this)
    context.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != credentialRequestCode) return
        if (resultCode == Activity.RESULT_OK) {
          // Complete on resume so a background activity cannot authorize an operation.
          credentialSucceeded = true
        } else finish(false, "cancelled")
      }
    })
  }

  override fun getName() = "DeviceAuthentication"

  @ReactMethod
  fun getAvailability(promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putBoolean("available", keyguard.isDeviceSecure)
      putString("biometry", "none")
    })
  }

  @ReactMethod
  fun authenticate(id: String, reason: String, cancelTitle: String, fallbackTitle: String, promise: Promise) {
    mainExecutor.execute {
      if (pending != null) { promise.reject("busy", "Authentication already in progress"); return@execute }
      val activity = context.currentActivity as? FragmentActivity
      if (activity == null || activity.isFinishing || activity.isDestroyed) {
        promise.reject("cancelled", "No active application"); return@execute
      }
      if (!keyguard.isDeviceSecure) {
        promise.reject("unavailable", "Set up a device screen lock in Settings"); return@execute
      }
      requestId = id
      pending = promise
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or
              BiometricManager.Authenticators.DEVICE_CREDENTIAL
          if (BiometricManager.from(context).canAuthenticate(authenticators) != BiometricManager.BIOMETRIC_SUCCESS) {
            finish(false, "unavailable"); return@execute
          }
          showBiometrics(activity, id, reason, authenticators, null)
        } else if (BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS) {
          showBiometrics(activity, id, reason, BiometricManager.Authenticators.BIOMETRIC_STRONG, fallbackTitle)
        } else {
          showCredentials(activity, reason)
        }
      } catch (_: Exception) { finish(false, "unavailable") }
    }
  }

  private fun showBiometrics(activity: FragmentActivity, id: String, reason: String, authenticators: Int, fallback: String?) {
    prompt = BiometricPrompt(activity, mainExecutor, object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        if (requestId == id) finish(true)
      }
      override fun onAuthenticationError(code: Int, message: CharSequence) {
        if (requestId != id) return
        if (authenticators != BiometricManager.Authenticators.DEVICE_CREDENTIAL && code in listOf(
            BiometricPrompt.ERROR_NEGATIVE_BUTTON, BiometricPrompt.ERROR_LOCKOUT,
            BiometricPrompt.ERROR_LOCKOUT_PERMANENT, BiometricPrompt.ERROR_HW_UNAVAILABLE,
            BiometricPrompt.ERROR_NO_BIOMETRICS)) {
          try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
              showBiometrics(activity, id, reason, BiometricManager.Authenticators.DEVICE_CREDENTIAL, null)
            } else showCredentials(activity, reason)
          } catch (_: Exception) { finish(false, "unavailable") }
        } else finish(false, if (code == BiometricPrompt.ERROR_USER_CANCELED ||
            code == BiometricPrompt.ERROR_CANCELED) "cancelled" else "failed")
      }
    })
    val info = BiometricPrompt.PromptInfo.Builder().setTitle(reason).setAllowedAuthenticators(authenticators)
    if (fallback != null) info.setNegativeButtonText(fallback)
    prompt?.authenticate(info.build())
  }

  @Suppress("DEPRECATION")
  private fun showCredentials(activity: Activity, reason: String) {
    val intent = keyguard.createConfirmDeviceCredentialIntent(reason, null)
      ?: return finish(false, "unavailable")
    val code = nextCredentialCode++
    credentialRequestCode = code
    activity.startActivityForResult(intent, code)
  }

  private fun finish(success: Boolean, error: String = "failed") {
    val result = pending ?: return
    pending = null
    requestId = null
    prompt = null
    credentialRequestCode = null
    credentialSucceeded = false
    if (success) result.resolve(true) else result.reject(error, "Device authentication did not succeed")
  }

  @ReactMethod
  fun cancel(id: String) {
    mainExecutor.execute {
      if (requestId != id) return@execute
      val previousPrompt = prompt
      val previousCode = credentialRequestCode
      finish(false, "cancelled")
      previousPrompt?.cancelAuthentication()
      if (previousCode != null) context.currentActivity?.finishActivity(previousCode)
    }
  }

  @ReactMethod
  fun openEnrollment(promise: Promise) {
    try {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Intent(Settings.ACTION_BIOMETRIC_ENROLL).putExtra(Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED,
          BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
      } else Intent(Settings.ACTION_SECURITY_SETTINGS)
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("unavailable", "Cannot open Settings", error) }
  }

  override fun onHostResume() { if (credentialSucceeded) finish(true) }
  override fun onHostPause() { if (credentialRequestCode == null) requestId?.let { cancel(it) } }
  override fun onHostDestroy() { requestId?.let { cancel(it) } }
}
