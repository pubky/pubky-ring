import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
} from 'react';
import {
	Image,
	Linking,
	StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import { createNewPubky } from '../utils/pubky';
import { showEditPubkyPrompt, showQRScanner, showToast } from '../utils/helpers';
import { importFile } from '../utils/rnfs';
import { View, Plus, TouchableOpacity, CircleAlert, NavButton } from '../theme/components';
import PubkyRingHeader from '../components/PubkyRingHeader.tsx';
import Button from '../components/Button';
import { reorderPubkys } from '../store/slices/pubkysSlice.ts';
import PubkyBox from '../components/PubkyBox.tsx';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { getAllPubkys, getDeepLink, hasPubkys } from '../store/selectors/pubkySelectors.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { Dispatch } from 'redux';
import {
	Text,
} from '../theme/components.ts';
// @ts-ignore
import PubkyRingLogo from '../images/pubky-ring.png';
// @ts-ignore
import DeviceMobileLogo from '../images/device-mobile.png';
import { PUBKY_APP_URL } from '../utils/constants.ts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const PubkyItem = memo(({
	item,
	drag,
	isActive,
	index,
	onPress,
	onQRPress,
}: {
	item: { key: string; value: Pubky };
	drag: () => void;
	isActive: boolean;
	index: number;
	onPress: (pubky: string, index: number) => void;
	onQRPress: typeof showQRScanner;
}) => (
	<ScaleDecorator>
		<PubkyBox
			pubky={item.key}
			pubkyData={item.value}
			onQRPress={onQRPress}
			onPress={onPress}
			index={index}
			onLongPress={drag}
			disabled={isActive}
		/>
	</ScaleDecorator>
));

