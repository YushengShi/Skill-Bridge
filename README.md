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

# Session Secret (required for production)
SESSION_SECRET=your-session-secret-key-here

# Google OAuth (optional - for social login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173

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

2. **Password Hashing with bcrypt**: ✅ **IMPLEMENTED** - Passwords are securely hashed using bcrypt before storage:
   
   **How Password Security Works**:
   
   - **Registration**: When a user registers (student or teacher), their password is hashed using bcrypt with 10 salt rounds before being saved to the database
   - **Login**: During login, the provided password is compared against the stored hash using `bcrypt.compare()`, which securely verifies the password without ever storing or transmitting the plain text password
   - **Implementation**: 
     ```javascript
     // During registration
     const saltRounds = 10;
     const hashedPassword = await bcrypt.hash(password, saltRounds);
     
     // During login
     const isPasswordValid = await bcrypt.compare(password, user.password);
     ```
   
   **Why bcrypt?**:
   - **One-way hashing**: Passwords are hashed, not encrypted, meaning they cannot be reversed to reveal the original password
   - **Salt rounds**: The 10 salt rounds add computational complexity, making brute-force attacks extremely time-consuming
   - **Adaptive hashing**: bcrypt automatically adapts to increasing computational power, maintaining security over time
   - **Industry standard**: bcrypt is a widely-used, battle-tested password hashing algorithm
   
   **Security Benefits**:
   - Even if the database is compromised, attackers cannot retrieve original passwords
   - Each password hash is unique due to salting, preventing rainbow table attacks
   - Password verification is secure and efficient

3. **Token Expiration**: Tokens expire after 7 days. Consider implementing token refresh for better user experience.

4. **HTTPS**: Always use HTTPS in production to protect tokens during transmission.

5. **Token Validation**: Protected routes use JWT authentication middleware to validate tokens:
   ```javascript
   // Middleware implementation
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

## Session Management

This application uses a **hybrid authentication approach** that combines JWT tokens with server-side session management. This provides the benefits of both systems while maintaining minimal code complexity.

### Overview

The application uses:
- **JWT Tokens** for API authentication (stateless, scalable)
- **Server-side Sessions** for session management (logout invalidation, server-side control)

### How It Works

#### 1. **Login Process**

When a user logs in:

1. **JWT Token Generation**: A JWT token is created and returned to the frontend (stored in `localStorage`)
2. **Session Creation**: The same JWT token is also stored in a server-side session
3. **Session Cookie**: An httpOnly cookie (`skillbridge.sid`) is set to track the session

**Backend Implementation**:
```javascript
// JWT token is created (as before)
const token = jwt.sign({ id: user._id, email: user.email, role: "student" }, JWT_SECRET, { expiresIn: "7d" });

// Token is also stored in session
req.session.token = token;
req.session.userId = user._id.toString();
req.session.userRole = "student";

