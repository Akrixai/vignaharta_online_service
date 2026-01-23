
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
        }
    }
}

loadEnv();

const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

async function checkOperator() {
    try {
        const formData = new URLSearchParams();
        formData.append('api_key', KWIKAPI_API_KEY);
        formData.append('opid', '76');

        const response = await fetch('https://www.kwikapi.com/api/v2/operatorFetch.php', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error.message);
    }
}

checkOperator();
