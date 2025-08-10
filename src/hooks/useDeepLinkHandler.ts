import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { SheetManager } from 'react-native-actions-sheet';
import {
	getAllPubkys,
	getDeepLink,
	getSignedUpPubkys,
} from '../store/selectors/pubkySelectors';
import { setDeepLink } from '../store/slices/pubkysSlice';
import { handleDeepLink, showToast, sleep } from '../utils/helpers';

const handleSignedUpPubkys = async (
	signedUpPubkysLength: number,
	signedUpPubkys: Record<string, any>,
	deepLink: string,
	dispatch: Dispatch,
): Promise<void> => {
	SheetManager.hideAll();
	await sleep(150);

	if (signedUpPubkysLength > 1) {
		SheetManager.show('select-pubky', {
			payload: { deepLink },
			onClose: (): void => {
				SheetManager.hide('select-pubky');
			},
		});
	} else {
		const pubky = Object.keys(signedUpPubkys)[0];
		setTimeout((): void => {
			handleDeepLink({
				pubky,
				url: deepLink,
				dispatch,
			});
		}, 100);
	}
};

const handleNoSignedUpPubkys = async (
	pubkys: Record<string, any>,
	dispatch: Dispatch,
	createPubky: () => Promise<void>,
	importPubky: (mnemonic?: string) => Promise<any>,
): Promise<void> => {
	dispatch(setDeepLink(''));

	if (Object.keys(pubkys).length) {
		showToast({
			type: 'info',
			title: 'No Pubkys are setup',
			description: 'Please setup any of your existing Pubkys to proceed.',
			visibilityTime: 5000,
		});
	} else {
		showToast({
			type: 'info',
			title: 'No Pubkys exist',
			description: 'Please add and setup a Pubky to proceed.',
			visibilityTime: 5000,
			onPress: (): void => {
				SheetManager.show('add-pubky', {
					payload: {
						createPubky,
						importPubky,
					},
					onClose: (): void => {
						SheetManager.hide('add-pubky');
					},
				});
			},
		});
	}
};

export const useDeepLinkHandler = (
	createPubky: () => Promise<void>,
	importPubky: (mnemonic?: string) => Promise<any>,
): { deepLink: string; handleDeepLink: () => Promise<void> } => {
	const dispatch = useDispatch();
	const deepLink = useSelector(getDeepLink);
	const signedUpPubkys = useSelector(getSignedUpPubkys);
	const pubkys = useSelector(getAllPubkys);

	const handleDeepLinkCallback = useCallback(async (): Promise<void> => {
		if (!deepLink) return;

		const signedUpPubkysLength = Object.keys(signedUpPubkys).length;

		if (signedUpPubkysLength) {
			await handleSignedUpPubkys(
				signedUpPubkysLength,
				signedUpPubkys,
				deepLink,
				dispatch,
			);
		} else {
			await handleNoSignedUpPubkys(pubkys, dispatch, createPubky, importPubky);
		}
	}, [deepLink, dispatch, pubkys, signedUpPubkys, createPubky, importPubky]);

	useEffect((): void => {
		handleDeepLinkCallback();
	}, [handleDeepLinkCallback]);

	return { deepLink, handleDeepLink: handleDeepLinkCallback };
};
