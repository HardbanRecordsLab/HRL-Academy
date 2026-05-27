const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  ['bg-white', 'bg-brand-card'],
  ['bg-neutral-50', 'bg-brand-bg'],
  ['bg-neutral-100', 'bg-brand-card'],
  ['border-neutral-100', 'border-brand-border'],
  ['border-neutral-200', 'border-brand-border'],
  ['border-neutral-300', 'border-brand-border'],
  ['border-neutral-150', 'border-brand-border'],
  ['text-neutral-900', 'text-text-primary'],
  ['text-neutral-800', 'text-text-primary'],
  ['text-neutral-700', 'text-text-primary'],
  ['text-neutral-600', 'text-text-secondary'],
  ['text-neutral-500', 'text-text-secondary'],
  ['text-neutral-400', 'text-text-secondary'],
  ['text-indigo-600', 'text-accent-blue'],
  ['text-indigo-700', 'text-accent-purple'],
  ['bg-indigo-600', 'bg-accent-blue'],
  ['bg-indigo-700', 'bg-accent-purple'],
  ['bg-indigo-50', 'bg-accent-blue/10'],
  ['bg-indigo-100', 'bg-accent-blue/20'],
  ['border-indigo-200', 'border-accent-blue/30'],
  ['border-indigo-100', 'border-accent-blue/20'],
  ['bg-slate-800', 'bg-brand-card'],
  ['text-slate-800', 'text-text-primary'],
  ['text-slate-900', 'text-text-primary'],
  ['text-slate-500', 'text-text-secondary'],
  ['text-slate-400', 'text-text-secondary'],
  ['text-slate-600', 'text-text-secondary'],
  ['border-slate-100', 'border-brand-border'],
  ['border-slate-800', 'border-brand-border'],
  ['text-black', 'text-text-primary'],
  ['border-black', 'border-brand-border'],
  ['bg-neutral-900', 'bg-accent-purple'],
  ['text-neutral-300', 'text-text-secondary'],
];

for (const [search, replace] of replacements) {
  content = content.replace(new RegExp(search, 'g'), replace);
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
