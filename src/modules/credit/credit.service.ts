import { QueryStatementCredit } from "../../database/query";
import { Store,Members,CreditPayload,CreditAvailedPayload } from "./credit.type";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export async function fetchStores(payload: CreditPayload): Promise<Store[]> {
  try {
    const sql = `SELECT * FROM store`;
    const rows = await QueryStatementCredit(payload.username, payload.password, sql);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching stores: ${error}`);
    throw error;
  }
}

export async function fetchMembers(payload: CreditPayload): Promise<Members[]> {
  try {
    const sql = `SELECT member_no, (member_no + ' - ' + member_name ) as member_name
                 FROM member
    `;
    const rows = await QueryStatementCredit(payload.username, payload.password, sql);
    return rows ?? []; 
  } catch (error) {
    logging.error(`Errror fetchin members: ${error}`);
    throw error;
  }
}

export async function fetchMembersByMemberNo(payload: CreditPayload) {
  try {
    const sql = `SELECT * FROM member WHERE member_no = ?`
    const rows = await QueryStatementCredit(payload.username, payload.password, sql, [payload.memberNo]);
    return rows[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching member by member no: ${error}`);
    throw error;
  }
}

export async function removeOTPLogsByMemberNo(
  payload: CreditPayload
): Promise<boolean> {
  try {
    const sql = `
      DELETE FROM otp_logs
      WHERE member_no = ?
        AND mobile_no = ?
    `;

    const result: any = await QueryStatementCredit(
      payload.username,
      payload.password,
      sql,
      [payload.memberNo, payload.phoneNo]
    );

    // If your wrapper returns array
    return Array.isArray(result) ? result.length > 0 : result > 0;

  } catch (error) {
    logging.error(`Error removing logs for OTP: ${error}`);
    throw error;
  }
}


export async function createOTPlogs(
  payload: CreditPayload
): Promise<boolean> {
  try {
    const dateCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const dateExpired = dayjs().add(5, "minute").format("YYYY-MM-DD HH:mm:ss");
    const sql = `INSERT INTO otp_logs (member_no, mobile_no, otp_code, date_created, date_expired)
                VALUES (?,?,?,?,?)     
    `;
    const rows : any = await QueryStatementCredit(payload.username,payload.password,sql, [
      payload.memberNo,
      payload.phoneNo,
      payload.otp,
      dateCreated,
      dateExpired
    ]);

    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;

  } catch (error) {
    logging.error(`Error creating OTP logs: ${error}`);
    throw error;
  }
}


export async function fetchOTPlogsExpired(
  payload: CreditPayload
): Promise<number> {
  try {
    const sql = `
      SELECT expiration_date
      FROM otp_logs
      WHERE member_no = ?
        AND mobile_no = ?
    `;

    const rows = await QueryStatementCredit(
      payload.username,
      payload.password,
      sql,
      [payload.memberNo, payload.phoneNo]
    );

    if (!rows || rows.length === 0) return 0;

    // Get seconds remaining
    const seconds = dayjs(rows[0].expiration_date)
      .diff(dayjs(), "second");

    return seconds > 0 ? seconds : 0;

  } catch (error) {
    logging.error(`Error fetching OTP logs: ${error}`);
    throw error;
  }
}

