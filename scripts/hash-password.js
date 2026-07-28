// Generate a scrypt salt+hash for a /build login user.
//   node scripts/hash-password.js <username> <password>
// Prints the "user:salt:hash" token to add to the SMT_BUILD_USERS env var
// (comma-separate multiple users). Passwords are never stored anywhere.
const crypto = require('crypto');

const [, , user, pass] = process.argv;
if (!user || !pass) {
  console.error('Usage: node scripts/hash-password.js <username> <password>');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(pass, salt, 64);
console.log(`${user.toLowerCase()}:${salt.toString('hex')}:${hash.toString('hex')}`);
