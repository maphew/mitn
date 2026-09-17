// Mimics duplicate.spec.ts under CDP CPU throttling.
// Usage: node repro-click.cjs <worktree> [cpuRate] [runs] [exact] [baseUrl]
const path = require("path");
const worktree = process.argv[2];
const rate = Number(process.argv[3] ?? 1);
const runs = Number(process.argv[4] ?? 3);
const exact = process.argv[5] === "exact";
const base = process.argv[6] ?? "http://127.0.0.1:8391";
const { chromium } = require(path.join(worktree, "node_modules/@playwright/test"));

async function probe(page) {
    return page.evaluate(() => {
        const titles = [...document.querySelectorAll(".tree-wrapper .fancytree-title")];
        const hits = titles.filter((el) => /note map/i.test(el.textContent ?? ""));
        return {
            hash: location.hash,
            titleCount: titles.length,
            active: document.querySelector(".tree-wrapper .fancytree-active .fancytree-title")?.textContent ?? null,
            noteMapHits: hits.map((el) => `${el.textContent}${el.offsetParent ? "" : " (hidden)"}`),
            tabs: [...document.querySelectorAll(".note-tab .note-tab-title")].map((el) => el.textContent),
            menuOpen: !!document.querySelector("#context-menu-container .dropdown-item")
        };
    });
}

(async () => {
    const browser = await chromium.launch();
    for (let i = 0; i < runs; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate });
        const t0 = Date.now();
        await page.goto(`${base}/#root/Q5abPvymDH6C/2VammGGdG6Ie`, { waitUntil: "networkidle", timeout: 120000 });
        const tree = page.locator(".tree-wrapper");
        let outcome = "ok";
        try {
            await tree.getByText("Note map", { exact }).first().click({ button: "right", timeout: 30000 });
            await page.locator("#context-menu-container").getByText("Duplicate").click({ timeout: 15000 });
            await tree.getByText("Note map (dup)").first().waitFor({ state: "visible", timeout: 15000 });
        } catch (e) {
            outcome = String(e.message).split("\n").slice(0, 4).join(" | ").slice(0, 400);
        }
        console.log(JSON.stringify({ run: i, rate, exact, ms: Date.now() - t0, outcome, state: await probe(page) }));
        await context.close();
    }
    await browser.close();
})();
