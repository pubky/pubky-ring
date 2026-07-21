import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import { getPubky, getPubkyCount } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';
import Sheet from './Sheet.tsx';
import { SHEET_TRANSITION_DELAY } from '../utils/constants.ts';
import PubkyProfile from './PubkyProfile.tsx';
import { BodyMText } from '../theme/typography.ts';
import Button from './Button.tsx';

interface ImportSuccessSheetPayload {
	isNewPubky?: boolean;
	pubky: string;
	onContinue?: () => void;
}

const ImportSuccessSheet = ({ payload }: { payload: ImportSuccessSheetPayload }): ReactElement => {
	const { t } = useTranslation();
	const pubkyCount = useSelector(getPubkyCount);
	const { isNewPubky = false, onContinue: onContinuePayload, pubky } = payload;

	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));

	const onContinue = useCallback(async (): Promise<void> => {
		await SheetManager.hide('import-success');
		if (!isNewPubky) {
			// If re-imported, just return to avoid going back to the setup flow
			return;
		}
		setTimeout(() => {
			onContinuePayload?.();
		}, SHEET_TRANSITION_DELAY);
	}, [isNewPubky, onContinuePayload]);

	const modalTitle = !isNewPubky ? t('import.pubkyReImported') : t('import.pubkyImported');
	const description = !isNewPubky ? t('import.reImportSuccess') : t('import.importSuccess');

	const data = useMemo(() => {
		return { ...pubkyData, pubky, name: pubkyData.name || `pubky #${pubkyCount}` };
	}, [pubky, pubkyCount, pubkyData]);

	return (
		<Sheet id="import-success" title={modalTitle} gradientType="brand">
			<BodyMText style={styles.message}>{description}</BodyMText>
			<PubkyProfile pubky={pubky} pubkyData={data} />
			<View style={styles.footer}>
				<Button text={t('common.continue')} size="large" testID="ImportSuccessButton" onPress={onContinue} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	footer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(ImportSuccessSheet);
