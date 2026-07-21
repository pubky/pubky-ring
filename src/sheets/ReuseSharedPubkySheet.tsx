import React, { memo, ReactElement, useCallback, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import Sheet from '../components/Sheet.tsx';
import Button from '../components/Button.tsx';
import { Key } from '../icons/index.ts';
import type { RootStackParamList } from '../navigation/types.ts';
import { BodyMText, BodyMSBText, CaptionText } from '../theme/typography.ts';
import { showToast } from '../utils/helpers.ts';
import { importPubky, truncateStr } from '../utils/pubky.ts';
import type { SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import { hideSheet } from './sheetNavigation.tsx';

const ReuseSharedPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'ReuseSharedPubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { identities } = route.params;
	const [importing, setImporting] = useState<string>();
	const [imported, setImported] = useState<string[]>([]);

	const add = useCallback(
		async (identity: SharedPubkyIdentity): Promise<void> => {
			setImporting(identity.pubky);
			try {
				// importPubky derives and validates the public key again before saving.
				const result = await importPubky({ secretKey: identity.secretKey, dispatch });
				if (result.isErr()) {
					showToast({ type: 'error', title: t('common.error'), description: result.error.message });
					return;
				}
				setImported(current => [...current, identity.pubky]);
			} catch (error) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: error instanceof Error ? error.message : String(error),
				});
			} finally {
				setImporting(undefined);
			}
		},
		[dispatch, t],
	);

	return (
		<Sheet id="reuse-shared-pubky" title={t('reuseSharedPubky.title')}>
			<BodyMText style={styles.description}>{t('reuseSharedPubky.description')}</BodyMText>
			<View style={styles.list}>
				{identities.map(identity => {
					const wasImported = imported.includes(identity.pubky);
					return (
						<View key={identity.pubky} style={styles.row}>
							<View style={styles.icon}>
								<Key />
							</View>
							<View style={styles.info}>
								<BodyMSBText numberOfLines={1}>{truncateStr(identity.pubky).replace(/^pk:/, '')}</BodyMSBText>
								<CaptionText colorName="textTertiary">{t('reuseSharedPubky.source')}</CaptionText>
							</View>
							<Button
								text={wasImported ? t('reuseSharedPubky.added') : t('reuseSharedPubky.add')}
								size="small"
								variant="secondary"
								loading={importing === identity.pubky}
								disabled={wasImported || importing !== undefined}
								onPress={() => add(identity)}
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
