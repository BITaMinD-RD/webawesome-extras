/**
 * Settings of @custom-elements-manifest/analyzer: it reads the components of js/webawesome-extras (the files that define a `wax-*` element, named `Wax*.js`, with their JSDoc) and
 * writes custom-elements.json, the same description of attributes, properties, events, slots, parts and CSS custom properties that Web Awesome ships.
 * `npm run manifest` makes it; `scripts/react.mjs` makes the React wrappers from it.
 */
/** The events are fired by one `#emit(name, detail)`, so the analyzer also finds an event called `name`: only the `wax-*` ones the JSDoc names are real */
const onlyWaxEvents = {
  name: 'only-wax-events',
  packageLinkPhase({ customElementsManifest }) {
    for (const module of customElementsManifest.modules ?? []) {
      for (const declaration of module.declarations ?? []) {
        if (declaration.events) declaration.events = declaration.events.filter(event => event.name.startsWith('wax-'));
        // What is not public (`#private`, and the `_state` properties that only redraw) is not part of the element for whoever uses it
        if (declaration.members) declaration.members = declaration.members.filter(member => (!member.privacy || member.privacy === 'public') && !member.name.startsWith('_'));
        if (declaration.attributes) declaration.attributes = declaration.attributes.filter(attribute => !attribute.name.startsWith('_'));
      }
    }
  },
};

export default {
  globs: ['js/webawesome-extras/Wax*.js'],
  exclude: ['js/webawesome-extras/test/**'],
  litelement: true,
  plugins: [onlyWaxEvents],
};
