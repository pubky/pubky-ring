# Input formats

This is an integration reference for Ring's links, QR scanner, and clipboard input. For installation and ordinary use, see the [README](../README.md).

Both platforms register the `pubkyring://` and `pubkyauth://` URL schemes. Parsing is handled by [inputParser.ts](../src/utils/inputParser.ts), using the native Pubky SDK's `parseDeepLink` for authentication links. [Parser tests](../__tests__/inputParser.test.ts) cover compatibility cases.

## Links

The examples below use placeholders. Query parameter values, including nested URLs and capabilities, must be URL-encoded.

| Purpose                       | Form                                                                                                     | Behavior                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Legacy app authorization      | `pubkyauth:///?relay={url}&secret={relay-secret}&caps={capabilities}`                                    | Review an app's requested access.                                                                                               |
| Sign in                       | `pubkyauth://signin?relay={url}&secret={relay-secret}&caps={capabilities}`                               | Authorize with an existing identity. The `pubkyring://signin` alias is normalized to this form.                                 |
| Signup with app authorization | `pubkyauth://signup?hs={server-key}&relay={url}&secret={relay-secret}&caps={capabilities}[&st={invite}]` | Signup and app authorization. The `pubkyring://signup` alias is also accepted.                                                  |
| Direct signup                 | `pubkyauth://direct_signup?hs={server-key}[&st={invite}]`                                                | Signup without authorizing an app. Setup's invite scanner/paste action populates a draft for the current pubky.                 |
| Legacy direct signup          | `pubkyauth://signup?hs={server-key}[&st={invite}]`                                                       | Without a usable auth relay transport, a signup link is treated as direct signup.                                               |
| Grant authorization           | `pubkyauth://signin_grant?...` or `pubkyauth://signup_grant?...`                                         | SDK-generated grant requests, including client identity and signed-approval support.                                            |
| Secret export                 | `pubkyring://secret_export?secret={identity-secret}`                                                     | Import a secret exported through the native SDK link format.                                                                    |
| Migration frame               | `pubkyring://migrate?index={n}&total={count}&key={key-material}`                                         | Import a frame from a multi-key migration QR. `index` is zero-based; `key` contains the exported recovery phrase or secret key. |
| Invite                        | `pubkyring://invite/XXXX-XXXX-XXXX`                                                                      | Extract an invite code.                                                                                                         |

For auth requests, `secret` is the relay transport secret, not the identity's private key. Secret-export and migration links, by contrast, contain identity recovery material.

Prefer SDK-generated auth links to manually assembled URLs. Grant links carry fields such as `cid` (client ID), `cpk` (client public key), and, for signed approval, `af=v1` with `epk` (ephemeral public key). A request needs a relay plus either a transport secret, or signed-approval transport with an ephemeral public key. `signup_grant` also identifies its homeserver with `hs`; `st` remains optional in the URL, subject to server policy.

A `signin_grant` request can include `spk`, restricting approval to the specified signer. Ring validates this field against the requested public key rather than letting the user authorize it with another identity. See [expectedSigner.ts](../src/utils/expectedSigner.ts) for validation.

### Callbacks

Ring supports the native parser's `x-source`, `x-success`, `x-error`, and `x-cancel` parameters. For legacy invite URLs, `callback` is a fallback for `x-success`. Encode nested callback URLs as a single query value so their inner `?`, `&`, and `=` characters survive parsing.

### Setup versus app authorization

Recognizing a format does not mean every screen accepts its action. Setup's homeserver invite scanner and paste action accept direct-signup links and invites; they reject requests that would also authorize an app. [homeserverSignupInput.ts](../src/utils/homeserverSignupInput.ts) implements this restriction. General authorization links use the app authorization flow instead.

## Clipboard and QR input

The shared parser recognizes:

- Invite codes in the `XXXX-XXXX-XXXX` form, or in URL paths containing `/invite/XXXX-XXXX-XXXX`.
- Valid recovery phrases and secret-key strings accepted by the SDK.
- The links above, including multi-frame migration QR data.

Encrypted `.pkarr` recovery files are selected through the file import flow and decrypted with a passphrase. They are not pasted as arbitrary encrypted text into the shared parser.

Recovery-phrase input is trimmed, URL-decoded where applicable, and normalizes hyphens, underscores, and plus signs to spaces before validation. The parser also retries twelve-word recovery phrases in lowercase.

Custom homeservers can define opaque invite-token formats. In setup, an otherwise unrecognized plain token can be accepted for the selected custom server; Ring trims surrounding whitespace while preserving its case, punctuation, and internal spaces. This fallback does not apply to arbitrary URLs or to Synonym's invite format.

## Parsing order

The current shared parser processes input in this order:

1. Trim and decode the input.
2. Recognize Ring migration frames.
3. Ask the native SDK to parse auth, signup, direct-signup, grant, or secret-export links.
4. Extract invites from URL paths, then check standalone invite codes.
5. Validate recovery phrases or secret keys, including the lowercase twelve-word retry.
6. Return Unknown when nothing matches.

Screen-specific validation then decides whether the parsed action is appropriate. The custom-server invite-token fallback happens at that stage, not in the shared parser.
