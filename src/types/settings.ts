export interface SettingsState {
    theme: ETheme | undefined;
    showOnboarding: boolean;
    autoAuth: boolean;
}

export enum ETheme {
    dark = 'dark',
    light = 'light',
    system = 'system'
}
