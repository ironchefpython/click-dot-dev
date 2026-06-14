const BUSINESS_PHASE = {
  upgrades: [
    {
      id: 'transition',
      name: 'Incorporate Consultancy',
      desc: 'Establish "DevLoop Solutions Ltd." and unlock Phase 2!',
      costCash: 500,
      costXP: 1000
    }
  ]
};

if (typeof module !== 'undefined') {
  module.exports = BUSINESS_PHASE;
} else {
  window.BUSINESS_PHASE = BUSINESS_PHASE;
}
