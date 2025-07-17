import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!userData) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-800">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Welcome, {userData.username}!
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* User Profile Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-gray-200 rounded-full flex items-center justify-center">
              {userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="h-14 w-14 rounded-full"
                />
              ) : (
                <span className="text-2xl text-gray-600">
                  {userData.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{userData.username}</h2>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Profile Completed</span>
                <span className={`font-semibold ${userData.profileCompleted ? 'text-green-500' : 'text-red-500'}`}>
                  {userData.profileCompleted ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type</span>
                <span className="font-semibold text-gray-800">Standard</span>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <p className="text-gray-600">No recent activity</p>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition">
                Edit Profile
              </button>
              <button className="w-full bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600 transition">
                View Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
