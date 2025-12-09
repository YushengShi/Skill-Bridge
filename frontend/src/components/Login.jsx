import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate()
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignupLoading, setIsSignupLoading] = useState(false)
  
  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Error states
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    signupEmail: '',
    signupPassword: '',
    confirmPassword: '',
    terms: ''
  })

  useEffect(() => {
    // Auto-focus on email field when page loads
    const emailInput = document.getElementById('email')
    if (emailInput) {
      emailInput.focus()
    }
  }, [])

  // Password toggle functions
  const togglePassword = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else if (field === 'signupPassword') {
      setShowSignupPassword(!showSignupPassword)
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateEmailField = () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setFieldErrors(prev => ({ ...prev, email: 'Email address is required' }))
      return false
    }
    if (!validateEmail(trimmedEmail)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validatePasswordField = () => {
    if (!password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    if (password.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const validateSignupEmailField = () => {
    const trimmedEmail = signupEmail.trim()
    if (!trimmedEmail) {
      setFieldErrors(prev => ({ ...prev, signupEmail: 'Email address is required' }))
      return false
    }
    if (!validateEmail(trimmedEmail)) {
      setFieldErrors(prev => ({ ...prev, signupEmail: 'Please enter a valid email address' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, signupEmail: '' }))
    return true
  }

  const validateSignupPasswordField = () => {
    if (!signupPassword) {
      setFieldErrors(prev => ({ ...prev, signupPassword: 'Password is required' }))
      return false
    }
    if (signupPassword.length < 8) {
      setFieldErrors(prev => ({ ...prev, signupPassword: 'Password must be at least 8 characters long' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, signupPassword: '' }))
    return true
  }

  const validateConfirmPasswordField = () => {
    if (!confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }))
      return false
    }
    if (signupPassword !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
    return true
  }

  const validateTermsField = () => {
    if (!agreeTerms) {
      setFieldErrors(prev => ({ ...prev, terms: 'You must agree to the Terms of Service and Privacy Policy' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, terms: '' }))
    return true
  }

  const clearAllFieldErrors = () => {
    setFieldErrors({
      email: '',
      password: '',
      signupEmail: '',
      signupPassword: '',
      confirmPassword: '',
      terms: ''
    })
  }

  const hideMessages = () => {
    setErrorMessage('')
    setSuccessMessage('')
  }

  // Credential validation
  const validateCredentials = (email, password) => {
    // Demo credentials
    const validEmail = 'demo@example.com'
    const validPassword = 'password123'
    
    if (email === validEmail && password === validPassword) {
      return true
    }
    
    // Check localStorage for registered users
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const user = registeredUsers.find(u => u.email === email && u.password === password)
    return !!user
  }

  // User registration
  const registerUser = (email, password) => {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
    const existingUser = registeredUsers.find(u => u.email === email)
    
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }
    
    registeredUsers.push({
      email: email,
      password: password,
      registeredAt: new Date().toISOString()
    })
    
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
    return { success: true }
  }

  // Form toggle
  const toggleForm = () => {
    setIsSignupMode(!isSignupMode)
    hideMessages()
    clearAllFieldErrors()
    
    setTimeout(() => {
      if (!isSignupMode) {
        const signupEmailInput = document.getElementById('signupEmail')
        if (signupEmailInput) signupEmailInput.focus()
      } else {
        const emailInput = document.getElementById('email')
        if (emailInput) emailInput.focus()
      }
    }, 100)
  }

  // Login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    
    const isEmailValid = validateEmailField()
    const isPasswordValid = validatePasswordField()
    
    if (!isEmailValid || !isPasswordValid) {
      return
    }
    
    setIsLoading(true)
    hideMessages()
    
    // Simulate API call
    setTimeout(() => {
      if (validateCredentials(email, password)) {
        setSuccessMessage('Login successful! Redirecting...')
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        }
        setTimeout(() => {
          setIsAuthenticated(true)
          navigate('/home')
        }, 1500)
      } else {
        setErrorMessage('Invalid email or password. Please try again.')
      }
      setIsLoading(false)
    }, 2000)
  }

  // Signup form submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    
    const isEmailValid = validateSignupEmailField()
    const isPasswordValid = validateSignupPasswordField()
    const isConfirmPasswordValid = validateConfirmPasswordField()
    const isTermsValid = validateTermsField()
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isTermsValid) {
      return
    }
    
    setIsSignupLoading(true)
    hideMessages()
    
    // Simulate API call
    setTimeout(() => {
      const result = registerUser(signupEmail, signupPassword)
      if (result.success) {
        setSuccessMessage('Account created successfully! Please sign in.')
        setTimeout(() => {
          toggleForm()
          setEmail(signupEmail)
        }, 1500)
      } else {
        if (result.error === 'User already exists') {
          setErrorMessage('An account with this email already exists. Please sign in instead.')
          setFieldErrors(prev => ({ ...prev, signupEmail: 'An account with this email already exists' }))
          setTimeout(() => {
            toggleForm()
            setEmail(signupEmail)
          }, 2000)
        } else {
          setErrorMessage('Registration failed. Please try again.')
        }
      }
      setIsSignupLoading(false)
    }, 2000)
  }

  // Social login handlers
  const handleSocialLogin = (provider) => {
    setIsLoading(true)
    hideMessages()
    
    setTimeout(() => {
      if (provider === 'google') {
        setSuccessMessage('Redirecting to Google login...')
        // In a real app, redirect to Google OAuth
      } else if (provider === 'microsoft') {
        setSuccessMessage('Redirecting to Microsoft login...')
        // In a real app, redirect to Microsoft OAuth
      }
      setIsLoading(false)
    }, 1000)
  }

  // Forgot password handler
  const handleForgotPassword = () => {
    if (!email) {
      setErrorMessage('Please enter your email address first.')
      return
    }
    setSuccessMessage('Password reset instructions sent to your email.')
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
      <div className="login-header">
        <h1 className="login-title">SPM Motors</h1>
        <p className="login-subtitle">
          {isSignupMode ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Login Form */}
      <form id="loginForm" onSubmit={handleLoginSubmit} style={{ display: isSignupMode ? 'none' : 'block' }}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFieldErrors(prev => ({ ...prev, email: '' }))
            }}
            onBlur={validateEmailField}
            required
          />
          {fieldErrors.email && (
            <div className="field-error">{fieldErrors.email}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="password-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, password: '' }))
              }}
              onBlur={validatePasswordField}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePassword('password')}
            >
              <img
                src={showPassword 
                  ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                  : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                }
                alt="Toggle password"
                style={{ width: '20px', height: '20px' }}
              />
            </button>
          </div>
          {fieldErrors.password && (
            <div className="field-error">{fieldErrors.password}</div>
          )}
        </div>
        
        <div className="remember-forgot">
          <label className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <a href="#" className="forgot-password" onClick={(e) => {
            e.preventDefault()
            handleForgotPassword()
          }}>
            Forgot password?
          </a>
        </div>
        
        <button type="submit" className="login-button" disabled={isLoading}>
          <div className={`loading ${isLoading ? '' : 'hidden'}`}></div>
          <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
        </button>
      </form>

      {/* Signup Form */}
      <form id="signupForm" onSubmit={handleSignupSubmit} style={{ display: isSignupMode ? 'block' : 'none' }}>
        <div className="form-group">
          <label htmlFor="signupEmail" className="form-label">Email Address</label>
          <input
            type="email"
            id="signupEmail"
            name="signupEmail"
            className="form-input"
            placeholder="Enter your email"
            value={signupEmail}
            onChange={(e) => {
              setSignupEmail(e.target.value)
              setFieldErrors(prev => ({ ...prev, signupEmail: '' }))
            }}
            onBlur={validateSignupEmailField}
            required
          />
          {fieldErrors.signupEmail && (
            <div className="field-error">{fieldErrors.signupEmail}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="signupPassword" className="form-label">Password</label>
          <div className="password-container">
            <input
              type={showSignupPassword ? 'text' : 'password'}
              id="signupPassword"
              name="signupPassword"
              className="form-input"
              placeholder="Create a password"
              value={signupPassword}
              onChange={(e) => {
                setSignupPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, signupPassword: '' }))
                if (confirmPassword) {
                  validateConfirmPasswordField()
                }
              }}
              onBlur={validateSignupPasswordField}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePassword('signupPassword')}
            >
              <img
                src={showSignupPassword
                  ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                  : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                }
                alt="Toggle password"
                style={{ width: '20px', height: '20px' }}
              />
            </button>
          </div>
          {fieldErrors.signupPassword && (
            <div className="field-error">{fieldErrors.signupPassword}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <div className="password-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
              }}
              onBlur={validateConfirmPasswordField}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePassword('confirmPassword')}
            >
              <img
                src={showConfirmPassword
                  ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                  : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                }
                alt="Toggle password"
                style={{ width: '20px', height: '20px' }}
              />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <div className="field-error">{fieldErrors.confirmPassword}</div>
          )}
        </div>
        
        <div className="form-group">
          <label className="terms-checkbox">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked)
                setFieldErrors(prev => ({ ...prev, terms: '' }))
              }}
              required
            />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {fieldErrors.terms && (
            <div className="field-error">{fieldErrors.terms}</div>
          )}
        </div>
        
        <button type="submit" className="login-button" disabled={isSignupLoading}>
          <div className={`loading ${isSignupLoading ? '' : 'hidden'}`}></div>
          <span>{isSignupLoading ? 'Creating Account...' : 'Create Account'}</span>
        </button>
      </form>

      <div className="divider">
        <span>or continue with</span>
      </div>

      <div className="social-login">
        <a
          href="#"
          className="social-button"
          onClick={(e) => {
            e.preventDefault()
            handleSocialLogin('google')
          }}
        >
          <img
            src="https://img.icons8.com/?size=100&id=17950&format=png"
            alt="Google"
            style={{ width: '20px', height: '20px' }}
          />
          Google
        </a>
        <a
          href="#"
          className="social-button"
          onClick={(e) => {
            e.preventDefault()
            handleSocialLogin('microsoft')
          }}
        >
          <img
            src="https://img.icons8.com/?size=100&id=22984&format=png"
            alt="Microsoft"
            style={{ width: '20px', height: '20px' }}
          />
          Microsoft
        </a>
      </div>

      <div className="signup-link">
        <span>{isSignupMode ? "Already have an account?" : "Don't have an account?"}</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            toggleForm()
          }}
        >
          {isSignupMode ? 'Sign in here' : 'Sign up here'}
        </a>
      </div>
    </div>
    </div>
  )
}

export default Login
