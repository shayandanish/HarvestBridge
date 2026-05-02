const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testRegistration() {
    console.log('--- Testing Registration Flow ---');
    
    const testUser = {
        fullName: 'Test Landowner ' + Date.now(),
        email: 'landowner' + Date.now() + '@example.com',
        password: 'Password123!',
        role: 'landowner',
        phone: '123' + Math.floor(Math.random() * 10000000)
    };

    try {
        console.log('Registering user:', testUser.email);
        const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
        
        console.log('Register Response Status:', registerRes.status);
        console.log('Register Response Data Keys:', Object.keys(registerRes.data.data));
        
        const { accessToken, refreshToken, user } = registerRes.data.data;
        
        if (accessToken && refreshToken) {
            console.log('✅ Tokens received successfully');
        } else {
            console.error('❌ Tokens missing from response');
            process.exit(1);
        }

        if (user && user.email === testUser.email) {
            console.log('✅ User data received correctly');
        } else {
            console.error('❌ User data missing or incorrect');
            process.exit(1);
        }

        // Test if token works
        console.log('\n--- Testing Token Validity ---');
        const profileRes = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        console.log('Profile Response Status:', profileRes.status);
        if (profileRes.data.data.email === testUser.email) {
            console.log('✅ Token is valid and working');
        } else {
            console.error('❌ Token produced incorrect user profile');
            process.exit(1);
        }

        console.log('\n--- ALL REGISTRATION TESTS PASSED ---');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testRegistration();
