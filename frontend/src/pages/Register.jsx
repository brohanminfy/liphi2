import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Edit3 } from "lucide-react";
import ThemeToggle from "../components/Theme";

const colors = ['#1f2937', 'red', 'blue', 'green', 'orange'];
const fonts = ['sans-serif', 'serif', 'monospace', 'cursive'];

const Register = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Style states
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    strike: false,
    color: '#1f2937',
    font: 'sans-serif',
  });

  const cycleColor = () => {
    const currentIndex = colors.indexOf(textStyles.color);
    const nextColor = colors[(currentIndex + 1) % colors.length];
    setTextStyles((prev) => ({ ...prev, color: nextColor }));
  };

  const cycleFont = () => {
    const currentIndex = fonts.indexOf(textStyles.font);
    const nextFont = fonts[(currentIndex + 1) % fonts.length];
    setTextStyles((prev) => ({ ...prev, font: nextFont }));
  };

  const styleClass = `
    ${textStyles.bold ? 'font-bold' : ''}
    ${textStyles.italic ? 'italic' : ''}
    ${textStyles.strike ? 'line-through' : ''}
  `;
  const inlineStyle = {
    color: textStyles.color,
    fontFamily: textStyles.font,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      await register(userName, email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f7f8fa] to-[#e4e7eb] flex items-center justify-center px-4 py-16">
      {/* Overlay Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-lg">
          <div className="animate-pulse text-gray-800 text-lg font-medium">
            Creating your account...
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

      {/* Signup Card */}
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 sm:p-10 relative z-10">
        <h2 className={`text-3xl text-center mb-2 ${styleClass}`} style={inlineStyle}>
          Liphi
        </h2>
        <p className={`text-sm text-center mb-6 ${styleClass}`} style={inlineStyle}>
          Create a free account to get started
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" style={inlineStyle}>
          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Username</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="Your username"
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${styleClass}`}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium transition-colors duration-200
              ${loading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-white hover:text-black hover:border hover:border-black'}
            `}
          >
            {loading ? 'Signing Up...' : 'Create Account'}
          </button>
        </form>

        <p className={`text-sm text-center mt-6 ${styleClass}`} style={inlineStyle}>
          Already have an account?{' '}
          <Link to="/login" className="underline hover:text-black">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
