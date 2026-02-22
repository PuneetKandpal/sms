"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import {
  listUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  approveUser,
} from "../../utils/authService";
import { requireAuth } from "../../utils/auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    requireAuth();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterStatus !== "all") {
        params.is_approved = filterStatus === "approved" ? "true" : "false";
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const result = await listUsers(params);
      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId, approve) => {
    try {
      const result = await approveUser({ userId, approve });
      if (result.success) {
        toast.success(approve ? "User approved!" : "User rejected!");
        fetchUsers();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !confirm(
        `Are you sure you want to delete "${user.email}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        toast.success("User deleted successfully!");
        fetchUsers();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setIsLoadingUser(true);

    try {
      const result = await getUserDetails(user.id);
      if (result.success) {
        setSelectedUser(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load user details");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "approved") return matchesSearch && user.is_approved;
    if (filterStatus === "pending") return matchesSearch && !user.is_approved;

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">Manage user accounts and approvals</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Total Users: {users.length}
            </span>
            <span className="text-sm text-green-600">
              Approved: {users.filter((u) => u.is_approved).length}
            </span>
            <span className="text-sm text-orange-600">
              Pending: {users.filter((u) => !u.is_approved).length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.first_name?.[0]?.toUpperCase() ||
                              user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_approved
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {user.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.is_super_admin
                        ? "Super Admin"
                        : user.is_platform_staff
                        ? "Platform Staff"
                        : "User"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEdit />
                        </button>
                        {!user.is_approved && (
                          <button
                            onClick={() => handleApproveUser(user.id, true)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve User"
                          >
                            <FaUserCheck />
                          </button>
                        )}
                        {user.is_approved && (
                          <button
                            onClick={() => handleApproveUser(user.id, false)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Reject User"
                          >
                            <FaUserTimes />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No users have registered yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isLoadingUser ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.first_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.last_name || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.is_approved
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {selectedUser.is_approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.last_login
                        ? new Date(selectedUser.last_login).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {selectedUser.approved_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approved At
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.approved_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t">
                  {!selectedUser.is_approved ? (
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser.id, true);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <FaCheck />
                      <span>Approve User</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser.id, false);
                        setShowUserModal(false);
                      }}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2"
                    >
                      <FaTimes />
                      <span>Reject User</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteUser(selectedUser);
                      setShowUserModal(false);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <FaTrash />
                    <span>Delete User</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load user details</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
