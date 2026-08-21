/* Retest issue 10663 duplicated-text symptom on upstream/main 86a9715b09
 * (post-52d17ef27a mention rewrite, post-PR-11063 anchor fix).
 * Same flow as drafts/issue10663-android-links/repro/repro10663b.js:
 * clear + settle before throttling, froca-cold mention target, keyboard pick. */
const { chromium } = require("/home/mhw/dev/mitn/.worktrees/trilium/issue10663-retest/node_modules/playwright-core");

const NOTE_URL = "http://127.0.0.1:8391/#root/rwOi5VYPDjkm/FYKD4wH4LjEb";
const TARGET_TITLE = "Themes";
const TARGET_ID = "_help_Wy267RK4M69c";

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

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
        offline: false, latency: 4000, downloadThroughput: -1, uploadThroughput: -1,
    });

    await page.keyboard.type("AAA ", { delay: 30 });
    await page.keyboard.type(`@${TARGET_TITLE}`, { delay: 40 });
    await page.waitForSelector(".ck-mentions, .ck-mention-balloon", { timeout: 30000 });
    const row = page.locator(".ck-mention-balloon .ck-list__item, .ck-mentions .ck-list__item")
        .filter({ hasText: TARGET_TITLE }).filter({ hasNotText: "Create and link" }).first();
    await row.waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);

    const cold = await page.evaluate((id) => !!window.glob?.froca?.notes?.[id], TARGET_ID);
    console.log("froca has target before pick:", cold);

    const rows = await page.evaluate(() =>
        [...document.querySelectorAll(".ck-mention-balloon .ck-list__item, .ck-mentions .ck-list__item")]
            .map((li) => li.textContent.trim()));
    const idx = rows.findIndex((t) => t.includes(TARGET_TITLE) && !t.includes("Create and link"));
    console.log("rows:", JSON.stringify(rows), "-> picking index", idx);
    for (let i = 0; i < idx; i++) await page.keyboard.press("ArrowDown");
    console.log("--- pressing Enter now ---");
    await page.keyboard.press("Enter");
    await page.keyboard.type(" BBB CCC DDD", { delay: 40 });

    for (let t = 1; t <= 12; t++) {
        await page.waitForTimeout(1000);
        const html = await page.evaluate(() => document.querySelector(".ck-editor__editable").innerHTML);
        console.log(`[t+${t}s] editor:`, JSON.stringify(html.slice(0, 600)));
    }

    // Verdict: count occurrences of each typed token in the final text
    const text = await page.evaluate(() => document.querySelector(".ck-editor__editable").innerText);
    const counts = Object.fromEntries(["AAA", "BBB", "CCC", "DDD", TARGET_TITLE]
        .map((w) => [w, (text.match(new RegExp(w, "g")) || []).length]));
    console.log("FINAL TEXT:", JSON.stringify(text));
    console.log("TOKEN COUNTS:", JSON.stringify(counts));
    const dup = ["AAA", "BBB", "CCC", "DDD"].some((w) => counts[w] > 1);
    console.log(dup ? "VERDICT: DUPLICATION REPRODUCED" : "VERDICT: no duplication");

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
