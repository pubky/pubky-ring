import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
	Platform,
	StyleSheet,
} from 'react-native';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
	SkiaGradient, TouchableOpacity,
} from '../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import ModalIndicator from './ModalIndicator.tsx';
import { FlashList } from 'react-native-actions-sheet/dist/src/views/FlashList';
import PubkyCard from './PubkyCard.tsx';
import { handleDeepLink } from '../utils/helpers.ts';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';
import Button from './Button.tsx';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';

const ListItemComponent = ({ name, pubky, onPress }: { name?: string; pubky: string; onPress: () => void }): ReactElement => {
	return (
		<TouchableOpacity style={styles.pubkyCard} onPress={onPress}>
			<PubkyCard publicKey={pubky} name={name} />
		</TouchableOpacity>
	);
};

const SelectPubky = ({ payload }: {
    payload: {
        deepLink: string;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);

	const closeSheet = useCallback(async (): Promise<void> => {
		dispatch(setDeepLink(''));
		return SheetManager.hide('select-pubky');
	}, [dispatch]);

	const deepLink = useMemo(() => {
		return payload?.deepLink;
	}, [payload?.deepLink]);

	const pubkyArray = useMemo(() => {
		return Object.entries(pubkys).map(([key, value]) => ({
			key,
			value,
		}));
	}, [pubkys]);

	const onPubkyPress = useCallback(async (pubky: string) => {
		await SheetManager.hide('select-pubky');
		setTimeout(() => {
			handleDeepLink({
				pubky,
				url: deepLink,
				dispatch,
			});
		}, 100);
	}, [deepLink, dispatch]);


	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="select-pubky"
				onClose={closeSheet}
				keyboardHandlerEnabled={true}
				navigationAnimation={navigationAnimation}
				modal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={'95%'}
			>
				<SkiaGradient modal={true} style={styles.content}>
					<ModalIndicator />
					<Text style={styles.title}>Select Pubky</Text>
					<SessionText style={styles.message}>
						Select which pubky you want to use to authorize this service, browser or device.
					</SessionText>
					<View style={styles.listContainer}>
						<FlashList
							data={pubkyArray}
							renderItem={({ item }) => {
								return (
									<ListItemComponent
										name={item.value.name}
										pubky={item.key}
										onPress={() => onPubkyPress(item.key)}
									/>
								);
							}}
							estimatedItemSize={120}
							keyExtractor={(item) => item.key}
							showsVerticalScrollIndicator={true}
						/>
					</View>
					<View style={styles.buttonContainer}>
						<Button
							text="Cancel"
							style={[styles.button, styles.cancelButton]}
							textStyle={styles.buttonText}
							onPress={closeSheet}
						/>
					</View>
				</SkiaGradient>
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
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
		height: '100%',
		flexDirection: 'column',
		backgroundColor: 'transparent',
	},
	listContainer: {
		flex: 1,
		marginBottom: 12,
		height: '100%',
		backgroundColor: 'transparent',
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
		textAlign: 'center',
		marginBottom: 24,
	},
	pubkyCard: {
		backgroundColor: 'transparent',
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
		marginBottom: 24,
	},
	button: {
		width: '100%',
		height: 64,
	},
	cancelButton: {
	},
	buttonText: {
		fontSize: 17,
		fontWeight: '600',
	},
});

export default memo(SelectPubky);
