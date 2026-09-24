#import <React/RCTBridgeModule.h>
#import <Security/Security.h>

static NSString *const kSharedService = @"pubky.shared.v1";
static NSString *const kSharedAccessGroup = @"KYH47R284B.pubky.shared";
static NSString *const kOwnSourceApp = @"app.pubkyring";
static NSString *const kErrorDomain = @"shared_pubky";

static NSArray<NSString *> *ExternalSourceApps(void)
{
  return @[@"to.bitkit", @"to.bitkit.tnet", @"to.bitkit.dev"];
}

static NSMutableDictionary *SharedQuery(NSString *account)
{
  NSMutableDictionary *query = [@{
    (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService: kSharedService,
    (__bridge id)kSecAttrAccessGroup: kSharedAccessGroup,
    (__bridge id)kSecAttrSynchronizable: @NO,
  } mutableCopy];
  if (account) {
    query[(__bridge id)kSecAttrAccount] = account;
  }
  return query;
}

static NSString *OwnAccount(NSString *pubky)
{
  return [NSString stringWithFormat:@"%@:%@", kOwnSourceApp, pubky];
}

static NSArray<NSString *> *CopyAccounts(OSStatus *status)
{
  NSMutableDictionary *query = SharedQuery(nil);
  query[(__bridge id)kSecReturnAttributes] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitAll;

  CFTypeRef result = NULL;
  *status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (*status != errSecSuccess) {
    return @[];
  }

  NSMutableArray<NSString *> *accounts = [NSMutableArray array];
  for (NSDictionary *item in (__bridge_transfer NSArray *)result) {
    NSString *account = item[(__bridge id)kSecAttrAccount];
    if (account) {
      [accounts addObject:account];
    }
  }
  return accounts;
}

static void RejectStatus(RCTPromiseRejectBlock reject, OSStatus status)
{
  reject(kErrorDomain, [NSString stringWithFormat:@"Keychain error %d", (int)status], nil);
}

@interface SharedPubky : NSObject <RCTBridgeModule>
@end

@implementation SharedPubky

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_METHOD(listExternal:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  OSStatus status = errSecSuccess;
  NSArray<NSString *> *accounts = CopyAccounts(&status);
  if (status != errSecSuccess && status != errSecItemNotFound) {
    RejectStatus(reject, status);
    return;
  }

  NSMutableArray<NSDictionary *> *records = [NSMutableArray array];
  for (NSString *account in accounts) {
    for (NSString *sourceApp in ExternalSourceApps()) {
      NSString *prefix = [sourceApp stringByAppendingString:@":"];
      if ([account hasPrefix:prefix]) {
        [records addObject:@{@"pubky": [account substringFromIndex:prefix.length], @"sourceApp": sourceApp}];
        break;
      }
    }
  }
  resolve(records);
}

RCT_EXPORT_METHOD(getExternalSecret:(NSString *)pubky
                  sourceApp:(NSString *)sourceApp
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *query = SharedQuery([NSString stringWithFormat:@"%@:%@", sourceApp, pubky]);
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;

  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status == errSecItemNotFound) {
    resolve(@"");
    return;
  }
  if (status != errSecSuccess) {
    RejectStatus(reject, status);
    return;
  }

  NSData *data = (__bridge_transfer NSData *)result;
  resolve([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] ?: @"");
}

RCT_EXPORT_METHOD(setOwned:(NSString *)pubky
                  secretKey:(NSString *)secretKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *query = SharedQuery(OwnAccount(pubky));
  SecItemDelete((__bridge CFDictionaryRef)query);
  query[(__bridge id)kSecValueData] = [secretKey dataUsingEncoding:NSUTF8StringEncoding];
  query[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly;

  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);
  if (status != errSecSuccess) {
    RejectStatus(reject, status);
    return;
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(removeOwned:(NSString *)pubky
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)SharedQuery(OwnAccount(pubky)));
  if (status != errSecSuccess && status != errSecItemNotFound) {
    RejectStatus(reject, status);
    return;
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(removeAllOwned:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  OSStatus status = errSecSuccess;
  NSArray<NSString *> *accounts = CopyAccounts(&status);
  if (status != errSecSuccess && status != errSecItemNotFound) {
    RejectStatus(reject, status);
    return;
  }

  NSString *prefix = [kOwnSourceApp stringByAppendingString:@":"];
  OSStatus failure = errSecSuccess;
  for (NSString *account in accounts) {
    if ([account hasPrefix:prefix]) {
      OSStatus deleteStatus = SecItemDelete((__bridge CFDictionaryRef)SharedQuery(account));
      if (deleteStatus != errSecSuccess && deleteStatus != errSecItemNotFound) {
        failure = deleteStatus;
      }
    }
  }
  if (failure != errSecSuccess) {
    RejectStatus(reject, failure);
    return;
  }
  resolve(nil);
}

@end
