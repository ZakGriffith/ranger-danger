import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const root = new URL('./', import.meta.url);
const output = new URL('../out/cannon-tower-study/', root);
const [result] = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    minify: false,
    lib: { entry: new URL('viewer.js', root).pathname, formats: ['es'], fileName: 'cannon-tower' },
  },
});
const [script] = result.output;
const template = await readFile(new URL('../arrow-tower-study/page.html', root), 'utf8');
const page = template
  .replaceAll(/Arrow [Tt]ower/g, title => title.replace('Arrow', 'Cannon'))
  .replace('</style>', `
  [data-level="all"] .tier-group + .tier-group { margin-top: 22px; }
  .tier-group .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .tier-title { margin: 0 0 4px; font: 600 11px/1.5 var(--mono); text-transform: uppercase; letter-spacing: .1em; }
  #tiers:not([data-level="all"]) .tier-title { display: none; }
  .tier-group article h2 { font-size: clamp(25px, 2.8vw, 38px); margin: 2px 0 8px; }
  .tier-group[data-tier="0"] .art { background: radial-gradient(ellipse at 49% 37%, #68745a, #334638 78%); }
  .tier-group[data-tier="1"] .art { background: radial-gradient(ellipse at 49% 37%, #68716a, #38443f 78%); }
  .tier-group[data-tier="2"] .art { background: radial-gradient(ellipse at 49% 37%, #786b56, #484635 78%); }
  .tier-group .comparison { margin-top: 7px; }
  @media (max-width: 900px) {
    .tier-group .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 440px) {
    .tier-group .grid { grid-template-columns: minmax(0, 1fr); }
  }
</style>`)
  .replace('    <label>Speed', `    <label>Level <select id="level">
      <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="all">All levels</option>
    </select></label>
    <label>Speed`)
  .replace('fire all three towers', 'fire all visible models')
  .replace('class="grid" id="tiers" aria-label="Cannon tower levels"', 'id="tiers" aria-label="Cannon tower models"')
  .replace('    <h2></h2>\n', '')
  .replace('  <article>\n', '  <article>\n    <h2></h2>\n')
  .replace('<span>Original</span><span>Illustrated</span>', '<span>Pixel art</span><span>This model</span>');
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), page.replace(
  '<script type="module" src="./viewer.js"></script>',
  () => '<script type="module">\n' + script.code + '\n</script>',
));
console.log(new URL('index.html', output).pathname);
