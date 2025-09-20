// Script to start all backend services
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MERN Stack Backend Services...\n');

// Service configurations
const services = [
  {
    name: 'Auth Service',
    command: 'node',
    args: ['services/auth/server.js'],
    port: 3001,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Course Service',
    command: 'node',
    args: ['services/courses/server.js'],
    port: 3002,
    color: '\x1b[32m' // Green
  },
  {
    name: 'AI Service',
    command: 'node',
    args: ['services/ai-recommendations/server.js'],
    port: 3003,
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'API Gateway',
    command: 'node',
    args: ['server.js'],
    port: 3000,
    color: '\x1b[33m' // Yellow
  }
];

const processes = [];

// Start each service
services.forEach((service, index) => {
  console.log(`${service.color}Starting ${service.name} on port ${service.port}...\x1b[0m`);
  
  const process = spawn(service.command, service.args, {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Handle service output
  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${service.color}[${service.name}]\x1b[0m ${output}`);
    }
  });

  process.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      console.error(`${service.color}[${service.name} ERROR]\x1b[0m ${error}`);
    }
  });

  process.on('close', (code) => {
    console.log(`${service.color}[${service.name}]\x1b[0m Process exited with code ${code}`);
  });

  process.on('error', (error) => {
    console.error(`${service.color}[${service.name} ERROR]\x1b[0m ${error.message}`);
  });

  processes.push(process);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  
  processes.forEach((process, index) => {
    console.log(`Stopping ${services[index].name}...`);
    process.kill('SIGTERM');
  });
  
  setTimeout(() => {
    console.log('✅ All services stopped.');
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  processes.forEach((process, index) => {
    process.kill('SIGTERM');
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

console.log('\n✅ All services started! Press Ctrl+C to stop all services.');
console.log('\n📋 Service URLs:');
console.log('   API Gateway: http://localhost:3000');
console.log('   Auth Service: http://localhost:3001');
console.log('   Course Service: http://localhost:3002');
console.log('   AI Service: http://localhost:3003');
console.log('\n🧪 Run "node test-services.js" to test all services');