require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
    console.log('Testing Cloudinary connection...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary Connection Successful:', result);
        
        // Test a simple upload (using a base64 pixel)
        console.log('Testing sample upload...');
        const uploadResult = await cloudinary.uploader.upload('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', {
            folder: 'test_connection'
        });
        console.log('✅ Sample Upload Successful!');
        console.log('URL:', uploadResult.secure_url);
        
        // Delete the test image
        await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log('✅ Cleanup Successful');
    } catch (error) {
        console.error('❌ Cloudinary Test Failed:');
        console.error(error);
    }
}

testCloudinary();
