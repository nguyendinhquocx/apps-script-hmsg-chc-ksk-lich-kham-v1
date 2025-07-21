#!/usr/bin/env node

/**
 * Health Check script for Lich Kham Dashboard
 * Checks system health, dependencies, and Supabase connection
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
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

function checkStatus(condition, successMsg, failMsg) {
  if (condition) {
    log(`✅ ${successMsg}`, 'green');
    return true;
  } else {
    log(`❌ ${failMsg}`, 'red');
    return false;
  }
}

function checkWarning(condition, successMsg, warningMsg) {
  if (condition) {
    log(`✅ ${successMsg}`, 'green');
    return true;
  } else {
    log(`⚠️  ${warningMsg}`, 'yellow');
    return false;
  }
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
  }
  
  return env;
}

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  return checkStatus(
    majorVersion >= 16,
    `Node.js ${nodeVersion} is supported`,
    `Node.js ${nodeVersion} is not supported. Please upgrade to Node.js 16+`
  );
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    return checkStatus(
      majorVersion >= 8,
      `npm ${npmVersion} is supported`,
      `npm ${npmVersion} is not supported. Please upgrade to npm 8+`
    );
  } catch (error) {
    return checkStatus(false, '', 'npm is not installed');
  }
}

function checkRequiredFiles() {
  const files = [
    { path: 'package.json', required: true },
    { path: '.env', required: true },
    { path: '.env.example', required: false },
    { path: 'src/App.jsx', required: true },
    { path: 'src/components/DataTable.jsx', required: true },
    { path: 'src/components/Charts.jsx', required: true },
    { path: 'src/services/supabase.js', required: true },
    { path: 'src/constants/index.js', required: true },
    { path: 'src/utils/index.js', required: true }
  ];
  
  let allRequired = true;
  
  files.forEach(file => {
    const exists = fs.existsSync(file.path);
    if (file.required) {
      if (!checkStatus(exists, `${file.path} exists`, `${file.path} is missing`)) {
        allRequired = false;
      }
    } else {
      checkWarning(exists, `${file.path} exists`, `${file.path} is missing (optional)`);
    }
  });
  
  return allRequired;
}

function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'recharts',
      'lucide-react'
    ];
    
    let allDepsOk = true;
    
    requiredDeps.forEach(dep => {
      if (!checkStatus(
        dependencies[dep],
        `${dep} is installed`,
        `${dep} is missing from dependencies`
      )) {
        allDepsOk = false;
      }
    });
    
    return allDepsOk;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentVariables() {
  const env = loadEnvFile();
  
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'REACT_APP_DEBUG_LOGS',
    'REACT_APP_API_TIMEOUT',
    'REACT_APP_MAX_RECORDS_PER_PAGE'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    const exists = env[varName] && env[varName] !== `your_${varName.toLowerCase().replace('react_app_', '')}`;
    if (!checkStatus(
      exists,
      `${varName} is configured`,
      `${varName} is missing or not configured`
    )) {
      allRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    const exists = env[varName];
    checkWarning(
      exists,
      `${varName} is configured`,
      `${varName} is not configured (using default)`
    );
  });
  
  return allRequired;
}

function checkSupabaseConnection(env) {
  return new Promise((resolve) => {
    const supabaseUrl = env.REACT_APP_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      log('❌ Supabase URL not configured', 'red');
      resolve(false);
      return;
    }
    
    try {
      const url = new URL(supabaseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/rest/v1/',
        method: 'GET',
        timeout: 5000,
        headers: {
          'apikey': env.REACT_APP_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${env.REACT_APP_SUPABASE_ANON_KEY || ''}`
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          log('✅ Supabase connection successful', 'green');
          resolve(true);
        } else {
          log(`❌ Supabase connection failed (HTTP ${res.statusCode})`, 'red');
          resolve(false);
        }
      });
      
      req.on('error', (error) => {
        log(`❌ Supabase connection error: ${error.message}`, 'red');
        resolve(false);
      });
      
      req.on('timeout', () => {
        log('❌ Supabase connection timeout', 'red');
        req.destroy();
        resolve(false);
      });
      
      req.setTimeout(5000);
      req.end();
    } catch (error) {
      log(`❌ Invalid Supabase URL: ${error.message}`, 'red');
      resolve(false);
    }
  });
}

function checkBuildStatus() {
  try {
    log('🔨 Testing build process...', 'blue');
    execSync('npm run build', { stdio: 'pipe' });
    return checkStatus(true, 'Build process successful', 'Build process failed');
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, 'red');
    return false;
  }
}

function generateReport(results) {
  log('\n📊 Health Check Report', 'cyan');
  log('======================', 'cyan');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const healthScore = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\nOverall Health Score: ${healthScore}%`, healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red');
  log(`Passed: ${passedChecks}/${totalChecks} checks`, 'cyan');
  
  if (healthScore >= 80) {
    log('\n🎉 System is healthy and ready for development!', 'green');
  } else if (healthScore >= 60) {
    log('\n⚠️  System has some issues but should work', 'yellow');
  } else {
    log('\n🚨 System has critical issues that need attention', 'red');
  }
  
  log('\nRecommendations:', 'bright');
  if (!results.nodeVersion) {
    log('• Upgrade Node.js to version 16 or higher', 'yellow');
  }
  if (!results.envVars) {
    log('• Configure Supabase credentials in .env file', 'yellow');
  }
  if (!results.supabaseConnection) {
    log('• Check Supabase URL and API key', 'yellow');
  }
  if (!results.dependencies) {
    log('• Run "npm install" to install missing dependencies', 'yellow');
  }
}

async function main() {
  log('🏥 Lich Kham Dashboard Health Check', 'cyan');
  log('===================================', 'cyan');
  
  const results = {};
  
  log('\n🔍 Checking system requirements...', 'blue');
  results.nodeVersion = checkNodeVersion();
  results.npmVersion = checkNpmVersion();
  
  log('\n📁 Checking project files...', 'blue');
  results.files = checkRequiredFiles();
  
  log('\n📦 Checking dependencies...', 'blue');
  results.dependencies = checkDependencies();
  
  log('\n🔐 Checking environment variables...', 'blue');
  results.envVars = checkEnvironmentVariables();
  
  log('\n🌐 Checking Supabase connection...', 'blue');
  const env = loadEnvFile();
  results.supabaseConnection = await checkSupabaseConnection(env);
  
  // Skip build check in CI or if explicitly disabled
  if (!process.env.CI && !process.env.SKIP_BUILD_CHECK) {
    log('\n🔨 Checking build process...', 'blue');
    results.buildProcess = checkBuildStatus();
  }
  
  generateReport(results);
  
  // Exit with appropriate code
  const criticalChecks = ['nodeVersion', 'files', 'dependencies', 'envVars'];
  const criticalFailed = criticalChecks.some(check => !results[check]);
  
  process.exit(criticalFailed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`\n💥 Health check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { main };