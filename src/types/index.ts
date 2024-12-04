import { SettingsState } from './settings.ts';
import { PubkyState } from './pubky.ts';

export interface RootState {
    pubky: PubkyState;
    settings: SettingsState;
}
