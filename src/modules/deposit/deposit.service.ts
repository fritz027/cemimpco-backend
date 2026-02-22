import { QueryStatement } from "../../database/query";
import { DepositDetail,DepositHeader } from "./deposit.type";


export async function fetchDepositDetails(memberNo: string, depositType: string): Promise<DepositDetail[]> {
  try {
    // const sql = `exec get_deposit_prof @member_no='${memberNo}' , @dep_type='${depositType}'`;
    const sql = `exec get_deposit_prof @member_no= ? , @dep_type= ?`;

    const rows: any[] = await QueryStatement(sql,[memberNo, depositType]);

    return rows ?? [];

  } catch (error) {
    logging.error(`Error fetching deposit details: ${error}`);
    throw error;
  }  
}

export async function fetchDepositHeader(memberNo: string, depositType: string): Promise<DepositHeader | null > {
  try {
    const sql = `SELECT 
                d.*,
                t.deposit_desc 
                FROM DEPOSIT d, deposit_type t 
                WHERE d.deposit_type = t.deposit_type 
                AND d.member_no = ?
                AND d.deposit_type = ?
              `;
    const rows = (await QueryStatement(sql, [memberNo, depositType])) as DepositHeader[];
    return rows?.[0] ?? null;
  } catch (error) {
    logging.error(`Error fetching deposit header: ${error}`);
    throw error;
  }
} 