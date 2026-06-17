import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect } from '../../middlewares/auth';
import { uploadLoanDocuments } from '../../middlewares/uploadLoanDocuments';

import {
  getLoanApplications,
  getLoanProfile,
  getLoanTypeDetails,
  getMemberMobileNo,
  getLoanApplicationType,
  getShareCapital,
  checkExpiredOTPMessage,
  sendOTPMessage,
  submitLoanApplication,
  verifyOTPMessage,
} from "./loan.controller"

const router = Router();

router.route('').get(protect, asyncHandler(getLoanProfile));
router.route('/loan-applications').get(protect, asyncHandler(getLoanApplications));
router.route('/loan-types').get(protect, asyncHandler(getLoanTypeDetails));
router.route('/member-mobile').get(protect, asyncHandler(getMemberMobileNo));
router.route('/loan-application-type').get(protect, asyncHandler(getLoanApplicationType));
router.route('/share-capital').get(protect, asyncHandler(getShareCapital));

// OTP routes
router.route('/send-otp').post(protect, asyncHandler(sendOTPMessage));
router.route('/verify-otp').post(protect, asyncHandler(verifyOTPMessage));
router.route('/check-expired-otp').post(protect, asyncHandler(checkExpiredOTPMessage));

// Loan application with attachments
router.route('/save-loan-application').post(protect, uploadLoanDocuments.array('documents', 5), asyncHandler(submitLoanApplication));

export default router;