// Repro for the standalone duplicate.spec.ts failure.
// Usage: node repro.cjs <worktree> [cpuRate] [runs] [baseUrl]
// Loads the spec's URL in a fresh context, under CDP CPU throttling, and
// reports what the tree shows once the network is idle, then polls for 40 s.
const path = require("path");
const worktree = process.argv[2];
const rate = Number(process.argv[3] ?? 1);
const runs = Number(process.argv[4] ?? 3);
const base = process.argv[5] ?? "http://127.0.0.1:8391";
const { chromium } = require(path.join(worktree, "node_modules/@playwright/test"));

async function probe(page) {
    return page.evaluate(() => {
        const titles = [...document.querySelectorAll(".tree-wrapper .fancytree-title")];
        const hits = titles.filter((el) => /note map/i.test(el.textContent ?? ""));
        return {
            hash: location.hash,
            titleCount: titles.length,
            active: document.querySelector(".tree-wrapper .fancytree-active .fancytree-title")?.textContent ?? null,
            noteMapHits: hits.map((el) => `${el.textContent}${el.offsetParent ? "" : " (hidden)"}`)
        };
    });
}

(async () => {
    const browser = await chromium.launch();
    for (let i = 0; i < runs; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const logs = [];
        page.on("console", (m) => { if (/error|fail|warn/i.test(m.type())) logs.push(m.text().slice(0, 200)); });
        page.on("framenavigated", (f) => { if (f === page.mainFrame()) logs.push(`NAV ${f.url()}`); });
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate });
        const t0 = Date.now();
        await page.goto(`${base}/#root/Q5abPvymDH6C/2VammGGdG6Ie`, { waitUntil: "networkidle", timeout: 120000 });
        const atIdle = await probe(page);
        const idleMs = Date.now() - t0;
        // Poll past the spec's 30 s timeout to tell "slow" from "never".
        let visibleAtMs = null;
        let later = atIdle;
        while (Date.now() - t0 < 40000) {
            await page.waitForTimeout(500);
            later = await probe(page);
            if (later.noteMapHits.includes("Note map")) {
                visibleAtMs = Date.now() - t0;
                break;
            }
        }
        console.log(JSON.stringify({ run: i, rate, idleMs, visibleAtMs, atIdle, later, logs }, null, 1));
        await context.close();
    }
    await browser.close();
})();
