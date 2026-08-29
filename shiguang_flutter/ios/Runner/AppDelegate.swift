import Flutter
import UIKit
import ObjectiveC.runtime

private func hideWebViewInputAccessoryBar() {
  guard let contentViewClass = NSClassFromString("WKContentView") else { return }
  let selector = #selector(getter: UIResponder.inputAccessoryView)
  let block: @convention(block) (AnyObject) -> UIView? = { _ in nil }
  class_addMethod(contentViewClass, selector, imp_implementationWithBlock(block), "@@:")
}

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    hideWebViewInputAccessoryBar()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
