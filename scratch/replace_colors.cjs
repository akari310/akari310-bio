const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, '../src/styles/style.css');
let content = fs.readFileSync(cssFile, 'utf8');

const replacements = {
    '#11111b': 'var(--bg-dark)',
    'rgba(30, 30, 46, 0.45)': 'var(--card-bg)',
    'rgba(30,30,46,0.45)': 'var(--card-bg)',
    'rgba(255, 255, 255, 0.05)': 'var(--border-color)',
    'rgba(255,255,255,0.05)': 'var(--border-color)',
    '#cdd6f4': 'var(--text-main)',
    '#a6adc8': 'var(--text-muted)',
    '#cba6f7': 'var(--c-mauve)',
    '#f5c2e7': 'var(--c-pink)',
    '#b4befe': 'var(--c-lavender)',
    '#74c7ec': 'var(--c-sapphire)',
    '#a6e3a1': 'var(--c-green)',
    '#f9e2af': 'var(--c-yellow)',
    '#1e1e2e': 'var(--card-bg)' // Fallback for solid backgrounds
};

for (const [search, replace] of Object.entries(replacements)) {
    // Regex to replace exact matches, case-insensitive, but avoid replacing within the :root or theme blocks we just added
    // Let's just do a global replace for all hex codes. But wait, we shouldn't replace in the :root definitions!
    // We will do a simple split and replace starting from the first CSS rule (after line 60).
    const splitIndex = content.indexOf('* { margin: 0;');
    if (splitIndex === -1) {
        // If not found, just replace everything
        content = content.split(search).join(replace);
        content = content.split(search.toUpperCase()).join(replace);
    } else {
        const topPart = content.substring(0, splitIndex);
        let bottomPart = content.substring(splitIndex);
        
        // global replace in bottomPart
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        bottomPart = bottomPart.replace(regex, replace);
        
        content = topPart + bottomPart;
    }
}

fs.writeFileSync(cssFile, content, 'utf8');
console.log('Successfully replaced colors in style.css');
