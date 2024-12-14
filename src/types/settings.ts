export interface SettingsState {
    theme: ETheme | undefined;
    showOnboarding: boolean;
}

export enum ETheme {
    dark = 'dark',
    light = 'light',
    system = 'system'
}
