
import { getLocalDb, createUser } from './server/localDb';
import bcrypt from 'bcryptjs';

async function main() {
  const db = getLocalDb();
  const username = 'alliff112233';
  const password = '123123123';
  
  console.log(`Checking for user: ${username}...`);
  
  const existing = db.prepare('SELECT * FROM local_users WHERE username = ?').get(username) as any;
  
  if (existing) {
    console.log('User already exists, updating to admin...');
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE local_users SET password_hash = ?, is_admin = 1 WHERE id = ?').run(hash, existing.id);
    console.log('User updated to admin successfully.');
  } else {
    console.log('Creating new admin user...');
    const user = createUser(username, password);
    if (user) {
      db.prepare('UPDATE local_users SET is_admin = 1 WHERE id = ?').run(user.id);
      console.log('Admin user created successfully.');
    } else {
      console.error('Failed to create user.');
    }
  }
}

main().catch(console.error);
