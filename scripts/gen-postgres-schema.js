const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'prisma', 'schema.prisma');
const dst = path.join(process.cwd(), 'prisma', 'schema.postgres.prisma');

let content = fs.readFileSync(src, 'utf8');

if (!content.match(/provider\s*=\s*"sqlite"/)) {
  console.error('schema.prisma não contém provider sqlite — nada a converter');
  process.exit(1);
}

content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

fs.writeFileSync(dst, content);
console.log(`Gerado ${path.relative(process.cwd(), dst)} (provider postgresql)`);