import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Login.css';

function Login({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  
  const [uiRole, setUiRole] = useState('student'); // 'student' | 'teacher'

  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teacherName, setTeacherName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [uiRole, isSignupMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const baseUrl = 'http://localhost:3000/api';
    const rolePath = uiRole === 'student' ? 'students' : 'teachers';
    
    // if student register：POST /api/students
    // if teacher register：POST /api/teachers/register
    // if login：POST /api/xxx/login
    let url = '';
    if (isSignupMode) {
       url = uiRole === 'student' 
        ? `${baseUrl}/students` 
        : `${baseUrl}/teachers/register`;
    } else {
       url = `${baseUrl}/${rolePath}/login`;
    }

    // 2. 构建请求体
    const payload = { email, password };
    
    // 只有注册时才需要额外字段
    if (isSignupMode) {
        if (uiRole === 'student') {
            payload.firstName = firstName;
            payload.lastName = lastName;
        } else {
            payload.name = teacherName;
        }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isSignupMode) {
        setSuccessMessage('Account created successfully! Please log in.');
        setIsSignupMode(false);
      } else {
        localStorage.setItem('token', data.token);
        
        try {
            const decoded = jwtDecode(data.token);
            setUserRole(decoded.role);
            setIsAuthenticated(true); 
        } catch (decodeError) {
            console.error("Token decode failed", decodeError);
            setErrorMessage("Login failed: Invalid token received.");
        }
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        <div className="role-toggle-container" style={{display:'flex', justifyContent:'center', marginBottom:'20px', gap:'10px'}}>
            <button 
                type="button"
                onClick={() => setUiRole('student')}
                style={{
                    padding: '8px 20px',
                    backgroundColor: uiRole === 'student' ? '#4CAF50' : '#ddd',
                    color: uiRole === 'student' ? 'white' : 'black',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                Student
            </button>
            <button 
                type="button"
                onClick={() => setUiRole('teacher')}
                style={{
                    padding: '8px 20px',
                    backgroundColor: uiRole === 'teacher' ? '#2196F3' : '#ddd',
                    color: uiRole === 'teacher' ? 'white' : 'black',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                Teacher
            </button>
        </div>

        <div className="login-header">
          <h1 className="login-title">Skill Bridge</h1>
          <p className="login-subtitle">
            {uiRole === 'teacher' ? 'Teacher Portal' : 'Student Learning'} <br/>
            {isSignupMode ? 'Create Account' : 'Sign In'}
          </p>
        </div>
        
        {errorMessage && <div className="error-message" style={{color:'red', textAlign:'center', margin:'10px 0'}}>{errorMessage}</div>}
        {successMessage && <div className="success-message" style={{color:'green', textAlign:'center', margin:'10px 0'}}>{successMessage}</div>}

        <form onSubmit={handleAuth}>
            
            {isSignupMode && uiRole === 'student' && (
                <div style={{display:'flex', gap:'10px'}}>
                    <input className="form-input" placeholder="First Name" required 
                        onChange={e => setFirstName(e.target.value)} />
                    <input className="form-input" placeholder="Last Name" required 
                        onChange={e => setLastName(e.target.value)} />
                </div>
            )}
            
            {isSignupMode && uiRole === 'teacher' && (
                <input className="form-input" placeholder="Full Name" required 
                    onChange={e => setTeacherName(e.target.value)} />
            )}

            <div className="form-group">
                <input
                    type="email"
                    className="form-input"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            
            <div className="form-group">
                <input
                    type="password"
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            
            <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isSignupMode ? 'Sign Up' : 'Log In')}
            </button>
        </form>

        <div className="signup-link">
            <span>{isSignupMode ? "Already have an account?" : "Don't have an account?"}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignupMode(!isSignupMode); }}>
                {isSignupMode ? 'Sign in here' : 'Sign up here'}
            </a>
        </div>

      </div>
    </div>
  );
}

export default Login;