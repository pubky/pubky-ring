import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SheetManager, ScrollView as ActionSheetScrollView } from 'react-native-actions-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { FlashList } from '@shopify/flash-list';
import PubkyCard from './PubkyCard.tsx';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';
import { Pubky } from '../types/pubky.ts';
import { useTranslation } from 'react-i18next';
import { parseInput } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';
import { BodyMText } from '../theme/typography.ts';

type PubkyItem = { key: string; value: Pubky };
const ROUTE_AFTER_CLOSE_DELAY = 100;

const PubkyRow = memo(
	({
		item,
		onPress,
	}: {
		item: PubkyItem;
		onPress: (key: string) => void;
	}): ReactElement => (
		<TouchableOpacity style={styles.card} onPress={() => onPress(item.key)}>
			<PubkyCard publicKey={item.key} name={item.value.name} showChevron={true} />
		</TouchableOpacity>
	),
);

const SelectPubky = ({
	payload: { deepLink },
}: {
	payload: {
		deepLink: string;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);

	const clearDeepLink = useCallback((): void => {
		dispatch(setDeepLink(''));
	}, [dispatch]);

	const closeSheet = useCallback(async (): Promise<void> => {
		clearDeepLink();
		return SheetManager.hide('select-pubky');
	}, [clearDeepLink]);

	const pubkyArray: { key: string; value: Pubky }[] = useMemo(() => {
		return Object.entries(pubkys)
			.filter(([_, value]) => value.signedUp)
			.map(([key, value]) => ({ key, value }));
	}, [pubkys]);

	const onPubkyPress = useCallback(
		async (pubky: string) => {
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
			}, ROUTE_AFTER_CLOSE_DELAY);
		},
		[deepLink, dispatch],
	);

	const message = useMemo(() => {
		return pubkyArray.length > 0 ? t('pubky.selectPubkyMessage') : t('pubky.noPubkysAvailable');
	}, [pubkyArray.length, t]);

	const renderItem = useCallback(
		(info: { item: PubkyItem }): ReactElement => (
			<PubkyRow item={info.item} onPress={onPubkyPress} />
		),
		[onPubkyPress],
	);

	const keyExtractor = useCallback((item: PubkyItem): string => item.key, []);

	return (
		<Sheet id="select-pubky" title={t('pubky.selectPubky')} onClose={clearDeepLink}>
			<BodyMText>{message}</BodyMText>
			<View style={styles.listContainer}>
				<FlashList<PubkyItem>
					data={pubkyArray}
					renderItem={renderItem}
					renderScrollComponent={ActionSheetScrollView}
					keyExtractor={keyExtractor}
					showsVerticalScrollIndicator={false}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button size="large" text={t('common.cancel')} onPress={closeSheet} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	listContainer: {
		flex: 1,
		marginTop: 24,
	},
	card: {
		marginBottom: 12,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginTop: 'auto',
	},
});

export default memo(SelectPubky);
