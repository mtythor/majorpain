// Script to export dummy data from TypeScript to JSON files
// Run with: node FrontEnd/scripts/export-dummy-data-to-json.js
// Requires: npm install --save-dev tsx (or ts-node)

const fs = require('fs');
const path = require('path');

// Since we can't directly import TypeScript, we'll use a workaround:
// We'll create a temporary JS file that imports the compiled output
// Or use tsx/ts-node if available

// For now, let's use a simpler approach: create a script that can be run with tsx
// If tsx is not available, we'll provide instructions

const MOCK_DATA_DIR = path.join(__dirname, '../../MockData');
const PUBLIC_API_DIR = path.join(__dirname, '../public/api');

// Ensure directories exist
function ensureDirectories() {
  [MOCK_DATA_DIR, PUBLIC_API_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Function to serialize data to JSON (handles Date objects, etc.)
function serializeToJSON(data) {
  return JSON.stringify(data, (key, value) => {
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Keep null values
    if (value === null) {
      return null;
    }
    return value;
  }, 2);
}

// Main export function
async function exportData() {
  try {
    ensureDirectories();
    
    // Try to use tsx to import TypeScript directly
    // If tsx is not available, we'll need to compile first
    let dummyData;
    
    try {
      // Try dynamic import with tsx (if available)
      // For now, we'll use a workaround: require the compiled JS
      // In Next.js, the TypeScript is compiled, so we can try to import from .next
      
      // Alternative: Use eval with fs.readFileSync to execute TypeScript
      // But the cleanest is to use tsx or compile first
      
      // For this implementation, we'll create a helper that uses tsx if available
      // Otherwise, we'll provide instructions
      
      console.log('Attempting to load dummy data...');
      
      // Check if we can use tsx
      const { execSync } = require('child_process');
      let useTsx = false;
      try {
        execSync('npx tsx --version', { stdio: 'ignore' });
        useTsx = true;
      } catch (e) {
        console.log('tsx not found, trying alternative method...');
      }
      
      if (useTsx) {
        // Use tsx to execute TypeScript directly
        const dummyDataPath = path.join(__dirname, '../lib/dummyData.ts');
        // We'll need to create a temporary script that exports the data
        const tempScript = `
          import * as dummyData from '${dummyDataPath.replace(/\\/g, '/')}';
          import { writeFileSync } from 'fs';
          import { join } from 'path';
          
          const MOCK_DATA_DIR = '${MOCK_DATA_DIR.replace(/\\/g, '/')}';
          const PUBLIC_API_DIR = '${PUBLIC_API_DIR.replace(/\\/g, '/')}';
          
          // Export tournaments
          writeFileSync(
            join(MOCK_DATA_DIR, 'tournaments.json'),
            JSON.stringify(dummyData.dummyTournaments, null, 2)
          );
          
          // Export golfers
          writeFileSync(
            join(MOCK_DATA_DIR, 'golfers.json'),
            JSON.stringify(dummyData.dummyGolfers, null, 2)
          );
          
          // Export results
          writeFileSync(
            join(MOCK_DATA_DIR, 'results.json'),
            JSON.stringify(dummyData.dummyTournamentResults, null, 2)
          );
          
          // Export players
          writeFileSync(
            join(MOCK_DATA_DIR, 'players.json'),
            JSON.stringify(dummyData.dummyPlayers, null, 2)
          );
          
          // Also copy to public/api for Next.js serving
          writeFileSync(
            join(PUBLIC_API_DIR, 'tournaments.json'),
            JSON.stringify(dummyData.dummyTournaments, null, 2)
          );
          writeFileSync(
            join(PUBLIC_API_DIR, 'golfers.json'),
            JSON.stringify(dummyData.dummyGolfers, null, 2)
          );
          writeFileSync(
            join(PUBLIC_API_DIR, 'results.json'),
            JSON.stringify(dummyData.dummyTournamentResults, null, 2)
          );
          writeFileSync(
            join(PUBLIC_API_DIR, 'players.json'),
            JSON.stringify(dummyData.dummyPlayers, null, 2)
          );
          
          console.log('Export complete!');
        `;
        
        const tempScriptPath = path.join(__dirname, 'temp-export.ts');
        fs.writeFileSync(tempScriptPath, tempScript);
        
        try {
          execSync(`npx tsx ${tempScriptPath}`, { stdio: 'inherit' });
          fs.unlinkSync(tempScriptPath);
          console.log('✅ Successfully exported data using tsx');
          return;
        } catch (e) {
          fs.unlinkSync(tempScriptPath);
          throw e;
        }
      } else {
        // Fallback: Create a Node.js script that can be run after compilation
        console.log('⚠️  tsx not available. Creating a Node.js compatible export script...');
        console.log('   Please install tsx: npm install --save-dev tsx');
        console.log('   Or run: npx tsx FrontEnd/scripts/export-dummy-data-to-json.ts');
        
        // Create a TypeScript version that can be run with tsx
        const tsScript = `
import * as dummyData from '../lib/dummyData';
import { writeFileSync } from 'fs';
import { join } from 'path';

const MOCK_DATA_DIR = '${MOCK_DATA_DIR.replace(/\\/g, '/')}';
const PUBLIC_API_DIR = '${PUBLIC_API_DIR.replace(/\\/g, '/')}';

// Export tournaments
writeFileSync(
  join(MOCK_DATA_DIR, 'tournaments.json'),
  JSON.stringify(dummyData.dummyTournaments, null, 2)
);

// Export golfers
writeFileSync(
  join(MOCK_DATA_DIR, 'golfers.json'),
  JSON.stringify(dummyData.dummyGolfers, null, 2)
);

// Export results
writeFileSync(
  join(MOCK_DATA_DIR, 'results.json'),
  JSON.stringify(dummyData.dummyTournamentResults, null, 2)
);

// Export players
writeFileSync(
  join(MOCK_DATA_DIR, 'players.json'),
  JSON.stringify(dummyData.dummyPlayers, null, 2)
);

// Also copy to public/api for Next.js serving
writeFileSync(
  join(PUBLIC_API_DIR, 'tournaments.json'),
  JSON.stringify(dummyData.dummyTournaments, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'golfers.json'),
  JSON.stringify(dummyData.dummyGolfers, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'results.json'),
  JSON.stringify(dummyData.dummyTournamentResults, null, 2)
);
writeFileSync(
  join(PUBLIC_API_DIR, 'players.json'),
  JSON.stringify(dummyData.dummyPlayers, null, 2)
);

console.log('✅ Export complete!');
console.log(\`   Files written to: \${MOCK_DATA_DIR}\`);
console.log(\`   Files written to: \${PUBLIC_API_DIR}\`);
`;
        
        const tsScriptPath = path.join(__dirname, 'export-dummy-data-to-json.ts');
        fs.writeFileSync(tsScriptPath, tsScript);
        console.log(`\n✅ Created TypeScript export script: ${tsScriptPath}`);
        console.log('   Run it with: npx tsx FrontEnd/scripts/export-dummy-data-to-json.ts');
        return;
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the export
exportData();
