const htmlFiles = [
    "./html/1.html", "./html/2.html",
    "./html/3.html", "./html/4.html",
    "./html/5.html", "./html/6.html",
    "./html/7.html", "./html/8.html",
    "./html/9.html", "./html/10.html",
    "./html/11.html", "./html/12.html",
    "./html/13.html", "./html/14.html",
    "./html/15.html"
]; 


import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib";
import puppeteer from "npm:puppeteer";
  
const outputPdf = "output.pdf"; // name of the output PDF file

// Set up a Puppeteer browser and page
const browser = await puppeteer.launch();
const page = await browser.newPage();

//TODO: set viewport to 508x650 (image size)

// Create a new PDF document
const pdfDoc = await PDFDocument.create();

// Load each HTML file, render it to a PDF, and add it to the PDF document
for (const htmlFile of htmlFiles) {
  const html = await Deno.readTextFile(htmlFile);
  await page.setContent(html);
  const pdfBytes = await page.pdf({ format: "a4" });
  const pdfDocBytes = await PDFDocument.load(pdfBytes);
  const [pdfDocPage] = await pdfDoc.copyPages(pdfDocBytes, [0]);
  pdfDoc.addPage(pdfDocPage);
}

// Save the PDF to a file
const pdfBytes = await pdfDoc.save();
await Deno.writeFile(outputPdf, pdfBytes);

// Close the Puppeteer browser
await browser.close();
