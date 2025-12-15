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
import { FlashList } from '@shopify/flash-list';
import PubkyCard from './PubkyCard.tsx';
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
import { useTranslation } from 'react-i18next';
import { parseInput } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';

const ListItemComponent = memo(({ name, pubky, onPubkyPress }: {
	name?: string;
	pubky: string;
	onPubkyPress: (pubky: string) => void;
}): ReactElement => {
	const handlePress = useCallback(() => {
		onPubkyPress(pubky);
	}, [onPubkyPress, pubky]);

	return (
		<TouchableOpacity style={styles.pubkyCard} onPress={handlePress}>
			<PubkyCard publicKey={pubky} name={name} />
		</TouchableOpacity>
	);
});

const SelectPubky = ({ payload }: {
    payload: {
        deepLink: string;
    };
}): ReactElement => {
	const { t } = useTranslation();
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
		setTimeout(async () => {
			// Parse and route the deeplink with the selected pubky
			const parsed = await parseInput(deepLink, 'deeplink');
			await routeInput(parsed, {
				dispatch,
				pubky,
				isDeeplink: true,
			});
			dispatch(setDeepLink(''));
		}, 100);
	}, [deepLink, dispatch]);

	const message = useMemo(() => {
		return pubkyArray.length > 0
            ? t('pubky.selectPubkyMessage')
            : t('pubky.noPubkysAvailable');
	}, [pubkyArray.length, t]);

	const renderItem = useCallback(({ item }: { item: { key: string; value: Pubky } }) => (
		<ListItemComponent
			name={item.value.name}
			pubky={item.key}
			onPubkyPress={onPubkyPress}
		/>
	), [onPubkyPress]);

	const keyExtractor = useCallback((item: { key: string }) => item.key, []);

	return (
		<ModalWrapper
			id="select-pubky"
			onClose={closeSheet}
			height={ACTION_SHEET_HEIGHT}
			showToast={false}
			contentStyle={styles.container}
		>
			<ModalTitle>{t('pubky.selectPubky')}</ModalTitle>
			<ModalMessage centered>
				{message}
			</ModalMessage>
			<View style={styles.listContainer}>
				<FlashList
					data={pubkyArray}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					showsVerticalScrollIndicator={true}
				/>
			</View>
			<ModalButtonContainer>
				<ModalButton
					text={t('common.cancel')}
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
