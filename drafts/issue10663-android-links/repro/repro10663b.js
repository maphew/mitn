/* Follow-up: isolate the pick-time race. Clear + save settle BEFORE throttling. */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

const NOTE_URL = "http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb";
const TARGET_TITLE = "Themes";
const TARGET_ID = "_help_Wy267RK4M69c";

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
    page.on("request", (r) => {
        if (r.url().includes("/api/")) console.log("[request]", r.method(), r.url().replace("http://127.0.0.1:8090", ""));
    });

    await page.goto(NOTE_URL);
    const editor = page.locator(".ck-editor__editable").locator("visible=true").first();
    await editor.waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000);

    // Clear old content and let the autosave finish while the network is still fast
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(4000);
    console.log("--- content cleared, save settled; enabling 2s latency ---");

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
        offline: false, latency: 2000, downloadThroughput: -1, uploadThroughput: -1,
    });

    await page.keyboard.type("AAA ", { delay: 30 });
    await page.keyboard.type(`@${TARGET_TITLE}`, { delay: 40 });
    await page.waitForSelector(".ck-mentions", { timeout: 30000 });
    const row = page.locator(".ck-mention-balloon .ck-list__item")
        .filter({ hasText: TARGET_TITLE }).filter({ hasNotText: "Create and link" }).first();
    await row.waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);

    const cold = await page.evaluate((id) => !!window.glob?.froca?.notes?.[id], TARGET_ID);
    console.log("froca has target before pick:", cold);

    const rows = await page.evaluate(() =>
        [...document.querySelectorAll(".ck-mention-balloon .ck-list__item")].map((li) => li.textContent.trim()));
    const idx = rows.findIndex((t) => t.includes(TARGET_TITLE) && !t.includes("Create and link"));
    console.log("rows:", JSON.stringify(rows), "-> picking index", idx);
    for (let i = 0; i < idx; i++) await page.keyboard.press("ArrowDown");
    console.log("--- pressing Enter now ---");
    await page.keyboard.press("Enter");
    await page.keyboard.type(" BBB CCC DDD", { delay: 40 });

    for (let t = 1; t <= 6; t++) {
        await page.waitForTimeout(1000);
        const html = await page.evaluate(() => document.querySelector(".ck-editor__editable").innerHTML);
        console.log(`[t+${t}s] editor:`, JSON.stringify(html.slice(0, 600)));
    }

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
