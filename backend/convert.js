const fs = require('fs');

const serviceAccount = fs.readFileSync('./betting-site-1fd0c-firebase-adminsdk-9nhsa-766055e5a9.json', 'utf8');
const base64Encoded = Buffer.from(serviceAccount).toString('base64');
console.log(base64Encoded); // Copy this output
