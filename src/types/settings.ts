export interface SettingsState {
    theme: ETheme | undefined;
    showOnboarding: boolean;
    autoAuth: boolean;
    navigationAnimation: ENavigationAnimation;
}

export enum ETheme {
    dark = 'dark',
    light = 'light',
    system = 'system'
}

export enum ENavigationAnimation {
    slideFromRight = 'slide_from_right',
    fade = 'fade'
}
