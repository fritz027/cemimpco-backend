import dayjs from "dayjs";
import { QueryStatement } from "../../database/query";
import { DepositHeader } from "../deposit/deposit.type";
import { 
  LoanDetail, 
  LoanHeader, 
  LoanTypeDetail, 
  LoanType, 
  LoanApplicationData, 
  SaveLoanResult,
  LoanAppDetail,
  FinanceDetail,
  PersonalDetail,
  MemberRow,
  DelinquencyHistory 
} from "./loan.type";
import { SetInstallmentType } from "../../common/utils/installmentType";
import { sendMail } from "../../common/services/email.service";
import { EMAIL_USERNAME } from "../../config/config";
import { generateLoanApplicationPdf } from "../../common/pdf/generateLoanApplicationPdf";
import numberToWords from 'number-to-words';
import { findIdImage } from "../../common/utils/idPictureFinder";
import path from "path";

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

export async function memberDelinquencyHistory(memberNo: string): Promise<DelinquencyHistory | null> {
  try {
    const sql = `
      WITH co AS (
          SELECT CASE
                  WHEN DAY(CURRENT DATE) >= 10
                    THEN DATEADD(day, 9, YMD(YEAR(CURRENT DATE), MONTH(CURRENT DATE), 1))
                    ELSE DATEADD(day, 9, DATEADD(month, -1,
                              YMD(YEAR(CURRENT DATE), MONTH(CURRENT DATE), 1)))
                END AS cutoff_date
      )
      SELECT l.member_no,
            COUNT(*) AS active_loans,
            SUM(CASE WHEN
                  COALESCE((SELECT SUM(s.prin_due + s.int_due)
                              FROM DBA.loan_sched s
                              WHERE s.loan_id  = l.loan_id
                                AND s.op_id    = l.op_id
                                AND s.due_date <= co.cutoff_date), 0)
                - COALESCE((SELECT SUM(p.prin_payment + p.int_payment)
                              FROM DBA.loan_payments p
                              WHERE p.loan_id = l.loan_id
                                AND p.op_id   = l.op_id
                                AND p.tran_date <= co.cutoff_date), 0)
                  > 0.01
                  THEN 1 ELSE 0 END) AS delinquent_loans,
            MAX(CASE WHEN
                  COALESCE((SELECT SUM(s.prin_due + s.int_due)
                              FROM DBA.loan_sched s
                              WHERE s.loan_id  = l.loan_id
                                AND s.op_id    = l.op_id
                                AND s.due_date <= co.cutoff_date), 0)
                - COALESCE((SELECT SUM(p.prin_payment + p.int_payment)
                              FROM DBA.loan_payments p
                              WHERE p.loan_id = l.loan_id
                                AND p.op_id   = l.op_id
                                AND p.tran_date <= co.cutoff_date), 0)
                  > 0.01
                  THEN 1 ELSE 0 END) AS is_delinquent
        FROM DBA.loan l
      CROSS JOIN co
      WHERE l.member_no = ?
        AND (l.loan_amt - COALESCE(l.payments, 0)) > 0
        AND COALESCE(l.loan_type, '') <> '162-126'
      GROUP BY l.member_no;
    `;
    const row = await QueryStatement(sql, [memberNo]);
    return row?.[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching member delinquency history: ${error}`);
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

function buildLoanApplicationHtml(loanID: string, memberNo:string, data: LoanAppDetail, applyDate: string, loanType: LoanType): string {
  return `
    <h2>New Online Loan Application</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><td><strong>Loan ID</strong></td><td>${loanID}</td></tr>
      <tr><td><strong>Member No.</strong></td><td>${memberNo}</td></tr>
      <tr><td><strong>Application Date</strong></td><td>${applyDate}</td></tr>
      <tr><td><strong>Loan Type</strong></td><td>${loanType.loan_desc}</td></tr>
      <tr><td><strong>Applied Amount</strong></td><td>${data.loanAmount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td></tr>
      <tr><td><strong>Purpose</strong></td><td>${data.loanPurpose}</td></tr>
      <tr><td><strong>Term</strong></td><td>${data.term}</td></tr>
      <tr><td><strong>Interest Rate</strong></td><td>${data.interestRate}%</td></tr>
    </table>
  `;
}

export async function saveLoanWithAttachment(email: string, memberNo: string, loanApp: LoanAppDetail, finance: FinanceDetail, personal: PersonalDetail,  files: Express.Multer.File[]): Promise<SaveLoanResult> {
  try {
    const id = await getWebLoanId();
    const applyDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const loanType: LoanType | null = await fetchLoanApplicationByType(loanApp.loanType);

    if (!loanType) {
      return { success: false, message: 'Invalid loan type' };
    }

    const loanID = 'W' + id.toString().padStart(8, '0');

    const params = [
      loanID,
      'MITZI',
      memberNo,
      applyDate,
      loanApp.loanType,
      loanApp.loanAmount,
      loanApp.loanPurpose,
      loanApp.term,
      loanApp.interestRate,
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

    // --- save succeeded; now build data + send email (fire-and-forget) ---
    const templateData = await buildLoanTemplateData(loanID, memberNo, loanApp, personal, finance, applyDate, loanType);
    // console.log(templateData);
    sendLoanApplicationEmail(loanID, email, memberNo, loanApp, applyDate, loanType, templateData, files)
      .catch(err => logging.error(`Failed to send loan notification email for ${loanID}: ${err}`));

    return { success: true, message: 'Loan application submitted successfully.' };

  } catch (error) {
    logging.error(`Error in saveLoanWithAttachment: ${error}`);
    return { success: false, message: `Error saving loan application: ${error}` };
  }
}




export async function fetchmemberDetails(memberNo: string): Promise<MemberRow | null> {
  try {
    const sql = `SELECT * FROM member WHERE member_no = ?`;
    
    // Type cast the query result if your QueryStatement function supports generics, 
    // or cast the row variable itself.
    const rows = await QueryStatement(sql, [memberNo]) as MemberRow[];
    
    // Ensure rows exists, is an array, and has at least one element
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0];
    }
    
    return null;
  } catch (error) {
    logging.error(`Error fetching member details: ${error}`);
    throw error;
  }
}

function converNumberToWords (amount: number): string {
  const principal = Math.floor(amount);
  const cents = Math.round((amount - principal) * 100)

  const principalToWords = numberToWords.toWords(principal);

  if (cents > 0) {
    const centsToWords = numberToWords.toWords(cents);
    return `${principalToWords} pesos and ${centsToWords} centavos only.`;
  }
  return `${principalToWords} pesos only.`;
}

async function buildLoanTemplateData(
  loanID: string,
  memberNo: string,
  data: LoanAppDetail,
  personal: PersonalDetail,
  finance: FinanceDetail,
  applyDate: string,
  loanType: LoanType
) {
  try {
    const memberDetails = await fetchmemberDetails(memberNo);
    if (!memberDetails) {
      throw new Error(`Member details not found for member_no: ${memberNo}`);
    }

    const today = dayjs();
    const terms = data.term * 2;
    const interestRate = loanType.int_rate; 
    const serviceFee = loanType.service_fee;
    const interest = (data.loanAmount * interestRate) * data.term;
    const service = data.loanAmount * serviceFee;
    const totalLoanAmount = data.loanAmount + parseFloat(interest.toFixed(2)) + parseFloat(service.toFixed(2));
    const monthlyDues = parseFloat(totalLoanAmount.toFixed(2)) / data.term;
    const loanRetention = data.loanAmount * (1 / 100)
    const insurance = Number((Math.round(data.loanAmount! / 1000) * 0.55).toFixed(2))
    const loanAmountInWords = converNumberToWords(data.loanAmount);
    const finesCharge =  Number(Math.round(interest +insurance).toFixed(2))
    const totalFee = Math.round(service + finesCharge)
    const loanProceeds = Math.round(data.loanAmount - finesCharge)
    const monthInWord = numberToWords.toWords(data.term);
    const dueDate = dayjs(today).add(1, 'month').format('MMM-DD-YYYY');
    const appdate = dayjs(applyDate).format('MMMM D, YYYY');
    
    return {
      loanid: loanID,
      intRate: interestRate,
      loanDesc: loanType.loan_desc,
      memberNo,
      member: memberDetails,
      finance,
      personal,
      loantype: loanType.loan_type,
      loanAmount: data.loanAmount,
      loanwithinterest: totalLoanAmount,
      term: data.term,
      termsemimonthly: terms,
      pettycash: '11711.4',
      monthlydues: monthlyDues,
      purpose: data.loanPurpose,
      loanDate: today,
      appdate: appdate,
      service,
      loanRetention,
      insurance,
      interest,
      finesCharge,
      totalFee,
      loanProceeds,
      loanAmountInWords
    } 
  } catch (error) {
    logging.error(`Error building loan template data: ${error}`);
    throw error;
  }
}

async function sendLoanApplicationEmail(
  loanID: string,
  email: string,
  memberNo: string,
  data: LoanAppDetail,
  applyDate: string,
  loanType: LoanType,
  templateData: any,
  files: Express.Multer.File[]
) {
 try {
   const pdfPath = await generateLoanApplicationPdf(loanID, templateData);
 
   const idImage = files.find(f => f.mimetype.startsWith('image/'));
 
   const attachments: any[] = [
     { filename: `LoanApplication-${loanID}.pdf`, path: pdfPath, contentType: 'application/pdf' },
   ];
   
   const idImagePath = await findIdImage(memberNo);
   if (idImagePath) {
     attachments.push({ 
       filename: path.basename(idImagePath),
       path: idImagePath,
       // contentType can be omitted — nodemailer infers it from the extension
     });
   } else {
     logging.warn(`ID image not found for memberNo: ${memberNo}`);
   }
 
   const maillist = [EMAIL_USERNAME, email];
   return sendMail({
     to: maillist,
     subject: `New Loan Application – ${loanID}`,
     html: buildLoanApplicationHtml(loanID, memberNo, data, applyDate, loanType),
     attachments,
   });
 } catch (error) {
    logging.error(`Error sending loan application email: ${error}`);
    throw error;
 }
}
