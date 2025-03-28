// generator.js
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Generate a new key pair
const keypair = Keypair.generate();

// Convert the secret key (Uint8Array) to an array of numbers and then to JSON string
const secretKeyString = JSON.stringify(Array.from(keypair.secretKey));
const publicKeyString = keypair.publicKey.toBase58();

// Prepare .env file content
const envContent = `PRIVATE_KEY=${secretKeyString}
PUBLIC_KEY=${publicKeyString}
`;

// Determine the path to .env in the same directory as this script
const envPath = path.join(process.cwd(), '.env');

// Write the .env file
fs.writeFileSync(envPath, envContent);

console.log('Key pair generated successfully:');
console.log(`Public Key: ${publicKeyString}`);
console.log(`Keys saved to ${envPath}`);
