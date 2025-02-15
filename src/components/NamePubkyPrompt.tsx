import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet } from 'react-native';
import {
	ActionSheetContainer,
	Text,
	TextInput,
	View,
	SkiaGradient,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { truncateStr } from '../utils/pubky.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { setName } from '../store/slices/pubkysSlice.ts';
import ModalIndicator from './ModalIndicator.tsx';

const MAX_NAME_LENGTH = 50;

const NamePubkyPrompt = ({ payload }: {
    payload: {
        pubky: string;
        pubkyName: string;
		onClose: () => void;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { pubky, pubkyName, onClose } = useMemo(() => payload, [payload]);
	const pubkyNameLength = useMemo(() => pubkyName.length, [pubkyName]);
	const [error, setError] = useState<string>(pubkyNameLength > 20 ? `${MAX_NAME_LENGTH - pubkyNameLength} / ${MAX_NAME_LENGTH}` : '');
	const [loading, setLoading] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(pubkyName);

	const dispatch = useDispatch();

	const truncatedPubky = useMemo(() => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res : `pk:${res}`;
	}, [pubky]);

	const handleSubmit = useCallback(async () => {
		try {
			setLoading(true);
			dispatch(setName({
				pubky,
				name: newPubkyName,
			}));
			Keyboard.dismiss();
			onClose();
		} finally {
			setLoading(false);
		}
	}, [dispatch, newPubkyName, onClose, pubky]);

	const handleChangeText = useCallback((text: string) => {
		if (text.length > MAX_NAME_LENGTH) {
			return;
		}

		setNewPubkyName(text);

		if (text.length > 20) {
			setError(`${MAX_NAME_LENGTH - text.length} / ${MAX_NAME_LENGTH}`);
		} else {
			setError('');
		}
	}, []);

	return (
		<ActionSheetContainer
			id="name-pubky-prompt"
			navigationAnimation={navigationAnimation}
			keyboardHandlerEnabled={true}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<ModalIndicator />
				<Text style={styles.title}>Name Pubky</Text>
				<Text style={styles.message}>
					Enter a name for <Text style={styles.boldText}>pk:{truncatedPubky}</Text>
				</Text>
				<View style={styles.inputContainer}>
					<TextInput
						style={[styles.input, error ? styles.inputError : null]}
						value={newPubkyName}
						onChangeText={handleChangeText}
						placeholder="Pubky Name"
						placeholderTextColor="#999"
						autoFocus
						onSubmitEditing={handleSubmit}
						autoCapitalize="none"
					/>
				</View>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.buttonContainer}>
					<Button
						text={'Cancel'}
						style={styles.button}
						onPress={onClose}
					/>
					<Button
						text={'Save'}
						loading={loading}
						style={[styles.button, styles.submitButton]}
						onPress={handleSubmit}
						disabled={newPubkyName === pubkyName}
					/>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		minHeight: '40%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		marginBottom: 24,
		alignSelf: 'center',
	},
	message: {
		fontSize: 17,
		lineHeight: 22,
		alignItems: 'center',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#5D5D5D',
		borderRadius: 16,
		marginTop: 16,
		marginBottom: 8,
		borderStyle: 'dashed',
		minHeight: 74,
	},
	input: {
		flex: 1,
		padding: 8,
		fontSize: 26,
		fontWeight: '300',
		left: Platform.select({
			android: 4,
			ios: 0,
		}),
	},
	inputError: {
		borderColor: '#dc2626',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 12,
		marginBottom: 16,
		marginLeft: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 24,
		width: '100%',
		justifyContent: 'space-around',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
	},
	submitButton: {
		borderWidth: 1,
	},
	boldText: {
		fontWeight: 'bold',
	},
});

export default memo(NamePubkyPrompt);
