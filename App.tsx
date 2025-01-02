import React, { useMemo } from 'react';
import './src/sheets/sheets';
import { ThemeProvider } from 'styled-components/native';
import { darkTheme, lightTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator.tsx';
import { SheetProvider } from 'react-native-actions-sheet';
import { useColorScheme } from 'react-native';
import { ETheme } from './src/types/settings.ts';
import { useSelector } from 'react-redux';
import { getTheme } from './src/store/selectors/settingsSelectors.ts';
import { SafeAreaView } from './src/theme/components.ts';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/theme/toastConfig.tsx';

function App(): React.JSX.Element {
	const colorScheme = useColorScheme();
	const currentTheme = useSelector(getTheme);

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
				<SheetProvider context="global">
					<RootNavigator />
					<Toast config={toastConfig} />
				</SheetProvider>
			</SafeAreaView>
		</ThemeProvider>
	);
}

export default App;
