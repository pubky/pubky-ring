import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { Image, StyleSheet } from 'react-native';
import { PubkyData } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import {
	showQRScanner,
} from '../utils/helpers.ts';
import { useSelector } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import {
	NavButton,
	View,
	ArrowLeft,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { Dispatch } from 'redux';
import { useTypedNavigation, useTypedRoute } from '../navigation/hooks';
import { showEditPubkySheet } from "../utils/sheetHelpers.ts";

const PubkyDetailScreen = (): ReactElement => {
	const navigation = useTypedNavigation();
	const route = useTypedRoute<'PubkyDetail'>();
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));

	const pubkyData: PubkyData = useMemo(() => {
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showEditPubkySheet({
			title: data.signedUp ? 'Edit' : 'Setup',
			pubky,
		});
	}, [data, pubky]);

	const leftButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
			hitSlop={{ top: 20,
				bottom: 20,
				left: 20,
				right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [navigation]);

	const rightButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={onRightButtonPress}
			hitSlop={{ top: 10,
				bottom: 10,
				left: 10,
				right: 10 }}
		>
			<Image
				source={require('../images/pencil.png')}
				style={styles.pencilIcon}
			/>
		</NavButton>
	), [onRightButtonPress]);

	const handleQRPress = useCallback(async (qrData: {
		pubky: string;
		dispatch: Dispatch;
		onComplete?: () => void;
	}) => {
		return showQRScanner(qrData);
	}, []);

	return (
		<View style={styles.container}>
			<PubkyRingHeader
				leftButton={leftButton()}
				rightButton={rightButton()}
			/>
			<PubkyDetail
				index={index}
				pubkyData={pubkyData}
				onQRPress={handleQRPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	pencilIcon: {
		width: 24,
		height: 24,
		alignSelf: 'center',
	},
});

export default memo(PubkyDetailScreen);
