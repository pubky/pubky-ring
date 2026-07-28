import { useCallback } from 'react';
import { useTypedNavigation } from '../navigation/hooks';

interface PubkyHandlersReturn {
	onPubkyPress: (pubky: string, index: number) => void;
}

export const usePubkyHandlers = (): PubkyHandlersReturn => {
	const navigation = useTypedNavigation();

	const onPubkyPress = useCallback(
		(pubky: string, index: number) => {
			navigation.navigate('PubkyDetail', { pubky, index });
		},
		[navigation],
	);

	return {
		onPubkyPress,
	};
};
