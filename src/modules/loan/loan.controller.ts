import { Request , Response, NextFunction } from 'express';
import { fetchLoanApplicationsByStatus, fetchLoanDetails, fetchLoanHeader, fetchLoanTypeDetails } from './loan.service';


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
