import React, { memo, ReactElement, useState } from 'react';
import {
	StyleSheet,
	TextInput,
	ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Check } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import {
	setName,
	setHomeserver,
} from '../store/slices/pubkysSlice.ts';
import { signInToHomeserver } from '../utils/pubky.ts';
import {
	View,
	Text,
	ChevronLeft,
	NavButton,
} from '../theme/components.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPubky'>;

const EditPubkyScreen = ({ route, navigation }: Props): ReactElement => {
	const { data: pubkyData } = route.params;
	const dispatch = useDispatch();

	const [name, setNameState] = useState(pubkyData.name || '');
	const [homeserver, setHomeserverState] = useState(pubkyData.homeserver || '');
	const [errors, setErrors] = useState({
		name: '',
		homeserver: '',
	});
	const [isValidating, setIsValidating] = useState(false);

	const validateForm = async (): Promise<boolean> => {
		const newErrors = { name: '',
			homeserver: '' };
		let isValid = true;

		if (homeserver.trim() && homeserver.trim() !== pubkyData.homeserver) {
			setIsValidating(true);
			try {
				const signInRes = await signInToHomeserver(pubkyData.pubky, homeserver.trim(), dispatch);
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
	};

	const handleSave = async (): Promise<void> => {
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
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<NavButton
					style={styles.backButton}
					onPressIn={navigation.goBack}
				>
					<ChevronLeft size={24} />
				</NavButton>

				<NavButton
					style={[styles.saveButton, isValidating && styles.saveButtonDisabled]}
					onPressIn={handleSave}
					disabled={isValidating}
				>
					{isValidating ? (
						<ActivityIndicator size="small" color="#38a169" />
          ) : (
	<Check size={24} color="#38a169" />
          )}
				</NavButton>
			</View>

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
	header: {
		height: 100,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 40,
		paddingHorizontal: 16,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	saveButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
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
