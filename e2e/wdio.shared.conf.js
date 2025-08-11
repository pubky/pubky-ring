/* Shared WebdriverIO config for Appium E2E */

exports.config = {
  runner: 'local',
  specs: ['./tests/**/*.spec.js'],
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 20000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
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
        // Appium will be started/stopped by the service
        args: {
          // Allow env overrides and relaxed capabilities usage if needed
          relaxedSecurity: true
        }
      }
    ]
  ]
};

const path = require('path');

module.exports = {
  runner: 'local',
  specs: [path.resolve(__dirname, './specs/**/*.spec.js')],
  maxInstances: 1,
  logLevel: 'info',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 180000 },
  services: [
    ['appium', { command: 'appium' }]
  ],
  waitforTimeout: 20000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 1
};
