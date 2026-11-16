import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { env } from "./env.js";

export const pool = mysql.createPool({
  ...env.db,
  connectionLimit: 10,
  dateStrings: true,
  // pro DECIMAL vir como numero e nao string
  decimalNumbers: true,
  // BOOLEAN (TINYINT(1)) vem como true/false
  typeCast: (field, next) => (field.type === "TINY" && field.length === 1 ? field.string() === "1" : next()),
});

export type Conn = Pick<typeof pool, "query">;

/** select ja tipado, devolve as linhas como T[] */
export async function select<T>(sql: string, params: unknown[] = [], conn: Conn = pool): Promise<T[]> {
  const [rows] = await conn.query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

/** pra insert/update/delete, devolve insertId e affectedRows */
export async function exec(sql: string, params: unknown[] = [], conn: Conn = pool) {
  const [res] = await conn.query<ResultSetHeader>(sql, params);
  return res;
}

/** roda o fn dentro de uma transacao */
export async function transaction<T>(fn: (conn: Conn) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
