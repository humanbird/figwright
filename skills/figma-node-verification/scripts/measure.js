// figwright — read the actual values off one rendered element.
// Paste into a browser tool that evaluates JavaScript on the page.
// Replace <your-selector>; run the motion freeze from SKILL.md first.
const sel = '<your-selector>';
const hits = document.querySelectorAll(sel);
const el = hits[0];
const c = el && getComputedStyle(el), r = el && el.getBoundingClientRect();
// Text carriers: elements holding their own non-empty text node.
const carriers = el ? [el, ...el.querySelectorAll('*')].filter(n =>
  [...n.childNodes].some(k => k.nodeType === 3 && k.textContent.trim())) : [];
const tEl = carriers[0];
const t = tEl && getComputedStyle(tEl);
const id = n => n && (n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
  (n.className ? '.' + String(n.className).trim().split(/\s+/).join('.') : ''));
// Split a computed shadow list only at top-level commas: color functions carry
// commas of their own. Keep the raw value too, as evidence from computed style.
const splitCssList = value => {
  let depth = 0, start = 0;
  const parts = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    if (value[i] === ')') depth--;
    if (value[i] === ',' && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
};
!el ? { error: `selector matches 0 elements: ${sel}` } : ({
  hits: hits.length, element: id(el),
  textCarrier: id(tEl), textCarriers: carriers.length,
  width: r.width, height: r.height,
  layoutWidth: el.offsetWidth, layoutHeight: el.offsetHeight,
  padding: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft],
  // display:grid always reports flexDirection "row" — so show both axes.
  gap: [c.columnGap, c.rowGap],
  display: c.display, flexDirection: c.flexDirection,
  radius: [c.borderTopLeftRadius, c.borderTopRightRadius,
           c.borderBottomRightRadius, c.borderBottomLeftRadius],
  borderWidths: [c.borderTopWidth, c.borderRightWidth,
                 c.borderBottomWidth, c.borderLeftWidth],
  borderStyles: [c.borderTopStyle, c.borderRightStyle,
                 c.borderBottomStyle, c.borderLeftStyle],
  borderColors: [c.borderTopColor, c.borderRightColor,
                 c.borderBottomColor, c.borderLeftColor],
  background: c.backgroundColor,
  boxShadow: c.boxShadow,
  boxShadows: c.boxShadow === 'none' ? [] : splitCssList(c.boxShadow),
  font: t && [t.fontFamily, t.fontSize, t.fontWeight, t.lineHeight,
              t.letterSpacing, t.color],
  // Is the design's face really loaded? Query style and weight too — the
  // family alone answers true for any available face of that family.
  fontLoaded: t && document.fonts.check(
    `${t.fontStyle} ${t.fontWeight} ${t.fontSize} ${t.fontFamily.split(',')[0]}`),
  viewport: [innerWidth, innerHeight, devicePixelRatio],
})
