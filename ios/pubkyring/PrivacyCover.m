#import <React/RCTBridgeModule.h>

@interface PrivacyCover : NSObject <RCTBridgeModule>
@end

@implementation PrivacyCover
RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

RCT_EXPORT_METHOD(setEnabled:(BOOL)enabled)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"PubkyRingPrivacyCoverChanged"
    object:nil userInfo:@{@"enabled": @(enabled)}];
}
@end
