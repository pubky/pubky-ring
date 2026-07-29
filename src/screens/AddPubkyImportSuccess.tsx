import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getPubky, getPubkyCount } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import { SheetScreen } from '../components/Sheet.tsx';
import PubkyProfile from '../components/PubkyProfile.tsx';
import { BodyMText } from '../theme/typography.ts';
import Button from '../components/Button.tsx';
import { hideSheet, showSheet } from '../sheets/sheetNavigation.tsx';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyImportSuccess = ({
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ImportSuccess'>): ReactElement => {
	const { t } = useTranslation();
	const pubkyCount = useSelector(getPubkyCount);
	const { isNewPubky, pubky } = route.params;
	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));

	const onContinue = useCallback((): void => {
		hideSheet(SHEET_ID);

		if (!isNewPubky) {
			return;
		}

		showSheet('edit-pubky', { pubky });
	}, [isNewPubky, pubky]);

	const modalTitle = !isNewPubky ? t('import.pubkyReImported') : t('import.pubkyImported');
	const description = !isNewPubky ? t('import.reImportSuccess') : t('import.importSuccess');

	const data = useMemo(() => {
		return { ...pubkyData, pubky, name: pubkyData.name || `pubky #${pubkyCount}` };
	}, [pubky, pubkyCount, pubkyData]);

	return (
		<SheetScreen id={SHEET_ID} title={modalTitle} titleTestID="import-success-title" gradientType="brand">
			<BodyMText style={styles.message}>{description}</BodyMText>
			<PubkyProfile pubky={pubky} pubkyData={data} />
			<View style={styles.footer}>
				<Button text={t('common.continue')} size="large" testID="ImportSuccessButton" onPress={onContinue} />
			</View>
		</SheetScreen>
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

export default memo(AddPubkyImportSuccess);
