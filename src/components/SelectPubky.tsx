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
import { Text } from '../theme/components.ts';
import { textStyles } from '../theme/utils.ts';

type PubkyItem = { key: string; value: Pubky };
const ROUTE_AFTER_CLOSE_DELAY = 100;

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

	return (
		<Sheet id="select-pubky" title={t('pubky.selectPubky')} onClose={clearDeepLink}>
			<Text style={styles.message}>{message}</Text>
			<View style={styles.listContainer}>
				<FlashList<PubkyItem>
					data={pubkyArray}
					renderItem={({ item }) => (
						<TouchableOpacity style={styles.card} onPress={() => onPubkyPress(item.key)}>
							<PubkyCard publicKey={item.key} name={item.value.name} />
						</TouchableOpacity>
					)}
					renderScrollComponent={ActionSheetScrollView}
					keyExtractor={item => item.key}
					showsVerticalScrollIndicator={true}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button size="large" text={t('common.cancel')} onPress={closeSheet} />
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		...textStyles.bodyM,
	},
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
