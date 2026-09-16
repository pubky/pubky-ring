import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { showToast } from '@synonymdev/react-native-toast';
import { beginSheetWork, hideSheet } from '../sheets/sheetNavigation.tsx';
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
import { TextBaseM } from '../theme/typography.ts';
import type { AuthStackParamList } from '../sheets/types.ts';
import { createConfirmAuthPayload } from '../utils/actions/authAction.ts';
import { getAutoAuthFromStore } from '../utils/store-helpers.ts';
import { routeInputWithContext } from '../utils/inputHandlerUtils.ts';
import { hasValidSessionCallbacks } from '../utils/xCallback.ts';

type PubkyItem = { key: string; value: Pubky };
type SelectPubkyNavigation = NativeStackNavigationProp<AuthStackParamList, 'SelectPubky'>;

const PubkyRow = memo(
	({
		index,
		item,
		disabled,
		onPress,
	}: {
		index: number;
		item: PubkyItem;
		disabled: boolean;
		onPress: (key: string) => void;
	}): ReactElement => (
		<TouchableOpacity
			style={styles.card}
			testID={`SelectPubkyRow-${index}`}
			disabled={disabled}
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
	const [isRoutingDeepLink, setIsRoutingDeepLink] = useState(false);
	const isMountedRef = useRef(true);
	const isRoutingDeepLinkRef = useRef(false);

	const clearDeepLink = useCallback((): void => {
		dispatch(setDeepLink(''));
	}, [dispatch]);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
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
			if (isRoutingDeepLinkRef.current) return;
			isRoutingDeepLinkRef.current = true;
			setIsRoutingDeepLink(true);
			const finishSheetWork = beginSheetWork('auth');

			try {
				const parsed = await parseInput(deepLink, source);
				if (!isMountedRef.current) return;

				if (parsed.action === InputAction.Auth && parsed.data.action === InputAction.Auth) {
					if (getAutoAuthFromStore()) {
						try {
							await routeInputWithContext(parsed, pubky, source, dispatch, false);
						} finally {
							if (isMountedRef.current) hideSheet('auth');
						}
						return;
					}

					const payload = await createConfirmAuthPayload({
						data: parsed.data,
						pubky,
					});
					if (!isMountedRef.current) return;

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

				if (parsed.action === InputAction.Session && parsed.data.action === InputAction.Session) {
					if (!hasValidSessionCallbacks(parsed.data.params.xCallback)) {
						showToast({
							type: 'error',
							title: t('common.error'),
							description: t('session.invalidCallback'),
						});
						return;
					}

					navigation.navigate('ConfirmSession', {
						pubky,
						xCallback: parsed.data.params.xCallback,
					});
					dispatch(setDeepLink(''));
					return;
				}

				hideSheet('auth');
				await routeInputWithContext(parsed, pubky, source, dispatch);
			} finally {
				finishSheetWork();
				isRoutingDeepLinkRef.current = false;
				if (isMountedRef.current) setIsRoutingDeepLink(false);
			}
		},
		[deepLink, dispatch, navigation, source, t],
	);

	const message = useMemo(() => {
		return pubkyArray.length > 0 ? t('pubky.selectPubkyMessage') : t('pubky.noPubkysAvailable');
	}, [pubkyArray.length, t]);

	const renderItem = useCallback(
		(info: { item: PubkyItem; index: number }): ReactElement => (
			<PubkyRow index={info.index} item={info.item} disabled={isRoutingDeepLink} onPress={onPubkyPress} />
		),
		[isRoutingDeepLink, onPubkyPress],
	);

	const keyExtractor = useCallback((item: PubkyItem): string => item.key, []);

	return (
		<SheetScreen id="auth" title={t('pubky.selectPubky')}>
			<TextBaseM>{message}</TextBaseM>
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
				<Button size="large" text={t('common.cancel')} disabled={isRoutingDeepLink} onPress={closeSheet} />
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
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(SelectPubky);
