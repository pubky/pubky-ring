import React, { ReactElement, Suspense } from 'react';
import { StyleSheet } from 'react-native';
import LoadingScreen from './LoadingScreen.tsx';
import SafeAreaView from '../components/SafeAreaView.tsx';

const OnboardingContent = React.lazy(() => Promise.resolve(require('../components/OnboardingContent')));

const OnboardingScreen = (): ReactElement => {
	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<Suspense fallback={<LoadingScreen />}>
				<OnboardingContent />
			</Suspense>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default OnboardingScreen;
