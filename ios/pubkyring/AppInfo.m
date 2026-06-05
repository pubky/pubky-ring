#import <React/RCTBridgeModule.h>

@interface AppInfo : NSObject <RCTBridgeModule>
@end

@implementation AppInfo

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport
{
  NSBundle *bundle = NSBundle.mainBundle;
  NSString *version = [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"";
  NSString *buildNumber = [bundle objectForInfoDictionaryKey:@"CFBundleVersion"] ?: @"";

  return @{
    @"version": version,
    @"buildNumber": buildNumber
  };
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
