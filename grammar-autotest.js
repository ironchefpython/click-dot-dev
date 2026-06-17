const autotestGrammar = {
  origin: [
    " [JEST] Initializing Jest Watch Mode...\n [JEST] Found #num# test files matching regex patterns.\n [CI/CD] Generating github actions deployment pipeline...\n [CI/CD] #ciStep#\n [AUTO-TEST] #autoStep#\n [AUTO-TEST] Locked minimum coverage constraint for #path#",
    " [CYPRESS] Launching E2E test runner...\n [CYPRESS] #cypressStep#\n [CYPRESS] Recording video artifact for test run.\n [CI/CD] Uploading coverage reports to Codecov..."
  ],
  num: ["4", "12", "8", "21", "15"],
  ciStep: [
    "Added lint checks and unit test step to pre-push hook.",
    "Configured Docker build caching for test runner.",
    "Parallelized test execution across 4 nodes.",
    "Integrated SonarQube static analysis.",
    "Setup staging environment deployment."
  ],
  autoStep: [
    "Writing automated test mocks for Stripe webhook.",
    "Generating fixture data for database seeding.",
    "Configuring test timeout thresholds.",
    "Mocking external API requests via Nock.",
    "Spying on global console.error calls."
  ],
  path: [
    "/src/db.js",
    "/src/auth/jwt.js",
    "/lib/payment.js",
    "/app/models/",
    "global threshold (90%)"
  ],
  cypressStep: [
    "Running spec: checkout_flow.spec.js",
    "Simulating user login and session restore.",
    "Asserting DOM elements render correctly on mobile viewport.",
    "Testing network failure gracefully.",
    "Intercepting GraphQL requests."
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = autotestGrammar;
} else {
  window.autotestGrammar = autotestGrammar;
}
