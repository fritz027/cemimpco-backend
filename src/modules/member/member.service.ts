import { QueryStatement } from "../../database/query";
import { Member, MemberDeposits, MemberLoans, MemberTimeDeposits } from "./member.types";
import dayjs from "dayjs";

export async function computeMembershipAge(memberNo: string): Promise<number> {
  try {
    const sql = `
      SELECT
        CASE
          WHEN membership_date IS NULL THEN 0
          WHEN DATEADD(year, DATEDIFF(year, membership_date, GETDATE()), membership_date) > GETDATE()
            THEN DATEDIFF(year, membership_date, GETDATE()) - 1
          ELSE DATEDIFF(year, membership_date, GETDATE())
        END AS memberage
      FROM member
      WHERE member_no = ?
    `;

    const rows: any[] = await QueryStatement(sql, [memberNo]);

    // if member not found, return 0
    if (!rows || rows.length === 0 || rows[0]?.memberage == null) {
      return 0;
    }

    // Ensure it’s a number (some drivers return strings)
    return Number(rows[0].memberage) || 0;

  } catch (error) {
    logging.error(`Error computing membership age: ${error}`);
    throw error;
  }
}


export async function fetchMemberByMemberNo(memberNo: string): Promise<Member | null> {
  try {
    const sql = `SELECT member_no, member_name, email, member_type,
                bdate, addr_street1,telno,gender,membership_date,
                religion, mbr_tin_no, op_id, mbr_status, chapter,
                sms_cpno,credit_limit,credit_availed
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

export async function fetchMemberDeposits(memberNo: string): Promise<MemberDeposits[]> {
  try {
    const sql = `SELECT 
              t.deposit_desc as description,
              d.balance as balance,
              d.deposit_type as depositType 
              FROM deposit d, deposit_type t 
              WHERE d.deposit_type = t.deposit_type 
              AND d.status = 1 
              AND  d.member_no = ?
            `;

    const rows: any[] = await QueryStatement(sql, [memberNo]);
    return rows ?? []
  } catch (error) {
    logging.error(`Error fetching members deposits: ${error}`);
    throw error;
  }
}

export async function fetchMemberLoans(memberNo: string): Promise<MemberLoans[]> {
  try {
    const sql = `SELECT 
            l.loan_id as loanID, 
            l.loan_date as loanDate,
            l.loan_amt as loanAmount,
            l.payments as payments,
            l.interest as interest, 
            (l.loan_amt - l.payments) as balance, 
            t.loan_desc as description 
            FROM loan l, loan_type t 
            WHERE l.loan_type = t.loan_type 
            AND balance > 0 
            AND l.term > 0 
            AND  l.member_no = ?
    `;
    const rows: any[] = await QueryStatement(sql, [memberNo]);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fethcing members loans: ${error}`);
    throw error;
  }
}

export async function fetchMemberTimeDeposits(memberNo:string): Promise<MemberTimeDeposits[]> {
  try {
    const sql = ` SELECT 
                jrnref_no as referenceNo,
                member_no as memberNo,
                dep_date as depositDate,
                term,
                due_date as dueDate,
                dep_amt as depositAmount,
                int_rate as interestRate,
                td_certif_no as certificateNo,
                term_status as termStatus
              FROM time_depo
              WHERE term_status is null
              AND member_no = ?
    `;
    const rows: any[] = await QueryStatement(sql, [memberNo]);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching member time deposits: ${error}`);
    throw error;
  }
}

export async function fetchMemberDividendPatronage(memberNo: string) {
  try {
    const dd = dayjs().subtract(1, "year").year();
    const sql = `SELECT a.member_no,   
         a.for_year,   
         a.member_name,   
         a.ave_sc,   
         a.int_on_sc,   
         a.sc_retention,   
         a.mdof_int,   
         a.total_invst_sc_ss_mdof,   
         a.int_on_loans,   
         a.patronage_on_loans,   
         a.commision_ar,   
         a.patref_comm_ar,   
         a.consumer,   
         a.patref_cons,   
         a.ourshoppe,   
         a.ourshoppe_patronage,   
         a.canteen_cashless,   
         a.canteen_credit,   
         a.total_canteen,   
         a.patref_canteen,   
         a.total_patref,   
         a.tot_divpatref,   
         a.lend_a_cash,   
         a.net_of_lendacash,   
         a.payable,   
         a.final_amount,   
         a.acct_no,   
         a.mbr_status,   
         b.member_no,   
         b.op_id,   
         b.loan_type,   
         b.ded_code,   
         b.loan_id,   
         b.prin_due,   
         b.int_due,   
         b.fines_due,   
         b.patref_prin_pay,   
         b.patref_int_pay,   
         b.patref_fines_pay,   
         b.div_prin_pay,   
         b.div_int_pay,   
         b.div_fines_pay  
      FROM divpat_cemimpco_2023 as a LEFT OUTER JOIN tmp_loan_ded as b ON a.member_no = b.member_no
      WHERE	a.for_year = ? and a.member_no = ?`
    const rows: any = await QueryStatement(sql, [dd,memberNo]);  
    return rows.length > 0 ? rows : [];
  } catch (error) {
    logging.error(`Error fetching member dividend patronage: ${error} `);
    throw error;
  }
}


export async function fetchMemberCreditHistory(memberNo: string) {
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

    const rows = await QueryStatement(
      sql,
      [memberNo]
    );

    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching member credit history: ${error}`);
    throw error;
  }
}

export async function fetchRegularActiveMember(
  keyword?: string
): Promise<Member[]> {
  try {
    let sql = `
      SELECT *
      FROM member
      WHERE member_type = 'R'
      AND mbr_status = 'A'
    `;

    const params: any[] = [];

    if (keyword) {
      sql += `
        AND (
          member_no LIKE ?
          OR member_name LIKE ?
        )
      `;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ` ORDER BY member_no ASC`;

    const rows = await QueryStatement(sql, params);
    return rows ?? [];

  } catch (error) {
    logging.error(`Error fetching regular active members: ${error}`);
    throw error;
  }
}