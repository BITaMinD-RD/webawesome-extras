// @ts-check

/**
 * Makes the reference tables of the documentation from custom-elements.json, the way the pages of Web Awesome have theirs: properties and attributes, methods, events, slots, parts and
 * CSS custom properties. Pure: it gives back text and writes nothing; `scripts/docs.mjs` puts it between the markers of each page and a test compares it with what is committed.
 */

export const START = '<!-- api:start -->';
export const END = '<!-- api:end -->';

/** @param {string | undefined} text @returns {string} Text that is safe inside the cell of a table */
const cell = text => (text ?? '').replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();

/** @param {string | undefined} text @returns {string} A piece of code inside a cell, or nothing */
const code = text => (text ? `\`${text.replace(/\|/g, '\\|')}\`` : '');

/**
 * @param {string[]} header
 * @param {string[][]} rows
 * @returns {string}
 */
const table = (header, rows) => [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');

/**
 * @typedef {{name: string, description?: string, type?: {text: string}, default?: string, attribute?: string, kind?: string, static?: boolean, readonly?: boolean,
 *   privacy?: string, parameters?: {name: string, optional?: boolean, type?: {text: string}}[], return?: {type?: {text: string}}}} Member
 * @typedef {{name: string, tagName?: string, customElement?: boolean, description?: string, members?: Member[], events?: {name: string, description?: string, type?: {text: string}}[],
 *   slots?: {name: string, description?: string}[], cssParts?: {name: string, description?: string}[], cssProperties?: {name: string, description?: string}[]}} Declaration
 */

/** @param {{modules: {declarations?: Declaration[]}[]}} manifest @returns {Declaration[]} The custom elements, in the order of the manifest */
export const elementsOf = manifest => manifest.modules.flatMap(module => (module.declarations ?? []).filter(declaration => declaration.customElement && declaration.tagName));

/** @param {Member} method @returns {string} `ask(items)`, `select(key, options?)` */
const signature = method => {
  // The analyzer also lists a destructured parameter as `{ scroll = false }` next to the named one: it is not an argument by itself
  const parameters = (method.parameters ?? []).filter(parameter => !parameter.name.startsWith('{'));
  return `${method.name}(${parameters.map(parameter => parameter.name + (parameter.optional ? '?' : '')).join(', ')})`;
};

/** @param {Member} method @returns {string} */
const argumentsOf = method => (method.parameters ?? []).filter(parameter => !parameter.name.startsWith('{') && parameter.type)
  .map(parameter => `${code(`${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type?.text}`)}`).join('<br>');

/**
 * @param {Declaration} element
 * @returns {string} The reference of one element: a heading and a table per kind of thing it has, and none for what it has not
 */
export function referenceOf(element) {
  const members = (element.members ?? []).filter(member => !member.static);
  const fields = members.filter(member => member.kind === 'field');
  const methods = members.filter(member => member.kind === 'method');
  const sections = [];
  if (fields.length) {
    sections.push(['Properties and attributes', table(['Property', 'Description', 'Attribute', 'Type', 'Default'],
      fields.map(field => [code(field.name), cell(field.description) + (field.readonly ? ' (read only)' : ''), code(field.attribute), code(field.type?.text), code(field.default)]))]);
  }
  if (methods.length) {
    sections.push(['Methods', table(['Method', 'Description', 'Arguments', 'Returns'],
      methods.map(method => [code(signature(method)), cell(method.description), argumentsOf(method), code(method.return?.type?.text)]))]);
  }
  const events = element.events ?? [];
  if (events.length) {
    // The class is only said where the JSDoc names it (`@fires {WaShowEvent} wa-show`): the wax-* events have theirs in src/events, which the events page lists
    const classes = events.some(event => event.type?.text);
    sections.push(['Events', table(classes ? ['Event', 'Description', 'Class'] : ['Event', 'Description'],
      events.map(event => [code(event.name), cell(event.description), ...(classes ? [code(event.type?.text)] : [])]))]);
  }
  const slots = element.slots ?? [];
  if (slots.length) sections.push(['Slots', table(['Slot', 'Description'], slots.map(slot => [slot.name ? code(slot.name) : '(default)', cell(slot.description)]))]);
  const parts = element.cssParts ?? [];
  if (parts.length) sections.push(['Parts', table(['Part', 'Description'], parts.map(part => [code(part.name), cell(part.description)]))]);
  const properties = element.cssProperties ?? [];
  if (properties.length) sections.push(['CSS custom properties', table(['Property', 'Description'], properties.map(property => [code(property.name), cell(property.description)]))]);
  return sections.map(([title, body]) => `### ${title}\n\n${body}`).join('\n\n');
}

/**
 * @param {string} markdown The text of a page, with the two markers
 * @param {string} reference What goes between them
 * @returns {string} The page with the reference replaced; throws if a marker is missing
 */
export function withReference(markdown, reference) {
  const start = markdown.indexOf(START);
  const end = markdown.indexOf(END);
  if (start < 0 || end < start) throw new Error(`the page needs ${START} and ${END}, in that order`);
  return `${markdown.slice(0, start + START.length)}\n\n${reference}\n\n${markdown.slice(end)}`;
}
