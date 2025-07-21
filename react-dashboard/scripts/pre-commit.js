#!/usr/bin/env node

/**
 * Pre-commit hook for Lich Kham Dashboard
 * Runs code quality checks before allowing commits
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} passed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return false;
  }
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function getJSFiles(files) {
  return files.filter(file => 
    (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) &&
    !file.includes('node_modules') &&
    !file.includes('dist') &&
    !file.includes('build')
  );
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for required scripts
    const requiredScripts = ['lint', 'format', 'test'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts || !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      log(`⚠️  Missing scripts in package.json: ${missingScripts.join(', ')}`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Invalid package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvFiles() {
  const envExample = path.join(process.cwd(), '.env.example');
  const env = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envExample)) {
    log('⚠️  .env.example not found', 'yellow');
    return false;
  }
  
  if (!fs.existsSync(env)) {
    log('⚠️  .env not found', 'yellow');
    return false;
  }
  
  return true;
}

function checkFileSize(files) {
  const maxSize = 1024 * 1024; // 1MB
  let hasLargeFiles = false;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (stats.size > maxSize) {
        log(`⚠️  Large file detected: ${file} (${Math.round(stats.size / 1024)}KB)`, 'yellow');
        hasLargeFiles = true;
      }
    }
  });
  
  return !hasLargeFiles;
}

function checkForSecrets(files) {
  const secretPatterns = [
    /(?:password|passwd|pwd)\s*[=:]\s*["'][^"']+["']/i,
    /(?:secret|key|token)\s*[=:]\s*["'][^"']+["']/i,
    /(?:api[_-]?key)\s*[=:]\s*["'][^"']+["']/i,
    /(?:private[_-]?key)\s*[=:]\s*["'][^"']+["']/i,
    /(?:supabase[_-]?key)\s*[=:]\s*["'][^"']+["']/i
  ];
  
  let hasSecrets = false;
  
  files.forEach(file => {
    if (fs.existsSync(file) && !file.includes('.env')) {
      const content = fs.readFileSync(file, 'utf8');
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          log(`🚨 Potential secret detected in ${file}`, 'red');
          hasSecrets = true;
        }
      });
    }
  });
  
  return !hasSecrets;
}

function checkCommitMessage() {
  try {
    const commitMsgFile = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
    if (fs.existsSync(commitMsgFile)) {
      const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();
      
      // Check commit message format
      const minLength = 10;
      const maxLength = 72;
      
      if (commitMsg.length < minLength) {
        log(`❌ Commit message too short (minimum ${minLength} characters)`, 'red');
        return false;
      }
      
      if (commitMsg.split('\n')[0].length > maxLength) {
        log(`❌ Commit message first line too long (maximum ${maxLength} characters)`, 'red');
        return false;
      }
      
      // Check for conventional commit format (optional)
      const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .+/;
      if (!conventionalPattern.test(commitMsg)) {
        log('⚠️  Consider using conventional commit format (feat:, fix:, docs:, etc.)', 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    return true; // Don't fail if we can't check commit message
  }
}

function main() {
  log('🔒 Pre-commit Hook - Lich Kham Dashboard', 'cyan');
  log('========================================', 'cyan');
  
  const stagedFiles = getStagedFiles();
  const jsFiles = getJSFiles(stagedFiles);
  
  if (stagedFiles.length === 0) {
    log('⚠️  No staged files found', 'yellow');
    return true;
  }
  
  log(`\n📁 Found ${stagedFiles.length} staged files (${jsFiles.length} JS/TS files)`, 'blue');
  
  let allChecksPassed = true;
  
  // Basic file checks
  log('\n🔍 Running basic checks...', 'blue');
  if (!checkPackageJson()) allChecksPassed = false;
  if (!checkEnvFiles()) allChecksPassed = false;
  if (!checkFileSize(stagedFiles)) allChecksPassed = false;
  if (!checkForSecrets(stagedFiles)) allChecksPassed = false;
  if (!checkCommitMessage()) allChecksPassed = false;
  
  // Only run code quality checks if we have JS/TS files
  if (jsFiles.length > 0) {
    // ESLint check
    if (!runCommand('npm run lint', 'ESLint check')) {
      allChecksPassed = false;
    }
    
    // Prettier check
    if (!runCommand('npm run format:check', 'Prettier format check')) {
      log('💡 Run "npm run format" to fix formatting issues', 'yellow');
      allChecksPassed = false;
    }
    
    // Type check (if TypeScript)
    const hasTypeScript = jsFiles.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    if (hasTypeScript) {
      if (!runCommand('npm run type-check', 'TypeScript type check')) {
        allChecksPassed = false;
      }
    }
    
    // Run tests
    if (!runCommand('npm run test -- --passWithNoTests --watchAll=false', 'Unit tests')) {
      allChecksPassed = false;
    }
  }
  
  // Summary
  log('\n📊 Pre-commit Summary', 'cyan');
  log('====================', 'cyan');
  
  if (allChecksPassed) {
    log('\n✅ All checks passed! Commit allowed.', 'green');
    return true;
  } else {
    log('\n❌ Some checks failed! Please fix the issues before committing.', 'red');
    log('\n💡 Quick fixes:', 'yellow');
    log('• Run "npm run lint:fix" to fix linting issues', 'yellow');
    log('• Run "npm run format" to fix formatting issues', 'yellow');
    log('• Run "npm run test" to run tests', 'yellow');
    log('• Check for secrets in your code', 'yellow');
    return false;
  }
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

export { main };