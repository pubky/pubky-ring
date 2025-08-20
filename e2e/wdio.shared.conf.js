/* Shared WebdriverIO config for Appium E2E */
const path = require('path');

exports.config = {
  runner: 'local',
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
          relaxedSecurity: true
        }
      }
    ]
  ]
};
