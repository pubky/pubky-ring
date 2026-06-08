import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { SheetManager } from 'react-native-actions-sheet';
import { useTranslation } from 'react-i18next';
import { PubkyData } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import AppHeader from '../components/AppHeader.tsx';
import HeaderNavButton from '../components/HeaderNavButton.tsx';
import { useTypedNavigation, useTypedRoute } from '../navigation/hooks';
import { showEditPubkySheet } from '../utils/sheetHelpers.ts';
import { useInputHandler } from '../hooks/useInputHandler';
import SafeAreaView from '../components/SafeAreaView.tsx';
import { Pencil } from '../icons/index.ts';
import { deletePubky } from '../utils/pubky.ts';
import { showToast } from '../utils/helpers.ts';

const PubkyDetailScreen = (): ReactElement => {
	const { t } = useTranslation();
	const route = useTypedRoute<'PubkyDetail'>();
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));
	const { showScanner } = useInputHandler({ pubky });

	const pubkyData = useMemo<PubkyData | undefined>(() => {
		if (!data) return undefined;
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showEditPubkySheet({
			title: data.signedUp ? t('common.edit') : t('pubky.setup'),
			pubky,
		});
	}, [data, pubky]);

	const handleQRPress = useCallback(() => {
		return showScanner({ pubky });
	}, [showScanner, pubky]);

	const handleDelete = useCallback(async () => {
		const deleteRes = await deletePubky(pubky, dispatch);
		if (deleteRes.isErr()) {
			showToast({
				type: 'error',
				title: t('pubkyErrors.failedToDelete'),
				description: t('pubkyErrors.deleteError'),
			});
			return;
		}

		await SheetManager.hide('delete-pubky');
		navigation.goBack();
	}, [dispatch, navigation, pubky]);

	const rightButton = (
		<HeaderNavButton onPressIn={onRightButtonPress}>
			<Pencil size={24} />
		</HeaderNavButton>
	);

	if (!pubkyData) {
		return <SafeAreaView edges={['bottom']} />;
	}

	return (
		<SafeAreaView edges={['bottom']}>
			<AppHeader rightButton={rightButton} />
			<PubkyDetail index={index} pubkyData={pubkyData} onQRPress={handleQRPress} onDelete={handleDelete} />
		</SafeAreaView>
	);
};

export default memo(PubkyDetailScreen);
