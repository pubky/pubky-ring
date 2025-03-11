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
	ChevronLeft,
	NavButton,
	Edit2,
	View,
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
			hitSlop={{ top: 10,
				bottom: 10,
				left: 10,
				right: 10 }}
		>
			<ChevronLeft size={16} />
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
			<Edit2 size={16} />
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
		width: 32,
		height: 32,
		borderRadius: 20,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
});

export default memo(PubkyDetailScreen);
