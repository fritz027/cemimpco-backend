import { QueryStatement } from "../../database/query";
import { ElectionSetting, Position,Candidate, CandidatesResult,CandidatePhotoRow } from "./election.type";
import { APP_NAME, SECTION_NAME } from "../../config/config";



export async function updateElectionSetting(
  election: ElectionSetting, 
  appName: string, 
  section: string, 
  ukey: string
):Promise<boolean> {
  try {
    const sql = `
      UPDATE sys_config 
      SET uvalue = ?
      WHERE app_name = ?
        AND section = ?
        AND ukey = ?
    `;
    const setting = {
      year: election.year,
      from: election.from,
      to: election.to,
      start: election.start
    };
    console.log(JSON.stringify(setting))

    const rows : any = await QueryStatement(
      sql,
      [JSON.stringify(setting), appName, section, ukey]
    );

    return (rows?.rowsAffected ?? rows?.count ?? 0) > 0;
  } catch (error) {
    logging.error(`Error updating elections setting: ${error}`);
    throw error;
  }
}

export async function updateElecomList(list: string[]): Promise<boolean> {
  try {
    const sql = `
      UPDATE sys_config 
      SET uvalue = ?
      WHERE app_name = ?
        AND section = ?
        AND ukey = ?
    `;

    // 🔥 Always store as JSON
    const result: any = await QueryStatement(sql, [
      JSON.stringify(list),
      "com_web_app",
      "elecom",
      "user",
    ]);

    // ✅ Check if update actually happened
    return (result?.rowsAffected ?? result?.count ?? 0) > 0;

  } catch (error) {
    logging.error(`Error updating elecom list: ${error}`);
    throw error;
  }
}


export async function newPosition(position: Position): Promise<boolean> {
  try {
    const sql = `INSERT INTO evs_position (position_id, position_desc, position)
              VALUES (?,?,?)
    `;
    const result: any = await QueryStatement(sql,[position.position_id,position.position_desc,position.position]);
    
    const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected;

  } catch (error) {
    logging.error(`Error new postion: ${error}`);
    throw error;
  }
}

export async function fetchPositions(): Promise<Position[]> {
  try {
    const sql = `SELECT * from evs_position`
    const rows: Position[] = await QueryStatement(sql);
    return rows ?? [];
  } catch (error) {
    logging.error(`Error fetching positions: ${error}`);
    throw error;
  }
}

export async function updatePosition(payload: Position): Promise<boolean> {
  try {
    const sql = `UPDATE evs_position SET position_desc = ?, position = ?
                WHERE position_id = ?`
    const result: any = await QueryStatement(sql,[
      payload.position_desc,
      payload.position,
      payload.position_id
    ]);

     const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected;

  } catch (error) {
    logging.error(`Error updating position: ${error}`);
    throw error;
  }
}

export async function deletePosition(positionId: string): Promise<boolean> {
  try {
    const sql = `
      DELETE FROM evs_position
      WHERE position_id = ?
    `;

    const result: any = await QueryStatement(sql, [positionId]);
    const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected > 0; // ✅ return boolean
  } catch (error) {
    logging.error(`Error deleting position: ${error}`);
    throw error;
  }
}


export async function newCandidate(payload: Candidate): Promise<boolean> {
  try {
    const sql = `INSERT INTO evs_candidates 
                  (candidate_id, elect_year, position_id,member_no,elec_order,vision,photo_url )
                  VALUES(?,?,?,?,?,?,?)      
                  `;
    const result: any = await QueryStatement(sql,[
      payload.candidate_id,
      payload.elect_year,
      payload.position_id,
      payload.member_no,
      payload.elec_order,
      payload.vision,
      payload.photo_url,
    ]);

    const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected;

  } catch (error) {
    logging.error(`Error in making new Candidate: ${error}`);
    throw error;
  }
}

export async function fetchAllCandidates(
  year: number
): Promise<CandidatesResult[]> {
  try {
    // ✅ Validate year
    if (!year || typeof year !== "number") {
      throw new Error("Invalid election year");
    }

    const sql = `
      SELECT 
        c.candidate_id,
        c.elect_year,
        c.position_id,
        c.member_no,
        c.elec_order,
        c.vision,
        c.photo_url,
        m.member_name,
        p.position_desc
      FROM evs_candidates c
      LEFT JOIN member m 
        ON m.member_no = c.member_no
      LEFT JOIN evs_position p 
        ON p.position_id = c.position_id
      WHERE c.elect_year = ?
      ORDER BY 
        c.position_id ASC,
        c.elec_order ASC
    `;

    const rows = await QueryStatement<CandidatesResult>(sql, [year]);

    return rows ?? [];
  } catch (error) {
    logging.error(`Error in fetchAllCandidates: ${error}`);
    throw error;
  }
}

export async function updateCandidate(payload: Candidate): Promise<Candidate> {
  try {
    const sql = `UPDATE evs_candidates SET position_id = ?, elec_order = ?, vision = ?, photo_url = ?
                  WHERE candidate_id = ?
                  AND member_no = ?
                  AND elect_year = ?  
    `;
    const result: any = await QueryStatement(sql,
      [
        payload.position_id,
        payload.elec_order,
        payload.vision,
        payload.photo_url,
        payload.candidate_id,
        payload.member_no,
        payload.elect_year
      ]
    );

    const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected;

  } catch (error) {
    logging.error(`Error updating candidate: ${error}`);
    throw error;
  }
}


export async function deleteCandidate(id: string, memberNo: string, year: number): Promise<boolean> {
  try {
    const sql = `DELETE FROM evs_candidate
                WHERE candidate_id = ? 
                AND member_no = ?
                AND elect_year = ?`;
    const result : any = await QueryStatement(sql, [id, memberNo, year]);
    const affected = result?.rowsAffected ?? result?.count ?? 0;

    return affected > 0; // ✅ return boolean
  } catch (error) {
    logging.error(`Error in deleting candidate: ${error}`);
    throw error;
  }
}

export async function getCandidateByIdAndYear(
  id: string,
  year: number
): Promise<CandidatePhotoRow | null> {
  try {
    const sql = `
      SELECT candidate_id, elect_year, photo_url
      FROM evs_candidates
      WHERE candidate_id = ? AND elect_year = ?
    `;

    const rows: CandidatePhotoRow[] = await QueryStatement(sql, [id, year]);

    return rows.length ? rows[0] : null;
  } catch (error) {
    logging.error(`Error getting candidate by id and year: ${id}, ${year} - ${error}`);
    throw error;
  }
}