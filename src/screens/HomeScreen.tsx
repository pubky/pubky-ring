import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
} from 'react';
import {
	Alert,
	BackHandler,
	StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/types';
import PubkyBox from '../components/PubkyBox';
import EmptyState from '../components/EmptyState';
import { PubkyState } from '../types/pubky';
import { createNewPubky } from '../utils/pubky';
import { showQRScanner, handleClipboardData } from '../utils/helpers';
import { importFile } from '../utils/rnfs';
import {
	ScrollView,
	View,
	Plus,
} from '../theme/components.ts';
import { RootState } from '../store';
import { updateShowOnboarding } from '../store/slices/settingsSlice.ts';
import PubkyRingHeader from '../components/PubkyRingHeader..tsx';
import Button from '../components/Button.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = (): ReactElement => {
	const navigation = useNavigation<NavigationProp>();
	const dispatch = useDispatch();
	const { pubkys = {} } = useSelector(
		(state: RootState): PubkyState => state.pubky,
	);
	const hasPubkys = useMemo(() => Object.keys(pubkys).length > 0, [pubkys]);

	useEffect(() => {
		const backAction = (): boolean => true;
		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction,
		);
		return (): void => backHandler.remove();
	}, []);

	const handlePubkyPress = useCallback(
		(pubky: string) => {
			navigation.navigate('PubkyDetail', { pubky });
		},
		[navigation],
	);

	const createPubky = useCallback(async () => {
		await createNewPubky(dispatch);
	}, [dispatch]);

	const importPubky = useCallback(async () => {
		const res = await importFile(dispatch);
		if (res.isErr()) {
			if (res.error?.message) {
				Alert.alert('Error', res.error.message);
			}
		} else {
			Alert.alert('Success', 'Pubky imported successfully');
		}
	}, [dispatch]);

	const showOnboarding = useCallback(() => {
		if (__DEV__) {
			dispatch(updateShowOnboarding({ showOnboarding: true }));
		}
	},[dispatch]);

	return (
		<View style={styles.container}>
			{hasPubkys ? (
				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					style={styles.scrollView}
					contentContainerStyle={styles.scrollViewContent}
				>
					<PubkyRingHeader />
					{Object.keys(pubkys).map((pubky, index) => (
						<PubkyBox
							key={index}
							index={index}
							pubky={pubky}
							pubkyData={pubkys[pubky]}
							sessionsCount={pubkys[pubky].sessions.length}
							onQRPress={showQRScanner}
							onCopyClipboard={handleClipboardData}
							onPress={handlePubkyPress}
						/>
					))}
					<Button
						style={styles.button}
						text={'Create another pubky'}
						onPress={createPubky}
						onLongPress={importPubky}
						icon={<Plus size={16} />}
					/>
				</ScrollView>
			) : (
				<View style={styles.emptyContainer}>
					<EmptyState />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	emptyContainer: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		width: '100%',
	},
	logoWrapper: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'black',
		borderRadius: 40,
		width: '60%',
		height: 50,
		marginTop: 5,
		marginBottom: 15,
	},
	logo: {
		width: 171,
		height: 36,
		resizeMode: 'contain',
		display: 'flex',
		alignSelf: 'center',
		marginTop: 20,
		marginBottom: 20,
	},
	button: {
		width: '90%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		alignSelf: 'center',
	},
	buttonSecondary: {
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
	},
	buttonPrimary: {
		borderColor: 'white',
		borderWidth: 1,
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		paddingBottom: '100%',
	},
});

export default memo(HomeScreen);
