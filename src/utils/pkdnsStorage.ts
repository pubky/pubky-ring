import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * The last signed packet seen or published per pubky, and when it was last
 * re-announced. The packet is public data; keeping it lets Ring restore
 * records if they drop off the DHT.
 */
let storage: MMKV | undefined;
const getStorage = (): MMKV => {
	storage ??= createMMKV({ id: 'pkdns' });
	return storage;
};

const packetKey = (pubky: string): string => `packet.${pubky}`;
const republishedAtKey = (pubky: string): string => `republishedAt.${pubky}`;

export const getStoredPacket = (pubky: string): string | undefined =>
	getStorage().getString(packetKey(pubky));

export const setStoredPacket = (pubky: string, signedPacket: string | null | undefined): void => {
	if (signedPacket) getStorage().set(packetKey(pubky), signedPacket);
};

export const getLastRepublishedAt = (pubky: string): number =>
	getStorage().getNumber(republishedAtKey(pubky)) ?? 0;

export const setLastRepublishedAt = (pubky: string, time: number): void => {
	getStorage().set(republishedAtKey(pubky), time);
};

export const clearPkdnsData = (pubky: string): void => {
	getStorage().remove(packetKey(pubky));
	getStorage().remove(republishedAtKey(pubky));
};
