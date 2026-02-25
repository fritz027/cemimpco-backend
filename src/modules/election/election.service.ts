import { QueryStatement } from "../../database/query";
import { ElectionSetting, Position,Candidate, CandidatesResult,CandidatePhotoRow, Ballots, MemberVoteCasted } from "./election.type";
import { APP_NAME, SECTION_NAME } from "../../config/config";
import { withCoopTransaction } from '../../database/withTx';
import { queryOnConn } from "../../database/queryOnConn";



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
    const sql = `DELETE FROM evs_candidates
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

export async function submitVote(payload: {
  year: number;
  member_no: string;
  votes: { position_id: string; candidate_ids: string[] }[];
}) {
  try {
    const year = Number(payload.year);
    const memberNo = String(payload.member_no || "").trim();

    if (!year || !memberNo) throw new Error("Invalid payload");

    // flatten unique candidate ids
    const allCandidateIds = Array.from(
      new Set(payload.votes.flatMap(v => (v.candidate_ids || []).map(String)).filter(Boolean))
    );
    if (allCandidateIds.length === 0) throw new Error("No selections");

    return await withCoopTransaction(async (conn) => {
      // A) prevent double voting (unique index in evs_ballots is also protection)
     const already = await queryOnConn(
        conn,
        `SELECT TOP 1 1
        FROM DBA.evs_ballots
        WHERE elect_year = ? AND member_no = ?`,
        [year, memberNo]
      );
      if (already.length) throw new Error("Already voted");

      // B) validate limits from evs_position (position = limit)
      const posRows = await queryOnConn<{ position_id: string; vote_limit: number }>(
        conn,
        `SELECT position_id, position AS vote_limit
         FROM DBA.evs_position`
      );

      const limitMap = new Map<string, number>();
      for (const r of posRows) {
        limitMap.set(String(r.position_id).trim().toUpperCase(), Number(r.vote_limit));
      }

      for (const v of payload.votes) {
        const pid = String(v.position_id).trim().toUpperCase();
        const limit = limitMap.get(pid);
        if (!limit) throw new Error(`Unknown position_id: ${pid}`);
        if ((v.candidate_ids || []).length > limit) {
          throw new Error(`Too many selections for ${pid}. Max is ${limit}.`);
        }
      }

      // C) validate candidates exist and match year+position
      const placeholders = allCandidateIds.map(() => "?").join(",");
      const candRows = await queryOnConn<{ candidate_id: string; position_id: string }>(
        conn,
        `SELECT candidate_id, position_id
         FROM DBA.evs_candidates
         WHERE elect_year = ?
           AND candidate_id IN (${placeholders})`,
        [year, ...allCandidateIds]
      );

      const candPos = new Map<string, string>();
      for (const r of candRows) {
        candPos.set(String(r.candidate_id).trim(), String(r.position_id).trim().toUpperCase());
      }

      for (const v of payload.votes) {
        const pid = String(v.position_id).trim().toUpperCase();
        for (const cid of v.candidate_ids || []) {
          const actual = candPos.get(String(cid).trim());
          if (!actual) throw new Error(`Invalid candidate_id: ${cid}`);
          if (actual !== pid) throw new Error(`Candidate ${cid} not in ${pid}`);
        }
      }

      // D) generate ballot_no = YYYY + 6-digit seq (safe)
      // lock counter row (if exists)
      const counter = await queryOnConn<{ last_seq: number }>(
        conn,
        `SELECT last_seq
         FROM DBA.evs_ballot_counter
         WHERE elect_year = ?
         FOR UPDATE`,
        [year]
      );

      let nextSeq = 1;

      if (counter.length === 0) {
        // first ballot this year
        await queryOnConn(
          conn,
          `INSERT INTO DBA.evs_ballot_counter (elect_year, last_seq)
           VALUES (?, 1)`,
          [year]
        );
        nextSeq = 1;
      } else {
        nextSeq = Number(counter[0].last_seq) + 1;

        await queryOnConn(
          conn,
          `UPDATE DBA.evs_ballot_counter
           SET last_seq = ?
           WHERE elect_year = ?`,
          [nextSeq, year]
        );
      }

      // build formatted ballot number: 2026 + 000001
      const ballotNo = Number(`${year}${String(nextSeq).padStart(6, "0")}`);

      // E) insert ballot header
      await queryOnConn(
        conn,
        `INSERT INTO DBA.evs_ballots (ballot_no, elect_year, member_no)
         VALUES (?, ?, ?)`,
        [ballotNo, year, memberNo]
      );

      // F) insert vote lines
      for (const cid of allCandidateIds) {
        await queryOnConn(
          conn,
          `INSERT INTO DBA.evs_votes (ballot_no, elect_year, member_no, candidate_id, vote_date)
           VALUES (?, ?, ?, ?, CURRENT TIMESTAMP)`,
          [ballotNo, year, memberNo, cid]
        );
      }

      return { ballot_no: ballotNo, total_votes: allCandidateIds.length };
    });
  } catch (err) {
    logging.error(`submitVote error: ${err}`);
    throw err;
  }
}

export async function checkMemberHasVoted(memberNo: string, year: number): Promise<boolean> {
  try {
    const sql = `SELECT TOP 1 1
              FROM evs_ballots
              WHERE elect_year = ?
              AND member_no = ?`;
    const result : any = await QueryStatement(sql, [year, memberNo]);
    return result.length > 0;
  } catch (error) {
    logging.error(`Error on checking member has voted: ${error} `);
    throw error;
  }
}

export async function fetchBallot(
  memberNo: string,
  year: number
): Promise<Ballots | null> {
  try {
    const sql = `
      SELECT TOP 1 *
      FROM evs_ballots
      WHERE member_no = ?
      AND elect_year = ?
    `;

    const result: Ballots[] = await QueryStatement(sql, [memberNo, year]);

    return result.length > 0 ? result[0] : null;

  } catch (error) {
    logging.error(`Error fetching ballot: ${error}`);
    throw error;
  }
}


export async function fetchVoteCasted(
  memberNo: string,
  year: number
): Promise<MemberVoteCasted[]> {
  try {
    const sql = `SELECT 
              c.candidate_id,
              c.member_no AS candidate_member_no,
              m.member_name AS candidate_name,
              c.vision,
              c.position_id,
              p.position_desc,
              c.photo_url
          FROM evs_votes v
          LEFT JOIN evs_candidates c 
              ON c.candidate_id = v.candidate_id
          LEFT JOIN evs_position p 
              ON p.position_id = c.position_id
          LEFT JOIN member m  
              ON m.member_no = c.member_no
          WHERE v.member_no = ?
          AND v.elect_year = ?`
    const rows : MemberVoteCasted[] = await QueryStatement(sql, [memberNo, year]);

    return rows ?? [];

  } catch (error) {
    logging.error(`Error fetching vote casted: ${error}`);
    throw error;
  }
}

export async function getTotalRegisteredVoters(): Promise<number> {
  try {
    const sql = `
      SELECT COUNT(*) AS total_register
      FROM member
      WHERE member_type = 'R'
      AND mbr_status = 'A'
    `;

    const result: any[] = await QueryStatement(sql);

    return result.length > 0 ? Number(result[0].total_register) : 0;

  } catch (error) {
    logging.error(`Error getting total Registered voters: ${error}`);
    throw error;
  }
}

export async function getTotalCastedVotes (year: number): Promise<number> {
  try {
    const sql = `SELECT count(*) as total_casted_votes FROM evs_ballots WHERE elect_year = ?`;
    const result: any[] = await QueryStatement(sql,[year]);

    return result.length > 0 ? Number(result[0].total_casted_votes) : 0;
  } catch (error) {
    logging.error(`Error getting total casted votes: ${error}`);
    throw error;
  }
}

export async function getTotalPosition (): Promise<number> {
  try {
    const sql = `SELECT sum(position) as total_position FROM evs_position`;
    const result: any[] = await QueryStatement(sql);

    return result.length > 0 ? Number(result[0].total_position) : 0;
  } catch (error) {
    logging.error(`Error getting total casted votes: ${error}`);
    throw error;
  }
}
export async function getTotalCandidates (year: number): Promise<number> {
  try {
    const sql = `SELECT count(*) as total_candidates FROM evs_candidates WHERE elect_year = ?`;
    const result: any[] = await QueryStatement(sql,[year]);

    return result.length > 0 ? Number(result[0].total_candidates) : 0;
  } catch (error) {
    logging.error(`Error getting total casted votes: ${error}`);
    throw error;
  }
}


