// Test script for farmer profile API
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testFarmerAPI() {
    try {
        console.log('Testing farmer API...');
        
        // Test health endpoint
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health check:', healthResponse.data);
        
        // Test farmer profile endpoint (will fail without auth, but should show route exists)
        try {
            const profileResponse = await axios.get(`${API_BASE}/farmer/profile`);
            console.log('✅ Farmer profile endpoint accessible');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Farmer profile endpoint exists (auth required)');
            } else {
                throw error;
            }
        }
        
    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the backend server is running: npm run dev');
        }
    }
}

testFarmerAPI();