const HomeScreen = (): ReactElement => {
	const navigation = useNavigation<NavigationProp>();
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);
	const deepLink = useSelector(getDeepLink);
	const _hasPubkys = useSelector(hasPubkys);

	useEffect(() => {
		if (deepLink) {
			SheetManager.show('select-pubky', {
				payload: {
					deepLink,
				},
				onClose: () => {
					SheetManager.hide('select-pubky');
				},
			});
		}
	}, [deepLink]);

	const handlePubkyPress = useCallback(
		(pubky: string, index: number) => {
			navigation.navigate('PubkyDetail', { pubky, index });
		},
		[navigation],
	);

	const handleQRPress = useCallback(async (data: {
		pubky: string;
		dispatch: Dispatch;
		onComplete?: () => void;
	}) => {
		return showQRScanner(data);
	}, []);

	const createPubky = useCallback(async () => {
		const pubky = await createNewPubky(dispatch);
		if (pubky.isErr()) {
			showToast({
				type: 'error',
				title: 'Error',
				description: 'An error occurred while creating the Pubky',
			});
			return;
		}
		setTimeout( () => {
			showEditPubkyPrompt({
				title: 'Setup',
				pubky: pubky.value,
			});
		}, 200);
	}, [dispatch]);

	const importPubky = useCallback(async () => {
		const res = await importFile(dispatch);
		if (res.isErr()) {
			if (res.error?.message) {
				showToast({
					type: 'error',
					title: 'Error',
					description: res.error.message,
				});
			}
		} else {
			setTimeout( () => {
				showEditPubkyPrompt({
					title: 'Setup',
					pubky: res.value,
				});
			}, 200);
			showToast({
				type: 'success',
				title: 'Success',
				description: 'Pubky imported successfully',
			});
		}
	}, [dispatch]);

	const handleDragEnd = useCallback(({ data }: { data: { key: string; value: Pubky }[] }) => {
		if (!data) {return;}
		const newPubkys: TPubkys = {};
		data.forEach(({ key, value }) => {
			newPubkys[key] = value;
		});
		dispatch(reorderPubkys(newPubkys));
	}, [dispatch]);

	const pubkyArray = useMemo(() => {
		return Object.entries(pubkys).map(([key, value]) => ({
			key,
			value,
		}));
	}, [pubkys]);

	const renderItem = useCallback(({
		item,
		drag,
		getIndex,
		isActive,
	}: RenderItemParams<{ key: string; value: Pubky }>) => {
		const index = getIndex() ?? 0;
		return (
			<PubkyItem
				item={item}
				drag={drag}
				isActive={isActive}
				index={index}
				onPress={handlePubkyPress}
				onQRPress={handleQRPress}
			/>
		);
	}, [handlePubkyPress, handleQRPress]);

	const ListFooter = useCallback(() => (
		<Button
			style={styles.button}
			text={'Add pubky'}
			onPress={() => {
				SheetManager.show('add-pubky', {
					payload: {
						createPubky,
						importPubky,
					},
					onClose: () => {
						SheetManager.hide('add-pubky');
					},
				});
			}}
			icon={<Plus size={16} />}
		/>
	// eslint-disable-next-line react-hooks/exhaustive-deps
	), []);

	const onFooterPress = useCallback( () => {
		try {
			Linking.openURL(PUBKY_APP_URL).then();
		} catch {
			showToast({
				type: 'error',
				title: 'Error',
				description: 'Unable to open URL',
			});
		}
	}, []);

	const LeftButton = useMemo(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={() => navigation.navigate('About')}
			hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
		>
			<CircleAlert size={24} />
		</NavButton>
	), [navigation]);

	const RightButton = useMemo(() => (
		<NavButton style={styles.rightNavButton} />
	), []);

	const HeaderComponent = useMemo(() => (
		<PubkyRingHeader leftButton={LeftButton} rightButton={RightButton} />
	), [LeftButton, RightButton]);

	return (
		<View style={styles.container}>
			{_hasPubkys ? (
				<DraggableFlatList
					data={pubkyArray}
					onDragEnd={handleDragEnd}
					keyExtractor={(item, index) => `${item.key}${index}`}
					renderItem={renderItem}
					ListHeaderComponent={HeaderComponent}
					ListFooterComponent={ListFooter}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				/>
			) : (
				<View style={styles.emptyContainer}>
					<EmptyState />
				</View>
			)}

			<TouchableOpacity
				onPress={onFooterPress}
				activeOpacity={0.8}
				style={styles.footer}
			>
				<View style={styles.footerContent}>
					<View style={styles.footerWrapper}>
						<View style={styles.divider} />
						<View style={styles.footerRow}>
							<View style={styles.phoneIconContainer}>
								<Image
									source={DeviceMobileLogo}
									style={styles.deviceLogo}
								/>
								<Text style={styles.footerText}>
									Try Pubky Ring with
								</Text>
							</View>
							<View style={styles.pubkyLogoContainer}>
								<Image
									source={PubkyRingLogo}
									style={styles.pubkyLogo}
								/>
							</View>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingBottom: '100%',
	},
	emptyContainer: {
		flex: 1,
		backgroundColor: 'white',
	},
	button: {
		width: '90%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		alignSelf: 'center',
	},
	footer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
	},
	divider: {
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A',
		width: '100%',
		alignSelf: 'center',
	},
	footerContent: {
		flex: 1,
		backgroundColor: 'black',
		alignItems: 'center',
	},
	footerWrapper: {
		width: '89%',
	},
	footerRow: {
		flexDirection: 'row',
		flex: 1,
		paddingTop: 20,
		paddingBottom: 10,
		backgroundColor: 'black',
		alignItems: 'center',
	},
	phoneIconContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		backgroundColor: 'black',
	},
	footerText: {
		color: '#808080',
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
		marginLeft: 8,
		backgroundColor: 'black',
	},
	pubkyLogoContainer: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		backgroundColor: 'black',
	},
	deviceLogo: {
		height: 36,
		resizeMode: 'contain',
		alignSelf: 'center',
		justifyContent: 'center',
		backgroundColor: 'black',
	},
	pubkyLogo: {
		height: 28,
		resizeMode: 'contain',
		backgroundColor: 'black',
		marginRight: -28,
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		right: -5,
	},
	rightNavButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
});

export default memo(HomeScreen);
