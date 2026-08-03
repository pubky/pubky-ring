#import <React/RCTBridgeModule.h>
#import <Security/Security.h>
#import <UIKit/UIKit.h>

static NSInteger const SharedPubkyProtocolVersion = 1;
static NSString *const SharedPubkyService = @"pubky.identity-sharing.v1";
static NSString *const RingSourceApp = @"app.pubkyring";
static NSString *const BitkitSourceApp = @"to.bitkit";

@interface SharedPubky : NSObject <RCTBridgeModule>
@end

@implementation SharedPubky

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"privateAccessGroup" : [self privateAccessGroup] ?: @"",
    @"sharedAccessGroup" : [self sharedAccessGroup] ?: @"",
    @"protocolVersion" : @(SharedPubkyProtocolVersion),
    @"sourceApp" : RingSourceApp,
  };
}

RCT_REMAP_METHOD(mirror,
                 mirrorPubky:(NSString *)pubky
                 secretKey:(NSString *)secretKey
                 mirrorResolver:(RCTPromiseResolveBlock)resolve
                 mirrorRejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *normalized = [self normalizedPubky:pubky];
  if (normalized.length == 0 || ![self isValidSecretKey:secretKey]) {
    reject(@"invalid_identity", @"Pubky or secret key is invalid", nil);
    return;
  }

  NSDictionary *payload = @{
    @"version" : @(SharedPubkyProtocolVersion),
    @"sourceApp" : RingSourceApp,
    @"pubky" : normalized,
    @"secretKey" : secretKey,
  };
  NSError *error;
  if (![self upsertPayload:payload account:[self accountForSource:RingSourceApp pubky:normalized] error:&error]) {
    [self reject:reject error:error fallbackCode:@"mirror_failed"];
    return;
  }
  resolve(nil);
}

RCT_REMAP_METHOD(remove,
                 removePubky:(NSString *)pubky
                 removeResolver:(RCTPromiseResolveBlock)resolve
                 removeRejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error;
  if (![self deleteAccount:[self accountForSource:RingSourceApp pubky:[self normalizedPubky:pubky]]
                      error:&error]) {
    [self reject:reject error:error fallbackCode:@"remove_failed"];
    return;
  }
  resolve(nil);
}

RCT_REMAP_METHOD(reconcile,
                 reconcileIdentities:(NSArray<NSDictionary *> *)identities
                 reconcileResolver:(RCTPromiseResolveBlock)resolve
                 reconcileRejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableSet<NSString *> *desiredAccounts = [NSMutableSet set];
  for (NSDictionary *identity in identities) {
    NSString *pubky = [self normalizedPubky:identity[@"pubky"]];
    NSString *secretKey = identity[@"secretKey"];
    if (pubky.length == 0 || ![self isValidSecretKey:secretKey]) {
      reject(@"invalid_identity", @"Invalid identity supplied for reconciliation", nil);
      return;
    }
    NSString *account = [self accountForSource:RingSourceApp pubky:pubky];
    if ([desiredAccounts containsObject:account]) {
      reject(@"invalid_identity", @"Duplicate identity supplied for reconciliation", nil);
      return;
    }
    [desiredAccounts addObject:account];
    NSDictionary *payload = @{
      @"version" : @(SharedPubkyProtocolVersion),
      @"sourceApp" : RingSourceApp,
      @"pubky" : pubky,
      @"secretKey" : secretKey,
    };
    NSError *error;
    if (![self upsertPayload:payload account:account error:&error]) {
      [self reject:reject error:error fallbackCode:@"reconcile_failed"];
      return;
    }
  }

  NSError *listError;
  NSArray<NSDictionary *> *owned = [self attributesForSource:RingSourceApp error:&listError];
  if (owned == nil) {
    [self reject:reject error:listError fallbackCode:@"reconcile_failed"];
    return;
  }
  for (NSDictionary *attributes in owned) {
    NSString *account = attributes[(__bridge id)kSecAttrAccount];
    if (![desiredAccounts containsObject:account]) {
      NSError *deleteError;
      if (![self deleteAccount:account error:&deleteError]) {
        [self reject:reject error:deleteError fallbackCode:@"reconcile_failed"];
        return;
      }
    }
  }
  resolve(nil);
}

