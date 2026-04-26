const fs = require('fs');
const path = require('path');

// Define token mapping for hex values to design tokens (for Tailwind classes)
const replacements = [
  // Order matters: more specific (with opacity) first
  { from: /bg-\[#ff734b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-primary${p1 || ''}` },
  { from: /text-\[#ff734b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-primary${p1 || ''}` },
  { from: /border-\[#ff734b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `border-primary${p1 || ''}` },
  { from: /hover:bg-\[#ff734b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `hover:bg-primary${p1 || ''}` },

  { from: /bg-\[#110d0c\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-background${p1 || ''}` },
  { from: /text-\[#110d0c\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-primary-foreground${p1 || ''}` },
  // Note: border-[#110d0c] unlikely

  { from: /bg-\[#1f1b19\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-surface-container${p1 || ''}` },
  { from: /border-\[#1f1b19\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `border-surface-container${p1 || ''}` }, // if any

  { from: /bg-\[#2e2928\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-surface-container-low${p1 || ''}` },
  { from: /hover:bg-\[#2e2928\]/g, to: 'hover:bg-surface-container-low' },
  { from: /text-\[#2e2928\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-surface-container-low${p1 || ''}` }, // unlikely

  { from: /bg-\[#58413b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-muted${p1 || ''}` },
  { from: /border-\[#58413b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `border-outline-variant${p1 || ''}` },
  { from: /hover:bg-\[#58413b\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `hover:bg-muted${p1 || ''}` },

  { from: /text-\[#e0bfb7\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-muted-foreground${p1 || ''}` },

  { from: /text-\[#9cefff\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-secondary${p1 || ''}` },
  { from: /bg-\[#9cefff\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-secondary${p1 || ''}` },

  { from: /text-\[#ffb5a0\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-accent${p1 || ''}` },
  { from: /bg-\[#ffb5a0\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-accent${p1 || ''}` },

  { from: /text-\[#eae0de\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `text-foreground${p1 || ''}` },
  { from: /bg-\[#eae0de\](\/\d+(?:\.\d+)?)?/g, to: (m, p1) => `bg-foreground${p1 || ''}` },

  // Additional arbitrary Tailwind colors
  { from: /bg-green-500(\/\d+)?/g, to: (m, p1) => `bg-primary${p1 || ''}` },
  { from: /text-green-500(\/\d+)?/g, to: (m, p1) => `text-primary${p1 || ''}` },
  { from: /bg-green-600(\/\d+)?/g, to: (m, p1) => `bg-primary${p1 || ''}` },

  // Blue (Tailwind) maps to our secondary (cyan)
  { from: /bg-blue-500(\/\d+)?/g, to: (m, p1) => `bg-secondary${p1 || ''}` },
  { from: /text-blue-500(\/\d+)?/g, to: (m, p1) => `text-secondary${p1 || ''}` },
  { from: /bg-blue-500\/20/g, to: 'bg-secondary/20' },
  { from: /text-blue-400/g, to: 'text-secondary' },

  // Purple maps to accent or secondary? Let's map to accent
  { from: /bg-purple-500(\/\d+)?/g, to: (m, p1) => `bg-accent${p1 || ''}` },
  { from: /text-purple-500(\/\d+)?/g, to: (m, p1) => `text-accent${p1 || ''}` },
  { from: /bg-purple-500\/20/g, to: 'bg-accent/20' },
  { from: /text-purple-400/g, to: 'text-accent' },

  // Yellow maps to accent (already handled specific yellow-500 patterns)
  { from: /bg-yellow-500(\/\d+)?/g, to: (m, p1) => `bg-accent${p1 || ''}` },
  { from: /text-yellow-500(\/\d+)?/g, to: (m, p1) => `text-accent${p1 || ''}` },

  // Warning colors -> accent (already some)
  { from: /bg-yellow-500\/10/g, to: 'bg-accent/10' },
  { from: /border-yellow-500\/20/g, to: 'border-accent/20' },

  // Red -> destructive
  { from: /bg-red-500(\/\d+)?/g, to: (m, p1) => `bg-destructive${p1 || ''}` },
  { from: /text-red-500(\/\d+)?/g, to: (m, p1) => `text-destructive${p1 || ''}` },

  // Orange -> accent or destructive? For numbers, orange is often accent/warning.
  { from: /text-orange-600/g, to: 'text-accent' },
  { from: /bg-orange-600/g, to: 'bg-accent' },

  // Gray mapping (for inactive text etc.)
  { from: /text-gray-400/g, to: 'text-muted-foreground' },
  { from: /bg-gray-100/g, to: 'bg-muted' },
  { from: /bg-gray-400/g, to: 'bg-muted' },

  // Green for check icons already covered by green-500
  // Red for destructive
  { from: /text-red-500/g, to: 'text-destructive' },

  // White mapping
  { from: /text-white(\/\d+)?/g, to: (m, p1) => `text-foreground${p1 || ''}` },
  { from: /bg-white(\/\d+)?/g, to: (m, p1) => `bg-foreground${p1 || ''}` },

  // Shadow custom: replace specific one seen in bottom-nav: shadow-[0_-10px_40px_rgba(0,0,0,0.4)]
  // Might appear only there, we can do specific replace later, not script.

  // Inline style hex patterns: style="{{[^}]*backgroundColor:\s*'#[0-9a-fA-F]{6}'[^}]*}}"
  // Complex to handle generally; maybe leave for later manual.
];

// Additional fixed string replacements (exact match)
const exactReplacements = [
  // Already covered via regex; but we can add more if needed.
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      walkDir(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.tsx', '.ts', '.js', '.jsx', '.css'].includes(ext)) {
        processFile(full);
      }
    }
  }
}

const srcDir = path.join(process.cwd(), 'src');
walkDir(srcDir);

console.log('Color token replacement complete.');
