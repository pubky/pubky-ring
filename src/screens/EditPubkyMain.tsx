import React, { ReactElement, useCallback, useRef } from 'react';
import { Keyboard, StyleSheet, View, type TextInputInstance } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TextSmM, TextXsM } from '../theme/typography';
import Button from '../components/Button';
import { SheetScreen } from '../components/Sheet';
import TextField from '../components/TextField';
import { useEditPubkyForm } from '../components/EditPubky/useEditPubkyForm';
import ServerCardSmall from '../components/ServerCardSmall';
import { hideSheet } from '../sheets/sheetNavigation';
import type { EditPubkyStackParamList } from '../sheets/types';
import { Scan } from '../icons';

const EditPubkyMain = ({
	navigation,
	route,
}: NativeStackScreenProps<EditPubkyStackParamList, 'Main'>): ReactElement => {
	const { t } = useTranslation();
	const onClose = useCallback(() => hideSheet('edit-pubky'), []);
	const inviteInputRef = useRef<TextInputInstance>(null);
	const form = useEditPubkyForm(route.params.pubky, onClose, inviteInputRef, route.params.justCreated);
	return (
		<SheetScreen id="edit-pubky" title={form.title} scrollable>
			<View style={styles.section}>
				<TextXsM testID="EditPubkyNameLabel">{t('editPubkySheet.pubkyNameLabel')}</TextXsM>
				<TextField
					testID="EditPubkyNameInput"
					containerStyle={styles.input}
					value={form.newPubkyName}
					onChangeText={form.handleNameChange}
					placeholder={t('editPubkySheet.pubkyNamePlaceholder')}
					helperText={form.nameError}
					maxLength={50}
					editable={!form.loading}
					autoCapitalize="none"
					returnKeyType="done"
					onSubmitEditing={
						form.isSelectedConfiguredServer || form.isExternal ? form.handleSubmit : Keyboard.dismiss
					}
				/>
			</View>
			{!form.isExternal && (
				<>
					<View style={styles.section}>
						<TextXsM testID="EditPubkyHomeserverLabel">{t('editPubkySheet.homeserverLabel')}</TextXsM>
						{form.checkingHomeserver ? (
							<TextSmM style={styles.card} testID="EditPubkyHomeserverLookupProgress">
								{t('homeservers.checking')}
							</TextSmM>
						) : form.lookupFailed ? (
							<View style={styles.lookupError}>
								<TextSmM accessibilityRole="alert" colorName="danger">
									{t('homeservers.lookupFailed')}
								</TextSmM>
								<Button
									text={t('common.retry')}
									size="small"
									onPress={form.retryHomeserverLookup}
									testID="EditPubkyRetryLookupButton"
								/>
							</View>
						) : (
							<>
								{form.homeServer ? (
									<ServerCardSmall
										style={styles.card}
										name={form.selectedHomeserverName}
										loading={form.signingOut}
										onRemove={form.isSelectedConfiguredServer ? form.handleSignOutPress : undefined}
										removeLabel={t('homeservers.signOut')}
										disabled={form.loading}
									/>
								) : null}
								<Button
									style={styles.changeButton}
									size="small"
									variant="secondary"
									disabled={form.loading}
									text={t(
										form.homeServer
											? 'editPubkySheet.serverButtonChange'
											: 'editPubkySheet.serverButtonSelect',
									)}
									testID="EditPubkySelectServerButton"
									onPress={() => navigation.navigate('SelectServer', route.params)}
								/>
							</>
						)}
					</View>
					{form.needsSignup && (
						<View style={styles.section}>
							{form.inviteVisible && (
								<View style={styles.inviteField}>
									<TextXsM>
										{t(form.inviteRequired ? 'homeservers.inviteRequired' : 'homeservers.inviteOptional')}
									</TextXsM>
									<TextField
										ref={inviteInputRef}
										autoFocus={!form.isSynonym}
										testID="EditPubkyInviteCodeInput"
										value={form.signupToken}
										editable={!form.loading}
										placeholder={t(
											form.isSynonym
												? 'editPubkySheet.inviteCodePlaceholder'
												: 'homeservers.customInvitePlaceholder',
										)}
										autoCapitalize={form.isSynonym ? 'characters' : 'none'}
										autoCorrect={false}
										returnKeyType="done"
										maxLength={form.isSynonym ? 14 : undefined}
										hasError={(Boolean(form.signupToken) && !form.isSignupTokenValid) || form.inviteHasError}
										onChangeText={form.handleSignupTokenChange}
										onSubmitEditing={form.handleSubmit}
									/>
									{form.inviteError ? (
										<TextSmM accessibilityRole="alert" colorName="danger">
											{form.inviteError}
										</TextSmM>
									) : null}
								</View>
							)}
							<View style={[styles.inviteActions, form.inviteVisible && styles.inviteActionsBelowField]}>
								{!form.inviteVisible ? (
									<Button
										text={t('homeservers.haveInvite')}
										size="small"
										disabled={form.loading}
										testID="EditPubkyShowInviteButton"
										onPress={form.showInvite}
									/>
								) : (
									<>
										<Button
											text={t('homeservers.pasteInvite')}
											size="small"
											disabled={form.loading}
											testID="EditPubkyPasteInviteButton"
											onPress={form.handlePaste}
										/>
										<Button
											text={t('homeservers.scanInvite')}
											size="small"
											icon={<Scan />}
											disabled={form.loading}
											testID="EditPubkyScanInviteButton"
											onPress={() => navigation.navigate('Scanner')}
										/>
									</>
								)}
							</View>
						</View>
					)}
				</>
			)}
			<View style={styles.footer}>
				{form.error && !form.inviteError ? (
					<TextSmM accessibilityRole="alert" colorName="danger" style={styles.notice}>
						{form.error}
					</TextSmM>
				) : null}
				<View style={styles.buttons}>
					<Button
						text={t('common.cancel')}
						size="large"
						disabled={form.loading}
						testID="EditPubkyCancelButton"
						onPress={onClose}
					/>
					<Button
						text={form.submitLabel}
						size="large"
						variant="secondary"
						loading={form.connecting}
						disabled={!form.canSubmit}
						testID="EditPubkySaveButton"
						onPress={form.handleSubmit}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};
const styles = StyleSheet.create({
	section: { marginBottom: 24 },
	input: { marginTop: 8 },
	card: { marginTop: 12 },
	changeButton: { alignSelf: 'flex-start', marginTop: 12 },
	lookupError: { alignItems: 'flex-start', gap: 16, marginTop: 12 },
	inviteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	inviteField: { gap: 8 },
	inviteActionsBelowField: { marginTop: 12 },
	notice: { marginBottom: 16 },
	footer: { marginTop: 'auto' },
	buttons: { flexDirection: 'row', gap: 16 },
});
export default EditPubkyMain;
