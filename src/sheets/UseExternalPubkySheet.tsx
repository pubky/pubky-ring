import React, { memo, ReactElement, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import { useDispatch, useSelector } from 'react-redux';
import { hideSheet } from './sheetNavigation.tsx';
import Sheet from '../components/Sheet.tsx';
import Card from '../components/Card.tsx';
import Button from '../components/Button.tsx';
import ProfileAvatar from '../components/ProfileAvatar.tsx';
import { Text2Xl, Text5Xl, TextBaseB, TextBaseM } from '../theme/typography';
import { getPubkyCount } from '../store/selectors/pubkySelectors.ts';
import { adoptExternalPubky } from '../utils/pubky.ts';
import type { RootStackParamList } from '../navigation/types.ts';

const UseExternalPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'UseExternalPubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { pubky, sourceApp } = route.params;
	const pubkyCount = useSelector(getPubkyCount);
	const [loading, setLoading] = useState(false);
	const pubkyName = `pubky #${pubkyCount + 1} (Bitkit)`;

	const handleUse = useCallback(async (): Promise<void> => {
		setLoading(true);
		try {
			await adoptExternalPubky({ pubky, sourceApp, dispatch });
			hideSheet('use-external-pubky');
		} catch (error) {
			console.error('Failed to adopt the external pubky:', error);
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('sharedPubky.useError'),
			});
		} finally {
			setLoading(false);
		}
	}, [dispatch, pubky, sourceApp, t]);

	return (
		<Sheet id="use-external-pubky" title={t('sharedPubky.useTitle')} gradientType="brand">
			<Text5Xl>{t('sharedPubky.useHeadline')}</Text5Xl>
			<TextBaseM style={styles.description}>{t('sharedPubky.useDescription')}</TextBaseM>

			<Card style={styles.card}>
				<View style={styles.avatarContainer}>
					<ProfileAvatar name={pubkyName} pubky={pubky} size={96} external />
				</View>
				<Text2Xl style={styles.nameText}>{pubkyName}</Text2Xl>
				<TextBaseB style={styles.pubkyText}>{pubky}</TextBaseB>
			</Card>

			<Button
				style={styles.button}
				text={t('sharedPubky.useCta')}
				size="large"
				variant="secondary"
				loading={loading}
				testID="UseExternalPubkyConfirmButton"
				onPress={handleUse}
			/>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	description: {
		marginTop: 8,
	},
	card: {
		alignItems: 'center',
		marginTop: 32,
	},
	avatarContainer: {
		width: 96,
		height: 96,
		borderRadius: '50%',
		overflow: 'hidden',
		marginBottom: 16,
	},
	nameText: {
		paddingBottom: 12,
		textAlign: 'center',
	},
	pubkyText: {
		textAlign: 'center',
	},
	button: {
		flex: 0,
		marginTop: 'auto',
	},
});

export default memo(UseExternalPubkySheet);
