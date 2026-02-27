import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect,protectElection,protectSurvey } from '../../middlewares/auth';

import { 
  listActive,
  adminCreateSurvey,
  adminDeleteQuestion,
  adminDeleteSurvey,
  adminUpdateSurvey,
  adminUpsertQuestion,
  getOne,
  listAll,
  myStatus,
  results,
  submit,
  listQuestions,
  currentSurveys,
  checkMemberSurvey
} from './survey.controller';


const router = Router();


//GET ROUTES
router.route('').get(protect, asyncHandler(listAll));
router.route('/current').get(protect, asyncHandler(currentSurveys))
router.route('/active').get(protect, asyncHandler(listActive));
router.route('/:surveyId').get(protect, asyncHandler(getOne));
router.route('/:surveyId/status').get(protect, asyncHandler(myStatus));
router.route('/:surveyId/questions').get(protect, asyncHandler(listQuestions));
router.route('/check/:surveyId').get(protect, asyncHandler(checkMemberSurvey));

//POST ROUTES
router.route('/:surveyId/submit').post(protect, asyncHandler(submit));

//CRUD SURVEY
router.route('/admin/create').post(protectSurvey, asyncHandler(adminCreateSurvey));
router.route('/admin/:surveyId').put(protectSurvey, asyncHandler(adminUpdateSurvey));
router.route('/admin/:surveyId').delete(protectSurvey, asyncHandler(adminDeleteSurvey));

router.route('/admin/:surveyId/question').post(protectSurvey, asyncHandler(adminUpsertQuestion));
router.route('/admin/:surveyId/question/:surveyQid').delete(protectSurvey, asyncHandler(adminDeleteQuestion));

router.route('/admin/:surveyId/result').get(protectSurvey, asyncHandler(results));

export default router;