import { SettingsState } from './settings.ts';
import { PubkyState } from './pubky.ts';
import { UIState } from '../store/shapes/ui.ts';

export interface RootState {
    pubky: PubkyState;
    settings: SettingsState;
    ui: UIState;
}
