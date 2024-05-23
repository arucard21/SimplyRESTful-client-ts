import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 10000,
  e2e: {
	baseUrl: 'http://localhost:8888/',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
