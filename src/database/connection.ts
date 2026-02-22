import odbc from "odbc";
import {
  DATABASE_LOGIN_TIMEOUT,
  DATABASE_MAXIMUM_TIMEOUT,
  DATABASE_CONNECTION_STRING,
  DB_DRIVER,
  DB_DBN,
  DB_UID,
  DB_PWD,
  DB_SERVER_NAME,
} from "../config/config";
import logging from "../config/logging"; // adjust

type ConnMode = "coop" | "credit";

const pools: Record<string, odbc.Pool> = {}; // only for coop/system

function buildCoopConnString() {
    logging.info(DATABASE_CONNECTION_STRING);
    logging.info(`Driver=${DB_DRIVER};DBN=${DB_DBN};UID=${DB_UID};PWD=${DB_PWD};ServerName=${DB_SERVER_NAME}`);
  return `Driver=${DB_DRIVER};DBN=${DB_DBN};UID=${DB_UID};PWD=${DB_PWD};ServerName=${DB_SERVER_NAME}`;
}

function buildCreditConnString(uid: string, password: string) {
  if (!uid?.trim() || !password) {
    throw new Error("Missing credit credentials");
  }
  return `Driver=${DB_DRIVER};DBN=${DB_DBN};UID=${uid.trim()};PWD=${password};ServerName=${DB_SERVER_NAME}`;
}

/**
 * Coop: returns pooled connection (remember to close connection after query)
 * Credit: returns a direct connection (caller MUST close it)
 */
export async function getConnection(
  mode: ConnMode,
  uid?: string | null,
  password?: string | null
): Promise<odbc.Connection> {
  try {
    if (mode === "coop") {
      const connString = buildCoopConnString();

      if (!pools["COOP"]) {
        pools["COOP"] = await odbc.pool({
          connectionString: connString,
          connectionTimeout: DATABASE_MAXIMUM_TIMEOUT,
          loginTimeout: DATABASE_LOGIN_TIMEOUT,
        });
        logging.info("Coop database pool created");
      }

      return await pools["COOP"].connect();
    }

    // credit mode (no fallback allowed)
    const connString = buildCreditConnString(uid ?? "", password ?? "");

    // IMPORTANT: do not pool per-user credentials unless you key pools per uid and manage eviction.
    return await odbc.connect({
      connectionString: connString,
      connectionTimeout: DATABASE_MAXIMUM_TIMEOUT,
      loginTimeout: DATABASE_LOGIN_TIMEOUT,
    });
  } catch (error) {
    logging.error(`Error connecting to database: ${error}`);
    throw error;
  }
}
