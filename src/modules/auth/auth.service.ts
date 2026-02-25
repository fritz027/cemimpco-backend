import { QueryStatement, QueryStatementCredit } from "../../database/query";
import { 
  WebUser,
  NewWebUser,
  Member,
  CreditRights,
  ElectionSetting,
  SystemConfigRow,
  CandidatesResult
 } from "./auth.types"; 


export async function getMemberByWebUserMemberNo(
  memberNo: string
): Promise<WebUser | null> {
  try {
    const sql = `
      SELECT
        member_no as memberNo,
        password,
        email,
        name,
        verified,
        token,
        remember_token
      FROM webuser
      WHERE member_no = ?
    `;

    const rows = await QueryStatement<WebUser>(sql, [memberNo]);
    return rows[0] ?? null;

  } catch (error) {
    logging.error(`Error model/getMemberByWebUserMemberNo: ${error}`);
    throw error;
  }
}


export async function memberExists(memberNo: string): Promise<boolean> {
  try {
    const sql = "SELECT 1 FROM member WHERE member_no = ?";

    const result = await QueryStatement(sql, [memberNo]);

    return result.length > 0;

  } catch (error) {
    logging.error(`Error in memberExists: ${error}`);
    throw error;
  }
}

export async function webUserExists(memberNo: string, email: string): Promise<boolean> {
  try {
    const sql = `SELECT 1 FROM webuser
                WHERE member_no = ?
                AND email = ?          
    `;
    const rows = await QueryStatement(sql, [memberNo, email]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error in webUserExists: ${error}`);
    throw error;
  }
}


export async function createNewWebUser(
  registerPayload: NewWebUser
): Promise<boolean> {
  try {
    const sql = `
      INSERT INTO webuser
      (member_no, name, email, password, token, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await QueryStatement(sql, [
      registerPayload.member_no,
      registerPayload.member_name,
      registerPayload.email,
      registerPayload.password,
      registerPayload.token,
      registerPayload.date_created
    ]);

    // Handle common ODBC return patterns
    if (result?.count !== undefined) {
      return result.count > 0;
    }

    if (result?.rowsAffected !== undefined) {
      return result.rowsAffected > 0;
    }

    // If no structured response but no error thrown
    return true;

  } catch (error) {
    logging.error(`Error creating new web user: ${error}`);
    throw error;
  }
}

export async function checkMemberByMemberNo(memberNo: string): Promise<boolean> {
  try {
    const sql = 'SELECT 1 FROM member where member_no = ?'
    const rows = await QueryStatement(sql,[memberNo]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error in check member by member no: ${error}`);
    throw error;
  }
}

export async function checkWebUserByMemberNo(memberNo: string): Promise<boolean>{
  try {
    const sql = 'SELECT 1 FROM webuser WHERE member_no = ?'
    const rows = await QueryStatement(sql,[memberNo]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error in checking web user by member no: ${error}`);
    throw error;
  }
}

export async function checkMemberStatus(memberNo: string): Promise<boolean> {
  try {
    const sql = 'SELECT 1 FROM member WHERE mbr_status =? AND member_no = ?'
    const rows = await QueryStatement(sql,["A",memberNo]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error in checking web user by member no: ${error}`);
    throw error;
  }
}

export async function updateUserLogin(memberNo: string, email: string, dateUpdated: Date | string): Promise<boolean>{
  try {
    const sql = `UPDATE webuser SET verified = ?, token = ?, updated_at = ?
                WHERE member_no = ? and email = ?
    `;
    const rows: any = await QueryStatement(sql,[1,'',dateUpdated,memberNo,email]);
    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;
  } catch (error) {
    logging.error(`Error updating user login activation: ${error}`);
    throw error;
  }
}

export async function webUserExistByEmail(email: string): Promise<boolean>{
  try {
    const sql = `SELECT 1 FROM webuser where email = ?`
    const rows = await QueryStatement(sql, [email]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error webuser exist by email: ${error}`);
    throw error;
  }
}

export async function webUserUpdatePassword(email: string, memberNo: string, password: string, dateUpdated: Date | string): Promise<boolean>{
  try {
    const sql = `UPDATE webuser SET password = ?, updated_at = ? WHERE member_no = ? AND email = ?`;
    const rows: any = await QueryStatement(sql, [password, dateUpdated, memberNo, email]);
    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;
  } catch (error) {
    logging.error(`Error webuser update password: ${error}`);
    throw error;
  }
} 


//For Credit Auth

export async function fetchCreditUserRights (userName: string, password: string, storeID: string): Promise<boolean>  {
  try {
    const sql = `SELECT * from _user_rights where username = ? and rights = ?`
    const rows: any[] = await QueryStatementCredit(userName, password, sql, [userName, storeID]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error fetching credit user rights: ${error}`);
    throw error;
  }
}

export async function fetchSystemConfig(appName: string, section: string, ukey: string): Promise<SystemConfigRow | null> {
  try {
    const sql = `SELECT uvalue 
                FROM sys_config
                WHERE app_name = ? 
                AND section = ?
                AND ukey = ?     
    `;
    const rows: any = await QueryStatement(sql, [appName, section, ukey]);

    return rows[0] ?? null

  } catch (error) {
    logging.error(`Error in fetching election settings: ${error}`);
    throw error;
  }
}


export async function fetchMembersByList(memberNos: string[]) {
  if (!memberNos.length) return [];

  const placeholders = memberNos.map(() => '?').join(',');

  const sql = `
    SELECT member_no, member_name
    FROM member
    WHERE member_no IN (${placeholders})
  `;

  return await QueryStatement(sql, memberNos);
}

export async function updateSystemConfig(
  appName: string, 
  section: string, 
  ukey:string, 
  uvalue: string
): Promise<boolean>{
  try {
    const sql = `UPDATE sys_config SET uvalue = ? 
                WHERE app_name = ?
                AND section = ?
                AND ukey = ?
    `;
    const rows: any = await QueryStatement(sql, [uvalue, appName, section, ukey]);
    return rows.length > 0;
  } catch (error) {
    logging.error(`Error updating system config: ${error}`);
    throw error;
  }
}

export async function fetchAllCandidates(year: number):Promise<CandidatesResult[]> {
  try {
    const sql = `SELECT 
      m.member_name,
      m.membership_date, 
      c.vision, 
      c.photo_url,
      p.position_desc,
      p.position_id 
      FROM evs_candidates c LEFT JOIN member m ON m.member_no = c.member_no
      LEFT JOIN evs_position p ON p.position_id = c.position_id 
      WHERE c.elect_year = ?`;
    const rows : CandidatesResult[] = await QueryStatement(sql, [year]);

    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching all candidates: ${error}`);
    throw error;
  }
}

export async function checkMemberTINbyMemberNo(memberNo: string, tin: string): Promise<boolean> {
  try {
    const sql = `SELECT TOP 1 1 
              FROM member
              WHERE member_no = ?
              AND mbr_tin_no = ?`;
    const result : any = await QueryStatement(sql, [memberNo, tin]);

    return result.length > 0;

  } catch (error) {
    logging.error(`Error check member TIN by member no: ${error}`);
    throw error;
  }
}

export async function checkMemberDateOfBirth(memberNo: string, dob: Date | string): Promise<boolean> {
  try {
     const sql = `SELECT TOP 1 1 
              FROM member
              WHERE member_no = ?
              AND bdate = ?`;
    const result : any = await QueryStatement(sql, [memberNo, dob]);

    return result.length > 0;
  } catch (error) {
    logging.error(`Error in checking member date of birth: ${error}`);
    throw error;
  }
}