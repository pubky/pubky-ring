import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
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
			<Image source={require('../images/pencil.png')} style={styles.pencilIcon} />
		</HeaderNavButton>
	);

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<AppHeader rightButton={rightButton} />
			<PubkyDetail index={index} pubkyData={pubkyData} onQRPress={handleQRPress} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	pencilIcon: {
		width: 24,
		height: 24,
		alignSelf: 'center',
	},
});

export default memo(PubkyDetailScreen);
