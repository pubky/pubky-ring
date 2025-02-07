import React, { useEffect, useMemo } from 'react';
import './src/sheets/sheets';
import { ThemeProvider } from 'styled-components/native';
import { darkTheme, lightTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator.tsx';
import { SheetProvider } from 'react-native-actions-sheet';
import { useColorScheme } from 'react-native';
import { ETheme } from './src/types/settings.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getIsOnline, getTheme } from './src/store/selectors/settingsSelectors.ts';
import { SafeAreaView } from './src/theme/components.ts';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/theme/toastConfig.tsx';
import NetInfo from '@react-native-community/netinfo';
import { updateIsOnline } from './src/store/slices/settingsSlice.ts';
import { checkNetworkConnection, showToast } from './src/utils/helpers.ts';

const _toastConfig = toastConfig();

function App(): React.JSX.Element {
	const colorScheme = useColorScheme();
	const currentTheme = useSelector(getTheme);
	const isOnline = useSelector(getIsOnline);
	const dispatch = useDispatch();

	useEffect(() => {
		checkNetworkConnection({
			prevNetworkState: isOnline,
			dispatch,
			displayToast: true,
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
