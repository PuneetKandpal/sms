"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaBuilding,
  FaEnvelope,
  FaCalendar,
  FaCrown,
  FaUserShield,
  FaUser,
  FaPlus,
  FaSearch,
  FaFilter,
  FaGlobe,
  FaIndustry,
  FaSpinner,
  FaEye,
  FaArrowRight,
  FaEllipsisV,
  FaTrash,
  FaClock,
  FaPaperPlane,
  FaSortUp,
  FaSortDown,
  FaEdit,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import companyService from "../api/companyService";
import InviteUserModal from "../components/InviteUserModal";
import CompanyListModal from "../components/CompanyListModal";
import CompanyInfoCard from "../components/CompanyInfoCard";
import MemberDetailsModal from "../components/MemberDetailsModal";
import RemoveMemberModal from "../components/RemoveMemberModal";
import CancelInvitationModal from "../components/CancelInvitationModal";
import toast from "react-hot-toast";
import useFeatureTracking from "../../hooks/useFeatureTracking";
import { trackFeatureAction } from "../../lib/analytics/featureTracking";
import { formatLocalDate } from "../../utils/dateUtils";

export default function PeoplePage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  // Track feature usage
  useFeatureTracking("People & Teams", {
    feature_category: "team_management",
    page_section: "people",
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompanyListModal, setShowCompanyListModal] = useState(false);
  const [showCompanyInfoCard, setShowCompanyInfoCard] = useState(false);
  const [selectedMemberCompanies, setSelectedMemberCompanies] = useState([]);
  const [selectedCompanyForInfo, setSelectedCompanyForInfo] = useState(null);
  const [memberDropdowns, setMemberDropdowns] = useState({});
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMemberForDetails, setSelectedMemberForDetails] =
    useState(null);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [companyToRemoveFrom, setCompanyToRemoveFrom] = useState(null);
  const [showCancelInvitationModal, setShowCancelInvitationModal] =
    useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState(null);

  // Pending Invitations state
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [selectedInvitationCompany, setSelectedInvitationCompany] =
    useState("all");
  const [invitationSortOrder, setInvitationSortOrder] = useState("desc"); // desc = newest first

  // Dropdown positioning state
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Fetch pending invitations
  const fetchPendingInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const result = await companyService.getAllPendingInvitations();
      if (result.success) {
        setPendingInvitations(result.data);
        setFilteredInvitations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load pending invitations");
    } finally {
      setInvitationsLoading(false);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersResult, companiesResult] = await Promise.all([
          companyService.getAllMembers(),
          companyService.getCompanies(),
        ]);

        if (membersResult.success) {
          // Group members by email to handle users in multiple companies
          const membersByEmail = {};
          membersResult.data.forEach((member) => {
            const email = member.user_email;
            if (!membersByEmail[email]) {
              membersByEmail[email] = {
                ...member,
                companies: [member.company_info],
                all_memberships: [member],
              };
            } else {
              membersByEmail[email].companies.push(member.company_info);
              membersByEmail[email].all_memberships.push(member);
              // Keep the most recent membership data
              if (
                new Date(member.joined_at) >
                new Date(membersByEmail[email].joined_at)
              ) {
                membersByEmail[email] = {
                  ...membersByEmail[email],
                  ...member,
                  companies: membersByEmail[email].companies,
                  all_memberships: membersByEmail[email].all_memberships,
                };
              }
            }
          });

          const uniqueMembers = Object.values(membersByEmail);

          //console.log("uniqueMembers------->", uniqueMembers);
          setMembers(uniqueMembers);
          setFilteredMembers(uniqueMembers);
        } else {
          toast.error(membersResult.error);
        }

        if (companiesResult.success) {
          setCompanies(companiesResult.data);
        } else {
          toast.error(companiesResult.error);
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchPendingInvitations();
  }, []);

  // Filter members based on search and filters
  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.company_info?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Company filter
    if (selectedCompany !== "all") {
      filtered = filtered.filter((member) =>
        member.companies?.some((company) => company.id === selectedCompany)
      );
    }

    // Role filter
    if (selectedRole !== "all") {
      filtered = filtered.filter(
        (member) =>
          member.permission?.toLowerCase() ||
          member.role?.toLowerCase() === selectedRole
      );
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, selectedCompany, selectedRole]);

  // Filter and sort invitations
  useEffect(() => {
    let filtered = [...pendingInvitations];

    // Company filter
    if (selectedInvitationCompany !== "all") {
      filtered = filtered.filter(
        (invitation) => invitation.company === selectedInvitationCompany
      );
    }

    // Sort by sent date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return invitationSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredInvitations(filtered);
  }, [pendingInvitations, selectedInvitationCompany, invitationSortOrder]);

  const isCurrentUser = (email) => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return false;
      const me = JSON.parse(stored);
      return (
        me?.email && email && me.email.toLowerCase() === email.toLowerCase()
      );
    } catch (e) {
      return false;
    }
  };

  const getRoleIcon = (permission) => {
    switch (permission?.toLowerCase()) {
      case "owner":
      case "admin":
        return <FaCrown className="text-yellow-500" size={14} />;
      case "manager":
        return <FaUserShield className="text-blue-500" size={14} />;
      default:
        return <FaUser className="text-gray-500" size={14} />;
    }
  };

  const getRoleBadgeColor = (permission) => {
    switch (permission?.toLowerCase()) {
      case "owner":
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle company click - always show modal with company list
  const handleCompanyClick = (companies) => {
    if (companies?.length > 0) {
      setSelectedMemberCompanies(companies);
      setShowCompanyListModal(true);
    }
  };

  const handleViewCompanyInfo = (company) => {
    setSelectedCompanyForInfo(company);
    setShowCompanyInfoCard(true);
    setShowCompanyListModal(false);
  };

  const handleGoToCompany = (companyId) => {
    router.push(`/companies?company=${companyId}`);
    setShowCompanyListModal(false);
  };

  const handleInviteSuccess = () => {
    trackFeatureAction("member_invite_sent", {
      action_type: "invite_success",
    });
    setShowInviteModal(false);
    // Refresh pending invitations
    fetchPendingInvitations();
  };

  const toggleMemberDropdown = (memberId) => {
    setMemberDropdowns((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const closeAllDropdowns = () => {
    setMemberDropdowns({});
    setActiveDropdown(null);
  };

  const toggleMemberDropdownWithPosition = (memberId, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      x: rect.right - 150, // Position dropdown to the left of the button
      y: rect.bottom + 5,
    });
    setActiveDropdown(`member-${memberId}`);
    setMemberDropdowns((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleCancelInvitation = (invitation) => {
    setInvitationToCancel(invitation);
    setShowCancelInvitationModal(true);
  };

  const confirmCancelInvitation = async (invitation) => {
    try {
      trackFeatureAction("invitation_cancel_attempt", {
        action_type: "cancel_invitation",
        invitation_id: invitation.id,
      });

      const result = await companyService.cancelInvitation(invitation.id);
      if (result.success) {
        trackFeatureAction("invitation_cancel_success", {
          action_type: "cancel_invitation_success",
          invitation_id: invitation.id,
        });
        toast.success(
          `Invitation for ${invitation.email} has been canceled successfully`
        );
        // Remove the invitation from the state immediately
        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitation.id)
        );
        setFilteredInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitation.id)
        );
      } else {
        trackFeatureAction("invitation_cancel_failed", {
          action_type: "cancel_invitation_failed",
          error: result.error,
        });
        toast.error(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      trackFeatureAction("invitation_cancel_error", {
        action_type: "cancel_invitation_error",
        error: error.message,
      });
      console.error("Error canceling invitation:", error);
      toast.error(
        "An unexpected error occurred while canceling the invitation"
      );
    }
  };

  const handleViewMemberDetails = (member) => {
    setSelectedMemberForDetails(member);
    setShowMemberDetails(true);
    closeAllDropdowns();
  };

  const handleRemoveMember = (member) => {
    setMemberToRemove(member);
    if (member.companies.length > 1) {
      // Show company selection modal
      setShowRemoveMemberModal(true);
    } else {
      // Direct removal with confirmation
      setCompanyToRemoveFrom(member.companies[0]);
      setShowRemoveMemberModal(true);
    }
    closeAllDropdowns();
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !companyToRemoveFrom) return;

    try {
      // Find the membership ID for this company
      const membership = memberToRemove.all_memberships.find(
        (m) => m.company_info.id === companyToRemoveFrom.id
      );

      if (!membership) {
        toast.error("Membership not found");
        return;
      }

      const result = await companyService.removeCompanyMember(
        companyToRemoveFrom.id,
        membership.id
      );

      if (result.success) {
        // Optimistic UI update: remove the member immediately
        setMembers((prev) =>
          prev.filter((m) => m.user_email !== memberToRemove.user_email)
        );
        setFilteredMembers((prev) =>
          prev.filter((m) => m.user_email !== memberToRemove.user_email)
        );

        // Background refresh (no shimmer)
        const refresh = await companyService.getAllMembers();
        if (refresh.success) {
          const membersByEmail = {};
          refresh.data.forEach((member) => {
            const email = member.user_email;
            if (!membersByEmail[email]) {
              membersByEmail[email] = {
                ...member,
                companies: [member.company_info],
                all_memberships: [member],
              };
            } else {
              membersByEmail[email].companies.push(member.company_info);
              membersByEmail[email].all_memberships.push(member);
              if (
                new Date(member.joined_at) >
                new Date(membersByEmail[email].joined_at)
              ) {
                membersByEmail[email] = {
                  ...membersByEmail[email],
                  ...member,
                  companies: membersByEmail[email].companies,
                  all_memberships: membersByEmail[email].all_memberships,
                };
              }
            }
          });
          const uniqueMembers = Object.values(membersByEmail);
          setMembers(uniqueMembers);
          setFilteredMembers(uniqueMembers);
        }

        toast.success("Member removed successfully");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to remove member");
    } finally {
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
      setCompanyToRemoveFrom(null);
    }
  };

  const getCompanyMemberCount = (companyId) => {
    return members.filter((member) =>
      member.companies?.some((company) => company.id === companyId)
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 animate-pulse"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-64"></div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-20"></div>
                  <div className="h-6 bg-gray-100 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafafa] px-6 pt-2"
      onClick={closeAllDropdowns}
    >
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                People & Teams
              </h1>
              <p className="text-gray-600">
                Manage team members across all your companies and projects
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <FaPlus size={16} />
              Invite Member
            </motion.button>
          </div>

          {/* Stats Cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FaUsers className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {members.length}
                  </h3>
                  <p className="text-gray-600">Total Members</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <FaBuilding className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {companies.length}
                  </h3>
                  <p className="text-gray-600">Companies</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-xl">
                  <FaCrown className="text-sky-600" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {
                      members.filter(
                        (m) =>
                          m.permission?.toLowerCase() === "admin" ||
                          m.permission?.toLowerCase() === "owner"
                      ).length
                    }
                  </h3>
                  <p className="text-gray-600">Admins</p>
                </div>
              </div>
            </motion.div>
          </div> */}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className=" rounded-xl  p-0 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative bg-white">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search members, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Company Filter */}
            <div className="relative">
              <FaFilter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white cursor-pointer min-w-[200px]"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({getCompanyMemberCount(company.id)})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative">
              <FaUserShield
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white cursor-pointer min-w-[150px]"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Members Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Members ({filteredMembers.length})
              </h2>
              <div className="text-sm text-gray-600">
                {searchTerm ||
                selectedCompany !== "all" ||
                selectedRole !== "all"
                  ? `${filteredMembers.length} of ${members.length} members`
                  : `${members.length} total members`}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredMembers.map((member, index) => (
                    <motion.tr
                      key={`${member.id}-${member.company_info?.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {member.user_name?.[0] ||
                                member.user_email?.[0] ||
                                "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {member.user_name || "Unknown User"}
                              {isCurrentUser(member.user_email) && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FaEnvelope size={10} />
                              {member.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:text-primary hover:bg-primary/5 rounded-lg px-2 py-1 transition-all duration-200 group"
                          onClick={() => handleCompanyClick(member.companies)}
                          title={`Click to view ${
                            member.companies?.length === 1
                              ? "company details"
                              : "all companies"
                          }`}
                        >
                          <FaBuilding
                            size={12}
                            className="text-gray-400 group-hover:text-primary transition-colors"
                          />
                          <span className="font-medium">
                            {member.companies?.length === 1
                              ? "1 company"
                              : `${member.companies?.length || 0} companies`}
                          </span>
                          <FaArrowRight
                            size={10}
                            className="text-gray-400 group-hover:text-primary transition-colors"
                          />
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            member.permission || member.role
                          )}`}
                        >
                          {getRoleIcon(member.permission || member.role)}
                          {(member.permission || member.role)
                            ?.charAt(0)
                            .toUpperCase() +
                            (member.permission || member.role)?.slice(1)}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FaCalendar size={10} />
                          {formatLocalDate(member.joined_at)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            member.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={(e) =>
                              toggleMemberDropdownWithPosition(member.id, e)
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <FaEllipsisV size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <FaUsers className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Members Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm ||
                  selectedCompany !== "all" ||
                  selectedRole !== "all"
                    ? "Try adjusting your filters"
                    : "No team members available"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Invitations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaClock className="text-orange-500" size={18} />
                Pending Invitations ({filteredInvitations.length})
              </h2>
              <div className="flex items-center gap-4">
                {/* Company Filter for Invitations */}
                <div className="relative">
                  <FaFilter
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={12}
                  />
                  <select
                    value={selectedInvitationCompany}
                    onChange={(e) =>
                      setSelectedInvitationCompany(e.target.value)
                    }
                    className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white cursor-pointer text-sm min-w-[180px]"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((company) => {
                      const companyInvitationCount = pendingInvitations.filter(
                        (inv) => inv.company === company.id
                      ).length;
                      return (
                        <option key={company.id} value={company.id}>
                          {company.name} ({companyInvitationCount})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedInvitationCompany !== "all"
                    ? `${filteredInvitations.length} of ${pendingInvitations.length} invitations`
                    : `${pendingInvitations.length} total invitations`}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {invitationsLoading ? (
              <div className="p-8 text-center">
                <FaSpinner
                  className="animate-spin mx-auto text-gray-400 mb-4"
                  size={24}
                />
                <p className="text-gray-600">Loading pending invitations...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() =>
                          setInvitationSortOrder(
                            invitationSortOrder === "desc" ? "asc" : "desc"
                          )
                        }
                        className="flex items-center gap-1 hover:text-gray-700 cursor-pointer"
                      >
                        Sent Date
                        {invitationSortOrder === "desc" ? (
                          <FaSortDown size={10} />
                        ) : (
                          <FaSortUp size={10} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredInvitations.map((invitation, index) => (
                      <motion.tr
                        key={invitation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                              <FaPaperPlane className="text-white" size={14} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {invitation.email}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                  <FaClock size={8} className="mr-1" />
                                  Pending
                                </span>
                                <span className="text-gray-500">
                                  Awaiting response
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaBuilding size={12} className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {invitation.company_name}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              invitation.role
                            )}`}
                          >
                            {getRoleIcon(invitation.role)}
                            {invitation.role?.charAt(0).toUpperCase() +
                              invitation.role?.slice(1)}
                          </div>
                        </td>

                        {/* Invited By */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {invitation.invited_by_name || "Unknown"}
                          </div>
                        </td>

                        {/* Sent Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FaCalendar size={10} />
                            {formatLocalDate(invitation.created_at)}
                          </div>
                        </td>

                        {/* Expires */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FaClock size={10} />
                            {formatLocalDate(invitation.expires_at)}
                          </div>
                        </td>

                        {/* Message */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {invitation.message || "No message"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelInvitation(invitation);
                              }}
                              className="px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
                              title={`Cancel invitation for ${invitation.email}`}
                            >
                              <FaTrash size={12} />
                              Cancel
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}

            {!invitationsLoading && filteredInvitations.length === 0 && (
              <div className="text-center py-12">
                <FaClock className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Invitations
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedInvitationCompany !== "all"
                    ? "No pending invitations for the selected company"
                    : "All invitations have been accepted or canceled"}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <FaPaperPlane size={14} />
                    <span className="font-medium">Need to invite someone?</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Click the "Invite Member" button above to send a new
                    invitation
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Positioned Dropdown */}
        {activeDropdown &&
          memberDropdowns[activeDropdown.replace("member-", "")] && (
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[150px]"
              style={{
                left: `${dropdownPosition.x}px`,
                top: `${dropdownPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const memberId = activeDropdown.replace("member-", "");
                  const member = filteredMembers.find((m) => m.id === memberId);
                  handleViewMemberDetails(member);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                <FaEye size={12} />
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const memberId = activeDropdown.replace("member-", "");
                  const member = filteredMembers.find((m) => m.id === memberId);
                  handleRemoveMember(member);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2 cursor-pointer"
              >
                <FaEdit size={12} />
                Edit access
              </button>
            </div>
          )}

        {/* Company List Modal */}
        <CompanyListModal
          isOpen={showCompanyListModal}
          onClose={() => setShowCompanyListModal(false)}
          companies={selectedMemberCompanies}
          onViewCompany={handleViewCompanyInfo}
          onGoToCompany={handleGoToCompany}
        />

        {/* Company Info Card */}
        <CompanyInfoCard
          isOpen={showCompanyInfoCard}
          onClose={() => setShowCompanyInfoCard(false)}
          company={selectedCompanyForInfo}
        />

        {/* Member Details Modal */}
        <MemberDetailsModal
          isOpen={showMemberDetails}
          onClose={() => setShowMemberDetails(false)}
          member={selectedMemberForDetails}
        />

        {/* Remove Member Modal */}
        <RemoveMemberModal
          isOpen={showRemoveMemberModal}
          onClose={() => {
            setShowRemoveMemberModal(false);
            setMemberToRemove(null);
            setCompanyToRemoveFrom(null);
          }}
          member={memberToRemove}
          selectedCompany={companyToRemoveFrom}
          onSelectCompany={setCompanyToRemoveFrom}
          onConfirm={confirmRemoveMember}
        />

        {/* Invite Modal */}
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companies={companies}
          onSuccess={handleInviteSuccess}
        />

        {/* Cancel Invitation Modal */}
        <CancelInvitationModal
          isOpen={showCancelInvitationModal}
          onClose={() => {
            setShowCancelInvitationModal(false);
            setInvitationToCancel(null);
          }}
          invitation={invitationToCancel}
          onConfirm={confirmCancelInvitation}
        />
      </div>
    </div>
  );
}
