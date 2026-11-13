import { build } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const output = new URL('../out/meadow-enemy-study/', root);
const result = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    minify: false,
    lib: { entry: new URL('viewer.js', root).pathname, formats: ['es'], fileName: 'meadow-enemies' },
  },
});
const [bundle] = result;
const [script] = bundle.output;
const page = await readFile(new URL('page.html', root), 'utf8');
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), page.replace(
  '<script type="module" src="./viewer.js"></script>',
  () => '<script type="module">\n' + script.code + '\n</script>',
));
console.log(new URL('index.html', output).pathname);
