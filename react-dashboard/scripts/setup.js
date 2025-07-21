#!/usr/bin/env node

/**
 * Setup script for Lich Kham Dashboard
 * Automatically runs after npm install to configure the project
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

function createFileFromTemplate(templatePath, targetPath, description) {
  try {
    if (!fs.existsSync(targetPath) && fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, targetPath);
      log(`✅ Created ${description}`, 'green');
      return true;
    } else if (fs.existsSync(targetPath)) {
      log(`ℹ️  ${description} already exists`, 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ Failed to create ${description}: ${error.message}`, 'red');
    return false;
  }
  return false;
}

function main() {
  log('\n🚀 Setting up Lich Kham Dashboard...', 'cyan');
  log('=====================================', 'cyan');

  const projectRoot = process.cwd();
  const envExamplePath = path.join(projectRoot, '.env.example');
  const envPath = path.join(projectRoot, '.env');
  const gitignorePath = path.join(projectRoot, '.gitignore');

  // Check required files
  log('\n📋 Checking required files...', 'blue');
  
  const hasEnvExample = checkFile(envExamplePath, '.env.example');
  const hasEnv = checkFile(envPath, '.env');
  const hasGitignore = checkFile(gitignorePath, '.gitignore');

  // Create .env from .env.example if it doesn't exist
  if (hasEnvExample && !hasEnv) {
    createFileFromTemplate(envExamplePath, envPath, '.env file');
    log('\n⚠️  Please update .env file with your Supabase credentials!', 'yellow');
  }

  // Create .gitignore if it doesn't exist
  if (!hasGitignore) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production build
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Temporary folders
tmp/
temp/`;
    
    try {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      log('✅ Created .gitignore file', 'green');
    } catch (error) {
      log(`❌ Failed to create .gitignore: ${error.message}`, 'red');
    }
  }

  // Check Node.js version
  log('\n🔍 Checking Node.js version...', 'blue');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    log(`✅ Node.js ${nodeVersion} is supported`, 'green');
  } else {
    log(`❌ Node.js ${nodeVersion} is not supported. Please upgrade to Node.js 16+`, 'red');
  }

  // Check if Supabase credentials are configured
  log('\n🔐 Checking Supabase configuration...', 'blue');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSupabaseUrl = envContent.includes('REACT_APP_SUPABASE_URL=') && 
                          !envContent.includes('your_supabase_project_url');
    const hasSupabaseKey = envContent.includes('REACT_APP_SUPABASE_ANON_KEY=') && 
                          !envContent.includes('your_supabase_anon_key');
    
    if (hasSupabaseUrl && hasSupabaseKey) {
      log('✅ Supabase credentials configured', 'green');
    } else {
      log('⚠️  Supabase credentials not configured', 'yellow');
      log('   Please update REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env', 'yellow');
    }
  }

  // Display next steps
  log('\n🎉 Setup completed!', 'green');
  log('==================', 'green');
  log('\nNext steps:', 'bright');
  log('1. Configure your Supabase credentials in .env file', 'cyan');
  log('2. Set up your database schema (see README.md)', 'cyan');
  log('3. Run "npm run dev" to start development server', 'cyan');
  log('4. Visit http://localhost:3000 to view the application', 'cyan');
  
  log('\nUseful commands:', 'bright');
  log('• npm run dev          - Start development server', 'magenta');
  log('• npm run build        - Build for production', 'magenta');
  log('• npm run lint         - Run ESLint', 'magenta');
  log('• npm run test         - Run tests', 'magenta');
  log('• npm run health-check - Check system health', 'magenta');
  
  log('\nFor more information, see README.md', 'cyan');
  log('\n🚀 Happy coding!', 'green');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };