const fs = require('fs');
const path = require('path');

function formatMarkdown(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split(/\r?\n/);
  let newLines = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;

      // Ensure blank line before code block start
      if (inCodeBlock && newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push('');
      }

      // Handle missing language code fence specification
      if (inCodeBlock && line.trim() === '```') {
        // Default to text if unspecified
        line = '```text';
      }

      newLines.push(line);

      // Ensure blank line after code block end
      if (!inCodeBlock && i + 1 < lines.length && lines[i + 1].trim() !== '') {
        newLines.push('');
      }
      continue;
    }

    if (inCodeBlock) {
      newLines.push(line);
      continue;
    }

    // Handle headings (lines starting with #)
    const isHeading = line.trim().startsWith('#');
    if (isHeading) {
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push('');
      }
      newLines.push(line);
      if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
        newLines.push('');
      }
      continue;
    }

    // Handle list items (lines starting with -, *, + or 1.)
    const isListItem = /^\s*([-*+]|\d+\.)\s+/.test(line);
    if (isListItem) {
      // Ensure blank line before first list item if previous line was a regular line
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        const prevLine = newLines[newLines.length - 1];
        const isPrevListItem = /^\s*([-*+]|\d+\.)\s+/.test(prevLine);
        if (!isPrevListItem) {
          newLines.push('');
        }
      }
      
      // Fix bare URLs in list item
      line = wrapBareUrls(line);
      newLines.push(line);
      
      // Ensure blank line after last list item if next line is a regular line
      if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
        const nextLine = lines[i + 1];
        const isNextListItem = /^\s*([-*+]|\d+\.)\s+/.test(nextLine);
        if (!isNextListItem) {
          newLines.push('');
        }
      }
      continue;
    }

    // Handle regular lines (including tables and bare URLs)
    line = wrapBareUrls(line);
    line = formatTableLine(line);
    newLines.push(line);
  }

  // Remove duplicate consecutive empty lines
  let finalLines = [];
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].trim() === '' && finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') {
      continue;
    }
    finalLines.push(newLines[i]);
  }

  fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
  console.log(`Formatted ${filePath} successfully.`);
}

function wrapBareUrls(line) {
  // Regex to match URLs starting with http:// or https://
  // But avoid matches that are already in <url>, [text](url), or inside backticks `url`
  const urlRegex = /(https?:\/\/[^\s`'"\)]+)/g;
  
  return line.replace(urlRegex, (url) => {
    // Check if the URL is already wrapped in <...>
    // To do this simply, we check characters around it or if it is inside backticks in the original line
    // Better: check if it's already inside `<https...>`
    // Let's do a simple check:
    const index = line.indexOf(url);
    if (index > 0 && line[index - 1] === '<' && line[index + url.length] === '>') {
      return url;
    }
    // Check if it is inside `...` (backticks)
    // A quick way is counting backticks before the URL
    const beforeStr = line.substring(0, index);
    const backtickCount = (beforeStr.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      return url; // inside backticks, leave as is
    }
    // Check if it's inside markdown link: [text](url)
    if (index > 0 && line[index - 1] === '(') {
      return url;
    }
    
    // Wrap it in angle brackets
    return `<${url}>`;
  });
}

function formatTableLine(line) {
  // Standardize space inside table cell pipes
  if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
    // If it's the separator line | --- | --- |, let's make it neat
    if (line.includes('---')) {
      const parts = line.split('|').map(p => {
        const trimmed = p.trim();
        if (trimmed === '') return '';
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return ` :---: `;
        if (trimmed.startsWith(':')) return ` :--- `;
        if (trimmed.endsWith(':')) return ` ---: `;
        return ` --- `;
      });
      return parts.join('|');
    } else {
      // General table row formatting: | col1 | col2 |
      const parts = line.split('|').map((p, idx, arr) => {
        if (idx === 0 || idx === arr.length - 1) return '';
        return ` ${p.trim()} `;
      });
      return '|' + parts.slice(1, parts.length - 1).join('|') + '|';
    }
  }
  return line;
}

// Run on both test reports
const reportDir = '/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce';
formatMarkdown(path.join(reportDir, 'KAHA_MAIN_V3_SWAGGER_TEST_REPORT.md'));
formatMarkdown(path.join(reportDir, 'SWAGGER_CRUD_ENDPOINTS_TEST_REPORT.md'));
