import { Image, StyleSheet } from 'react-native';
import React, { memo, ReactElement, useCallback } from 'react';
import { TouchableOpacity, View } from '../theme/components.ts';
import { toggleTheme as _toggleTheme } from '../theme/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getTheme } from '../store/selectors/settingsSelectors.ts';

const PubkyRingHeader = ({
	leftButton = undefined,
	rightButton = undefined,
}: {
	leftButton?: ReactElement;
	rightButton?: ReactElement;
}): ReactElement => {
	const dispatch = useDispatch();
	const theme = useSelector(getTheme);

	const toggleTheme = useCallback(() => {
		_toggleTheme({ dispatch, theme });
	}, [theme, dispatch]);

	return (
		<View style={styles.container}>
			{leftButton}
			<TouchableOpacity
				activeOpacity={1}
				onLongPress={toggleTheme}
				style={styles.logoWrapper}
			>
				<Image
					source={require('../images/pubky-ring-logo.png')}
					style={styles.logo}
				/>
			</TouchableOpacity>
			{rightButton}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignContent: 'center',
	},
	logoWrapper: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'black',
		borderRadius: 40,
		width: '60%',
		height: 50,
		marginTop: 13,
		marginBottom: 15,
	},
	logo: {
		width: 171,
		height: 36,
		resizeMode: 'contain',
		alignSelf: 'center',
		justifyContent: 'center',
	},
});

export default memo(PubkyRingHeader);
