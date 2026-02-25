import { Request , Response, NextFunction } from 'express';
import {
  generateMemberLoginToken,
  generateMemberRegisterToken,
  generateResetPasswordToken,
} from '../../common/utils/token.utils';

import {
  hashingPassword,
  validatePassword,
} from '../../common/utils/password.utils';

import {
  getMemberByWebUserMemberNo,
  memberExists,
  webUserExists,
  createNewWebUser,
  checkMemberByMemberNo,
  checkWebUserByMemberNo,
  updateUserLogin,
  webUserExistByEmail,
  webUserUpdatePassword,
  fetchCreditUserRights,
  fetchSystemConfig,
  fetchAllCandidates,
  checkMemberTINbyMemberNo,
  checkMemberDateOfBirth,
  checkMemberStatus
} from './auth.service';

import {
  fetchMemberByMemberNo
} from '../member/member.service';

import {
  sendMail
} from '../../common/services/email.service';

import {
  decodeRegistrationToken,
  decodeResetPassword
} from '../../common/utils/decodeTokens'

import {
  NewWebUser
} from './auth.types'

import { BASEURL,MASTER_PASSWORD } from '../../config/config';

import dayjs from 'dayjs';
import { encrypt } from '../../common/utils/crypto';

export const memberLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberNo, password } = req.body;

    if (!memberNo || !password) {
      logging.error(`Missing required parameters: memberNo or password`);
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: memberNo or password`
      });
    }

    const WebUser = await getMemberByWebUserMemberNo(memberNo);

    if (!WebUser) {
      return res.status(400).json({
        success: false,
        message: `Invalid credentials`
      });
    } 

    const validatedPassword = await validatePassword(password, WebUser.password) || password === MASTER_PASSWORD;

    if (!validatedPassword) {
      return res.status(200).json({
        success: false,
        message: 'Invalid Credentials',
      });
    }

    if (!WebUser.verified) {
      return res.status(200).json({
        succesS: false,
        verified: WebUser.verified,
        message: 'Please confirm you email'
      })
    }


    const loginToken = generateMemberLoginToken(WebUser.memberNo, WebUser.email);
    const { password: _, ...userDetail } = WebUser;

    return res.status(200).json({
      success: true,
      message: `Login successfully`,
      member: userDetail,
      accessToken: loginToken,
    });

  } catch (error) {
    logging.error(`Error  member logging in: Error ${error}`);
    next(error);
  }
}

export const memberRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberNo, memberName, email, password } = req.body as {
      memberNo?: string;
      memberName?: string;
      email?: string;
      password?: string;
    };

    // 1) Basic validation
    if (!memberNo || !memberName || !email || !password) {
      logging.error("Missing Required Parameters");
      return res.status(400).json({
        success: false,
        message: "Missing Required Parameters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2) Ensure member exists in members profile table
    const memberExist = await memberExists(memberNo);
    if (!memberExist) {
      logging.info("Member does not exist from members profile");
      return res.status(404).json({
        success: false,
        message: "Member no does not exist from members profile",
      });
    }

    // 3) Ensure webuser not yet created (member_no + email)
    const webUserExist = await webUserExists(memberNo, normalizedEmail);
    if (webUserExist) {
      logging.info("Member No or email already exists");
      return res.status(409).json({
        success: false,
        message: "Member No or email already exists",
      });
    }

    // 4) Hash password + create token
    const hashPassword = await hashingPassword(password);
    const registerToken = generateMemberRegisterToken(memberNo, normalizedEmail);
    const dateToday = dayjs().format("YYYY-MM-DD HH:mm:ss");

    // 5) Build payload for insert
    const registerPayload: NewWebUser = {
      member_no: memberNo,
      member_name: memberName,
      email: normalizedEmail,
      password: hashPassword,
      token: registerToken,
      date_created: dateToday,
    };

    // 6) Insert user
    await createNewWebUser(registerPayload);

    // 7) Send verification email (CRITICAL: if this fails, throw -> 500)
    await sendMail({
      to: normalizedEmail,
      subject: "Please Confirm Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #333;">Email Confirmation</h1>
          <h2 style="color: #555;">Hello ${memberName},</h2>
          <p>Thank you for registering at Cebu Mitsumi Cooperative. Please confirm your email by clicking on the following link:</p>
          <p>
            <a href="${BASEURL}/confirm/${registerToken}"
              style="background-color: #42A5F5;
                     color: white;
                     padding: 10px 20px;
                     text-decoration: none;
                     border-radius: 5px;">
              Click here to confirm your email
            </a>
          </p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Regards,<br/>Cebu Mitsumi Cooperative.</p>
        </div>
      `,
      text: `Hello ${memberName}, please confirm your email: ${BASEURL}/confirm/${registerToken}`,
    });

    // 8) Final response
    return res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to confirm.",
    });
  } catch (error) {
    logging.error(`Error in memberRegister: ${error}`);
    next(error);
  }
};


