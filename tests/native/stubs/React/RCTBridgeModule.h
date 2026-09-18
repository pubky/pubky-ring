#import <Foundation/Foundation.h>

@protocol RCTBridgeModule <NSObject>
@end
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
#define RCT_EXPORT_MODULE(...)
#define RCT_REMAP_METHOD(name, ...) - (void)__VA_ARGS__
