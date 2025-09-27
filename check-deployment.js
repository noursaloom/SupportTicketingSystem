const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Support Ticketing System Deployment Files...\n');

// Expected files for a complete Angular deployment
const expectedFiles = {
  'Root Files': [
    'index.html',
    'favicon.ico',
    'main.js',
    'polyfills.js',
    'styles.css',
    'runtime.js'
  ],
  'Assets': [
    'assets/icons/icon-72x72.png',
    'assets/icons/icon-96x96.png',
    'assets/icons/icon-128x128.png',
    'assets/icons/icon-144x144.png',
    'assets/icons/icon-152x152.png',
    'assets/icons/icon-192x192.png',
    'assets/icons/icon-384x384.png',
    'assets/icons/icon-512x512.png'
  ],
  'Configuration': [
    '_redirects',
    'netlify.toml'
  ]
};

// Check current directory structure
function checkFiles(basePath = '.') {
  console.log(`📁 Checking files in: ${path.resolve(basePath)}\n`);
  
  const results = {
    found: [],
    missing: [],
    extra: []
  };

  // Get all files in current directory
  const actualFiles = [];
  
  function scanDirectory(dir, prefix = '') {
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(prefix, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath, relativePath);
          }
        } else {
          actualFiles.push(relativePath);
        }
      });
    } catch (error) {
      console.log(`❌ Error scanning ${dir}: ${error.message}`);
    }
  }

  scanDirectory(basePath);

  // Check each category
  Object.entries(expectedFiles).forEach(([category, files]) => {
    console.log(`\n📋 ${category}:`);
    files.forEach(file => {
      const exists = actualFiles.includes(file) || actualFiles.includes(file.replace(/\\/g, '/'));
      if (exists) {
        console.log(`  ✅ ${file}`);
        results.found.push(file);
      } else {
        console.log(`  ❌ ${file} - MISSING`);
        results.missing.push(file);
      }
    });
  });

  // Show actual files found
  console.log(`\n📂 All Files Found (${actualFiles.length}):`);
  actualFiles.sort().forEach(file => {
    console.log(`  📄 ${file}`);
  });

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Found: ${results.found.length} files`);
  console.log(`  ❌ Missing: ${results.missing.length} files`);
  console.log(`  📄 Total: ${actualFiles.length} files`);

  if (results.missing.length > 0) {
    console.log(`\n🚨 Missing Files:`);
    results.missing.forEach(file => console.log(`  - ${file}`));
  }

  return results;
}

// Run the check
const results = checkFiles();

// Check if this looks like a built Angular app
const hasAngularFiles = results.found.some(file => 
  file.includes('main.js') || file.includes('index.html')
);

if (!hasAngularFiles) {
  console.log(`\n⚠️  This doesn't appear to be a built Angular application.`);
  console.log(`   Run 'npm run build' first to create the dist folder.`);
}

console.log(`\n🔧 Next Steps:`);
if (results.missing.length > 0) {
  console.log(`  1. Build the application: npm run build`);
  console.log(`  2. Check the dist/support-ticketing-frontend folder`);
  console.log(`  3. Ensure all required files are generated`);
} else {
  console.log(`  ✅ All expected files are present!`);
  console.log(`  🚀 Ready for deployment`);
}