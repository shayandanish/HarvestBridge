const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function run() {
    try {
        const farmId = '679c863b-c2e4-4dd2-9df1-c66bcf471527';
        const farm = await prisma.farm.findUnique({ where: { id: farmId } });
        if (!farm) { console.log('not found'); return; }

        const token = jwt.sign({ userId: farm.investorId, role: 'investor' }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: '1d' });

        console.log('Initiating payment for farm:', farmId);
        
        const payRes = await axios.post('http://localhost:5000/api/v1/payments/lease/initiate', {
            farmId,
            paymentMethod: 'pakistan'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('SUCCESS:', JSON.stringify(payRes.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('API ERROR RESPONSE:', error.response.status, error.response.data);
        } else {
            console.error('NETWORK ERROR:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

require('dotenv').config(); // Load env for JWT_SECRET
run();
