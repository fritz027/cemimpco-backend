import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect } from '../../middlewares/auth';

import {
  getLoanApplications,
  getLoanProfile,
  getLoanTypeDetails
} from "./loan.controller"

const router = Router();

router.route('').get(protect, asyncHandler(getLoanProfile));
router.route('/loan-application').get(protect, asyncHandler(getLoanApplications));
router.route('/loan-types').get(protect, asyncHandler(getLoanTypeDetails));

export default router;