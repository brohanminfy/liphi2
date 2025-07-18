import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    strike: false,
    color: '#1f2937',
    font: 'sans-serif',
  })

  const colors = ['#1f2937', 'red', 'blue', 'green', 'orange']
  const fonts = ['sans-serif', 'serif', 'monospace', 'cursive']

  const cycleColor = () => {
    const currentIndex = colors.indexOf(textStyles.color)
    const nextColor = colors[(currentIndex + 1) % colors.length]
    setTextStyles((prev) => ({ ...prev, color: nextColor }))
  }

  const cycleFont = () => {
    const currentIndex = fonts.indexOf(textStyles.font)
    const nextFont = fonts[(currentIndex + 1) % fonts.length]
    setTextStyles((prev) => ({ ...prev, font: nextFont }))
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { email, password } = formData

    try {
      await login(email, password)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
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
      {/* Overlay Spinner */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-lg">
          <div className="animate-pulse text-gray-800 text-lg font-medium">
            Logging in...
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
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
          <button
            onClick={cycleColor}
            className="px-3 py-1 text-xs rounded-md border bg-white hover:bg-gray-100"
            title="Toggle Text Color"
            style={{ color: textStyles.color }}
          >
            Color
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleFont}
            className="px-3 py-1 text-xs rounded-md border bg-white hover:bg-gray-100"
            title="Toggle Font Style"
            style={{ fontFamily: textStyles.font }}
          >
            Font
          </button>
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
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-950 text-black hover:bg-gray-800'
            }`}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className={`text-sm text-center mt-6 ${styleClass}`} style={inlineStyle}>
          Don’t have an account?{' '}
          <Link to="/signup" className="underline hover:text-black">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