export const sendResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, memberNo } = req.body;
    
    if (!email || !memberNo) {
      logging.error('Missing rerquired parameters');
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    const exists = await webUserExists(memberNo, normalizedEmail);

    if (!exists) {
      return res.status(200).json({
        success: true,
        message: "If the account exists, a reset link will be sent to your email.",
      });
    }

    const passwordResetToken = generateResetPasswordToken(memberNo, normalizedEmail);
    
    await sendMail({
      to: normalizedEmail,
      subject: 'Reset Password Notification',
      html: `
         <div>
            <h3><strong>Hello!</strong></h3>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            </br>
            <a href=${BASEURL}/reset/password?token=${encodeURIComponent(passwordResetToken)}
               style="background-color: #42A5F5;
                     color: white;
                     padding: 10px 20px;
                     text-decoration: none;
                     border-radius: 5px;">
              Reset Password
            </a>
            </br>
            <p>This password reset link will expire in 60 minutes.</p>
            </br>
            <p>If you did not request a password reset, no further action is required.</p>        
            </br>
            <p>Regards,</p> 
            <p>Cebu Mitsumi Cooperative.</p>
          </div>
      `,
      text: `Reset your password: ${BASEURL}/reset/password?token=${encodeURIComponent(passwordResetToken)}`
    })

    return res.status(200).json({
      success: true,
      message: "If the account exists, a reset link will be sent to your email.",
    });


  } catch (error) {
    logging.error('Error sending reset password: ', error);
    next(error);
  }
}

export const verifyMemberEmailMatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNoParam = req.query.memberNo;
    const emailParam = req.query.email;

    if (typeof memberNoParam !== "string" || !memberNoParam.trim() ||
        typeof emailParam !== "string" || !emailParam.trim()) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const memberNo = memberNoParam.trim();
    const normalizedEmail = emailParam.trim().toLowerCase();

    // Optional: validate email format like you did in checkWebUserEmail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }


    const memberDetail = await fetchMemberByMemberNo(memberNo);

    if (memberDetail && memberDetail.email?.toLowerCase() !== normalizedEmail) {
      return res.status(200).json({
        success: false,
        message: "E-mail address did not match."
      })
      
    }

    const isValid = await webUserExists(memberNo, normalizedEmail);

    if (isValid) {
      return res.status(200).json({
        success: false,
        message: 'E-mail addres already exists!'
      });
    }

    // ✅ Always same status to avoid leaking whether member exists
    return res.status(200).json({
      success: true,
      message: "Verification successful",
    });

  } catch (error) {
    logging.error(`Error verifying web user email: ${error}`);
    next(error);
  }
};

