import { QueryStatement } from "../../database/query";
import { SubmitSurveyAnswer,Survey,SurveyQuestion } from "./survey.types";

function tsNowSqlAnywhere() {
  return "CURRENT TIMESTAMP";
}

/**
 * Optional: if you implemented audit triggers using TEMPORARY OPTION "app_user"
 * call this at start of each request/transaction.
 *
 * If your SQL Anywhere doesn't support it, just remove this call.
 */
async function setAuditUser(appUser: string) {
  // Quoting: TEMPORARY OPTION names are double-quoted in SA
  const safe = (appUser ?? "").replace(/'/g, "''");
  const sql = `SET TEMPORARY OPTION "app_user" = '${safe}'`;
  try {
    await QueryStatement(sql, []);
  } catch {
    // If not supported in your version/driver, ignore
  }
}

export async function listActiveSurveys(): Promise<Survey[]> {
 try {
   const sql = `
     SELECT survey_id, survey_name, survey_from, survey_to
     FROM survey
     WHERE ${tsNowSqlAnywhere()} BETWEEN survey_from AND survey_to
     ORDER BY survey_from DESC
   `;
   return (await QueryStatement(sql, [])) as Survey[];
 } catch (error) {
    logging.error(`Error list Active surveys: ${error}`);
    throw error;
 }
}

export async function currentActiveSurveys(): Promise<Survey[]> {
 try {
   const sql = `
     SELECT TOP 1 survey_id, survey_name, survey_from, survey_to
     FROM survey
     WHERE ${tsNowSqlAnywhere()} BETWEEN survey_from AND survey_to
     ORDER BY survey_from DESC
   `;
   return (await QueryStatement(sql, [])) as Survey[];
 } catch (error) {
    logging.error(`Error current Active surveys: ${error}`);
    throw error;
 }
}

export async function listAllSurveys(): Promise<Survey[]> {
 try {
   const sql = `
          SELECT 
           s.survey_id,
           s.survey_name,
           s.survey_from,
           s.survey_to,
           s.status,
 
           COUNT(q.survey_id) AS total_question,
 
           CASE
               WHEN CURRENT DATE BETWEEN s.survey_from AND s.survey_to 
                   THEN 'Active'
               WHEN CURRENT DATE < s.survey_from 
                   THEN 'Upcoming'
               ELSE 'Closed'
           END AS survey_status
 
       FROM survey s
       LEFT JOIN survey_questions q 
           ON q.survey_id = s.survey_id
 
       GROUP BY 
           s.survey_id,
           s.survey_name,
           s.survey_from,
           s.survey_to,
           s.status
 
       ORDER BY s.survey_from DESC;
   `;
   return (await QueryStatement(sql, [])) as Survey[];
 } catch (error) {
    logging.error(`Error list all surveys: ${error}`);
    throw error;
 }
}

export async function getSurvey(surveyId: string): Promise<Survey | null> {
  const sql = `
    SELECT survey_id, survey_name, survey_from, survey_to
    FROM survey
    WHERE survey_id = ?
  `;
  const rows = (await QueryStatement(sql, [surveyId])) as Survey[];
  return rows[0] ?? null;
}

export async function getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]> {
  const sql = `
    SELECT survey_id, survey_qid, survey_seq, survey_question, survey_context
    FROM survey_questions
    WHERE survey_id = ?
    ORDER BY survey_seq ASC, survey_qid ASC
  `;
  return (await QueryStatement(sql, [surveyId])) as SurveyQuestion[];
}

export async function getSurveyWithQuestions(surveyId: string) {
  const survey = await getSurvey(surveyId);
  if (!survey) return null;

  const questions = await getSurveyQuestions(surveyId);
  return { survey, questions };
}

export async function memberHasAnsweredSurvey(memberNo: string, surveyId: string): Promise<boolean> {
 try {
   const sql = `
     SELECT TOP 1 1
     FROM survey_answers
     WHERE member_no = ?
       AND survey_id = ?
   `;
   const rows = await QueryStatement(sql, [memberNo, surveyId]);
   return Array.isArray(rows) && rows.length > 0;
 } catch (error) {
  logging.error(`Error in member has answere survey: ${error}`);
  throw error;
 }
}

export async function createSurvey(
  payload: { survey_id: string; survey_name: string; survey_from: string; survey_to: string },
  actorMemberNo: string
) {
  await setAuditUser(actorMemberNo);

  const sql = `
    INSERT INTO survey (survey_id, survey_name, survey_from, survey_to)
    VALUES (?, ?, ?, ?)
  `;
  await QueryStatement(sql, [payload.survey_id, payload.survey_name, payload.survey_from, payload.survey_to]);
}

