import React, { memo, ReactElement, useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { BodyMText, DisplayText } from '../theme/typography';
import { Pencil, Scan, Upload } from '../icons/index.ts';
import { createNewPubky } from '../utils/pubky.ts';
import { showToast } from '../utils/helpers.ts';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyMain = ({
	navigation,
}: NativeStackScreenProps<AddPubkyStackParamList, 'Main'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	const onCreatePubky = useCallback(async (): Promise<void> => {
		const pubky = await createNewPubky(dispatch);
		if (pubky.isErr()) {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('pubkyErrors.createError'),
			});
			return;
		}

		navigation.replace('PubkyReview', { pubky: pubky.value });
	}, [dispatch, navigation, t]);

	return (
		<SheetScreen id={SHEET_ID} title={t('addPubky.title')} gradientType="brand">
			<DisplayText style={styles.headerText}>{t('addPubky.yourKeysYourIdentity')}</DisplayText>
			<BodyMText>{t('addPubky.createOrImportQuestion')}</BodyMText>
			<View style={styles.imageContainer}>
				<Image source={require('../images/add-pubky-key.png')} style={styles.keyImage} />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('addPubky.scanSignupQr')}
					variant="secondary"
					size="medium"
					icon={<Scan />}
					testID="AddPubkyScan"
					onPress={() => navigation.navigate('Scanner', { mode: 'signup' })}
				/>
				<Button
					text={t('addPubky.newPubkyButton')}
					size="medium"
					icon={<Pencil />}
					testID="AddPubkyManual"
					onPress={onCreatePubky}
				/>
				<Button
					text={t('addPubky.importPubkyButton')}
					size="medium"
					icon={<Upload />}
					testID="AddPubkyImport"
					onPress={() => navigation.navigate('ImportOptions')}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	headerText: {
		marginBottom: 20,
	},
	keyImage: {
		width: 250,
		height: 250,
		alignSelf: 'center',
	},
	buttonContainer: {
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(AddPubkyMain);
