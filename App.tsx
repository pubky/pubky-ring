import React, { useEffect, useMemo, useRef } from 'react';
import { ThemeProvider } from 'styled-components/native';
import { showToast } from '@synonymdev/react-native-toast';
import { Linking, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { darkTheme, lightTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator.tsx';
import { ETheme } from './src/types/settings.ts';
import { getIsOnline, getTheme } from './src/store/selectors/settingsSelectors.ts';
import SafeAreaView from './src/components/SafeAreaView.tsx';
import { updateIsOnline } from './src/store/slices/settingsSlice.ts';
import { checkNetworkConnection } from './src/utils/helpers.ts';
import { setDeepLink } from './src/store/slices/pubkysSlice.ts';
import { parseInput } from './src/utils/inputParser.ts';
import { claimInitialUrl } from './src/utils/initialUrl.ts';
import './src/theme/toast';

function App(): React.JSX.Element {
	const colorScheme = useColorScheme();
	const currentTheme = useSelector(getTheme);
	const isOnline = useSelector(getIsOnline);
	const isOnlineRef = useRef(isOnline);
	isOnlineRef.current = isOnline;
	const dispatch = useDispatch();
	const { t } = useTranslation();

	// Handle deep linking
	useEffect(() => {
		// Handle deep link when app is opened from a background state
		const getInitialURL = async (): Promise<void> => {
			try {
				const url = await Linking.getInitialURL();
				// Android can hand back the intent that created the task, which may be a deeplink from
				// an earlier run. Only ever act on a given initial URL once.
				if (url && claimInitialUrl(url)) {
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
				prevNetworkState: isOnlineRef.current,
				dispatch,
				displayToastIfOnline: false,
				displayToastIfOffline: true,
			});
		}, 500);

		const unsubscribe = NetInfo.addEventListener(state => {
			const isConnected = state?.isConnected ?? false;
			if (isOnlineRef.current !== isConnected) {
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
	}, [dispatch, t]);

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
				<SafeAreaView edges={['top', 'left', 'right']}>
					<RootNavigator />
				</SafeAreaView>
			</SafeAreaProvider>
		</ThemeProvider>
	);
}

export default App;
