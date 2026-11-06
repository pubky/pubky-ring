import React, { memo, ReactElement, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { showToast } from '@synonymdev/react-native-toast';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { Gear, Scan } from '../icons/index.ts';
import { TextSmM } from '../theme/typography.ts';
import { getHomeservers, getPreferredHomeserver, getPubky } from '../store/selectors/pubkySelectors.ts';
import ServerCard from '../components/ServerCard.tsx';
import { useEditPubkyFlow } from '../components/EditPubky/EditPubkyFlowContext.tsx';
import { openHomeserverSettings } from '../sheets/sheetNavigation';
import type { RootState } from '../types';
import { isSynonymHomeserver, normalizeHomeserver } from '../utils/homeservers';
import { readFromClipboard } from '../utils/clipboard';
import { parseHomeserverSignupInput } from '../utils/homeserverSignupInput';
import { formatSignupToken } from '../utils/helpers';
import type { EditPubkyStackParamList } from '../sheets/types.ts';

const EditPubkySelectServer = ({
	navigation,
	route,
}: NativeStackScreenProps<EditPubkyStackParamList, 'SelectServer'>): ReactElement => {
	const { t } = useTranslation();
	const homeservers = useSelector(getHomeservers);
	const preferred = useSelector(getPreferredHomeserver);
	const hasExistingAccount = useSelector((state: RootState) => {
		const pubky = getPubky(state, route.params.pubky);
		return Boolean(
			pubky?.signedUp ||
			normalizeHomeserver(pubky?.homeserver) ||
			normalizeHomeserver(pubky?.lastKnownHomeserver),
		);
	});
	const { selectedHomeserver, setSelectedHomeserver, setSignupTokenForHomeserver } = useEditPubkyFlow();
	const [pasting, setPasting] = useState(false);
	const processing = useRef(false);
	const handlePaste = async (): Promise<void> => {
		if (processing.current) return;
		processing.current = true;
		setPasting(true);
		try {
			const input = await readFromClipboard();
			if (!input) {
				showToast({ type: 'error', title: t('common.error'), description: t('errors.emptyClipboard') });
				return;
			}
			const result = await parseHomeserverSignupInput(input, 'clipboard', selectedHomeserver);
			if (!result.success) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: t(`homeservers.inputError.${result.reason}`),
				});
				return;
			}
			setSelectedHomeserver(result.draft.homeserver);
			setSignupTokenForHomeserver(
				result.draft.homeserver,
				isSynonymHomeserver(result.draft.homeserver)
					? formatSignupToken(result.draft.inviteCode)
					: result.draft.inviteCode,
			);
			navigation.popToTop();
		} catch {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('scanInvite.failedToReadClipboard'),
			});
		} finally {
			processing.current = false;
			setPasting(false);
		}
	};

	const servers = [...homeservers];
	if (
		normalizeHomeserver(selectedHomeserver) &&
		!servers.some(server => server.publicKey === selectedHomeserver)
	) {
		servers.push({
			publicKey: selectedHomeserver,
			name: `${selectedHomeserver.slice(0, 6)}…${selectedHomeserver.slice(-4)}`,
		});
	}

	return (
		<SheetScreen id="edit-pubky" title={t('selectServer.title')} onBackPress={navigation.goBack}>
			<ScrollView contentContainerStyle={styles.contentContainer}>
				{servers.map(server => {
					const isDefault = server.publicKey === preferred;

					return (
						<ServerCard
							key={server.publicKey}
							style={styles.serverCard}
							name={isDefault ? t('selectServer.defaultName', { name: server.name }) : server.name}
							publicKey={server.publicKey}
							selected={server.publicKey === selectedHomeserver}
							onPress={(): void => {
								setSelectedHomeserver(server.publicKey);
								navigation.goBack();
							}}
							testID={`SelectServer-${server.publicKey}`}
						/>
					);
				})}
				<View style={styles.linkActions}>
					<Button
						text={t('home.scanQR')}
						size="small"
						icon={<Scan />}
						disabled={pasting}
						testID="SelectServerScanButton"
						onPress={() => navigation.navigate('Scanner')}
					/>
					<Button
						text={t('homeservers.pasteLink')}
						size="small"
						loading={pasting}
						testID="SelectServerPasteButton"
						onPress={handlePaste}
					/>
				</View>
			</ScrollView>

			<View style={styles.footer}>
				{hasExistingAccount && <TextSmM>{t('selectServer.migrationNotice')}</TextSmM>}

				<View style={styles.buttonContainer}>
					<Button
						text={t('homeservers.manage')}
						size="large"
						variant="secondary"
						icon={<Gear />}
						testID="SelectServerManageButton"
						onPress={openHomeserverSettings}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	linkActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 16,
	},
	contentContainer: {
		gap: 8,
	},
	serverCard: {
		marginBottom: 0,
	},
	footer: {
		marginTop: 'auto',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginTop: 24,
	},
});

export default memo(EditPubkySelectServer);
