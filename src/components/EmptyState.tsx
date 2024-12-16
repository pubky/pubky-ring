import React, { ReactElement, useCallback } from 'react';
import { StyleSheet, Image } from 'react-native';
import { View, Text, ArrowRight, Plus, Button, TouchableOpacity } from '../theme/components.ts';
import { createNewPubky } from '../utils/pubky.ts';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme as _toggleTheme } from '../theme/helpers.ts';
import { getTheme } from '../store/selectors/settingsSelectors.ts';
import PubkyRingHeader from './PubkyRingHeader..tsx';

const EmptyState = (): ReactElement => {
	const dispatch = useDispatch();
	const theme = useSelector(getTheme);

	const createPubky = useCallback(async () => {
		await createNewPubky(dispatch);
	}, [dispatch]);

	const toggleTheme = useCallback(() => {
		_toggleTheme({ dispatch, theme });
	}, [theme, dispatch]);

	return (
		<View style={styles.container}>
			<PubkyRingHeader />
			<View style={styles.cardEmpty}>
				<View style={styles.emptyUser}>
					<View style={styles.image} />
					<View>
						<Text style={styles.name}>pubky</Text>
						<Text style={styles.pubky}>pk:xxxxx..xxxxx</Text>
					</View>
					<View style={styles.buttonArrow}>
						<ArrowRight size={24} />
					</View>
				</View>
				<Button style={styles.buttonSecondary} onPress={createPubky}>
					<Plus size={16} />
					<Text style={styles.buttonText}>Create pubky</Text>
				</Button>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
	},
	cardEmpty: {
		display: 'flex',
		padding: 24,
		marginHorizontal: 20,
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '24',
		alignSelf: 'stretch',
		borderRadius: 16,
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	emptyUser: {
		display: 'flex',
		flexDirection: 'row',
		gap: 18,
		alignSelf: 'stretch',
	},
	image: {
		width: 48,
		height: 48,
		borderRadius: '100%',
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	name: {
		fontSize: 26,
		fontWeight: 300,
		lineHeight: 26,
	},
	pubky: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 20,
		letterSpacing: 0.4,
	},
	buttonArrow: {
		display: 'flex',
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	buttonSecondary: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 16,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		justifyContent: 'center',
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
	},
});

export default EmptyState;
