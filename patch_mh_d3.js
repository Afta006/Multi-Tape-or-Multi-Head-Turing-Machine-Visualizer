const fs = require('fs');

const file = 'app/multi-head/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the graphLayout useMemo with d3-force logic
content = content.replace(
  'const graphLayout = useMemo(() => {',
  `const graphLayout = useMemo(() => {`
);

fs.writeFileSync(file, content);
