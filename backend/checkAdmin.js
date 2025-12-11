require('dotenv').config();
const { query } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function checkAdmin() {
  try {
    console.log('Checking for admin users...\n');

    const admins = await query('SELECT * FROM admin_users');

    if (admins.length === 0) {
      console.log('No admin users found!');
      console.log('\nCreating admin user...');

      const password = 'password';
      const hash = await bcrypt.hash(password, 10);

      await query(
        'INSERT INTO admin_users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['anna', 'anna@cleaning.com', hash, 'Anna Johnson', 'admin']
      );

      console.log('Admin user created successfully!');
      console.log('Username: anna');
      console.log('Password: password');
    } else {
      console.log('Found admin users:');
      admins.forEach(admin => {
        console.log(`- ID: ${admin.admin_id}, Username: ${admin.username}, Email: ${admin.email}`);
      });

      console.log('\nTesting password for username "anna"...');
      const anna = admins.find(a => a.username === 'anna');
      if (anna) {
        const testPassword = 'password';
        const match = await bcrypt.compare(testPassword, anna.password);
        console.log(`Password "password" matches: ${match}`);

        if (!match) {
          console.log('\nPassword does not match! Updating...');
          const hash = await bcrypt.hash(testPassword, 10);
          await query('UPDATE admin_users SET password = ? WHERE username = ?', [hash, 'anna']);
          console.log('Password updated successfully!');
        }
      } else {
        console.log('User "anna" not found!');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkAdmin();
