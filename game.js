// Re-export core modules for server-side testing compatibility
if (typeof require !== 'undefined') {
  const TUTORIAL_PHASE = require('./phase-tutorial.js');
  const DEVELOPER_PHASE = require('./phase-developer.js');
  const BUSINESS_PHASE = require('./phase-business.js');
  const { DevGameEngine, CONTRACTS } = require('./engine.js');
  module.exports = { DevGameEngine, CONTRACTS };
}
