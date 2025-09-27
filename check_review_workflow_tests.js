#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all test files in tests/e2e directory
const testsDir = path.join(process.cwd(), 'tests', 'e2e');
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.spec.ts'))
  .map(file => path.join(testsDir, file));

console.log('🔍 Checking test files for potential review workflow issues...\n');

let totalIssues = 0;

testFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Look for tests that use createContent AND "Submit for Review" but might be missing generateAIContent
  const hasCreateContent = content.includes('createContent');
  const hasSubmitForReview = content.includes('Submit for Review');
  const hasGenerateAIContent = content.includes('generateAIContent');
  
  if (hasCreateContent && hasSubmitForReview && !hasGenerateAIContent) {
    console.log(`⚠️  ${fileName}: Uses createContent + Submit for Review but NO generateAIContent`);
    totalIssues++;
  }
  
  // Look for specific patterns that might be problematic
  const lines = content.split('\n');
  let issues = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check if Submit for Review is used without prior generateAIContent in the same test
    if (line.includes('Submit for Review')) {
      // Look backwards in the same test for generateAIContent
      let testStart = index;
      while (testStart > 0 && !lines[testStart].includes('test(')) {
        testStart--;
      }
      
      const testContent = lines.slice(testStart, index + 10).join('\n');
      if (!testContent.includes('generateAIContent')) {
        issues.push(`Line ${lineNum}: Submit for Review without generateAIContent in test`);
      }
    }
  });
  
  if (issues.length > 0) {
    console.log(`🔍 ${fileName}:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    totalIssues += issues.length;
  }
});

console.log(`\n📊 Summary: ${totalIssues} potential issues found`);

if (totalIssues === 0) {
  console.log('✅ All tests appear to have proper AI generation before review workflow!');
} else {
  console.log('❌ Some tests may need generateAIContent calls added');
}