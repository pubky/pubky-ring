import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
	Image,
	Platform,
	StyleSheet,
} from 'react-native';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
	SkiaGradient,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import ModalIndicator from './ModalIndicator.tsx';

const AddPubky = ({ payload }: {
    payload: {
        createPubky: () => void;
        importPubky: () => void;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { createPubky, importPubky } = useMemo(() => payload, [payload]);
	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('add-pubky');
	}, []);

	const onImportPubky = useCallback(async (): Promise<void> => {
		try {
			await closeSheet();
			setTimeout(() => {
				importPubky();
			}, 100);
		} catch {}
	}, [importPubky, closeSheet]);

	const onCreatePubky = useCallback(() => {
		closeSheet();
		createPubky();
	}, [createPubky, closeSheet]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="add-pubky"
				onClose={closeSheet}
				keyboardHandlerEnabled={true}
				navigationAnimation={navigationAnimation}
				modal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={'85%'}
			>
				<SkiaGradient modal={true} style={styles.content}>
					<ModalIndicator />
					<Text style={styles.title}>Add Pubky</Text>
					<SessionText style={styles.message}>
						Do you want to create a new pubky or import an existing one?
					</SessionText>
					<View style={styles.keyContainer}>
						<Image
							source={require('../images/add-pubky-key.png')}
							style={styles.keyImage}
						/>
					</View>
					<View style={styles.buttonWrapper}>
						<View style={styles.buttonContainer}>
							<Button
								text="Import pubky"
								style={[styles.button, styles.importButton]}
								textStyle={styles.buttonText}
								onPress={onImportPubky}
							/>
							<Button
								text="Create pubky"
								style={[styles.button, styles.createButton]}
								textStyle={styles.buttonText}
								onPress={onCreatePubky}
							/>
						</View>
					</View>
				</SkiaGradient>
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	// TODO: Eventially remove the absolute positioned container View.
	// It only exists because the ActionSheetContainer does not work well with the DraggableFlatList component.
	container: {
		...absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '98%',
	},
	buttonWrapper: {
		flex: 0.3,
		backgroundColor: 'transparent',
		justifyContent: 'flex-end',
	},
	keyContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 24,
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		alignSelf: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'space-around',
		gap: 12,
		paddingVertical: 12,
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
		minHeight: 64,
	},
	importButton: {
	},
	createButton: {
		borderWidth: 1,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
	},
	keyImage: {
		width: 350,
		height: 350,
		alignSelf: 'center',
	},
});

export default memo(AddPubky);
