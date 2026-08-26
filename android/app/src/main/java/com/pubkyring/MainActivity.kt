package to.pubkyring

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

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
    if (isReplayedLaunchIntent(savedInstanceState)) {
      intent = Intent(Intent.ACTION_MAIN)
    }
    super.onCreate(null)
  }

  /**
   * [ReactActivity.onNewIntent] forwards the intent to JS but never calls [setIntent], so without
   * this override getIntent() would keep returning the intent that originally created the task and
   * any later recreation of the activity would replay that stale URL.
   */
  override fun onNewIntent(intent: Intent) {
    setIntent(intent)
    super.onNewIntent(intent)
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
