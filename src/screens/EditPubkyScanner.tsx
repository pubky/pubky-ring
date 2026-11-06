import React, { ReactElement, useRef } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import QRScannerContent from '../components/QRScannerContent';
import { SheetScreen } from '../components/Sheet';
import { useEditPubkyFlow } from '../components/EditPubky/EditPubkyFlowContext';
import { parseHomeserverSignupInput } from '../utils/homeserverSignupInput';
import { isSynonymHomeserver } from '../utils/homeservers';
import { formatSignupToken } from '../utils/helpers';
import { readFromClipboard } from '../utils/clipboard';
import type { EditPubkyStackParamList } from '../sheets/types';

const EditPubkyScanner = ({
	navigation,
}: NativeStackScreenProps<EditPubkyStackParamList, 'Scanner'>): ReactElement => {
	const { t } = useTranslation();
	const flow = useEditPubkyFlow();
	const processing = useRef(false);
	const handleInput = async (input: string, source: 'scan' | 'clipboard'): Promise<void> => {
		if (processing.current) return;
		processing.current = true;
		try {
			const result = await parseHomeserverSignupInput(input, source, flow.selectedHomeserver);
			if (!result.success) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: t(`homeservers.inputError.${result.reason}`),
				});
				processing.current = false;
				return;
			}
			flow.setSelectedHomeserver(result.draft.homeserver);
			flow.setSignupTokenForHomeserver(
				result.draft.homeserver,
				isSynonymHomeserver(result.draft.homeserver)
					? formatSignupToken(result.draft.inviteCode)
					: result.draft.inviteCode,
			);
			navigation.popToTop();
		} catch {
			processing.current = false;
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('homeservers.inputError.invalid'),
			});
		}
	};
	const handlePaste = async (): Promise<void> => {
		try {
			const input = await readFromClipboard();
			if (input) await handleInput(input, 'clipboard');
			else showToast({ type: 'error', title: t('common.error'), description: t('errors.emptyClipboard') });
		} catch {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('scanInvite.failedToReadClipboard'),
			});
		}
	};
	return (
		<SheetScreen id="edit-pubky" title={t('home.scanQR')} onBackPress={navigation.goBack}>
			<QRScannerContent onScan={input => handleInput(input, 'scan')} onCopyClipboard={handlePaste} />
		</SheetScreen>
	);
};
export default EditPubkyScanner;
