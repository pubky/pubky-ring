#import <Foundation/Foundation.h>
#import <Security/Security.h>

static void Check(BOOL condition, NSString *message, int line)
{
  if (!condition) {
    fprintf(stderr, "FAIL line %d: %s\n", line, message.UTF8String);
    exit(1);
  }
}
#define CHECK(condition, message) Check((condition), (message), __LINE__)
#define K(value) ((__bridge id)(value))

static NSString *const PrivateGroup = @"TEST.app.pubkyring";
static NSString *const SharedGroup = @"TEST.pubky.shared";
static NSString *ExpectedGroup;
static NSMutableArray<NSDictionary *> *Rows;
static NSMutableArray<NSDictionary *> *Operations;
static NSUInteger FailAt;
static OSStatus FailureStatus;
static NSUInteger Mutations;
static BOOL CorruptReadAfterWrite;
static BOOL IgnoreDelete;
static id ReadOverride;
static NSUInteger ReadOverrideAt;

static BOOL Matches(NSDictionary *row, NSDictionary *query)
{
  for (id key in @[K(kSecClass), K(kSecAttrAccessGroup), K(kSecAttrService), K(kSecAttrAccount)]) {
    if (query[key] != nil && ![row[key] isEqual:query[key]]) return NO;
  }
  id sync = query[K(kSecAttrSynchronizable)] ?: @NO;
  return [sync isEqual:K(kSecAttrSynchronizableAny)] || [row[K(kSecAttrSynchronizable)] isEqual:sync];
}

static OSStatus Before(NSString *operation, NSDictionary *query)
{
  CHECK([query[K(kSecClass)] isEqual:K(kSecClassGenericPassword)], @"Every operation must target generic passwords");
  CHECK([query[K(kSecAttrAccessGroup)] isEqual:ExpectedGroup], @"Every operation must explicitly target the expected access group");
  [Operations addObject:@{@"operation": operation, @"query": [query copy]}];
  return FailAt == Operations.count ? FailureStatus : errSecSuccess;
}

static OSStatus FakeSecItemCopyMatching(CFDictionaryRef rawQuery, CFTypeRef *result)
{
  NSDictionary *query = (__bridge NSDictionary *)rawQuery;
  OSStatus status = Before(@"read", query);
  if (status != errSecSuccess) return status;
  if (ReadOverride != nil && (ReadOverrideAt == 0 || ReadOverrideAt == Operations.count)) {
    if (result != NULL) *result = CFBridgingRetain(ReadOverride);
    ReadOverride = nil;
    return errSecSuccess;
  }
  NSMutableArray *matches = [NSMutableArray array];
  for (NSDictionary *row in Rows) {
    if (!Matches(row, query)) continue;
    NSMutableDictionary *value = [row mutableCopy];
    if (![query[K(kSecReturnData)] boolValue]) [value removeObjectForKey:K(kSecValueData)];
    if (CorruptReadAfterWrite && Mutations > 0 && [query[K(kSecReturnData)] boolValue]) {
      value[K(kSecValueData)] = [@"injected-readback-corruption" dataUsingEncoding:NSUTF8StringEncoding];
      CorruptReadAfterWrite = NO;
    }
    [matches addObject:[query[K(kSecReturnAttributes)] boolValue] ? value : (value[K(kSecValueData)] ?: @{})];
  }
  if (matches.count == 0) return errSecItemNotFound;
  id value = [query[K(kSecMatchLimit)] isEqual:K(kSecMatchLimitAll)] ? matches : matches.firstObject;
  if (result != NULL) *result = CFBridgingRetain(value);
  return errSecSuccess;
}

static OSStatus FakeSecItemAdd(CFDictionaryRef rawAttributes, CFTypeRef *result)
{
  NSDictionary *attributes = (__bridge NSDictionary *)rawAttributes;
  OSStatus status = Before(@"add", attributes);
  if (status != errSecSuccess) return status;
  for (NSDictionary *row in Rows) {
    if (Matches(row, attributes)) return errSecDuplicateItem;
  }
  [Rows addObject:[attributes mutableCopy]];
  Mutations++;
  return errSecSuccess;
}

