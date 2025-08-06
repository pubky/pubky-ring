import React, { memo, ReactElement, useCallback, useState } from 'react';
import {
	StyleSheet,
	TextInput,
	ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import {
	setName,
	setHomeserver,
} from '../store/slices/pubkysSlice.ts';
import { signInToHomeserver } from '../utils/pubky.ts';
import {
	View,
	Text,
	Check,
	NavButton,
	ArrowLeft,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { useTypedNavigation, useTypedRoute } from '../navigation/hooks';

const EditPubkyScreen = (): ReactElement => {
	const navigation = useTypedNavigation();
	const route = useTypedRoute<'EditPubky'>();
	const { pubkyData } = route.params;
	const dispatch = useDispatch();

	const [name, setNameState] = useState(pubkyData.name || '');
	const [homeserver, setHomeserverState] = useState(pubkyData.homeserver || '');
	const [errors, setErrors] = useState({
		name: '',
		homeserver: '',
	});
	const [isValidating, setIsValidating] = useState(false);

	const validateForm = useCallback(async () => {
		const newErrors = { name: '',
			homeserver: '' };
		let isValid = true;

		if (homeserver.trim() && homeserver.trim() !== pubkyData.homeserver) {
			setIsValidating(true);
			try {
				const signInRes = await signInToHomeserver({
					pubky: pubkyData.pubky,
					homeserver: homeserver.trim(),
					dispatch,
				});
				if (signInRes.isErr()) {
					newErrors.homeserver = signInRes.error.message;
					isValid = false;
				}
			} finally {
				setIsValidating(false);
			}
		}

		// if (!name.trim()) {
		//     newErrors.name = 'Name is required';
		//     isValid = false;
		// }

		// if (!homeserver.trim()) {
		//     newErrors.homeserver = 'Homeserver is required';
		//     isValid = false;
		// }

		setErrors(newErrors);
		return isValid;
	}, [dispatch, homeserver, pubkyData.homeserver, pubkyData.pubky]);

	const handleSave = useCallback(async () => {
		const validateRes = await validateForm();
		if (validateRes) {
			dispatch(setName({
				pubky: pubkyData.pubky,
				name: name.trim(),
			}));

			dispatch(setHomeserver({
				pubky: pubkyData.pubky,
				homeserver: homeserver.trim(),
			}));

			navigation.goBack();
		}
	}, [dispatch, homeserver, name, navigation, pubkyData.pubky, validateForm]);

	const leftButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
			hitSlop={{ top: 20,
				bottom: 20,
				left: 20,
				right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [navigation]);

	const rightButton = useCallback(() => (
		<NavButton
			style={[styles.navButton, isValidating && styles.saveButtonDisabled]}
			onPressIn={handleSave}
			disabled={isValidating}
		>
			{isValidating ? (
				<ActivityIndicator size="small" color="#38a169" />
			) : (
				<Check size={16} color="#38a169" />
			)}
		</NavButton>
	), [isValidating, handleSave]);

	return (
		<View style={styles.container}>
			<PubkyRingHeader
				leftButton={leftButton()}
				rightButton={rightButton()}
			/>

			<View style={styles.form}>
				<View style={styles.inputContainer}>
					<Text style={styles.label}>Name</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setNameState}
						placeholder="Enter name"
						placeholderTextColor="#666"
						onSubmitEditing={handleSave}
					/>
					{errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.label}>Homeserver</Text>
					<TextInput
						style={styles.input}
						value={homeserver}
						onChangeText={setHomeserverState}
						placeholder="Enter homeserver"
						placeholderTextColor="#666"
						onSubmitEditing={handleSave}
					/>
					{errors.homeserver ? <Text style={styles.errorText}>{errors.homeserver}</Text> : null}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	saveButtonDisabled: {
		opacity: 0.5,
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	form: {
		padding: 20,
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		paddingHorizontal: 15,
		fontSize: 16,
		color: '#333',
		backgroundColor: '#fff',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 14,
		marginTop: 4,
	},
});

export default memo(EditPubkyScreen);
