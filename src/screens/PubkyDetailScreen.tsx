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
import { handleClipboardData, showQRScanner } from '../utils/helpers.ts';
import { useSelector } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import {
	ChevronLeft,
	NavButton,
	SafeAreaView,
	Edit2
} from '../theme/components.ts';
import PubkyRingHeader from "../components/PubkyRingHeader..tsx";

type Props = NativeStackScreenProps<RootStackParamList, 'PubkyDetail'>;

const PubkyDetailScreen = ({ route, navigation }: Props): ReactElement => {
	const { pubky } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));
	const pubkyData: PubkyData = useMemo(() => {
		return { ...data, pubky };
	}, [data, pubky]);
	const handleEdit = useCallback(() => {
		navigation.navigate('EditPubky', { data: pubkyData });
	}, [navigation, pubkyData]);

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
			onPressIn={handleEdit}
			hitSlop={{ top: 10,
				bottom: 10,
				left: 10,
				right: 10 }}
		>
			<Edit2 size={16} />
		</NavButton>
	), [handleEdit]);

	return (
		<SafeAreaView style={styles.container}>
			<PubkyRingHeader
				leftButton={leftButton()}
				rightButton={rightButton()}
			/>
			<PubkyDetail
				pubkyData={pubkyData}
				onQRPress={showQRScanner}
				onCopyClipboard={handleClipboardData}
				onClose={navigation.goBack}
			/>
		</SafeAreaView>
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
	}
});

export default memo(PubkyDetailScreen);
