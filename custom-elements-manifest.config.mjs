/**
 * Settings of @custom-elements-manifest/analyzer: it reads the components of src/components (the file of each `wax-*` element, `<name>/<name>.js`, with its JSDoc) and
 * writes custom-elements.json, the same description of attributes, properties, events, slots, parts and CSS custom properties that Web Awesome ships.
 * `npm run manifest` makes it; `scripts/react.mjs` makes the React wrappers from it.
 */
/** The analyzer also finds the events that are dispatched (`new WaxSelectEvent()`, with no name, or a variable): only the ones the JSDoc describes (`@fires`) are real */
const onlyWaxEvents = {
  name: 'only-wax-events',
  packageLinkPhase({ customElementsManifest }) {
    // The analyzer reads the files at the same time and gives the modules in the order they finish: sorted by path, the manifest is always the same
    customElementsManifest.modules?.sort((a, b) => a.path.localeCompare(b.path));
    for (const module of customElementsManifest.modules ?? []) {
      for (const declaration of module.declarations ?? []) {
        if (declaration.events) declaration.events = declaration.events.filter(event => event.name && event.description);
        // What is not public (`#private`, and the `_state` properties that only redraw) is not part of the element for whoever uses it
        if (declaration.members) declaration.members = declaration.members.filter(member => (!member.privacy || member.privacy === 'public') && !member.name.startsWith('_'));
        if (declaration.attributes) declaration.attributes = declaration.attributes.filter(attribute => !attribute.name.startsWith('_'));
      }
    }
  },
};

export default {
  globs: ['src/components/*/*.js'],
  exclude: ['src/components/*/*.styles.js', 'src/components/*/*.state.js', 'src/components/*/*.test.js'],
  litelement: true,
  packagejson: false,   // do not write the `customElements` field into package.json
  plugins: [onlyWaxEvents],
};
