import { Dispatch } from 'redux';
import { ETheme } from '../types/settings.ts';
import { updateTheme } from '../store/slices/settingsSlice.ts';

export const toggleTheme = ({
	dispatch,
	theme,
}: {
    dispatch: Dispatch,
    theme: ETheme
}): void => {
	switch (theme) {
		case ETheme.system:
			dispatch(updateTheme({ theme: ETheme.light }));
			break;
		case ETheme.light:
			dispatch(updateTheme({ theme: ETheme.dark }));
			break;
		case ETheme.dark:
			dispatch(updateTheme({ theme: ETheme.light }));
			break;
		default:
			dispatch(updateTheme({ theme: ETheme.system }));
			break;
	}
};
