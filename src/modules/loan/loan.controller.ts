import { Request , Response, NextFunction } from 'express';
import { 
  fetchLoanApplicationByType, 
  fetchLoanApplicationsByStatus, 
  fetchLoanDetails, 
  fetchLoanHeader, 
  fetchLoanTypeDetails, 
  fetchMemberMobileNo, 
  fetchSharecapital, 
  saveLoanWithAttachment,
  fetchmemberDetails,
  memberDelinquencyHistory
} from './loan.service';
import { checkExpiredOtp, processOtp, verifyOtp } from '../../common/services/otp.services';
import { EXT_CONTENT_TYPE } from './loan.constants';
import path from 'path';
import fs from 'fs';

export const getLoanProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const loanId = req.query.loanId;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }

    if (typeof loanId !== "string" || loanId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const loan = loanId.trim();

    const [details, header] = await Promise.all([
      fetchLoanDetails(loan),
      fetchLoanHeader(memberNo, loan),
    ]);

    // treat missing header as "not found"
    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Deposit profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      header,
      details,
    });
  } catch (error) {
    logging.error(`Error getting loan profile: ${error}`);
    next(error);
  }
}

export const getLoanApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const statusParam = req.query.status;
    const allowedStatuses = new Set(["P", "A", "D", "R", "C"]);

     if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }

    if (typeof statusParam !== "string" || statusParam.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const status = statusParam.trim();

    if (!allowedStatuses.has(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const loans = await fetchLoanApplicationsByStatus(memberNo, status);

    return res.status(200).json({
      success: true,
      loans
    })

  } catch (error) {
    logging.error(`Error getting Loan application: ${error}`);
    next(error);
  }
}


export const getLoanTypeDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }

    const loanTypes = await fetchLoanTypeDetails();

    return res.status(200).json({
      success: true,
      loanTypes,
    });
  } catch (error) {
    logging.error(`Error getting loan type details: ${error}`);
    return next(error);
  }
};


export const getMemberMobileNo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo; 
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    const mobileNo = await fetchMemberMobileNo(memberNo);

    if (!mobileNo) {  
      return res.status(404).json({
        success: false,
        message: "Mobile number not found",
      });
    }
    return res.status(200).json({
      success: true,
      mobileNo
    }); 
  } catch (error) {
    logging.error(`Error getting member mobile number: ${error}`);
    return next(error);
  }
};

export const getLoanApplicationType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    const statusParam = req.query.type;
    if (typeof statusParam !== "string" || statusParam.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const application = await fetchLoanApplicationByType(statusParam.trim());

    return res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    logging.error(`Error getting loan application type: ${error}`);
    return next(error);
  }
};

export const getShareCapital = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;  
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    // Implement logic to fetch share capital information for the member
    const shareCapital = await fetchSharecapital(memberNo);
    if (shareCapital === null) {
      return res.status(404).json({
        success: false,
        message: "Share capital information not found",
      });
    } 
    return res.status(200).json({
      success: true,
      loanLimit: shareCapital
    });
  }
    catch (error) {
    logging.error(`Error getting share capital information: ${error}`);
    return next(error);
  }
};

export const sendOTPMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    const number = req.body.number; 
    if (typeof number !== "string" || number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
    const result = await processOtp(memberNo, number.trim());
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to process OTP",
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logging.error(`Error sending OTP message: ${error}`);
    return next(error);
  }
};

export const submitLoanApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const email = req.user?.email;
    if (!memberNo || !email) {
      return res.status(401).json({ success: false, message: 'Unauthorized!' });
    }

   let payload
    try {
      payload = JSON.parse(req.body.data)
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid payload' })
    }

    

    const { loan, finance, personal } =payload;


    if (!loan || !finance || !personal) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const files = (req.files as Express.Multer.File[]) ?? [];

    const result = await saveLoanWithAttachment(
      email,
      memberNo,
      loan,
      finance,
      personal,
      files
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    logging.error(`Error submitting loan application: ${error}`);
    return next(error);
  }
};

export const verifyOTPMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: 'Unauthorized!' });
    }

    const { number, otp } = req.body;

    if (typeof number !== 'string' || number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (typeof otp !== 'string' || otp.trim() === '') {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const result = await verifyOtp(memberNo, number.trim(), otp.trim());

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    logging.error(`Error verifying OTP: ${error}`);
    return next(error);
  }
};

export const checkExpiredOTPMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;  
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    const number = req.body.number; 
    if (typeof number !== "string" || number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
    const result = await checkExpiredOtp(memberNo, number.trim());
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to check OTP",
      });
    } 
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logging.error(`Error checking expired OTP message: ${error}`);
    return next(error);
  } 
};


export const getMemberIDPicture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: 'Unauthorized!' });
    }

    const UPLOAD_DIR = path.join(process.cwd(), "uploads", "loans");

    
    const found = Object.keys(EXT_CONTENT_TYPE)
    .map((ext) => path.join(UPLOAD_DIR, `${memberNo}-ID${ext}`))
    .find((p) => fs.existsSync(p));

    if (!found) {
      return res.status(404).json({ success: false, message: 'ID picture not found' });
    }

    res.type(EXT_CONTENT_TYPE[path.extname(found)]);
    fs.createReadStream(found).pipe(res);
  } catch (error) {
    logging.error(`Error fetching member ID picture: ${error}`);
    return next(error);
  }
};

export const getMemberProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: 'Unauthorized!' });
    }
    const profile = await fetchmemberDetails(memberNo);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }
    
    const delinquencyHistory = await memberDelinquencyHistory(memberNo);
    
    return res.status(200).json({ success: true, profile, delinquencyHistory });
  } catch (error) {
    logging.error(`Error fetching member profile: ${error}`);
    return next(error);
  }
};