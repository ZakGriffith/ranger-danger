import { build } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = new URL('./', import.meta.url);
const output = new URL('../out/infected-enemy-study/', source);
const [result] = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    minify: false,
    lib: { entry: new URL('viewer.js', source).pathname, formats: ['es'], fileName: 'infected-enemies' },
  },
});
const [script] = result.output;
const page = await readFile(new URL('page.html', source), 'utf8');
await mkdir(output, { recursive: true });
const index = new URL('index.html', output);
await writeFile(index, page.replace(
  '<script type="module" src="./viewer.js"></script>',
  () => `<script type="module">\n${script.code}\n</script>`,
));
console.log(index.pathname);
