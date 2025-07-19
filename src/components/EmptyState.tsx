import React, { ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ArrowRight, Plus, Button, NavButton, CircleAlert } from '../theme/components.ts';
import {
	createNewPubky,
	importPubky as importPubkyUtil,
} from '../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import PubkyRingHeader from './PubkyRingHeader';
import { importFile } from '../utils/rnfs.ts';
import { showEditPubkyPrompt, showToast } from '../utils/helpers.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useNavigation } from '@react-navigation/native';
import { err, ok, Result } from '@synonymdev/result';
import { IGenerateSecretKey, mnemonicPhraseToKeypair } from '@synonymdev/react-native-pubky';

const EmptyState = (): ReactElement => {
	const dispatch = useDispatch();
	const navigation = useNavigation();

	const createPubky = useCallback(async () => {
		const pubky = await createNewPubky(dispatch);
		if (pubky.isErr()) {
			showToast({
				type: 'error',
				title: 'Error',
				description: 'An error occurred while creating the Pubky',
			});
			return;
		}
		setTimeout( () => {
			showEditPubkyPrompt({
				title: 'Setup',
				pubky: pubky.value,
			});
		}, 200);
	}, [dispatch]);

	const importPubky = useCallback(async (mnemonic = ''): Promise<Result<string>> => {
		if (mnemonic) {
			const secretKeyRes: Result<IGenerateSecretKey> = await mnemonicPhraseToKeypair(mnemonic);
			if (secretKeyRes.isErr()) {
				const msg = secretKeyRes.error.message;
				showToast({
					type: 'error',
					title: 'Error',
					description: msg,
				});
				return err(msg);
			}

			const secretKey: string = secretKeyRes.value.secret_key;
			const pubky = await importPubkyUtil({ secretKey, dispatch, mnemonic });
			if (pubky.isErr()) {
				const msg = pubky.error.message;
				showToast({
					type: 'error',
					title: 'Error',
					description: msg,
				});
				return err(msg);
			}
			await SheetManager.hide('add-pubky');
			setTimeout( () => {
				showEditPubkyPrompt({
					title: 'Setup',
					pubky: pubky.value,
				});
			}, 200);
			return ok('Successfully created pubky.');
		}
		const res = await importFile(dispatch);
		if (res.isErr()) {
			const msg = res.error?.message ?? 'Unable to import file.';
			showToast({
				type: 'error',
				title: 'Error',
				description: msg,
			});
			return err(msg);
		}
		setTimeout( () => {
			showEditPubkyPrompt({
				title: 'Setup',
				pubky: res.value,
			});
		}, 200);
		const msg = 'Pubky imported successfully';
		showToast({
			type: 'success',
			title: 'Success',
			description: msg,
		});
		return ok(msg);
	}, [dispatch]);

	const onPress = useCallback(() => {
		SheetManager.show('add-pubky', {
			payload: {
				createPubky,
				importPubky,
			},
			onClose: () => {
				SheetManager.hide('add-pubky');
			},
		});
	}, [createPubky, importPubky]);

	const LeftButton = useMemo(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={() => navigation.navigate('About')}
			hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
		>
			<CircleAlert size={24} />
		</NavButton>
	), [navigation]);

	const RightButton = useMemo(() => (
		<NavButton style={styles.rightNavButton} />
	), []);

	return (
		<View style={styles.container}>
			<PubkyRingHeader leftButton={LeftButton} rightButton={RightButton} />
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
				<Button
					style={styles.buttonSecondary}
					onPressIn={onPress}
				>
					<Plus size={16} />
					<Text style={styles.buttonText}>Add pubky</Text>
				</Button>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	rightNavButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		right: -5,
	},
});

export default EmptyState;
