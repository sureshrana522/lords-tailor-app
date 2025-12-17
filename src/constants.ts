// src/constants.ts
import { OrderStatus, WorkerRole } from "./types";

/* ---------------- MOCK DATA ---------------- */

export const MOCK_ORDERS = [];

export const MOCK_INVENTORY = [];

/* ---------------- REFERRAL SYSTEM ---------------- */

export const REFERRAL_LEVELS = [
  { level: 1, percent: 5 },
  { level: 2, percent: 3 },
  { level: 3, percent: 2 },
  { level: 4, percent: 1 },
  { level: 5, percent: 0.5 },
  { level: 6, percent: 0.5 }
];

export const REFERRAL_DEDUCTION_PERCENT = 10;

/* ---------------- PAYOUT RATES ---------------- */

export const PAYOUT_RATES = {
  [WorkerRole.CUTTING]: 15,
  [WorkerRole.STITCHING]: 25,
  [WorkerRole.FINISHING]: 10,
  [WorkerRole.DELIVERY]: 5
};

/* ---------------- MANAGER RULES ---------------- */

export const MANAGER_RANK_RULES = {
  ASSOCIATE: { showrooms: 2 },
  SENIOR: { showrooms: 5 },
  DIRECTOR: { showrooms: 10 }
};
