import React, { ReactElement, Suspense, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNewPubky } from '../utils/pubky';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	Alert,
	SafeAreaView,
	StyleSheet,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useDispatch } from 'react-redux';
import { importFile } from '../utils/rnfs';
import { updateShowOnboarding } from '../store/slices/settingsSlice.ts';
import LoadingScreen from './LoadingScreen.tsx';
const OnboardingContent = React.lazy(() =>
	Promise.resolve(require('../components/OnboardingContent'))
);

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const OnboardingScreen = (): ReactElement => {
	const navigation = useNavigation<NavigationProp>();
	const dispatch = useDispatch();

	const createPubky = useCallback(async () => {
		await createNewPubky(dispatch);
		dispatch(updateShowOnboarding({ showOnboarding: false }));
		navigation.replace('ConfirmPubky');
	}, [dispatch, navigation]);

	const importPubky = useCallback(async () => {
		const res = await importFile(dispatch);
		if (res.isErr()) {
			if (res.error?.message) {
				Alert.alert('Error', res.error.message);
			}
		} else {
			Alert.alert('Success', 'Pubky imported successfully');
			dispatch(updateShowOnboarding({ showOnboarding: false }));
			navigation.replace('ConfirmPubky');
		}
	}, [dispatch, navigation]);

	return (
		<SafeAreaView style={styles.container}>
			<Suspense fallback={<LoadingScreen />}>
				<OnboardingContent
					importPubky={importPubky}
					createPubky={createPubky}
				/>
			</Suspense>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
		alignItems: 'center',
	},
	backgroundImage: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 150,
		right: 0,
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	logoContainer: {
		position: 'absolute',
		top: 40,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	logo: {
		width: 171,
		height: 36,
		resizeMode: 'contain',
	},
	keysImageContainer: {
		position: 'absolute',
		top: 90,
		left: 0,
		right: 30,
		alignItems: 'center',
	},
	keysImage: {
		width: 443,
		height: 443,
		resizeMode: 'contain',
	},
	contentBlock: {
		flex: 1,
		justifyContent: 'flex-end',
		paddingBottom: 35,
		width: '100%',
	},
	textContainer: {
		paddingHorizontal: 32,
	},
	title: {
		color: 'white',
		fontSize: 48,
		fontWeight: 700,
		lineHeight: 48,
	},
	subtitle: {
		color: 'rgba(255, 255, 255, 0.80)',
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 20, // Spazio tra il testo e i bottoni
		justifyContent: 'space-between',
		width: '100%',
		gap: 12,
		paddingHorizontal: 32,
	},
	buttonSecondary: {
		flex: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
	},
	buttonPrimary: {
		flex: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		borderColor: 'white',
		borderWidth: 1,
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
	},
	buttonText: {
		color: 'white',
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
	},
});

export default OnboardingScreen;
