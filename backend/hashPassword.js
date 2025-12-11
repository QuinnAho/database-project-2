const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nRun this SQL command in phpMyAdmin:');
  console.log('\nDELETE FROM admin_users WHERE username = \'anna\';');
  console.log(`INSERT INTO admin_users (username, email, password, full_name, role) VALUES ('anna', 'anna@cleaning.com', '${hash}', 'Anna Johnson', 'admin');`);
}

hashPassword();
