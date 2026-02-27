import { Request, Response, NextFunction } from "express";
import { ACCESS_SECRET } from "../config/config";
import { fetchSystemConfig } from "../modules/auth/auth.service";
import jwt from "jsonwebtoken";

interface JwtPayload {
    memberNo: string;
    email?: string;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Not authorized, token missing"
            });
            return;
        }
       
        const token = authHeader.split(" ")[1];
       
        if (!ACCESS_SECRET) {
            res.status(500).json({
                success: false,
                message: "Server Configuration Error"
            });
            return;
        }

        const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload
        
        if (!decoded) {
            res.status(401).json({
                success: false,
                message: "Invalid token"
            });
            return;
        }

        req.user = {
            memberNo: decoded.memberNo,
            email: decoded.email
        }
        next();
    }
    catch (err) {
        next(err);
    }
}

export const protectCredit = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.credit) {
        res.status(401).json({
            success: false,
            message: 'Credit Login Required'
        });
        return;
    }
    next();
}

export const protectElection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!ACCESS_SECRET) {
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

    if (!decoded || !decoded.memberNo) {
       res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    const memberNo = decoded.memberNo;

    const config = await fetchSystemConfig("com_web_app", "elecom", "user");

    if (!config?.uvalue) {
     res.status(403).json({
        success: false,
        message: "Access configuration not found.",
    });
    return;
    }

    let elecomList: string[] = [];
    try {
    elecomList = JSON.parse(config.uvalue);
    } catch {
    res.status(500).json({
        success: false,
        message: "Invalid ELECOM config format. Expected JSON array.",
    });
    return;
    }

    const allowed = Array.isArray(elecomList) && elecomList.includes(memberNo);

    if (!allowed) {
      res.status(403).json({
        success: false,
        message: "Access denied. Not authorized.",
      });
      return;
    }

    req.user = {
      memberNo: decoded.memberNo,
      email: decoded.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }
};

export const protectSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!ACCESS_SECRET) {
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

    if (!decoded || !decoded.memberNo) {
       res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    const memberNo = decoded.memberNo;

    const config = await fetchSystemConfig("com_web_app", "survey", "user");

    if (!config?.uvalue) {
     res.status(403).json({
        success: false,
        message: "Access configuration not found.",
    });
    return;
    }

    let surveyList: string[] = [];
    try {
    surveyList = JSON.parse(config.uvalue);
    } catch {
    res.status(500).json({
        success: false,
        message: "Invalid ELECOM config format. Expected JSON array.",
    });
    return;
    }

    const allowed = Array.isArray(surveyList) && surveyList.includes(memberNo);

    if (!allowed) {
      res.status(403).json({
        success: false,
        message: "Access denied. Not authorized.",
      });
      return;
    }

    req.user = {
      memberNo: decoded.memberNo,
      email: decoded.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }
};