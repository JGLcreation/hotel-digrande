import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.resolve(dataDir, 'hotel_data.json');

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

export interface DatabaseSchema {
  users: UserRecord[];
  room_types: RoomTypeRecord[];
  rooms: RoomRecord[];
  reservations: ReservationRecord[];
  folio_items: FolioItemRecord[];
  hotel_services: HotelServiceRecord[];
  system_rules: SystemRulesRecord;
  audit_logs: AuditLogRecord[];
}

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

let dbData: DatabaseSchema = {
  users: [],
  room_types: [],
  rooms: [],
  reservations: [],
  folio_items: [],
  hotel_services: [],
  system_rules: {
    tax_rate: 0.12,
    resort_fee_per_night: 50,
    require_account_to_book: true,
    allow_instant_booking: true,
    max_booking_advance_days: 365,
    cancellation_grace_hours: 48,
    maintenance_mode: false,
    system_notice: 'The Grand Luxe operates under strict bespoke hospitality standards.'
  },
  audit_logs: []
};

function saveDb() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

export async function initDb() {
  let loadedFromDisk = false;
  if (fs.existsSync(dbFile)) {
    try {
      const content = fs.readFileSync(dbFile, 'utf-8');
      dbData = JSON.parse(content);
      loadedFromDisk = true;
      console.log('Loaded hotel database from disk.');
    } catch (err) {
      console.warn('Error reading existing db, re-seeding...');
    }
  }

  // Ensure system_rules and audit_logs exist
  if (!dbData.system_rules) {
    dbData.system_rules = {
      tax_rate: 0.12,
      resort_fee_per_night: 50,
      require_account_to_book: true,
      allow_instant_booking: true,
      max_booking_advance_days: 365,
      cancellation_grace_hours: 48,
      maintenance_mode: false,
      system_notice: 'The Grand Luxe operates under strict bespoke hospitality standards.'
    };
  }
  if (!dbData.audit_logs) {
    dbData.audit_logs = [];
  }

  // Check and guarantee Super Administrator Lozada exists
  const superAdminExists = dbData.users?.find(
    u => u.username?.toLowerCase() === 'lozada' || u.role === 'superadmin'
  );

  if (!superAdminExists) {
    console.log('Provisioning Super Administrator account (lozada)...');
    const lozadaUser: UserRecord = {
      id: dbData.users?.length > 0 ? Math.max(...dbData.users.map(u => u.id)) + 1 : 1,
      username: 'lozada',
      name: 'Jeric Lozada (Super Administrator)',
      email: 'lozada@grandluxe.com',
      password_hash: hashPassword('lozada123'),
      role: 'superadmin',
      permissions: [...ALL_PERMISSIONS],
      phone: '+1 (555) 019-8800',
      created_at: new Date().toISOString()
    };
    if (!dbData.users) dbData.users = [];
    dbData.users.unshift(lozadaUser);

    dbData.audit_logs.push({
      id: `audit-${Date.now()}-init`,
      timestamp: new Date().toISOString(),
      actor_id: 1,
      actor_name: 'System Kernel',
      action: 'SYSTEM_BOOTSTRAP',
      target_user_id: lozadaUser.id,
      target_username: 'lozada',
      details: 'Super Administrator account initialized with username: lozada'
    });
  } else {
    // Ensure Super Admin Lozada has proper role and full permissions
    superAdminExists.username = 'lozada';
    superAdminExists.role = 'superadmin';
    superAdminExists.permissions = [...ALL_PERMISSIONS];
    // Guarantee password hash matches lozada123
    superAdminExists.password_hash = hashPassword('lozada123');
  }

  // Normalize existing users with usernames & permissions if missing
  dbData.users?.forEach(u => {
    if (!u.username) {
      u.username = u.email.split('@')[0].toLowerCase();
    }
    if (!u.permissions || u.permissions.length === 0) {
      u.permissions = ROLE_DEFAULT_PERMISSIONS[u.role] || ['book_suites'];
    }
  });

  if (loadedFromDisk && dbData.rooms && dbData.rooms.length > 0) {
    saveDb();
    return;
  }

  console.log('Seeding initial luxury hotel database...');

  // 1. Initial Users Seed
  dbData.users = [
    {
      id: 1,
      username: 'lozada',
      name: 'Jeric Lozada (Super Administrator)',
      email: 'lozada@grandluxe.com',
      password_hash: hashPassword('lozada123'),
      role: 'superadmin',
      permissions: [...ALL_PERMISSIONS],
      phone: '+1 (555) 019-8800',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'admin',
      name: 'Lord Arthur Sterling (GM)',
      email: 'admin@grandluxe.com',
      password_hash: hashPassword('admin123'),
      role: 'admin',
      permissions: [...ROLE_DEFAULT_PERMISSIONS.admin],
      phone: '+1 (555) 019-2831',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'clara',
      name: 'Clara Vance (Front Desk Mgr)',
      email: 'clara@grandluxe.com',
      password_hash: hashPassword('staff123'),
      role: 'staff',
      permissions: [...ROLE_DEFAULT_PERMISSIONS.staff],
      phone: '+1 (555) 019-2832',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      username: 'guest_vip',
      name: 'Countess Camille De Monet (VIP Guest)',
      email: 'camille@monet.eu',
      password_hash: hashPassword('guest123'),
      role: 'guest',
      permissions: [...ROLE_DEFAULT_PERMISSIONS.guest],
      phone: '+1 (555) 019-4411',
      created_at: new Date().toISOString()
    }
  ];

  // 2. Room Types with Generated Real Images
  dbData.room_types = [
    {
      id: 'presidential-suite',
      name: 'Presidential Penthouse Suite',
      category: 'Signature Suite',
      description: 'Occupying the entire top level with breathtaking 360-degree ocean and skyline panoramas. Features private terrace with heated jacuzzi, master king bedroom with Italian Rivolta Carmignani linens, travertine fireplace, dedicated 24-hour butler service, and private elevator access.',
      base_price: 1850,
      max_occupancy: 4,
      size_sqm: 185,
      bed_type: 'King Canopy Bed + Daybed',
      view_type: 'Panoramic Ocean & Skyline',
      image_url: '/src/assets/images/room_presidential_suite_1790748133665.jpg',
      amenities: [
        'Private Butler Service 24/7',
        'Private Jacuzzi Terrace',
        'Complimentary Airport Limousine',
        'Full Marble Bath with Soaking Tub',
        'Bespoke Bar with Curated Cellar',
        'Bang & Olufsen Acoustic System',
        'Dyson Supersonic Care Suite',
        'Priority Michelin Dining Seating'
      ]
    },
    {
      id: 'deluxe-ocean',
      name: 'Deluxe Ocean Vista Suite',
      category: 'Deluxe Rooms',
      description: 'Bathed in soft morning coastal light with expansive floor-to-ceiling glass doors opening onto a private teak terrace overlooking the azure bay. Appointed with custom linen upholstery, natural oak accents, and rainfall hydro-shower.',
      base_price: 450,
      max_occupancy: 2,
      size_sqm: 54,
      bed_type: 'Custom King Bed',
      view_type: 'Direct Oceanfront',
      image_url: '/src/assets/images/room_deluxe_ocean_1790748144413.jpg',
      amenities: [
        'Private Oceanfront Balcony',
        'Artisan Espresso Bar',
        'Walk-in Rainfall Shower',
        'Organic Botanical Toiletries',
        'Evening Turn-Down Aromatherapy',
        'Smart Environmental Climate Controls'
      ]
    },
    {
      id: 'executive-suite',
      name: 'Executive Grand Suite',
      category: 'Executive Suites',
      description: 'Tailored for discerning business travelers and executive getaways. Features a secluded conference lounge, ergonomic walnut workstation, walk-in dressing wardrobe, and exclusive keycard access to the Private Executive Club Lounge on the 14th floor.',
      base_price: 680,
      max_occupancy: 3,
      size_sqm: 78,
      bed_type: 'King Bed & Executive Sofa',
      view_type: 'Metropolitan Horizon & Gardens',
      image_url: '/src/assets/images/room_executive_suite_1790748155531.jpg',
      amenities: [
        'Executive Club Lounge Access',
        'Ergonomic Walnut Workstation',
        'Complimentary High-Speed Fiber WiFi',
        'Nespresso Virtuo Bar',
        'Dual Vanity Marble Bathroom',
        'Complimentary Garment Pressing (2 items)'
      ]
    },
    {
      id: 'garden-villa',
      name: 'Private Garden Sanctuary Villa',
      category: 'Private Villas',
      description: 'Secluded within lush tropical courtyard gardens with fragrant jasmine and royal palms. Enjoy a private heated plunge pool, open-air alfresco rainfall shower, shaded pavilion daybed, and private in-villa chef dinner service on request.',
      base_price: 1150,
      max_occupancy: 4,
      size_sqm: 130,
      bed_type: 'King Bed & Two Queen Divans',
      view_type: 'Private Tropical Garden & Pool',
      image_url: '/src/assets/images/hotel_spa_wellness_1790748168996.jpg',
      amenities: [
        'Private Heated Plunge Pool',
        'Open-Air Alfresco Rain Shower',
        'Private Sun Pavilion & Daybeds',
        'In-Villa Wellness Spa Setup',
        'Breakfast by Personal Chef',
        'Personalized Concierge Host'
      ]
    },
    {
      id: 'classic-heritage',
      name: 'Classic Heritage King Room',
      category: 'Heritage Rooms',
      description: 'An homage to timeless neoclassical architecture infused with modern boutique comfort. Features high coffered ceilings, plush velvet armchair, hand-knotted Persian wool rugs, and tranquil garden courtyard views.',
      base_price: 320,
      max_occupancy: 2,
      size_sqm: 42,
      bed_type: 'Heritage King Bed',
      view_type: 'Courtyard & Fountain',
      image_url: '/src/assets/images/hero_luxury_hotel_1790748121852.jpg',
      amenities: [
        'Courtyard Fountain View',
        'Cast-iron Clawfoot Bathtub',
        'Locally Sourced Organic Teas',
        'Pillow Menu Selection (6 Varieties)',
        'High-Definition 65-inch Smart Display'
      ]
    }
  ];

  // 3. Physical Rooms
  dbData.rooms = [
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

  // 4. Hotel Add-on Services
  dbData.hotel_services = [
    { id: 'limo-transfer', name: 'Airport Private Limousine Transfer', category: 'Transportation', price: 140, description: 'Chauffeured Mercedes-Maybach directly to the Grand Luxe entrance.' },
    { id: 'champagne-welcome', name: 'Dom Pérignon & Artisan Caviar Welcome', category: 'Dining', price: 290, description: 'Chilled bottle of vintage Champagne paired with 30g Oscietra caviar and blinis upon arrival.' },
    { id: 'signature-spa', name: '90-min Signature Thermal Massage & Facial', category: 'Wellness', price: 220, description: 'Full body restorative treatment using organic botanical essences in our thermal sanctuary.' },
    { id: 'chef-tasting', name: '5-Course Michelin Dining Experience for Two', category: 'Dining', price: 380, description: 'Private tasting menu crafted by Executive Chef Julian Laurent with sommelier wine pairing.' },
    { id: 'sunset-yacht', name: 'Private Sunset Coastal Yacht Charter (2 hrs)', category: 'Excursion', price: 650, description: 'Exclusive 42ft luxury motor yacht with crew, antipasti, and sunset cocktails.' }
  ];

  // 5. Initial Active Bookings
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const dMinus3 = new Date(today); dMinus3.setDate(today.getDate() - 3);
  const dMinus1 = new Date(today); dMinus1.setDate(today.getDate() - 1);
  const dPlus2 = new Date(today); dPlus2.setDate(today.getDate() + 2);
  const dPlus3 = new Date(today); dPlus3.setDate(today.getDate() + 3);
  const dPlus5 = new Date(today); dPlus5.setDate(today.getDate() + 5);

  dbData.reservations = [
    {
      id: 'GL-2026-901',
      user_id: 1,
      guest_name: 'Jeric Lozada',
      guest_email: 'lozada@grandluxe.com',
      guest_phone: '+1 (555) 019-8800',
      room_type_id: 'deluxe-ocean',
      assigned_room_id: '202',
      check_in_date: fmt(dMinus1),
      check_out_date: fmt(dPlus3),
      guests_count: 2,
      total_price: 2225.50,
      status: 'checked_in',
      payment_status: 'paid',
      payment_method: 'credit_card',
      special_requests: 'High floor preferred, extra hypoallergenic pillows and feather duvet.',
      add_ons: [{ id: 'champagne-welcome', name: 'Dom Pérignon & Artisan Caviar Welcome', price: 290, category: 'Dining', description: '' }],
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'GL-2026-902',
      user_id: 4,
      guest_name: 'Ambassador Elena Rostova',
      guest_email: 'elena.rostova@diplomat.eu',
      guest_phone: '+33 6 12 34 56 78',
      room_type_id: 'presidential-suite',
      assigned_room_id: 'PH-801',
      check_in_date: fmt(dMinus3),
      check_out_date: fmt(dPlus2),
      guests_count: 3,
      total_price: 9390.00,
      status: 'checked_in',
      payment_status: 'paid',
      payment_method: 'wire_transfer',
      special_requests: 'Private security protocol coordination. Sparkling San Pellegrino only.',
      add_ons: [{ id: 'limo-transfer', name: 'Airport Private Limousine Transfer', price: 140, category: 'Transportation', description: '' }],
      created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
      id: 'GL-2026-903',
      user_id: null,
      guest_name: 'Marcus & Sophia Vance',
      guest_email: 'marcus.vance@techcorp.io',
      guest_phone: '+1 (555) 345-9871',
      room_type_id: 'garden-villa',
      assigned_room_id: 'GV-1',
      check_in_date: fmt(dMinus1),
      check_out_date: fmt(dPlus2),
      guests_count: 2,
      total_price: 3670.00,
      status: 'checked_in',
      payment_status: 'paid',
      payment_method: 'credit_card',
      special_requests: 'Honeymoon anniversary setup with rose petals and organic scented candles.',
      add_ons: [{ id: 'signature-spa', name: '90-min Signature Thermal Massage & Facial', price: 220, category: 'Wellness', description: '' }],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'GL-2026-904',
      user_id: null,
      guest_name: 'David K. Chen',
      guest_email: 'david.chen@venture.com',
      guest_phone: '+1 (555) 890-1234',
      room_type_id: 'deluxe-ocean',
      assigned_room_id: '203',
      check_in_date: fmt(today),
      check_out_date: fmt(dPlus5),
      guests_count: 1,
      total_price: 2520.00,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'credit_card',
      special_requests: 'Late evening arrival around 20:00. Quiet room away from elevator.',
      add_ons: [],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  // 6. Initial Folio line items
  dbData.folio_items = [
    { id: 1, reservation_id: 'GL-2026-901', description: 'Deluxe Ocean Vista Suite (4 nights @ $450/night)', category: 'room', amount: 1800.00, created_at: new Date().toISOString() },
    { id: 2, reservation_id: 'GL-2026-901', description: 'Dom Pérignon & Artisan Caviar Welcome', category: 'dining', amount: 290.00, created_at: new Date().toISOString() },
    { id: 3, reservation_id: 'GL-2026-901', description: 'Le Belvédère Fine Dining - Dinner for Two', category: 'dining', amount: 245.50, created_at: new Date().toISOString() },
    { id: 4, reservation_id: 'GL-2026-901', description: 'Municipal Hospitality Tax & Resort Levy (12%)', category: 'tax', amount: 250.86, created_at: new Date().toISOString() },
    { id: 5, reservation_id: 'GL-2026-902', description: 'Presidential Penthouse Suite (5 nights @ $1850/night)', category: 'room', amount: 9250.00, created_at: new Date().toISOString() },
    { id: 6, reservation_id: 'GL-2026-902', description: 'Airport Private Limousine Transfer', category: 'transport', amount: 140.00, created_at: new Date().toISOString() }
  ];

  saveDb();
  console.log('Hotel database initialized and saved with Super Admin lozada.');
}

// Database helper methods
export const db = {
  getUsers: () => dbData.users || [],
  getUserById: (id: number) => (dbData.users || []).find(u => u.id === id),
  getUserByEmail: (email: string) => (dbData.users || []).find(u => u.email.toLowerCase() === email.toLowerCase()),
  getUserByUsername: (username: string) => (dbData.users || []).find(u => u.username?.toLowerCase() === username.toLowerCase()),
  getUserByUsernameOrEmail: (identifier: string) => {
    const term = identifier.trim().toLowerCase();
    return (dbData.users || []).find(
      u => u.email.toLowerCase() === term || (u.username && u.username.toLowerCase() === term)
    );
  },
  createUser: (user: Omit<UserRecord, 'id' | 'created_at'>) => {
    const id = (dbData.users || []).length > 0 ? Math.max(...dbData.users.map(u => u.id)) + 1 : 1;
    const permissions = user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || ['book_suites'];
    const record: UserRecord = {
      ...user,
      id,
      permissions,
      created_at: new Date().toISOString()
    };
    if (!dbData.users) dbData.users = [];
    dbData.users.push(record);

    db.addAuditLog({
      actor_id: record.id,
      actor_name: record.name,
      action: 'USER_REGISTERED',
      target_user_id: record.id,
      target_username: record.username,
      details: `New account created as ${record.role} (${record.username})`
    });

    saveDb();
    return record;
  },
  updateUserPositionAndPermissions: (
    id: number,
    role: 'superadmin' | 'admin' | 'staff' | 'guest',
    permissions: string[],
    actor?: { id: number; name: string }
  ) => {
    const u = (dbData.users || []).find(usr => usr.id === id);
    if (u) {
      const oldRole = u.role;
      u.role = role;
      u.permissions = permissions;
      u.updated_at = new Date().toISOString();

      if (actor) {
        db.addAuditLog({
          actor_id: actor.id,
          actor_name: actor.name,
          action: 'POSITION_ASSIGNED',
          target_user_id: u.id,
          target_username: u.username,
          details: `Position changed from ${oldRole} to ${role} with ${permissions.length} granular permissions`
        });
      }

      saveDb();
      return u;
    }
    return null;
  },
  updateUserRole: (id: number, role: 'superadmin' | 'admin' | 'staff' | 'guest') => {
    const u = (dbData.users || []).find(usr => usr.id === id);
    if (u) {
      u.role = role;
      u.permissions = ROLE_DEFAULT_PERMISSIONS[role] || ['book_suites'];
      u.updated_at = new Date().toISOString();
      saveDb();
    }
  },
  recordUserLogin: (id: number) => {
    const u = (dbData.users || []).find(usr => usr.id === id);
    if (u) {
      u.last_login = new Date().toISOString();
      saveDb();
    }
  },

  // System Rules
  getSystemRules: () => dbData.system_rules,
  updateSystemRules: (rules: Partial<SystemRulesRecord>, actor?: { id: number; name: string }) => {
    dbData.system_rules = { ...dbData.system_rules, ...rules };
    if (actor) {
      db.addAuditLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'SYSTEM_RULES_UPDATED',
        details: `Updated hotel governance rules: ${Object.keys(rules).join(', ')}`
      });
    }
    saveDb();
    return dbData.system_rules;
  },

  // Audit Logs
  getAuditLogs: () => (dbData.audit_logs || []).slice(-100).reverse(),
  addAuditLog: (log: Omit<AuditLogRecord, 'id' | 'timestamp'>) => {
    if (!dbData.audit_logs) dbData.audit_logs = [];
    const record: AuditLogRecord = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    dbData.audit_logs.push(record);
    if (dbData.audit_logs.length > 500) {
      dbData.audit_logs = dbData.audit_logs.slice(-500);
    }
    saveDb();
  },

  // Room Types
  getRoomTypes: () => dbData.room_types || [],
  getRoomTypeById: (id: string) => (dbData.room_types || []).find(r => r.id === id),
  updateRoomType: (id: string, updates: Partial<RoomTypeRecord>) => {
    const rt = (dbData.room_types || []).find(r => r.id === id);
    if (rt) {
      Object.assign(rt, updates);
      saveDb();
    }
  },

  // Rooms
  getRooms: () => dbData.rooms || [],
  getRoomById: (id: string) => (dbData.rooms || []).find(r => r.id === id),
  updateRoomStatus: (id: string, status: RoomRecord['status'], notes?: string) => {
    const r = (dbData.rooms || []).find(rm => rm.id === id);
    if (r) {
      r.status = status;
      if (notes !== undefined) r.notes = notes;
      saveDb();
    }
  },
  createRoom: (room: RoomRecord) => {
    if (!dbData.rooms) dbData.rooms = [];
    dbData.rooms.push(room);
    saveDb();
  },

  // Reservations
  getReservations: () => dbData.reservations || [],
  getReservationById: (id: string) => (dbData.reservations || []).find(res => res.id === id),
  createReservation: (res: ReservationRecord) => {
    if (!dbData.reservations) dbData.reservations = [];
    dbData.reservations.push(res);
    saveDb();
  },
  updateReservation: (id: string, updates: Partial<ReservationRecord>) => {
    const r = (dbData.reservations || []).find(res => res.id === id);
    if (r) {
      Object.assign(r, updates);
      saveDb();
    }
  },

  // Folios
  getFolioItems: (reservationId: string) => (dbData.folio_items || []).filter(f => f.reservation_id === reservationId),
  addFolioItem: (item: Omit<FolioItemRecord, 'id' | 'created_at'>) => {
    if (!dbData.folio_items) dbData.folio_items = [];
    const id = dbData.folio_items.length > 0 ? Math.max(...dbData.folio_items.map(f => f.id)) + 1 : 1;
    const record: FolioItemRecord = { ...item, id, created_at: new Date().toISOString() };
    dbData.folio_items.push(record);
    saveDb();
    return record;
  },

  getServices: () => dbData.hotel_services || []
};
