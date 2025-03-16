import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
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
import PubkyCard from './PubkyCard.tsx';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import ModalIndicator from './ModalIndicator.tsx';

const DeletePubky = ({ payload }: {
	payload: {
		publicKey?: string;
		onDelete: () => void;
	};
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { onDelete } = useMemo(() => payload, [payload]);
	const publicKey = useMemo(() => payload?.publicKey ?? '', [payload]);

	const closeSheet = useCallback((): void => {
		SheetManager.hide('delete-pubky').then();
	}, []);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="delete-pubky"
				onClose={closeSheet}
				keyboardHandlerEnabled={false}
				navigationAnimation={navigationAnimation}
				CustomHeaderComponent={<></>}
			>
				<SkiaGradient modal={true} style={styles.content}>
					<ModalIndicator />
					<Text style={styles.title}>Delete Pubky</Text>
					<SessionText style={styles.message}>
						Are you sure you want to delete pubky:
					</SessionText>
					<PubkyCard publicKey={publicKey} />
					<View style={styles.buttonContainer}>
						<Button
							text="Cancel"
							style={[styles.button, styles.cancelButton]}
							textStyle={styles.buttonText}
							onPress={closeSheet}
						/>
						<Button
							text="Delete"
							style={[styles.button, styles.deleteButton]}
							textStyle={styles.buttonText}
							onPress={onDelete}
						/>
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
		paddingBottom: 34,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
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
		marginBottom: 16,
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
		width: '45%',
		minHeight: 64,
	},
	cancelButton: {
	},
	deleteButton: {
		borderWidth: 1,
	},
	buttonText: {
		fontSize: 17,
		fontWeight: '600',
	},
});

export default memo(DeletePubky);
