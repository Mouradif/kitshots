import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { v1 as uuid } from 'uuid';

async function* search(dir, pattern) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* search(res, pattern);
    } else if (pattern.test(res)) {
      yield res;
    }
  }
}

async function run() {
	const browser = await puppeteer.launch({args: [
    '--disable-notifications',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]});
  for await (const filename of search('kits', /\.html?$/i)) {
		const id = uuid();
		await fs.copyFile(filename, `out/${id}.html`);
		const page = await browser.newPage();
		await page.goto('file://' + filename).catch(e => console.log(`Error: ${filename} not loading\n${e.message}`));
		await page.screenshot({
			fullPage: true,
			path: `out/${id}.png`
		});
		await page.close();
    console.log(`Saved ${id}`);
	}
}

run();
