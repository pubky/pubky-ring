import React, { memo, ReactElement, useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { TextBaseM, Text5Xl } from '../theme/typography';
import { Pencil, Scan, Upload } from '../icons/index.ts';
import { createNewPubky } from '../utils/pubky.ts';
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
			<Text5Xl style={styles.headerText}>{t('addPubky.yourKeysYourIdentity')}</Text5Xl>
			<TextBaseM>{t('addPubky.createOrImportQuestion')}</TextBaseM>
			<View style={styles.imageContainer}>
				<Image source={require('../images/add-pubky-key.png')} style={styles.keyImage} />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					style={styles.button}
					text={t('addPubky.scanSignupQr')}
					variant="secondary"
					size="large"
					icon={<Scan />}
					testID="AddPubkyScan"
					onPress={() => navigation.navigate('Scanner', { mode: 'signup' })}
				/>
				<Button
					style={styles.button}
					text={t('addPubky.newPubkyButton')}
					size="large"
					icon={<Pencil />}
					testID="AddPubkyManual"
					onPress={onCreatePubky}
				/>
				<Button
					style={styles.button}
					text={t('addPubky.importPubkyButton')}
					size="large"
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
		marginBottom: 16,
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
	button: {
		flex: 0,
	},
});

export default memo(AddPubkyMain);
