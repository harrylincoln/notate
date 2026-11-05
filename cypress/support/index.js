// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Keep automated tests out of the live Analytics property.
beforeEach(() => {
  cy.intercept('https://www.googletagmanager.com/gtag/js*', { statusCode: 200, body: '' });
  cy.intercept('https://*.google-analytics.com/**', { statusCode: 204, body: '' });
});
