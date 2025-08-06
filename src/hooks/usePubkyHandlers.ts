import { useCallback } from 'react';
import { useTypedNavigation } from '../navigation/hooks';
import { showQRScanner } from '../utils/helpers';
import { Dispatch } from '@reduxjs/toolkit';

interface PubkyHandlersReturn {
	onPubkyPress: (pubky: string, index: number) => void;
	onQRPress: (data: { pubky: string; dispatch: Dispatch; onComplete?: () => void }) => Promise<string>;
}

export const usePubkyHandlers = (): PubkyHandlersReturn => {
	const navigation = useTypedNavigation();

	const onPubkyPress = useCallback(
		(pubky: string, index: number) => {
			navigation.navigate('PubkyDetail', { pubky, index });
		},
		[navigation],
	);

	const onQRPress = useCallback(async (data: {
		pubky: string;
		dispatch: Dispatch;
		onComplete?: () => void;
	}) => {
		return showQRScanner(data);
	}, []);

	return {
		onPubkyPress,
		onQRPress,
	};
};
