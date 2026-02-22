import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";

import {
  getStores,
  getMembers,
  getMemberByMemberNo,
  getMemberCreditHistory
} from "./credit.controller";

import {
  protectCredit
} from "../../middlewares/auth";


const router = Router();


//GET Routes
router.route('/stores').get(protectCredit, asyncHandler(getStores));
router.route('/members').get(protectCredit, asyncHandler(getMembers));
router.route('/search/member').get(protectCredit, asyncHandler(getMemberByMemberNo));
router.route('/history/member').get(protectCredit, asyncHandler(getMemberCreditHistory));



export default router;
