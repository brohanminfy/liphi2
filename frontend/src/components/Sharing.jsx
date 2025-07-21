import React, { useState, useEffect } from 'react';
import { X, Share2, UserPlus, Trash2, Crown, Shield, Eye, Edit, AlertTriangle } from 'lucide-react'; // Added Edit and AlertTriangle
import { documentApi } from '../services/api';

const ShareModal = ({ isOpen, onClose, document }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [permissions, setPermissions] = useState({ owner: null, permissions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userToRemove, setUserToRemove] = useState(null); // State for confirmation dialog

  // Effect to load permissions and reset state when the modal opens
  useEffect(() => {
    if (isOpen && document) {
      loadPermissions();
      // Reset state on open
      setError('');
      setSuccess('');
      setEmail('');
      setUserToRemove(null);
    }
  }, [isOpen, document]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await documentApi.getPermissions(document.id);
      setPermissions(perms);
    } catch (error) {
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await documentApi.share(document.id, email.trim(), role);
      setSuccess(response.message); 
      setEmail('');
      await loadPermissions();
    } catch (error) {
      setError(error.message || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  // New handler for confirming the removal of a user
  const confirmRemoveAccess = async () => {
    if (!userToRemove) return;

    try {
      setLoading(true);
      await documentApi.removeAccess(document.id, userToRemove.userId);
      setSuccess('Access removed successfully');
      setUserToRemove(null); // Close confirmation and go back to main view
      await loadPermissions();
    } catch (error) {
      setError('Failed to remove access');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get role icon, using Edit for editor
  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
      case 'editor': return <Edit className="h-4 w-4 text-blue-500" />; // Changed for clarity
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  const canShare = document?.role === 'owner' || document?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-primary-200 dark:border-secondary-700">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            {userToRemove ? 'Remove Access' : 'Share Document'}
          </h2>
          <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md p-3 mb-4"><p className="text-red-600 dark:text-red-400 text-sm">{error}</p></div>}
          {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md p-3 mb-4"><p className="text-green-600 dark:text-green-400 text-sm">{success}</p></div>}
          
          {/* --- Confirmation View --- */}
          {userToRemove ? (
            <div>
              <div className="flex items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
                  </div>
                  <div className="ml-4 text-left">
                      <h3 className="text-lg leading-6 font-medium text-secondary-900 dark:text-white">Confirm Removal</h3>
                      <p className="text-sm text-secondary-600 dark:text-primary-200 mt-2">
                          Are you sure you want to remove access for <strong>{userToRemove.name}</strong>?
                      </p>
                  </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                  <button onClick={confirmRemoveAccess} disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                      {loading ? 'Removing...' : 'Remove'}
                  </button>
                  <button onClick={() => setUserToRemove(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-secondary-600 shadow-sm px-4 py-2 bg-white dark:bg-secondary-700 text-base font-medium text-gray-700 dark:text-primary-100 hover:bg-gray-50 dark:hover:bg-secondary-600 sm:mt-0 sm:w-auto sm:text-sm">
                      Cancel
                  </button>
              </div>
            </div>
          ) : (
          <>
            {/* --- Main Share View --- */}
            {canShare && (
              <form onSubmit={handleShare} className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-primary-200 mb-2">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="w-full px-3 py-2 border border-primary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white" required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-primary-200 mb-2">Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-primary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white">
                    <option value="viewer">Viewer - Can only view</option>
                    <option value="editor">Editor - Can view and edit</option>
                    <option value="admin">Admin - Can view, edit, and share</option>
                  </select>
                </div>
                <button type="submit" disabled={loading || !email.trim()} className="w-full bg-secondary-700 text-white py-2 px-4 rounded-md hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? 'Sharing...' : 'Share Document'}
                </button>
              </form>
            )}

            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">Current Access</h3>
              {loading && permissions.permissions.length === 0 ? (
                <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-700 mx-auto"></div></div>
              ) : (
                <div className="space-y-3">
                  {permissions.owner && (
                    <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-secondary-700 rounded-lg">
                      <div className="flex items-center"><div className="flex items-center mr-3">{getRoleIcon('owner')}</div><div><p className="font-medium text-secondary-900 dark:text-white">{permissions.owner.name}</p><p className="text-sm text-secondary-600 dark:text-primary-300">Document Owner</p></div></div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('owner')}`}>Owner</span>
                    </div>
                  )}
                  {permissions.permissions.map((perm) => (
                    <div key={perm.userId} className="flex items-center justify-between p-3 bg-primary-50 dark:bg-secondary-700 rounded-lg">
                      <div className="flex items-center"><div className="flex items-center mr-3">{getRoleIcon(perm.role)}</div><div><p className="font-medium text-secondary-900 dark:text-white">{perm.name}</p><p className="text-sm text-secondary-600 dark:text-primary-300">{perm.email}</p></div></div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(perm.role)}`}>{perm.role}</span>
                        {canShare && (
                          <button onClick={() => setUserToRemove(perm)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Remove access">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {permissions.permissions.length === 0 && !loading && !permissions.owner && (
                    <p className="text-secondary-600 dark:text-primary-300 text-center py-4">No one else has access to this document</p>
                  )}
                </div>
              )}
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
