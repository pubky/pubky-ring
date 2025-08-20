/* Shared WebdriverIO config for Appium E2E */
const path = require('path');
const fs = require('fs');

exports.config = {
	runner: 'local',
	port: 4723,
	specs: [path.resolve(__dirname, 'specs/**/*.spec.js')],
	maxInstances: 1,
	logLevel: 'info',
	bail: 0,
	baseUrl: 'http://localhost',
	waitforTimeout: 60000,
	connectionRetryTimeout: 120000,
	connectionRetryCount: 3,
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 120000
	},
	services: [
		[
			'appium',
			{
				args: {
					relaxedSecurity: true,
				}
			}
		]
	],

	// // Video recording and screenshot hooks
	// beforeTest: async function (test) {
	// 	if (process.env.RECORD_VIDEO === 'true') {
	// 		await driver.startRecordingScreen();
	// 	}
	// 	console.log(`🧪 Start: ${test.parent} - ${test.title}`);
	// },

	// afterTest: async function (test, _context, { error }) {
	// 	if (!error) return; // Skip artifacts if test passed

	// 	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	// 	const testNameRaw = `${test.parent || 'unknown'}_${test.title}`;
	// 	const testName = testNameRaw.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
	// 	const testDir = path.join(__dirname, 'artefacts', testName);

	// 	// Ensure per-test directory exists
	// 	fs.mkdirSync(testDir, { recursive: true });

	// 	// Save screenshot
	// 	const screenshotPath = path.join(testDir, `${testName}-${timestamp}.png`);
	// 	const screenshot = await driver.takeScreenshot();
	// 	fs.writeFileSync(screenshotPath, screenshot, 'base64');
	// 	console.log(`📸 Saved screenshot: ${screenshotPath}`);

	// 	// Save video if recording was enabled
	// 	if (process.env.RECORD_VIDEO === 'true') {
	// 		const videoBase64 = await driver.stopRecordingScreen();
	// 		const videoPath = path.join(testDir, `${testName}-${timestamp}.mp4`);
	// 		fs.writeFileSync(videoPath, videoBase64, 'base64');
	// 		console.log(`🎥 Saved test video: ${videoPath}`);
	// 	}
	// }
};
