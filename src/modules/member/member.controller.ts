import { Request , Response, NextFunction } from 'express';
import { 
  computeMembershipAge, 
  fetchMemberByMemberNo, 
  fetchMemberDeposits, 
  fetchMemberLoans, 
  fetchMemberTimeDeposits,
  fetchMemberCreditHistory,
  fetchRegularActiveMember, 
  fetchPatronageDividend
} from './member.service';
import { 
  LOAN_APP_PASSWORD,
  LOAN_APP_USERS,
  LOAN_APP_UC,
  VIEW_DIVIDEND,
  SERVER_HOSTNAME,
  SERVER_PORT 
} from '../../config/config';
import { generateDividendPatronagePdf } from '../../common/pdf/dividendPatronage';
import fs from "fs";
import dayjs from 'dayjs';
import { generatePatronagePdf } from '../../common/services/pdfService';


export const getMembershipAge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNoParam = req.query.memberNo;

    if (typeof memberNoParam !== "string" || !memberNoParam.trim()) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const age = await computeMembershipAge(memberNoParam.trim());

    return res.status(200).json({ success: true, age });
  } catch (error) {
    logging.error(`Error getting membership age: ${error}`);
    next(error);
  }
};

export const getMembersProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const member = await fetchMemberByMemberNo(memberNo);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    return res.status(200).json({
      success: true,
      member
    })

  } catch (error) {
    logging.error(`Error getting members profile: ${error}`);
    next(error);
  }
}

export const getMembersDeposits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const deposits = await fetchMemberDeposits(memberNo);

    return res.status(200).json({
      success: true,
      message: deposits.length ? "Deposits found" : "No deposits found",
      deposits
    });

  } catch (error) {
    logging.error(`Error in getting members deposits: ${error}`);
    next(error);
  }
}

export const getMembersLoans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const loans = await fetchMemberLoans(memberNo);

    return res.status(200).json({
      success: true,
      message: loans.length ? "Loans found" : "No loans found",
      loans
    });

  } catch (error) {
    logging.error(`Error getting members loans: ${error}`);
    next(error);
  }
}

export const getMembersTimeDeposits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const timeDeposits = await fetchMemberTimeDeposits(memberNo);

    return res.status(200).json({
      success: true,
      message: timeDeposits.length ? "Time deposits found" : "No time deposits found",
      timeDeposits
    });

  } catch (error) {
    logging.error(`Error getting members time deposits: ${error}`);
    next(error);
  }
}

export const getLoanApplicationPassword = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const email = req.user?.email;
    const password = req.body.password;

    if (!email || !memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const isValid = password === LOAN_APP_PASSWORD;  

    if (!isValid) {
      return res.status(400).json({
        success: isValid,
        message: "Invalid credentials"
      });
    }

    const isInclude = LOAN_APP_USERS.includes(memberNo);

    return res.status(200).json({
      success: isInclude,
      data: isInclude
        ? !isInclude
        : LOAN_APP_UC
    });

  } catch (error) {
    logging.error(`Error getting loan application password: ${error}`);
    next(error);
  }
}

export const getDividendSettings = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const email = req.user?.email;

    if (!email || !memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    return res.status(200).json({
      success: VIEW_DIVIDEND,
    })

  } catch (error) {
    logging.error(`Error get dividend settings: ${error}`);
    next(error);
  }
}

export const getMemberDividend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const email = req.user?.email;

    if (!memberNo || !email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const server = `${SERVER_HOSTNAME}:${SERVER_PORT}`;
    
    const pdfPath = await generateDividendPatronagePdf(memberNo);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "No dividend found"
      });
    }

    return res.status(200).json({
      success: true,
      pdf: `${server}/${memberNo}.pdf`
    })

  } catch (error) {
    logging.error(`Error getting dividend patronage: ${error}`);
    next(error);
  }
}

export const getMemberCreditHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberNo } = req.query;

    if (typeof memberNo !== "string" || memberNo.trim() === "" ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const member = await fetchMemberCreditHistory(memberNo);

    return res.status(200).json({
      success: true,
      data: member
    });

  } catch (error) {
    logging.error(`Error getting member credit history: ${error}`);
    next(error);
  }
}

export const searchRegularActiveMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authMemberNo = req.user?.memberNo;

    if (!authMemberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const keyword = req.query?.q as string | undefined;

    const members = await fetchRegularActiveMember(keyword);

    return res.status(200).json({
      success: true,
      message: members.length ? "Members found" : "No members found",
      members,
    });

  } catch (error) {
    logging.error(`Error in searching regular active member: ${error}`);
    next(error);
  }
};

export const patronageDividend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = dayjs().subtract(1, "year").year();
    const forYear = Number(year || 2025); 
    const memberNo = String(req.user?.memberNo);

    if (!memberNo) { 
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const rows = await fetchPatronageDividend(memberNo, forYear);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Dividend record not found" });
    }

    // 1. Initialize total variables
    let total_prin_due = 0, total_int_due = 0, total_fines_due = 0;
    let total_patref_prin_pay = 0, total_patref_int_pay = 0, total_patref_fines_pay = 0;

    const memberData = {
      ...rows[0],
      loans: [] as any[]
    };

    // 2. Map the loans and accumulate totals
    rows.forEach((row: any) => {
      if (row.loan_id) {
        memberData.loans.push({
          loan_type: row.loan_type,
          loan_id: row.loan_id,
          prin_due: row.prin_due,
          int_due: row.int_due,
          fines_due: row.fines_due,
          patref_prin_pay: row.patref_prin_pay,
          patref_int_pay: row.patref_int_pay,
          patref_fines_pay: row.patref_fines_pay,
          div_prin_pay: row.div_prin_pay,
          div_int_pay: row.div_int_pay,
          div_fines_pay: row.div_fines_pay
        });

        // Add up each column (cast to Number to be safe)
        total_prin_due += Number(row.prin_due) || 0;
        total_int_due += Number(row.int_due) || 0;
        total_fines_due += Number(row.fines_due) || 0;
        total_patref_prin_pay += Number(row.patref_prin_pay) || 0;
        total_patref_int_pay += Number(row.patref_int_pay) || 0;
        total_patref_fines_pay += Number(row.patref_fines_pay) || 0;
      }
    });

    // 3. Calculate the far-right Gross Total (sum of the 3 pay columns)
    const gross_loan_deductions = total_patref_prin_pay + total_patref_int_pay + total_patref_fines_pay;
    const currentDate = dayjs().format('MMMM D, YYYY hh:mm A');

    // 4. Attach all calculated totals to the data object going to Handlebars
    const finalData = {
      ...memberData,
      total_prin_due,
      total_int_due,
      total_fines_due,
      total_patref_prin_pay,
      total_patref_int_pay,
      total_patref_fines_pay,
      gross_loan_deductions, 
      currentDate
    };

    // 5. Generate and send PDF
    const pdfBuffer = await generatePatronagePdf(finalData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Patronage_${year}_${memberNo}.pdf`);

    return res.status(200).send(pdfBuffer);

  } catch(error) {
    logging.error(`Error in getting patronage dividend: ${error}`);
    next(error);
  }
}