#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testAllAPIs() {
  try {
    console.log('🧪 Testing all Cooksey Plate API endpoints...\n');

    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data.message);

    // Test API info endpoint
    console.log('\n2. Testing API info endpoint...');
    const apiInfo = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API Info:', apiInfo.data.message);
    console.log('   Available endpoints:', Object.keys(apiInfo.data.endpoints).join(', '));

    // Test users endpoints
    console.log('\n3. Testing users endpoints...');
    const users = await axios.get(`${BASE_URL}/api/users`);
    console.log(`✅ Users: ${users.data.count} users found`);
    
    if (users.data.count > 0) {
      const firstUser = users.data.data[0];
      console.log(`   Sample user: ${firstUser.name} (${firstUser.family_group_name})`);
      
      // Test user by ID
      const userById = await axios.get(`${BASE_URL}/api/users/${firstUser.id}`);
      console.log(`✅ User by ID: ${userById.data.data.name}`);
      
      // Test user stats
      const userStats = await axios.get(`${BASE_URL}/api/users/${firstUser.id}/stats?year=2025`);
      console.log(`✅ User stats: ${userStats.data.data.total_tips} total tips`);
      
      // Test users can tip for
      const canTipFor = await axios.get(`${BASE_URL}/api/users/${firstUser.id}/can-tip-for`);
      console.log(`✅ Can tip for: ${canTipFor.data.count} users`);
    }

    // Test family groups endpoints
    console.log('\n4. Testing family groups endpoints...');
    const familyGroups = await axios.get(`${BASE_URL}/api/family-groups`);
    console.log(`✅ Family groups: ${familyGroups.data.count} groups found`);
    
    if (familyGroups.data.count > 0) {
      const firstGroup = familyGroups.data.data[0];
      console.log(`   Sample group: ${firstGroup.name} (${firstGroup.member_count} members)`);
      
      // Test family group by ID
      const groupById = await axios.get(`${BASE_URL}/api/family-groups/${firstGroup.id}`);
      console.log(`✅ Group by ID: ${groupById.data.data.name} with ${groupById.data.data.members?.length} members`);
    }

    // Test rounds endpoints
    console.log('\n5. Testing rounds endpoints...');
    const rounds2025 = await axios.get(`${BASE_URL}/api/rounds/2025`);
    console.log(`✅ Rounds 2025: ${rounds2025.data.count} rounds found`);
    
    if (rounds2025.data.count > 0) {
      const currentRound = await axios.get(`${BASE_URL}/api/rounds/current/2025`);
      console.log(`✅ Current round: Round ${currentRound.data.data.round_number} (${currentRound.data.data.status})`);
      
      const firstRound = rounds2025.data.data[0];
      // Test round games
      const roundGames = await axios.get(`${BASE_URL}/api/rounds/${firstRound.id}/games`);
      console.log(`✅ Round ${firstRound.round_number} games: ${roundGames.data.count} games`);
      
      // Test round stats
      const roundStats = await axios.get(`${BASE_URL}/api/rounds/${firstRound.id}/stats`);
      console.log(`✅ Round ${firstRound.round_number} stats: ${roundStats.data.data.total_tips} total tips`);
      
      // Test is round open
      const isOpen = await axios.get(`${BASE_URL}/api/rounds/${firstRound.id}/is-open`);
      console.log(`✅ Round ${firstRound.round_number} open: ${isOpen.data.data.is_open}`);
    }

    // Test tips endpoints
    console.log('\n6. Testing tips endpoints...');
    if (rounds2025.data.count > 0 && users.data.count > 0) {
      const firstRound = rounds2025.data.data[0];
      const firstUser = users.data.data[0];
      
      // Test user tips for round
      const userRoundTips = await axios.get(`${BASE_URL}/api/tips/user/${firstUser.id}/round/${firstRound.id}`);
      console.log(`✅ User round tips: ${userRoundTips.data.count} tips for ${firstUser.name} in round ${firstRound.round_number}`);
      
      // Test all user tips
      const allUserTips = await axios.get(`${BASE_URL}/api/tips/user/${firstUser.id}?year=2025`);
      console.log(`✅ All user tips: ${allUserTips.data.count} tips for ${firstUser.name} in 2025`);
      
      // Test round tips
      const roundTips = await axios.get(`${BASE_URL}/api/tips/round/${firstRound.id}`);
      console.log(`✅ Round tips: ${roundTips.data.count} tips in round ${firstRound.round_number}`);
    }

    // Test ladder endpoints
    console.log('\n7. Testing ladder endpoints...');
    const ladder2025 = await axios.get(`${BASE_URL}/api/ladder/2025`);
    console.log(`✅ Ladder 2025: ${ladder2025.data.data.ladder.length} users on ladder`);
    
    if (ladder2025.data.data.ladder.length > 0) {
      const topUser = ladder2025.data.data.ladder[0];
      console.log(`   Top user: ${topUser.user_name} with ${topUser.correct_tips} correct tips (${topUser.percentage}%)`);
      
      // Test user ladder position
      const userPosition = await axios.get(`${BASE_URL}/api/ladder/2025/user/${topUser.user_id}`);
      console.log(`✅ User ladder position: ${userPosition.data.data.user_name} is rank ${userPosition.data.data.rank}`);
      
      // Test user performance
      const userPerformance = await axios.get(`${BASE_URL}/api/ladder/2025/user/${topUser.user_id}/performance`);
      console.log(`✅ User performance: ${userPerformance.data.count} rounds of data`);
      
      // Test user streaks
      const userStreaks = await axios.get(`${BASE_URL}/api/ladder/2025/user/${topUser.user_id}/streaks`);
      console.log(`✅ User streaks: Current ${userStreaks.data.data.current_streak_type} streak of ${userStreaks.data.data.current_streak}`);
      
      // Test family group standings
      const familyStandings = await axios.get(`${BASE_URL}/api/ladder/2025/family-groups`);
      console.log(`✅ Family standings: ${familyStandings.data.count} family groups competing`);
      
      if (familyStandings.data.count > 0) {
        const topFamily = familyStandings.data.data[0];
        console.log(`   Top family: ${topFamily.family_group_name} with ${topFamily.correct_tips} correct tips`);
      }
    }

    // Test Squiggle endpoints
    console.log('\n8. Testing Squiggle endpoints...');
    const squiggleGames = await axios.get(`${BASE_URL}/api/squiggle/games/2025?round=1`);
    console.log(`✅ Squiggle games: ${squiggleGames.data.count} games for Round 1 2025`);
    
    const squiggleStats = await axios.get(`${BASE_URL}/api/squiggle/stats/2025`);
    console.log(`✅ Squiggle stats: ${squiggleStats.data.data.summary.total_games} total games in 2025`);

    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📊 API Summary:');
    console.log(`   • ${users.data.count} users across ${familyGroups.data.count} family groups`);
    console.log(`   • ${rounds2025.data.count} rounds with ${squiggleStats.data.data.summary.total_games} games in 2025`);
    console.log(`   • ${ladder2025.data.data.ladder.length} users actively tipping`);
    console.log(`   • ${ladder2025.data.data.completed_rounds}/${ladder2025.data.data.total_rounds} rounds completed`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Test failed:', {
        url: error.config?.url,
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

testAllAPIs();