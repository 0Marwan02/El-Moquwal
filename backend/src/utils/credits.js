const env = require('../config/env');

const INITIAL_CONTRACTOR_CREDITS = env.CONTRACTOR_INITIAL_CREDITS;
const COST_DEFAULT = env.BID_CREDIT_COST_DEFAULT;
const COST_ABOVE_1M = env.BID_CREDIT_COST_ABOVE_1M;

function getBidCreditCost(project) {
  if (!project || !project.budgetRange) return COST_DEFAULT;
  return project.budgetRange === 'above_1m' ? COST_ABOVE_1M : COST_DEFAULT;
}

function effectiveCreditBalance(contractorDocOrLean) {
  if (!contractorDocOrLean) return INITIAL_CONTRACTOR_CREDITS;
  const v = contractorDocOrLean.creditBalance;
  return typeof v === 'number' && !Number.isNaN(v) ? v : INITIAL_CONTRACTOR_CREDITS;
}

module.exports = {
  INITIAL_CONTRACTOR_CREDITS,
  COST_DEFAULT,
  COST_ABOVE_1M,
  getBidCreditCost,
  effectiveCreditBalance,
};
