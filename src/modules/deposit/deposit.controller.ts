import { Request , Response, NextFunction } from 'express';
import { fetchDepositDetails, fetchDepositHeader } from './deposit.service';


export const getDepositProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const depositType = req.query.code;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }

    if (typeof depositType !== "string" || depositType.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const dep = depositType.trim();

    const [detail, header] = await Promise.all([
      fetchDepositDetails(memberNo, dep),
      fetchDepositHeader(memberNo, dep),
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
      detail,
    });
  } catch (error) {
    logging.error(`Error getting deposit detail: ${error}`);
    return next(error);
  }
};
