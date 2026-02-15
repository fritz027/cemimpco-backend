import { QueryStatement } from "../../database/query";
import {  WebUser,NewWebUser,Member } from "./auth.types"; 

export async function getMemberByWebUserMemberNo(
  memberNo: string
): Promise<WebUser | null> {
  try {
    const sql = `
      SELECT
        member_no,
        password,
        email,
        name,
        verified,
        token,
        remember_token
      FROM member
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

export async function fetchMemberByMemberNo(memberNo: string): Promise<Member | null> {
  try {
    const sql = `SELECT member_no, member_name, email, member_type,
                bdate, addr_street1,telno,gender,membership_date,
                religion, mbr_tin_no, op_id, mbr_status, chapter
                FROM member
                WHERE member_no = ?
    `
    const rows = await QueryStatement(sql, [memberNo]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logging.error(`Error fetching Member By Member No: ${error}`);
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