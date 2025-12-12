# SkillBridge

A full-stack application with React frontend and Express backend.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Set Up MongoDB

Make sure MongoDB is running on your local machine:
- Default connection: `mongodb://localhost:27017/skillbridge`
- If MongoDB is not installed, you can download it from [mongodb.com](https://www.mongodb.com/try/download/community)

### 4. Environment Variables (Recommended)

Create a `.env` file in the `backend` directory for secure configuration:

```env
# JWT Secret (required for production)
JWT_SECRET=your-super-secure-random-secret-key-here

# Stripe API Key (if using payment features)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

**Note**: The JWT_SECRET should be a long, randomly generated string. In production, never commit this file to version control. The application will work without it in development mode, but uses a default secret (not secure for production).

## Running the Application

### Option 1: Run Both Servers Separately (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Backend will run on: http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:5173

### Option 2: Run in Development Mode

Both servers use the same commands for development:
- Backend: `npm start` or `npm run dev`
- Frontend: `npm run dev`

## Accessing the Application

1. Open your browser and navigate to: **http://localhost:5173**
2. You'll be redirected to the login page
3. Use demo credentials:
   - Email: `demo@example.com`
   - Password: `password123`
4. Or create a new account using the "Sign up here" link

## JWT Token Authentication

This application uses **JSON Web Tokens (JWT)** for secure user authentication. Here's how it works:

### Overview

When a user successfully logs in, the backend generates a JWT token that contains the user's information (ID, email, role). This token is then stored on the frontend and used to authenticate subsequent requests.

### How JWT Tokens Work

#### 1. **Login Process**

When a user submits login credentials:

1. **Frontend** sends a POST request to `/api/students/login` with email and password
2. **Backend** validates the credentials against the database
3. **Backend** generates a JWT token containing:
   ```json
   {
     "id": "student_mongodb_id",
     "email": "user@example.com",
     "role": "student"
   }
   ```
4. **Backend** returns the token and user information (without password)
5. **Frontend** stores the token in `localStorage` as `token`

#### 2. **Token Storage**

The JWT token is stored in the browser's `localStorage`:
- **Key**: `token`
- **Additional data**: User information is stored as `user` in `localStorage`
- **Expiration**: Tokens expire after 7 days

#### 3. **Authentication Check**

The application checks for authentication by:
- Looking for the `token` in `localStorage` on app initialization
- If token exists, user is considered authenticated
- If token is missing, user is redirected to login page

#### 4. **Logout Process**

When a user logs out:
- The JWT token is removed from `localStorage`
- User information is cleared
- User is redirected to the login page

### Backend Implementation

**Login Endpoint**: `POST /api/students/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "student",
    ...
  }
}
```

**Error Response** (401):
```json
{
  "message": "Invalid email or password"
}
```

### Frontend Implementation

**Token Storage**:
```javascript
// After successful login
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// Check authentication
const token = localStorage.getItem('token');
const isAuthenticated = !!token;

// Logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Security Notes

⚠️ **Important Security Considerations**:

1. **JWT Secret**: In production, always use a strong, randomly generated secret stored in environment variables:
   ```env
   JWT_SECRET=your-very-secure-random-secret-key
   ```

2. **Password Hashing**: Currently, passwords are stored as plain text. For production, implement bcrypt hashing:
   - Hash passwords before saving to database
   - Use `bcrypt.compare()` to verify passwords during login

3. **Token Expiration**: Tokens expire after 7 days. Consider implementing token refresh for better user experience.

4. **HTTPS**: Always use HTTPS in production to protect tokens during transmission.

5. **Token Validation**: In the future, add middleware to validate tokens on protected routes:
   ```javascript
   // Example middleware (to be implemented)
   const authenticateToken = (req, res, next) => {
     const token = req.headers['authorization']?.split(' ')[1];
     if (!token) return res.sendStatus(401);
     
     jwt.verify(token, JWT_SECRET, (err, user) => {
       if (err) return res.sendStatus(403);
       req.user = user;
       next();
     });
   };
   ```

### Environment Variables

For production, set the JWT secret in your `.env` file:

```env
JWT_SECRET=your-super-secure-random-secret-key-here
```

The backend will use this secret to sign and verify tokens. If not set, it defaults to a development secret (not recommended for production).

## Project Structure

```
csd skill bridge/
├── frontend/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Login.jsx       # Login/Signup component with JWT
│   │   │   ├── Home.jsx
│   │   │   └── TeacherHome.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── PaymentForm.jsx
│   │   ├── App.jsx             # Main app with routing & auth
│   │   └── main.jsx
│   └── package.json
├── backend/                     # Express backend
│   ├── api/
│   │   ├── students.js         # Student routes (includes /login)
│   │   ├── teachers.js
│   │   └── payment.js
│   ├── models/                 # Mongoose models
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   └── Booking.js
│   ├── index.js                # Server entry point
│   ├── package.json
│   └── .env                    # Environment variables (create this)
└── README.md
```

## Features

- ✅ User authentication with JWT tokens (Login/Signup)
- ✅ Secure token-based authentication
- ✅ Form validation
- ✅ Password visibility toggle
- ✅ Social login buttons (Google, Microsoft)
- ✅ Responsive design
- ✅ Payment integration (Stripe)
- ✅ MongoDB database integration

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongodb://localhost:27017`
- Check if MongoDB service is started on your system

### Port Already in Use
- Backend (3000): Change `PORT` in `backend/index.js`
- Frontend (5173): Vite will automatically use the next available port

### CORS Issues
- Backend is configured to allow requests from `http://localhost:5173`
- If using a different port, update CORS settings in `backend/index.js`

## Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```
