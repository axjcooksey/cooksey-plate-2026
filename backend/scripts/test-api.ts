#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);

    // Test get games for 2025
    console.log('\n2. Testing get games for 2025...');
    const games2025 = await axios.get(`${BASE_URL}/api/squiggle/games/2025`);
    console.log(`✅ Games 2025: ${games2025.data.count} games found`);

    // Test get Round 1 games
    console.log('\n3. Testing get Round 1 games...');
    const round1 = await axios.get(`${BASE_URL}/api/squiggle/games/2025?round=1`);
    console.log(`✅ Round 1: ${round1.data.count} games found`);
    console.log('Sample games:', round1.data.data.slice(0, 2).map((g: any) => 
      `${g.hteam} vs ${g.ateam} @ ${g.venue}`
    ));

    // Test get rounds
    console.log('\n4. Testing get rounds for 2025...');
    const rounds = await axios.get(`${BASE_URL}/api/squiggle/rounds/2025`);
    console.log(`✅ Rounds: ${rounds.data.count} rounds found`);

    // Test get stats
    console.log('\n5. Testing get stats for 2025...');
    const stats = await axios.get(`${BASE_URL}/api/squiggle/stats/2025`);
    console.log('✅ Stats:', stats.data.data.summary);

    // Test cache stats
    console.log('\n6. Testing cache stats...');
    const cacheStats = await axios.get(`${BASE_URL}/api/squiggle/cache/stats`);
    console.log('✅ Cache stats:', cacheStats.data.data);

    console.log('\n🎉 All API tests passed successfully!');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Test failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } else {
      console.error('❌ API Test failed:', error);
    }
    process.exit(1);
  }
}

testAPI();