static OSStatus FakeSecItemDelete(CFDictionaryRef rawQuery)
{
  NSDictionary *query = (__bridge NSDictionary *)rawQuery;
  OSStatus status = Before(@"delete", query);
  if (status != errSecSuccess) return status;
  NSIndexSet *matches = [Rows indexesOfObjectsPassingTest:^BOOL(NSDictionary *row, NSUInteger index, BOOL *stop) {
    return Matches(row, query);
  }];
  if (matches.count == 0) return errSecItemNotFound;
  if (IgnoreDelete) {
    IgnoreDelete = NO;
    return errSecSuccess;
  }
  [Rows removeObjectsAtIndexes:matches];
  Mutations++;
  return errSecSuccess;
}

static OSStatus FakeSecItemUpdate(CFDictionaryRef rawQuery, CFDictionaryRef rawUpdates)
{
  NSDictionary *query = (__bridge NSDictionary *)rawQuery;
  OSStatus status = Before(@"update", query);
  if (status != errSecSuccess) return status;
  BOOL found = NO;
  for (NSMutableDictionary *row in Rows) {
    if (Matches(row, query)) {
      [row addEntriesFromDictionary:(__bridge NSDictionary *)rawUpdates];
      found = YES;
      Mutations++;
    }
  }
  return found ? errSecSuccess : errSecItemNotFound;
}

// Include production control flow; no copied migration implementation.
#define SecItemCopyMatching FakeSecItemCopyMatching
#define SecItemAdd FakeSecItemAdd
#define SecItemDelete FakeSecItemDelete
#define SecItemUpdate FakeSecItemUpdate
#import "../../ios/pubkyring/SharedPubky.m"
#undef SecItemCopyMatching
#undef SecItemAdd
#undef SecItemDelete
#undef SecItemUpdate

@implementation UIApplication
+ (UIApplication *)sharedApplication { return [UIApplication new]; }
- (BOOL)canOpenURL:(NSURL *)url { return YES; }
@end

@interface TestSharedPubky : SharedPubky
@property(nonatomic) BOOL missingGroup;
@property(nonatomic) BOOL missingBitkit;
@end
@implementation TestSharedPubky
- (NSString *)privateAccessGroup { return self.missingGroup ? nil : PrivateGroup; }
- (NSString *)sharedAccessGroup { return self.missingGroup ? nil : SharedGroup; }
- (BOOL)isBitkitInstalled { return !self.missingBitkit; }
@end

static NSMutableDictionary *Record(NSString *service, NSString *account, BOOL sync, NSString *value)
{
  return [@{
    K(kSecClass): K(kSecClassGenericPassword),
    K(kSecAttrAccessGroup): PrivateGroup,
    K(kSecAttrService): service,
    K(kSecAttrAccount): account,
    K(kSecAttrSynchronizable): @(sync),
    K(kSecAttrAccessible): K(kSecAttrAccessibleAfterFirstUnlock),
    K(kSecValueData): [value dataUsingEncoding:NSUTF8StringEncoding],
  } mutableCopy];
}

static void Reset(NSArray<NSDictionary *> *records)
{
  ExpectedGroup = PrivateGroup;
  Rows = [NSMutableArray array];
  for (NSDictionary *row in records) [Rows addObject:[row mutableCopy]];
  Operations = [NSMutableArray array];
  FailAt = 0;
  FailureStatus = errSecInteractionNotAllowed;
  Mutations = 0;
  CorruptReadAfterWrite = NO;
  IgnoreDelete = NO;
  ReadOverride = nil;
  ReadOverrideAt = 0;
}

static NSString *Value(TestSharedPubky *module, NSString *service, BOOL succeeds)
{
  __block NSString *value;
  __block NSUInteger resolved = 0, rejected = 0;
  [module privateValueService:service
         privateValueResolver:^(id result) { value = result; resolved++; }
         privateValueRejecter:^(NSString *code, NSString *message, NSError *error) { rejected++; }];
  CHECK(resolved + rejected == 1 && (resolved == 1) == succeeds, @"Private reads must preserve success/error distinction");
  return value;
}

