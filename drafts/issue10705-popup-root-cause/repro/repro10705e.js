/* 10705 S1b: launcher tooltip re-shown by focus after its dialog closes (5d99e3b02d untested path). */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto("http://127.0.0.1:8090/");
    await page.locator(".launcher-button").locator("visible=true").first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1500);

    // Recent Changes launcher wears bx-history
    const recent = page.locator(".launcher-button.bx-history").locator("visible=true").first();
    if (!(await recent.count())) { console.log("VERDICT[S1b]: INCONCLUSIVE - Recent Changes launcher not found"); await browser.close(); return; }

    await recent.hover();
    await page.waitForTimeout(500);
    console.log("[S1b] tooltip while hovering:", await page.evaluate(() =>
        [...document.querySelectorAll(".tooltip")].map((t) => t.textContent.trim())));

    await recent.click();
    await page.waitForTimeout(1500);
    const dialogOpen = await page.evaluate(() => !!document.querySelector(".modal.show"));
    console.log("[S1b] dialog open after click:", dialogOpen);
    const tipsWhileOpen = await page.evaluate(() =>
        [...document.querySelectorAll(".tooltip")].filter((t) => t.offsetHeight > 0).map((t) => t.textContent.trim()));
    console.log("[S1b] visible tooltips while dialog open:", JSON.stringify(tipsWhileOpen));

    // Move pointer away from the button, then close the dialog: focus returns to the button
    await page.mouse.move(700, 450);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => ({
        dialogStillOpen: !!document.querySelector(".modal.show"),
        tips: [...document.querySelectorAll(".tooltip")].filter((t) => t.offsetHeight > 0).map((t) => t.textContent.trim()),
        focused: document.activeElement && (document.activeElement.className || document.activeElement.tagName),
    }));
    console.log("[S1b] after closing dialog:", JSON.stringify(after));
    console.log("VERDICT[S1b]:", after.tips.length
        ? "REPRODUCED: tooltip re-shown after dialog close (focus trigger)"
        : "NOT reproduced: no tooltip after dialog close");
    await page.screenshot({ path: __dirname + "/repro10705-s1b.png" });
    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
