const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
const backendNodeModulesPath = path.join(__dirname, 'backend', 'node_modules');

function hasValidKey(envContent) {
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('GEMINI_API_KEY=') || line.startsWith('DEEPSEEK_API_KEY=') || line.startsWith('OPENAI_API_KEY=')) {
      const key = line.split('=')[1].trim();
      if (key && key !== 'your-gemini-key-here' && key !== 'dev-gemini-key' && key !== 'your-key-here') {
        return true;
      }
    }
  }
  return false;
}

async function runWizard() {
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    if (hasValidKey(envContent)) {
      console.log('✓ Configuration found. Starting...');
      checkAndInstallDeps();
      return;
    }
  }

  console.log(`
╔══════════════════════════════════════════════╗
║   CV Prompt Injection Tool — First Run       ║
║   Optimiza tu CV para sistemas ATS con IA    ║
╚══════════════════════════════════════════════╝

Step 1: Choose your AI provider
  1. Google Gemini (recommended, free tier: 15 RPM)
  2. DeepSeek (~$0.14/1M tokens, China-friendly)  
  3. OpenAI-compatible (Qwen, Groq, Ollama, etc.)`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

  let choice = '';
  while (!['1', '2', '3'].includes(choice)) {
    choice = await askQuestion('Select [1-3]: ');
  }

  let envContent = '';

  if (choice === '1') {
    const key = await askQuestion('Enter your Gemini API key (get one at https://aistudio.google.com/apikey): ');
    envContent = `AI_PROVIDER=gemini\nGEMINI_API_KEY=${key}\n`;
  } else if (choice === '2') {
    const key = await askQuestion('Enter your DeepSeek API key: ');
    envContent = `AI_PROVIDER=deepseek\nDEEPSEEK_API_KEY=${key}\n`;
  } else if (choice === '3') {
    const key = await askQuestion('Enter your API key: ');
    const url = await askQuestion('Enter API endpoint URL (e.g. https://api.openai.com/v1): ');
    envContent = `AI_PROVIDER=openai-compatible\nOPENAI_API_KEY=${key}\nOPENAI_BASE_URL=${url}\n`;
  }

  rl.close();

  // Ensure backend directory exists
  if (!fs.existsSync(path.join(__dirname, 'backend'))) {
    fs.mkdirSync(path.join(__dirname, 'backend'), { recursive: true });
  }
  fs.writeFileSync(backendEnvPath, envContent);

  // Ensure frontend directory exists
  if (!fs.existsSync(path.join(__dirname, 'frontend'))) {
    fs.mkdirSync(path.join(__dirname, 'frontend'), { recursive: true });
  }
  fs.writeFileSync(frontendEnvPath, 'PUBLIC_API_URL=http://localhost:3000\n');

  console.log('✅ Configuration saved!');
  
  checkAndInstallDeps();
  
  console.log('🚀 Starting CV Prompt Injection Tool...\n');
}

function checkAndInstallDeps() {
  if (!fs.existsSync(backendNodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    try {
      execSync('npm run install:all', { stdio: 'inherit', cwd: __dirname });
    } catch (error) {
      console.error('Failed to install dependencies:', error.message);
    }
  }
}

runWizard().catch(console.error);
