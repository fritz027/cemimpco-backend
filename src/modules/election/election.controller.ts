import e, { Request , Response, NextFunction, response } from 'express';
import { APP_NAME,BASEURL,SECTION_NAME, SERVER_HOSTNAME, SERVER_PORT,SERVERURL } from '../../config/config';
import { 
  updateElecomList, 
  updateElectionSetting, 
  newPosition, 
  fetchPositions, 
  updatePosition, 
  deletePosition, 
  fetchAllCandidates, 
  newCandidate, 
  updateCandidate,
  deleteCandidate,
  getCandidateByIdAndYear,
  submitVote,
  checkMemberHasVoted,
  fetchBallot,
  fetchVoteCasted,
  getTotalRegisteredVoters,
  getTotalCastedVotes,
  getTotalPosition,
  getTotalCandidates,
  getElectionResutls,


} from './election.service';
import { fetchSystemConfig,   fetchMembersByList, updateSystemConfig } from '../auth/auth.service';
import { getMemberByMemberNo } from '../credit/credit.controller';
import { fetchMemberByMemberNo } from '../member/member.service';
import fs from "node:fs";
import path from "node:path";
import { error } from 'node:console';




export const patchElectionSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, from, to, start } = req.body.election;
     const memberNo = req.user?.memberNo;

    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

     if (
      year === undefined ||
      from === undefined ||
      to === undefined ||
      start === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Optional: basic type checks (recommended)
    if (typeof year !== "number") {
      return res.status(400).json({ success: false, message: "year must be a number" });
    }
    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ success: false, message: "from/to must be strings" });
    }
    if (typeof start !== "boolean") {
      return res.status(400).json({ success: false, message: "start must be boolean" });
    }

     const updated =  await updateElectionSetting({year, from, to, start}, 'com_web_app', 'election', 'value');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Election setting not found (no rows updated)",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Election setting updated"
    });


  } catch (error) {
    logging.error(`Error getting election settings: ${error}`);
    next(error);
  }
}


export const createNewPosition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const election = req.body?.position;
    if (!election || typeof election !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const { position_id, position_desc, position } = election;

    if (
      position_id === undefined ||
      position_desc === undefined ||
      position === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // ✅ normalize types
    const codeStr = String(position_id).trim();
    const positionDesc = String(position_desc).trim();
    const seatCount = Number(position);

    if (!codeStr || !positionDesc || !Number.isFinite(seatCount) || seatCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid values",
      });
    }

    const isCreated = await newPosition({
      position_id: codeStr,
      position_desc: positionDesc,
      position: seatCount,
    });

    if (!isCreated) {
      // if your newPosition returns false on duplicate, use 409 Conflict
      return res.status(409).json({
        success: false,
        message: "Position already exists or failed to create.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Position successfully created.",
    });
  } catch (error) {
    logging.error(`Error creating new position: ${error}`);
    next(error);
  }
};


export const getAllPosition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const positions = await fetchPositions();

    return res.status(200).json({
      success: true,
      message: positions.length ? "Positions found" : "No positions found",
      positions: Array.isArray(positions) ? positions : [],
    });
  } catch (error) {
    logging.error(`Error getting all position: ${error}`);
    next(error);
  }
};


export const setElecomList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = req.body?.elecom;
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Must be an array
    if (!Array.isArray(list)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. elecom must be an array of member numbers.",
      });
    }

    // ✅ Clean the list: strings only, trimmed, remove empty, unique
    const cleaned = Array.from(
      new Set(
        list
          .filter((x: unknown): x is string => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
      )
    );

    if (cleaned.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. elecom list is empty.",
      });
    }

    const isUpdated = await updateElecomList(cleaned);

    if (!isUpdated) {
      return res.status(500).json({
        success: false,
        message: "Failed to save elecom list.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Elecom successfully updated.",
      elecom: cleaned, // optional: return what was saved
    });
  } catch (error) {
    logging.error(`Error setting elecom list: ${error}`);
    next(error);
  }
};


