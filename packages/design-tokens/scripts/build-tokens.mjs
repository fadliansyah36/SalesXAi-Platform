import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokenDir = path.join(root, 'tokens');
const outputDir = path.join(root, 'generated');
const manifest = JSON.parse(await readFile(path.join(tokenDir, 'index.json'), 'utf8'));
if (!Array.isArray(manifest.sources) || manifest.sources.length !== 9) throw new Error('tokens/index.json must declare nine canonical JSON sources.');
const sourceFiles = manifest.sources.map(source => {
  if (typeof source !== 'string' || !source.startsWith('./') || source.includes('..')) throw new Error('Invalid token source path: ' + source);
  return path.basename(source);
});
if (new Set(sourceFiles).size !== sourceFiles.length) throw new Error('Duplicate canonical token source.');
const requiredSources = ['primitives.json','semantic-light.json','semantic-dark.json','typography.json','spacing.json','radius.json','elevation.json','motion.json','breakpoints.json'];
if (requiredSources.some(source => !sourceFiles.includes(source))) throw new Error('Canonical token manifest is missing a required source.');
const docs = Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file.replace('.json',''), JSON.parse(await readFile(path.join(tokenDir,file),'utf8'))])));
const primitives = docs.primitives, light = docs['semantic-light'], dark = docs['semantic-dark'];
const spacing = docs.spacing, radius = docs.radius, elevation = docs.elevation, motion = docs.motion, breakpoints = docs.breakpoints, typography = docs.typography;
for (const [step, expected] of Object.entries({200:'#ADD8E6',300:'#B0E0E6',400:'#87CEEB'})) {
  if (primitives.color?.brand?.[step]?.$value !== expected) throw new Error('Canonical SalesX-Ai brand color mismatch at brand.' + step + '.');
}
const semanticKeys = ['background','surface','surfaceRaised','surfaceMuted','textPrimary','textSecondary','textMuted','border','borderStrong','primary','primaryHover','primarySubtle','focus'];
for (const [themeName, theme] of [['light',light],['dark',dark]]) for (const key of semanticKeys) {
  if (!theme.color?.[key]?.$type || theme.color[key].$value === undefined) throw new Error('Missing ' + themeName + ' semantic token: ' + key);
}
for (const [name, source] of Object.entries({typography:typography.fontSize,spacing:spacing.spacing,radius:radius.radius,elevation:elevation.shadow,motion:motion.motion,breakpoints:breakpoints.breakpoint})) {
  if (!source || Object.keys(source).length === 0) throw new Error('Missing canonical ' + name + ' tokens.');
}
const merged = {color:primitives.color,spacing:spacing.spacing,radius:radius.radius,shadow:elevation.shadow,motion:motion.motion,breakpoint:breakpoints.breakpoint,layout:spacing.layout,fontFamily:typography.fontFamily,fontSize:typography.fontSize,lineHeight:typography.lineHeight,fontWeight:typography.fontWeight};
function resolve(node, seen = new Set()) {
  if (Array.isArray(node)) return node.map(value => resolve(value, seen));
  if (!node || typeof node !== 'object') return node;
  if (Object.hasOwn(node, '$value')) {
    const raw = node.$value;
    if (typeof raw === 'string' && raw.startsWith('{') && raw.endsWith('}')) {
      const reference = raw.slice(1,-1);
      if (seen.has(reference)) throw new Error('Circular token reference: ' + reference);
      let target = merged;
      for (const part of reference.split('.')) target = target?.[part];
      if (target === undefined) throw new Error('Unresolved token reference: ' + reference);
      const resolved = resolve(target, new Set([...seen, reference]));
      return { ...node, $value: resolved?.$value ?? resolved };
    }
    return { ...node, $value: resolve(raw, seen) };
  }
  return Object.fromEntries(Object.entries(node).map(([key,value]) => [key,resolve(value,seen)]));
}
function flatten(node, prefix = [], output = []) {
  for (const [key,value] of Object.entries(node ?? {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value,'$value')) output.push({path:[...prefix,key],value:value.$value,type:value.$type});
    else if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value,[...prefix,key],output);
  }
  return output;
}
const cssName = parts => '--salesx-' + parts.join('-').replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
const cssValue = item => Array.isArray(item.value)
  ? (item.type === 'fontFamily' ? item.value.map(value => /\s/.test(value) ? '"' + value + '"' : value).join(', ') : item.value.join(', '))
  : String(item.value);
const cssBlock = items => {
  const sorted = [...items].sort((a,b) => a.path.join('.').localeCompare(b.path.join('.')));
  const names = sorted.map(item => cssName(item.path));
  if (new Set(names).size !== names.length) throw new Error('Duplicate generated CSS custom property.');
  return sorted.map(item => '  ' + cssName(item.path) + ': ' + cssValue(item) + ';').join('\n');
};
const css = '/* Generated by packages/design-tokens/scripts/build-tokens.mjs. Do not edit by hand. */\n' +
  ':root {\n' + cssBlock(flatten(merged)) + '\n' + cssBlock(flatten(resolve(light))) + '\n}\n' +
  '.dark, [data-theme="dark"] {\n' + cssBlock(flatten(resolve(dark))) + '\n}\n';
const native = {version:manifest.version,primitives:resolve(primitives),semanticLight:resolve(light),semanticDark:resolve(dark),typography:resolve(typography),spacing:resolve(spacing),radius:resolve(radius),elevation:resolve(elevation),motion:resolve(motion),breakpoints:resolve(breakpoints)};
const nativeTs = '/* Generated by packages/design-tokens/scripts/build-tokens.mjs. Do not edit by hand. */\n' +
  'export const tokenVersion = ' + JSON.stringify(manifest.version) + ' as const;\n' +
  'export const salesxTokens = ' + JSON.stringify(native,null,2) + ' as const;\n' +
  'export type SalesXTokens = typeof salesxTokens;\n' +
  'export const semanticLight = salesxTokens.semanticLight;\nexport const semanticDark = salesxTokens.semanticDark;\n';
const declarations = '/* Generated by packages/design-tokens/scripts/build-tokens.mjs. Do not edit by hand. */\n' +
  'export { tokenVersion, salesxTokens, semanticLight, semanticDark } from "./native";\nexport type { SalesXTokens } from "./native";\n';
const outputs = new Map([['web.css',css],['native.ts',nativeTs],['tokens.d.ts',declarations]]);
const check = process.argv.includes('--check');
if (check) {
  for (const [name,expected] of outputs) {
    let actual;
    try { actual = await readFile(path.join(outputDir,name),'utf8'); }
    catch { throw new Error('Missing generated artifact ' + name + '; run tokens:build.'); }
    if (actual !== expected) throw new Error('Stale generated artifact: ' + name + '; run tokens:build.');
  }
  console.log('Verified ' + outputs.size + ' generated artifacts from ' + sourceFiles.length + ' canonical JSON sources.');
} else {
  await mkdir(outputDir,{recursive:true});
  await Promise.all([...outputs].map(([name,content]) => writeFile(path.join(outputDir,name),content)));
  console.log('Generated ' + outputs.size + ' artifacts from ' + sourceFiles.length + ' canonical JSON sources.');
}
