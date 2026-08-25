package to.pubkyring

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SecureWindowModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "SecureWindow"

  @ReactMethod
  fun setSecure(enabled: Boolean) {
    reactContext.currentActivity?.runOnUiThread {
      val window = reactContext.currentActivity?.window ?: return@runOnUiThread

      if (enabled) {
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    }
  }
}
