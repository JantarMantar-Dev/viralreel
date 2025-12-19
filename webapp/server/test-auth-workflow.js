
const BASE_URL = 'http://127.0.0.1:3000';
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'Password123!';
const NAME = 'Test User';

async function testAuth() {
    console.log('--- Starting Auth API Verification ---');
    console.log(`Target: ${BASE_URL}`);
    console.log(`User: ${EMAIL}`);

    // 1. Sign Up
    console.log('\n1. Testing Sign Up...');
    try {
        console.log(`Sign Up URL: ${BASE_URL}/api/auth/sign-up/email`);
        const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME })
        });
        console.log(`Sign Up Response:`, signUpRes);
        const signUpText = await signUpRes.text();
        console.log(`Status: ${signUpRes.status}`);
        console.log(`Body: ${signUpText}`);

        if (!signUpRes.ok) throw new Error('Sign Up failed');
    } catch (e) {
        console.error('Sign Up Error:', e);
        return;
    }

    // 2. Sign In
    console.log('\n2. Testing Sign In...');
    let cookie = '';
    try {
        const signInRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        const signInText = await signInRes.text();
        console.log(`Status: ${signInRes.status}`);
        // console.log(`Body: ${signInText}`);

        cookie = signInRes.headers.get('set-cookie');
        console.log('Set-Cookie:', cookie ? 'Received' : 'Missing');

        if (!signInRes.ok) throw new Error('Sign In failed');
    } catch (e) {
        console.error('Sign In Error:', e);
        return;
    }

    // 3. Get Session
    console.log('\n3. Testing Get Session...');
    try {
        const sessionRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
            method: 'GET',
            headers: {
                'Cookie': cookie || ''
            }
        });

        const sessionData = await sessionRes.json();
        console.log(`Status: ${sessionRes.status}`);
        console.log(`Session:`, sessionData ? 'Valid' : 'Invalid');
        if (sessionData) {
            console.log(`User ID: ${sessionData.user?.id}`);
            console.log(`Email: ${sessionData.user?.email}`);
        }
    } catch (e) {
        console.error('Get Session Error:', e);
    }
}

testAuth();
