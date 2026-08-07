import React, { memo, ReactElement, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TextSmM, TextXsM } from '../theme/typography';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import TextField from '../components/TextField.tsx';
import { useEditPubkyForm } from '../components/EditPubky/useEditPubkyForm.ts';
import ServerCardSmall from '../components/ServerCardSmall.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { EditPubkyStackParamList } from '../sheets/types.ts';

const EditPubkyMain = ({
	navigation,
	route,
}: NativeStackScreenProps<EditPubkyStackParamList, 'Main'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky } = route.params;
	const onClose = useCallback(() => hideSheet('edit-pubky'), []);
	const {
		title,
		newPubkyName,
		nameError,
		haveFieldsChanged,
		selectedHomeserverName,
		signedUp,
		error,
		loading,
		handleNameChange,
		handleNameSubmit,
		handleSubmit,
		handleRemoveHomeserver,
		clearErrorState,
	} = useEditPubkyForm(pubky, onClose);

	useEffect(() => {
		return navigation.addListener('blur', clearErrorState);
	}, [clearErrorState, navigation]);

	return (
		<SheetScreen id="edit-pubky" title={title}>
			<View style={styles.section}>
				<TextXsM>{t('editPubkySheet.pubkyNameLabel')}</TextXsM>
				<TextField
					testID="EditPubkyNameInput"
					containerStyle={styles.input}
					value={newPubkyName}
					onChangeText={handleNameChange}
					placeholder={t('editPubkySheet.pubkyNamePlaceholder')}
					error={nameError}
					errorStyle={styles.errorText}
					autoFocus={newPubkyName.length === 0}
					autoCapitalize="none"
					onSubmitEditing={handleNameSubmit}
				/>
			</View>

			<View style={styles.section}>
				<TextXsM>{t('editPubkySheet.homeserverLabel')}</TextXsM>

				{selectedHomeserverName ? (
					<ServerCardSmall
						style={styles.card}
						name={selectedHomeserverName}
						onDelete={handleRemoveHomeserver}
					/>
				) : null}

				<View style={styles.sectionButton}>
					<Button
						variant="secondary"
						size="small"
						text={
							selectedHomeserverName
								? t('editPubkySheet.serverButtonChange')
								: t('editPubkySheet.serverButtonSelect')
						}
						onPress={() => navigation.navigate('SelectServer')}
					/>
				</View>
			</View>

			<View style={styles.footer}>
				{error ? (
					<TextSmM colorName="danger" style={styles.submitError}>
						{error}
					</TextSmM>
				) : null}

				<View style={styles.buttonContainer}>
					<Button text={t('common.cancel')} size="large" testID="EditPubkyCancelButton" onPress={onClose} />
					<Button
						text={t('common.save')}
						size="large"
						variant="secondary"
						loading={loading}
						disabled={signedUp && !haveFieldsChanged}
						testID="EditPubkySaveButton"
						onPress={handleSubmit}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	section: {
		marginBottom: 16,
	},
	input: {
		marginTop: 8,
	},
	errorText: {
		textAlign: 'center',
		marginTop: 4,
	},
	card: {
		marginTop: 12,
		marginBottom: 4,
	},
	sectionButton: {
		flexDirection: 'row',
		marginTop: 16,
	},
	footer: {
		marginTop: 'auto',
	},
	submitError: {
		textAlign: 'center',
		marginBottom: 24,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(EditPubkyMain);
