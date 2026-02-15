import odbc from 'odbc';
import { 
    DATABASE_LOGIN_TIMEOUT, 
    DATABASE_MAXIMUM_TIMEOUT,
    DATABASE_CONNECTION_STRING 
} from "../config/config";

const pools: Record<string, odbc.Pool> = {};

const connectionStrings: Record<string, string> = {
    MAIN: DATABASE_CONNECTION_STRING,
};

export async function getConnection(): Promise<odbc.Connection> {
    try {
        const connString = connectionStrings['MAIN'];
        console.log(connString)
        if (!connString) {
            throw new Error(`Invalid DB`);
        }
        if (!pools['MAIN']) {
            pools['MAIN'] = await odbc.pool({
                connectionString: connString,
                connectionTimeout: DATABASE_MAXIMUM_TIMEOUT,
                loginTimeout: DATABASE_LOGIN_TIMEOUT,
            });
        }
        logging.info(`Database connection pool created`);
        const connection = await pools['MAIN'].connect();
        return connection;
    } catch (error) {
        logging.error(`Error Connecting to database: ${error}`)
        throw (error);
    }
}