// Token is returned to frontend
res.json({ token, user: userData });
```

#### 2. **API Authentication**

API requests continue to use JWT tokens in the `Authorization` header (no changes to existing workflow):

```javascript
// Frontend sends JWT token in header
fetch('/api/students/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

The JWT middleware (`protect`) validates tokens as before - **no changes to authentication logic**.

#### 3. **Session Management Benefits**

**Server-Side Logout**:
- When a user logs out, the server destroys the session
- This allows immediate invalidation of sessions
- JWT tokens remain valid until expiration, but session tracking is cleared

**Logout Endpoints**:
- `POST /api/students/logout` - Destroys student session
- `POST /api/teachers/logout` - Destroys teacher session
- `POST /api/admin/logout` - Destroys admin session

**Frontend Logout**:
```javascript
// Logout destroys session on server
await fetch('/api/students/logout', {
  method: 'POST',
  credentials: 'include' // Sends session cookie
});

// Clear local storage
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Session Configuration

Sessions are configured in `backend/index.js`:

```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevents XSS attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
    name: "skillbridge.sid",
  })
);
```

### Environment Variables

For production, add a session secret to your `.env` file:

```env
JWT_SECRET=your-super-secure-random-secret-key-here
SESSION_SECRET=your-session-secret-key-here
```

### Benefits of Hybrid Approach

✅ **JWT Workflow Unchanged**: All existing API calls and authentication logic work exactly as before

✅ **Server-Side Control**: Sessions can be invalidated immediately on logout

✅ **Minimal Code Changes**: Only added session storage and logout endpoints

✅ **Security**: httpOnly cookies prevent XSS attacks on session cookies

✅ **Scalability**: JWT tokens remain stateless for API authentication

✅ **Backward Compatible**: Existing JWT-based authentication continues to work

### Session vs JWT

| Feature | JWT Token | Session |
|---------|-----------|---------|
| **Storage** | Client-side (`localStorage`) | Server-side (memory/database) |
| **Authentication** | Used for API requests | Used for session tracking |
| **Logout** | Token remains valid until expiration | Can be immediately destroyed |
| **Scalability** | Stateless, works across servers | Requires shared session store |
| **Security** | Vulnerable to XSS if in `localStorage` | httpOnly cookies prevent XSS |

In this hybrid approach, JWT handles authentication while sessions provide server-side management capabilities.

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
- ✅ **Hybrid session management** - JWT tokens + server-side sessions for enhanced security
- ✅ Secure token-based authentication
- ✅ **Password security with bcrypt hashing** - Passwords are hashed before storage
- ✅ Server-side logout with session invalidation
- ✅ Form validation
- ✅ Password visibility toggle
- ✅ **Google OAuth login** - Free social authentication (see setup guide)
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

## Google OAuth Setup Guide

### ✅ Assessment: Google OAuth is **100% FREE**

- **Free Tier**: Unlimited users, 100 requests/second
- **No Credit Card Required**
- **Paid Only If**: Exceeding 100 req/sec (unlikely for most apps)

### 📋 Setup Steps

#### 1. Install Required Packages

```bash
cd backend
npm install passport passport-google-oauth20
```

#### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API** (or **Google Identity Services**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: SkillBridge (or your app name)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `http://localhost:5173` (development)
     - Your production domain (when deployed)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - Your production callback URL (when deployed)

6. Copy **Client ID** and **Client Secret**

#### 3. Add Environment Variables

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173
```

#### 4. Update Backend CORS (if needed)

Make sure `backend/index.js` allows your frontend origin:

```javascript
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
```

#### 5. Test the Implementation

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Go to login page
4. Click "Google" button
5. Select role (student/teacher)
6. Complete Google OAuth flow
7. Should redirect back and log you in!

### 🔧 How It Works

1. **User clicks "Google" button** → Redirects to `/api/auth/google?role=student`
2. **Google OAuth flow** → User authenticates with Google
3. **Callback** → `/api/auth/google/callback` receives Google profile
4. **User creation/linking**:
   - If user exists with Google ID → Login
   - If user exists with email → Link Google account
   - If new user → Create account
5. **JWT token generated** → Same as email/password login
6. **Redirect to frontend** → `/auth/callback?token=...&role=...`
7. **Frontend stores token** → User is logged in!

### 🎯 Features

- ✅ **Free** - No cost for normal usage
- ✅ **Secure** - Uses Google's OAuth 2.0
- ✅ **Seamless** - Works with existing JWT workflow
- ✅ **Account Linking** - Links Google to existing email accounts
- ✅ **Role Support** - Supports both student and teacher roles

### ⚠️ Important Notes

1. **Development vs Production**:
   - Update redirect URIs in Google Console for production
   - Update `FRONTEND_URL` in `.env` for production

2. **Security**:
   - Never commit `.env` file with credentials
   - Use different OAuth credentials for dev/prod

3. **Rate Limits**:
   - Free tier: 100 requests/second
   - Monitor usage in Google Cloud Console

### 🐛 Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check authorized redirect URIs in Google Console
- Must match exactly: `http://localhost:3000/api/auth/google/callback`

**Error: "invalid_client"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Make sure credentials are for the correct project

**User not created**
- Check MongoDB connection
- Check console logs for errors
- Verify Student/Teacher models have `googleId` field

### 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
