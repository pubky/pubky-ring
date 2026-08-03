import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Button from '../Button.tsx';
import { SheetScreen } from '../Sheet.tsx';
import TextField from '../TextField.tsx';
import { TextXsM } from '../../theme/typography.ts';
import { Homeserver } from '../../types/pubky.ts';
import { getHomeservers } from '../../store/selectors/pubkySelectors.ts';
import { defaultHomeserver } from '../../store/shapes/pubky.ts';
import { addHomeserver, updateHomeserver } from '../../store/slices/pubkysSlice.ts';
import { CheckCircle } from '../../icons/index.ts';
import { formatSignupToken, isValidSignupTokenFormat } from '../../utils/helpers.ts';
import { useEditPubkyFlow } from './EditPubkyFlowContext.tsx';

interface ServerFormProps {
	title: string;
	onBackPress: () => void;
	initialServer?: Homeserver;
	testIDPrefix: 'AddServer' | 'EditServer';
}

const ServerForm = ({ title, onBackPress, initialServer, testIDPrefix }: ServerFormProps): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const knownHomeservers = useSelector(getHomeservers);
	const { selectedHomeserver, setSelectedHomeserver, signupTokensByHomeserver, setSignupTokenForHomeserver } =
		useEditPubkyFlow();
	const [label, setLabel] = useState(initialServer?.name ?? '');
	const [homeserver, setHomeserver] = useState(initialServer?.publicKey ?? '');
	const [signupToken, setSignupToken] = useState(
		initialServer?.publicKey ? (signupTokensByHomeserver[initialServer.publicKey] ?? '') : '',
	);
	const [homeserverError, setHomeserverError] = useState('');

	const isDefaultServer = initialServer?.publicKey === defaultHomeserver.publicKey;

	const isSignupTokenValid = useMemo(() => {
		return !signupToken || isValidSignupTokenFormat(signupToken);
	}, [signupToken]);

	const hasValidSignupToken = Boolean(signupToken && isSignupTokenValid);

	const canSave = useMemo(
		() => Boolean(label.trim() && homeserver.trim() && isSignupTokenValid),
		[label, homeserver, isSignupTokenValid],
	);

	const handleHomeserverChange = useCallback((text: string) => {
		setHomeserver(text);
		setHomeserverError('');
	}, []);

	const handleSignupTokenChange = useCallback((text: string) => {
		setSignupToken(formatSignupToken(text));
	}, []);

	const inviteCheckmarkStyle = useAnimatedStyle(() => ({
		opacity: withTiming(hasValidSignupToken ? 1 : 0, { duration: 300 }),
		transform: [{ scale: withTiming(hasValidSignupToken ? 1 : 0.8, { duration: 300 }) }],
	}));

	const handleSave = useCallback(() => {
		const publicKey = homeserver.trim();
		const existingAddress = initialServer?.publicKey;

		if (!label.trim() || !publicKey) {
			return;
		}

		if (isDefaultServer) {
			setSignupTokenForHomeserver(publicKey, signupToken.trim());
			onBackPress();
			return;
		}

		if (
			knownHomeservers.some(server => server.publicKey === publicKey && server.publicKey !== existingAddress)
		) {
			setHomeserverError(t('addServer.duplicateError'));
			return;
		}

		if (initialServer) {
			dispatch(
				updateHomeserver({
					originalPublicKey: initialServer.publicKey,
					homeserver: { name: label.trim(), publicKey },
				}),
			);
			if (initialServer.publicKey !== publicKey) {
				setSignupTokenForHomeserver(initialServer.publicKey, '');
			}
			if (selectedHomeserver === initialServer.publicKey) {
				setSelectedHomeserver(publicKey);
			}
		} else {
			dispatch(addHomeserver({ name: label.trim(), publicKey }));
		}

		setSignupTokenForHomeserver(publicKey, signupToken.trim());
		onBackPress();
	}, [
		dispatch,
		homeserver,
		initialServer,
		isDefaultServer,
		knownHomeservers,
		label,
		onBackPress,
		selectedHomeserver,
		setSelectedHomeserver,
		setSignupTokenForHomeserver,
		signupToken,
		t,
	]);

	return (
		<SheetScreen id="edit-pubky" title={title} onBackPress={onBackPress}>
			<View style={styles.section}>
				<TextXsM>{t('addServer.label')}</TextXsM>
				<TextField
					value={label}
					placeholder={t('addServer.labelPlaceholder')}
					autoFocus={true}
					testID={`${testIDPrefix}LabelInput`}
					editable={!isDefaultServer}
					containerStyle={[styles.input, isDefaultServer && styles.disabled]}
					onChangeText={setLabel}
				/>
			</View>

			<View style={styles.section}>
				<TextXsM>{t('addServer.homeserverLabel')}</TextXsM>
				<TextField
					value={homeserver}
					placeholder={t('addServer.homeserverPlaceholder')}
					error={homeserverError}
					errorStyle={styles.errorText}
					testID={`${testIDPrefix}HomeserverInput`}
					editable={!isDefaultServer}
					containerStyle={[styles.input, isDefaultServer && styles.disabled]}
					onChangeText={handleHomeserverChange}
				/>
			</View>

			<View style={styles.section}>
				<TextXsM>{t('addServer.inviteCodeLabel')}</TextXsM>
				<TextField
					containerStyle={styles.input}
					value={signupToken}
					placeholder={t('addServer.inviteCodePlaceholder')}
					success={hasValidSignupToken}
					autoCapitalize="characters"
					autoCorrect={false}
					maxLength={14}
					testID={`${testIDPrefix}InviteCodeInput`}
					onChangeText={handleSignupTokenChange}
					rightElement={
						<View style={styles.rightElement}>
							<Animated.View style={inviteCheckmarkStyle}>
								<CheckCircle colorName="pubkyApp" size={24} />
							</Animated.View>
						</View>
					}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button
					text={t('common.cancel')}
					size="large"
					testID={`${testIDPrefix}CancelButton`}
					onPress={onBackPress}
				/>
				<Button
					text={t('common.save')}
					size="large"
					variant="secondary"
					disabled={!canSave}
					testID={`${testIDPrefix}SaveButton`}
					onPress={handleSave}
				/>
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
	disabled: {
		opacity: 0.32,
	},
	rightElement: {
		paddingRight: 24,
	},
	errorText: {
		textAlign: 'center',
		marginTop: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginTop: 'auto',
	},
});

export default ServerForm;
