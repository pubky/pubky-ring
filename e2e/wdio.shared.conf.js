/* Shared WebdriverIO config for Appium E2E */
const fs = require('fs');
const path = require('path');

const artefactsDir = path.resolve(__dirname, 'artefacts');
const resultsDir = path.resolve(__dirname, 'results');
const wdioLogsDir = path.resolve(__dirname, 'wdio-logs');

function safeName(value) {
	return (
		String(value)
			.replace(/[^a-zA-Z0-9._-]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 160) || 'test'
	);
}

exports.config = {
	runner: 'local',
	specs: [path.resolve(__dirname, 'specs/**/*.spec.js')],
	maxInstances: 1,
	logLevel: 'debug',
	outputDir: wdioLogsDir,
	bail: 0,
	baseUrl: 'http://localhost',
	waitforTimeout: 20_000,
	connectionRetryTimeout: 900_000,
	connectionRetryCount: 2,
	specFileRetries: process.env.CI ? 1 : 0,
	specFileRetriesDelay: 5_000,
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 120_000,
	},
	services: [['appium']],

	beforeTest: async function () {
		if (process.env.RECORD_VIDEO !== 'true') {
			return;
		}

		fs.mkdirSync(artefactsDir, { recursive: true });
		await driver.startRecordingScreen();
	},

	afterTest: async function (test, _context, { error, passed }) {
		const fileBase = safeName(`${test.parent}-${test.title}`);

		if (process.env.RECORD_VIDEO === 'true') {
			try {
				const recording = await driver.stopRecordingScreen();
				fs.writeFileSync(path.join(artefactsDir, `${fileBase}.mp4`), recording, 'base64');
			} catch (recordingError) {
				console.warn(`Failed to save screen recording: ${recordingError.message}`);
			}
		}

		if (passed || !error) {
			return;
		}

		fs.mkdirSync(resultsDir, { recursive: true });

		try {
			await browser.saveScreenshot(path.join(resultsDir, `${fileBase}.png`));
		} catch (screenshotError) {
			console.warn(`Failed to capture screenshot: ${screenshotError.message}`);
		}

		try {
			const source = await browser.getPageSource();
			fs.writeFileSync(path.join(resultsDir, `${fileBase}.xml`), source);
		} catch (sourceError) {
			console.warn(`Failed to capture page source: ${sourceError.message}`);
		}
	},
};
