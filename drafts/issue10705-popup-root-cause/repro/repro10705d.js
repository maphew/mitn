/* 10705 final variants: S3 tab switch via command layer; S6 with robust toggle detection. */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // ---------- S3 via activateNextTab command ----------
    await page.goto("http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb");
    const editor = page.locator(".ck-editor__editable").locator("visible=true").first();
    await editor.waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000);

    const link = editor.locator("a", { hasText: "example.com" }).first();
    await link.click();
    await page.waitForTimeout(800);
    const before = await page.evaluate(() => ({
        balloons: [...document.querySelectorAll(".ck-balloon-panel.ck-balloon-panel_visible")].length,
        activeNote: window.glob?.appContext?.tabManager?.getActiveContext()?.note?.title ?? "?",
    }));
    console.log("[S3cmd] before:", JSON.stringify(before));

    const switched = await page.evaluate(async () => {
        const tm = window.glob?.appContext?.tabManager;
        if (!tm) return "no tabManager";
        await window.glob.appContext.triggerCommand("activateNextTab");
        return tm.getActiveContext()?.note?.title ?? "?";
    });
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({
        balloons: [...document.querySelectorAll(".ck-balloon-panel.ck-balloon-panel_visible")]
            .filter((b) => b.offsetHeight > 0)
            .map((b) => ({ text: b.textContent.trim().slice(0, 50), r: b.getBoundingClientRect() })),
        activeNote: window.glob?.appContext?.tabManager?.getActiveContext()?.note?.title ?? "?",
    }));
    console.log("[S3cmd] switched to:", JSON.stringify(switched), "| after:", JSON.stringify(after));
    console.log("VERDICT[S3cmd]:",
        after.activeNote !== before.activeNote
            ? (after.balloons.length ? "REPRODUCED: balloon persists after keyboard-path tab switch"
                                     : "NOT reproduced: balloon dismissed on tab switch")
            : "INCONCLUSIVE: tab did not switch");
    await page.screenshot({ path: __dirname + "/repro10705-s3cmd.png" });

    // ---------- S6 with robust toggle ----------
    await page.goto("http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb");
    await page.waitForTimeout(3000);
    const attrToggle = page.locator("text=/\\d+ attribute/").locator("visible=true").first();
    const n = await attrToggle.count();
    console.log("[S6c] toggle count:", n, n ? await attrToggle.textContent() : "");
    if (!n) { console.log("VERDICT[S6c]: INCONCLUSIVE - toggle not found"); await browser.close(); return; }
    await attrToggle.click();
    await page.waitForTimeout(1200);
    const attrEditor = page.locator(".attribute-list-editor, .attribute-editor .ck-editor__editable, [class*=attribute] .ck-editor__editable")
        .locator("visible=true").first();
    const found = await attrEditor.count();
    console.log("[S6c] attribute editor visible:", found > 0);
    if (!found) { await page.screenshot({ path: __dirname + "/repro10705-s6c-debug.png" }); console.log("VERDICT[S6c]: INCONCLUSIVE"); await browser.close(); return; }
    await attrEditor.click();
    await page.keyboard.type("#inb", { delay: 60 });
    await page.waitForTimeout(1500);
    const open = await page.evaluate(() =>
        [...document.querySelectorAll(".ck-balloon-panel")].filter((b) => b.offsetHeight > 0).length);
    console.log("[S6c] autocomplete open:", open);
    await attrToggle.click(); // close panel directly while autocomplete shows
    await page.waitForTimeout(1200);
    const stranded = await page.evaluate(() =>
        [...document.querySelectorAll(".ck-balloon-panel")].filter((b) => b.offsetHeight > 0)
            .map((b) => ({ text: b.textContent.trim().slice(0, 50), x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y })));
    console.log("[S6c] balloons after close:", JSON.stringify(stranded));
    console.log("VERDICT[S6c]:", stranded.length ? "REPRODUCED: balloon survives panel close" : "NOT reproduced: balloon dismissed");
    await page.screenshot({ path: __dirname + "/repro10705-s6c.png" });

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
