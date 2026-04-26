const fs = require('fs');
const path = require('path');

// Map of hex colors (lowercase) to token base names
const hexToToken = {
  'ff734b': 'primary',
  '9cefff': 'secondary',
  'ffb5a0': 'accent',
  'e0bfb7': 'muted-foreground',
  '110d0c': 'background',
  '1f1b19': 'surface-container',
  '2e2928': 'surface-container-low',
  '58413b': 'outline-variant',
  'eae0de': 'foreground',
  // Additional from brand palette
  'ff4488': 'destructive', // pinkish-red -> destructive
  'ffcc00': 'accent',     // yellow -> accent
  '00ff88': 'secondary',  // bright green -> secondary (or could be 'success' if existed)
  '1a1614': 'surface-container', // close approximation
  '393432': 'surface-container-highest', // approximate
};

// Helper to build replacement for arbitrary class pattern
function buildClassPattern(prefix) {
  // matches: prefix-[#hex] optionally followed by /opacity (like /20, /50)
  return new RegExp(`${prefix}-\\[#([0-9A-Fa-f]{6})\\](\\/\\d+(?:\\.\\d+)?)?`, 'g');
}

// Patterns to replace: bg, text, border, ring, outline, divide, from-, to-, via- (for gradients)
const classPatterns = [
  'bg', 'text', 'border', 'ring', 'outline', 'divide',
  'from', 'to', 'via'
];

const replacements = [];

classPatterns.forEach(p => {
  const pattern = buildClassPattern(p);
  replacements.push({
    from: pattern,
    to: (match, hex, opacity) => {
      const token = hexToToken[hex.toLowerCase()];
      if (!token) return match; // leave unchanged if unknown
      const op = opacity || '';
      return `${p}-${token}${op}`;
    }
  });
});

// Also replace inline style hex values: e.g., style={{ backgroundColor: "#ff734b" }}
// This covers strings like '#ff734b' inside style={{ ... }} when they are color properties.
// We'll do a simpler approach: replace hex string inside quotes that are directly assigned to color-related CSS properties.
// But better: Replace all occurrences of hex color strings in JSX inline styles that are exactly the hex (with optional alpha?) but for now, treat patterns like: `color: "#ff734b"` -> `color: "hsl(var(--primary))"`
// Actually, the token we want to use in inline style is `hsl(var(--primary))` etc.
// But we can also just use the token name and then later run a transformer that converts token names to var? Not easy.

// For simplicity, we will replace hex strings in inline styles with the corresponding CSS var expression.
// Pattern: inside double quotes or single quotes after a color property: e.g., `backgroundColor: "#ff734b"` but note JSX uses double quotes for attribute and inside style object we have double quotes? Actually style={{backgroundColor:"#ff734b"}} no quotes inside? Wait in JSX, style object uses JS strings: style={{ backgroundColor: "#ff734b" }}. So the hex is a string literal: "#ff734b". So we can replace the literal string "#ff734b" with "hsl(var(--primary))", but must ensure we only replace those that are exact matches and not part of longer string.

// We'll create a regex that matches the hex string preceded by colon and optional space, and followed by comma or closing brace.

// But it's complicated. Instead, we can process each file line and replace occurrences with a simple regex /("#[0-9A-Fa-f]{6}")/g and then map hex to token string `hsl(var(--token))`.

// However need to ensure not to replace string tokens that are not color properties? But likely safe as hex strings are typically colors.

// We'll do a second pass: for each file, after class replacements, also replace all instances of `"#hex"` or `'#hex'` where hex is a brand color, with `hsl(var(--token))`. Use regex: /(['"])(#([0-9A-Fa-f]{6}))\1/g

const hexStringRegex = /(['"])(#[0-9A-Fa-f]{6})\1/g;

// Replacement function for hex string literals
function replaceHexString(match, quote, hexWithHash) {
  const hex = hexWithHash.replace('#', '').toLowerCase();
  const token = hexToToken[hex];
  if (!token) return match;
  // Return quoted CSS variable reference
  return `${quote}hsl(var(--${token}))${quote}`;
}

// Combine into one replacements array? We'll process separately.

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Class arbitrary value replacements
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }

  // Inline string hex replacements (only if they are brand colors)
  content = content.replace(hexStringRegex, replaceHexString);

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

console.log('Comprehensive color token replacement complete.');
