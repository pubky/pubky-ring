import { getPubkySecretKey, truncatePubky } from './pubky';
import { assertNotAborted, requireDeviceAuthentication } from './deviceAuth';
import { getPubkyDataFromStore } from './store-helpers';
import i18n from '../i18n';
import type { IKeychainData } from '../types/pubky';

export const getSecretForExport = async (pubky: string, signal: AbortSignal): Promise<IKeychainData> => {
	await requireDeviceAuthentication(i18n.t('deviceAuth.export', { pubky: truncatePubky(pubky) }), signal);
	assertNotAborted(signal);
	if (!getPubkyDataFromStore(pubky) || getPubkyDataFromStore(pubky).sourceApp) {
		throw new Error(i18n.t('backup.couldNotRetrieveSecretKey'));
	}
	const result = await getPubkySecretKey(pubky);
	assertNotAborted(signal);
	if (!getPubkyDataFromStore(pubky) || getPubkyDataFromStore(pubky).sourceApp)
		throw new Error(i18n.t('backup.couldNotRetrieveSecretKey'));
	if (result.isErr()) throw new Error(i18n.t('backup.couldNotRetrieveSecretKey'));
	return result.value;
};
