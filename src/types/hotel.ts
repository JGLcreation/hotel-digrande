export interface RoomType {
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
  total_units: number;
  available_units: number;
  nights?: number;
  subtotal?: number;
  tax?: number;
  total_estimate?: number;
}

export interface Room {
  id: string;
  floor: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  notes?: string;
  room_type_id: string;
  room_type_name: string;
  category?: string;
  base_price?: number;
  current_reservation_id?: string;
  guest_name?: string;
  check_in_date?: string;
  check_out_date?: string;
}

export interface AddOnService {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}

export interface Reservation {
  id: string;
  user_id?: number | null;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_type_id: string;
  room_type_name?: string;
  category?: string;
  image_url?: string;
  assigned_room_id?: string | null;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_price: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'refunded';
  payment_method: string;
  special_requests?: string;
  add_ons?: AddOnService[];
  created_at: string;
  floor?: number;
}

export interface FolioItem {
  id: number;
  reservation_id: string;
  description: string;
  category: 'room' | 'dining' | 'spa' | 'transport' | 'tax' | 'service';
  amount: number;
  created_at: string;
}

export interface FolioData {
  reservation_id: string;
  guest_name: string;
  room_number?: string | null;
  items: FolioItem[];
  total_charges: number;
  payment_status: string;
  payment_method?: string;
}

export interface OperationalMetrics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  reservedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  totalReservations: number;
  adr: number;
  revpar: number;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'staff' | 'guest';
  permissions: string[];
  phone?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  bookings_count?: number;
  total_spent?: number;
  bookings?: Reservation[];
}

export interface PermissionInfo {
  key: string;
  name: string;
  category: string;
  description: string;
}

export interface SystemRules {
  tax_rate: number;
  resort_fee_per_night: number;
  require_account_to_book: boolean;
  allow_instant_booking: boolean;
  max_booking_advance_days: number;
  cancellation_grace_hours: number;
  maintenance_mode: boolean;
  system_notice: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_id: number;
  actor_name: string;
  action: string;
  target_user_id?: number;
  target_username?: string;
  details: string;
}
