import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Shield, Users, Crown, Edit, Eye, Trash2, Settings } from 'lucide-react';
import axios from 'axios';

const ShareDialog = ({ isOpen, onClose, documentId, documentTitle }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState({ admins: [], editors: [], viewers: [] });
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('editor');

  // Fetch current collaborators when dialog opens
  useEffect(() => {
    if (isOpen && documentId) {
      fetchCollaborators();
    }
  }, [isOpen, documentId]);

  const fetchCollaborators = async () => {
    setLoadingCollaborators(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.roles) {
        setCollaborators(response.data.roles);
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/documents/share', {
        documentId,
        userEmail: email.trim(),
        role
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage(response.data.message);
      setEmail('');
      setRole('editor');
      
      // Refresh collaborators list
      await fetchCollaborators();
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);

    } catch (err) {
      console.error('Error sharing document:', err);
      setError(err.response?.data?.error || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/documents/remove-collaborator', {
        documentId,
        userEmail: selectedUser.email,
        role: selectedUser.role
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage(response.data.message);
      setShowRemoveDialog(false);
      setSelectedUser(null);
      
      // Refresh collaborators list
      await fetchCollaborators();
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);

    } catch (err) {
      console.error('Error removing collaborator:', err);
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/documents/change-role', {
        documentId,
        userEmail: selectedUser.email,
        newRole
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage(response.data.message);
      setShowChangeRoleDialog(false);
      setSelectedUser(null);
      setNewRole('editor');
      
      // Refresh collaborators list
      await fetchCollaborators();
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);

    } catch (err) {
      console.error('Error changing role:', err);
      setError(err.response?.data?.error || 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const openRemoveDialog = (user, role) => {
    setSelectedUser({ email: user, role });
    setShowRemoveDialog(true);
  };

  const openChangeRoleDialog = (user, currentRole) => {
    setSelectedUser({ email: user, role: currentRole });
    setNewRole(currentRole === 'editor' ? 'viewer' : 'editor');
    setShowChangeRoleDialog(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Share Document</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Sharing:</p>
            <p className="font-medium text-gray-900">{documentTitle || 'Untitled Document'}</p>
          </div>

          {/* Current Collaborators */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Current Collaborators
            </h3>
            
            {loadingCollaborators ? (
              <p className="text-sm text-gray-500">Loading collaborators...</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(collaborators).map(([role, users]) => (
                  users.length > 0 && (
                    <div key={role} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role)}
                        <span className="text-sm font-medium text-gray-700">
                          {getRoleLabel(role)}s ({users.length}):
                        </span>
                      </div>
                      {users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between ml-6">
                          <span className="text-sm text-gray-500">{user}</span>
                          {role !== 'admin' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => openChangeRoleDialog(user, role)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Change role"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => openRemoveDialog(user, role)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ))}
                {Object.values(collaborators).every(users => users.length === 0) && (
                  <p className="text-sm text-gray-500">No collaborators yet</p>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleShare}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user's email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Permission Level
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="editor"
                    checked={role === 'editor'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">Editor</div>
                    <div className="text-sm text-gray-500">Can view and edit the document</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="viewer"
                    checked={role === 'viewer'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-sm text-gray-500">Can only view the document</div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Sharing...' : 'Share Document'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Remove Collaborator Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Remove Collaborator</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{selectedUser?.email}</strong> as {selectedUser?.role}?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRemoveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveCollaborator}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Dialog */}
      {showChangeRoleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Change Role</h3>
              <p className="text-gray-600 mb-4">
                Change role for <strong>{selectedUser?.email}</strong>
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="editor"
                      checked={newRole === 'editor'}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="mr-2"
                      disabled={loading}
                    />
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-sm text-gray-500">Can view and edit the document</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="viewer"
                      checked={newRole === 'viewer'}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="mr-2"
                      disabled={loading}
                    />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-sm text-gray-500">Can only view the document</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowChangeRoleDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeRole}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareDialog; 