// Test script to verify all backend services are working
const axios = require('axios');

const SERVICES = {
  GATEWAY: 'http://localhost:3000',
  AUTH: 'http://localhost:3001',
  COURSES: 'http://localhost:3002',
  AI: 'http://localhost:3003'
};

async function testService(name, url, endpoint = '/health') {
  try {
    console.log(`\n🔍 Testing ${name} Service...`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log(`✅ ${name} Service: HEALTHY`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      console.log(`❌ ${name} Service: UNHEALTHY (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} Service: ERROR`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAuthFlow() {
  try {
    console.log(`\n🔐 Testing Authentication Flow...`);
    
    // Test signup
    console.log('   Testing admin signup...');
    const signupResponse = await axios.post(`${SERVICES.AUTH}/api/auth/signup`, {
      username: 'testadmin',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    if (signupResponse.status === 201) {
      console.log('   ✅ Admin signup successful');
      const { token } = signupResponse.data.data;
      
      // Test login
      console.log('   Testing admin login...');
      const loginResponse = await axios.post(`${SERVICES.AUTH}/api/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResponse.status === 200) {
        console.log('   ✅ Admin login successful');
        
        // Test protected route
        console.log('   Testing protected route...');
        const profileResponse = await axios.get(`${SERVICES.AUTH}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.status === 200) {
          console.log('   ✅ Protected route access successful');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Auth flow error: ${error.message}`);
    return false;
  }
}

async function testCourseAPI() {
  try {
    console.log(`\n📚 Testing Course API...`);
    
    // Test get courses
    console.log('   Testing get courses...');
    const coursesResponse = await axios.get(`${SERVICES.COURSES}/api/courses?limit=5`);
    
    if (coursesResponse.status === 200) {
      console.log('   ✅ Get courses successful');
      console.log(`   Found ${coursesResponse.data.data.courses.length} courses`);
      
      // Test course search
      console.log('   Testing course search...');
      const searchResponse = await axios.get(`${SERVICES.COURSES}/api/courses/search?q=programming`);
      
      if (searchResponse.status === 200) {
        console.log('   ✅ Course search successful');
        console.log(`   Found ${searchResponse.data.data.courses.length} search results`);
        
        // Test course stats
        console.log('   Testing course statistics...');
        const statsResponse = await axios.get(`${SERVICES.COURSES}/api/courses/stats/overview`);
        
        if (statsResponse.status === 200) {
          console.log('   ✅ Course statistics successful');
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Course API error: ${error.message}`);
    return false;
  }
}

async function testAIAPI() {
  try {
    console.log(`\n🤖 Testing AI Recommendations API...`);
    
    // Test recommendations
    console.log('   Testing AI recommendations...');
    const recommendationsResponse = await axios.post(`${SERVICES.AI}/api/recommendations`, {
      topics: ['programming', 'web development'],
      skill_level: 'Beginner',
      learning_goals: ['Learn to code', 'Build websites'],
      preferred_duration: 'medium'
    });
    
    if (recommendationsResponse.status === 200) {
      console.log('   ✅ AI recommendations successful');
      console.log(`   Generated ${recommendationsResponse.data.data.recommendations.length} recommendations`);
      
      // Test trending courses
      console.log('   Testing trending courses...');
      const trendingResponse = await axios.get(`${SERVICES.AI}/api/recommendations/trending`);
      
      if (trendingResponse.status === 200) {
        console.log('   ✅ Trending courses successful');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ AI API error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Backend Services Test Suite\n');
  console.log('=' * 50);
  
  const results = {
    gateway: await testService('API Gateway', SERVICES.GATEWAY),
    auth: await testService('Auth', SERVICES.AUTH),
    courses: await testService('Courses', SERVICES.COURSES),
    ai: await testService('AI', SERVICES.AI),
    authFlow: await testAuthFlow(),
    courseAPI: await testCourseAPI(),
    aiAPI: await testAIAPI()
  };
  
  console.log('\n' + '=' * 50);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' * 50);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your backend is ready to go!');
  } else {
    console.log('⚠️  Some tests failed. Please check the services and try again.');
  }
}

// Run the tests
runAllTests().catch(console.error);