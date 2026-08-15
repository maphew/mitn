// Paths: set TRILIUM_ROOT (a Trilium checkout with node_modules) and
// PLAYWRIGHT_CHROME (chromium executable) or rely on the defaults below.
const TRILIUM = process.env.TRILIUM_ROOT ?? new URL('../../../trilium', import.meta.url).pathname;
const CHROME = process.env.PLAYWRIGHT_CHROME ?? process.env.HOME + '/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const { chromium } = await import(TRILIUM + '/node_modules/playwright-core/index.mjs');
// Standalone repro of TriliumNext issue 9749: Gantt/bar (xychart) diagrams
// vanish when the split-view divider is dragged.
//
// Replicates the exact sequence of apps/client/src/widgets/type_widgets/helpers/SvgSplitEditor.tsx
// useResizer() at commit 372a749ff2, using the same libraries from the trilium
// node_modules (mermaid 11.9.0 installed, svg-pan-zoom 3.6.2).
//
// Sequence per width change (React effect order):
//   1. effect1 cleanup: lastPanZoom = {pan,zoom}; instance.destroy()
//   2. effect1 body:    instance = svgPanZoom(svgEl, {...}); restore zoom+pan (same note)
//   3. effect2 body:    instance.resize().fit().center()
// Initial mount: instance = svgPanZoom(...); instance.resize().center().fit()


const MERMAID_JS = '/tmp/claude-1000/-var-home-matt-dev-mitn/539dd615-82fc-4dcf-a482-02eaffdcfa0a/scratchpad/repro/package/dist/mermaid.min.js';
const SPZ_JS = TRILIUM + '/node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js';

const DIAGRAMS = {
    flowchart: `graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Not OK]`,
    gantt: `gantt\n    title A Gantt Diagram\n    dateFormat YYYY-MM-DD\n    section Section\n        A task卡: a1, 2014-01-01, 30d\n        Another task: after a1, 20d`,
    xychart: `xychart-beta\n    title "Sales Revenue"\n    x-axis [jan, feb, mar]\n    y-axis "Revenue" 4000 --> 11000\n    bar [5000, 6000, 7500]\n    line [5000, 6000, 7500]`,
};
// (typo guard: remove stray non-ascii)
DIAGRAMS.gantt = DIAGRAMS.gantt.replace('卡', '');

const browser = await chromium.launch({
    executablePath: CHROME,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.setContent(`<!doctype html><html><head><style>
  html,body{margin:0;height:100%;}
  #pane{width:600px;height:500px;border:1px solid red;}
  .render-container{height:100%;}
  .render-container svg{width:100%;height:100%;max-width:100% !important;}
</style></head><body><div id="pane"><div class="render-container"></div></div></body></html>`);
await page.addScriptTag({ path: MERMAID_JS });
await page.addScriptTag({ path: SPZ_JS });

const results = await page.evaluate(async (diagrams) => {
    const out = {};
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'antiscript',
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        class: { useMaxWidth: false },
        state: { useMaxWidth: false },
        pie: { useMaxWidth: true },
        journey: { useMaxWidth: false },
        gitGraph: { useMaxWidth: false },
    });

    const pane = document.getElementById('pane');
    const container = pane.querySelector('.render-container');

    function measure(svgEl) {
        const svgRect = svgEl.getBoundingClientRect();
        const vp = svgEl.querySelector('.svg-pan-zoom_viewport');
        const vpRect = vp ? vp.getBoundingClientRect() : null;
        const paneRect = pane.getBoundingClientRect();
        // visible = viewport content rect intersects the pane rect with non-trivial area
        let visible = false, interArea = 0;
        if (vpRect && vpRect.width > 0 && vpRect.height > 0) {
            const ix = Math.max(0, Math.min(vpRect.right, paneRect.right) - Math.max(vpRect.left, paneRect.left));
            const iy = Math.max(0, Math.min(vpRect.bottom, paneRect.bottom) - Math.max(vpRect.top, paneRect.top));
            interArea = ix * iy;
            visible = interArea > 25;
        }
        return {
            svgAttrs: {
                width: svgEl.getAttribute('width'),
                height: svgEl.getAttribute('height'),
                viewBox: svgEl.getAttribute('viewBox'),
                style: svgEl.getAttribute('style'),
            },
            svgRect: { w: Math.round(svgRect.width), h: Math.round(svgRect.height) },
            vpTransform: vp ? vp.getAttribute('transform') : null,
            vpRect: vpRect ? { x: Math.round(vpRect.x), y: Math.round(vpRect.y), w: Math.round(vpRect.width), h: Math.round(vpRect.height) } : null,
            visible, interArea: Math.round(interArea),
        };
    }

    let idc = 0;
    for (const [name, text] of Object.entries(diagrams)) {
        pane.style.width = '600px';
        idc++;
        const { svg } = await mermaid.render(`mermaid-graph-${idc}`, text);
        container.innerHTML = svg; // RawHtmlBlock
        const svgEl = container.querySelector('svg');

        const steps = [];
        steps.push({ step: 'after-render', ...measure(svgEl) });

        // Initial mount (useResizer first effect, no preserved pan/zoom)
        const originalViewBox = svgEl.getAttribute('viewBox');
        let inst = svgPanZoom(svgEl, { zoomEnabled: true, controlIconsEnabled: false });
        inst.resize().center().fit();
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        steps.push({ step: 'after-init-600', ...measure(svgEl) });

        // Simulate divider drag 600 -> 400 in 50px increments; each ResizeObserver
        // tick runs the destroy/recreate/restore + resize().fit().center() sequence.
        let lastPanZoom = null;
        for (const w of [550, 500, 450, 400]) {
            pane.style.width = w + 'px';
            // effect1 cleanup
            lastPanZoom = { pan: inst.getPan(), zoom: inst.getZoom() };
            inst.destroy();
            if (originalViewBox) svgEl.setAttribute('viewBox', originalViewBox); // FIX VARIANT 2
            // effect1 body (same note => restore)
            inst = svgPanZoom(svgEl, { zoomEnabled: true, controlIconsEnabled: false });
            inst.zoom(lastPanZoom.zoom);
            inst.pan(lastPanZoom.pan);
            // effect2 body
            inst.resize().fit().center();
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            steps.push({ step: 'after-drag-' + w, ...measure(svgEl) });
        }
        out[name] = steps;
        inst.destroy();
    }
    return out;
}, DIAGRAMS);

for (const [name, steps] of Object.entries(results)) {
    console.log('\n=== ' + name + ' ===');
    for (const s of steps) {
        console.log(
            s.step.padEnd(16),
            'visible=' + s.visible,
            'vpRect=' + JSON.stringify(s.vpRect),
            'transform=' + s.vpTransform,
            'svgAttrs=' + JSON.stringify(s.svgAttrs)
        );
    }
}

await page.screenshot({ path: new URL('./final.png', import.meta.url).pathname });
await browser.close();
