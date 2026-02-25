import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect } from '../../middlewares/auth';
import { loginLimiter, forgotPasswordLimiter } from '../../middlewares/rateLimiter';

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
  getAllCandidates,
  verifyTIN,
  verifyDateOfBirth
} from './auth.controller';

const router = Router();

//GET routes
router.route('/web-users/check-email').get(asyncHandler(checkWebUserEmail));
router.route('/web-users/verify-email').get(asyncHandler(verifyMemberEmailMatch));
router.route('/web-users/verify-member').get(asyncHandler(verifyWebUserMemberNo));
router.route('/web-users/verify-tin').get(asyncHandler(verifyTIN));
router.route('/web-users/verify-dob').get(asyncHandler(verifyDateOfBirth));
router.route('/election/candidates').get(asyncHandler(getAllCandidates));


router.route('/election-setting').get(asyncHandler(getElectionConfig));
router.route('/elecom').get(asyncHandler(getAllowedElecom));

//POST routes
router.route('/login').post(loginLimiter, asyncHandler(memberLogin));
router.route('/register').post(asyncHandler(memberRegister));
router.route('/activate').post(asyncHandler(activateMemberLogin));
router.route('/email/resend-confirmation').post(asyncHandler(resendConfirmationEmail));
router.route('/forgot-password').post(forgotPasswordLimiter, asyncHandler(sendResetPassword));
router.route('/reset-password').post(forgotPasswordLimiter, asyncHandler(resetPassword));
//---------CREDIT AUTH----------
router.route('/credit/login').post(asyncHandler(creditLogin));

//PATCH routes
router.route('/web-users/me/password').patch(asyncHandler(userChangePassword));



export default router;