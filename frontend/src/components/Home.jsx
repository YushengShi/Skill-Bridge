import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home({ setIsAuthenticated }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("isAuth")
    navigate('/login')
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome Home</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="home-content">
        <p>You have successfully logged in!</p>
      </div>
    </div>
  )
}

export default Home

