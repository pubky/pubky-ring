import type { SettingsState } from './settings.ts';
import type { PubkyState } from './pubky.ts';
import type { UIState } from '../store/shapes/ui.ts';
import type { AuthorizedGrantsState } from '../store/slices/authorizedGrantsSlice.ts';

export interface RootState {
	pubky: PubkyState;
	settings: SettingsState;
	ui: UIState;
	authorizedGrants: AuthorizedGrantsState;
}
