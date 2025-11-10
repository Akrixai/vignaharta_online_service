const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript and JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist' && file !== 'build') {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to remove console statements from a file
function removeConsoleStatements(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove console.log statements
    const consoleLogRegex = /^\s*console\.log\([^;]*\);?\s*$/gm;
    if (consoleLogRegex.test(content)) {
      content = content.replace(consoleLogRegex, '');
      modified = true;
    }
    
    // Remove console.error statements (but keep ones wrapped in development checks)
    const consoleErrorRegex = /^\s*console\.error\([^;]*\);?\s*$/gm;
    const lines = content.split('\n');
    const newLines = [];
    let skipNext = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip console.error lines that are not wrapped in development checks
      if (trimmedLine.startsWith('console.error(') && 
          !lines[i-1]?.includes('NODE_ENV') && 
          !lines[i-2]?.includes('NODE_ENV') &&
          !lines[i-3]?.includes('NODE_ENV')) {
        modified = true;
        continue;
      }
      
      // Remove console.warn, console.info, console.debug
      if (trimmedLine.startsWith('console.warn(') || 
          trimmedLine.startsWith('console.info(') || 
          trimmedLine.startsWith('console.debug(')) {
        modified = true;
        continue;
      }
      
      newLines.push(line);
    }
    
    if (modified) {
      content = newLines.join('\n');
      
      // Clean up multiple empty lines
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`🔍 Found ${files.length} files to process...`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  files.forEach(file => {
    processedCount++;
    if (removeConsoleStatements(file)) {
      modifiedCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Processed: ${processedCount} files`);
  console.log(`   Modified: ${modifiedCount} files`);
  console.log(`\n🎉 Console cleanup completed!`);
}

main();
