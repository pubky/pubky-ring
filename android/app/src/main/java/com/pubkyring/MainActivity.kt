package to.pubkyring

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import java.util.ArrayDeque

class MainActivity : ReactActivity() {

  private lateinit var deepLinkInbox: DeepLinkInbox

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "pubkyring"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // Add this override to fix the fragment restoration issue
  override fun onCreate(savedInstanceState: Bundle?) {
    // This activity is singleTask, so its task record - and the VIEW intent that created it -
    // outlives the process. When the task is brought forward from history, or the activity is
    // restored, getIntent() still returns that original intent and React Native would hand its
    // URL to Linking.getInitialURL() as though it had just arrived. Drop it: pubkyauth:// URLs
    // are one-shot credentials naming a relay channel the requester has long since abandoned.
    val launchIntent = intent
    val isReplayedLaunch = isReplayedLaunchIntent(savedInstanceState)
    if (isReplayedLaunch) {
      intent = Intent(Intent.ACTION_MAIN)
    }
    super.onCreate(null)

    deepLinkInbox = ViewModelProvider(this)[DeepLinkInbox::class.java]
    val isRecreatedActivity = deepLinkInbox.hasAttachedActivity
    deepLinkInbox.hasAttachedActivity = true

    if (isRecreatedActivity) {
      // The retained inbox already represents this delivery, whether it is still pending or was
      // consumed before the Activity was recreated.
      if (launchIntent?.action == Intent.ACTION_VIEW) {
        intent = Intent(Intent.ACTION_MAIN)
      }
    } else if (!isReplayedLaunch) {
      enqueueDeepLink(launchIntent)
    }
  }

  /**
   * [ReactActivity.onNewIntent] forwards the intent to JS but never calls [setIntent], so without
   * this override getIntent() would keep returning the intent that originally created the task and
   * any later recreation of the activity would replay that stale URL.
   */
  override fun onNewIntent(intent: Intent) {
    setIntent(intent)
    enqueueDeepLink(intent)
    super.onNewIntent(intent)
  }

  /**
   * Returns each deep link delivered to this Activity exactly once. The inbox belongs to the
   * Activity instance, so a React root remount cannot replay it while a new Activity can accept the
   * same URL again in the existing process.
   */
  @Synchronized
  fun consumePendingDeepLinks(): List<String> {
    val urls = deepLinkInbox.pendingDeepLinks.toList()
    deepLinkInbox.pendingDeepLinks.clear()

    if (intent?.action == Intent.ACTION_VIEW && intent?.data != null) {
      intent = Intent(Intent.ACTION_MAIN)
    }

    return urls
  }

  @Synchronized
  private fun enqueueDeepLink(intent: Intent?) {
    if (intent?.action != Intent.ACTION_VIEW) return
    val url = intent.data?.toString() ?: return
    deepLinkInbox.pendingDeepLinks.addLast(url)
  }

  private fun isReplayedLaunchIntent(savedInstanceState: Bundle?): Boolean {
    val launchIntent = intent ?: return false
    if (launchIntent.action != Intent.ACTION_VIEW || launchIntent.data == null) return false
    // Set by the system when the task is relaunched from the recents/task record rather than
    // started by a sender.
    if (launchIntent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY != 0) return true
    // A restored activity is never a fresh user intent.
    return savedInstanceState != null
  }
}

class DeepLinkInbox : ViewModel() {
  val pendingDeepLinks = ArrayDeque<String>()
  var hasAttachedActivity = false
}
