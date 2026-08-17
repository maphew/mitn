/* Repro attempt for TriliumNext/Trilium issue 10680: stuck icon-picker tooltip.
 * Drives the web client at 127.0.0.1:8090 (dev server, fixture DB, no auth).
 * Steps per drafts/issue10680-emoji-tooltip/report.md "live repro checklist".
 */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

    const log = (...a) => console.log("[step]", ...a);

    await page.goto("http://127.0.0.1:8090/#root/qlLRRwU3qlkR");
    const iconButton = page.locator(".note-icon-widget button.note-icon").locator("visible=true").first();
    await iconButton.waitFor({ timeout: 60000 });
    log("app loaded, note open");

    // Open the icon picker dropdown
    await iconButton.click();
    await page.waitForSelector(".icon-list span.tn-icon", { timeout: 15000 });
    log("icon picker open, grid rendered");

    // Hover an icon until its (delegated, animation:false) tooltip appears
    const firstIcon = page.locator(".icon-list span.tn-icon").nth(3);
    const hoveredTitle = await firstIcon.getAttribute("title");
    await firstIcon.hover();
    await page.waitForTimeout(600);
    const shownBefore = await page.evaluate(() =>
        [...document.querySelectorAll(".tooltip")].map((t) => ({
            text: t.textContent,
            parent: t.parentElement && t.parentElement.tagName,
            visible: t.offsetParent !== null || getComputedStyle(t).position === "absolute",
        }))
    );
    log("hovered icon title:", JSON.stringify(hoveredTitle));
    log("tooltips after hover:", JSON.stringify(shownBefore));
    if (!shownBefore.length) {
        log("NO TOOLTIP APPEARED ON HOVER - cannot proceed to stuck check");
    }

    // Type into the search box so the grid re-renders under the pointer
    await page.locator("input[name=icon-search]").pressSequentially("arrow", { delay: 60 });
    await page.waitForTimeout(800);

    const afterType = await page.evaluate(() => {
        const tips = [...document.querySelectorAll(".tooltip")];
        return tips.map((t) => {
            const id = t.getAttribute("id");
            const trigger = id ? document.querySelector(`[aria-describedby="${id}"]`) : null;
            return {
                text: t.textContent,
                parent: t.parentElement && t.parentElement.tagName,
                triggerStillInDom: !!trigger,
            };
        });
    });
    log("tooltips after typing in search:", JSON.stringify(afterType));

    // Close the picker (Escape), click elsewhere, switch note
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.click("body", { position: { x: 700, y: 500 } });
    await page.waitForTimeout(300);
    const afterClose = await page.evaluate(() =>
        [...document.querySelectorAll(".tooltip")].map((t) => ({
            text: t.textContent,
            parent: t.parentElement && t.parentElement.tagName,
            rect: t.getBoundingClientRect(),
        }))
    );
    log("tooltips after closing picker + clicking around:", JSON.stringify(afterClose));

    const verdict = afterClose.length > 0 ? "REPRODUCED: orphan tooltip persists" : "NOT reproduced: no tooltip left";
    console.log("VERDICT:", verdict);

    await page.screenshot({ path: __dirname + "/repro10680-final.png" });
    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