export const getElecomList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await fetchSystemConfig("com_web_app", "elecom", "user");

    // If result is an array of rows, pick first row
    const row = Array.isArray(result) ? result[0] : result;

    if (!row?.uvalue) {
      return res.status(200).json({
        success: true,
        elecomList: [],
      });
    }

    const list = JSON.parse(row.uvalue); // expected: ["20220124", "09042652"] or [{memberNo: "..."}]

    const elecomList = await Promise.all(
      list.map(async (item: any) => {
        // adjust this depending on your stored JSON structure:
        const memberNoToFind = typeof item === "string" ? item : item.memberNo;

        const member = await fetchMemberByMemberNo(memberNoToFind);

        return {
          memberNo: member?.member_no ?? memberNoToFind,
          memberName: member?.member_name ?? null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      elecomList,
    });
  } catch (error) {
    logging.error(`Error getting elecom listing: ${error}`);
    next(error);
  }
};

export const patchPosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const election = req.body?.position;
    if (!election || typeof election !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const { position_id, position_desc, position } = election;

    if (
      position_id === undefined ||
      position_desc === undefined ||
      position === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // ✅ normalize types
    const codeStr = String(position_id).trim();
    const positionDesc = String(position_desc).trim();
    const seatCount = Number(position);

    if (!codeStr || !positionDesc || !Number.isFinite(seatCount) || seatCount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid values",
      });
    }

    const isUpdated = await updatePosition({
      position_id: codeStr,
      position_desc: positionDesc,
      position: seatCount
    });

    if (!isUpdated) {
      return res.status(404).json({
        success: false,
        message: "Position not found or failed to update.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Position successfully updated.",
    });

  } catch (error) {
    logging.error(`Error patching position: ${error}`);
    next(error);
  }
}

export const removePosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const position = req.query.id;

    if (!position || position === undefined || typeof position !== "string" ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const isDeleted = await deletePosition(position.trim());

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Position successfully deleted.",
    });

  } catch (error) {
    logging.error(`Error in removing position: ${error}`);
    next(error);
  }
}

export const getAllCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ year comes from query as string | string[] | undefined
    const yearRaw = req.query?.year;

    if (!yearRaw) {
      return res.status(400).json({
        success: false,
        message: "Year parameter is required",
      });
    }

    const year = Number(yearRaw);

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
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

export const createCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ candidate arrives as string when using multipart/form-data
    let candidate: any;
    try {
      const raw = req.body?.candidate;
      candidate = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid candidate JSON" });
    }

    if (!candidate || typeof candidate !== "object") {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const { candidate_id, elect_year, position_id, member_no, elec_order, vision } = candidate;

    if (
      candidate_id == null ||
      elect_year == null ||
      position_id == null ||
      member_no == null ||
      elec_order == null ||
      vision == null
    ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const id = String(candidate_id).trim();
    const pid = String(position_id).trim();
    const mno = String(member_no).trim();
    const v = String(vision).trim();

    const year = Number(elect_year);
    const eorder = Number(elec_order);

    logging.warn(candidate)

    if (!id || !pid || !mno || !v) {
      return res.status(400).json({ success: false, message: "Invalid values" });
    }
    if (!Number.isFinite(year)) {
      return res.status(400).json({ success: false, message: "Invalid elect_year" });
    }
    if (!Number.isFinite(eorder) || eorder <= 0) {
      return res.status(400).json({ success: false, message: "Invalid elec_order" });
    }

    // ✅ multer puts the uploaded file here
    const photoUrl = req.file
      ? `${SERVERURL}/uploads/candidates/${req.file.filename}`
      : null;

      logging.warn(photoUrl)

    const isCreated = await newCandidate({
      candidate_id: id,
      elect_year: year,
      position_id: pid,
      member_no: mno,
      elec_order: eorder,
      vision: v,
      photo_url: photoUrl, // ✅ add this column in DB + insert query
    });

    if (!isCreated) {
      return res.status(409).json({
        success: false,
        message: "Candidate already exists or failed to create.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Candidate successfully created.",
      photoUrl, // ✅ return so frontend can show immediately if you want
    });
  } catch (error) {
    logging.error(`Error creating candidate: ${error}`);
    next(error);
  }
};

export const patchCandidate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ candidate arrives as string when using multipart/form-data (same as create)
    let candidate: any;
    try {
      const raw = req.body?.candidate;
      candidate = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid candidate JSON" });
    }

    if (!candidate || typeof candidate !== "object") {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const { candidate_id, elect_year, position_id, member_no, elec_order, vision } = candidate;

    if (
      candidate_id == null ||
      elect_year == null ||
      position_id == null ||
      member_no == null ||
      elec_order == null ||
      vision == null
    ) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // normalize
    const id = String(candidate_id).trim();
    const pid = String(position_id).trim();
    const mno = String(member_no).trim();
    const v = String(vision).trim();
    const year = Number(elect_year);
    const eorder = Number(elec_order);

    if (!id || !pid || !mno || !v) {
      return res.status(400).json({ success: false, message: "Invalid values" });
    }
    if (!Number.isFinite(year)) {
      return res.status(400).json({ success: false, message: "Invalid elect_year" });
    }
    if (!Number.isFinite(eorder) || eorder <= 0) {
      return res.status(400).json({ success: false, message: "Invalid elec_order" });
    }

    // ✅ Get current candidate from DB so we can delete old photo if needed
    // You need a function like this:
    // const existing = await getCandidateByIdAndYear(id, year);
    const existing = await getCandidateByIdAndYear(id, year);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Candidate not found." });
    }

    // ✅ If new file uploaded, build new URL. Otherwise keep old.
    const newPhotoUrl = req.file
      ? `${SERVERURL}/uploads/candidates/${req.file.filename}`
      : (existing.photo_url ?? null);

    // ✅ If uploaded a new file and old exists => delete old file
    if (req.file && existing.photo_url) {
      try {
        // existing.photo_url example: http://host:port/uploads/candidates/abc.jpg
        const filename = String(existing.photo_url).split("/uploads/candidates/")[1];
        if (filename) {
          const oldPath = path.join(process.cwd(), "uploads", "candidates", filename);

          // delete only if file exists
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      } catch (err) {
        // Don't fail the request if deletion fails; just log
        logging.warn(`Failed to delete old candidate photo: ${err}`);
      }
    }

    const isUpdated = await updateCandidate({
      candidate_id: id,
      elect_year: year,
      position_id: pid,
      member_no: mno,
      elec_order: eorder,
      vision: v,
      photo_url: newPhotoUrl, // ✅ update with new or keep old
    });

    if (!isUpdated) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found or failed to update.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate successfully updated.",
      photoUrl: newPhotoUrl,
    });
  } catch (error) {
    logging.error(`Error patching candidate: ${error}`);
    next(error);
  }
};

