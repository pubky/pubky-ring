import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
	StyleSheet,
	Platform,
} from 'react-native';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import PubkyCard from './PubkyCard.tsx';

const DeletePubky = ({ payload }: {
	payload: {
		publicKey?: string;
		onDelete: () => void;
	};
}): ReactElement => {
	const { onDelete } = useMemo(() => payload, [payload]);
	const publicKey = useMemo(() => payload?.publicKey ?? '', [payload]);

	const closeSheet = useCallback((): void => {
		SheetManager.hide('delete-pubky').then();
	}, []);

	return (
		<ActionSheetContainer
			id="delete-pubky"
			gestureEnabled={true}
			indicatorStyle={styles.indicator}
			onClose={closeSheet}
			defaultOverlayOpacity={0.3}
			statusBarTranslucent
			drawUnderStatusBar={false}
			springOffset={50}
			keyboardHandlerEnabled={Platform.OS === 'ios'}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Delete Pubky</Text>
				<SessionText style={styles.message}>
					Are you sure you want to delete this pubky?
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
			</View>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 20,
		paddingBottom: 34,
	},
	indicator: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginTop: 12,
		marginBottom: 20,
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
	},
	button: {
		width: '45%',
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
