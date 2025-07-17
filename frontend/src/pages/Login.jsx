import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../Firebase/firebase'
import axios from 'axios'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')

  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    strike: false,
    color: '#1f2937',
    font: 'sans-serif',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { email, password } = formData

    try {
      // 1. Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Backend authentication and data fetch
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          uid: user.uid,
          email,
        })

        console.log('Login successful:', response.data)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        // Redirect to dashboard
        window.location.href = '/dashboard'
        window.location.href = '/' // or use navigate if you're using react-router
      } catch (backendError) {
        console.error('Backend error:', backendError)
        if (backendError.response) {
          setError(backendError.response.data.error || 'Error connecting to server')
        } else if (backendError.request) {
          setError('No response from server. Please try again.')
        } else {
          setError('Error setting up request. Please try again.')
        }
      }
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError)
      setError(firebaseError.message)
    }
  }

  const styleClass = `
    ${textStyles.bold ? 'font-bold' : ''}
    ${textStyles.italic ? 'italic' : ''}
    ${textStyles.strike ? 'line-through' : ''}
  `
  const inlineStyle = {
    color: textStyles.color,
    fontFamily: textStyles.font,
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f7f8fa] to-[#e4e7eb] flex items-center justify-center px-4 py-16">
      {/* Toolbar */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTextStyles((prev) => ({ ...prev, bold: !prev.bold }))}
            className={`px-2 text-sm rounded-md hover:bg-gray-200 ${textStyles.bold ? 'bg-gray-300' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => setTextStyles((prev) => ({ ...prev, italic: !prev.italic }))}
            className={`px-2 text-sm rounded-md hover:bg-gray-200 ${textStyles.italic ? 'bg-gray-300' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => setTextStyles((prev) => ({ ...prev, strike: !prev.strike }))}
            className={`px-2 text-sm rounded-md hover:bg-gray-200 ${textStyles.strike ? 'bg-gray-300' : ''}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs">Color</label>
          <input
            type="color"
            value={textStyles.color}
            onChange={(e) => setTextStyles((prev) => ({ ...prev, color: e.target.value }))}
            className="w-6 h-6 cursor-pointer"
            title="Text Color"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs">Font</label>
          <select
            value={textStyles.font}
            onChange={(e) => setTextStyles((prev) => ({ ...prev, font: e.target.value }))}
            className="text-xs px-2 py-1 border rounded-md"
            title="Font Style"
          >
            <option value="sans-serif">Sans</option>
            <option value="serif">Serif</option>
            <option value="monospace">Mono</option>
            <option value="cursive">Cursive</option>
          </select>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 sm:p-10 relative z-10">
        <h2 className={`text-3xl text-center mb-2 ${styleClass}`} style={inlineStyle}>
          Log In
        </h2>
        <p className={`text-sm text-center mb-6 ${styleClass}`} style={inlineStyle}>
          Welcome back! Please enter your credentials.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" style={inlineStyle}>
          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-black py-2 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Log In
          </button>
        </form>

        <p className={`text-sm text-center mt-6 ${styleClass}`} style={inlineStyle}>
          Don't have an account?{' '}
          <Link to="/signup" className="underline hover:text-black">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
