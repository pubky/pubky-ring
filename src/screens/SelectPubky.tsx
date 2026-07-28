import React, { memo, ReactElement, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { FlashList } from '@shopify/flash-list';
import PubkyCard from '../components/PubkyCard.tsx';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';
import { Pubky } from '../types/pubky.ts';
import { useTranslation } from 'react-i18next';
import { InputAction, parseInput } from '../utils/inputParser';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { BodyMText } from '../theme/typography.ts';
import type { AuthStackParamList } from '../sheets/types.ts';
import { createConfirmAuthPayload } from '../utils/actions/authAction.ts';
import { showToast } from '../utils/helpers.ts';
import { getAutoAuthFromStore } from '../utils/store-helpers.ts';
import { routeInputWithContext } from '../utils/inputHandlerUtils.ts';

type PubkyItem = { key: string; value: Pubky };
type SelectPubkyNavigation = NativeStackNavigationProp<AuthStackParamList, 'SelectPubky'>;

const PubkyRow = memo(
	({
		index,
		item,
		onPress,
	}: {
		index: number;
		item: PubkyItem;
		onPress: (key: string) => void;
	}): ReactElement => (
		<TouchableOpacity
			style={styles.card}
			testID={`SelectPubkyRow-${index}`}
			onPress={() => onPress(item.key)}
		>
			<PubkyCard publicKey={item.key} name={item.value.name} showChevron={true} />
		</TouchableOpacity>
	),
);

const SelectPubky = ({ route }: NativeStackScreenProps<AuthStackParamList, 'SelectPubky'>): ReactElement => {
	const { t } = useTranslation();
	const navigation = useNavigation<SelectPubkyNavigation>();
	const { deepLink, source } = route.params;
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);

	const clearDeepLink = useCallback((): void => {
		dispatch(setDeepLink(''));
	}, [dispatch]);

	useEffect(() => {
		return () => {
			if (source === 'deeplink') {
				clearDeepLink();
			}
		};
	}, [clearDeepLink, source]);

	const closeSheet = useCallback((): void => {
		clearDeepLink();
		hideSheet('auth');
	}, [clearDeepLink]);

	const pubkyArray: { key: string; value: Pubky }[] = useMemo(() => {
		return Object.entries(pubkys)
			.filter(([_, value]) => value.signedUp)
			.map(([key, value]) => ({ key, value }));
	}, [pubkys]);

	const onPubkyPress = useCallback(
		async (pubky: string) => {
			const parsed = await parseInput(deepLink, source);

			if (parsed.action === InputAction.Auth && parsed.data.action === InputAction.Auth) {
				if (getAutoAuthFromStore()) {
					hideSheet('auth');
					await routeInputWithContext(parsed, pubky, source, dispatch);
					return;
				}

				const payload = await createConfirmAuthPayload({
					data: parsed.data,
					pubky,
				});

				if (payload.isErr()) {
					showToast({
						type: 'error',
						title: t('common.error'),
						description: payload.error.message,
					});
					return;
				}

				navigation.navigate('ConfirmAuth', payload.value);
				dispatch(setDeepLink(''));
				return;
			}

			hideSheet('auth');
			await routeInputWithContext(parsed, pubky, source, dispatch);
		},
		[deepLink, dispatch, navigation, source, t],
	);

	const message = useMemo(() => {
		return pubkyArray.length > 0 ? t('pubky.selectPubkyMessage') : t('pubky.noPubkysAvailable');
	}, [pubkyArray.length, t]);

	const renderItem = useCallback(
		(info: { item: PubkyItem; index: number }): ReactElement => (
			<PubkyRow index={info.index} item={info.item} onPress={onPubkyPress} />
		),
		[onPubkyPress],
	);

	const keyExtractor = useCallback((item: PubkyItem): string => item.key, []);

	return (
		<SheetScreen id="auth" title={t('pubky.selectPubky')}>
			<BodyMText>{message}</BodyMText>
			<View style={styles.listContainer}>
				<FlashList<PubkyItem>
					data={pubkyArray}
					renderItem={renderItem}
					renderScrollComponent={ScrollView}
					keyExtractor={keyExtractor}
					showsVerticalScrollIndicator={false}
				/>
			</View>

			<View style={styles.buttonContainer}>
				<Button size="large" text={t('common.cancel')} onPress={closeSheet} />
			</View>
		</SheetScreen>
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
