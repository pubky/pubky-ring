package to.pubkyring

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InitialUrlModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  private val pendingPromises = mutableListOf<Promise>()
  private var activityListener: LifecycleEventListener? = null

  override fun getName(): String = "InitialUrl"

  override fun invalidate() {
    val listener =
        synchronized(this) {
          pendingPromises.clear()
          activityListener.also { activityListener = null }
        }
    listener?.let(reactContext::removeLifecycleEventListener)
    super.invalidate()
  }

  @ReactMethod
  fun consumePendingDeepLinks(promise: Promise) {
    reactContext.runOnUiQueueThread { resolvePendingDeepLinks(promise) }
  }

  private fun resolvePendingDeepLinks(promise: Promise) {
    if (reactContext.currentActivity == null) {
      waitForActivity(promise)
      return
    }

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

  @Synchronized
  private fun waitForActivity(promise: Promise) {
    pendingPromises.add(promise)
    if (activityListener != null) return

    activityListener =
        object : LifecycleEventListener {
          override fun onHostResume() {
            reactContext.removeLifecycleEventListener(this)
            val promises =
                synchronized(this@InitialUrlModule) {
                  activityListener = null
                  pendingPromises.toList().also { pendingPromises.clear() }
                }
            promises.forEach(::resolvePendingDeepLinks)
          }

          override fun onHostPause() = Unit

          override fun onHostDestroy() = Unit
        }
    reactContext.addLifecycleEventListener(activityListener)
  }
}
