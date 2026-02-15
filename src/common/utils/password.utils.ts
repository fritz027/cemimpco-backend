import bcrypt from 'bcrypt';

const salt = 10;

export async function validatePassword(password: string, hashPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error) {
    logging.error(`Error in validating password: ${error}`);
    return false;
  }
}


export async function hashingPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logging.error(`Error in hasing password: ${error}`);
    return "";
  }
}