export async function updateSurvey(
  surveyId: string,
  payload: { survey_name?: string; survey_from?: string; survey_to?: string; survey_status: "1" | "0" },
  actorMemberNo: string
) {
  await setAuditUser(actorMemberNo);

  const fields: string[] = [];
  const params: any[] = [];

  if (payload.survey_name !== undefined) {
    fields.push("survey_name = ?");
    params.push(payload.survey_name);
  }
  if (payload.survey_from !== undefined) {
    fields.push("survey_from = ?");
    params.push(payload.survey_from);
  }
  if (payload.survey_to !== undefined) {
    fields.push("survey_to = ?");
    params.push(payload.survey_to);
  }
  
  fields.push("status = ?");
  params.push(Number(payload.survey_status));

  console.log(fields, params);

  if (!fields.length) return;

  const sql = `
    UPDATE survey
    SET ${fields.join(", ")}
    WHERE survey_id = ?
  `;
  params.push(surveyId);
  await QueryStatement(sql, params);
}

export async function deleteSurvey(surveyId: string, actorMemberNo: string) {
  await setAuditUser(actorMemberNo);

  // ON DELETE CASCADE will delete questions/answers if FK set that way
  const sql = `DELETE FROM survey WHERE survey_id = ?`;
  await QueryStatement(sql, [surveyId]);
}

export async function upsertQuestion(
  surveyId: string,
  q: { survey_qid: number; survey_seq: number; survey_question: string; survey_context: string },
  actorMemberNo: string
) {
  await setAuditUser(actorMemberNo);

  // SQL Anywhere supports IF EXISTS with SELECT, but simplest is "try update then insert if no rows"
  const updateSql = `
    UPDATE survey_questions
    SET survey_seq = ?,
        survey_question = ?,
        survey_context = ?
    WHERE survey_id = ?
      AND survey_qid = ?
  `;
  const updateParams = [q.survey_seq, q.survey_question, q.survey_context, surveyId, q.survey_qid];
  const updateRes: any = await QueryStatement(updateSql, updateParams);

  // Some drivers don't return affected rows; fallback check:
  // We'll attempt insert and ignore duplicate if it exists.
  const insertSql = `
    INSERT INTO survey_questions (survey_id, survey_seq, survey_qid, survey_question, survey_context)
    VALUES (?, ?, ?, ?, ?)
  `;
  try {
    await QueryStatement(insertSql, [surveyId, q.survey_seq, q.survey_qid, q.survey_question, q.survey_context]);
  } catch (e: any) {
    // ignore duplicate key insert if update already happened
    // If you want stricter handling, check SQLSTATE here.
    logging.warn(`upsertQuestion insert maybe duplicate: ${e?.message ?? e}`);
  }

  return;
}

export async function deleteQuestion(surveyId: string, surveyQid: number, actorMemberNo: string) {
  await setAuditUser(actorMemberNo);

  const sql = `
    DELETE FROM survey_questions
    WHERE survey_id = ?
      AND survey_qid = ?
  `;
  await QueryStatement(sql, [surveyId, surveyQid]);
}

export async function submitSurveyAnswers(
  memberNo: string,
  surveyId: string,
  answers: SubmitSurveyAnswer[],
  actorMemberNo: string
) {
  console.log('survey id: ',surveyId);
  try {
    await setAuditUser(actorMemberNo);
  
    // 1) Ensure survey is active
    const activeSql = `
      SELECT TOP 1 1
      FROM survey
      WHERE survey_id = ?
        AND ${tsNowSqlAnywhere()} BETWEEN survey_from AND survey_to
    `;
    const active = await QueryStatement(activeSql, [surveyId]);
    if (!Array.isArray(active) || active.length === 0) {
      return { ok: false, message: "Survey is not active." as const };
    }
  
    // 2) Prevent duplicate submit
    const already = await memberHasAnsweredSurvey(memberNo, surveyId);
    console.log('....')
    if (already) {
      return { ok: false, message: "You already answered this survey." as const };
    }
  
    if (!answers?.length) {
      return { ok: false, message: "No answers provided." as const };
    }
  
    // 3) Insert answers
    //    (Primary key prevents duplicates per question)
    const insertSql = `
      INSERT INTO survey_answers (member_no, survey_id, survey_qid, answer, answer_on)
      VALUES (?, ?, ?, ?, ${tsNowSqlAnywhere()})
    `;
  
    for (const a of answers) {
      console.log(a.survey_qid, a.answer === 'yes' ? 'y' : 'n' );
      await QueryStatement(insertSql, [memberNo, surveyId, a.survey_qid, a.answer]);
    }
  
    return { ok: true, message: "Survey submitted." as const };
  } catch (error) {
    logging.error(`Error submitting survey answer: ${error}`);
    throw error;
  }
}

export async function getSurveyResults(surveyId: string) {
  // Simple aggregation: counts per question per answer
  const sql = `
    SELECT
      q.survey_qid,
      q.survey_seq,
      q.survey_question,
      q.survey_context,
      a.answer,
      COUNT(*) AS total
    FROM survey_questions q
    LEFT JOIN survey_answers a
      ON a.survey_id = q.survey_id
     AND a.survey_qid = q.survey_qid
    WHERE q.survey_id = ?
    GROUP BY
      q.survey_qid,
      q.survey_seq,
      q.survey_question,
      q.survey_context,
      a.answer
    ORDER BY q.survey_seq ASC, q.survey_qid ASC
  `;
  return await QueryStatement(sql, [surveyId]);
}