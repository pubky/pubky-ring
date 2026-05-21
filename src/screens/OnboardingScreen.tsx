import React, { ReactElement, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import LoadingScreen from './LoadingScreen.tsx';

const OnboardingContent = React.lazy(() => Promise.resolve(require('../components/OnboardingContent')));

const OnboardingScreen = (): ReactElement => {
	return (
		<View style={styles.container}>
			<Suspense fallback={<LoadingScreen />}>
				<OnboardingContent />
			</Suspense>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default OnboardingScreen;
