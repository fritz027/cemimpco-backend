import { Request,Response, NextFunction } from "express";
import { 
  createSurvey,
  currentActiveSurveys,
  deleteQuestion,
  deleteSurvey,
  getSurvey,
  getSurveyQuestions,
  getSurveyResults,
  getSurveyWithQuestions,
  listActiveSurveys,
  listAllSurveys,
  memberHasAnsweredSurvey,
  submitSurveyAnswers,
  updateSurvey,
  upsertQuestion,
 } from "./survey.service";
import { fetchMembersByList, fetchSystemConfig, updateSystemConfig } from "../auth/auth.service";
import { getTotalRegisteredVoters } from "../election/election.service";


function requireMemberNo(req: any): string | null {
  return req.user?.memberNo ?? null;
}

export async function listActive(req: Request, res: Response, next: NextFunction) {
  try {
    const surveys = await listActiveSurveys();
    res.json({ success: true, surveys });
  } catch (e) {
    next(e);
  }
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const surveys = await listAllSurveys();
    res.json({ success: true, surveys });
  } catch (e) {
    next(e);
  }
}

export async function currentSurveys(req: Request, res: Response, next: NextFunction) {
  try {
    const survey = await currentActiveSurveys();
    return res.status(200).json({success: true, survey});
  } catch (error) {
    logging.error(`Error in getting current surveys: ${error}`);
    next(error);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const surveyId = req.params.surveyId;
    const data = await getSurveyWithQuestions(surveyId);
    if (!data) return res.status(404).json({ success: false, message: "Survey not found." });
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

export async function myStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const memberNo = requireMemberNo(req);
    if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });

    const surveyId = req.params.surveyId;
    const answered = await memberHasAnsweredSurvey(memberNo, surveyId);
    res.json({ success: true, isAnswered: answered });
  } catch (e) {
    next(e);
  }
}

// Admin endpoints (protect these with your "surveyUser" permission middleware)
export async function adminCreateSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = requireMemberNo(req) ?? "system";
    const { survey_id, survey_name, survey_from, survey_to } = req.body ?? {};

    if (!survey_id || !survey_name || !survey_from || !survey_to) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    await createSurvey({ survey_id, survey_name, survey_from, survey_to }, actor);
    res.status(201).json({ success: true, message: "Survey created." });
  } catch (e) {
    next(e);
  }
}

export async function adminUpdateSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = requireMemberNo(req) ?? "system";
    const surveyId = req.params.surveyId;

    await updateSurvey(surveyId, req.body ?? {}, actor);
    res.json({ success: true, message: "Survey updated." });
  } catch (e) {
    next(e);
  }
}

export async function adminDeleteSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = requireMemberNo(req) ?? "system";
    const surveyId = req.params.surveyId;

    await deleteSurvey(surveyId, actor);
    res.json({ success: true, message: "Survey deleted." });
  } catch (e) {
    next(e);
  }
}

export async function adminUpsertQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = requireMemberNo(req) ?? "system";
    const surveyId = req.params.surveyId;
    const { survey_qid, survey_seq, survey_question, survey_context } = req.body ?? {};
    if (
      survey_qid === undefined ||
      survey_seq === undefined ||
      !survey_question ||
      survey_context === undefined
    ) {
      return res.status(400).json({ success: false, message: "Missing question fields." });
    }

    await upsertQuestion(
      surveyId,
      { survey_qid: Number(survey_qid), survey_seq: Number(survey_seq), survey_question, survey_context },
      actor
    );

    res.json({ success: true, message: "Question saved." });
  } catch (e) {
    next(e);
  }
}

export async function adminDeleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = requireMemberNo(req) ?? "system";
    const surveyId = req.params.surveyId;
    const surveyQid = Number(req.params.surveyQid);

    await deleteQuestion(surveyId, surveyQid, actor);
    res.json({ success: true, message: "Question deleted." });
  } catch (e) {
    next(e);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const memberNo = requireMemberNo(req);
    if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });

    const actor = memberNo; // same user submits
    const surveyId = req.params.surveyId;
    const answers = req.body?.payload.answers;

    console.log(answers)

    const result = await submitSurveyAnswers(memberNo, surveyId, answers, actor);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });

    res.json({ success: true, message: result.message });
  } catch (e) {
    next(e);
  }
}

