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
	SafeAreaView,
	ScrollView,
	View,
	ForegroundTouchableOpacity,
	SessionText,
} from '../theme/components.ts';
import { RootState } from '../store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = (): ReactElement => {
	const navigation = useNavigation<NavigationProp>();
	const dispatch = useDispatch();
	const { pubkys = {} } = useSelector((state: RootState): PubkyState => state.pubky);
	const hasPubkys = useMemo(() =>  Object.keys(pubkys).length > 0, [pubkys]);

	useEffect(() => {
		const backAction = (): boolean => true;
		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction
		);
		return (): void => backHandler.remove();
	}, []);

	const handlePubkyPress = useCallback((pubky: string) => {
		navigation.navigate('PubkyDetail', { pubky });
	}, [navigation]);

	const createPubky = useCallback(async () => {
		await createNewPubky(dispatch);
	}, [dispatch]);

	const handleOnLongPress = useCallback(async () => {
		const res = await importFile(dispatch);
		if (res.isErr()) {
			if (res.error?.message) {Alert.alert('Error', res.error.message);}
		} else {
			Alert.alert('Success', 'Pubky imported successfully');
		}
	}, [dispatch]);

	return (
		<SafeAreaView style={styles.container}>
			{hasPubkys ? (
				<ScrollView
        	contentInsetAdjustmentBehavior="automatic"
        	style={styles.scrollView}
				>
					{Object.keys(pubkys).map((pubky, index) => (
						<PubkyBox
        			key={index}
        			pubky={pubky}
        			pubkyData={pubkys[pubky]}
        			sessionsCount={pubkys[pubky].sessions.length}
        			onQRPress={showQRScanner}
        			onCopyClipboard={handleClipboardData}
        			onPress={handlePubkyPress}
        		/>
        	))}
				</ScrollView>
      ) : (
	<View style={styles.emptyContainer}>
		<EmptyState />
	</View>
      )}
			<ForegroundTouchableOpacity
				onPress={createPubky}
				onLongPress={handleOnLongPress}
				style={styles.absoluteButton}
			>
				<SessionText style={styles.buttonText}>+</SessionText>
			</ForegroundTouchableOpacity>
		</SafeAreaView>
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
	absoluteButton: {
		position: 'absolute',
		bottom: 30,
		alignSelf: 'center',
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	buttonText: {
		fontSize: 24,
		fontWeight: 'bold',
		bottom: 1,
	},
	scrollView: {
		flex: 1,
		paddingVertical: 8,
	},
});

export default memo(HomeScreen);
