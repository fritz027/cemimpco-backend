import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect } from '../../middlewares/auth';

import  {
  getDepositProfile
} from './deposit.controller';

const router = Router();


router.route('').get(protect, asyncHandler(getDepositProfile));

export default router;