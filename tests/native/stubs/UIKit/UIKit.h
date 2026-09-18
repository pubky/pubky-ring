#import <Foundation/Foundation.h>

@interface UIApplication : NSObject
@property(class, nonatomic, readonly) UIApplication *sharedApplication;
- (BOOL)canOpenURL:(NSURL *)url;
@end
