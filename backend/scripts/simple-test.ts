#!/usr/bin/env node

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simpleTest() {
  console.log('Testing server...');
  
  // Wait a moment for server to be ready
  await wait(2000);
  
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Health check passed:', data);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

simpleTest();