export async function fetchOTPLogs (
  payload: CreditPayload
) {
  try {
    const sql = `SELECT * FROM otp_logs WHERE member_no = ? AND mobile_no = ? AND opt = ?`
    const rows = await QueryStatementCredit(
      payload.username, 
      payload.password, 
      sql,
      [payload.memberNo, payload.phoneNo, payload.otp]
    );
    return rows[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching OTP log by mobile no: ${error} `);
    throw error;
  }
}

export async function removeOTPLogsByOTP (
  payload: CreditPayload
): Promise<boolean> {
  try {
      const sql = `
              DELETE FROM otp_logs
              WHERE member_no = ?
              AND mobile_no = ?
              AND otp = ?
      `;
    const rows : any = await QueryStatementCredit(
      payload.username,
      payload.password,
      sql,
      [payload.memberNo, payload.phoneNo, payload.otp]
    );
    return Array.isArray(rows) ? rows.length > 0 : rows > 0;
  } catch (error) {
    logging.error(`Error in remove OTP logs by OTP: ${error}`);
    throw error;
  }
}

export async function newCreditAvailed (
  payload: CreditPayload,
  creditAvailed: CreditAvailedPayload
):Promise<boolean> {
  try {
    const dateCreated = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const sql = `INSERT INTO credit_availed (member_no, date_availed, auth_refno,sotre_id, amount, amount_paid)
                VALUES (?,?,?,?,?,?)
    `;
    const rows : any = await QueryStatementCredit(
      payload.username, 
      payload.password,
      sql,
      [creditAvailed.memberNo,dateCreated, creditAvailed.referenceNo, creditAvailed.storeID, creditAvailed.amount, creditAvailed.amountPaid ?? 0]
    );

    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;

  } catch (error) {
    logging.error(`Error update credit availed: ${error}`);
    throw error;
  }
}

export async function upadateMemberCreditAvailed (payload: CreditPayload, amount: number | string): Promise<boolean> {
  try {
    const sql = `UPDATE member SET credit_availed = ? where member_no = ?`;
    const rows : any = await QueryStatementCredit(payload.username, payload.password, sql, [amount, payload.memberNo]);
    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;
  } catch (error) {
    logging.error(`Error update member credit availed: ${error}`);
    throw(error);
  }
}

export async function generateCreditReferenceNo (payload: CreditPayload): Promise<string> {
  try {
    const lastValue = await fetchSystemMaster(payload.username, payload.password, 'credit_refno')
    const dateNow = dayjs().format("YYMM");
    const lvNo = lastValue.toString().padStart(7, '0');
    return `${payload.storeID}${dateNow}${lvNo}`;
  } catch (error) {
    logging.error(`Error generating credit reference no`);
    throw error;
  }
}

async function fetchSystemMaster(
  username: string,
  password: string,
  tableName: string
): Promise<number> {
  try {
    // 1️⃣ Get existing value
    const selectSql = `
      SELECT last_value
      FROM sys_mstr
      WHERE table_name = ?
    `;

    const rows = await QueryStatementCredit(
      username,
      password,
      selectSql,
      [tableName]
    );

    if (!rows || rows.length === 0) {
      // 2️⃣ Insert if not exists
      const insertSql = `
        INSERT INTO sys_mstr (table_name, column_no, last_value)
        VALUES (?, ?, ?)
      `;

      await QueryStatementCredit(
        username,
        password,
        insertSql,
        [tableName, 1, 1]
      );

      return 1;
    }

    const newValue = rows[0].last_value + 1;

    // 3️⃣ Update value
    const updateSql = `
      UPDATE sys_mstr
      SET last_value = ?
      WHERE table_name = ?
    `;

    await QueryStatementCredit(
      username,
      password,
      updateSql,
      [newValue, tableName]
    );

    return newValue;

  } catch (error) {
    logging.error(`Error fetching system master table: ${error}`);
    throw error;
  }
}


export async function fetchMemberCreditHistory(payload: CreditPayload) {
  try {
    const sql = `
      SELECT
        c.member_no,
        c.date_availed,
        c.auth_refno,
        c.store_id,
        m.credit_limit,
        c.amount,
        c.amount_paid,
        m.credit_limit
          - SUM(c.amount - c.amount_paid)
            OVER (
              PARTITION BY c.member_no
              ORDER BY c.date_availed ASC
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS running_balance
      FROM credit_availed c
      JOIN member m
        ON c.member_no = m.member_no
      WHERE c.member_no = ?
      ORDER BY c.date_availed DESC
    `;

    const rows = await QueryStatementCredit(
      payload.username,
      payload.password,
      sql,
      [payload.memberNo]
    );

    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching member credit history: ${error}`);
    throw error;
  }
}
