import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SheetManager } from 'react-native-actions-sheet';
import { PubkyData } from '../../navigation/types.ts';
import { Pubky } from '../../types/pubky.ts';
import NewHomeserverSetup from './NewHomeserverSetup.tsx';
import InviteCode from './InviteCode.tsx';
import RequestInviteCode from './RequestInviteCode.tsx';
import Welcome from './Welcome.tsx';
import PubkyReview from './PubkyReview.tsx';
import { defaultPubkyState } from '../../store/shapes/pubky.ts';
import Sheet from '../Sheet.tsx';

export enum ECurrentScreen {
	main = 'main',
	homeserver = 'homeserver',
	inviteCode = 'inviteCode',
	requestInvite = 'requestInvite',
	welcome = 'welcome',
}

interface ContentProps {
	currentScreen: ECurrentScreen;
	subTitle: string;
	pubky: string;
	pubkyData: PubkyData;
	isInvite?: boolean;
	setCurrentScreen: (screen: ECurrentScreen) => void;
	closeSheet: () => Promise<void>;
}

const Content = ({
	currentScreen,
	subTitle,
	pubky,
	pubkyData,
	isInvite,
	setCurrentScreen,
	closeSheet,
}: ContentProps): ReactElement => {
	const { t } = useTranslation();
	switch (currentScreen) {
		case ECurrentScreen.main:
			return (
				<PubkyReview
					headerText={t('pubky.yourPubky')}
					description={subTitle}
					pubky={pubky}
					pubkyData={pubkyData}
					onContinue={() => setCurrentScreen(ECurrentScreen.homeserver)}
				/>
			);
		case ECurrentScreen.homeserver:
			return (
				<NewHomeserverSetup
					payload={{
						pubky,
						onContinue: () => setCurrentScreen(ECurrentScreen.inviteCode),
					}}
				/>
			);
		case ECurrentScreen.inviteCode:
			return (
				<InviteCode
					payload={{
						pubky,
						onContinue: () => setCurrentScreen(ECurrentScreen.welcome),
						onRequestInvite: () => setCurrentScreen(ECurrentScreen.requestInvite),
					}}
				/>
			);
		case ECurrentScreen.requestInvite:
			return <RequestInviteCode />
		case ECurrentScreen.welcome:
			return (
				<Welcome
					payload={{
						pubky,
						isInvite,
						onComplete: closeSheet,
					}}
				/>
			);
	}
};

const NewPubkySetup = ({
	payload,
}: {
	payload: {
		currentScreen?: ECurrentScreen;
		pubky: string;
		data?: Pubky;
		isInvite?: boolean;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const [currentScreen, setCurrentScreen] = useState<ECurrentScreen>(
		payload?.currentScreen ?? ECurrentScreen.main,
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
				return t('welcome.defaultHomeserver');
			case ECurrentScreen.requestInvite:
				return t('welcome.defaultHomeserver');
			case ECurrentScreen.welcome:
				return t('welcome.defaultHomeserver');
			default:
				return t('addPubky.title');
		}
	}, [currentScreen, t]);

	const handleBackPress = useCallback(() => {
		setCurrentScreen(ECurrentScreen.inviteCode);
	}, []);

	const subTitle = useMemo(() => {
		return t('newPubkySetup.newPubkyDescription');
	}, [t]);

	const pubkyData: PubkyData = useMemo(() => {
		const _data = payload?.data ?? defaultPubkyState;
		return { pubky, ..._data };
	}, [payload.data, pubky]);

	return (
		<Sheet
			id="new-pubky-setup"
			title={title}
			gradientType="brand"
			onBackPress={currentScreen === ECurrentScreen.requestInvite ? handleBackPress : undefined}
		>
			<Content
				currentScreen={currentScreen}
				subTitle={subTitle}
				pubky={pubky}
				pubkyData={pubkyData}
				isInvite={payload?.isInvite}
				setCurrentScreen={setCurrentScreen}
				closeSheet={closeSheet}
			/>
		</Sheet>
	);
};

export default memo(NewPubkySetup);
