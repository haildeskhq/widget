import widgetCss from './widget.css?inline';

// A plain named export (rather than re-exporting the `?inline` CSS import
// directly from index.ts) so the generated .d.ts declares a portable
// `string` type instead of a dangling reference to a module specifier that
// only resolves inside this package's own source tree.
export const widgetStyles: string = widgetCss;
