# SkillBridge - SPM Motors

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

### 4. Environment Variables (Optional)

If you need environment variables for the backend (e.g., for Stripe API keys), create a `.env` file in the `backend` directory:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
```

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

## Project Structure

```
csd skill bridge/
├── frontend/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   └── Home.jsx
│   │   └── pages/
│   └── package.json
├── backend/           # Express backend
│   ├── api/
│   │   └── payment.js
│   ├── index.js
│   └── package.json
└── README.md
```

## Features

- ✅ User authentication (Login/Signup)
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
