import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import Sheet from './Sheet.tsx';
import Button from './Button.tsx';
import { BodyMText, BodyMSBText, CaptionText } from '../theme/typography';
import { importPubky, truncateStr, ISharedIdentity } from '../utils/pubky.ts';
import { showToast } from '../utils/helpers.ts';
import { Key } from '../icons/index.ts';

const ReuseSharedPubky = ({
	payload,
}: {
	payload: { identities: ISharedIdentity[] };
}): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const identities = useMemo(() => payload?.identities ?? [], [payload]);
	const [importingPubky, setImportingPubky] = useState<string | null>(null);
	const [importedPubkys, setImportedPubkys] = useState<string[]>([]);

	const handleClose = useCallback(() => {
		SheetManager.hide('reuse-shared-pubky');
	}, []);

	const handleImport = useCallback(
		async (identity: ISharedIdentity): Promise<void> => {
			setImportingPubky(identity.pubky);
			try {
				const res = await importPubky({
					secretKey: identity.secretKey,
					dispatch,
					mnemonic: identity.mnemonic,
				});
				if (res.isErr()) {
					showToast({
						type: 'error',
						title: t('common.error'),
						description: res.error.message,
					});
					return;
				}
				setImportedPubkys(prev => [...prev, identity.pubky]);
			} finally {
				setImportingPubky(null);
			}
		},
		[dispatch, t],
	);

	const truncated = useCallback((pubky: string): string => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, []);

	return (
		<Sheet id="reuse-shared-pubky" title={t('reuse.title')}>
			<BodyMText style={styles.message}>{t('reuse.description')}</BodyMText>

			<View style={styles.list}>
				{identities.map(identity => {
					const isImported = importedPubkys.includes(identity.pubky);
					const isImporting = importingPubky === identity.pubky;
					return (
						<View key={identity.pubky} style={styles.row}>
							<View style={styles.keyContainer}>
								<Key />
							</View>
							<View style={styles.info}>
								<BodyMSBText numberOfLines={1} ellipsizeMode="middle">
									{truncated(identity.pubky)}
								</BodyMSBText>
								<CaptionText colorName="textTertiary">{t('reuse.source')}</CaptionText>
							</View>
							<Button
								text={isImported ? t('reuse.added') : t('reuse.add')}
								size="small"
								variant="secondary"
								loading={isImporting}
								disabled={isImported || importingPubky !== null}
								onPress={() => handleImport(identity)}
							/>
						</View>
					);
				})}
			</View>

			<View style={styles.buttonContainer}>
				<Button text={t('common.close')} size="large" onPress={handleClose} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	list: {
		gap: 12,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	keyContainer: {
		borderWidth: 1,
		borderRadius: 8,
		borderColor: 'rgba(255, 255, 255, 0.16)',
		height: 48,
		width: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	info: {
		flex: 1,
	},
	buttonContainer: {
		marginTop: 24,
	},
});

export default memo(ReuseSharedPubky);
