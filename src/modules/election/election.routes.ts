import express, {Router} from 'express';
import { asyncHandler } from "../../middlewares/asyncHandler";
import { protect,protectElection } from '../../middlewares/auth';
import { uploadCandidatePhoto  } from '../../middlewares/uploadCandidatePhotos';

import { 
 patchElectionSetting,
 createNewPosition,
 getAllPosition,
 getElecomList,
 setElecomList,
 patchPosition,
 removePosition,
 createCandidate,
 getAllCandidates,
 patchCandidate,
 removeCandidate,
 getElecomUsers,
 addElecomUser,
 removeElecomUser,
 castVote,
 memberHasVoted,
 getVoteCasted,
 getElectionStatus,
 electionResultsController
} from './election.controller';

const router = Router();

//GET ROUTES
router.route('/elecoms').get(protectElection, asyncHandler(getElecomList));
router.route('/positions').get(protect, asyncHandler(getAllPosition));
router.route('/candidates').get(protect, asyncHandler(getAllCandidates));
router.route('/elecom-users').get(protectElection, asyncHandler(getElecomUsers));
router.route('/is-voted').get(protect, asyncHandler(memberHasVoted));
router.route('/:year/ballot').get(protect, asyncHandler(getVoteCasted));
router.route('/:year/status').get(protectElection, asyncHandler(getElectionStatus));
router.route("/results/:year").get(protectElection, asyncHandler(electionResultsController));
router.route("/results").get(protectElection, asyncHandler(electionResultsController));


//POST ROUTES
router.route('/new/position').post(protectElection, asyncHandler(createNewPosition));
router.route('/new/candidate').post(protectElection, uploadCandidatePhoto.single("photo"), asyncHandler(createCandidate))
router.route('/vote').post(protect, asyncHandler(castVote));



//PATCH ROUTES
router.route('/update-setting').patch(protectElection, asyncHandler(patchElectionSetting));
router.route('/set-elecom').patch(protectElection, asyncHandler(setElecomList));
router.route('/update-position').patch(protectElection, asyncHandler(patchPosition));
router.route('/update-candidate').patch(protectElection, uploadCandidatePhoto.single("photo"), asyncHandler(patchCandidate));

//for elcom user purpose
router.route('/remove/elecom-user').patch(protectElection, asyncHandler(removeElecomUser));
router.route('/new/elecom-user').patch(protectElection, asyncHandler(addElecomUser));


//DELETE ROUTES
router.route('/delete-position').delete(protectElection, asyncHandler(removePosition));
router.route('/delete-candidate').delete(protectElection, asyncHandler(removeCandidate));
export default router;