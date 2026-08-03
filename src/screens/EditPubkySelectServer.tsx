import React, { memo, ReactElement, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { Plus } from '../icons/index.ts';
import { TextSmM } from '../theme/typography.ts';
import { getHomeservers } from '../store/selectors/pubkySelectors.ts';
import { defaultHomeserver } from '../store/shapes/pubky.ts';
import { removeHomeserver } from '../store/slices/pubkysSlice.ts';
import ServerCard from '../components/ServerCard.tsx';
import { useEditPubkyFlow } from '../components/EditPubky/EditPubkyFlowContext.tsx';
import type { EditPubkyStackParamList } from '../sheets/types.ts';

const EditPubkySelectServer = ({
	navigation,
}: NativeStackScreenProps<EditPubkyStackParamList, 'SelectServer'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const homeservers = useSelector(getHomeservers);
	const { selectedHomeserver, setSelectedHomeserver, setSignupTokenForHomeserver } = useEditPubkyFlow();

	const handleDeleteHomeserver = useCallback(
		(publicKey: string): void => {
			setSignupTokenForHomeserver(publicKey, '');
			if (selectedHomeserver === publicKey) {
				setSelectedHomeserver('');
			}
			dispatch(removeHomeserver(publicKey));
		},
		[dispatch, selectedHomeserver, setSelectedHomeserver, setSignupTokenForHomeserver],
	);

	return (
		<SheetScreen id="edit-pubky" title={t('selectServer.title')} onBackPress={navigation.goBack}>
			<ScrollView contentContainerStyle={styles.contentContainer}>
				{homeservers.map(server => (
					<ServerCard
						key={server.publicKey}
						style={styles.serverCard}
						name={
							server.publicKey === defaultHomeserver.publicKey
								? t('selectServer.defaultName', { name: server.name })
								: server.name
						}
						publicKey={server.publicKey}
						selected={server.publicKey === selectedHomeserver}
						onPress={(): void => {
							setSelectedHomeserver(server.publicKey);
							navigation.goBack();
						}}
						onEdit={(): void => navigation.navigate('EditServer', server)}
						onDelete={
							server.publicKey === defaultHomeserver.publicKey
								? undefined
								: (): void => handleDeleteHomeserver(server.publicKey)
						}
					/>
				))}
			</ScrollView>

			<View style={styles.footer}>
				<TextSmM>{t('selectServer.migrationNotice')}</TextSmM>

				<View style={styles.buttonContainer}>
					<Button
						text={t('selectServer.addButton')}
						size="large"
						variant="secondary"
						icon={<Plus />}
						testID="SelectServerAddButton"
						onPress={() => navigation.navigate('AddServer')}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
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
