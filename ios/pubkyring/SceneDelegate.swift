import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?
  private var privacyView: UIView?
  private var privacyCoverEnabled = false

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(privacyCoverChanged(_:)),
      name: Notification.Name("PubkyRingPrivacyCoverChanged"),
      object: nil
    )

    dependencyProvider = RCTAppDependencyProvider()
    reactNativeFactory = RCTReactNativeFactory(delegate: self)
    window = UIWindow(windowScene: windowScene)

#if DEBUG
    let devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: true,
      keyboardShortcutsEnabled: true
    )
    reactNativeFactory?.devMenuConfiguration = devMenuConfiguration
#endif

    reactNativeFactory?.startReactNative(
      withModuleName: "pubkyring",
      in: window,
      connectionOptions: connectionOptions
    )
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    if privacyCoverEnabled {
      showPrivacyCover()
    }
  }

  @objc private func privacyCoverChanged(_ notification: Notification) {
    privacyCoverEnabled = notification.userInfo?["enabled"] as? Bool ?? false
    if let scene = window?.windowScene, scene.activationState != .foregroundActive {
      if privacyCoverEnabled {
        showPrivacyCover()
      }
      // Keep any existing cover until active, even if React has already hidden the secrets.
    } else {
      hidePrivacyCover()
    }
  }

  private func showPrivacyCover() {
    guard let window, privacyView == nil else {
      return
    }

    let view = UIView(frame: window.bounds)
    view.backgroundColor = UIColor.black
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    window.addSubview(view)
    privacyView = view
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    hidePrivacyCover()
  }

  private func hidePrivacyCover() {
    privacyView?.removeFromSuperview()
    privacyView = nil
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
