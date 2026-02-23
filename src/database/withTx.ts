import odbc from "odbc";
import { getConnection } from "./connection";

export async function withCoopTransaction<T>(
  fn: (conn: odbc.Connection) => Promise<T>
): Promise<T> {
  const conn = await getConnection("coop");
  try {
    await conn.query("BEGIN TRANSACTION");
    const result = await fn(conn);
    await conn.query("COMMIT");
    return result;
  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    await conn.close();
  }
}