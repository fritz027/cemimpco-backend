import { getConnection } from "./connection";
import { Result } from 'odbc';

export async function QueryStatement<T = any>(query: string, values?: any[]) : Promise<T[]>{
    try {
        const connection = await getConnection();
        if (!connection) {
            throw new Error(`Failed to connect to the database`);
        }
        const result: Result<T> = values
            ? await connection.query<T>(query, values)
            : await connection.query<T>(query);
        await connection.close();
        return result;
    } catch (error) {
        logging.error(`Database query error: ${error}`);
        throw error;
    }
}