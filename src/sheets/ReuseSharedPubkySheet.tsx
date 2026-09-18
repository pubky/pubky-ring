import React, { memo, ReactElement, useCallback, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { showToast } from '@synonymdev/react-native-toast';
import Sheet from '../components/Sheet.tsx';
import Button from '../components/Button.tsx';
import PubkyProfile from '../components/PubkyProfile.tsx';
import { defaultPubkyState } from '../store/shapes/pubky.ts';
import type { PubkyData, RootStackParamList } from '../navigation/types.ts';
import { Text5Xl, TextBaseM } from '../theme/typography.ts';
import { connectSharedPubky } from '../utils/pubky.ts';
import { BITKIT_SOURCE_APP } from '../utils/sharedPubky.ts';
import { hideSheet } from './sheetNavigation.tsx';

const SHEET_ID = 'reuse-shared-pubky';

const ReuseSharedPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'ReuseSharedPubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { identity, index } = route.params;
	const [connecting, setConnecting] = useState(false);

	// Nothing here holds key material: the identity carries only what Bitkit published about it.
	const pubkyData: PubkyData = {
		...defaultPubkyState,
		pubky: identity.pubky,
		name: identity.name ?? '',
		sourceApp: BITKIT_SOURCE_APP,
	};

	const onConnect = useCallback(async (): Promise<void> => {
		setConnecting(true);
		try {
			// The native bridge retrieves and validates the selected credential just in time.
			// Ring stores only the Bitkit source reference and its own homeserver session.
			const result = await connectSharedPubky({ identity, dispatch });
			if (result.isErr()) {
				// The sheet stays open so the same identity can be retried.
				showToast({ type: 'error', title: t('common.error'), description: result.error.message });
				return;
			}
			hideSheet(SHEET_ID);
		} catch (error) {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: error instanceof Error ? error.message : String(error),
			});
		} finally {
			setConnecting(false);
		}
	}, [dispatch, identity, t]);

	return (
		<Sheet id={SHEET_ID} title={t('reuseSharedPubky.title')} gradientType="brand">
			<View style={styles.content}>
				<Text5Xl style={styles.headerText}>{t('pubky.yourPubky')}</Text5Xl>
				<TextBaseM style={styles.message}>{t('reuseSharedPubky.description')}</TextBaseM>
				<PubkyProfile index={index} pubky={identity.pubky} pubkyData={pubkyData} image={identity.image} />
				<View style={styles.footer}>
					<Button
						text={t('reuseSharedPubky.useInRing')}
						size="large"
						variant="secondary"
						loading={connecting}
						testID="ReuseSharedPubkyConnectButton"
						onPress={onConnect}
					/>
				</View>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	headerText: {
		marginBottom: 16,
	},
	message: {
		marginBottom: 'auto',
	},
	footer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(ReuseSharedPubkySheet);
