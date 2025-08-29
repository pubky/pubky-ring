import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { SheetManager } from 'react-native-actions-sheet';
import PubkyCard from './PubkyCard.tsx';
import { getPubky, getPubkyIndex } from '../store/selectors/pubkySelectors.ts';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { truncatePubky, truncateStr } from '../utils/pubky.ts';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
	RadialGradient,
} from '../theme/components.ts';
import {
	ACTION_SHEET_HEIGHT,
	BLUE_RADIAL_GRADIENT,
} from '../utils/constants.ts';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { Image, Platform, StyleSheet } from 'react-native';
import ModalIndicator from './ModalIndicator.tsx';
import Button from './Button.tsx';

const DeletePubky = ({ payload }: {
	payload: {
		publicKey?: string;
		onDelete: () => void;
	};
}): ReactElement => {
	const { onDelete } = useMemo(() => payload, [payload]);
	const publicKey = useMemo(() => payload?.publicKey ?? '', [payload]);
	const pubkyData = useSelector((state: RootState) => getPubky(state, publicKey));
	const pubkyIndex = useSelector((state: RootState) => getPubkyIndex(state, publicKey));
	const navigationAnimation = useSelector(getNavigationAnimation);

	const name = useMemo(() => truncateStr(pubkyData?.name, 8) || `pubky #${pubkyIndex + 1}`, [pubkyData, pubkyIndex]);

	const closeSheet = useCallback((): void => {
		SheetManager.hide('delete-pubky').then();
	}, []);

	return (
		<ActionSheetContainer
			id="delete-pubky"
			onClose={closeSheet}
			navigationAnimation={navigationAnimation}
			keyboardHandlerEnabled={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={ACTION_SHEET_HEIGHT}
		>
			<RadialGradient
				style={styles.content}
				colors={BLUE_RADIAL_GRADIENT}
				center={{ x: 0.5, y: 0.5 }}
			>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					<Text style={styles.title}>Delete Pubky</Text>
				</View>
				<SessionText style={styles.message}>
					Are you sure you want to delete this pubky?
				</SessionText>
				<PubkyCard
					name={name}
					publicKey={truncatePubky(publicKey)}
					style={styles.pubkyCard}
					containerStyle={styles.pubkyContainer}
					nameStyle={styles.pubkyName}
					pubkyTextStyle={styles.pubkyText}
					avatarSize={48}
					avatarStyle={styles.avatarContainer}
				/>
				<View style={styles.trashContainer}>
					<Image
						source={require('../images/trash.png')}
						style={styles.importImage}
					/>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						text={'Cancel'}
						style={[styles.button, styles.cancelButton]}
						textStyle={styles.buttonText}
						onPress={closeSheet}
					/>
					<Button
						text={'Delete'}
						style={[styles.button, styles.deleteButton]}
						textStyle={styles.buttonText}
						onPress={onDelete}
					/>
				</View>
			</RadialGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '100%',
		backgroundColor: 'transparent',
	},
	trashContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		marginBottom: 8,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'left',
		marginBottom: 24,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	pubkyCard: {
		marginBottom: 32,
		minHeight: 90,
	},
	pubkyContainer: {
		padding: 24,
	},
	avatarContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
	},
	pubkyName: {
		fontSize: 26,
		fontWeight: '300',
		lineHeight: 26,
		letterSpacing: 0,
		marginBottom: 2,
	},
	pubkyText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 20,
		letterSpacing: -0.4,
		color: 'rgba(255, 255, 255, 0.55)',
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
		marginBottom: 10,
	},
	button: {
		width: '47%',
		minHeight: 64,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
	},
	importImage: {
		width: 342.57,
		height: 342.57,
		alignSelf: 'center',
	},
	cancelButton: {
	},
	deleteButton: {
		borderWidth: 1,
	},
});

export default memo(DeletePubky);
