// Paths: set TRILIUM_ROOT (a Trilium checkout with node_modules) and
// PLAYWRIGHT_CHROME (chromium executable) or rely on the defaults below.
const TRILIUM = process.env.TRILIUM_ROOT ?? new URL('../../../trilium', import.meta.url).pathname;
const CHROME = process.env.PLAYWRIGHT_CHROME ?? process.env.HOME + '/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const { chromium } = await import(TRILIUM + '/node_modules/playwright-core/index.mjs');
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.setContent(`<div id="pane" style="width:600px;height:500px"><div class="render-container" style="height:100%"></div></div>`);
await page.addScriptTag({ path: new URL('./package/dist/mermaid.min.js', import.meta.url).pathname });
const demoBar = `gantt
    title Git Issues - days since last update
    dateFormat  X
    axisFormat %s

    section Issue19062
    71   : 0, 71
    section Issue7441
    9    : 0, 9`;
const res = await page.evaluate(async (txt) => {
    mermaid.initialize({ startOnLoad: false, gantt: { useMaxWidth: false } });
    const c = document.querySelector('.render-container');
    const { svg } = await mermaid.render('g1', txt);
    c.innerHTML = svg;
    const svgEl = c.querySelector('svg');
    const whole = svgEl.getBBox();
    const today = svgEl.querySelector('.today');
    const grid = svgEl.querySelector('.grid');
    const todayBox = today ? today.getBBox() : null;
    // bbox without today line
    if (today) today.remove();
    const without = svgEl.getBBox();
    return {
        viewBox: svgEl.getAttribute('viewBox'),
        wholeBBox: { w: Math.round(whole.width), x: Math.round(whole.x) },
        todayBBox: todayBox ? { x: Math.round(todayBox.x), w: Math.round(todayBox.width) } : null,
        bboxWithoutToday: { w: Math.round(without.width) },
        hasGrid: !!grid,
    };
}, demoBar);
console.log(JSON.stringify(res, null, 2));
await browser.close();
