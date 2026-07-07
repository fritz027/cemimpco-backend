import path from 'path';
import fs from 'fs/promises';


const LOANS_DIR = path.resolve('uploads', 'loans'); // adjust to your actual base path

export async function findIdImage(memberNo: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(LOANS_DIR);

    const match = entries.find(name =>
      name.startsWith(`${memberNo}-ID`) &&           // e.g. 20080652-ID.jpg / .png / .webp
      /\.(jpe?g|png|webp|gif|pdf)$/i.test(name)
    );

    return match ? path.join(LOANS_DIR, match) : null;
  } catch (err) {
    console.error('Could not read loans dir:', err);
    return null;
  }
}