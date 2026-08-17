/* 10705 remaining web-reachable surfaces:
 * S3: CKEditor link actions balloon persists after switching tabs (bucket D)
 * S6: attribute-editor mention autocomplete stranded after panel closes (bucket D)
 */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));

    await page.goto("http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb");
    const editor = page.locator(".ck-editor__editable").locator("visible=true").first();
    await editor.waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000);

    // ---------- S3: link balloon vs tab switch ----------
    await editor.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("visit https://example.com/s3check now", { delay: 25 });
    await page.waitForTimeout(800);

    // Click inside the auto-linked URL to summon the link actions balloon
    const link = editor.locator("a", { hasText: "example.com" }).first();
    const linkExists = await link.count();
    console.log("[S3] autolink created:", linkExists > 0);
    if (linkExists) {
        await link.click();
        await page.waitForTimeout(800);
        const balloonBefore = await page.evaluate(() =>
            [...document.querySelectorAll(".ck-balloon-panel")].filter((b) =>
                b.classList.contains("ck-balloon-panel_visible")).map((b) => b.textContent.trim().slice(0, 80)));
        console.log("[S3] visible balloons after link click:", JSON.stringify(balloonBefore));

        if (balloonBefore.length) {
            // Switch to another tab by clicking the tab strip
            const otherTab = page.locator(".note-tab, .note-tab-wrapper, [data-tab-id]").locator("visible=true").nth(1);
            const tabCount = await otherTab.count();
            if (tabCount) {
                await otherTab.click();
                await page.waitForTimeout(1200);
                const after = await page.evaluate(() =>
                    [...document.querySelectorAll(".ck-balloon-panel")].filter((b) =>
                        b.classList.contains("ck-balloon-panel_visible") && b.offsetHeight > 0)
                        .map((b) => ({ text: b.textContent.trim().slice(0, 60), rect: b.getBoundingClientRect() })));
                console.log("[S3] visible balloons after tab switch:", JSON.stringify(after));
                console.log("VERDICT[S3]:", after.length
                    ? "REPRODUCED: link balloon persists after tab switch"
                    : "NOT reproduced: balloon gone after tab switch");
                await page.screenshot({ path: __dirname + "/repro10705-s3.png" });
            } else {
                console.log("VERDICT[S3]: INCONCLUSIVE - no second tab to switch to");
            }
        } else {
            console.log("VERDICT[S3]: INCONCLUSIVE - link balloon never appeared");
        }
    }

    // ---------- S6: attribute editor autocomplete stranded ----------
    // Reload to a clean state, then open the attribute editor
    await page.goto("http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb");
    await page.waitForTimeout(3000);
    // The status-bar "N attributes" button opens the attribute panel in the new layout
    const attrToggle = page.locator("text=/\\d+ attributes/").locator("visible=true").first();
    const hasToggle = await attrToggle.count();
    console.log("[S6] attribute toggle found:", hasToggle > 0);
    if (hasToggle) {
        await attrToggle.click();
        await page.waitForTimeout(1000);
        const attrEditor = page.locator(".attribute-list-editor, .attribute-editor .ck-editor__editable, [class*=attribute] .ck-editor__editable")
            .locator("visible=true").first();
        const editorFound = await attrEditor.count();
        console.log("[S6] attribute CK editor visible:", editorFound > 0);
        if (editorFound) {
            await attrEditor.click();
            await page.keyboard.type("#inb", { delay: 60 });
            await page.waitForTimeout(1500);
            const balloons = await page.evaluate(() =>
                [...document.querySelectorAll(".ck-balloon-panel")].filter((b) => b.offsetHeight > 0)
                    .map((b) => ({ text: b.textContent.trim().slice(0, 60), rect: b.getBoundingClientRect() })));
            console.log("[S6] balloons while autocomplete open:", JSON.stringify(balloons));

            // Close the panel while the autocomplete is showing
            await page.keyboard.press("Escape");
            await attrToggle.click().catch(() => {});
            await page.waitForTimeout(1000);
            const stranded = await page.evaluate(() =>
                [...document.querySelectorAll(".ck-balloon-panel")].filter((b) => b.offsetHeight > 0)
                    .map((b) => ({ text: b.textContent.trim().slice(0, 60), rect: { x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y } })));
            console.log("[S6] balloons after closing panel:", JSON.stringify(stranded));
            console.log("VERDICT[S6]:", stranded.length
                ? "REPRODUCED-ish: balloon still visible after panel close (check position)"
                : "NOT reproduced: no stranded balloon");
            await page.screenshot({ path: __dirname + "/repro10705-s6.png" });
        } else {
            console.log("VERDICT[S6]: INCONCLUSIVE - attribute editor not found");
            await page.screenshot({ path: __dirname + "/repro10705-s6-debug.png" });
        }
    } else {
        console.log("VERDICT[S6]: INCONCLUSIVE - attribute toggle not found");
        await page.screenshot({ path: __dirname + "/repro10705-s6-debug.png" });
    }

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
