// Script to export dummy data from TypeScript to JavaScript for HTML files
// Run with: node FrontEnd/scripts/export-dummy-data.js

// This would normally import from the TypeScript file, but for now we'll
// create a Node script that can be run to generate the data file
// In a real setup, this would use ts-node or compile the TS first

const fs = require('fs');
const path = require('path');

// For now, this is a placeholder script structure
// The actual implementation would:
// 1. Import/require the compiled dummyData.js (or use ts-node)
// 2. Extract the tournament results
// 3. Format as JavaScript that can be included in HTML

console.log('This script would export dummy data from TypeScript to JavaScript');
console.log('For now, we\'ll create the data directly in dummy-data.js');

// The data will be added directly to dummy-data.js for simplicity
// In production, this script would generate it automatically
