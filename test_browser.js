const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));
    
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Navigation timeout or error', e));
    
    const bodyText = await page.evaluate(() => document.body.innerHTML.substring(0, 100));
    console.log('Body snippet:', bodyText);
    
    await browser.close();
})();
