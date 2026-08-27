package to.pubkyring

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InitialUrlModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "InitialUrl"

  @ReactMethod
  fun consumePendingDeepLinks(promise: Promise) {
    reactContext.runOnUiQueueThread {
      try {
        val urls =
            (reactContext.currentActivity as? MainActivity)?.consumePendingDeepLinks().orEmpty()
        val result = Arguments.createArray()
        urls.forEach(result::pushString)
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("initial_url_error", "Could not consume pending deep links", error)
      }
    }
  }
}
