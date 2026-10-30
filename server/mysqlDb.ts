/**
 * MySQL Database Layer for The Grand Luxe Hotel & Resort
 * Implements Spatie-style roles & permissions natively in Node.js/MySQL
 * Tables: users, roles, permissions, role_has_permissions, model_has_roles, model_has_permissions
 * Plus hotel-specific: room_types, rooms, reservations, folio_items, hotel_services, system_rules, audit_logs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { hashPassword } from './auth.ts';

dotenv.config();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: number;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'superadmin' | 'admin' | 'staff' | 'guest';
  permissions: string[];
  phone: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface SystemRulesRecord {
  tax_rate: number;
  resort_fee_per_night: number;
  require_account_to_book: boolean;
  allow_instant_booking: boolean;
  max_booking_advance_days: number;
  cancellation_grace_hours: number;
  maintenance_mode: boolean;
  system_notice: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor_id: number;
  actor_name: string;
  action: string;
  target_user_id?: number;
  target_username?: string;
  details: string;
}

export interface RoomTypeRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  size_sqm: number;
  bed_type: string;
  view_type: string;
  image_url: string;
  amenities: string[];
}

export interface RoomRecord {
  id: string;
  room_type_id: string;
  floor: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  notes: string;
}

export interface ReservationRecord {
  id: string;
  user_id: number | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room_type_id: string;
  assigned_room_id: string | null;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_price: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'refunded';
  payment_method: string;
  special_requests: string;
  add_ons: any[];
  created_at: string;
}

export interface FolioItemRecord {
  id: number;
  reservation_id: string;
  description: string;
  category: 'room' | 'dining' | 'spa' | 'transport' | 'tax' | 'service';
  amount: number;
  created_at: string;
}

export interface HotelServiceRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}

// ─── Permissions & Role Presets ───────────────────────────────────────────────

export const ALL_PERMISSIONS = [
  'manage_users',
  'manage_roles',
  'manage_rules',
  'view_analytics',
  'manage_inventory',
  'manage_reservations',
  'front_desk_checkin',
  'manage_folios',
  'book_suites'
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  superadmin: [...ALL_PERMISSIONS],
  admin: [
    'view_analytics',
    'manage_inventory',
    'manage_reservations',
    'front_desk_checkin',
    'manage_folios',
    'book_suites'
  ],
  staff: [
    'manage_reservations',
    'front_desk_checkin',
    'manage_folios'
  ],
  guest: [
    'book_suites'
  ]
};

// ─── Connection Pool ──────────────────────────────────────────────────────────

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3307', 10),
      database: process.env.DB_DATABASE || 'hotel',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  }
  return pool;
}

// ─── Migration: Create All Tables ─────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    console.log('[MySQL] Running migrations...');

    // ── Spatie-style permissions tables ──────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(125) NOT NULL,
        guard_name VARCHAR(125) NOT NULL DEFAULT 'web',
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        UNIQUE KEY permissions_name_guard_unique (name, guard_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(125) NOT NULL,
        guard_name VARCHAR(125) NOT NULL DEFAULT 'web',
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        UNIQUE KEY roles_name_guard_unique (name, guard_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_has_permissions (
        permission_id INT UNSIGNED NOT NULL,
        role_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (permission_id, role_id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Users ─────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Spatie model_has_roles (user → role assignment) ───────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS model_has_roles (
        role_id INT UNSIGNED NOT NULL,
        model_type VARCHAR(255) NOT NULL DEFAULT 'App\\\\Models\\\\User',
        model_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (role_id, model_id, model_type),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Spatie model_has_permissions (user → direct permission assignment) ────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS model_has_permissions (
        permission_id INT UNSIGNED NOT NULL,
        model_type VARCHAR(255) NOT NULL DEFAULT 'App\\\\Models\\\\User',
        model_id BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (permission_id, model_id, model_type),
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Room Types ────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS room_types (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_occupancy INT NOT NULL DEFAULT 2,
        size_sqm DECIMAL(6,2) DEFAULT 0,
        bed_type VARCHAR(100) DEFAULT '',
        view_type VARCHAR(100) DEFAULT '',
        image_url VARCHAR(500) DEFAULT '',
        amenities JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Physical Rooms ────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        room_type_id VARCHAR(100) NOT NULL,
        floor INT NOT NULL DEFAULT 1,
        status ENUM('available','occupied','reserved','cleaning','maintenance') DEFAULT 'available',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Reservations ──────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT UNSIGNED NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(50) DEFAULT '',
        room_type_id VARCHAR(100) NOT NULL,
        assigned_room_id VARCHAR(50) NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests_count INT DEFAULT 1,
        total_price DECIMAL(10,2) DEFAULT 0,
        status ENUM('confirmed','checked_in','checked_out','cancelled') DEFAULT 'confirmed',
        payment_status ENUM('paid','pending','refunded') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'credit_card',
        special_requests TEXT,
        add_ons JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id),
        FOREIGN KEY (assigned_room_id) REFERENCES rooms(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Folio Items ───────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS folio_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        reservation_id VARCHAR(50) NOT NULL,
        description VARCHAR(500) NOT NULL,
        category ENUM('room','dining','spa','transport','tax','service') DEFAULT 'service',
        amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Hotel Services ────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hotel_services (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── System Rules ──────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_rules (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        rule_key VARCHAR(100) NOT NULL UNIQUE,
        rule_value TEXT NOT NULL,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ── Audit Logs ────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actor_id INT UNSIGNED NOT NULL,
        actor_name VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_user_id INT UNSIGNED NULL,
        target_username VARCHAR(100) NULL,
        details TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[MySQL] All tables created successfully.');
  } finally {
    conn.release();
  }
}

// ─── Seed Permissions & Roles (Spatie-style) ─────────────────────────────────

async function seedPermissionsAndRoles(conn: mysql.PoolConnection): Promise<Map<string, number>> {
  const now = new Date();
  const permMap = new Map<string, number>();
  const roleMap = new Map<string, number>();

  // Insert all permissions
  for (const perm of ALL_PERMISSIONS) {
    await conn.query(
      `INSERT IGNORE INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, 'web', ?, ?)`,
      [perm, now, now]
    );
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id FROM permissions WHERE name = ? AND guard_name = 'web'`, [perm]
    );
    if (rows[0]) permMap.set(perm, rows[0].id);
  }

  // Insert all roles
  for (const role of Object.keys(ROLE_DEFAULT_PERMISSIONS)) {
    await conn.query(
      `INSERT IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES (?, 'web', ?, ?)`,
      [role, now, now]
    );
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id FROM roles WHERE name = ? AND guard_name = 'web'`, [role]
    );
    if (rows[0]) roleMap.set(role, rows[0].id);
  }

  // Assign permissions to roles (role_has_permissions)
  for (const [roleName, perms] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;
    for (const perm of perms) {
      const permId = permMap.get(perm);
      if (!permId) continue;
      await conn.query(
        `INSERT IGNORE INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)`,
        [permId, roleId]
      );
    }
  }

  return permMap;
}

// ─── Seed Initial Data ────────────────────────────────────────────────────────

export async function seedInitialData(): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    // Check if already seeded
    const [existingRooms] = await conn.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) as cnt FROM rooms`);
    if (existingRooms[0].cnt > 0) {
      console.log('[MySQL] Database already seeded. Skipping seed.');
      // Still ensure super admin exists
      await ensureSuperAdmin(conn);
      return;
    }

    console.log('[MySQL] Seeding initial hotel data...');

    // Seed permissions & roles (Spatie-style)
    const permMap = await seedPermissionsAndRoles(conn);

    // ── Seed Users ──────────────────────────────────────────────────────────
    const usersToSeed = [
      {
        username: 'lozada',
        name: 'Jeric Lozada (Super Administrator)',
        email: 'lozada@grandluxe.com',
        password: 'lozada123',
        role: 'superadmin',
        phone: '+1 (555) 019-8800'
      },
      {
        username: 'admin',
        name: 'Lord Arthur Sterling (GM)',
        email: 'admin@grandluxe.com',
        password: 'admin123',
        role: 'admin',
        phone: '+1 (555) 019-2831'
      },
      {
        username: 'clara',
        name: 'Clara Vance (Front Desk Mgr)',
        email: 'clara@grandluxe.com',
        password: 'staff123',
        role: 'staff',
        phone: '+1 (555) 019-2832'
      },
      {
        username: 'guest_vip',
        name: 'Countess Camille De Monet (VIP Guest)',
        email: 'camille@monet.eu',
        password: 'guest123',
        role: 'guest',
        phone: '+1 (555) 019-4411'
      }
    ];

    const userIdMap = new Map<string, number>();
    for (const u of usersToSeed) {
      const hash = hashPassword(u.password);
      await conn.query(
        `INSERT IGNORE INTO users (username, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
        [u.username, u.name, u.email, hash, u.phone]
      );
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT id FROM users WHERE username = ?`, [u.username]
      );
      if (!rows[0]) continue;
      const userId = rows[0].id;
      userIdMap.set(u.username, userId);

      // Assign role via model_has_roles (Spatie-style)
      const [roleRows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT id FROM roles WHERE name = ? AND guard_name = 'web'`, [u.role]
      );
      if (roleRows[0]) {
        await conn.query(
          `INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`,
          [roleRows[0].id, userId]
        );
      }

      // Assign direct permissions via model_has_permissions (Spatie-style)
      const userPerms = ROLE_DEFAULT_PERMISSIONS[u.role] || [];
      for (const perm of userPerms) {
        const permId = permMap.get(perm);
        if (permId) {
          await conn.query(
            `INSERT IGNORE INTO model_has_permissions (permission_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`,
            [permId, userId]
          );
        }
      }
    }

    // ── Seed Room Types ─────────────────────────────────────────────────────
    const roomTypes = [
      {
        id: 'presidential-suite',
        name: 'Presidential Penthouse Suite',
        category: 'Signature Suite',
        description: 'Occupying the entire top level with breathtaking 360-degree ocean and skyline panoramas.',
        base_price: 1850,
        max_occupancy: 4,
        size_sqm: 185,
        bed_type: 'King Canopy Bed + Daybed',
        view_type: 'Panoramic Ocean & Skyline',
        image_url: '/src/assets/images/room_presidential_suite_1790748133665.jpg',
        amenities: JSON.stringify([
          'Private Butler Service 24/7', 'Private Jacuzzi Terrace', 'Complimentary Airport Limousine',
          'Full Marble Bath with Soaking Tub', 'Bespoke Bar with Curated Cellar',
          'Bang & Olufsen Acoustic System', 'Dyson Supersonic Care Suite', 'Priority Michelin Dining Seating'
        ])
      },
      {
        id: 'deluxe-ocean',
        name: 'Deluxe Ocean Vista Suite',
        category: 'Deluxe Rooms',
        description: 'Bathed in soft morning coastal light with expansive floor-to-ceiling glass doors.',
        base_price: 450,
        max_occupancy: 2,
        size_sqm: 54,
        bed_type: 'Custom King Bed',
        view_type: 'Direct Oceanfront',
        image_url: '/src/assets/images/room_deluxe_ocean_1790748144413.jpg',
        amenities: JSON.stringify([
          'Private Oceanfront Balcony', 'Artisan Espresso Bar', 'Walk-in Rainfall Shower',
          'Organic Botanical Toiletries', 'Evening Turn-Down Aromatherapy', 'Smart Environmental Climate Controls'
        ])
      },
      {
        id: 'executive-suite',
        name: 'Executive Grand Suite',
        category: 'Executive Suites',
        description: 'Tailored for discerning business travelers and executive getaways.',
        base_price: 680,
        max_occupancy: 3,
        size_sqm: 78,
        bed_type: 'King Bed & Executive Sofa',
        view_type: 'Metropolitan Horizon & Gardens',
        image_url: '/src/assets/images/room_executive_suite_1790748155531.jpg',
        amenities: JSON.stringify([
          'Executive Club Lounge Access', 'Ergonomic Walnut Workstation',
          'Complimentary High-Speed Fiber WiFi', 'Nespresso Virtuo Bar',
          'Dual Vanity Marble Bathroom', 'Complimentary Garment Pressing (2 items)'
        ])
      },
      {
        id: 'garden-villa',
        name: 'Private Garden Sanctuary Villa',
        category: 'Private Villas',
        description: 'Secluded within lush tropical courtyard gardens with fragrant jasmine and royal palms.',
        base_price: 1150,
        max_occupancy: 4,
        size_sqm: 130,
        bed_type: 'King Bed & Two Queen Divans',
        view_type: 'Private Tropical Garden & Pool',
        image_url: '/src/assets/images/room_garden_villa.jpg',
        amenities: JSON.stringify([
          'Private Heated Plunge Pool', 'Open-Air Alfresco Rain Shower',
          'Private Sun Pavilion & Daybeds', 'In-Villa Wellness Spa Setup',
          'Breakfast by Personal Chef', 'Personalized Concierge Host'
        ])
      },
      {
        id: 'classic-heritage',
        name: 'Classic Heritage King Room',
        category: 'Heritage Rooms',
        description: 'An homage to timeless neoclassical architecture infused with modern boutique comfort.',
        base_price: 320,
        max_occupancy: 2,
        size_sqm: 42,
        bed_type: 'Heritage King Bed',
        view_type: 'Courtyard & Fountain',
        image_url: '/src/assets/images/hero_luxury_hotel_1790748121852.jpg',
        amenities: JSON.stringify([
          'Courtyard Fountain View', 'Cast-iron Clawfoot Bathtub',
          'Locally Sourced Organic Teas', 'Pillow Menu Selection (6 Varieties)',
          'High-Definition 65-inch Smart Display'
        ])
      }
    ];

    for (const rt of roomTypes) {
      await conn.query(
        `INSERT IGNORE INTO room_types (id, name, category, description, base_price, max_occupancy, size_sqm, bed_type, view_type, image_url, amenities)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rt.id, rt.name, rt.category, rt.description, rt.base_price, rt.max_occupancy, rt.size_sqm, rt.bed_type, rt.view_type, rt.image_url, rt.amenities]
      );
    }

    // ── Seed Physical Rooms ──────────────────────────────────────────────────
    const rooms = [
      { id: '101', room_type_id: 'classic-heritage', floor: 1, status: 'available', notes: 'Near the courtyard fountain' },
      { id: '102', room_type_id: 'classic-heritage', floor: 1, status: 'occupied', notes: 'Late checkout requested' },
      { id: '103', room_type_id: 'classic-heritage', floor: 1, status: 'cleaning', notes: 'Housekeeping in progress' },
      { id: '201', room_type_id: 'deluxe-ocean', floor: 2, status: 'available', notes: 'Unobstructed morning sunrise view' },
      { id: '202', room_type_id: 'deluxe-ocean', floor: 2, status: 'occupied', notes: 'VIP Guest in house' },
      { id: '203', room_type_id: 'deluxe-ocean', floor: 2, status: 'reserved', notes: 'Arrival expected today' },
      { id: '301', room_type_id: 'executive-suite', floor: 3, status: 'available', notes: 'Corner suite with dual aspect windows' },
      { id: '302', room_type_id: 'executive-suite', floor: 3, status: 'occupied', notes: 'Executive board retreat' },
      { id: '303', room_type_id: 'executive-suite', floor: 3, status: 'cleaning', notes: 'Ready for inspection' },
      { id: 'GV-1', room_type_id: 'garden-villa', floor: 1, status: 'occupied', notes: 'Private plunge pool heated to 30C' },
      { id: 'GV-2', room_type_id: 'garden-villa', floor: 1, status: 'available', notes: 'Fresh floral arrangement placed' },
      { id: 'PH-801', room_type_id: 'presidential-suite', floor: 8, status: 'occupied', notes: 'Presidential Penthouse reserved for diplomat' }
    ];

    for (const r of rooms) {
      await conn.query(
        `INSERT IGNORE INTO rooms (id, room_type_id, floor, status, notes) VALUES (?, ?, ?, ?, ?)`,
        [r.id, r.room_type_id, r.floor, r.status, r.notes]
      );
    }

    // ── Seed Hotel Services ──────────────────────────────────────────────────
    const services = [
      { id: 'limo-transfer', name: 'Airport Private Limousine Transfer', category: 'Transportation', price: 140, description: 'Chauffeured Mercedes-Maybach directly to the Grand Luxe entrance.' },
      { id: 'champagne-welcome', name: 'Dom Pérignon & Artisan Caviar Welcome', category: 'Dining', price: 290, description: 'Chilled bottle of vintage Champagne paired with 30g Oscietra caviar and blinis upon arrival.' },
      { id: 'signature-spa', name: '90-min Signature Thermal Massage & Facial', category: 'Wellness', price: 220, description: 'Full body restorative treatment using organic botanical essences in our thermal sanctuary.' },
      { id: 'chef-tasting', name: '5-Course Michelin Dining Experience for Two', category: 'Dining', price: 380, description: 'Private tasting menu crafted by Executive Chef Julian Laurent with sommelier wine pairing.' },
      { id: 'sunset-yacht', name: 'Private Sunset Coastal Yacht Charter (2 hrs)', category: 'Excursion', price: 650, description: 'Exclusive 42ft luxury motor yacht with crew, antipasti, and sunset cocktails.' }
    ];

    for (const s of services) {
      await conn.query(
        `INSERT IGNORE INTO hotel_services (id, name, category, price, description) VALUES (?, ?, ?, ?, ?)`,
        [s.id, s.name, s.category, s.price, s.description]
      );
    }

    // ── Seed System Rules ────────────────────────────────────────────────────
    const defaultRules: Record<string, string> = {
      tax_rate: '0.12',
      resort_fee_per_night: '50',
      require_account_to_book: 'true',
      allow_instant_booking: 'true',
      max_booking_advance_days: '365',
      cancellation_grace_hours: '48',
      maintenance_mode: 'false',
      system_notice: 'The Grand Luxe operates under strict bespoke hospitality standards.'
    };

    for (const [key, value] of Object.entries(defaultRules)) {
      await conn.query(
        `INSERT IGNORE INTO system_rules (rule_key, rule_value) VALUES (?, ?)`,
        [key, value]
      );
    }

    // ── Seed Reservations ────────────────────────────────────────────────────
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const dMinus3 = new Date(today); dMinus3.setDate(today.getDate() - 3);
    const dMinus1 = new Date(today); dMinus1.setDate(today.getDate() - 1);
    const dPlus2 = new Date(today); dPlus2.setDate(today.getDate() + 2);
    const dPlus3 = new Date(today); dPlus3.setDate(today.getDate() + 3);
    const dPlus5 = new Date(today); dPlus5.setDate(today.getDate() + 5);

    const lozadaId = userIdMap.get('lozada') || null;
    const guestVipId = userIdMap.get('guest_vip') || null;

    const reservations = [
      {
        id: 'GL-2026-901', user_id: lozadaId,
        guest_name: 'Jeric Lozada', guest_email: 'lozada@grandluxe.com', guest_phone: '+1 (555) 019-8800',
        room_type_id: 'deluxe-ocean', assigned_room_id: '202',
        check_in_date: fmt(dMinus1), check_out_date: fmt(dPlus3),
        guests_count: 2, total_price: 2225.50,
        status: 'checked_in', payment_status: 'paid', payment_method: 'credit_card',
        special_requests: 'High floor preferred, extra hypoallergenic pillows.',
        add_ons: JSON.stringify([{ id: 'champagne-welcome', name: 'Dom Pérignon & Artisan Caviar Welcome', price: 290, category: 'Dining' }])
      },
      {
        id: 'GL-2026-902', user_id: guestVipId,
        guest_name: 'Ambassador Elena Rostova', guest_email: 'elena.rostova@diplomat.eu', guest_phone: '+33 6 12 34 56 78',
        room_type_id: 'presidential-suite', assigned_room_id: 'PH-801',
        check_in_date: fmt(dMinus3), check_out_date: fmt(dPlus2),
        guests_count: 3, total_price: 9390.00,
        status: 'checked_in', payment_status: 'paid', payment_method: 'wire_transfer',
        special_requests: 'Private security protocol coordination. Sparkling San Pellegrino only.',
        add_ons: JSON.stringify([{ id: 'limo-transfer', name: 'Airport Private Limousine Transfer', price: 140, category: 'Transportation' }])
      },
      {
        id: 'GL-2026-903', user_id: null,
        guest_name: 'Marcus & Sophia Vance', guest_email: 'marcus.vance@techcorp.io', guest_phone: '+1 (555) 345-9871',
        room_type_id: 'garden-villa', assigned_room_id: 'GV-1',
        check_in_date: fmt(dMinus1), check_out_date: fmt(dPlus2),
        guests_count: 2, total_price: 3670.00,
        status: 'checked_in', payment_status: 'paid', payment_method: 'credit_card',
        special_requests: 'Honeymoon anniversary setup with rose petals.',
        add_ons: JSON.stringify([{ id: 'signature-spa', name: '90-min Signature Thermal Massage & Facial', price: 220, category: 'Wellness' }])
      },
      {
        id: 'GL-2026-904', user_id: null,
        guest_name: 'David K. Chen', guest_email: 'david.chen@venture.com', guest_phone: '+1 (555) 890-1234',
        room_type_id: 'deluxe-ocean', assigned_room_id: '203',
        check_in_date: fmt(today), check_out_date: fmt(dPlus5),
        guests_count: 1, total_price: 2520.00,
        status: 'confirmed', payment_status: 'paid', payment_method: 'credit_card',
        special_requests: 'Late evening arrival around 20:00. Quiet room away from elevator.',
        add_ons: JSON.stringify([])
      }
    ];

    for (const r of reservations) {
      await conn.query(
        `INSERT IGNORE INTO reservations
         (id, user_id, guest_name, guest_email, guest_phone, room_type_id, assigned_room_id,
          check_in_date, check_out_date, guests_count, total_price, status, payment_status,
          payment_method, special_requests, add_ons)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.user_id, r.guest_name, r.guest_email, r.guest_phone, r.room_type_id, r.assigned_room_id,
         r.check_in_date, r.check_out_date, r.guests_count, r.total_price, r.status, r.payment_status,
         r.payment_method, r.special_requests, r.add_ons]
      );
    }

    // ── Seed Folio Items ─────────────────────────────────────────────────────
    const folioItems = [
      { reservation_id: 'GL-2026-901', description: 'Deluxe Ocean Vista Suite (4 nights @ $450/night)', category: 'room', amount: 1800.00 },
      { reservation_id: 'GL-2026-901', description: 'Dom Pérignon & Artisan Caviar Welcome', category: 'dining', amount: 290.00 },
      { reservation_id: 'GL-2026-901', description: 'Le Belvédère Fine Dining - Dinner for Two', category: 'dining', amount: 245.50 },
      { reservation_id: 'GL-2026-901', description: 'Municipal Hospitality Tax & Resort Levy (12%)', category: 'tax', amount: 250.86 },
      { reservation_id: 'GL-2026-902', description: 'Presidential Penthouse Suite (5 nights @ $1850/night)', category: 'room', amount: 9250.00 },
      { reservation_id: 'GL-2026-902', description: 'Airport Private Limousine Transfer', category: 'transport', amount: 140.00 }
    ];

    for (const f of folioItems) {
      await conn.query(
        `INSERT INTO folio_items (reservation_id, description, category, amount) VALUES (?, ?, ?, ?)`,
        [f.reservation_id, f.description, f.category, f.amount]
      );
    }

    // ── Seed Audit Log ───────────────────────────────────────────────────────
    await conn.query(
      `INSERT IGNORE INTO audit_logs (id, actor_id, actor_name, action, target_user_id, target_username, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit-${Date.now()}-init`, 1, 'System Kernel', 'SYSTEM_BOOTSTRAP', 1, 'lozada',
        'Super Administrator account initialized with username: lozada'
      ]
    );

    console.log('[MySQL] Database seeded successfully with Super Admin lozada.');
  } finally {
    conn.release();
  }
}

// ─── Ensure Super Admin Always Exists ─────────────────────────────────────────

async function ensureSuperAdmin(conn: mysql.PoolConnection): Promise<void> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id FROM users WHERE username = 'lozada'`
  );
  if (rows.length === 0) {
    console.log('[MySQL] Provisioning Super Administrator account (lozada)...');
    const hash = hashPassword('lozada123');
    await conn.query(
      `INSERT INTO users (username, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
      ['lozada', 'Jeric Lozada (Super Administrator)', 'lozada@grandluxe.com', hash, '+1 (555) 019-8800']
    );
    const [newRows] = await conn.query<mysql.RowDataPacket[]>(`SELECT id FROM users WHERE username = 'lozada'`);
    if (newRows[0]) {
      const userId = newRows[0].id;
      const [roleRow] = await conn.query<mysql.RowDataPacket[]>(`SELECT id FROM roles WHERE name = 'superadmin'`);
      if (roleRow[0]) {
        await conn.query(
          `INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`,
          [roleRow[0].id, userId]
        );
      }
    }
  } else {
    // Update password to ensure it's always correct
    const hash = hashPassword('lozada123');
    await conn.query(`UPDATE users SET password_hash = ? WHERE username = 'lozada'`, [hash]);
  }
}

// ─── initDb: Entry point ─────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  // Test connection
  let conn: mysql.PoolConnection | null = null;
  try {
    conn = await getPool().getConnection();
    console.log(`[MySQL] Connected to ${process.env.DB_DATABASE || 'hotel'} on ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3307'}`);
  } catch (err: any) {
    console.error('[MySQL] ❌ Connection failed:', err.message);
    console.error('       Make sure MySQL is running on port', process.env.DB_PORT || '3307');
    console.error('       DB:', process.env.DB_DATABASE, '| User:', process.env.DB_USERNAME);
    throw err;
  } finally {
    if (conn) conn.release();
  }

  await runMigrations();
  await seedInitialData();
}

// ─── Helper: get user permissions from Spatie tables ─────────────────────────

async function getUserPermissions(userId: number): Promise<string[]> {
  const pool = getPool();
  // Permissions from role + direct model permissions
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT DISTINCT p.name FROM permissions p
     LEFT JOIN role_has_permissions rhp ON rhp.permission_id = p.id
     LEFT JOIN model_has_roles mhr ON mhr.role_id = rhp.role_id AND mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User'
     LEFT JOIN model_has_permissions mhp ON mhp.permission_id = p.id AND mhp.model_id = ? AND mhp.model_type = 'App\\\\Models\\\\User'
     WHERE mhr.model_id IS NOT NULL OR mhp.model_id IS NOT NULL`,
    [userId, userId]
  );
  return rows.map((r: any) => r.name);
}

async function getUserRole(userId: number): Promise<string> {
  const pool = getPool();
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT r.name FROM roles r
     JOIN model_has_roles mhr ON mhr.role_id = r.id
     WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User'
     LIMIT 1`,
    [userId]
  );
  return rows[0]?.name || 'guest';
}

// ─── DB API (same interface as the original db object) ────────────────────────

export const db = {
  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers: async (): Promise<UserRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM users ORDER BY id ASC`);
    const users: UserRecord[] = [];
    for (const row of rows) {
      const perms = await getUserPermissions(row.id);
      const role = await getUserRole(row.id) as UserRecord['role'];
      users.push({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        password_hash: row.password_hash,
        role,
        permissions: perms,
        phone: row.phone || '',
        created_at: row.created_at?.toISOString?.() || row.created_at,
        updated_at: row.updated_at?.toISOString?.() || row.updated_at,
        last_login: row.last_login?.toISOString?.() || row.last_login
      });
    }
    return users;
  },

  getUserById: async (id: number): Promise<UserRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!rows[0]) return undefined;
    const row = rows[0];
    const perms = await getUserPermissions(row.id);
    const role = await getUserRole(row.id) as UserRecord['role'];
    return {
      id: row.id, username: row.username, name: row.name, email: row.email,
      password_hash: row.password_hash, role, permissions: perms,
      phone: row.phone || '',
      created_at: row.created_at?.toISOString?.() || row.created_at,
      updated_at: row.updated_at?.toISOString?.() || row.updated_at,
      last_login: row.last_login?.toISOString?.() || row.last_login
    };
  },

  getUserByEmail: async (email: string): Promise<UserRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
    if (!rows[0]) return undefined;
    const row = rows[0];
    const perms = await getUserPermissions(row.id);
    const role = await getUserRole(row.id) as UserRecord['role'];
    return { id: row.id, username: row.username, name: row.name, email: row.email, password_hash: row.password_hash, role, permissions: perms, phone: row.phone || '', created_at: row.created_at?.toISOString?.() || row.created_at };
  },

  getUserByUsername: async (username: string): Promise<UserRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`, [username]);
    if (!rows[0]) return undefined;
    const row = rows[0];
    const perms = await getUserPermissions(row.id);
    const role = await getUserRole(row.id) as UserRecord['role'];
    return { id: row.id, username: row.username, name: row.name, email: row.email, password_hash: row.password_hash, role, permissions: perms, phone: row.phone || '', created_at: row.created_at?.toISOString?.() || row.created_at };
  },

  getUserByUsernameOrEmail: async (identifier: string): Promise<UserRecord | undefined> => {
    const pool = getPool();
    const term = identifier.trim().toLowerCase();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1`,
      [term, term]
    );
    if (!rows[0]) return undefined;
    const row = rows[0];
    const perms = await getUserPermissions(row.id);
    const role = await getUserRole(row.id) as UserRecord['role'];
    return { id: row.id, username: row.username, name: row.name, email: row.email, password_hash: row.password_hash, role, permissions: perms, phone: row.phone || '', created_at: row.created_at?.toISOString?.() || row.created_at, last_login: row.last_login?.toISOString?.() || row.last_login };
  },

  createUser: async (user: Omit<UserRecord, 'id' | 'created_at'>): Promise<UserRecord> => {
    const pool = getPool();
    const [result] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO users (username, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
      [user.username, user.name, user.email, user.password_hash, user.phone || '']
    );
    const userId = result.insertId;

    // Assign role in Spatie tables
    const roleName = user.role || 'guest';
    const [roleRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT id FROM roles WHERE name = ? AND guard_name = 'web'`, [roleName]);
    if (roleRows[0]) {
      await pool.query(`INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [roleRows[0].id, userId]);
    }

    // Assign permissions in Spatie tables
    const userPerms = user.permissions || ROLE_DEFAULT_PERMISSIONS[roleName] || ['book_suites'];
    for (const perm of userPerms) {
      const [permRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT id FROM permissions WHERE name = ?`, [perm]);
      if (permRows[0]) {
        await pool.query(`INSERT IGNORE INTO model_has_permissions (permission_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [permRows[0].id, userId]);
      }
    }

    // Add audit log
    await db.addAuditLog({
      actor_id: userId, actor_name: user.name, action: 'USER_REGISTERED',
      target_user_id: userId, target_username: user.username,
      details: `New account created as ${roleName} (${user.username})`
    });

    const record = await db.getUserById(userId);
    return record!;
  },

  updateUserPositionAndPermissions: async (
    id: number,
    role: UserRecord['role'],
    permissions: string[],
    actor?: { id: number; name: string }
  ): Promise<UserRecord | null> => {
    const pool = getPool();
    const existing = await db.getUserById(id);
    if (!existing) return null;
    const oldRole = existing.role;

    // Remove old role assignment
    await pool.query(`DELETE FROM model_has_roles WHERE model_id = ? AND model_type = 'App\\\\Models\\\\User'`, [id]);
    // Assign new role
    const [roleRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT id FROM roles WHERE name = ? AND guard_name = 'web'`, [role]);
    if (roleRows[0]) {
      await pool.query(`INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [roleRows[0].id, id]);
    }

    // Remove old direct permissions
    await pool.query(`DELETE FROM model_has_permissions WHERE model_id = ? AND model_type = 'App\\\\Models\\\\User'`, [id]);
    // Assign new permissions
    for (const perm of permissions) {
      const [permRows] = await pool.query<mysql.RowDataPacket[]>(`SELECT id FROM permissions WHERE name = ?`, [perm]);
      if (permRows[0]) {
        await pool.query(`INSERT IGNORE INTO model_has_permissions (permission_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [permRows[0].id, id]);
      }
    }

    await pool.query(`UPDATE users SET updated_at = NOW() WHERE id = ?`, [id]);

    if (actor) {
      await db.addAuditLog({
        actor_id: actor.id, actor_name: actor.name, action: 'POSITION_ASSIGNED',
        target_user_id: id, target_username: existing.username,
        details: `Position changed from ${oldRole} to ${role} with ${permissions.length} granular permissions`
      });
    }

    return (await db.getUserById(id)) ?? null;
  },

  updateUserRole: async (id: number, role: UserRecord['role']): Promise<void> => {
    const perms = ROLE_DEFAULT_PERMISSIONS[role] || ['book_suites'];
    await db.updateUserPositionAndPermissions(id, role, perms);
  },

  recordUserLogin: async (id: number): Promise<void> => {
    const pool = getPool();
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [id]);
  },

  // ── System Rules ────────────────────────────────────────────────────────────
  getSystemRules: async (): Promise<SystemRulesRecord> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT rule_key, rule_value FROM system_rules`);
    const rulesMap: Record<string, string> = {};
    for (const row of rows) rulesMap[row.rule_key] = row.rule_value;
    return {
      tax_rate: parseFloat(rulesMap.tax_rate || '0.12'),
      resort_fee_per_night: parseFloat(rulesMap.resort_fee_per_night || '50'),
      require_account_to_book: rulesMap.require_account_to_book === 'true',
      allow_instant_booking: rulesMap.allow_instant_booking !== 'false',
      max_booking_advance_days: parseInt(rulesMap.max_booking_advance_days || '365'),
      cancellation_grace_hours: parseInt(rulesMap.cancellation_grace_hours || '48'),
      maintenance_mode: rulesMap.maintenance_mode === 'true',
      system_notice: rulesMap.system_notice || ''
    };
  },

  updateSystemRules: async (rules: Partial<SystemRulesRecord>, actor?: { id: number; name: string }): Promise<SystemRulesRecord> => {
    const pool = getPool();
    for (const [key, value] of Object.entries(rules)) {
      await pool.query(
        `INSERT INTO system_rules (rule_key, rule_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE rule_value = ?`,
        [key, String(value), String(value)]
      );
    }
    if (actor) {
      await db.addAuditLog({
        actor_id: actor.id, actor_name: actor.name, action: 'SYSTEM_RULES_UPDATED',
        details: `Updated hotel governance rules: ${Object.keys(rules).join(', ')}`
      });
    }
    return db.getSystemRules();
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  getAuditLogs: async (): Promise<AuditLogRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`
    );
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp?.toISOString?.() || r.timestamp,
      actor_id: r.actor_id,
      actor_name: r.actor_name,
      action: r.action,
      target_user_id: r.target_user_id,
      target_username: r.target_username,
      details: r.details
    }));
  },

  addAuditLog: async (log: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<void> => {
    const pool = getPool();
    const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_user_id, target_username, details) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, log.actor_id, log.actor_name, log.action, log.target_user_id || null, log.target_username || null, log.details]
    );
  },

  // ── Room Types ──────────────────────────────────────────────────────────────
  getRoomTypes: async (): Promise<RoomTypeRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM room_types ORDER BY base_price ASC`);
    return rows.map(r => ({
      ...r,
      base_price: parseFloat(r.base_price) || 0,
      size_sqm: parseFloat(r.size_sqm) || 0,
      max_occupancy: parseInt(r.max_occupancy, 10) || 2,
      amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : (r.amenities || [])
    })) as RoomTypeRecord[];
  },

  getRoomTypeById: async (id: string): Promise<RoomTypeRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM room_types WHERE id = ?`, [id]);
    if (!rows[0]) return undefined;
    return {
      ...rows[0],
      base_price: parseFloat(rows[0].base_price) || 0,
      size_sqm: parseFloat(rows[0].size_sqm) || 0,
      max_occupancy: parseInt(rows[0].max_occupancy, 10) || 2,
      amenities: typeof rows[0].amenities === 'string' ? JSON.parse(rows[0].amenities) : (rows[0].amenities || [])
    } as RoomTypeRecord;
  },

  updateRoomType: async (id: string, updates: Partial<RoomTypeRecord>): Promise<void> => {
    const pool = getPool();
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.base_price !== undefined) { fields.push('base_price = ?'); values.push(updates.base_price); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.max_occupancy !== undefined) { fields.push('max_occupancy = ?'); values.push(updates.max_occupancy); }
    if (updates.bed_type !== undefined) { fields.push('bed_type = ?'); values.push(updates.bed_type); }
    if (updates.amenities !== undefined) { fields.push('amenities = ?'); values.push(JSON.stringify(updates.amenities)); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE room_types SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  // ── Physical Rooms ──────────────────────────────────────────────────────────
  getRooms: async (): Promise<RoomRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM rooms ORDER BY floor ASC, id ASC`);
    return rows as RoomRecord[];
  },

  getRoomById: async (id: string): Promise<RoomRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM rooms WHERE id = ?`, [id]);
    return rows[0] as RoomRecord | undefined;
  },

  updateRoomStatus: async (id: string, status: RoomRecord['status'], notes?: string): Promise<void> => {
    const pool = getPool();
    if (notes !== undefined) {
      await pool.query(`UPDATE rooms SET status = ?, notes = ? WHERE id = ?`, [status, notes, id]);
    } else {
      await pool.query(`UPDATE rooms SET status = ? WHERE id = ?`, [status, id]);
    }
  },

  createRoom: async (room: RoomRecord): Promise<void> => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO rooms (id, room_type_id, floor, status, notes) VALUES (?, ?, ?, ?, ?)`,
      [room.id, room.room_type_id, room.floor, room.status, room.notes]
    );
  },

  // ── Reservations ────────────────────────────────────────────────────────────
  getReservations: async (): Promise<ReservationRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM reservations ORDER BY created_at DESC`);
    return rows.map(r => ({
      ...r,
      total_price: parseFloat(r.total_price) || 0,
      guests_count: parseInt(r.guests_count, 10) || 1,
      add_ons: typeof r.add_ons === 'string' ? JSON.parse(r.add_ons) : (r.add_ons || []),
      check_in_date: r.check_in_date instanceof Date ? r.check_in_date.toISOString().split('T')[0] : r.check_in_date,
      check_out_date: r.check_out_date instanceof Date ? r.check_out_date.toISOString().split('T')[0] : r.check_out_date,
      created_at: r.created_at?.toISOString?.() || r.created_at
    })) as ReservationRecord[];
  },

  getReservationById: async (id: string): Promise<ReservationRecord | undefined> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM reservations WHERE id = ?`, [id]);
    if (!rows[0]) return undefined;
    const r = rows[0];
    return {
      ...r,
      total_price: parseFloat(r.total_price) || 0,
      guests_count: parseInt(r.guests_count, 10) || 1,
      add_ons: typeof r.add_ons === 'string' ? JSON.parse(r.add_ons) : (r.add_ons || []),
      check_in_date: r.check_in_date instanceof Date ? r.check_in_date.toISOString().split('T')[0] : r.check_in_date,
      check_out_date: r.check_out_date instanceof Date ? r.check_out_date.toISOString().split('T')[0] : r.check_out_date,
      created_at: r.created_at?.toISOString?.() || r.created_at
    } as ReservationRecord;
  },

  createReservation: async (res: ReservationRecord): Promise<void> => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO reservations (id, user_id, guest_name, guest_email, guest_phone, room_type_id, assigned_room_id, check_in_date, check_out_date, guests_count, total_price, status, payment_status, payment_method, special_requests, add_ons)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [res.id, res.user_id, res.guest_name, res.guest_email, res.guest_phone, res.room_type_id, res.assigned_room_id, res.check_in_date, res.check_out_date, res.guests_count, res.total_price, res.status, res.payment_status, res.payment_method, res.special_requests, JSON.stringify(res.add_ons)]
    );
  },

  updateReservation: async (id: string, updates: Partial<ReservationRecord>): Promise<void> => {
    const pool = getPool();
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['status', 'payment_status', 'assigned_room_id', 'special_requests', 'add_ons'];
    for (const key of allowed) {
      if ((updates as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'add_ons' ? JSON.stringify((updates as any)[key]) : (updates as any)[key]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  // ── Folio Items ─────────────────────────────────────────────────────────────
  getFolioItems: async (reservationId: string): Promise<FolioItemRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM folio_items WHERE reservation_id = ? ORDER BY id ASC`, [reservationId]
    );
    return rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount) || 0,
      created_at: r.created_at?.toISOString?.() || r.created_at
    })) as FolioItemRecord[];
  },

  addFolioItem: async (item: Omit<FolioItemRecord, 'id' | 'created_at'>): Promise<FolioItemRecord> => {
    const pool = getPool();
    const [result] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO folio_items (reservation_id, description, category, amount) VALUES (?, ?, ?, ?)`,
      [item.reservation_id, item.description, item.category, item.amount]
    );
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM folio_items WHERE id = ?`, [result.insertId]);
    return {
      ...rows[0],
      amount: parseFloat(rows[0].amount) || 0,
      created_at: rows[0].created_at?.toISOString?.() || rows[0].created_at
    } as FolioItemRecord;
  },

  // ── Hotel Services ──────────────────────────────────────────────────────────
  getServices: async (): Promise<HotelServiceRecord[]> => {
    const pool = getPool();
    const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM hotel_services ORDER BY category, name`);
    return rows.map(r => ({
      ...r,
      price: parseFloat(r.price) || 0
    })) as HotelServiceRecord[];
  }
};
