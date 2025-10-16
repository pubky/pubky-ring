import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { StyleSheet } from 'react-native';
import { View, TouchableOpacity } from '../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { FlashList } from 'react-native-actions-sheet/dist/src/views/FlashList';
import PubkyCard from './PubkyCard.tsx';
import { handleDeepLink } from '../utils/helpers.ts';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';
import { Pubky } from '../types/pubky.ts';
import {
	ModalWrapper,
	ModalTitle,
	ModalMessage,
	ModalButton,
	ModalButtonContainer
} from './shared';
import { ACTION_SHEET_HEIGHT } from '../utils/constants.ts';

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
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);

	const closeSheet = useCallback(async (): Promise<void> => {
		dispatch(setDeepLink(''));
		return SheetManager.hide('select-pubky');
	}, [dispatch]);

	const deepLink = useMemo(() => {
		return payload?.deepLink;
	}, [payload?.deepLink]);

	const pubkyArray: {
		key: string;
		value: Pubky;
	}[] = useMemo(() => {
		return Object.entries(pubkys)
			.filter(([_, value]) => value.signedUp)
			.map(([key, value]) => ({
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

	const message = useMemo(() => {
		return pubkyArray.length > 0
			? 'Select which pubky you want to use to authorize this service, browser or device.'
			: "You do not have any pubky's that are setup and available. Please create and setup a pubky first.";
	}, [pubkyArray.length]);

	return (
		<ModalWrapper
			id="select-pubky"
			onClose={closeSheet}
			height={ACTION_SHEET_HEIGHT}
			showToast={false}
			contentStyle={styles.container}
		>
			<ModalTitle>Select Pubky</ModalTitle>
			<ModalMessage centered>
				{message}
			</ModalMessage>
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
					keyExtractor={(item) => item.key}
					showsVerticalScrollIndicator={true}
				/>
			</View>
			<ModalButtonContainer>
				<ModalButton
					text="Cancel"
					variant="secondary"
					width="full"
					onPress={closeSheet}
				/>
			</ModalButtonContainer>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		height: '100%'
	},
	listContainer: {
		flex: 1,
		marginBottom: 12,
		height: '100%',
		backgroundColor: 'transparent',
	},
	pubkyCard: {
		backgroundColor: 'transparent',
	},
});

export default memo(SelectPubky);
