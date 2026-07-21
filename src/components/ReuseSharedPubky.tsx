import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import Sheet from './Sheet.tsx';
import Button from './Button.tsx';
import { BodyMText, BodyMSBText, CaptionText } from '../theme/typography.ts';
import { importPubky, truncateStr } from '../utils/pubky.ts';
import { SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import { showToast } from '../utils/helpers.ts';
import { Key } from '../icons/index.ts';

const ReuseSharedPubky = ({ payload }: { payload: { identities: SharedPubkyIdentity[] } }): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const identities = useMemo(() => payload?.identities ?? [], [payload]);
	const [importing, setImporting] = useState<string>();
	const [imported, setImported] = useState<string[]>([]);

	const add = useCallback(
		async (identity: SharedPubkyIdentity) => {
			setImporting(identity.pubky);
			try {
				// importPubky derives and validates the public key again before saving.
				const result = await importPubky({ secretKey: identity.secretKey, dispatch });
				if (result.isErr()) {
					showToast({ type: 'error', title: t('common.error'), description: result.error.message });
					return;
				}
				setImported(current => [...current, identity.pubky]);
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
								onPress={() => void add(identity)}
							/>
						</View>
					);
				})}
			</View>
			<View style={styles.close}>
				<Button
					text={t('common.close')}
					size="large"
					onPress={() => void SheetManager.hide('reuse-shared-pubky')}
				/>
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

export default memo(ReuseSharedPubky);
