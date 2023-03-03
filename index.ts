import puppeteer, { Page } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const { USERNAME, PWD, BOOK } = config();
const URL = 'https://my.unito.it'

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto(URL);
await new Promise(r => setTimeout(r, 1000));

await page.type('input[name="j_username"]', USERNAME);
await page.type('input[name="j_password"]', PWD);

await Promise.all([page.waitForNavigation(), page.click('button[name="_eventId_proceed"]')]);

await new Promise(r => setTimeout(r, 3000));

// deno-lint-ignore no-empty
try { await Deno.mkdir("output"); } catch (_e) { }

await downloadPage(page, BOOK, 315);

await browser.close();

//Download a page's text and background
async function downloadPage(page: Page, bookCode: string, pageNum: number) {
    const imgUrl = `https://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-html5-substrates/page0${pageNum}_1.jpg?uni=557d76170c245168845e5673708d98fd`;
    const textUrl = `http://unito.studenti33.it/secure/docs/${bookCode}/HTML//files/assets/common/page-vectorlayers/0${pageNum}.svg?uni=557d76170c245168845e5673708d98fd`;
    const outPath = `output/${pageNum}`

    //Fetch text page and download it
    await page.goto(textUrl);
    await new Promise(r => setTimeout(r, 1000));
    try {
        Deno.writeTextFileSync(outPath + '.svg', await page.content());
        console.log("Written to", outPath + '.svg')
    } catch (e) { console.log(e.message) }

    //Set handler for image responses
    page.on('response', async response => {
        const img = await response.arrayBuffer();
        try {
            await Deno.writeFile(outPath + '.jpeg', new Uint8Array(img));
            console.log("Written to", outPath + '.jpeg')
        } catch (e) { console.log(e.message) }
    });

    //Fetch image page, handler will download it
    await page.goto(imgUrl);
    await new Promise(r => setTimeout(r, 1000));
}
