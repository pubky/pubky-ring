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
import { Edit2 } from 'lucide-react-native';
import { handleClipboardData, showQRScanner } from '../utils/helpers.ts';
import { useSelector } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import {
	ChevronLeft,
	ForegroundView,
	NavButton,
} from '../theme/components.ts';

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

	return (
		<ForegroundView style={styles.container}>
			<NavButton
				style={styles.backButton}
				onPressIn={navigation.goBack}
				hitSlop={{ top: 10,
					bottom: 10,
					left: 10,
					right: 10 }}
			>
				<ChevronLeft size={24} />
			</NavButton>

			<NavButton
				style={styles.editButton}
				onPressIn={handleEdit}
				hitSlop={{ top: 10,
					bottom: 10,
					left: 10,
					right: 10 }}
			>
				<Edit2 size={24} color="#38a169" />
			</NavButton>

			<PubkyDetail
				pubkyData={pubkyData}
				onQRPress={showQRScanner}
				onCopyClipboard={handleClipboardData}
				onClose={navigation.goBack}
			/>
		</ForegroundView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backButton: {
		position: 'absolute',
		top: 40,
		left: 16,
		zIndex: 1,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	editButton: {
		position: 'absolute',
		top: 40,
		right: 16,
		zIndex: 1,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
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