export const removeCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, mno, year } = req.query;

    if (
      typeof id !== "string" || !id.trim() ||
      typeof mno !== "string" || !mno.trim() ||
      typeof year !== "string" || !year.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request parameters",
      });
    }

    const yearNumber = Number(year);
    if (!Number.isFinite(yearNumber)) {
      return res.status(400).json({
        success: false,
        message: "Year must be a valid number",
      });
    }

    // ✅ 1) Get existing candidate first (so we know the photo_url)
    // Use ANY function that returns candidate row with photo_url
    // Example signature: getCandidateByIdAndYear(id, year) -> { photo_url?: string } | null
    const existing = await getCandidateByIdAndYear(id.trim(), yearNumber);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // ✅ 2) Delete DB row first
    const isDeleted = await deleteCandidate(id.trim(), mno.trim(), yearNumber);
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // ✅ 3) Delete photo file (best-effort; don't fail API if deletion fails)
    const photoUrl = existing.photo_url ? String(existing.photo_url) : "";

    // only handle our local uploads path
    // supports:
    // - http(s)://domain/uploads/candidates/abc.jpg
    // - /uploads/candidates/abc.jpg
    const marker = "/uploads/candidates/";
    const idx = photoUrl.indexOf(marker);

    if (idx !== -1) {
      const filename = photoUrl.substring(idx + marker.length).split("?")[0].split("#")[0];

      if (filename) {
        const filePath = path.join(process.cwd(), "uploads", "candidates", filename);

        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          logging.warn(`Failed to delete candidate photo file: ${err}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Candidate successfully deleted.",
    });

  } catch (error) {
    logging.error(`Error removing candidate: ${error}`);
    next(error);

  }
};


export const getElecomUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await fetchSystemConfig('com_web_app', 'elecom', 'user');

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config not found"
      });
    }

    const memberNos: string[] = JSON.parse(config.uvalue);

    // Fetch member details
    const members = await fetchMembersByList(memberNos);

    return res.status(200).json({
      success: true,
      members
    });

  } catch (error) {
    next(error);
  }
};

export const addElecomUser = async (req: Request, res: Response) => {
  const { memberNo } = req.body;

  const config = await fetchSystemConfig('com_web_app', 'elecom', 'user');

  if (!config) {
    return res.status(404).json({
      success: false,
      message: "Config not found",
    });
  }

  let memberNos: string[] = JSON.parse(config.uvalue);

  if (memberNos.includes(memberNo)) {
    return res.status(400).json({
      success: false,
      message: "Member already exists"
    });
  }

  memberNos.push(memberNo);

  await updateSystemConfig(
    'com_web_app',
    'elecom',
    'user',
    JSON.stringify(memberNos)
  );

  res.json({ success: true });
};


export const removeElecomUser = async (req: Request, res: Response) => {
  const { memberNo } = req.body;

  const config = await fetchSystemConfig('com_web_app', 'elecom', 'user');
  if (!config) {
    return res.status(404).json({
      success: false,
      message: "Config not found",
    });
  }

  let memberNos: string[] = JSON.parse(config.uvalue);

  memberNos = memberNos.filter(m => m !== memberNo);

  await updateSystemConfig(
    'com_web_app',
    'elecom',
    'user',
    JSON.stringify(memberNos)
  );

  res.json({ success: true });
};


export const castVote = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    const year = Number(req.body?.year);
    if (!year) return res.status(400).json({ success:false, message:"Invalid year" });
    if (!memberNo) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await submitVote({
      year: year,
      member_no: memberNo,
      votes: req.body.votes,
    });

    return res.json({ success: true, ...result });
  } catch (e: any) {
    const msg = e?.message || "Error submitting vote";

    const statusCode = msg.toLowerCase().includes("already voted") ? 409 : 400;

    e.statusCode = statusCode;  // attach for error handler
    logging.error(`Error casting votes: ${msg} - ${statusCode}`);
    return next(e);
  }
};

export const memberHasVoted = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {  
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const year = Number(req.query?.year);
    if (!year) return res.status(400).json({ success:false, message:"Invalid year" });

    const isVoted = await checkMemberHasVoted(memberNo, year);

    return res.status(200).json({
      success: true,
      isVoted
    });
    
  } catch (error) {
    logging.error(`Error in checking member has voted: ${error}`);
    next(error);
  }
}

export const getVoteCasted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const year = Number(req.params.year);

    // ✅ better validation
    if (!Number.isInteger(year)) {
      return res.status(400).json({ success: false, message: "Invalid year" });
    }

    const ballot = await fetchBallot(memberNo, year);
    if (!ballot) {
      return res.status(404).json({ success: false, message: "Ballot not found!" });
    }

    const votes = await fetchVoteCasted(memberNo, year);

    // ✅ if votes is an array, check length
    if (!votes || votes.length === 0) {
      return res.status(404).json({ success: false, message: "No votes found!" });
    }

    return res.status(200).json({
      success: true,
      ballot,
      votes,
    });
  } catch (error) {
    logging.error(`Error getting vote casted: ${error}`);
    return next(error);
  }
};

export const getElectionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberNo = req.user?.memberNo;
    if (!memberNo) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const year = Number(req.params.year);

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      return res.status(400).json({ success: false, message: "Invalid year" });
    }

    const [
      totalRegisterVoter,
      totalCastedVote,
      totalPosition,
      totalCandidates,
    ] = await Promise.all([
      getTotalRegisteredVoters(),
      getTotalCastedVotes(year),
      getTotalPosition(),
      getTotalCandidates(year),
    ]);

    return res.status(200).json({
      success: true,
      totalRegisterVoter,
      totalCastedVote,
      totalPosition,
      totalCandidates,
    });
  } catch (error) {
    logging.error(`Error getting elections status: ${error}`);
    return next(error);
  }
};

export const electionResultsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ accept year from /election/results/:year OR ?year=2026
    const yearRaw = (req.params.year ?? req.query.year) as string | undefined;

    if (!yearRaw) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    // ✅ parse and validate
    const year = Number(yearRaw);
    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    const [
      totalRegisterVoter,
      totalCastedVote,
      results,
    ] = await Promise.all([
      getTotalRegisteredVoters(),
      getTotalCastedVotes(year),
      getElectionResutls(year),
    ]);

    return res.status(200).json({
      success: true,
      year,
      results,
      totalCastedVote,
      totalRegisterVoter
    });
  } catch (error) {
    logging.error(`Error getting election results: ${error}`);
    next(error);
  }
};