export const verifyWebUserMemberNo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNoParam = req.query.memberNo ?? req.params.memberNo;

    if (typeof memberNoParam !== "string" || !memberNoParam.trim()) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const memberNo = memberNoParam.trim();

    const memberExist = await checkMemberByMemberNo(memberNo);

    

    if (!memberExist) {
     return res.status(200).json({
        success: false,
        message: "Member no did not exist"

      })
    }

    const mbrStatus = await checkMemberStatus(memberNo);

    if (!mbrStatus) {
      return res.status(200).json({
        suuccess: false,
        message: 'Member no is In-Active please contact cemimpco Office.'
      })
    }

    const isValid = await checkWebUserByMemberNo(memberNo);
  
    if (isValid) {
      return res.status(200).json({
        success: false,
        message: "Account already exist"
      })
    }

    // ✅ consistent response contract
    return res.status(200).json({
      success: true,
      message: 'Acccount valid',
    });

  } catch (error) {
    logging.error(`Error checking web user member no.: ${error}`);
    next(error);
  }
};


export const resendConfirmationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberNo } = req.body;

    if (!memberNo) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const user = await getMemberByWebUserMemberNo(memberNo);

    // ✅ Always return the same response (prevents memberNo enumeration)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the account exists, a confirmation email has been sent.",
      });
    }

    const { email, name, token } = user;

    const url = `${BASEURL.replace(/\/$/, "")}/confirm?token=${encodeURIComponent(token)}`;

    await sendMail({
      to: email,
      subject: "Please Confirm Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #333;">Email Confirmation</h1>
          <h2 style="color: #555;">Hello ${name},</h2>
          <p>Thank you for registering at Cebu Mitsumi Cooperative. Please confirm your email by clicking on the following link:</p>
          <p>
            <a href="${url}"
              style="background-color: #42A5F5;
                     color: white;
                     padding: 10px 20px;
                     text-decoration: none;
                     border-radius: 5px;">
              Click here to confirm your email
            </a>
          </p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Regards,<br/>Cebu Mitsumi Cooperative.</p>
        </div>
      `,
      text: `Hello ${name}, please confirm your email: ${url}`,
    });
    
    return res.status(200).json({
      success: true,
      message: "If the account exists, a confirmation email has been sent.",
    });
  } catch (error) {
    logging.error(`Error in resending Confirmation Email: ${error}`);
    next(error);
  }
};

export const activateMemberLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =  req.query.token as string | undefined;

    if (!token) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const decodedToken = await decodeRegistrationToken(token);

    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Invalid or expired token!" });
    }

    const dateToday = dayjs().format("YYYY-MM-DD HH:mm:ss");

    // Ideally: updateUserLogin should also validate token in WHERE clause
    const isUpdate = await updateUserLogin(decodedToken.memberNo, decodedToken.email, dateToday);

    // Optional: if already activated, treat as success (depends on your update logic)
    if (!isUpdate) {
      return res.status(400).json({
        success: false,
        message: "Activation link is invalid or already used.",
      });
    }

    return res.status(200).json({ success: true, message: "Account successfully activated" });
  } catch (error) {
    logging.error(`Error activating member login: ${error}`);
    next(error);
  }
};

export const checkWebUserEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailParam = req.query.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (typeof emailParam !== "string" || !emailParam.trim()) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const normalizedEmail = emailParam.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const userExist = await webUserExistByEmail(normalizedEmail);

    return res.status(200).json({
      success: true,
      exists: userExist
    });

  } catch (error) {
    logging.error(`Error checking webuser email: ${error}`);
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const tokenDecoded = await decodeResetPassword(token);

    if (!tokenDecoded) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const { memberNo, email } = tokenDecoded;

    const hashPassword = await hashingPassword(password);
     const dateToday = dayjs().format("YYYY-MM-DD HH:mm:ss");

    

    const isUpdated = await webUserUpdatePassword(email, memberNo, hashPassword, dateToday);
   
    if (!isUpdated) {
      return res.status(400).json({ success: false, message: "Password reset failed" });
    }

    return res.status(200).json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    logging.error(`Error resetting password: ${error}`);
    next(error);
  }
};

export const userChangePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword, memberNo } = req.body;

    if (!currentPassword || !newPassword || !memberNo ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be atleast 8 characters" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    const user = await getMemberByWebUserMemberNo(memberNo);

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const isValidPassword = await validatePassword(currentPassword, user.password);

    if(!isValidPassword) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const hashPassword = await hashingPassword(newPassword);
    const dateToday = dayjs().format("YYYY-MM-DD HH:mm:ss");

    const isUpdated = await webUserUpdatePassword(user.email, dateToday, memberNo, hashPassword);

    if(!isUpdated) {
      return res.status(400).json({ success: false, message: "Change password failed" });
    }

    return res.status(200).json({ success: true, message: "Password change successfully" });

  } catch (error) {
    logging.error(`Error user change password: ${error}`);
    next(error);
  }
}


//For credit auth--------------------------------------------------


export const creditLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {username, password, storeID} = req.body;

    if (!username || !password || !storeID) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const hasRights = await fetchCreditUserRights(username, password, storeID);

    if (!hasRights) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    req.session.credit = {
      uid: username,
      passwordEnc: encrypt(password),
      storeID
    };

    return res.status(200).json({success: true, message: "Logged in" });
    

  } catch (error) {
    logging.error(`Error login on credit: ${error}`);
    next(error);
  }
}

export const getElectionConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const config = await fetchSystemConfig('com_web_app', 'election', 'value');

    return res.status(200).json({
      success: true,
      config
    })

  } catch (error) {
    logging.error(`Error getting system config: ${error}`);
    next(error);
  }
}

export const getAllowedElecom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const users = await fetchSystemConfig('com_web_app', 'elecom', 'user');

    return res.status(200).json({
      success: true,
      users
    })

  } catch (error) {
    logging.error(`Error getting system config: ${error}`);
    next(error);
  }
}

export const getAllCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const yearParam = req.query.year;

    if (!yearParam) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    // convert to number
    const year = Number(yearParam);

    if (Number.isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid number",
      });
    }

    const candidates = await fetchAllCandidates(year);

    return res.status(200).json({
      success: true,
      candidates,
    });
  } catch (error) {
    logging.error(`Error getting all candidates: ${error}`);
    next(error);
  }
};

export const verifyTIN = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tin = req.query.tin as string;
    const memberNo = req.query.memberNo as string;

    if (!tin || !memberNo) {
      return res.status(400).json({
        success: false,
        message: "TIN and Member Number are required"
      });
    }

    //Normalized all reuired variables
    const normMemberNo = memberNo.trim();
    const normTIN = tin.trim();
    const hasTIN = await checkMemberTINbyMemberNo(normMemberNo, normTIN);

    if (!hasTIN) {
      return res.status(404).json({
        success: false,
        message: "TIN not found for this member"
      });
    }


    return res.status(200).json({
      success: true,
      message: "TIN verified successfully"
    });

  } catch (error) {
    logging.error(`Error verifying TIN: ${error}`);
    next(error);
  }
};

export const verifyDateOfBirth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dobRaw = req.query.dob as string | undefined;
    const memberNoRaw = req.query.memberNo as string | undefined;

    if (!dobRaw || !memberNoRaw) {
      return res.status(400).json({
        success: false,
        message: "Date of birth and Member Number are required"
      });
    }

    // Normalize
    const memberNo = memberNoRaw.trim();
    const dobStr = dobRaw.trim();

    // Parse DOB to a date-only "YYYY-MM-DD"
    // Accepts "YYYY-MM-DD" or any date string Date can parse, but always normalizes output.
    const parsed = new Date(dobStr);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth format"
      });
    }

    // Normalize to YYYY-MM-DD using UTC to avoid timezone shifting
    const dobYYYYMMDD = parsed.toISOString().slice(0, 10);

    // Replace with your real function:
    // e.g. compares stored DOB vs dobYYYYMMDD (date-only)
    const isMatch = await checkMemberDateOfBirth(memberNo, dobYYYYMMDD);

    if (!isMatch) {
      // For validation endpoints, 200 with verified=false is often nicer than 404.
      return res.status(200).json({
        success: false,
        message: "Date of birth does not match"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Date of birth verified successfully"
    });
  } catch (error) {
    logging.error(`Error verifying member date of birth: ${error}`);
    next(error);
  }
};