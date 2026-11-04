import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import AuthSummary from '../src/components/AuthSummary';
import en from '../src/i18n/locales/en.json';
import es from '../src/i18n/locales/es.json';
import type { AuthCapability } from '../src/utils/authCapabilities';

jest.mock('../src/theme/typography', () => ({
	TextBaseB: require('react-native').Text,
	TextBaseM: require('react-native').Text,
}));

const i18n = createInstance();

beforeAll(async () => {
	await i18n.use(initReactI18next).init({
		lng: 'en',
		resources: { en: { translation: en }, es: { translation: es } },
		interpolation: { escapeValue: false },
	});
});

beforeEach(async () => {
	await i18n.changeLanguage('en');
});

const renderSummary = (capabilities: AuthCapability[], authorized = false) =>
	render(
		<I18nextProvider i18n={i18n}>
			<AuthSummary capabilities={capabilities} authorized={authorized} />
		</I18nextProvider>,
	);

it('summarizes the requested app and access with actual translated text', () => {
	renderSummary([{ path: '/pub/pubky.app/', permission: 'rw' }]);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'A service is requesting permission to read and edit your pubky.app data.',
	);
});

it('deduplicates app scopes and explicitly includes requested encryption', () => {
	renderSummary([
		{ path: '/pub/pubky.app/', permission: 'rw' },
		{ path: '/priv/pubky.app/', permission: 'rwe' },
		{ path: '/priv/paykit/', permission: 'rwe' },
	]);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'A service is requesting permission to read and edit your pubky.app and paykit data, including encrypted data.',
	);
});

it('uses a general description when permissions differ between scopes', () => {
	renderSummary([
		{ path: '/pub/one/', permission: 'r' },
		{ path: '/pub/two/', permission: 'w' },
	]);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'A service is requesting permission to access your one and two data.',
	);
});

it('describes root permissions as all data', () => {
	renderSummary([{ path: '/', permission: 'rw' }]);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'A service is requesting permission to read and edit all your data.',
	);
});

it('describes the approved permissions on success', () => {
	renderSummary([{ path: '/pub/pubky.app/', permission: 'r' }], true);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'You gave the service permission to read your pubky.app data.',
	);
});

it('describes identity verification when there are no approved data permissions', () => {
	renderSummary([], true);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'You gave the service permission to verify your pubky identity.',
	);
});

it('supports translated sentence ordering in Spanish', async () => {
	await act(async () => {
		await i18n.changeLanguage('es');
	});
	renderSummary([{ path: '/priv/pubky.app/', permission: 'rwe' }]);
	expect(screen.getByTestId('AuthSummary')).toHaveTextContent(
		'Un servicio solicita permiso para leer y editar tus datos de pubky.app, incluidos los datos cifrados.',
	);
});
