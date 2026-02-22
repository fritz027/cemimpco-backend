import { QueryStatement } from "../../database/query";
import { DepositHeader } from "../deposit/deposit.type";
import { LoanDetail,LoanHeader, LoanTypeDetail } from "./loan.type";

export async function fetchLoanDetails(loanID: string): Promise<LoanDetail[]>  {
  try {
    const sql = `exec get_loan_payments_prof @loanid = ?`
    const rows : any[] = await QueryStatement(sql,[loanID]);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching loan details: ${error}`);
    throw error;
  }
}

export async function fetchLoanHeader(memberNo: string, loanID: string): Promise<LoanHeader | null> {
  try {
    const sql = `SELECT 
              l.loan_amt,
              l.payments,
              l.loan_date,
              d.loan_desc
              FROM loan l,loan_type d 
              WHERE l.loan_type = d.loan_type 
              AND l.member_no = ? 
              AND l.loan_id = ?
          `;
    const row = (await QueryStatement(sql,[memberNo, loanID])) as LoanHeader[];
    return row?.[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching loan header: ${error}`);
    throw error;
  }
}

export async function fetchLoanApplicationsByStatus (memberNo: string, status: string) {
  try {
    const sql  = `SELECT * FROM loan_app
                  WHERE status = ?
                  AND member_no = ?
                `;
    const rows = await QueryStatement(sql, [status,memberNo]);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching loan applications by status: ${error}`);
    throw error;
  }
}

export async function fetchLoanTypeDetails(): Promise<LoanTypeDetail[]> {
  try {
    const sql = `SELECT loan_type, loan_desc
                FROM loan_type
                WHERE online_status = 1
                ORDER BY loan_desc`;
    const rows = await QueryStatement(sql);
    return rows ?? [];
  } catch (error) {
    logging.error(`error fetching loan type details: ${error}`);
    throw error
  }
}