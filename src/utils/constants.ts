// Gradient definitions

export const BLUE_RADIAL_GRADIENT = ['#0b2033', 'rgba(0, 0, 0, 0.1)'];
export const RED_RADIAL_GRADIENT = ['rgba(233, 81, 100, 0.32)', 'rgba(0, 0, 0, 0.1)'];

export const IS_STAGING = __DEV__;
export const STAGING_HOMESERVER = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
export const PRODUCTION_HOMESERVER = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';
export const STAGING_APP_URL = 'https://staging.pubky.app';
export const PRODUCTION_APP_URL = 'https://pubky.app';
export const STAGING_APP_HOST = STAGING_APP_URL.replace('https://', '');
export const PRODUCTION_APP_HOST = PRODUCTION_APP_URL.replace('https://', '');
export const DEFAULT_HOMESERVER = IS_STAGING ? STAGING_HOMESERVER : PRODUCTION_HOMESERVER;
export const PUBKY_APP_URL = IS_STAGING ? STAGING_APP_URL : PRODUCTION_APP_URL;
export const TERMS_OF_USE = 'https://synonym.to/pubky-ring-privacy-policy';

// Timing constants for consistent animations and delays
export const NAVIGATION_ANIMATION_DURATION = 200; // Duration for screen transition animations

export const BACKUP_PASSWORD_CHAR_MIN = 6; // Minimum characters for file backup password
