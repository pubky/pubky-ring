import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { getIsOnline } from '../store/selectors/settingsSelectors';

interface QRPressParams {
	pubky: string;
	dispatch: Dispatch;
	onComplete?: () => void;
	isOnline: boolean;
}

export const useQRScanner = (): {
	handleQRPress: (pubky: string, onQRPress: (params: QRPressParams) => Promise<string>) => Promise<string>;
	isQRLoading: boolean;
	dispatch: any;
	isOnline: boolean;
} => {
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useDispatch();
	const isOnline = useSelector(getIsOnline);

	const handleQRPress = useCallback(
		async (
			pubky: string,
			onQRPress: (params: QRPressParams) => Promise<string>,
		) => {
			setIsLoading(true);
			try {
				const result = await onQRPress({
					pubky,
					dispatch,
					isOnline,
				});
				return result;
			} finally {
				setIsLoading(false);
			}
		},
		[dispatch, isOnline],
	);

	return { 
		handleQRPress, 
		isQRLoading: isLoading,
		dispatch,
		isOnline,
	};
};