import fs from 'fs';
import path from "path";
import puppeteer from "puppeteer";
import { compileTemplate } from './handlebars';

function getLogoDataUri(): string {
  const logoPath = path.join(process.cwd(), "src", "common", "pdf", "assets", "logo.jpg");
  return `data:image/jpeg;base64,${fs.readFileSync(logoPath, "base64")}`;
}

export async function generateLoanApplicationPdf(loanID: string, templateData: any) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    const data = { logo: getLogoDataUri(), ...templateData };
    const content = await compileTemplate("loan_application_template", data);

    await page.setContent(content, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const outDir = path.join(process.cwd(), "uploads", "loans", "applications");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const pdfPath = path.join(outDir, `${loanID}.pdf`);
    await page.pdf({ path: pdfPath, width: "8in", height: "13in", printBackground: true });

    return pdfPath;
  } catch (error) {
    logging.error(`Error generating loan application pdf`);
    throw error;
  } finally {
    await browser.close();
  }
}