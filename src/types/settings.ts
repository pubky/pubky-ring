export interface SettingsState {
    settings: {
        theme: ETheme | undefined;
    }
}

export enum ETheme {
    dark = 'dark',
    light = 'light',
    system = 'system'
}
