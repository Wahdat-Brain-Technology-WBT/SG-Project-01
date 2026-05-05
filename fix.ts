import fs from 'fs';

const file = 'src/components/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIndex = content.indexOf('      {/* 5. Detailed Periodical Reports Table */}');
const endIndex = content.indexOf('      {/* 6. High-Tech Server & System Status (RULE 5) */}');

if (startIndex !== -1 && endIndex !== -1) {
  const block = content.substring(startIndex, endIndex);
  content = content.replace(block, '');

  const insertIndex = content.indexOf('      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">');
  if (insertIndex !== -1) {
    content = content.substring(0, insertIndex) + block + '\n' + content.substring(insertIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully moved the block.');
  } else {
    console.log('Failed to find insert index.');
  }
} else {
  console.log('Failed to find block boundaries.');
}

