import fs from 'fs';
import path from 'path';
import hbs from "handlebars";

let registered = false;

export function registerHbsHelpers() {
  try {

    if (registered) return;
    registered = true;
    
    hbs.registerHelper("numberFormat", function (value: any, options: any) {
      const dl = options.hash["decimalLength"] ?? 2;
      const ts = options.hash["thousandsSep"] ?? ",";
      const ds = options.hash["decimalSep"] ?? ".";

      const val = parseFloat(value);
      const re = "\\d(?=(\\d{3})+" + (dl > 0 ? "\\D" : "$") + ")";
      const num = (isNaN(val) ? 0 : val).toFixed(Math.max(0, ~~dl));

      return (ds ? num.replace(".", ds) : num).replace(new RegExp(re, "g"), "$&" + ts);
    });

    hbs.registerHelper("getFactor", function (amount: any, interest: any) {
      const a = Number(amount);
      const i = Number(interest);
      const factor = a === 0 ? 0 : (i / a) * 100;
      const roundFactor = Math.round(factor * 100000) / 100000;

      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      }).format(roundFactor);
    });
  } catch (error) {
    logging.error(`Error handle bar registerHelpers: ${error}`);
    throw error;
  }
}

export async function compileTemplate(templateName: string, data: any) {
  try {
    registerHbsHelpers();

    // if your templates are in src/templates:
    const filepath = path.join(process.cwd(), "src", "common", "pdf", "templates", `${templateName}.hbs`);

    // if your templates are in root/templates, use:
    // const filepath = path.join(process.cwd(), "templates", `${templateName}.hbs`);

    const html = fs.readFileSync(filepath, "utf-8");
    return hbs.compile(html)(data);
  } catch (error) {
    logging.error(`Error in compileTemplate: ${error}`);
    throw error;
  }
}