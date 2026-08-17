/* Repro attempt for TriliumNext/Trilium issue 10663: duplicated text after picking a
 * mention suggestion. Desktop no-device check targeting H1 (unanchored async insertion
 * race in ReferenceLinkCommand.execute): artificial network latency stretches the
 * getReferenceLinkTitle round trip; typing during the gap should interleave/duplicate.
 * Control run without throttling first. Distinct cold help-note target per run, since
 * a reference link left in the note content warms its target in froca on page load.
 * Suggestion picked by keyboard (ArrowDown+Enter) to keep editor focus, like a user.
 */
const { chromium } = require("/var/home/matt/dev/mitn/.worktrees/trilium/triage-repro/node_modules/playwright-core");

const NOTE_URL = "http://127.0.0.1:8090/#root/rwOi5VYPDjkm/FYKD4wH4LjEb"; // "Deleting a note with children" (text note)

async function runOnce(label, latencyMs, targetTitle, targetId) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => console.log(`[${label}][pageerror]`, String(e).slice(0, 200)));

    await page.goto(NOTE_URL);
    const editor = page.locator(".ck-editor__editable").locator("visible=true").first();
    await editor.waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000); // let froca settle before throttling

    // Clear leftovers from earlier runs so paragraphs don't merge into old text
    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.waitForTimeout(500);

    if (latencyMs) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", {
            offline: false, latency: latencyMs, downloadThroughput: -1, uploadThroughput: -1,
        });
    }

    const marker = `marker-${label}-${process.pid}`;
    await page.keyboard.type(`${marker}: `, { delay: 30 });

    // Type the mention query and wait for the suggestion balloon
    await page.keyboard.type(`@${targetTitle}`, { delay: 40 });
    try {
        await page.waitForSelector(".ck-mentions", { timeout: 30000 });
        await page.locator(".ck-mention-balloon .ck-list__item")
            .filter({ hasText: targetTitle }).filter({ hasNotText: "Create and link" })
            .first().waitFor({ timeout: 15000 });
    } catch {
        console.log(`[${label}] mention balloon / target row never appeared`);
        await browser.close();
        return null;
    }
    await page.waitForTimeout(600); // let the last query's results land and settle

    const state = await page.evaluate((id) => {
        const rows = [...document.querySelectorAll(".ck-mention-balloon .ck-list__item")]
            .map((li) => li.textContent.trim());
        let frocaHasNote = "unknown";
        try { frocaHasNote = !!window.glob?.froca?.notes?.[id]; } catch {}
        return { frocaHasNote, rows: rows.slice(0, 6) };
    }, targetId);
    console.log(`[${label}] froca has target:`, state.frocaHasNote, "| rows:", JSON.stringify(state.rows));
    const targetIndex = state.rows.findIndex((t) => t.includes(targetTitle) && !t.includes("Create and link"));
    if (targetIndex < 0) { console.log(`[${label}] target row not in list`); await browser.close(); return null; }

    page.on("request", (r) => {
        if (r.url().includes("/api/")) console.log(`[${label}][request]`, r.method(), r.url().replace("http://127.0.0.1:8090", ""));
    });

    // Move the highlight onto the target row, accept, then IMMEDIATELY keep typing
    for (let i = 0; i < targetIndex; i++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.keyboard.type("QUICKFOX", { delay: 35 }); // all inside the latency gap
    await page.waitForTimeout(Math.max(3000, latencyMs * 2 + 1000)); // let async insertion land

    const para = await page.evaluate((mk) => {
        const root = document.querySelector(".ck-editor__editable");
        const p = [...root.querySelectorAll("p")].reverse().find((el) => el.textContent.includes(mk));
        return p ? { text: p.textContent, html: p.innerHTML, links: p.querySelectorAll("a").length } : null;
    }, marker);

    console.log(`[${label}] paragraph text:`, JSON.stringify(para && para.text));
    console.log(`[${label}] paragraph html:`, JSON.stringify(para && para.html));
    await browser.close();
    return { para, targetTitle };
}

function analyze(label, result) {
    if (!result || !result.para) return console.log(`VERDICT[${label}]: no result`);
    const { para, targetTitle } = result;
    const t = para.text;
    const dupTyped = (t.match(/QUICKFOX/g) || []).length;
    const titleCount = t.split(targetTitle).length - 1;
    const typedBeforeLink = /QUICKFOX/.test(t) && t.indexOf("QUICKFOX") < t.indexOf(targetTitle);
    console.log(`VERDICT[${label}]: QUICKFOX x${dupTyped}, title x${titleCount}, links=${para.links}, typed-before-link=${typedBeforeLink}`);
}

(async () => {
    const control = await runOnce("control", 0, "Tree Concepts", "_help_kBrnXNG3Hplm");
    const throttled = await runOnce("slow3g", 2000, "Zen mode", "_help_rC3pL2aptaRE");
    analyze("control", control);
    analyze("slow3g", throttled);
})().catch((e) => { console.error("SCRIPT ERROR:", e); process.exit(1); });
