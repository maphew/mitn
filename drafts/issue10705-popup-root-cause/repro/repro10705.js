/* Repro attempts for TriliumNext/Trilium issue 10705 surfaces reachable in the web client:
 * S1a: launcher-icon tooltip stays visible over the launcher context menu (bucket A)
 * S4:  note-actions dropdown not dismissed by a click inside the pdf.js iframe (bucket B)
 */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));

    // ---------- S1a: launcher tooltip vs context menu ----------
    await page.goto("http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb");
    const launcher = page.locator(".launcher-button").locator("visible=true").first();
    await launcher.waitFor({ timeout: 60000 });
    await page.waitForTimeout(1500);

    await launcher.hover();
    await page.waitForTimeout(700); // bootstrap default show delay is small; static tooltips animation-off
    const tipBefore = await page.evaluate(() =>
        [...document.querySelectorAll(".tooltip")].map((t) => t.textContent.trim()));
    console.log("[S1a] tooltips after hover:", JSON.stringify(tipBefore));

    await launcher.click({ button: "right" });
    await page.waitForTimeout(500);
    const s1 = await page.evaluate(() => {
        const menu = document.querySelector("#context-menu-container");
        const menuVisible = menu && getComputedStyle(menu).display !== "none" && menu.offsetHeight > 0;
        const tips = [...document.querySelectorAll(".tooltip")].map((t) => ({
            text: t.textContent.trim(),
            visible: t.offsetHeight > 0 && getComputedStyle(t).opacity !== "0",
        }));
        return { menuVisible, tips };
    });
    console.log("[S1a] after right-click:", JSON.stringify(s1));
    console.log("VERDICT[S1a]:",
        s1.menuVisible && s1.tips.some((t) => t.visible)
            ? "REPRODUCED: tooltip still shown while context menu open"
            : (s1.menuVisible ? "NOT reproduced: menu open, no tooltip" : "INCONCLUSIVE: menu did not open"));
    await page.screenshot({ path: __dirname + "/repro10705-s1a.png" });
    await page.keyboard.press("Escape");

    // ---------- S4: PDF note, three-dots dropdown vs click into iframe ----------
    await page.goto("http://127.0.0.1:8090/#root/eHI9kKKd3rrU/VXHRFXNiitRJ");
    await page.waitForTimeout(4000); // let the PDF viewer iframe boot
    const pdfFrame = page.locator("iframe").locator("visible=true").first();
    const framePresent = await pdfFrame.count();
    console.log("[S4] pdf iframe present:", framePresent > 0);

    const dots = page.locator(".note-actions button").locator("visible=true").first();
    await dots.waitFor({ timeout: 15000 });
    await dots.click();
    await page.waitForTimeout(400);
    const menuOpen = await page.evaluate(() => {
        const m = [...document.querySelectorAll(".dropdown-menu")].find((el) => el.classList.contains("show"));
        return !!m;
    });
    console.log("[S4] dropdown open after click:", menuOpen);

    // Control: click on the app chrome outside the iframe should close it
    // (skipped - would consume the state; do the iframe click directly)
    const box = await pdfFrame.boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(600);
        const stillOpen = await page.evaluate(() =>
            [...document.querySelectorAll(".dropdown-menu")].some((el) => el.classList.contains("show")));
        console.log("[S4] dropdown still open after clicking inside PDF iframe:", stillOpen);
        console.log("VERDICT[S4]:", stillOpen
            ? "REPRODUCED: click inside pdf.js iframe does not dismiss the dropdown"
            : "NOT reproduced: dropdown closed");
        await page.screenshot({ path: __dirname + "/repro10705-s4.png" });

        // control click outside the iframe
        if (stillOpen) {
            await page.mouse.click(box.x + box.width / 2, 60); // in the app chrome above the iframe
            await page.waitForTimeout(500);
            const afterOutside = await page.evaluate(() =>
                [...document.querySelectorAll(".dropdown-menu")].some((el) => el.classList.contains("show")));
            console.log("[S4] control - still open after clicking app chrome:", afterOutside);
        }
    } else {
        console.log("VERDICT[S4]: INCONCLUSIVE - no iframe bounding box");
    }

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
