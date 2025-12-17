import React, { memo, ReactElement, useCallback, useMemo, useState, } from 'react';
import { Platform, StyleSheet, } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionSheetContainer, View, } from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../../store/selectors/settingsSelectors.ts';
import { PubkyData } from '../../navigation/types.ts';
import { Pubky } from '../../types/pubky.ts';
import NewHomeserverSetup from './NewHomeserverSetup.tsx';
import InviteCode from './InviteCode.tsx';
import RequestInviteCode from './RequestInviteCode.tsx';
import Welcome from './Welcome.tsx';
import PubkyReview from './PubkyReview.tsx';
import { defaultPubkyState } from '../../store/shapes/pubky.ts';
import {
	ACTION_SHEET_HEIGHT,
	ACTION_SHEET_HEIGHT_TEXTINPUT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../../utils/constants.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { toastConfig } from '../../theme/toastConfig.tsx';
import Toast from 'react-native-toast-message';
import { getToastStyle, isSmallScreen } from '../../utils/helpers.ts';

const toastStyle = getToastStyle();
const smallScreen = isSmallScreen();

export enum ECurrentScreen {
    main = 'main',
    homeserver = 'homeserver',
    inviteCode = 'inviteCode',
    requestInvite = 'requestInvite',
    welcome = 'welcome',
}

interface ContentProps {
    currentScreen: ECurrentScreen;
    title: string;
    subTitle: string;
    pubky: string;
    pubkyData: PubkyData;
    isInvite?: boolean;
    setCurrentScreen: (screen: ECurrentScreen) => void;
    closeSheet: () => Promise<void>;
}

const Content = ({
	currentScreen,
	title,
	subTitle,
	pubky,
	pubkyData,
	isInvite,
	setCurrentScreen,
	closeSheet
}: ContentProps): ReactElement => {
	const { t } = useTranslation();
	switch (currentScreen) {
		case ECurrentScreen.main:
			return (
				<View style={styles.fullSize}>
					<PubkyReview
						modalTitle={title}
						headerText={t('pubky.yourPubky')}
						description={subTitle}
						pubky={pubky}
						pubkyData={pubkyData}
						onContinue={() => setCurrentScreen(ECurrentScreen.homeserver)}
					/>
				</View>
			);
		case ECurrentScreen.homeserver:
			return (
				<View style={styles.fullSize}>
					<NewHomeserverSetup payload={{
						pubky,
						onContinue: () => setCurrentScreen(ECurrentScreen.inviteCode)
					}} />
				</View>
			);
		case ECurrentScreen.inviteCode:
			return (
				<View style={styles.fullSize}>
					<InviteCode payload={{
						pubky,
						onContinue: () => setCurrentScreen(ECurrentScreen.welcome),
						onRequestInvite: () => setCurrentScreen(ECurrentScreen.requestInvite)
					}} />
				</View>
			);
		case ECurrentScreen.requestInvite:
			return (
				<View style={styles.fullSize}>
					<RequestInviteCode payload={{
						onBack: () => setCurrentScreen(ECurrentScreen.inviteCode)
					}} />
				</View>
			);
		case ECurrentScreen.welcome:
			return (
				<View style={styles.fullSize}>
					<Welcome payload={{
						pubky,
						onComplete: closeSheet,
						isInvite
					}} />
				</View>
			);
	}
};

const NewPubkySetup = ({ payload }: {
    payload: {
        currentScreen?: ECurrentScreen;
        pubky: string;
        data?: Pubky;
        isInvite?: boolean;
    };
}): ReactElement => {
	const { t } = useTranslation();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const [currentScreen, setCurrentScreen] = useState<ECurrentScreen>(
		payload?.currentScreen ?? ECurrentScreen.main
	);
	const [pubky] = useState(payload?.pubky ?? '');

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	const title = useMemo(() => {
		switch (currentScreen) {
			case ECurrentScreen.main:
				return t('newPubkySetup.newPubky');
			case ECurrentScreen.homeserver:
				return t('homeserver.title');
			case ECurrentScreen.inviteCode:
				return t('newPubkySetup.pubkyHomeserver');
			case ECurrentScreen.welcome:
				return t('newPubkySetup.pubkyHomeserver');
			default:
				return t('addPubky.title');
		}
	}, [currentScreen, t]);

	const acionSheetHeight = useMemo(() => {
		switch (currentScreen) {
			case ECurrentScreen.inviteCode:
				return ACTION_SHEET_HEIGHT_TEXTINPUT;
			case (ECurrentScreen.welcome):
				return smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;
			default:
				return ACTION_SHEET_HEIGHT;
		}
	}, [currentScreen]);

	// Disable keyboard handler for inviteCode screen to prevent button from jumping
	const keyboardHandlerEnabled = useMemo(() => {
		if (currentScreen === ECurrentScreen.inviteCode) {
			return false;
		}
		return Platform.OS === 'ios';
	}, [currentScreen]);

	const subTitle = useMemo(() => {
		return t('newPubkySetup.newPubkyDescription');
	}, [t]);

	const pubkyData: PubkyData = useMemo(() => {
		const _data = payload?.data ?? defaultPubkyState;
		return { pubky, ..._data };
	}, [payload.data, pubky]);


	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="new-pubky-setup"
				navigationAnimation={navigationAnimation}
				keyboardHandlerEnabled={keyboardHandlerEnabled}
				//isModal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={acionSheetHeight}
			>
				<Content
					currentScreen={currentScreen}
					title={title}
					subTitle={subTitle}
					pubky={pubky}
					pubkyData={pubkyData}
					isInvite={payload?.isInvite}
					setCurrentScreen={setCurrentScreen}
					closeSheet={closeSheet}
				/>
				<Toast config={toastConfig({ style: toastStyle })} />
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	fullSize: {
		height: '100%',
		width: '100%',
	},
});

export default memo(NewPubkySetup);
