/* eslint-disable no-bitwise */
import { createPrivateKey, createPublicKey } from 'crypto';
import * as bip39 from 'bip39';

/**
 * Published BIP39 test mnemonic (not a real account). Frozen in the August 2026
 * Ring custody review and re-asserted here so JS-side derivation cannot drift
 * from the documented Ring/FFI contract.
 */
const MNEMONIC =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const EXPECTED_SEED_PREFIX_HEX = '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1';
const EXPECTED_PUBLIC_KEY_HEX = 'c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a';
const EXPECTED_PUBKY_Z32 = 'aihfhgdfshrj8nz9ofo7khayc1mgcqa4wrrdjahs5tmgo4pna3iy';

const Z32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769';

const z32encode = (bytes: Uint8Array): string => {
	let bits = 0;
	let value = 0;
	let out = '';
	for (const b of bytes) {
		value = (value << 8) | b;
		bits += 8;
		while (bits >= 5) {
			out += Z32_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) {
		out += Z32_ALPHABET[(value << (5 - bits)) & 31];
	}
	return out;
};

const ed25519PublicKeyFromSeed = (seed: Buffer): Buffer => {
	const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
	const privateKey = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
	const spki = createPublicKey(privateKey).export({ type: 'spki', format: 'der' }) as Buffer;
	return spki.subarray(spki.length - 32);
};

describe('R3 BIP39 derivation vector', () => {
	it('maps the published 12-word mnemonic to the Ring z-base-32 pubky', () => {
		const seed = bip39.mnemonicToSeedSync(MNEMONIC).subarray(0, 32);
		expect(seed.toString('hex')).toBe(EXPECTED_SEED_PREFIX_HEX);

		const publicKey = ed25519PublicKeyFromSeed(seed);
		expect(publicKey.toString('hex')).toBe(EXPECTED_PUBLIC_KEY_HEX);
		expect(z32encode(publicKey)).toBe(EXPECTED_PUBKY_Z32);
	});
});
