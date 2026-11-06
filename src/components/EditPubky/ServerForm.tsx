import React, { ReactElement, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../Button';
import TextField from '../TextField';
import KeyboardDismissView from '../KeyboardDismissView';
import { TextBaseM, TextSmM, TextXsM } from '../../theme/typography';
import { ThemedView } from '../../theme/components';
import { Check } from '../../icons';
import { defaultHomeserver } from '../../store/shapes/pubky';
import type { Homeserver } from '../../types/pubky';
import { getHomeservers, getPreferredHomeserver } from '../../store/selectors/pubkySelectors';
import { addHomeserver, setPreferredHomeserver, updateHomeserver } from '../../store/slices/pubkysSlice';
import { normalizeHomeserver } from '../../utils/homeservers';

interface ServerFormProps {
	initialServer?: Homeserver;
	onSaved: (server: Homeserver) => void;
	onCancel: () => void;
}

const ServerForm = ({ initialServer, onSaved, onCancel }: ServerFormProps): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const knownHomeservers = useSelector(getHomeservers);
	const preferred = useSelector(getPreferredHomeserver);
	const [makeDefault, setMakeDefault] = useState(initialServer?.publicKey === preferred);
	const isBuiltin = initialServer?.publicKey === defaultHomeserver.publicKey;
	const defaultLocked = isBuiltin && preferred === defaultHomeserver.publicKey;
	const [label, setLabel] = useState(initialServer?.name ?? '');
	const [homeserver, setHomeserver] = useState(initialServer?.publicKey ?? '');
	const [error, setError] = useState('');
	const prefix = initialServer ? 'EditServer' : 'AddServer';
	const publicKey = normalizeHomeserver(homeserver);

	const handleSave = (): void => {
		if (!publicKey || !label.trim()) return;
		Keyboard.dismiss();
		if (!initialServer && knownHomeservers.some(server => server.publicKey === publicKey)) {
			setError(t('addServer.duplicateError'));
			return;
		}
		const server = { name: label.trim(), publicKey };
		if (!initialServer) dispatch(addHomeserver(server));
		else {
			if (!isBuiltin)
				dispatch(updateHomeserver({ originalPublicKey: initialServer.publicKey, homeserver: server }));
			if (makeDefault) dispatch(setPreferredHomeserver(publicKey));
			else if (preferred === publicKey) dispatch(setPreferredHomeserver(defaultHomeserver.publicKey));
		}
		onSaved(server);
	};
	const handleCancel = (): void => {
		Keyboard.dismiss();
		onCancel();
	};

	return (
		<KeyboardDismissView style={styles.container}>
			<View style={styles.fields}>
				<TextXsM>{t('addServer.label')}</TextXsM>
				<TextField
					containerStyle={styles.input}
					value={label}
					maxLength={50}
					autoFocus={!isBuiltin}
					editable={!isBuiltin}
					placeholder={t('addServer.labelPlaceholder')}
					testID={`${prefix}LabelInput`}
					onChangeText={setLabel}
					returnKeyType="done"
					onSubmitEditing={Keyboard.dismiss}
				/>
				<TextXsM>{t('addServer.homeserverLabel')}</TextXsM>
				<TextField
					containerStyle={styles.input}
					value={homeserver}
					editable={!initialServer}
					autoCapitalize="none"
					autoCorrect={false}
					returnKeyType="done"
					onSubmitEditing={Keyboard.dismiss}
					placeholder={t('addServer.homeserverPlaceholder')}
					testID={`${prefix}HomeserverInput`}
					error={error || (homeserver.trim() && !publicKey ? t('homeservers.invalidKey') : '')}
					onChangeText={text => {
						setHomeserver(text);
						setError('');
					}}
				/>
				<TextSmM colorName="mutedForeground">
					{t(initialServer ? 'homeservers.keyReadOnly' : 'homeservers.catalogHint')}
				</TextSmM>
				{initialServer && (
					<Pressable
						style={[styles.defaultRow, defaultLocked && styles.disabled]}
						accessibilityRole="checkbox"
						accessibilityLabel={t('homeservers.makeDefault')}
						accessibilityState={{ checked: makeDefault, disabled: defaultLocked }}
						disabled={defaultLocked}
						testID="EditServerDefaultCheckbox"
						onPress={() => setMakeDefault(value => !value)}
					>
						<ThemedView style={styles.checkbox} colorName={makeDefault ? 'blue' : 'border'}>
							<ThemedView style={styles.checkboxCenter} colorName={makeDefault ? 'blue' : 'background'}>
								{makeDefault && <Check size={16} />}
							</ThemedView>
						</ThemedView>
						<TextBaseM>{t('homeservers.makeDefault')}</TextBaseM>
					</Pressable>
				)}
			</View>
			<View style={styles.buttons}>
				<Button
					text={t('common.cancel')}
					size="large"
					onPress={handleCancel}
					testID={`${prefix}CancelButton`}
				/>
				<Button
					text={t('common.save')}
					size="large"
					variant="secondary"
					disabled={!label.trim() || !publicKey}
					onPress={handleSave}
					testID={`${prefix}SaveButton`}
				/>
			</View>
		</KeyboardDismissView>
	);
};
const styles = StyleSheet.create({
	container: { flex: 1 },
	fields: { flex: 1 },
	defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, marginTop: 16 },
	checkbox: { width: 20, height: 20, borderRadius: 4, padding: 1 },
	checkboxCenter: { flex: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
	disabled: { opacity: 0.4 },
	input: { marginTop: 8, marginBottom: 24 },
	buttons: { flexDirection: 'row', gap: 16, paddingTop: 24 },
});
export default ServerForm;
