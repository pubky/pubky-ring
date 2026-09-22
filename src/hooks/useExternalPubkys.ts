import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';
import { pruneMissingExternalPubkys } from '../utils/pubky.ts';
import { filterUnadoptedExternal, listExternalPubkys, TExternalPubky } from '../utils/sharedPubky.ts';

/**
 * Pubkys other apps published that this app has not adopted yet.
 * Refreshed on focus and when the app returns to the foreground;
 * a failed read keeps the previous value so the cards never flicker away.
 */
export const useExternalPubkys = (): TExternalPubky[] => {
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);
	const [externalPubkys, setExternalPubkys] = useState<TExternalPubky[]>([]);

	const refresh = useCallback(async (): Promise<void> => {
		const externalRes = await listExternalPubkys();
		if (externalRes.isErr()) {
			return;
		}
		await pruneMissingExternalPubkys(pubkys, dispatch);
		setExternalPubkys(filterUnadoptedExternal(externalRes.value, Object.keys(pubkys)));
	}, [dispatch, pubkys]);

	useFocusEffect(
		useCallback(() => {
			refresh();
		}, [refresh]),
	);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', state => {
			if (state === 'active') {
				refresh();
			}
		});
		return () => subscription.remove();
	}, [refresh]);

	return externalPubkys;
};