RCT_REMAP_METHOD(clear,
                 clearResolver:(RCTPromiseResolveBlock)resolve
                 clearRejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *listError;
  NSArray<NSDictionary *> *owned = [self attributesForSource:RingSourceApp error:&listError];
  if (owned == nil) {
    [self reject:reject error:listError fallbackCode:@"clear_failed"];
    return;
  }
  for (NSDictionary *attributes in owned) {
    NSError *deleteError;
    if (![self deleteAccount:attributes[(__bridge id)kSecAttrAccount] error:&deleteError]) {
      [self reject:reject error:deleteError fallbackCode:@"clear_failed"];
      return;
    }
  }
  resolve(nil);
}

RCT_REMAP_METHOD(list,
                 listResolver:(RCTPromiseResolveBlock)resolve
                 listRejecter:(RCTPromiseRejectBlock)reject)
{
  if (![self isBitkitInstalled]) {
    resolve(@{ @"available" : @NO, @"identities" : @[] });
    return;
  }

  NSError *error;
  NSArray<NSDictionary *> *attributes = [self attributesForSource:BitkitSourceApp error:&error];
  if (attributes == nil) {
    [self reject:reject error:error fallbackCode:@"list_failed"];
    return;
  }

  NSMutableArray<NSDictionary *> *identities = [NSMutableArray array];
  NSMutableSet<NSString *> *seen = [NSMutableSet set];
  for (NSDictionary *item in attributes) {
    NSString *account = item[(__bridge id)kSecAttrAccount];
    NSString *prefix = [NSString stringWithFormat:@"%@:", BitkitSourceApp];
    if (![account hasPrefix:prefix]) {
      continue;
    }
    NSString *pubky = [self normalizedPubky:[account substringFromIndex:prefix.length]];
    if (pubky.length == 0 || [seen containsObject:pubky]) {
      continue;
    }
    [seen addObject:pubky];
    [identities addObject:@{
      @"version" : @(SharedPubkyProtocolVersion),
      @"sourceApp" : BitkitSourceApp,
      @"pubky" : pubky,
    }];
  }
  [identities sortUsingComparator:^NSComparisonResult(NSDictionary *left, NSDictionary *right) {
    return [left[@"pubky"] compare:right[@"pubky"]];
  }];
  resolve(@{ @"available" : @YES, @"identities" : identities });
}

RCT_REMAP_METHOD(credential,
                 credentialPubky:(NSString *)pubky
                 credentialResolver:(RCTPromiseResolveBlock)resolve
                 credentialRejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *normalized = [self normalizedPubky:pubky];
  if (normalized.length == 0 || ![self isBitkitInstalled]) {
    reject(@"credential_unavailable", @"Shared Pubky credential is unavailable", nil);
    return;
  }

  NSError *error;
  NSDictionary *payload =
      [self payloadForAccount:[self accountForSource:BitkitSourceApp pubky:normalized] error:&error];
  if (payload == nil) {
    [self reject:reject error:error fallbackCode:@"credential_unavailable"];
    return;
  }
  if (![self isValidPayload:payload expectedSource:BitkitSourceApp expectedPubky:normalized]) {
    reject(@"invalid_credential", @"Shared Pubky credential is invalid", nil);
    return;
  }
  resolve(payload);
}

RCT_REMAP_METHOD(privateServices,
                 privateServicesResolver:(RCTPromiseResolveBlock)resolve
                 privateServicesRejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *accessGroup = [self privateAccessGroup];
  if (accessGroup.length == 0) {
    reject(@"private_keychain_unavailable", @"Private keychain access group is unavailable", nil);
    return;
  }
  NSDictionary *query = @{
    (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrAccessGroup : accessGroup,
    (__bridge id)kSecReturnAttributes : @YES,
    (__bridge id)kSecMatchLimit : (__bridge id)kSecMatchLimitAll,
  };
  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status == errSecItemNotFound) {
    resolve(@[]);
    return;
  }
  if (status != errSecSuccess) {
    NSError *error;
    [self setError:&error status:status];
    reject(@"private_keychain_unavailable", error.localizedDescription, error);
    return;
  }
  NSArray<NSDictionary *> *attributes = CFBridgingRelease(result);
  NSMutableOrderedSet<NSString *> *services = [NSMutableOrderedSet orderedSet];
  for (NSDictionary *item in attributes) {
    NSString *service = item[(__bridge id)kSecAttrService];
    if ([service isKindOfClass:NSString.class] && service.length > 0) {
      [services addObject:service];
    }
  }
  resolve(services.array);
}