static BOOL SetValue(TestSharedPubky *module, NSString *service, NSString *value)
{
  __block NSUInteger resolved = 0, rejected = 0;
  [module setPrivateValueService:service value:value
            setPrivateValueResolver:^(id result) { resolved++; }
            setPrivateValueRejecter:^(NSString *code, NSString *message, NSError *error) { rejected++; }];
  CHECK(resolved + rejected == 1, @"Private writes must settle exactly once");
  return resolved == 1;
}

static BOOL DeleteValue(TestSharedPubky *module, NSString *service)
{
  __block NSUInteger resolved = 0, rejected = 0;
  [module resetPrivateValueService:service
              resetPrivateValueResolver:^(id result) { resolved++; }
              resetPrivateValueRejecter:^(NSString *code, NSString *message, NSError *error) { rejected++; }];
  CHECK(resolved + rejected == 1, @"Private deletion must settle exactly once");
  return resolved == 1;
}

static NSArray *Services(TestSharedPubky *module, BOOL succeeds)
{
  __block NSArray *services;
  __block NSUInteger resolved = 0, rejected = 0;
  [module privateServicesResolver:^(id value) { services = value; resolved++; }
          privateServicesRejecter:^(NSString *code, NSString *message, NSError *error) { rejected++; }];
  CHECK(resolved + rejected == 1 && (resolved == 1) == succeeds, @"Enumeration must preserve success/error distinction");
  return services;
}

static void CheckRecoverable(NSArray<NSDictionary *> *originals)
{
  for (NSDictionary *original in originals) {
    BOOL found = NO;
    for (NSDictionary *row in Rows) {
      if ([row[K(kSecAttrAccessGroup)] isEqual:original[K(kSecAttrAccessGroup)]] &&
          [row[K(kSecAttrService)] isEqual:original[K(kSecAttrService)]] &&
          [row[K(kSecAttrAccount)] isEqual:original[K(kSecAttrAccount)]] &&
          [row[K(kSecValueData)] isEqual:original[K(kSecValueData)]]) found = YES;
    }
    CHECK(found, @"Every original value must remain recoverable in at least one synchronization mode");
  }
}

static void CheckOnlyRead(void)
{
  CHECK(Mutations == 0, @"Reads must never normalize, delete, or rewrite existing records");
  for (NSDictionary *operation in Operations) {
    CHECK([operation[@"operation"] isEqual:@"read"], @"Read paths must never attempt mutation");
  }
}

static id SharedResult(TestSharedPubky *module, NSString *pubky, NSString *expectedError)
{
  __block id result;
  __block NSString *errorCode;
  __block NSUInteger resolved = 0, rejected = 0;
  RCTPromiseResolveBlock resolve = ^(id value) { result = value; resolved++; };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) { errorCode = code; rejected++; };
  if (pubky == nil) [module listResolver:resolve listRejecter:reject];
  else [module credentialPubky:pubky credentialResolver:resolve credentialRejecter:reject];
  CHECK(resolved + rejected == 1, @"Shared reads must settle exactly once");
  CHECK(expectedError == nil ? resolved == 1 : (rejected == 1 && [errorCode isEqual:expectedError]),
        @"Shared reads must distinguish source loss from temporary failure");
  return result;
}