export async function results(req: Request, res: Response, next: NextFunction) {
  try {
    const surveyId = req.params.surveyId;
   
    const [
          totalRegisteredVoters,
          results,
        ] = await Promise.all([
          getTotalRegisteredVoters(),
          getSurveyResults(surveyId),
        ]);



    res.json({ success: true, results, totalRegisteredVoters });
  } catch (e) {
    next(e);
  }
}

export async function listQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const memberNo = requireMemberNo(req);
    if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });

    const actor = memberNo;
    const surveryId = req.params.surveyId;

    const questions = await getSurveyQuestions(surveryId);

    
    return res.status(200).json({
      success: true,
      questions
    })

  } catch (error) {
    logging.error(`Error getting list of questions: ${error}`);
    next(error);
  }
}

export async function checkMemberSurvey(req: Request, res: Response, next: NextFunction) {
  try {
    const memberNo = requireMemberNo(req);
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }


    // Normalize query id -> string
    const q = req.params.surveyId as string;
    
    const surveyId = Array.isArray(q) ? q[0] : q;

    if (!surveyId || String(surveyId).trim() === "" || surveyId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid request." });
    }

    const isDone = await memberHasAnsweredSurvey(memberNo, String(surveyId));

    return res.status(200).json({
      success: true,
      isDone,
    });
  } catch (error) {
    logging.error(`Error check member survey: ${error}`);
    next(error);
  }
}


export const getSurveyUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberNo = requireMemberNo(req);
    if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });

    const config = await fetchSystemConfig('com_web_app', 'survey', 'user');

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found"
      });
    }

    const memberNos: string[] = JSON.parse(config.uvalue);

    // Fetch member details
    const members = await fetchMembersByList(memberNos);

    return res.status(200).json({
      success: true,
      members
    });

  } catch (error) {
    next(error);
  }
};


export const addSurveyUser = async (req: Request, res: Response) => {
  const memberNo = requireMemberNo(req);
  if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });
  
  const newMemberNo = req.body?.memberNo;

  if (!newMemberNo || newMemberNo === "") {
    return res.status(400).json({
      success: false,
      message: 'Invalid request'
    });
  }

  const config = await fetchSystemConfig('com_web_app', 'survey', 'user');

  if (!config) {
    return res.status(404).json({
      success: false,
      message: "Config not found",
    });
  }

  let memberNos: string[] = JSON.parse(config.uvalue);

  if (memberNos.includes(newMemberNo)) {
    return res.status(400).json({
      success: false,
      message: "Member already exists"
    });
  }

  memberNos.push(newMemberNo);

  await updateSystemConfig(
    'com_web_app',
    'survey',
    'user',
    JSON.stringify(memberNos)
  );

  res.json({ success: true });
};


export const removeSurveyUser = async (req: Request, res: Response) => {
  const memberNo = requireMemberNo(req);
  if (!memberNo) return res.status(401).json({ success: false, message: "Unauthorized" });
  
  const delMemberNo = req.query.memberNo;
  
  if (!delMemberNo || delMemberNo === "" ) {
    return res.status(400).json({
      success: false,
      message: "Invalid request"
    });
  }

  const config = await fetchSystemConfig('com_web_app', 'survey', 'user');
  if (!config) {
    return res.status(404).json({
      success: false,
      message: "Config not found",
    });
  }

  let memberNos: string[] = JSON.parse(config.uvalue);

  memberNos = memberNos.filter(m => m !== delMemberNo);

  await updateSystemConfig(
    'com_web_app',
    'survey',
    'user',
    JSON.stringify(memberNos)
  );

  res.json({ success: true });
};