// @ts-check
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';

/** The terms of the `wax-*` elements in Spanish: the same keys as `en.js` (a test checks it) */
const translation = {
  $code: 'es',
  $name: 'Español',
  $dir: 'ltr',
  waxCancel: 'Cancelar',
  waxDrag: 'Arrastrar para ordenar',
  waxMapUnavailable: 'El mapa no está disponible',
  waxMinutes: (/** @type {number} */ n) => `${n} min`,
  waxMove: 'Mover (flechas arriba y abajo)',
  waxNew: 'Nuevo',
  waxNo: 'No',
  waxNoAll: 'No a todos',
  waxNoMatches: 'Sin coincidencias',
  waxProgress: (/** @type {number} */ n, /** @type {number} */ total) => `${n} de ${total}`,
  waxSearch: 'Buscar...',
  waxYes: 'Sí',
  waxYesAll: 'Sí a todos'
};

registerTranslation(translation);

export default translation;
