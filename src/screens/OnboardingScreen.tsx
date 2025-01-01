import React, { ReactElement, Suspense, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNewPubky } from '../utils/pubky';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	View,
	StyleSheet,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useDispatch } from 'react-redux';
import { importFile } from '../utils/rnfs';
import { updateShowOnboarding } from '../store/slices/settingsSlice.ts';
import LoadingScreen from './LoadingScreen.tsx';
import { showToast } from '../utils/helpers.ts';
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
				showToast({
					type: 'error',
					title: 'Error',
					description: res.error.message,
				});
			}
		} else {
			showToast({
				type: 'success',
				title: 'Success',
				description: 'Pubky imported successfully',
			});
			dispatch(updateShowOnboarding({ showOnboarding: false }));
			navigation.replace('ConfirmPubky');
		}
	}, [dispatch, navigation]);

	return (
		<View style={styles.container}>
			<Suspense fallback={<LoadingScreen />}>
				<OnboardingContent
					importPubky={importPubky}
					createPubky={createPubky}
				/>
			</Suspense>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black',
		alignItems: 'center',
	},
});

export default OnboardingScreen;
