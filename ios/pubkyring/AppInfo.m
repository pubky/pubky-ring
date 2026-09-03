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
  NSString *applicationId = bundle.bundleIdentifier;

  return @{
    @"version": version,
    @"buildNumber": buildNumber,
    @"applicationId": applicationId
  };
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
