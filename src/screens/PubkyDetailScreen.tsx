import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { PubkyData } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import { useSelector } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import AppHeader from '../components/AppHeader.tsx';
import HeaderNavButton from '../components/HeaderNavButton.tsx';
import { useTypedRoute } from '../navigation/hooks';
import { showEditPubkySheet } from '../utils/sheetHelpers.ts';
import { useInputHandler } from '../hooks/useInputHandler';
import i18n from '../i18n';
import SafeAreaView from '../components/SafeAreaView.tsx';
import { Pencil } from '../icons/index.ts';

const PubkyDetailScreen = (): ReactElement => {
	const route = useTypedRoute<'PubkyDetail'>();
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));
	const { showScanner } = useInputHandler({ pubky });

	const pubkyData: PubkyData = useMemo(() => {
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showEditPubkySheet({
			title: data.signedUp ? i18n.t('common.edit') : i18n.t('pubky.setup'),
			pubky,
		});
	}, [data, pubky]);

	const handleQRPress = useCallback(() => {
		return showScanner({ pubky });
	}, [showScanner, pubky]);

	const rightButton = (
		<HeaderNavButton onPressIn={onRightButtonPress}>
			<Pencil size={24} />
		</HeaderNavButton>
	);

	return (
		<SafeAreaView edges={['bottom']}>
			<AppHeader rightButton={rightButton} />
			<PubkyDetail index={index} pubkyData={pubkyData} onQRPress={handleQRPress} />
		</SafeAreaView>
	);
};

export default memo(PubkyDetailScreen);
