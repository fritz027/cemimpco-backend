import { Request , Response, NextFunction } from 'express';
import { 
  computeMembershipAge, 
  fetchMemberByMemberNo, 
  fetchMemberDeposits, 
  fetchMemberLoans, 
  fetchMemberTimeDeposits,
  fetchMemberCreditHistory,
  fetchRegularActiveMember 
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
import path from "path";


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