static void CheckSharedReadFailures(TestSharedPubky *module)
{
  NSString *pubky = [@"y" stringByPaddingToLength:52 withString:@"y" startingAtIndex:0];
  NSString *secretKey = [@"a" stringByPaddingToLength:64 withString:@"a" startingAtIndex:0];
  NSDictionary *payload = @{@"version": @1, @"sourceApp": @"to.bitkit", @"pubky": pubky, @"secretKey": secretKey};
  NSMutableDictionary *record = Record(@"pubky.identity-sharing.v1", [@"to.bitkit:" stringByAppendingString:pubky], NO, @"");
  record[K(kSecAttrAccessGroup)] = SharedGroup;
  record[K(kSecValueData)] = [NSJSONSerialization dataWithJSONObject:payload options:0 error:nil];

  Reset(@[]);
  ExpectedGroup = SharedGroup;
  SharedResult(module, pubky, @"credential_missing");
  CHECK(([SharedResult(module, nil, nil) isEqual:@{@"available": @YES, @"identities": @[]}]), @"An installed but empty source must resolve an available empty listing");
  CheckOnlyRead();

  for (NSNumber *status in @[@(errSecInteractionNotAllowed), @(errSecAuthFailed), @(errSecNotAvailable), @(errSecMissingEntitlement)]) {
    Reset(@[record]);
    ExpectedGroup = SharedGroup;
    FailureStatus = status.intValue;
    BOOL missingEntitlement = FailureStatus == errSecMissingEntitlement;
    FailAt = Operations.count + 1;
    SharedResult(module, pubky, missingEntitlement ? @"sharing_unavailable" : @"credential_failed");
    FailAt = Operations.count + 1;
    SharedResult(module, nil, missingEntitlement ? @"sharing_unavailable" : @"list_failed");
    FailAt = 0;
    CHECK([SharedResult(module, pubky, nil) isEqual:payload], @"Credential reads must recover after temporary failures");
    NSDictionary *discovery = SharedResult(module, nil, nil);
    CHECK([discovery[@"available"] boolValue] && [discovery[@"identities"] count] == 1, @"Discovery must recover after temporary failures");
    CheckOnlyRead();
    CheckRecoverable(@[record]);
  }

  for (NSString *json in @[@"[]", @"{}", @"not-json"]) {
    NSMutableDictionary *malformed = [record mutableCopy];
    malformed[K(kSecValueData)] = [json dataUsingEncoding:NSUTF8StringEncoding];
    Reset(@[malformed]);
    ExpectedGroup = SharedGroup;
    SharedResult(module, pubky, [json isEqual:@"not-json"] ? @"credential_failed" : @"invalid_credential");
    CheckOnlyRead();
  }

  Reset(@[record]);
  ExpectedGroup = SharedGroup;
  module.missingBitkit = YES;
  SharedResult(module, pubky, @"source_unavailable");
  CHECK(([SharedResult(module, nil, nil) isEqual:@{@"available": @NO, @"identities": @[]}]), @"Confirmed source absence must resolve unavailable");
  CHECK(Operations.count == 0, @"An absent source must not read leftover shared credentials");
  module.missingBitkit = NO;
  module.missingGroup = YES;
  SharedResult(module, pubky, @"sharing_unavailable");
  SharedResult(module, nil, @"sharing_unavailable");
  CHECK(Operations.count == 0, @"Missing entitlement must prevent unscoped reads");
  module.missingGroup = NO;
  SharedResult(module, @"invalid", @"invalid_credential");
  CHECK(Operations.count == 0, @"An invalid pubky must reject before Keychain access");
}

