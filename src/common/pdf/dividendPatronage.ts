import fs from 'fs';
import path from "path";
import puppeteer from "puppeteer";
import { compileTemplate } from './handlebars';
import { fetchMemberDividendPatronage } from '../../modules/member/member.service';


export async function generateDividendPatronagePdf(memberNo:string) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();

    const data = await fetchMemberDividendPatronage(memberNo);
    if (!data || data.length === 0) throw new Error("No data found on member.");

    const topData = data[0];

    const totals = {
      totalPrinDue: data.reduce((acc: number, item: any) => acc + (item.prin_due || 0), 0),
      totalIntDue: data.reduce((acc: number, item: any) => acc + (item.int_due || 0), 0),
      totalFinesDue: data.reduce((acc: number, item: any) => acc + (item.fines_due || 0), 0),
      totalPatrefPrinPay: data.reduce((acc: number, item: any) => acc + (item.patref_prin_pay || 0), 0),
      totalPatrefIntPay: data.reduce((acc: number, item: any) => acc + (item.patref_int_pay || 0), 0),
      totalPatrefFinesPay: data.reduce((acc: number, item: any) => acc + (item.patref_fines_pay || 0), 0),
    };

     const pat = { datas: data, topData, ...totals };

    const content = await compileTemplate("dividend", pat);

    await page.setContent(content, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

     // ensure output folder exists
    const outDir = path.join(process.cwd(), "Dividend");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const pdfPath = path.join(outDir, `${memberNo}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    return pdfPath;
  } catch (error) {
    logging.error(`Error generating dividend patronage pdf`);
    throw error;
  } finally {
    await browser.close();
  }
}