
# Project Title

This project is a web application that implements JWT (JSON Web Token) based authentication. It has a simple frontend built with React and a backend built with Express and MySQL.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v14 or later) and npm (Node Package Manager)
- **MySQL** (Ensure that you have MySQL installed and running)

## How to Run the Project

Follow these steps to clone and run this project on your local machine.

### Step 1: Clone the Repository

First, clone this repository to your local machine.

```bash
git clone https://github.com/atahabilder1/jwt-auth-tutorial.git
```

 
After cloning, navigate into the project directory:

```bash
cd jwt-auth-tutorial
```

### Step 2: Set Up the Backend (Express & MySQL)

1. **Navigate to the `backend` directory**:

   ```bash
   cd backend
   ```

2. **Install the backend dependencies**:

   ```bash
   npm install
   ```

3. **Create the MySQL Database and Table**:

   - Start your MySQL service (using XAMPP, MAMP, or MySQL Workbench).
   - Open a MySQL client (like MySQL Workbench or the command line) and run the following SQL command to create the database and table:

   ```sql
   CREATE DATABASE jwt_auth_db;

   USE jwt_auth_db;

   CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(100) NOT NULL,
       email VARCHAR(100) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **Start the backend server**:

   ```bash
   npm start
   ```

   The backend will run on `http://localhost:5000`.

### Step 3: Set Up the Frontend (React)

1. **Navigate to the `frontend` directory**:

   ```bash
   cd ../frontend
   ```

2. **Install the frontend dependencies**:

   ```bash
   npm install
   ```

3. **Start the frontend server**:

   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`.

### Step 4: Usage

1. **Access the Web Application**:

   Open your browser and go to `http://localhost:3000`. This will load the homepage of the application.

2. **Registration**:

   - To create a new user, go to the **Register** page (`http://localhost:3000/register`) and fill in the registration form.

3. **Login**:

   - After registering, log in using the **Login** page (`http://localhost:3000/login`).
   - On successful login, a JWT (JSON Web Token) will be generated and stored in your browser's **localStorage**.

4. **Dashboard & Profile (Protected Pages)**:

   - After logging in, you will be redirected to the **Dashboard** (`http://localhost:3000/dashboard`), a protected page that requires authentication.
   - You can also navigate to the **Profile** page (`http://localhost:3000/profile`), which is another protected page.

### Step 5: Logging Out

To log out, click the **Logout** button on the dashboard or profile pages. This will remove the JWT token from `localStorage` and log you out.

### Step 6: Troubleshooting

- **MySQL Connection Issues**: Ensure that MySQL is running and your credentials (username, password, database) in `backend/server.js` are correct.
- **Port Conflicts**: If `localhost:5000` (backend) or `localhost:3000` (frontend) is already in use, make sure to close any services occupying those ports or change the port number.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.