int main(void)
{
  @autoreleasepool {
    TestSharedPubky *module = [TestSharedPubky new];
    CheckSharedReadFailures(module);
    Reset(@[]);
    CHECK([Services(module, YES) isEqual:@[]], @"Empty enumeration returns an empty list");
    CHECK(Value(module, @"missing", YES) == nil, @"An absent private value resolves null");
    CHECK(DeleteValue(module, @"missing"), @"Deleting a missing value is idempotent");

    NSMutableDictionary *local = Record(@"owned-local", @"owned-local", NO, @"local-fixture");
    local[K(kSecAttrAccessible)] = K(kSecAttrAccessibleWhenUnlockedThisDeviceOnly);
    local[K(kSecAttrLabel)] = @"existing-label";
    NSDictionary *synced = Record(@"owned-synced", @"legacy-account", YES, @"synced-fixture");
    NSDictionary *session = Record(@"pubky-session:fixture:session", @"pubky-session:fixture:session", YES, @"session-fixture");
    NSArray *originals = @[local, synced, session];
    Reset(originals);
    CHECK([Services(module, YES) count] == 3, @"Private enumeration includes identities and sessions");
    CHECK([Value(module, @"owned-local", YES) isEqual:@"local-fixture"], @"Existing non-synchronizable identity remains readable");
    CHECK([Value(module, @"owned-synced", YES) isEqual:@"synced-fixture"], @"Legacy synchronizable identity remains readable");
    CHECK([Value(module, @"pubky-session:fixture:session", YES) isEqual:@"session-fixture"], @"Legacy session remains readable");
    CheckOnlyRead();
    CHECK([Rows isEqual:originals], @"Mixed-mode reads must retain every original attribute");

    NSMutableDictionary *equalLocal = [synced mutableCopy];
    equalLocal[K(kSecAttrSynchronizable)] = @NO;
    equalLocal[K(kSecAttrAccessible)] = K(kSecAttrAccessibleWhenUnlockedThisDeviceOnly);
    Reset(@[synced, equalLocal]);
    CHECK([Value(module, @"owned-synced", YES) isEqual:@"synced-fixture"], @"Equal duplicates remain readable");
    CHECK(Rows.count == 2, @"Reads must not consolidate equal duplicates");
    CheckOnlyRead();

    NSMutableDictionary *conflict = [equalLocal mutableCopy];
    conflict[K(kSecValueData)] = [@"different-fixture" dataUsingEncoding:NSUTF8StringEncoding];
    Reset(@[session, synced, conflict]);
    NSArray *before = [Rows copy];
    Value(module, @"owned-synced", NO);
    CHECK(!SetValue(module, @"owned-synced", @"replacement"), @"Conflicting copies must not be overwritten");
    CHECK(!DeleteValue(module, @"owned-synced"), @"Conflicting copies must not be implicitly selected or deleted");
    CHECK(Mutations == 0 && [Rows isEqual:before], @"Conflicts must preserve every record");

    NSMutableDictionary *otherAccount = [synced mutableCopy];
    otherAccount[K(kSecAttrAccount)] = @"another-account";
    Reset(@[session, synced, otherAccount]);
    Value(module, @"owned-synced", NO);
    CHECK(!SetValue(module, @"owned-synced", @"replacement") && Mutations == 0, @"Ambiguous accounts must fail before writes");
    CheckRecoverable(@[session, synced, otherAccount]);

    Reset(@[synced, synced]);
    Value(module, @"owned-synced", NO);
    CHECK(!SetValue(module, @"owned-synced", @"replacement") && Mutations == 0, @"Repeated synchronization modes must reject ambiguous results");

    // Update in-place: synchronization, accessibility and unrelated metadata survive.
    for (NSArray *records in @[@[local], @[synced], @[synced, equalLocal], @[session]]) {
      NSString *service = records.firstObject[K(kSecAttrService)];
      Reset(records);
      CHECK(SetValue(module, service, @"replacement"), @"Existing records must update in place");
      CHECK(Rows.count == records.count, @"An update must retain both existing synchronization modes");
      for (NSUInteger index = 0; index < Rows.count; index++) {
        NSMutableDictionary *expected = [records[index] mutableCopy];
        expected[K(kSecValueData)] = [@"replacement" dataUsingEncoding:NSUTF8StringEncoding];
        CHECK([Rows[index] isEqual:expected], @"Updates must preserve all attributes other than value data");
      }
      for (NSDictionary *operation in Operations) {
        CHECK((![@[@"add", @"delete"] containsObject:operation[@"operation"]]), @"Existing updates must not delete and recreate records");
      }
    }

    Reset(@[]);
    CHECK(SetValue(module, @"new-identity", @"new-fixture"), @"New private records must be writable");
    CHECK(Rows.count == 1 && [Rows.firstObject[K(kSecAttrSynchronizable)] isEqual:@NO], @"New records must explicitly disable synchronization");
    CHECK([Rows.firstObject[K(kSecAttrAccount)] isEqual:@"new-identity"], @"New records must retain the service/account convention");
    CHECK([Rows.firstObject[K(kSecAttrAccessible)] isEqual:K(kSecAttrAccessibleAfterFirstUnlock)], @"New writes must retain existing accessibility behavior");
    CHECK(SetValue(module, @"new-identity", @"") && [Value(module, @"new-identity", YES) isEqual:@""], @"Native string storage must preserve empty-string semantics");

    // Inject every native failure point for new writes, legacy updates, and explicit deletion.
    NSUInteger injectedFailures = 0;
    for (NSString *action in @[@"new", @"update", @"delete"]) {
      NSArray *records = [action isEqual:@"new"] ? @[] : @[synced, equalLocal];
      Reset(records);
      CHECK([action isEqual:@"delete"] ? DeleteValue(module, @"owned-synced") : SetValue(module, @"owned-synced", @"replacement"), @"Baseline operation must succeed");
      NSUInteger count = Operations.count;
      for (NSUInteger step = 1; step <= count; step++) {
        Reset(records);
        FailAt = step;
        CHECK(!([action isEqual:@"delete"] ? DeleteValue(module, @"owned-synced") : SetValue(module, @"owned-synced", @"replacement")), @"Injected errors must fail closed");
        if (![action isEqual:@"delete"]) {
          CHECK(Rows.count >= records.count, @"Failed writes must not delete existing credentials");
        }
        FailAt = 0;
        CHECK([action isEqual:@"delete"] ? DeleteValue(module, @"owned-synced") : SetValue(module, @"owned-synced", @"replacement"), @"Retry after a native error must succeed");
        if ([action isEqual:@"delete"]) CHECK(Rows.count == 0, @"Explicit deletion must remove both modes");
        else CHECK([Value(module, @"owned-synced", YES) isEqual:@"replacement"], @"Retried writes must be readable");
        injectedFailures++;
      }
    }

    Reset(@[synced]);
    CorruptReadAfterWrite = YES;
    CHECK(!SetValue(module, @"owned-synced", @"replacement"), @"Write read-back mismatch must not be accepted");
    CHECK(Rows.count == 1 && [Rows.firstObject[K(kSecAttrSynchronizable)] isEqual:@YES], @"Read-back failure must not destroy or migrate the original record");
    CHECK(SetValue(module, @"owned-synced", @"replacement"), @"A read-back failure must be retryable");

    Reset(@[synced, equalLocal]);
    NSMutableDictionary *incompleteReadback = [synced mutableCopy];
    incompleteReadback[K(kSecValueData)] = [@"replacement" dataUsingEncoding:NSUTF8StringEncoding];
    ReadOverride = @[incompleteReadback];
    ReadOverrideAt = 3;
    CHECK(!SetValue(module, @"owned-synced", @"replacement"), @"Write verification must reject a changed record count");
    CHECK(Rows.count == 2, @"Incomplete read-back must not trigger compensating deletion");

    Reset(@[synced, equalLocal]);
    IgnoreDelete = YES;
    CHECK(!DeleteValue(module, @"owned-synced"), @"Deletion must be verified, not assumed from success status");
    CheckRecoverable(@[synced, equalLocal]);
    CHECK(DeleteValue(module, @"owned-synced") && Rows.count == 0, @"A failed deletion verification must be retryable");

    NSMutableDictionary *unrelated = [synced mutableCopy];
    unrelated[K(kSecAttrAccessGroup)] = @"TEST.pubky.shared";
    NSMutableDictionary *otherClass = [synced mutableCopy];
    otherClass[K(kSecClass)] = K(kSecClassInternetPassword);
    Reset(@[synced, unrelated, otherClass]);
    CHECK(SetValue(module, @"owned-synced", @"replacement"), @"Scoped updates must succeed");
    CHECK([Rows containsObject:unrelated] && [Rows containsObject:otherClass], @"Scoped updates must preserve unrelated records");
    CHECK([Services(module, YES) isEqual:@[@"owned-synced"]], @"Enumeration must remain private-group and class scoped");
    CHECK(DeleteValue(module, @"owned-synced"), @"Scoped deletion must succeed");
    CHECK(([Rows isEqual:@[unrelated, otherClass]]), @"Explicit deletion must preserve unrelated groups and classes");

    Reset(@[synced, equalLocal, session, unrelated]);
    NSArray *services = Services(module, YES);
    CHECK(services.count == 2 && [services containsObject:@"owned-synced"] &&
          [services containsObject:@"pubky-session:fixture:session"], @"Enumeration must see and deduplicate both synchronization modes");
    CHECK([Operations.lastObject[@"query"][K(kSecAttrSynchronizable)] isEqual:K(kSecAttrSynchronizableAny)], @"Enumeration must explicitly query both synchronization modes");
    CHECK(Operations.lastObject[@"query"][K(kSecReturnData)] == nil, @"Service enumeration must not request private values");
    FailAt = Operations.count + 1;
    Services(module, NO);
    CHECK(Mutations == 0, @"Enumeration must not mutate records or hide a read failure");

    // Successful OSStatus with malformed attributes must never become an empty vault.
    for (id malformed in @[@[], @{}, @[@{}]]) {
      Reset(originals);
      ReadOverride = malformed;
      Services(module, NO);
      CheckOnlyRead();
    }

    for (id attribute in @[K(kSecAttrAccount), K(kSecAttrService), K(kSecAttrAccessGroup), K(kSecAttrSynchronizable), K(kSecValueData)]) {
      NSMutableDictionary *malformed = [synced mutableCopy];
      [malformed removeObjectForKey:attribute];
      Reset(@[synced]);
      ReadOverride = @[malformed];
      Value(module, @"owned-synced", NO);
      CheckOnlyRead();
    }
    for (id attribute in @[K(kSecAttrService), K(kSecAttrAccessGroup), K(kSecAttrSynchronizable)]) {
      NSMutableDictionary *malformed = [synced mutableCopy];
      malformed[attribute] = @"unexpected-attribute";
      Reset(@[synced]);
      ReadOverride = @[malformed];
      Value(module, @"owned-synced", NO);
      CheckOnlyRead();
    }
    NSMutableDictionary *invalidUTF8 = [synced mutableCopy];
    invalidUTF8[K(kSecValueData)] = [NSData dataWithBytes:"\xff" length:1];
    Reset(@[invalidUTF8]);
    Value(module, @"owned-synced", NO);
    CheckOnlyRead();

    for (id invalidService in @[@"", NSNull.null]) {
      Reset(originals);
      Value(module, invalidService, NO);
      CHECK(!SetValue(module, invalidService, @"replacement"), @"Invalid service must prevent writes");
      CHECK(!DeleteValue(module, invalidService), @"Invalid service must prevent deletion");
      CHECK(Operations.count == 0, @"Invalid service must reject before Keychain access");
    }
    Reset(originals);
    CHECK(!SetValue(module, @"owned-synced", nil) && Mutations == 0, @"A missing value must not overwrite existing data");

    Reset(@[synced]);
    FailAt = 1;
    Value(module, @"owned-synced", NO);
    CheckOnlyRead();
    FailAt = 0;
    CHECK([Value(module, @"owned-synced", YES) isEqual:@"synced-fixture"], @"Locked/unavailable reads must be retryable");
    for (NSNumber *status in @[@(errSecMissingEntitlement), @(errSecAuthFailed), @(errSecDecode)]) {
      Reset(@[synced]);
      FailAt = 1;
      FailureStatus = status.intValue;
      Value(module, @"owned-synced", NO);
      CheckOnlyRead();
    }

    Reset(originals);
    module.missingGroup = YES;
    Value(module, @"owned-synced", NO);
    CHECK(!SetValue(module, @"owned-synced", @"replacement"), @"Missing group must prevent writes");
    CHECK(!DeleteValue(module, @"owned-synced"), @"Missing group must prevent deletion");
    Services(module, NO);
    CHECK(Operations.count == 0, @"Missing group must never access an unscoped vault");

    printf("PASS native Keychain regression scenarios, including %lu injected-operation failures and retries\n", (unsigned long)injectedFailures);
  }
  return 0;
}
