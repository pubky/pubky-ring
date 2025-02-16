import React, { useEffect, useMemo } from 'react';
import './src/sheets/sheets';
import { ThemeProvider } from 'styled-components/native';
import { darkTheme, lightTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator.tsx';
import { SheetProvider } from 'react-native-actions-sheet';
import { Linking, useColorScheme } from 'react-native';
import { ETheme } from './src/types/settings.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getIsOnline, getTheme } from './src/store/selectors/settingsSelectors.ts';
import { SafeAreaView } from './src/theme/components.ts';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/theme/toastConfig.tsx';
import NetInfo from '@react-native-community/netinfo';
import { updateIsOnline } from './src/store/slices/settingsSlice.ts';
import { checkNetworkConnection, parseDeepLink, showToast } from './src/utils/helpers.ts';
import { setDeepLink } from './src/store/slices/pubkysSlice.ts';

const _toastConfig = toastConfig();

function App(): React.JSX.Element {
	const colorScheme = useColorScheme();
	const currentTheme = useSelector(getTheme);
	const isOnline = useSelector(getIsOnline);
	const dispatch = useDispatch();

	// Handle deep linking
	useEffect(() => {
		// Handle deep link when app is opened from a background state
		const getInitialURL = async (): Promise<void> => {
			try {
				let url = await Linking.getInitialURL();
				if (url) {
					// Handle the deep link URL here
					handleDeepLink(url);
				}
			} catch (err) {
				console.error('Error getting initial URL:', err);
			}
		};

		// Handle the deep link
		const handleDeepLink = (url: string): void => {
			const parsedUrl = parseDeepLink(url);
			dispatch(setDeepLink(parsedUrl));
		};

		// Set up deep link listeners
		const subscription = Linking.addEventListener('url', ({ url }) => {
			handleDeepLink(url);
		});

		// Check for initial URL on mount
		getInitialURL();

		// Cleanup subscription
		return (): void => {
			subscription.remove();
		};
	}, [dispatch]);

	useEffect(() => {
		checkNetworkConnection({
			prevNetworkState: isOnline,
			dispatch,
			displayToastIfOnline: false,
			displayToastIfOffline: true,
		});

		const unsubscribe = NetInfo.addEventListener(state => {
			const isConnected = state?.isConnected ?? false;
			if (isOnline !== isConnected) {
				dispatch(updateIsOnline({ isOnline: isConnected }));
				if (isConnected) {
					showToast({
						type: 'success',
						title: "You're Back Online!",
						description: 'You can now authorize with Pubky Ring',
					});
				} else {
					showToast({
						type: 'error',
						title: 'Currently Offline',
						description: 'You need to be online to authorize with Pubky Ring',
						autoHide: false,
					});
				}
			}
		});

		// Cleanup subscription on unmount
		return (): void => unsubscribe();
	}, [dispatch, isOnline]);

	const theme = useMemo(() => {
		switch (currentTheme) {
			case ETheme.system:
				return colorScheme === 'dark' ? darkTheme : lightTheme;
			case ETheme.dark:
				return darkTheme;
			case ETheme.light:
				return lightTheme;
			default:
				return darkTheme;
		}
	}, [colorScheme, currentTheme]);

	return (
		<ThemeProvider theme={theme}>
			<SafeAreaView>
				<SheetProvider>
					<RootNavigator />
					<Toast config={_toastConfig} />
				</SheetProvider>
			</SafeAreaView>
		</ThemeProvider>
	);
}

export default App;
