import puppeteer, { Page } from "puppeteer";
import dotenv from "dotenv"
import fs from "fs"

dotenv.config();
const USERNAME = process.env.NAME ?? '';
const PWD = process.env.PWD ?? '';
const BOOK = process.env.BOOK ?? '';

const browser = await puppeteer.launch();
const page = await browser.newPage();

await login(page, USERNAME, PWD);

//Create new downloads dir
if (!fs.existsSync('downloads')){
    fs.mkdirSync('downloads');
}
//Create new html dir
if (!fs.existsSync('html')){
    fs.mkdirSync('html');
}

let pageNum = 0;
let path: string | null;   //Last HTML file generated
const pathList: string[] = []; //Array of paths to HTML files
do {
    pageNum++;
    console.log('Page', pageNum)
    const sourcePaths = await downloadPage(page, BOOK, pageNum);
    path = generateHTML(sourcePaths, pageNum);
    if (path != null) pathList.push(path);
    if(pageNum === 15) break;
} while (path !== null)

console.log(`Execution stopped at page ${pageNum}`);

await browser.close();

await genereatePDF('microbiologia', pathList);


//Login to the UniTO intranet
async function login(page: Page, username: string, password: string) {
    const URL = 'https://my.unito.it'

    //Move to login page and wait for it to load
    await page.goto(URL, { waitUntil: 'networkidle0' });

    //Type username and password
    await page.type('input[name="j_username"]', username);
    await page.type('input[name="j_password"]', password);

    //Click button
    await Promise.all([page.waitForNavigation(), page.click('button[name="_eventId_proceed"]')]);

    //Wait for series of redirects to be over - we want to be sure that we're logged in
    await page.waitForNetworkIdle();
}

//Download a page's text and background
async function downloadPage(page: Page, bookCode: string, pageNum: number): Promise<HTMLPage> {
    const imgUrl = `https://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-html5-substrates/page${pageNumFixed(pageNum)}_1.jpg?uni=557d76170c245168845e5673708d98fd`;
    const textUrl = `http://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-vectorlayers/${pageNumFixed(pageNum)}.svg?uni=557d76170c245168845e5673708d98fd`;
    const outPath = `downloads/${pageNum}`;
    let textCode = 200, imgCode = 200;
    const paths: HTMLPage = new Object();

    //Fetch text page and download it, return in case of error
    try {
        const res = await page.goto(textUrl, { waitUntil: 'networkidle0' });
        if (res != null)
            if (res.status() >= 400) {
                textCode = res.status();
                console.log(`\tError ${textCode} while downloading ${pageNum}.svg`);
            } else {
                fs.writeFileSync(outPath + '.svg', await page.content());
                paths.fontFile = outPath + '.svg';
            }
    } catch (e) { console.log(e); }

    //Fetch image page and download it, return in case of error
    try {
        const res = await page.goto(imgUrl, { waitUntil: 'load' });
        if (res != null)
            if (res.status() >= 400) {
                imgCode = res.status();
                console.log(`\tError ${imgCode} while downloading ${pageNum}.jpg`);
            } else {
                fs.writeFileSync(outPath + '.jpeg', new Uint8Array(await res.buffer()));
                paths.backgroundImage = outPath + '.jpeg';
            }
    } catch (e) { console.log(e); }

    return paths;
    //Return a string containing a number with leading zeros, always 4 characters long
    function pageNumFixed(n: number) {
        switch (n.toString().length) {
            case 1:
                return `000${n}`;
            case 2:
                return `00${n}`;
            case 3:
                return `0${n}`;
            case 4:
                return `${n}`;
        }
    }
}

//Combine a .jpeg image and some .svg text to form a .html page. Return the path to that page or null in case of an error
function generateHTML(paths: HTMLPage, page: number) {
    const outPath = `./html/${page}.html`;
    if (paths.backgroundImage !== undefined && paths.fontFile !== undefined) {  //Both background and text
        const html = `<!DOCTYPE html> <html> <head>
        <title>Pagina ${page}</title> 
        <style> html, body { height: 100%; margin: 0; padding: 0; } .background { position: relative; height: 100%; width: 100%; } .background img,object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; } </style> </head> <body> <div class="background">
        <img draggable="false" src="../${paths.backgroundImage}">
        <object type="image/svg+xml" data="../${paths.fontFile}"></object>
        </div> </body> </html>`;

        fs.writeFileSync(outPath, html);
        return outPath;
    } else if (paths.backgroundImage !== undefined) {   //Only background, no text
        const html = `<!DOCTYPE html> <html> <head>
        <title>Pagina ${page}</title> 
        <style> html, body { height: 100%; margin: 0; padding: 0; } .background { position: relative; height: 100%; width: 100%; } .background img,object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; } </style> </head> <body> <div class="background">
        <img draggable="false" src="../${paths.backgroundImage}">
        </div> </body> </html>`;

        fs.writeFileSync(outPath, html);
        return outPath;
    } else if (paths.fontFile !== undefined) {  //Only text no background (unlikely)
        const html = `<!DOCTYPE html> <html> <head>
        <title>Pagina ${page}</title> 
        <style> html, body { height: 100%; margin: 0; padding: 0; } .background { position: relative; height: 100%; width: 100%; } .background img,object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; } </style> </head> <body> <div class="background">
        <object type="image/svg+xml" data="../${paths.fontFile}"></object>
        </div> </body> </html>`;

        fs.writeFileSync(outPath, html);
        return outPath;
    }

    return null;
}

async function genereatePDF(fileName: string, paths: string[]) {
    fileName += '.pdf';
    console.log(fileName)
    console.log(paths)
}

interface HTMLPage {
    backgroundImage?: string,
    fontFile?: string
}