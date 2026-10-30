import { Router, Response } from 'express';
import { db, ALL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '../mysqlDb.ts';
import {
  signToken,
  requireAuth,
  requireSuperAdmin,
  requirePermission,
  AuthRequest,
  hashPassword,
  comparePassword
} from '../auth.ts';

const router = Router();

// Register new guest account
router.post('/register', async (req, res: Response) => {
  try {
    const { name, username, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await db.getUserByEmail(normalizedEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    let cleanUsername = (username || normalizedEmail.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername) {
      cleanUsername = `guest_${Date.now().toString().slice(-4)}`;
    }

    const existingUser = await db.getUserByUsername(cleanUsername);
    if (existingUser) {
      cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      username: cleanUsername,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'guest',
      permissions: ['book_suites'],
      phone: phone || ''
    });

    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
      phone: newUser.phone,
      created_at: newUser.created_at
    };

    const token = signToken(safeUser);
    return res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login using Username OR Email
router.post('/login', async (req, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginTarget = (identifier || email || username || '').trim();

    if (!loginTarget || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const user = await db.getUserByUsernameOrEmail(loginTarget);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const match = comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    await db.recordUserLogin(user.id);

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['book_suites'],
      phone: user.phone,
      created_at: user.created_at,
      last_login: new Date().toISOString()
    };

    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Demo switch login (Superadmin Lozada, Admin, Staff, or VIP Guest)
router.post('/demo-login', async (req, res: Response) => {
  try {
    const { role } = req.body;
    let identifier = 'lozada';
    if (role === 'admin') identifier = 'admin';
    if (role === 'staff') identifier = 'clara';
    if (role === 'guest') identifier = 'guest_vip';

    let user = await db.getUserByUsernameOrEmail(identifier);
    if (!user) {
      const users = await db.getUsers();
      if (role === 'superadmin') user = users.find(u => u.role === 'superadmin');
      if (role === 'admin') user = users.find(u => u.role === 'admin');
      if (role === 'staff') user = users.find(u => u.role === 'staff');
      if (role === 'guest') user = users.find(u => u.role === 'guest');
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    await db.recordUserLogin(user.id);

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['book_suites'],
      phone: user.phone,
      created_at: user.created_at,
      last_login: new Date().toISOString()
    };

    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: 'Demo switch failed' });
  }
});

// Current user info
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['book_suites'],
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// List users (Staff/Admin/SuperAdmin)
router.get('/users', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const hasPermission = req.user?.permissions?.includes('manage_users');

    if (!['superadmin', 'admin', 'staff'].includes(userRole || '') && !hasPermission) {
      return res.status(403).json({ error: 'Access restricted to hotel management and staff' });
    }

    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const roleFilter = (req.query.role as string) || 'all';

    let users = await db.getUsers();

    if (search) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.username?.toLowerCase().includes(search) ||
        (u.phone && u.phone.includes(search))
      );
    }

    if (roleFilter !== 'all') {
      users = users.filter(u => u.role === roleFilter);
    }

    const allReservations = await db.getReservations();
    const roomTypes = await db.getRoomTypes();

    const safeUsers = users.map(u => {
      const userBookings = allReservations
        .filter(r => (r.user_id && r.user_id === u.id) || (r.guest_email && r.guest_email.toLowerCase() === u.email.toLowerCase()))
        .map(r => {
          const rt = roomTypes.find(t => t.id === r.room_type_id);
          return {
            ...r,
            room_type_name: rt ? rt.name : r.room_type_id,
            category: rt ? rt.category : '',
            image_url: rt ? rt.image_url : ''
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalSpent = userBookings.reduce((sum, r) => sum + (r.total_price || 0), 0);

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: u.permissions || ROLE_DEFAULT_PERMISSIONS[u.role] || ['book_suites'],
        phone: u.phone,
        created_at: u.created_at,
        updated_at: u.updated_at,
        last_login: u.last_login,
        bookings_count: userBookings.length,
        total_spent: Math.round(totalSpent * 100) / 100,
        bookings: userBookings
      };
    });

    return res.json({ users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get detailed bookings for a specific user
router.get('/users/:id/bookings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const targetUser = await db.getUserById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user!.id !== targetUserId && !['staff', 'admin', 'superadmin'].includes(req.user!.role)) {
      return res.status(403).json({ error: "Unauthorized to view this user's bookings" });
    }

    const roomTypes = await db.getRoomTypes();
    const userBookings = (await db.getReservations())
      .filter(r => (r.user_id && r.user_id === targetUserId) || (r.guest_email && r.guest_email.toLowerCase() === targetUser.email.toLowerCase()))
      .map(r => {
        const rt = roomTypes.find(t => t.id === r.room_type_id);
        return {
          ...r,
          room_type_name: rt ? rt.name : r.room_type_id,
          category: rt ? rt.category : '',
          image_url: rt ? rt.image_url : ''
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      user: {
        id: targetUser.id,
        username: targetUser.username,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      bookings: userBookings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

// Assign Position and Custom Permissions (Super Admin or Role Manager)
router.put('/users/:id/position', requireAuth, requirePermission('manage_roles'), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role, permissions } = req.body;

    if (!['superadmin', 'admin', 'staff', 'guest'].includes(role)) {
      return res.status(400).json({ error: 'Invalid position role specified' });
    }

    const targetUser = await db.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.username?.toLowerCase() === 'lozada' && role !== 'superadmin') {
      return res.status(400).json({
        error: 'Primary Super Administrator account (lozada) cannot be demoted'
      });
    }

    const assignedPermissions = Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : ROLE_DEFAULT_PERMISSIONS[role] || ['book_suites'];

    const updated = await db.updateUserPositionAndPermissions(
      id,
      role as any,
      assignedPermissions,
      { id: req.user!.id, name: req.user!.name }
    );

    return res.json({
      success: true,
      message: `User ${targetUser.name} successfully updated to position: ${role.toUpperCase()}`,
      user: {
        id: updated?.id,
        username: updated?.username,
        name: updated?.name,
        email: updated?.email,
        role: updated?.role,
        permissions: updated?.permissions
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user position' });
  }
});

// Available System Permissions & Role Presets
router.get('/permissions', requireAuth, async (_req, res: Response) => {
  return res.json({
    available_permissions: [
      { key: 'manage_users', name: 'User Directory & Accounts', category: 'Governance', description: 'Search, view, and inspect all registered guests, staff, and admin accounts' },
      { key: 'manage_roles', name: 'Position & Role Assignment', category: 'Governance', description: 'Assign positions (Staff, Admin, Superadmin) and customize granular access rights' },
      { key: 'manage_rules', name: 'System Rules & Governance', category: 'Governance', description: 'Configure hotel reservation policies, deposit rules, cancellation windows' },
      { key: 'view_analytics', name: 'Financial & Operational Yield', category: 'Executive', description: 'Access RevPAR, ADR, occupancy rates, and revenue trend analytics' },
      { key: 'manage_inventory', name: 'Suite Pricing & Room Status', category: 'Operations', description: 'Modify room rates, description, amenities, and room status overrides' },
      { key: 'manage_reservations', name: 'Reservations Ledger & Assignment', category: 'Operations', description: 'View all guest bookings, assign specific physical rooms, and cancel stays' },
      { key: 'front_desk_checkin', name: 'Front Desk Check-in / Check-out', category: 'Hospitality', description: 'Process arriving guests, dispatch digital keycards, and manage departures' },
      { key: 'manage_folios', name: 'Folio Billing & Incidentals', category: 'Hospitality', description: 'Post dining, spa, and transportation charges and settle guest folios' },
      { key: 'book_suites', name: 'Suite Booking Privilege', category: 'Guest Privileges', description: 'Authorized to create suite reservations and luxury package bookings' }
    ],
    role_presets: ROLE_DEFAULT_PERMISSIONS
  });
});

// System Rules
router.get('/system-rules', requireAuth, async (_req, res: Response) => {
  const rules = await db.getSystemRules();
  return res.json({ rules });
});

router.put('/system-rules', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateSystemRules(req.body, { id: req.user!.id, name: req.user!.name });
    return res.json({ success: true, rules: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update system rules' });
  }
});

// Audit Logs (Super Admin only)
router.get('/audit-logs', requireAuth, requireSuperAdmin, async (_req, res: Response) => {
  const audit_logs = await db.getAuditLogs();
  return res.json({ audit_logs });
});

export default router;
