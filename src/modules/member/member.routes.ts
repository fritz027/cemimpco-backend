import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";

import {
  getMembersProfile,
  getMembersDeposits,
  getDividendSettings,
  getLoanApplicationPassword,
  getMemberDividend,
  getMembersLoans,
  getMembersTimeDeposits,
  getMembershipAge,
  getMemberCreditHistory,
  searchRegularActiveMember
} from "./member.controller"

import {
 protect
} from "../../middlewares/auth";

const router = Router();

router.route('/').get(protect, asyncHandler(getMembersProfile));
router.route('/deposits').get(protect, asyncHandler(getMembersDeposits));
router.route('/time-deposits').get(protect, asyncHandler(getMembersTimeDeposits));
router.route('/loans').get(protect, asyncHandler(getMembersLoans));
router.route('/credit/history').get(protect, asyncHandler(getMemberCreditHistory));
router.route('/search').get(protect, asyncHandler(searchRegularActiveMember));


export default router;