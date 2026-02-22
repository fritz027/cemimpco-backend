import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect } from '../../middlewares/auth';

import {
  memberLogin,
  memberRegister,
  activateMemberLogin,
  checkWebUserEmail,
  resendConfirmationEmail,
  resetPassword,
  sendResetPassword,
  userChangePassword,
  verifyMemberEmailMatch,
  verifyWebUserMemberNo,
  creditLogin,
  getElectionConfig,
  getAllowedElecom,
  getAllCandidates
} from './auth.controller';

const router = Router();

//GET routes
router.route('/web-users/check-email').get(asyncHandler(checkWebUserEmail));
router.route('/web-users/verify-email').get(asyncHandler(verifyMemberEmailMatch));
router.route('/web-users/verify-member').get(asyncHandler(verifyWebUserMemberNo));
router.route('/election/candidates').get(asyncHandler(getAllCandidates));

router.route('/election-setting').get(asyncHandler(getElectionConfig));
router.route('/elecom').get(asyncHandler(getAllowedElecom));

//POST routes
router.route('/login').post(asyncHandler(memberLogin));
router.route('/register').post(asyncHandler(memberRegister));
router.route('/activate').post(asyncHandler(activateMemberLogin));
router.route('/resend-verification').post(asyncHandler(resendConfirmationEmail));
router.route('/forgot-password').post(asyncHandler(sendResetPassword));
router.route('/reset-password').post(asyncHandler(resetPassword));
//---------CREDIT AUTH----------
router.route('/credit/login').post(asyncHandler(creditLogin));

//PATCH routes
router.route('/web-users/me/password').patch(asyncHandler(userChangePassword));



export default router;