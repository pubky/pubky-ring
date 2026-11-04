#import <React/RCTBridgeModule.h>
#import <LocalAuthentication/LocalAuthentication.h>
#import <UIKit/UIKit.h>

@interface DeviceAuthentication : NSObject <RCTBridgeModule>
@property(nonatomic, strong) LAContext *context;
@property(nonatomic, copy) NSString *requestId;
@property(nonatomic, copy) RCTPromiseRejectBlock pendingReject;
@end

@implementation DeviceAuthentication
RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didBackground)
      name:UIApplicationDidEnterBackgroundNotification object:nil];
  }
  return self;
}

- (void)dealloc { [[NSNotificationCenter defaultCenter] removeObserver:self]; }

- (void)cancelPending
{
  RCTPromiseRejectBlock reject = self.pendingReject;
  self.pendingReject = nil;
  self.requestId = nil;
  [self.context invalidate];
  self.context = nil;
  if (reject) reject(@"cancelled", @"Device authentication cancelled", nil);
}

- (void)didBackground { [self cancelPending]; }
- (void)invalidate { dispatch_async(dispatch_get_main_queue(), ^{ [self cancelPending]; }); }

RCT_EXPORT_METHOD(getAvailability:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [LAContext new];
  BOOL available = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:nil];
  [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:nil];
  NSString *biometry = context.biometryType == LABiometryTypeFaceID ? @"face" :
    context.biometryType == LABiometryTypeTouchID ? @"touch" : @"none";
  resolve(@{@"available": @(available), @"biometry": biometry});
}

RCT_EXPORT_METHOD(authenticate:(NSString *)requestId reason:(NSString *)reason
                  cancelTitle:(NSString *)cancelTitle fallbackTitle:(NSString *)fallbackTitle
                  resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (self.requestId) { reject(@"busy", @"Authentication already in progress", nil); return; }
  if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) {
    reject(@"cancelled", @"Application is not active", nil); return;
  }
  LAContext *context = [LAContext new];
  context.touchIDAuthenticationAllowableReuseDuration = 0;
  context.localizedCancelTitle = cancelTitle;
  context.localizedFallbackTitle = fallbackTitle;
  NSError *error = nil;
  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:&error]) {
    reject(@"unavailable", @"Set up a device passcode in Settings", error); return;
  }
  self.context = context;
  self.requestId = requestId;
  self.pendingReject = reject;
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication localizedReason:reason
    reply:^(BOOL success, NSError *authError) {
      dispatch_async(dispatch_get_main_queue(), ^{
        if (![self.requestId isEqualToString:requestId]) return;
        self.context = nil;
        self.requestId = nil;
        self.pendingReject = nil;
        if (success) { resolve(@YES); return; }
        BOOL cancelled = authError.code == LAErrorUserCancel || authError.code == LAErrorAppCancel ||
          authError.code == LAErrorSystemCancel;
        reject(cancelled ? @"cancelled" : @"failed", @"Device authentication did not succeed", authError);
      });
    }];
}

RCT_EXPORT_METHOD(cancel:(NSString *)requestId)
{
  if ([self.requestId isEqualToString:requestId]) [self cancelPending];
}

RCT_EXPORT_METHOD(openEnrollment:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  [UIApplication.sharedApplication openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]
    options:@{} completionHandler:^(BOOL success) {
      if (success) resolve(nil); else reject(@"unavailable", @"Cannot open Settings", nil);
    }];
}
@end
