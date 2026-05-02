const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testAdminAPI() {
    try {
        console.log('Testing admin farmer profiles API...');
        
        // Test the pending farmers endpoint
        const response = await axios.get(`${API_BASE}/admin/farmers/profiles/pending`);
        console.log('✅ API Response:', response.data);
        console.log('✅ Pending farmers count:', response.data.data?.length || 0);
        
    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Make sure the backend server is running: npm run dev');
        }
    }
}

testAdminAPI();