- (NSString *)privateAccessGroup
{
  NSString *value = NSBundle.mainBundle.infoDictionary[@"PubkyPrivateKeychainAccessGroup"];
  return [value isKindOfClass:NSString.class] && ![value containsString:@"$("] ? value : nil;
}

- (NSString *)sharedAccessGroup
{
  NSString *value = NSBundle.mainBundle.infoDictionary[@"PubkySharedKeychainAccessGroup"];
  return [value isKindOfClass:NSString.class] && ![value containsString:@"$("] ? value : nil;
}

- (NSString *)normalizedPubky:(id)value
{
  if (![value isKindOfClass:NSString.class]) {
    return @"";
  }
  NSString *pubky = [(NSString *)value stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
  if (pubky.length == 57 && [pubky hasPrefix:@"pubky"]) {
    pubky = [pubky substringFromIndex:5];
  }
  if (pubky.length != 52) {
    return @"";
  }
  static NSCharacterSet *invalidCharacters;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    invalidCharacters =
        [[NSCharacterSet characterSetWithCharactersInString:@"ybndrfg8ejkmcpqxot1uwisza345h769"] invertedSet];
  });
  if ([pubky rangeOfCharacterFromSet:invalidCharacters].location != NSNotFound) {
    return @"";
  }
  return pubky;
}

- (NSString *)accountForSource:(NSString *)source pubky:(NSString *)pubky
{
  return [NSString stringWithFormat:@"%@:%@", source, pubky];
}

- (BOOL)isValidSecretKey:(id)value
{
  if (![value isKindOfClass:NSString.class] || [(NSString *)value length] != 64) {
    return NO;
  }
  static NSCharacterSet *invalidCharacters;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    invalidCharacters =
        [[NSCharacterSet characterSetWithCharactersInString:@"0123456789abcdef"] invertedSet];
  });
  return [(NSString *)value rangeOfCharacterFromSet:invalidCharacters].location == NSNotFound;
}

- (NSMutableDictionary *)baseQueryForAccount:(NSString *)account
{
  NSString *accessGroup = [self sharedAccessGroup];
  if (accessGroup.length == 0) {
    return nil;
  }
  NSMutableDictionary *query = [@{
    (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService : SharedPubkyService,
    (__bridge id)kSecAttrAccessGroup : accessGroup,
    (__bridge id)kSecAttrSynchronizable : @NO,
  } mutableCopy];
  if (account != nil) {
    query[(__bridge id)kSecAttrAccount] = account;
  }
  return query;
}

- (BOOL)upsertPayload:(NSDictionary *)payload account:(NSString *)account error:(NSError **)error
{
  NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:0 error:error];
  if (data == nil) {
    return NO;
  }
  NSMutableDictionary *query = [self baseQueryForAccount:account];
  if (query == nil) {
    [self setMissingEntitlementError:error];
    return NO;
  }
  NSDictionary *updates = @{
    (__bridge id)kSecValueData : data,
    (__bridge id)kSecAttrAccessible : (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
  };
  OSStatus status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)updates);
  if (status == errSecItemNotFound) {
    [query addEntriesFromDictionary:updates];
    status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);
  }
  if (status != errSecSuccess) {
    [self setError:error status:status];
    return NO;
  }

  NSError *readError;
  NSDictionary *stored = [self payloadForAccount:account error:&readError];
  if (stored == nil || ![stored isEqualToDictionary:payload]) {
    if (error != NULL) {
      *error = readError ?: [NSError errorWithDomain:NSOSStatusErrorDomain
                                                 code:errSecDecode
                                             userInfo:@{NSLocalizedDescriptionKey : @"Shared keychain read-back failed"}];
    }
    return NO;
  }
  return YES;
}

