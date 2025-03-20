import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PubkyData, RootStackParamList } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import {
	showEditPubkyPrompt,
	showQRScanner,
} from '../utils/helpers.ts';
import { useSelector } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import {
	NavButton,
	View,
	ArrowLeft,
	Pencil,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { Dispatch } from 'redux';

type Props = NativeStackScreenProps<RootStackParamList, 'PubkyDetail'>;

const PubkyDetailScreen = ({ route, navigation }: Props): ReactElement => {
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));

	const pubkyData: PubkyData = useMemo(() => {
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showEditPubkyPrompt({
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
			<Pencil size={18.44} />
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
});

export default memo(PubkyDetailScreen);
