import dayjs from "dayjs";
import { QueryStatement } from "../../database/query";
import { DepositHeader } from "../deposit/deposit.type";
import { LoanDetail, LoanHeader, LoanTypeDetail, LoanType, LoanApplicationData, SaveLoanResult } from "./loan.type";
import { SetInstallmentType } from "../../common/utils/installmentType";
import { sendMail } from "../../common/services/email.service";
import { EMAIL_USERNAME } from "../../config/config";

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

export async function fetchMemberMobileNo(memberNo: string): Promise<string | null> {
  try {
    const sql = `SELECT telno FROM member WHERE member_no = ?`;
    const row = await QueryStatement(sql, [memberNo]);
    return row?.[0]?.telno ?? null;
  } catch (error) {
    logging.error(`Error fetching member mobile number: ${error}`);
    throw error;
  }
}

export async function fetchLoanApplicationByType(type: string): Promise<LoanType | null> {
  try {
    const sql = `SELECT * FROM loan_type WHERE loan_type = ?`;
    const row = await QueryStatement(sql, [type]);
    const insType = SetInstallmentType(row?.[0]?.installment_type);
    if (row?.[0]) {
      row[0].insType = insType;
    } 
    return row?.[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching loan application by type: ${error}`);
    throw error;
  } 
}

export const fetchSharecapital = async (memberNo: string): Promise<number | null> => {
  try {
    const sql = 'SELECT * FROM deposit where member_no = ? and deposit_type = ?';
    const row = await QueryStatement(sql, [memberNo, '361-000']);
    return row?.[0]?.balance ?? null;
  } catch (error) {
    logging.error(`Error fetching share capital: ${error}`);
    throw error;
  }
};

async function getWebLoanId(): Promise<number> {
  const sql = `SELECT MAX(CONVERT(INT, SUBSTRING(loan_id, 2, 8))) AS max_id FROM loan_app WHERE loan_id LIKE 'W%'`;
  const rows = await QueryStatement<{ max_id: number | null }>(sql);
  return (rows?.[0]?.max_id ?? 0) + 1;
}

function buildLoanApplicationHtml(loanID: string, data: LoanApplicationData, applyDate: string, loanType: LoanType): string {
  return `
    <h2>New Online Loan Application</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><td><strong>Loan ID</strong></td><td>${loanID}</td></tr>
      <tr><td><strong>Member No.</strong></td><td>${data.memberno}</td></tr>
      <tr><td><strong>Application Date</strong></td><td>${applyDate}</td></tr>
      <tr><td><strong>Loan Type</strong></td><td>${loanType.loan_desc}</td></tr>
      <tr><td><strong>Applied Amount</strong></td><td>${parseFloat(data.loanamount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td></tr>
      <tr><td><strong>Purpose</strong></td><td>${data.purpose}</td></tr>
      <tr><td><strong>Term</strong></td><td>${data.term}</td></tr>
      <tr><td><strong>Interest Rate</strong></td><td>${data.intRate}%</td></tr>
    </table>
  `;
}

export async function saveLoanWithAttachment(email: string, data: LoanApplicationData, files: Express.Multer.File[]): Promise<SaveLoanResult> {
  try {
    const id = await getWebLoanId();
    const applyDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const loanType = await fetchLoanApplicationByType(data.loan_type);

    if (!loanType) {
      return { success: false, message: 'Invalid loan type' };
    }

    const loanID = 'W' + id.toString().padStart(8, '0');
    const loanAmount = parseFloat(data.loanamount);

    const params = [
      loanID,
      'MITZI',
      data.memberno,
      applyDate,
      data.loan_type,
      loanAmount,
      data.purpose,
      data.term,
      parseFloat(data.intRate),
      'P',
      loanType.installment_type,
      loanType.add_on_flag,
      loanType.int_type,
      loanType.class_code,
    ];

    const result = await QueryStatement(
      `INSERT INTO loan_app (loan_id,op_id,member_no,apply_date,loan_type,applied_loan_amt,loan_purpose,term,int_rate,status,installment_type,add_on_flag,int_type,class_code)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      params
    );

    if (!result || (result as any).count === 0) {
      return { success: false, message: 'Error saving loan application. Please try again later.' };
    }

   const attachments = files.map(f => ({
      filename: f.originalname,
      path: f.path,
      contentType: f.mimetype,
    }));

    const maillist = [EMAIL_USERNAME, email];

    sendMail({
      to: maillist,
      subject: `New Loan Application – ${loanID}`,
      html: buildLoanApplicationHtml(loanID, data, applyDate, loanType),
      attachments,
    }).catch(err => logging.error(`Failed to send loan notification email for ${loanID}: ${err}`));

    return { success: true, message: 'Loan application submitted successfully.' };
  } catch (error) {
    logging.error(`Error in saveLoanWithAttachment: ${error}`);
    return { success: false, message: `Error saving loan application: ${error}` };
  }
}