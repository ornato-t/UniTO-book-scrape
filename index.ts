import puppeteer, { Page } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const { USERNAME, PWD, BOOK } = config();

const browser = await puppeteer.launch();
const page = await browser.newPage();

await login(page, USERNAME, PWD);

//Create new output dir. Pass if command fails (dir already exists)
// deno-lint-ignore no-empty
try { await Deno.mkdir("output"); } catch (_e) { }

let pageNum = 0;
let res = 200;
while (res === 200) {
    pageNum++;
    res = await downloadPage(page, BOOK, pageNum);
}

console.log(`Execution stopped at page ${pageNum} with code ${res}`);

await browser.close();

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
async function downloadPage(page: Page, bookCode: string, pageNum: number) {
    const imgUrl = `https://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-html5-substrates/page${pageNumFixed(pageNum)}_1.jpg?uni=557d76170c245168845e5673708d98fd`;
    const textUrl = `http://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-vectorlayers/${pageNumFixed(pageNum)}.svg?uni=557d76170c245168845e5673708d98fd`;
    const outPath = `output/${pageNum}`;

    //Set handler for image responses
    page.on('response', async response => {
        //Save images
        if (response.url().includes('.jpg')) {
            const img = await response.arrayBuffer();

            try {
                await Deno.writeFile(outPath + '.jpeg', new Uint8Array(img));
                console.log("Written to", outPath + '.jpeg')
            } catch (e) { console.log(e.message) }
        }
    });

    //Fetch text page and download it, return in case of error
    try {
        const res = await page.goto(textUrl, { waitUntil: 'networkidle0' });
        if (res == null) return -1;
        if (res.status() >= 400) return res.status();

        Deno.writeTextFileSync(outPath + '.svg', await page.content());
        console.log("Written to", outPath + '.svg')
    } catch (e) { console.log(e.message); }

    //Fetch image page, handler will download it, return in case of error
    try {
        const res = await page.goto(imgUrl, { waitUntil: 'load' });
        if (res == null) return -1;
        if (res.status() >= 400) return res.status();
    } catch (e) { console.log(e.message); }

    return 200;

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
