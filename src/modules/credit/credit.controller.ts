import { Request , Response, NextFunction } from 'express';
import { createOTPlogs, fetchMemberCreditHistory, fetchMembers, fetchMembersByMemberNo, fetchOTPLogs, fetchOTPlogsExpired, fetchStores, generateCreditReferenceNo, newCreditAvailed, removeOTPLogsByMemberNo, removeOTPLogsByOTP, upadateMemberCreditAvailed } from './credit.service';
import { decrypt } from '../../common/utils/crypto';
import { sendOTPMessage } from '../../common/services/semaphore';
import dayjs from 'dayjs';

export const getStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;

    if (!username || !passwordEnc) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const password = decrypt(passwordEnc);

    const stores = await fetchStores({username, password}); // ✅ use decrypted password

    res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    logging.error(`Error getting stores: ${error}`);
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;

    if (!username || !passwordEnc) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const password = decrypt(passwordEnc);

    const members = await fetchMembers({username, password});

    return res.status(200).json({
      success: true,
      data: members
    })

  } catch (error) {
    logging.error(`Error in getting members: ${error}`);
    next(error);
  }
}


export const getMemberByMemberNo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    const memberParam = req.query.memberNo;

    if (!username || !passwordEnc) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (typeof memberParam != "string" || memberParam.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const password = decrypt(passwordEnc);

    const memberNo = memberParam.trim();

    const member = await fetchMembersByMemberNo({username, password, memberNo});

     return res.status(200).json({
      success: true,
      data: member
     });

  } catch (error) {
    logging.error(`Error getting member by member no: ${error}`);
    next(error);
  }
}


export const sendOTPSMS = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    

    if (!username || !passwordEnc) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

       const { memberNo, phoneNo } = req.body as { memberNo?: string; phoneNo?: string };

    if (!memberNo || !phoneNo) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const password = decrypt(passwordEnc);

    const member = await fetchMembersByMemberNo({username, password, memberNo});

    if (!member || member.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Member not found"
      });
    }

    const isPhoneNo = member[0].sms_cpno === phoneNo;

    if (!isPhoneNo) {
      return res.status(400).json({
        success: false,
        message: "Mobile number did not match"
      });
    }

    const sendOTP = await sendOTPMessage(phoneNo);
    
    if (!sendOTP?.data?.[0]?.code) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed Sending OTP please try again later",
        debug: sendOTP 
      });
    }

    const otpCode = sendOTP.data[0].code;

    await removeOTPLogsByMemberNo({username, password, memberNo, phoneNo});

    await createOTPlogs({username, password , memberNo, phoneNo, otp: otpCode});

    return  res.status(200).json({
      success: true,
      data: sendOTP
    });
  } catch (error) {
    logging.error(`Error sending OTP: ${error}`);
    next(error);
  }
}

export const checkExpiredOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    const memberNoParam  = req.query.memberNo;
    const phoneNoParam = req.query.phoneNo;
    

    if (!username || !passwordEnc) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (typeof memberNoParam != "string" || memberNoParam.trim() === ""
      || typeof phoneNoParam != "string" || phoneNoParam.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const memberNo = memberNoParam.trim();
    const phoneNo = phoneNoParam.trim();

    const password = decrypt(passwordEnc);

    const secondsLeft  = await fetchOTPlogsExpired({username, password, memberNo, phoneNo});
    if (secondsLeft <= 0 ) {
      return res.status(200).json({
        success: false,
        message: "OTP Expired!",
      });
    }

    return res.status(200).json({
      success: true,                 // request succeeded
      isValid: secondsLeft > 0,       // otp status
      secondsLeft: Math.max(0, secondsLeft),
      message: secondsLeft > 0 ? "OTP valid" : "OTP expired",
    });

  } catch (error) {
    logging.error(`Error in checking expired OTP: ${error}`);
    next(error);
  }
}

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    const { memberNo, phoneNo, otp, storeID, amount } = req.body;

    if (!username || !passwordEnc) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      typeof memberNo !== "string" || memberNo.trim() === "" ||
      typeof phoneNo !== "string" || phoneNo.trim() === "" ||
      typeof otp !== "string" || otp.trim() === "" ||
      typeof storeID !== "string" || storeID.trim() === ""
    ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const amountNum = typeof amount === "string" ? Number(amount) : amount;
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const password = decrypt(passwordEnc);

    const otpLogs = await fetchOTPLogs({
      username,
      password,
      memberNo: memberNo.trim(),
      phoneNo: phoneNo.trim(),
      otp: otp.trim(),
    });

    if (!otpLogs || otpLogs.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid OTP number" });
    }

    // Expiration check
    const secondsLeft = dayjs(otpLogs[0].expiration_date).diff(dayjs(), "second");
    if (secondsLeft <= 0) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const referenceNo = await generateCreditReferenceNo({
      username,
      password,
      storeID: storeID.trim(),
    });

    await removeOTPLogsByOTP({
      username,
      password,
      memberNo: memberNo.trim(),
      phoneNo: phoneNo.trim(),
      otp: otp.trim(),
    });

    await newCreditAvailed(
      { username, password },
      { memberNo: memberNo.trim(), referenceNo, amount: amountNum, storeID: storeID.trim() }
    );

    await upadateMemberCreditAvailed(
      { username, password, memberNo: memberNo.trim() },
      amountNum
    );

    return res.status(200).json({
      success: true,
      message: "OTP successfully verified",
      referenceNo,
    });
  } catch (error) {
    logging.error(`Error verifying OTP: ${error}`);
    next(error);
  }
};


export const newStoreCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    const { memberNo, storeID, amount } = req.body;

    if (!username || !passwordEnc) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      typeof memberNo !== "string" || memberNo.trim() === "" ||
      typeof storeID !== "string" || storeID.trim() === ""
    ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const amountNum = typeof amount === "string" ? Number(amount) : amount;
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const password = decrypt(passwordEnc);

    const member = await fetchMembersByMemberNo({ username, password, memberNo: memberNo.trim() });
    if (!member || member.length === 0) {
      return res.status(400).json({ success: false, message: "Member not found!" });
    }

    const currentAvailed = Number(member[0].credit_availed ?? 0);
    const totalAvailed = Math.round((currentAvailed + amountNum) * 100) / 100;

    const referenceNo = await generateCreditReferenceNo({ username, password, storeID: storeID.trim() });

    await newCreditAvailed(
      { username, password },
      { memberNo: memberNo.trim(), amount: amountNum, referenceNo, storeID: storeID.trim() }
    );

    await upadateMemberCreditAvailed({ username, password, memberNo: memberNo.trim() }, totalAvailed);

    return res.status(200).json({
      success: true,
      message: "Store credit successfully saved!",
      referenceNo,
      totalAvailed,
    });
  } catch (error) {
    logging.error(`Error getting store credit: ${error}`);
    next(error);
  }
};


export const getMemberCreditHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.session.credit?.uid;
    const passwordEnc = req.session.credit?.passwordEnc;
    const { memberNo } = req.query;

    if (!username || !passwordEnc) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (typeof memberNo !== "string" || memberNo.trim() === "" ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const password = decrypt(passwordEnc);

    const member = await fetchMemberCreditHistory({username, password, memberNo});

    return res.status(200).json({
      success: true,
      data: member
    });

  } catch (error) {
    logging.error(`Error getting member credit history: ${error}`);
    next(error);
  }
}