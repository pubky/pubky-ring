import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import Sheet from './Sheet.tsx';
import Button from './Button.tsx';
import { BodyMText, BodyMSBText, CaptionText } from '../theme/typography.ts';
import { connectSharedPubky, truncateStr } from '../utils/pubky.ts';
import { SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import { showToast } from '../utils/helpers.ts';
import { Key } from '../icons/index.ts';

const ReuseSharedPubky = ({ payload }: { payload: { identities: SharedPubkyIdentity[] } }): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const identities = useMemo(() => payload?.identities ?? [], [payload]);
	const [connecting, setConnecting] = useState<string>();
	const [connected, setConnected] = useState<string[]>([]);

	const connectIdentity = useCallback(
		async (identity: SharedPubkyIdentity) => {
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
			} finally {
				setConnecting(undefined);
			}
		},
		[dispatch, t],
	);

	return (
		<Sheet id="reuse-shared-pubky" title={t('reuseSharedPubky.title')}>
			<BodyMText style={styles.description}>{t('reuseSharedPubky.description')}</BodyMText>
			<View style={styles.list}>
				{identities.map(identity => {
					const wasConnected = connected.includes(identity.pubky);
					return (
						<View key={identity.pubky} style={styles.row}>
							<View style={styles.icon}>
								<Key />
							</View>
							<View style={styles.info}>
								<BodyMSBText numberOfLines={1}>{identity.name || truncateStr(identity.pubky)}</BodyMSBText>
								<CaptionText colorName="textTertiary">{t('reuseSharedPubky.source')}</CaptionText>
							</View>
							<Button
								text={wasConnected ? t('reuseSharedPubky.added') : t('reuseSharedPubky.add')}
								size="small"
								variant="secondary"
								loading={connecting === identity.pubky}
								disabled={wasConnected || connecting !== undefined}
								onPress={() => connectIdentity(identity).then()}
							/>
						</View>
					);
				})}
			</View>
			<View style={styles.close}>
				<Button
					text={t('common.close')}
					size="large"
					onPress={() => SheetManager.hide('reuse-shared-pubky').then()}
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
