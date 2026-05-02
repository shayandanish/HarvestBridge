const http = require('http');

const url = 'http://localhost:5000/uploads/land-photos/land1.jpg';

http.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

    if (res.statusCode === 200) {
        console.log('✅ File is accessible!');
    } else {
        console.log('❌ File is NOT accessible!');
    }
    res.resume();
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
