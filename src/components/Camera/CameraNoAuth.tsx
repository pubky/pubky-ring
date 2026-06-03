import React, { ReactElement } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from '../Button.tsx';
import { Gear, Lock } from '../../icons/index.ts';
import { BodyMBText, BodySText } from '../../theme/typography.ts';
import { showToast } from '../../utils/helpers.ts';

const CameraNoAuth = (): ReactElement => {
	const { t } = useTranslation();

	const handleOpenSettings = async (): Promise<void> => {
		Platform.OS === 'ios'
			? Linking.openURL('App-Prefs:Settings')
			: Linking.sendIntent('android.settings.SETTINGS');
	};

	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<Lock size={32} />
			</View>

			<View style={styles.textContainer}>
				<BodyMBText style={styles.title}>{t('permissions.cameraDeniedTitle')}</BodyMBText>
				<BodySText style={styles.description}>{t('permissions.cameraDeniedMessage')}</BodySText>
			</View>

			<Button
				text={t('permissions.openSettings')}
				size="medium"
				icon={<Gear />}
				onPress={handleOpenSettings}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.04)',
		borderRadius: 16,
	},
	iconContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 72,
		height: 72,
		borderRadius: '50%',
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
	},
	textContainer: {
		marginTop: 12,
		marginBottom: 24,
		gap: 8,
	},
	title: {
		textAlign: 'center',
	},
	description: {
		textAlign: 'center',
	},
});

export default CameraNoAuth;
