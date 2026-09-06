/* Live check for TriliumNext/Trilium PR 11321: find-in-note results for link widgets.
 * Drives the dev web client (fixture DB, no auth) and reports whether widget results
 * receive the .ck-find-result classes and a visible background.
 * Usage: node repro-11321.js <port> <playwright-core dir> <noteId> <refNoteId>
 */
const [port, pwDir, noteId, refNoteId] = process.argv.slice(2);
const { chromium } = require(pwDir);

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
    const log = (...a) => console.log("[step]", ...a);

    await page.goto(`http://127.0.0.1:${port}/#root/${noteId}`);
    const editable = page.locator(".note-detail-editable-text-editor").locator("visible=true").first();
    await editable.waitFor({ timeout: 90000 });
    await page.waitForTimeout(1500);
    log("editor visible");

    const theme = await page.evaluate(() => document.body.className);
    log("body classes:", theme);

    await page.evaluate((refNoteId) => {
        const el = [...document.querySelectorAll(".note-detail-editable-text-editor")]
            .find((e) => e.offsetParent !== null);
        const editor = el.ckeditorInstance;
        editor.setData(
            `<p>Plain Operations here. <a class="reference-link" href="#root/${refNoteId}">x</a> tail.</p>` +
            `<p>Mention: <span class="link-mention" data-url="https://example.com/page" data-embed-type="opengraph" data-title="Mention Operations"></span> end.</p>` +
            `<section class="link-embed" data-url="https://example.com/card" data-embed-type="opengraph" data-title="Card Operations" data-description="Card description text" data-site-name="Example Site"></section>` +
            `<p>Second plain Operations.</p>`
        );
    }, refNoteId);
    await page.waitForTimeout(2000);

    const refText = await page.evaluate(() => {
        const a = document.querySelector(".note-detail-editable-text-editor a.reference-link");
        return a ? a.textContent : null;
    });
    log("reference link rendered text:", JSON.stringify(refText));
    const term = refText && refText.trim().split(/\s+/).slice(-1)[0];
    log("search term:", term);

    await page.evaluate(() => glob.appContext.triggerCommand("findInText"));
    const input = page.locator(".find-widget-search-term-input").locator("visible=true").first();
    await input.waitFor({ timeout: 10000 });
    await input.fill("");
    await input.pressSequentially(term, { delay: 40 });
    await page.waitForTimeout(1200);

    const report = async (label) => {
        const r = await page.evaluate(() => {
            const vis = (sel) => [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null);
            const total = vis(".find-widget-total-found")?.textContent;
            const current = vis(".find-widget-current-found")?.textContent;
            const rulesFor = (el) => {
                const out = [];
                for (const sheet of document.styleSheets) {
                    let rules; try { rules = sheet.cssRules; } catch { continue; }
                    const walk = (list) => { for (const r of list) {
                        if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; }
                        if (r.selectorText && (r.style.background || r.style.backgroundColor)) {
                            try { if (el.matches(r.selectorText)) out.push(r.selectorText + " => " + (r.style.background || r.style.backgroundColor)); } catch {}
                        }
                    } };
                    walk(rules);
                }
                return out;
            };
            const hits = [...document.querySelectorAll(".note-detail-editable-text-editor .ck-find-result, .note-detail-editable-text-editor .ck-find-result_selected")]
                .map((el) => ({
                    inner: [...el.querySelectorAll("*")].filter((c) => getComputedStyle(c).backgroundColor !== "rgba(0, 0, 0, 0)").slice(0, 4).map((c) => c.tagName + "." + c.className + " bg=" + getComputedStyle(c).backgroundColor),
                    rect: (({x,y,width,height}) => [Math.round(x),Math.round(y),Math.round(width),Math.round(height)])(el.getBoundingClientRect()),
                    tag: el.tagName,
                    cls: el.className,
                    text: (el.textContent || "").slice(0, 40),
                    bg: getComputedStyle(el).backgroundColor,
                    hl: getComputedStyle(el).getPropertyValue("--ck-color-highlight-background").trim(),
                    rules: rulesFor(el)
                }));
            const ref = document.querySelector(".note-detail-editable-text-editor a.reference-link");
            const refInfo = ref && {
                cls: ref.className,
                bg: getComputedStyle(ref).backgroundColor,
                childBg: ref.firstElementChild ? getComputedStyle(ref.firstElementChild).backgroundColor : null,
                display: getComputedStyle(ref).display
            };
            return { total, current, hits, refInfo };
        });
        console.log(`[report:${label}]`, JSON.stringify(r, null, 1));
    };
    await report("after-find");
    await page.screenshot({ path: __dirname + "/repro-11321-find.png" });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    await report("after-next-1");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    await report("after-next-2");
    await page.screenshot({ path: __dirname + "/repro-11321-next.png" });

    await browser.close();
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
