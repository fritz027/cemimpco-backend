import odbc from "odbc";

export async function queryOnConn<T = any>(
  conn: odbc.Connection,
  sql: string,
  params?: any[]
): Promise<T[]> {
  return params ? await conn.query<T>(sql, params) : await conn.query<T>(sql);
}