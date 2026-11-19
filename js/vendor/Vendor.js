// @ts-check
/**
 * Copias generadas: lleva una carpeta de otro repositorio a este, la deja con un MANIFEST.json y comprueba que nadie la toque a mano.
 *
 * Cada fichero vive en un solo repositorio; quien lo usa lleva una COPIA GENERADA, que no se edita: se cambia en el repositorio de
 * origen, se guarda alli y se vuelve a generar. El manifiesto dice de que repositorio y commit sale, la lista de ficheros y la
 * huella (sha256) de cada uno; `problemsOf` dice lo que no cuadra y una prueba de quien usa la copia falla si no esta vacio.
 *
 * Rechaza copiar de un repositorio con cambios sin guardar en lo que copia: la copia diria un commit que no es lo que contiene.
 *
 * Solo para Node (no se carga en el navegador).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

export const MANIFEST = 'MANIFEST.json';
/** Lo que no se copia nunca: pruebas y dependencias */
export const NEVER_COPIED = ['test', 'node_modules'];

/**
 * @typedef {object} Copy Una carpeta que se trae de otro repositorio
 * @property {string} repo El nombre del repositorio de origen (su carpeta, hermana de la de quien copia)
 * @property {string} path La carpeta dentro de ese repositorio (`js/text`)
 * @property {string} out La carpeta de destino, relativa a la raiz de quien copia (`lib/text`)
 * @property {string[]} [exclude] Nombres de ficheros o carpetas que no se copian, ademas de `NEVER_COPIED`
 * @property {string[]} [own] Ficheros que se escriben a mano en la copia: no salen del origen, se conservan al regenerar y no van en el manifiesto
 */

/** @param {Buffer | string} content @returns {string} Su huella sha256 en hexadecimal */
export const hashOf = content => createHash('sha256').update(content).digest('hex');

/**
 * @param {string} dir
 * @returns {string[]} Todos los ficheros de la carpeta y sus subcarpetas, con la ruta relativa, ordenados
 */
const filesIn = dir => readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => relative(dir, join(entry.parentPath, entry.name)))
  .sort();

/**
 * @param {string} dir La carpeta de origen
 * @param {string[]} exclude Nombres que no se copian (en cualquier nivel)
 * @returns {string[]} Los ficheros que se copian: todos menos los que tienen un componente excluido en su ruta
 */
export const sourcesIn = (dir, exclude = []) => filesIn(dir).filter(name => !name.split('/').some(part => [...NEVER_COPIED, ...exclude].includes(part)));

/**
 * @param {string} dir La copia
 * @param {string[]} [own] Los ficheros a mano que no van en el manifiesto
 * @returns {string[]} Lo que no cuadra con el manifiesto: ficheros cambiados, que faltan o que no estan en la lista; vacio si todo cuadra
 */
export function problemsOf(dir, own = []) {
  const manifestPath = join(dir, MANIFEST);
  if (!existsSync(manifestPath)) return [`falta ${MANIFEST}`];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const problems = [];
  const listed = new Set(Object.keys(manifest.files));
  for (const [name, hash] of Object.entries(manifest.files)) {
    const path = join(dir, name);
    if (!existsSync(path)) problems.push(`falta ${name}`);
    else if (hashOf(readFileSync(path)) !== hash) problems.push(`${name} no es el de la copia`);
  }
  for (const name of filesIn(dir)) if (!listed.has(name) && name !== MANIFEST && !own.includes(name)) problems.push(`${name} no esta en el manifiesto`);
  return problems;
}

/**
 * Genera una copia.
 * @param {Copy} copy
 * @param {string} repoDir La carpeta del repositorio de origen
 * @param {string} root La raiz de quien copia
 * @returns {{ count: number, commit: string }}
 */
export function vendor(copy, repoDir, root) {
  const source = join(repoDir, copy.path);
  if (!existsSync(source)) throw new Error(`No existe ${copy.path} en ${repoDir}`);
  const git = (/** @type {string[]} */ ...args) => execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8' });
  const dirty = git('status', '--porcelain', '--untracked-files=all', '--', copy.path).trim();
  if (dirty) throw new Error(`${copy.path} tiene cambios sin guardar en ${repoDir}:\n${dirty}`);
  const commit = git('rev-parse', 'HEAD').trim();
  const names = sourcesIn(source, copy.exclude);
  const out = join(root, copy.out);
  const own = copy.own ?? [];
  const kept = own.map(name => /** @type {[string, Buffer | null]} */ ([name, existsSync(join(out, name)) ? readFileSync(join(out, name)) : null]));
  rmSync(out, { recursive: true, force: true });
  /** @type {Record<string, string>} */
  const files = {};
  for (const name of names) {
    mkdirSync(dirname(join(out, name)), { recursive: true });
    copyFileSync(join(source, name), join(out, name));
    files[name] = hashOf(readFileSync(join(out, name)));
  }
  for (const [name, content] of kept) if (content) {
    mkdirSync(dirname(join(out, name)), { recursive: true });
    writeFileSync(join(out, name), content);
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, MANIFEST), JSON.stringify({ source: copy.repo, path: copy.path, commit, files }, null, 2) + '\n');
  return { count: names.length, commit };
}

/**
 * Lo que hace el `tools/vendor.mjs` de quien copia: genera todas sus copias (o las que se nombran).
 * Los repositorios de origen se buscan en `reposDir` (por defecto, al lado de la raiz de quien copia: `../<repo>`); un argumento
 * `nombre=ruta` o la variable `VENDOR_<NOMBRE>` (en mayusculas, con `_` por los guiones) dicen otra ruta.
 * @param {Copy[]} copies
 * @param {string} root La raiz de quien copia
 * @param {string[]} args Los argumentos de la linea de ordenes: nombres de carpetas de destino (`lib/text`) y `nombre=ruta`
 * @param {string} [reposDir] La carpeta que tiene los repositorios de origen, si la raiz de quien copia no esta justo dentro de ella
 */
export function run(copies, root, args, reposDir = join(root, '..')) {
  const paths = Object.fromEntries(args.filter(arg => arg.includes('=')).map(arg => arg.split('=', 2)));
  const wanted = args.filter(arg => !arg.includes('='));
  for (const copy of copies) {
    if (wanted.length && !wanted.includes(copy.out)) continue;
    const env = process.env[`VENDOR_${copy.repo.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`];
    const repoDir = resolve(paths[copy.repo] ?? env ?? join(reposDir, copy.repo));
    const { count, commit } = vendor(copy, repoDir, root);
    console.log(`${copy.out}: ${count} ficheros de ${basename(repoDir)}/${copy.path} @ ${commit.slice(0, 12)}`);
  }
}
