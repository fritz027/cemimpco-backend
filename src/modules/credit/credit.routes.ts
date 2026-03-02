import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";

import {
  getStores,
  getMembers,
  getMemberByMemberNo,
  getMemberCreditHistory,
  newStoreCredit
} from "./credit.controller";

import {
  protectCredit
} from "../../middlewares/auth";


const router = Router();


//GET Routes
router.route('/stores').get( asyncHandler(getStores));
router.route('/members').get(protectCredit, asyncHandler(getMembers));
router.route('/search/member/:memberNo').get(protectCredit, asyncHandler(getMemberByMemberNo));
router.route('/history/member').get(protectCredit, asyncHandler(getMemberCreditHistory));

//POST Routes
router.route('/new').post(protectCredit, asyncHandler(newStoreCredit));



export default router;
