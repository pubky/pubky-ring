import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PubkyData } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import AppHeader from '../components/AppHeader.tsx';
import HeaderNavButton from '../components/HeaderNavButton.tsx';
import { useTypedRoute } from '../navigation/hooks';
import { Pencil } from '../icons/index.ts';
import { showSheet } from '../sheets/sheetNavigation.tsx';

const PubkyDetailScreen = (): ReactElement => {
	const route = useTypedRoute<'PubkyDetail'>();
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));

	const pubkyData = useMemo<PubkyData | undefined>(() => {
		if (!data) return undefined;
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showSheet('edit-pubky', { pubky });
	}, [pubky]);

	const handleQRPress = useCallback(async (): Promise<void> => {
		showSheet('auth', {
			screen: 'Scanner',
			params: { pubky },
		});
	}, [pubky]);

	const rightButton = (
		<HeaderNavButton onPressIn={onRightButtonPress}>
			<Pencil size={20} />
		</HeaderNavButton>
	);

	if (!pubkyData) {
		return <View style={styles.container} />;
	}

	return (
		<View style={styles.container}>
			<AppHeader rightButton={rightButton} />
			<PubkyDetail index={index} pubkyData={pubkyData} onQRPress={handleQRPress} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(PubkyDetailScreen);
