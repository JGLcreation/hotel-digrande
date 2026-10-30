import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, PermissionInfo, SystemRules, AuditLog } from '../types/hotel.ts';
import {
  ShieldAlert, Users, Settings, Sliders, RefreshCw, Search,
  Check, X, AlertTriangle, Key, Crown, Clock, ArrowRight,
  ShieldCheck, UserCheck, Lock, Activity, Eye, Edit3, Save,
  CheckCircle2, AlertCircle, Plus
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onSwitchToOperations?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onSwitchToOperations }) => {
  const { user, token, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'directory' | 'permissions-matrix' | 'system-rules' | 'audit-log'>('directory');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [selectedUserForBookings, setSelectedUserForBookings] = useState<User | null>(null);

  // Available Permissions & Presets
  const [availablePermissions, setAvailablePermissions] = useState<PermissionInfo[]>([]);
  const [rolePresets, setRolePresets] = useState<Record<string, string[]>>({});

  // Editing User Position & Permissions Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [targetPosition, setTargetPosition] = useState<'superadmin' | 'admin' | 'staff' | 'guest'>('guest');
  const [targetPermissions, setTargetPermissions] = useState<string[]>([]);
  const [isSavingPosition, setIsSavingPosition] = useState<boolean>(false);

  // New User Creation Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'superadmin' | 'admin' | 'staff' | 'guest'>('staff');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // System Rules State
  const [systemRules, setSystemRules] = useState<SystemRules | null>(null);
  const [isSavingRules, setIsSavingRules] = useState<boolean>(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // Status Alerts
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // 1. Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await fetch(`/api/auth/users?search=${q}&role=${positionFilter}`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.error || 'Failed to load user directory' });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 2. Fetch Permissions Matrix & Presets
  const fetchPermissionsData = async () => {
    try {
      const res = await fetch('/api/auth/permissions', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAvailablePermissions(data.available_permissions || []);
        setRolePresets(data.role_presets || {});
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  // 3. Fetch System Rules
  const fetchSystemRules = async () => {
    try {
      const res = await fetch('/api/auth/system-rules', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSystemRules(data.rules);
      }
    } catch (err) {
      console.error('Error loading system rules:', err);
    }
  };

  // 4. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/auth/audit-logs', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.audit_logs || []);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissionsData();
    fetchSystemRules();

    const interval = setInterval(() => {
      fetchUsers();
    }, 12000);

    return () => clearInterval(interval);
  }, [positionFilter]);

  useEffect(() => {
    if (activeTab === 'audit-log') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Handle Opening Position Editor
  const handleOpenEditPosition = (targetUser: User) => {
    setSelectedUserForEdit(targetUser);
    setTargetPosition(targetUser.role);
    setTargetPermissions(targetUser.permissions || rolePresets[targetUser.role] || ['book_suites']);
  };

  // Quick Preset Selection in Editor
  const handleApplyPreset = (pos: 'superadmin' | 'admin' | 'staff' | 'guest') => {
    setTargetPosition(pos);
    if (rolePresets[pos]) {
      setTargetPermissions([...rolePresets[pos]]);
    }
  };

  // Open New User Modal
  const handleOpenAddUser = () => {
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserPhone('');
    setNewUserRole('staff');
    setNewUserPermissions(rolePresets['staff'] || ['front_desk_checkin', 'manage_folios', 'manage_reservations']);
    setAddUserModalOpen(true);
  };

  const handleApplyNewUserRolePreset = (role: 'superadmin' | 'admin' | 'staff' | 'guest') => {
    setNewUserRole(role);
    if (rolePresets[role]) {
      setNewUserPermissions([...rolePresets[role]]);
    }
  };

  const handleToggleNewUserPermission = (permKey: string) => {
    if (newUserPermissions.includes(permKey)) {
      setNewUserPermissions(newUserPermissions.filter(p => p !== permKey));
    } else {
      setNewUserPermissions([...newUserPermissions, permKey]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newUserName,
          username: newUserUsername,
          email: newUserEmail,
          password: newUserPassword,
          phone: newUserPhone,
          role: newUserRole,
          permissions: newUserPermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Account created successfully: ${data.user.name} (@${data.user.username}) as ${data.user.role.toUpperCase()}`
        });
        setAddUserModalOpen(false);
        fetchUsers();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network communication failure' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Toggle specific permission checkbox
  const handleTogglePermission = (permKey: string) => {
    if (targetPermissions.includes(permKey)) {
      setTargetPermissions(targetPermissions.filter(p => p !== permKey));
    } else {
      setTargetPermissions([...targetPermissions, permKey]);
    }
  };

  // Save Position & Permissions
  const handleSavePositionAndPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setIsSavingPosition(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/auth/users/${selectedUserForEdit.id}/position`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          role: targetPosition,
          permissions: targetPermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Position updated: ${selectedUserForEdit.name} is now ${targetPosition.toUpperCase()} with ${targetPermissions.length} permissions.`
        });
        setSelectedUserForEdit(null);
        fetchUsers();
        refreshUser();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update position' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network communication failure' });
    } finally {
      setIsSavingPosition(false);
    }
  };

  // Save System Rules
  const handleSaveSystemRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemRules) return;

    setIsSavingRules(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/system-rules', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(systemRules)
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Hotel governance policies and system rules updated.' });
        setSystemRules(data.rules);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save rules' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error saving rules' });
    } finally {
      setIsSavingRules(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
            <Crown className="w-3 h-3 text-purple-700" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            Admin (GM)
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
            <UserCheck className="w-3 h-3 text-blue-700" />
            Front Desk Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F2EFE8] text-[#52525B] border border-[#D4CFBE]">
            Guest Resident
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in pb-28 md:pb-12">
      
      {/* Super Admin Executive Header */}
      <div className="bg-[#18181B] text-white rounded-2xl p-6 sm:p-8 mb-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-radial from-[#B89358]/20 to-transparent rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#D8B77D] mb-1.5">
              <Crown className="w-4 h-4 text-[#B89358]" />
              <span>Supreme Authority · Super Administrator Console</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-wide">
              System Rules &amp; Role-Based Access Control
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
              Full system control active under account <strong className="text-white font-mono">@{user?.username || 'lozada'}</strong>. Manage user directories, assign staff and admin positions, configure granular permissions, and enforce security policies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToOperations && (
              <button
                onClick={onSwitchToOperations}
                className="px-4 py-2.5 min-h-[44px] bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs uppercase tracking-wider font-medium rounded-lg border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#D8B77D]" />
                <span>Operations View</span>
              </button>
            )}
            <button
              onClick={() => { fetchUsers(); fetchSystemRules(); }}
              className="p-2.5 min-h-[44px] min-w-[44px] bg-[#27272A] hover:bg-[#3F3F46] text-[#FAF9F6] rounded-lg border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh System Data"
              aria-label="Refresh System Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin text-[#B89358]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Executive Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Total Accounts</span>
            <span className="font-serif text-xl sm:text-2xl font-semibold text-white block mt-0.5">{users.length}</span>
            <span className="text-[10px] text-[#71717A]">Registered in database</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Admins &amp; Staff</span>
            <span className="font-serif text-xl sm:text-2xl font-semibold text-[#D8B77D] block mt-0.5">
              {users.filter(u => u.role === 'admin' || u.role === 'staff' || u.role === 'superadmin').length}
            </span>
            <span className="text-[10px] text-[#71717A]">Elevated privileges</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Booking Policy</span>
            <span className="font-serif text-xl sm:text-2xl font-semibold text-emerald-400 block mt-0.5">Strict RBAC</span>
            <span className="text-[10px] text-[#71717A]">Sign-up required to book</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">Primary Super Admin</span>
            <span className="font-serif text-xl sm:text-2xl font-semibold text-purple-300 block mt-0.5 font-mono">lozada</span>
            <span className="text-[10px] text-[#71717A]">Master Credentials</span>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between border animate-fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 font-bold text-sm hover:opacity-70">&times;</button>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="flex border-b border-[#E8E4DA] mb-6 overflow-x-auto text-xs font-medium text-[#71717A] gap-1 sm:gap-2 pb-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directory' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent hover:text-[#18181B]'
          }`}
        >
          <Users className="w-4 h-4 text-[#B89358]" />
          <span>User Accounts &amp; Positions ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions-matrix')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'permissions-matrix' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent hover:text-[#18181B]'
          }`}
        >
          <Key className="w-4 h-4 text-[#B89358]" />
          <span>Permissions &amp; Feature Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('system-rules')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'system-rules' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent hover:text-[#18181B]'
          }`}
        >
          <Settings className="w-4 h-4 text-[#B89358]" />
          <span>Hotel System Rules &amp; Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('audit-log')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit-log' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent hover:text-[#18181B]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#B89358]" />
          <span>Security Audit Log</span>
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY & POSITION ASSIGNMENT */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          
          {/* Search & Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E4DA] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search by name, username (@lozada), email, or phone..."
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">Position:</span>
              {(['all', 'superadmin', 'admin', 'staff', 'guest'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-3 py-2 min-h-[38px] text-xs rounded-lg transition-all capitalize cursor-pointer font-medium ${
                    positionFilter === pos
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-[#FAF9F6] border border-[#E8E4DA] text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {pos === 'superadmin' ? 'Super Admin' : pos}
                </button>
              ))}
              <button
                onClick={fetchUsers}
                className="px-3.5 py-2 min-h-[38px] bg-[#B89358] hover:bg-[#8C6A32] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="px-3.5 py-2 min-h-[38px] bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#B89358]" />
                <span>+ Add User / Staff</span>
              </button>
            </div>
          </div>

          {/* User Table (Desktop & Mobile) */}
          <div className="bg-white rounded-xl border border-[#E8E4DA] overflow-hidden shadow-xs">
            {isLoadingUsers ? (
              <div className="p-12 text-center text-xs text-[#71717A]">
                Querying Grand Luxe user registry...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#71717A]">
                No user accounts match the query criteria.
              </div>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-[#E8E4DA]">
                  {users.map(u => (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-[#18181B]">{u.name}</span>
                            <span className="font-mono text-[11px] text-[#B89358]">@{u.username}</span>
                          </div>
                          <p className="text-xs text-[#71717A]">{u.email}</p>
                          {u.phone && <p className="text-[11px] text-[#A1A1AA]">{u.phone}</p>}
                        </div>
                        {getRoleBadge(u.role)}
                      </div>

                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {(u.permissions || []).slice(0, 4).map(p => (
                          <span key={p} className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded text-[#52525B]">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {(u.permissions || []).length > 4 && (
                          <span className="px-1.5 py-0.5 text-[#B89358] font-medium">
                            +{(u.permissions || []).length - 4} more
                          </span>
                        )}
                      </div>

                      {/* User Bookings Snippet */}
                      <div className="flex items-center justify-between text-xs bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E8E4DA]">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#B89358]" />
                          <span className="font-semibold text-[#18181B]">{u.bookings_count || 0} {u.bookings_count === 1 ? 'Booking' : 'Bookings'}</span>
                          {u.total_spent ? <span className="text-[#B89358] font-semibold">(${u.total_spent.toLocaleString()})</span> : null}
                        </div>
                        <button
                          onClick={() => setSelectedUserForBookings(u)}
                          className="text-[11px] font-semibold text-[#B89358] hover:text-[#8C6A32] cursor-pointer"
                        >
                          View What They Booked &rarr;
                        </button>
                      </div>

                      <div className="pt-2 border-t border-[#F2EFE8] flex items-center justify-between">
                        <span className="text-[10px] text-[#71717A]">
                          Registered: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                        <button
                          onClick={() => handleOpenEditPosition(u)}
                          className="px-3 py-2 min-h-[40px] bg-[#18181B] hover:bg-[#B89358] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Assign Position</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-[#E8E4DA] text-[#71717A] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">User &amp; Username</th>
                        <th className="py-3 px-4">Email &amp; Contact</th>
                        <th className="py-3 px-4">Assigned Position</th>
                        <th className="py-3 px-4">Granted Permissions</th>
                        <th className="py-3 px-4">Reservations &amp; Stays</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE8]">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#18181B] text-[#FAF9F6] flex items-center justify-center font-serif font-bold text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-[#18181B] block">{u.name}</span>
                                <span className="font-mono text-[11px] text-[#B89358]">@{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#52525B]">
                            <div>{u.email}</div>
                            <div className="text-[10px] text-[#A1A1AA]">{u.phone || 'No phone recorded'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {getRoleBadge(u.role)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(u.permissions || []).slice(0, 3).map(p => (
                                <span key={p} className="px-1.5 py-0.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded text-[10px] text-[#52525B]">
                                  {p.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {(u.permissions || []).length > 3 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-[#B89358] font-semibold">
                                  +{(u.permissions || []).length - 3} privileges
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => setSelectedUserForBookings(u)}
                              className="px-2.5 py-1.5 bg-[#FAF9F6] hover:bg-[#F2EFE8] border border-[#E8E4DA] rounded-lg text-xs font-medium text-[#18181B] inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#B89358] group-hover:scale-110 transition-transform" />
                              <span>{u.bookings_count || 0} {u.bookings_count === 1 ? 'Stay' : 'Stays'}</span>
                              {u.total_spent ? <span className="text-[#B89358] font-bold">(${u.total_spent.toLocaleString()})</span> : null}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-[#71717A] text-[11px]">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'New'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenEditPosition(u)}
                              className="px-3 py-1.5 min-h-[36px] bg-[#18181B] hover:bg-[#B89358] active:scale-95 text-white text-xs font-medium rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Assign Position</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS & FEATURE MATRIX */}
      {activeTab === 'permissions-matrix' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#E8E4DA] shadow-xs">
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] mb-2">
              Role &amp; Privilege Architecture Matrix
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed mb-6">
              The Grand Luxe enforces zero-trust, server-validated Role-Based Access Control (RBAC). The Super Administrator can dynamically grant or revoke privileges on both position templates and specific user accounts.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8E4DA] text-[#71717A] uppercase text-[10px] tracking-wider">
                    <th className="py-3">Permission Token &amp; Description</th>
                    <th className="py-3">Category</th>
                    <th className="py-3 text-center">Guest</th>
                    <th className="py-3 text-center">Staff (Front Desk)</th>
                    <th className="py-3 text-center">Admin (GM)</th>
                    <th className="py-3 text-center text-purple-700">Super Admin (Lozada)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE8]">
                  {availablePermissions.map(p => {
                    const hasGuest = rolePresets.guest?.includes(p.key);
                    const hasStaff = rolePresets.staff?.includes(p.key);
                    const hasAdmin = rolePresets.admin?.includes(p.key);
                    const hasSuper = true;

                    return (
                      <tr key={p.key} className="hover:bg-[#FAF9F6]/50">
                        <td className="py-3">
                          <span className="font-semibold text-[#18181B] block">{p.name}</span>
                          <span className="font-mono text-[10px] text-[#71717A]">{p.key}</span>
                          <span className="block text-[11px] text-[#52525B] mt-0.5">{p.description}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded text-[10px] uppercase font-semibold text-[#71717A]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {hasGuest ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-[#D4CFBE]">&mdash;</span>}
                        </td>
                        <td className="py-3 text-center">
                          {hasStaff ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-[#D4CFBE]">&mdash;</span>}
                        </td>
                        <td className="py-3 text-center">
                          {hasAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-[#D4CFBE]">&mdash;</span>}
                        </td>
                        <td className="py-3 text-center bg-purple-50/50">
                          <Check className="w-4 h-4 text-purple-700 mx-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM RULES & HOTEL GOVERNANCE */}
      {activeTab === 'system-rules' && systemRules && (
        <form onSubmit={handleSaveSystemRules} className="bg-white p-6 rounded-xl border border-[#E8E4DA] shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] mb-1">
              Global Hotel System Governance &amp; Policies
            </h3>
            <p className="text-xs text-[#71717A]">
              Only the Super Administrator has authority to modify core financial formulas and reservation access rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#E8E4DA]">
            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Account Requirement for Suite Booking
              </label>
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl">
                <input
                  type="checkbox"
                  id="requireAccount"
                  checked={systemRules.require_account_to_book}
                  onChange={(e) => setSystemRules({ ...systemRules, require_account_to_book: e.target.checked })}
                  className="w-4 h-4 text-[#B89358] rounded focus:ring-0"
                />
                <label htmlFor="requireAccount" className="text-xs text-[#18181B] cursor-pointer">
                  <strong>Strict Authentication Wall:</strong> Require all guests to be registered and signed in before booking suites.
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Instant Room Confirmation
              </label>
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl">
                <input
                  type="checkbox"
                  id="instantBook"
                  checked={systemRules.allow_instant_booking}
                  onChange={(e) => setSystemRules({ ...systemRules, allow_instant_booking: e.target.checked })}
                  className="w-4 h-4 text-[#B89358] rounded focus:ring-0"
                />
                <label htmlFor="instantBook" className="text-xs text-[#18181B] cursor-pointer">
                  <strong>Instant Reservation Dispatch:</strong> Automatically allocate inventory upon verified booking submission.
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Hospitality Tax &amp; Resort Levy Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={systemRules.tax_rate}
                  onChange={(e) => setSystemRules({ ...systemRules, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                />
                <span className="absolute right-3 top-3 text-xs text-[#71717A]">
                  ({(systemRules.tax_rate * 100).toFixed(0)}%)
                </span>
              </div>
              <p className="text-[10px] text-[#71717A] mt-1">Default 0.12 (12% luxury resort levy)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Resort Privilege Fee per Night ($)
              </label>
              <input
                type="number"
                min="0"
                value={systemRules.resort_fee_per_night}
                onChange={(e) => setSystemRules({ ...systemRules, resort_fee_per_night: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-3 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
              />
              <p className="text-[10px] text-[#71717A] mt-1">Includes spa access, private beach cabanas, high-speed fiber</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Cancellation Grace Window (Hours)
              </label>
              <input
                type="number"
                min="0"
                value={systemRules.cancellation_grace_hours}
                onChange={(e) => setSystemRules({ ...systemRules, cancellation_grace_hours: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-3 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Max Advance Booking (Days)
              </label>
              <input
                type="number"
                min="30"
                max="730"
                value={systemRules.max_booking_advance_days}
                onChange={(e) => setSystemRules({ ...systemRules, max_booking_advance_days: parseInt(e.target.value, 10) || 365 })}
                className="w-full p-3 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#27272A] mb-1">
                Palace System Notice / Broadcast Message
              </label>
              <input
                type="text"
                value={systemRules.system_notice}
                onChange={(e) => setSystemRules({ ...systemRules, system_notice: e.target.value })}
                className="w-full p-3 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                placeholder="Broadcast to all dashboards..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E4DA] flex justify-end">
            <button
              type="submit"
              disabled={isSavingRules}
              className="px-6 py-2.5 min-h-[44px] bg-[#18181B] hover:bg-[#B89358] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingRules ? 'Saving Policies...' : 'Save System Rules'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: SECURITY AUDIT LOG */}
      {activeTab === 'audit-log' && (
        <div className="bg-white p-6 rounded-xl border border-[#E8E4DA] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B]">
                Cryptographic Security &amp; Audit Log
              </h3>
              <p className="text-xs text-[#71717A]">
                Immutable server audit records tracking user registrations, position adjustments, and governance changes.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-2 min-h-[40px] min-w-[40px] border border-[#D4CFBE] rounded-lg hover:bg-[#FAF9F6] flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-[#B89358]' : ''}`} />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#71717A]">No audit entries recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8E4DA] text-[#71717A] uppercase text-[10px] tracking-wider">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Actor</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Target</th>
                    <th className="py-2.5">Audit Record Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE8]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#FAF9F6]/50">
                      <td className="py-2.5 font-mono text-[11px] text-[#71717A] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 font-semibold text-[#18181B]">
                        {log.actor_name}
                      </td>
                      <td className="py-2.5">
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-[#B89358]">
                        {log.target_username ? `@${log.target_username}` : 'N/A'}
                      </td>
                      <td className="py-2.5 text-[#52525B]">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ASSIGN POSITION & CONFIGURE PERMISSIONS */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div
            className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E4DA] overflow-hidden max-h-[92vh] flex flex-col pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 bg-[#FAF9F6] border-b border-[#E8E4DA] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B89358]">
                  Position &amp; RBAC Assignment
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-light">
                  Assign Position for {selectedUserForEdit.name}
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Username: <strong className="font-mono text-[#18181B]">@{selectedUserForEdit.username}</strong> · Email: {selectedUserForEdit.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-[#71717A] hover:text-[#18181B] min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#F2EFE8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePositionAndPermissions} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Position Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-2">
                  Select User Position (Role)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'guest', title: 'Guest', desc: 'Suite Booking' },
                    { id: 'staff', title: 'Staff', desc: 'Front Desk' },
                    { id: 'admin', title: 'Admin', desc: 'General Mgr' },
                    { id: 'superadmin', title: 'Super Admin', desc: 'Full Control' }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleApplyPreset(pos.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        targetPosition === pos.id
                          ? 'border-[#B89358] bg-[#FAF9F6] shadow-xs'
                          : 'border-[#E8E4DA] bg-white hover:border-[#D4CFBE]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[#18181B]">{pos.title}</span>
                        {targetPosition === pos.id && <Check className="w-3.5 h-3.5 text-[#B89358]" />}
                      </div>
                      <span className="text-[10px] text-[#71717A] block">{pos.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#18181B]">
                    Granular Feature Permissions ({targetPermissions.length} Active)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(targetPosition)}
                    className="text-[11px] text-[#B89358] font-medium hover:underline p-1"
                  >
                    Reset to {targetPosition.toUpperCase()} Default Preset
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 bg-[#FAF9F6] rounded-xl border border-[#E8E4DA]">
                  {availablePermissions.map(perm => {
                    const isChecked = targetPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-white border-[#B89358]/50 shadow-2xs'
                            : 'bg-white/60 border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="mt-0.5 w-4 h-4 text-[#B89358] rounded focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-xs text-[#18181B] block leading-tight">
                            {perm.name}
                          </span>
                          <span className="font-mono text-[9px] text-[#71717A] block">
                            {perm.key}
                          </span>
                          <span className="text-[10px] text-[#52525B] block mt-0.5 leading-snug">
                            {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Warning note if changing lozada */}
              {selectedUserForEdit.username === 'lozada' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    This is the designated primary Super Administrator account. It retains permanent executive privileges.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E4DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#52525B] hover:text-[#18181B] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPosition}
                  className="px-6 py-2.5 min-h-[44px] bg-[#18181B] hover:bg-[#B89358] active:scale-95 text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPosition ? 'Applying Position...' : 'Confirm Position & Permissions'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW USER / STAFF */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8E4DA] mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-5 h-5 text-[#B89358]" />
                  <h3 className="font-serif text-lg font-medium text-[#18181B]">
                    Register New Account & Permissions
                  </h3>
                </div>
                <p className="text-xs text-[#71717A]">
                  Create an authenticated staff, administrator, or guest with dedicated system permissions.
                </p>
              </div>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Alexander Vance"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] rounded-lg focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="e.g. avance"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] rounded-lg focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. alexander@thegrandluxe.com"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] rounded-lg focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] rounded-lg focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] rounded-lg focus:outline-none focus:border-[#B89358]"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1.5">
                  Select User Position & Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['guest', 'staff', 'admin', 'superadmin'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleApplyNewUserRolePreset(role)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        newUserRole === role
                          ? 'border-[#B89358] bg-[#FAF8F5] ring-1 ring-[#B89358]'
                          : 'border-[#E8E4DA] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="font-semibold text-xs capitalize text-[#18181B] flex items-center justify-between">
                        <span>{role === 'superadmin' ? 'Super Admin' : role}</span>
                        {newUserRole === role && <span className="text-[#B89358]">✓</span>}
                      </div>
                      <span className="text-[10px] text-[#71717A] block mt-0.5">
                        {role === 'superadmin' && 'Full privileges'}
                        {role === 'admin' && 'Department executive'}
                        {role === 'staff' && 'Front desk & ops'}
                        {role === 'guest' && 'Standard booking'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#18181B]">
                    Assigned Feature Permissions ({newUserPermissions.length} Active)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleApplyNewUserRolePreset(newUserRole)}
                    className="text-[11px] text-[#B89358] font-medium hover:underline p-1"
                  >
                    Reset to {newUserRole.toUpperCase()} Presets
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-[#FAF9F6] rounded-xl border border-[#E8E4DA]">
                  {availablePermissions.map(perm => {
                    const isChecked = newUserPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-white border-[#B89358]/50 shadow-2xs'
                            : 'bg-white/60 border-transparent hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNewUserPermission(perm.key)}
                          className="mt-0.5 w-4 h-4 text-[#B89358] rounded focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-xs text-[#18181B] block leading-tight">
                            {perm.name}
                          </span>
                          <span className="font-mono text-[9px] text-[#71717A] block">
                            {perm.key}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E8E4DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#52525B] hover:text-[#18181B] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-6 py-2.5 min-h-[44px] bg-[#18181B] hover:bg-[#B89358] active:scale-95 text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isCreatingUser ? 'Creating User...' : 'Create Account & Assign Permissions'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT USER BOOKINGS */}
      {selectedUserForBookings && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8E4DA] mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B89358]">
                    Account Itinerary &amp; Stay History
                  </span>
                  {getRoleBadge(selectedUserForBookings.role)}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-light">
                  {selectedUserForBookings.name}
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  <span className="font-mono text-[#B89358]">@{selectedUserForBookings.username}</span> · {selectedUserForBookings.email}
                  {selectedUserForBookings.phone ? ` · ${selectedUserForBookings.phone}` : ''}
                </p>
              </div>

              <button
                onClick={() => setSelectedUserForBookings(null)}
                className="p-2 text-[#71717A] hover:text-[#18181B] rounded-lg hover:bg-[#FAF9F6] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Summary Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 bg-[#FAF9F6] p-3 rounded-xl border border-[#E8E4DA] text-xs">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Total Stays</span>
                <span className="font-serif text-lg font-bold text-[#18181B]">
                  {selectedUserForBookings.bookings_count || (selectedUserForBookings.bookings?.length || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Total Folio Yield</span>
                <span className="font-serif text-lg font-bold text-[#B89358]">
                  ${(selectedUserForBookings.total_spent || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Member Since</span>
                <span className="font-medium text-[#18181B]">
                  {selectedUserForBookings.created_at ? new Date(selectedUserForBookings.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* List of Bookings */}
            <div className="space-y-3.5">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#18181B]">
                Reserved Suites &amp; Residences ({selectedUserForBookings.bookings?.length || 0})
              </h4>

              {(!selectedUserForBookings.bookings || selectedUserForBookings.bookings.length === 0) ? (
                <div className="p-8 text-center bg-[#FAF9F6] rounded-xl border border-[#E8E4DA]">
                  <p className="text-xs text-[#71717A] italic">
                    This user has not completed any suite bookings yet.
                  </p>
                </div>
              ) : (
                selectedUserForBookings.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl space-y-2.5 hover:border-[#D4CFBE] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE6DC] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#18181B]">{booking.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            booking.status === 'checked_in' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            booking.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h5 className="font-serif text-base font-medium text-[#18181B] mt-0.5">
                          {booking.room_type_name}
                        </h5>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Total Folio</span>
                        <span className="font-serif text-base font-bold text-[#B89358]">
                          ${booking.total_price.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-medium capitalize">
                          {booking.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#52525B]">
                      <div>
                        <span className="text-[#71717A] block text-[10px] uppercase">Dates</span>
                        <span className="font-medium text-[#18181B]">{booking.check_in_date} → {booking.check_out_date}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block text-[10px] uppercase">Allocated Room</span>
                        <span className="font-medium text-[#18181B]">
                          {booking.assigned_room_id ? `Room ${booking.assigned_room_id}` : 'Unassigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block text-[10px] uppercase">Party</span>
                        <span className="font-medium text-[#18181B]">
                          {booking.guests_count || 1} Guests
                        </span>
                      </div>
                    </div>

                    {booking.add_ons && booking.add_ons.length > 0 && (
                      <div className="pt-2 border-t border-[#EAE6DC]">
                        <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-1">
                          Reserved Experiences:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {booking.add_ons.map((addon, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border border-[#E8E4DA] rounded text-[10px] text-[#27272A] flex items-center gap-1">
                              <span>✦ {addon.name}</span>
                              <span className="text-[#B89358] font-mono">${addon.price}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.special_requests && (
                      <p className="text-[11px] text-[#71717A] italic bg-white p-2 rounded border border-[#EAE6DC]">
                        "{booking.special_requests}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Bottom Close */}
            <div className="pt-4 mt-5 border-t border-[#E8E4DA] flex justify-end">
              <button
                onClick={() => setSelectedUserForBookings(null)}
                className="px-5 py-2.5 min-h-[44px] bg-[#18181B] hover:bg-[#B89358] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors cursor-pointer"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