- (NSDictionary *)payloadForAccount:(NSString *)account error:(NSError **)error
{
  NSMutableDictionary *query = [self baseQueryForAccount:account];
  if (query == nil) {
    [self setMissingEntitlementError:error];
    return nil;
  }
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status != errSecSuccess) {
    [self setError:error status:status];
    return nil;
  }
  NSData *data = CFBridgingRelease(result);
  id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:error];
  return [json isKindOfClass:NSDictionary.class] ? json : nil;
}

- (NSArray<NSDictionary *> *)attributesForSource:(NSString *)source error:(NSError **)error
{
  NSMutableDictionary *query = [self baseQueryForAccount:nil];
  if (query == nil) {
    [self setMissingEntitlementError:error];
    return nil;
  }
  query[(__bridge id)kSecReturnAttributes] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitAll;
  CFTypeRef result = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (status == errSecItemNotFound) {
    return @[];
  }
  if (status != errSecSuccess) {
    [self setError:error status:status];
    return nil;
  }
  NSArray<NSDictionary *> *all = CFBridgingRelease(result);
  NSString *prefix = [NSString stringWithFormat:@"%@:", source];
  return [all filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSDictionary *item, id _) {
    NSString *account = item[(__bridge id)kSecAttrAccount];
    return [account isKindOfClass:NSString.class] && [account hasPrefix:prefix];
  }]];
}

- (BOOL)deleteAccount:(NSString *)account error:(NSError **)error
{
  if (account.length == 0) {
    return YES;
  }
  NSMutableDictionary *query = [self baseQueryForAccount:account];
  if (query == nil) {
    [self setMissingEntitlementError:error];
    return NO;
  }
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
  if (status != errSecSuccess && status != errSecItemNotFound) {
    [self setError:error status:status];
    return NO;
  }
  CFTypeRef result = NULL;
  status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
  if (result != NULL) {
    CFRelease(result);
  }
  if (status != errSecItemNotFound) {
    [self setError:error status:status == errSecSuccess ? errSecDuplicateItem : status];
    return NO;
  }
  return YES;
}

- (BOOL)isValidPayload:(NSDictionary *)payload
        expectedSource:(NSString *)source
         expectedPubky:(NSString *)pubky
{
  id version = payload[@"version"];
  BOOL isIntegerVersion =
      [version isKindOfClass:NSNumber.class] &&
      CFGetTypeID((__bridge CFTypeRef)version) == CFNumberGetTypeID() &&
      !CFNumberIsFloatType((__bridge CFNumberRef)version);
  return isIntegerVersion &&
      [version integerValue] == SharedPubkyProtocolVersion &&
      [payload[@"sourceApp"] isEqualToString:source] &&
      [payload[@"pubky"] isKindOfClass:NSString.class] &&
      [payload[@"pubky"] isEqualToString:pubky] &&
      [self isValidSecretKey:payload[@"secretKey"]];
}

- (BOOL)isBitkitInstalled
{
  // URL-scheme presence is only a UX availability hint; it is not an app identity proof.
  // The shared Keychain entitlement and strict source-owned payload validation are the trust boundary.
  __block BOOL installed = NO;
  void (^check)(void) = ^{
    installed = [UIApplication.sharedApplication canOpenURL:[NSURL URLWithString:@"bitkit://"]];
  };
  if (NSThread.isMainThread) {
    check();
  } else {
    dispatch_sync(dispatch_get_main_queue(), check);
  }
  return installed;
}

- (void)setMissingEntitlementError:(NSError **)error
{
  [self setError:error status:errSecMissingEntitlement];
}

- (void)setError:(NSError **)error status:(OSStatus)status
{
  if (error != NULL) {
    NSString *message = CFBridgingRelease(SecCopyErrorMessageString(status, NULL)) ?: @"Keychain operation failed";
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain
                                code:status
                            userInfo:@{NSLocalizedDescriptionKey : message}];
  }
}

- (void)reject:(RCTPromiseRejectBlock)reject
         error:(NSError *)error
  fallbackCode:(NSString *)fallbackCode
{
  NSString *code = error.code == errSecMissingEntitlement ? @"sharing_unavailable" : fallbackCode;
  reject(code, error.localizedDescription ?: @"Shared Pubky operation failed", error);
}

@end
