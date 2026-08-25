import React, { memo, ReactElement, useCallback, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { showToast } from '@synonymdev/react-native-toast';
import Sheet from '../components/Sheet.tsx';
import Button from '../components/Button.tsx';
import { Key } from '../icons/index.ts';
import type { RootStackParamList } from '../navigation/types.ts';
import { TextBaseM, TextBaseB, TextXsSb } from '../theme/typography.ts';
import { connectSharedPubky, truncateStr } from '../utils/pubky.ts';
import { hideSheet } from './sheetNavigation.tsx';
import type { SharedPubkyIdentity } from '../utils/sharedPubky.ts';

const ReuseSharedPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'ReuseSharedPubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { identities } = route.params;
	const [connecting, setConnecting] = useState<string>();
	const [connected, setConnected] = useState<string[]>([]);

	const connectIdentity = useCallback(
		async (identity: SharedPubkyIdentity): Promise<void> => {
			setConnecting(identity.pubky);
			try {
				// The native bridge retrieves and validates the selected credential just in time.
				// Ring stores only the Bitkit source reference and its own homeserver session.
				const result = await connectSharedPubky({ identity, dispatch });
				if (result.isErr()) {
					showToast({ type: 'error', title: t('common.error'), description: result.error.message });
					return;
				}
				setConnected(current => [...current, identity.pubky]);
			} catch (error) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: error instanceof Error ? error.message : String(error),
				});
			} finally {
				setConnecting(undefined);
			}
		},
		[dispatch, t],
	);

	return (
		<Sheet id="reuse-shared-pubky" title={t('reuseSharedPubky.title')}>
			<TextBaseM style={styles.description}>{t('reuseSharedPubky.description')}</TextBaseM>
			<View style={styles.list}>
				{identities.map(identity => {
					const wasConnected = connected.includes(identity.pubky);
					return (
						<View key={identity.pubky} style={styles.row}>
							<View style={styles.icon}>
								<Key />
							</View>
							<View style={styles.info}>
								<TextBaseB numberOfLines={1}>{identity.name || truncateStr(identity.pubky)}</TextBaseB>
								<TextXsSb colorName="mutedForeground">{t('reuseSharedPubky.source')}</TextXsSb>
							</View>
							<Button
								text={wasConnected ? t('reuseSharedPubky.added') : t('reuseSharedPubky.add')}
								size="small"
								variant="secondary"
								loading={connecting === identity.pubky}
								disabled={wasConnected || connecting !== undefined}
								onPress={() => connectIdentity(identity)}
							/>
						</View>
					);
				})}
			</View>
			<View style={styles.close}>
				<Button text={t('common.close')} size="large" onPress={() => hideSheet('reuse-shared-pubky')} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	description: { marginBottom: 24 },
	list: { gap: 12 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
	icon: {
		width: 48,
		height: 48,
		borderWidth: 1,
		borderRadius: 8,
		borderColor: 'rgba(255,255,255,0.16)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	info: { flex: 1 },
	close: { marginTop: 24 },
});

export default memo(ReuseSharedPubkySheet);
