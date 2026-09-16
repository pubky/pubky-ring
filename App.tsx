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
import { queueDeepLink } from './src/store/slices/pubkysSlice.ts';
import { parseInput } from './src/utils/inputParser.ts';
import { consumeInitialUrls, consumeUrlEvent } from './src/utils/initialUrl.ts';
import './src/theme/toast';

let deepLinkDeliveryQueue: Promise<void> = Promise.resolve();

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
		// Handle the deep link using the unified input parser
		const handleDeepLink = async (url: string): Promise<void> => {
			const parsedInput = await parseInput(url, 'deeplink');
			dispatch(queueDeepLink(JSON.stringify(parsedInput)));
		};

		const handleDeepLinks = async (urls: string[]): Promise<void> => {
			for (const url of urls) {
				try {
					await handleDeepLink(url);
				} catch {
					console.error('Error handling deep link');
				}
			}
		};

		const enqueueDeepLinkDelivery = (urlsPromise: Promise<string[]>, errorMessage: string): void => {
			const settledUrls = urlsPromise.then(
				urls => ({ urls }) as const,
				error => ({ error }) as const,
			);

			deepLinkDeliveryQueue = deepLinkDeliveryQueue
				.then(async () => {
					const result = await settledUrls;
					if ('error' in result) throw result.error;
					await handleDeepLinks(result.urls);
				})
				.catch(() => console.error(errorMessage));
		};

		// Handle deep link when app is opened from a background state
		const handleInitialUrls = (): void => {
			enqueueDeepLinkDelivery(consumeInitialUrls(), 'Error getting initial URL:');
		};

		const handleUrlEvent = (url: string): void => {
			enqueueDeepLinkDelivery(consumeUrlEvent(url), 'Error handling URL event:');
		};

		// Set up deep link listeners for when app is already running
		const subscription = Linking.addEventListener('url', ({ url }) => {
			handleUrlEvent(url);
		});

		// Check for initial URL on mount
		handleInitialUrls();

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
