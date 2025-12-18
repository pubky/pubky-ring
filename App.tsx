import React, { useEffect, useMemo } from 'react';
import './src/sheets';
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
import { checkNetworkConnection, showToast } from './src/utils/helpers.ts';
import { setDeepLink } from './src/store/slices/pubkysSlice.ts';
import { parseInput } from './src/utils/inputParser.ts';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const _toastConfig = toastConfig();

function App(): React.JSX.Element {
	const colorScheme = useColorScheme();
	const currentTheme = useSelector(getTheme);
	const isOnline = useSelector(getIsOnline);
	const dispatch = useDispatch();
	const { t } = useTranslation();

	// Handle deep linking
	useEffect(() => {
		// Handle deep link when app is opened from a background state
		const getInitialURL = async (): Promise<void> => {
			try {
				let url = await Linking.getInitialURL();
				if (url) {
					handleDeepLink(url);
				}
			} catch (err) {
				console.error('Error getting initial URL:', err);
			}
		};

		// Handle the deep link using the unified input parser
		const handleDeepLink = async (url: string): Promise<void> => {
			const parsedInput = await parseInput(url, 'deeplink');
			dispatch(setDeepLink(JSON.stringify(parsedInput)));
		};

		// Set up deep link listeners for when app is already running
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
		// Defer network check to avoid blocking initial render
		const timer = setTimeout(() => {
			checkNetworkConnection({
				prevNetworkState: isOnline,
				dispatch,
				displayToastIfOnline: false,
				displayToastIfOffline: true,
			});
		}, 500);

		const unsubscribe = NetInfo.addEventListener(state => {
			const isConnected = state?.isConnected ?? false;
			if (isOnline !== isConnected) {
				dispatch(updateIsOnline({ isOnline: isConnected }));
				if (isConnected) {
					showToast({
						type: 'success',
						title: t('network.backOnline'),
						description: t('network.backOnlineDescription'),
					});
				} else {
					showToast({
						type: 'error',
						title: t('network.currentlyOffline'),
						description: t('network.offlineDescription'),
						autoHide: false,
					});
				}
			}
		});

		// Cleanup subscription on unmount
		return (): void => {
			clearTimeout(timer);
			unsubscribe();
		};
	}, [dispatch, isOnline, t]);

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
			<SafeAreaProvider>
				<SafeAreaView>
					<SheetProvider>
						<RootNavigator />
						<Toast config={_toastConfig} />
					</SheetProvider>
				</SafeAreaView>
			</SafeAreaProvider>
		</ThemeProvider>
	);
}

export default App;
