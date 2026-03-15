import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';

/**
 * Helper to convert an image file to a Base64 string for embedding in PDF.
 */

handlebars.registerHelper('formatCurrency', (value: number) => {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
});

export const generatePatronagePdf = async (data: any): Promise<Buffer> => {
  // console.log(data);
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    try {
        const page = await browser.newPage();
        const root = process.cwd();
        
        // Path to your new patronage HBS file
        const templatePath = path.join(root, 'src/templates/patdiv.hbs');
        
        // 1. Calculate Derived Fields (Logic that shouldn't be in the template)
        data.net_int_sc = data.int_on_sc - data.sc_retention;
        data.printDate = new Date().toLocaleDateString('en-PH');

        // 2. Read and Compile
        const templateHtml = await fs.readFile(templatePath, 'utf-8');
        const template = handlebars.compile(templateHtml);
        const finalHtml = template(data);

        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        // 3. Generate PDF (Match the physical paper size)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error("Patronage PDF Error:", error);
        throw error;
    } finally {
        await browser.close();
    }
};

export const imageToBase64 = (filePath: string): string => {
  try {
    const bitmap = fs.readFileSync(filePath);
    const extension = path.extname(filePath).replace('.', '');
    return `data:image/${extension};base64,${bitmap.toString('base64')}`;
  } catch (error) {
    console.error(`Could not find image at ${filePath}. Skipping...`);
    return ''; // Return empty string so the PDF doesn't crash
  }
};

/**
 * Core Function: Turns Data + Template into a PDF Buffer.
 */
export const generateBallotFromHbs = async (data: any): Promise<Buffer> => {
  // 1. Launch Puppeteer
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();

    // 2. Define Paths
    // Using process.cwd() ensures it works regardless of where the script is run
    const root = process.cwd();
    const templatePath = path.join(root, 'src/templates/ballot.hbs');
    
    // 3. Prepare Images
    // We transform the paths into actual Base64 data before HBS sees them
    if (data.candidateImagePath) {
      const fullPath = path.join(root, data.candidateImagePath);
      data.candidateImage = imageToBase64(fullPath);
    }
    
    if (data.logoPath) {
      const fullPath = path.join(root, data.logoPath);
      data.logo = imageToBase64(fullPath);
    }

    console.log(data);

    // 4. Read and Compile Handlebars Template
    const templateHtml = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const finalHtml = template(data);

    // 5. Render HTML in Puppeteer
    // 
    await page.setContent(finalHtml, { 
      waitUntil: 'networkidle0' // Wait for all images/fonts to load
    });

    // 6. Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Crucial for colors/images
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  } finally {
    // Always close the browser, even if there's an error, 
    // otherwise you'll leak memory (zombie chrome processes)
    await browser.close();
  }
};