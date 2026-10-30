-- ====================================================================
-- The Grand Luxe Hotel & Resort - Complete MySQL Database Schema & Seeds
-- Database: hotel | Port: 3307
-- Generated for JGLcreation/hotel-digrande
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `hotel` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hotel`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- Table structure for `audit_logs`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actor_id` int unsigned NOT NULL,
  `actor_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` int unsigned DEFAULT NULL,
  `target_username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `audit_logs`
INSERT INTO `audit_logs` VALUES
('audit-1793326046917-init', '2026-10-30 02:07:26', 1, 'System Kernel', 'SYSTEM_BOOTSTRAP', 1, 'lozada', 'Super Administrator account initialized with username: lozada'),
('audit-1793334810548-323', '2026-10-30 04:33:30', 1, 'Jeric Lozada', 'POSITION_ASSIGNED', 4, 'guest_vip', 'Position changed from guest to staff with 3 granular permissions'),
('audit-1793334823099-234', '2026-10-30 04:33:43', 1, 'Jeric Lozada', 'POSITION_ASSIGNED', 4, 'guest_vip', 'Position changed from staff to guest with 1 granular permissions'),
('audit-1793335706445-998', '2026-10-30 04:48:26', 5, 'Marcus Aurelius', 'USER_REGISTERED', 5, 'marcus', 'New account created as staff (marcus)'),
('audit-1793335706508-115', '2026-10-30 04:48:26', 1, 'Jeric Lozada (Super Administrator)', 'POSITION_ASSIGNED', 5, 'marcus', 'Position changed from staff to admin with 4 granular permissions'),
('audit-1793336016251-377', '2026-10-30 04:53:36', 6, 'brian', 'USER_REGISTERED', 6, 'brian', 'New account created as guest (brian)'),
('audit-1793336085046-208', '2026-10-30 04:54:45', 1, 'Jeric Lozada (Super Administrator)', 'POSITION_ASSIGNED', 6, 'brian', 'Position changed from guest to staff with 3 granular permissions');

-- --------------------------------------------------------------------
-- Table structure for `folio_items`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `folio_items`;
CREATE TABLE `folio_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('room','dining','spa','transport','tax','service') COLLATE utf8mb4_unicode_ci DEFAULT 'service',
  `amount` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  CONSTRAINT `folio_items_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `folio_items`
INSERT INTO `folio_items` VALUES
(1, 'GL-2026-901', 'Deluxe Ocean Vista Suite (4 nights @ $450/night)', 'room', '1800.00', '2026-10-30 02:07:26'),
(2, 'GL-2026-901', 'Dom Pérignon & Artisan Caviar Welcome', 'dining', '290.00', '2026-10-30 02:07:26'),
(3, 'GL-2026-901', 'Le Belvédère Fine Dining - Dinner for Two', 'dining', '245.50', '2026-10-30 02:07:26'),
(4, 'GL-2026-901', 'Municipal Hospitality Tax & Resort Levy (12%)', 'tax', '250.86', '2026-10-30 02:07:26'),
(5, 'GL-2026-902', 'Presidential Penthouse Suite (5 nights @ $1850/night)', 'room', '9250.00', '2026-10-30 02:07:26'),
(6, 'GL-2026-902', 'Airport Private Limousine Transfer', 'transport', '140.00', '2026-10-30 02:07:26'),
(7, 'GL-2026-6021', 'Private Garden Sanctuary Villa (3 nights @ $1150/night)', 'room', '3450.00', '2026-10-30 04:53:46'),
(8, 'GL-2026-6021', 'Hospitality Tax & State Tourism Levy (12%)', 'tax', '414.00', '2026-10-30 04:53:46');

-- --------------------------------------------------------------------
-- Table structure for `hotel_services`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `hotel_services`;
CREATE TABLE `hotel_services` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `hotel_services`
INSERT INTO `hotel_services` VALUES
('champagne-welcome', 'Dom Pérignon & Artisan Caviar Welcome', 'Dining', '290.00', 'Chilled bottle of vintage Champagne paired with 30g Oscietra caviar and blinis upon arrival.', '2026-10-30 02:07:26'),
('chef-tasting', '5-Course Michelin Dining Experience for Two', 'Dining', '380.00', 'Private tasting menu crafted by Executive Chef Julian Laurent with sommelier wine pairing.', '2026-10-30 02:07:26'),
('limo-transfer', 'Airport Private Limousine Transfer', 'Transportation', '140.00', 'Chauffeured Mercedes-Maybach directly to the Grand Luxe entrance.', '2026-10-30 02:07:26'),
('signature-spa', '90-min Signature Thermal Massage & Facial', 'Wellness', '220.00', 'Full body restorative treatment using organic botanical essences in our thermal sanctuary.', '2026-10-30 02:07:26'),
('sunset-yacht', 'Private Sunset Coastal Yacht Charter (2 hrs)', 'Excursion', '650.00', 'Exclusive 42ft luxury motor yacht with crew, antipasti, and sunset cocktails.', '2026-10-30 02:07:26');

-- --------------------------------------------------------------------
-- Table structure for `model_has_permissions`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `model_has_permissions`;
CREATE TABLE `model_has_permissions` (
  `permission_id` int unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'App\\Models\\User',
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `model_has_permissions`
INSERT INTO `model_has_permissions` VALUES
(1, 'App\\Models\\User', 1),
(2, 'App\\Models\\User', 1),
(3, 'App\\Models\\User', 1),
(4, 'App\\Models\\User', 1),
(4, 'App\\Models\\User', 2),
(4, 'App\\Models\\User', 5),
(5, 'App\\Models\\User', 1),
(5, 'App\\Models\\User', 2),
(5, 'App\\Models\\User', 5),
(6, 'App\\Models\\User', 1),
(6, 'App\\Models\\User', 2),
(6, 'App\\Models\\User', 3),
(6, 'App\\Models\\User', 6),
(7, 'App\\Models\\User', 1),
(7, 'App\\Models\\User', 2),
(7, 'App\\Models\\User', 3),
(7, 'App\\Models\\User', 5),
(7, 'App\\Models\\User', 6),
(8, 'App\\Models\\User', 1),
(8, 'App\\Models\\User', 2),
(8, 'App\\Models\\User', 3),
(8, 'App\\Models\\User', 5),
(8, 'App\\Models\\User', 6),
(9, 'App\\Models\\User', 1),
(9, 'App\\Models\\User', 2),
(9, 'App\\Models\\User', 4);

-- --------------------------------------------------------------------
-- Table structure for `model_has_roles`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `model_has_roles`;
CREATE TABLE `model_has_roles` (
  `role_id` int unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'App\\Models\\User',
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `model_has_roles`
INSERT INTO `model_has_roles` VALUES
(1, 'App\\Models\\User', 1),
(2, 'App\\Models\\User', 2),
(2, 'App\\Models\\User', 5),
(3, 'App\\Models\\User', 3),
(3, 'App\\Models\\User', 6),
(4, 'App\\Models\\User', 4);

-- --------------------------------------------------------------------
-- Table structure for `permissions`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'web',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `permissions`
INSERT INTO `permissions` VALUES
(1, 'manage_users', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(2, 'manage_roles', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(3, 'manage_rules', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(4, 'view_analytics', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(5, 'manage_inventory', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(6, 'manage_reservations', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(7, 'front_desk_checkin', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(8, 'manage_folios', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(9, 'book_suites', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27');

-- --------------------------------------------------------------------
-- Table structure for `reservations`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `guest_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guest_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guest_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `room_type_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_room_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `guests_count` int DEFAULT '1',
  `total_price` decimal(10,2) DEFAULT '0.00',
  `status` enum('confirmed','checked_in','checked_out','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'confirmed',
  `payment_status` enum('paid','pending','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'credit_card',
  `special_requests` text COLLATE utf8mb4_unicode_ci,
  `add_ons` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `room_type_id` (`room_type_id`),
  KEY `assigned_room_id` (`assigned_room_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`),
  CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`assigned_room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `reservations`
INSERT INTO `reservations` VALUES
('GL-2026-6021', 6, 'brian', 'brian@gmail.com', '09321332121', 'garden-villa', 'GV-1', '2026-10-30 16:00:00', '2026-11-02 16:00:00', 2, '3864.00', 'checked_out', 'paid', 'credit_card', 'High floor preferred with extra feather pillows.', '[]', '2026-10-30 04:53:46', '2026-10-30 04:54:08'),
('GL-2026-901', 1, 'Jeric Lozada', 'lozada@grandluxe.com', '+1 (555) 019-8800', 'deluxe-ocean', '202', '2026-10-28 16:00:00', '2026-11-01 16:00:00', 2, '2225.50', 'checked_in', 'paid', 'credit_card', 'High floor preferred, extra hypoallergenic pillows.', '[{"id":"champagne-welcome","name":"Dom Pérignon & Artisan Caviar Welcome","price":290,"category":"Dining"}]', '2026-10-30 02:07:26', NULL),
('GL-2026-902', 4, 'Ambassador Elena Rostova', 'elena.rostova@diplomat.eu', '+33 6 12 34 56 78', 'presidential-suite', 'PH-801', '2026-10-26 16:00:00', '2026-10-31 16:00:00', 3, '9390.00', 'checked_in', 'paid', 'wire_transfer', 'Private security protocol coordination. Sparkling San Pellegrino only.', '[{"id":"limo-transfer","name":"Airport Private Limousine Transfer","price":140,"category":"Transportation"}]', '2026-10-30 02:07:26', NULL),
('GL-2026-903', NULL, 'Marcus & Sophia Vance', 'marcus.vance@techcorp.io', '+1 (555) 345-9871', 'garden-villa', 'GV-1', '2026-10-28 16:00:00', '2026-10-31 16:00:00', 2, '3670.00', 'checked_in', 'paid', 'credit_card', 'Honeymoon anniversary setup with rose petals.', '[{"id":"signature-spa","name":"90-min Signature Thermal Massage & Facial","price":220,"category":"Wellness"}]', '2026-10-30 02:07:26', NULL),
('GL-2026-904', NULL, 'David K. Chen', 'david.chen@venture.com', '+1 (555) 890-1234', 'deluxe-ocean', '203', '2026-10-29 16:00:00', '2026-11-03 16:00:00', 1, '2520.00', 'confirmed', 'paid', 'credit_card', 'Late evening arrival around 20:00. Quiet room away from elevator.', '[]', '2026-10-30 02:07:26', NULL);

-- --------------------------------------------------------------------
-- Table structure for `role_has_permissions`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `role_has_permissions`;
CREATE TABLE `role_has_permissions` (
  `permission_id` int unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `role_has_permissions_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `role_has_permissions`
INSERT INTO `role_has_permissions` VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 2),
(6, 3),
(7, 3),
(8, 3),
(9, 4);

-- --------------------------------------------------------------------
-- Table structure for `roles`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'web',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `roles`
INSERT INTO `roles` VALUES
(1, 'superadmin', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(2, 'admin', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(3, 'staff', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27'),
(4, 'guest', 'web', '2026-10-30 02:07:27', '2026-10-30 02:07:27');

-- --------------------------------------------------------------------
-- Table structure for `room_types`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_occupancy` int NOT NULL DEFAULT '2',
  `size_sqm` decimal(6,2) DEFAULT '0.00',
  `bed_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `view_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `amenities` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `room_types`
INSERT INTO `room_types` VALUES
('classic-heritage', 'Classic Heritage King Room', 'Heritage Rooms', 'An homage to timeless neoclassical architecture infused with modern boutique comfort.', '320.00', 2, '42.00', 'Heritage King Bed', 'Courtyard & Fountain', '/src/assets/images/hero_luxury_hotel_1790748121852.jpg', '["Courtyard Fountain View","Cast-iron Clawfoot Bathtub","Locally Sourced Organic Teas","Pillow Menu Selection (6 Varieties)","High-Definition 65-inch Smart Display"]', '2026-10-30 02:07:26', NULL),
('deluxe-ocean', 'Deluxe Ocean Vista Suite', 'Deluxe Rooms', 'Bathed in soft morning coastal light with expansive floor-to-ceiling glass doors.', '450.00', 2, '54.00', 'Custom King Bed', 'Direct Oceanfront', '/src/assets/images/room_deluxe_ocean_1790748144413.jpg', '["Private Oceanfront Balcony","Artisan Espresso Bar","Walk-in Rainfall Shower","Organic Botanical Toiletries","Evening Turn-Down Aromatherapy","Smart Environmental Climate Controls"]', '2026-10-30 02:07:26', NULL),
('executive-suite', 'Executive Grand Suite', 'Executive Suites', 'Tailored for discerning business travelers and executive getaways.', '680.00', 3, '78.00', 'King Bed & Executive Sofa', 'Metropolitan Horizon & Gardens', '/src/assets/images/room_executive_suite_1790748155531.jpg', '["Executive Club Lounge Access","Ergonomic Walnut Workstation","Complimentary High-Speed Fiber WiFi","Nespresso Virtuo Bar","Dual Vanity Marble Bathroom","Complimentary Garment Pressing (2 items)"]', '2026-10-30 02:07:26', NULL),
('garden-villa', 'Private Garden Sanctuary Villa', 'Private Villas', 'Secluded within lush tropical courtyard gardens with fragrant jasmine and royal palms.', '1150.00', 4, '130.00', 'King Bed & Two Queen Divans', 'Private Tropical Garden & Pool', '/src/assets/images/room_garden_villa.jpg', '["Private Heated Plunge Pool","Open-Air Alfresco Rain Shower","Private Sun Pavilion & Daybeds","In-Villa Wellness Spa Setup","Breakfast by Personal Chef","Personalized Concierge Host"]', '2026-10-30 02:07:26', '2026-10-30 04:32:49'),
('presidential-suite', 'Presidential Penthouse Suite', 'Signature Suite', 'Occupying the entire top level with breathtaking 360-degree ocean and skyline panoramas.', '1850.00', 4, '185.00', 'King Canopy Bed + Daybed', 'Panoramic Ocean & Skyline', '/src/assets/images/room_presidential_suite_1790748133665.jpg', '["Private Butler Service 24/7","Private Jacuzzi Terrace","Complimentary Airport Limousine","Full Marble Bath with Soaking Tub","Bespoke Bar with Curated Cellar","Bang & Olufsen Acoustic System","Dyson Supersonic Care Suite","Priority Michelin Dining Seating"]', '2026-10-30 02:07:26', NULL);

-- --------------------------------------------------------------------
-- Table structure for `rooms`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_type_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` int NOT NULL DEFAULT '1',
  `status` enum('available','occupied','reserved','cleaning','maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_type_id` (`room_type_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `rooms`
INSERT INTO `rooms` VALUES
('101', 'classic-heritage', 1, 'available', 'Near the courtyard fountain', '2026-10-30 02:07:26', NULL),
('102', 'classic-heritage', 1, 'occupied', 'Late checkout requested', '2026-10-30 02:07:26', NULL),
('103', 'classic-heritage', 1, 'cleaning', 'Housekeeping in progress', '2026-10-30 02:07:26', NULL),
('201', 'deluxe-ocean', 2, 'available', 'Unobstructed morning sunrise view', '2026-10-30 02:07:26', NULL),
('202', 'deluxe-ocean', 2, 'occupied', 'VIP Guest in house', '2026-10-30 02:07:26', NULL),
('203', 'deluxe-ocean', 2, 'reserved', 'Arrival expected today', '2026-10-30 02:07:26', NULL),
('301', 'executive-suite', 3, 'available', 'Corner suite with dual aspect windows', '2026-10-30 02:07:26', NULL),
('302', 'executive-suite', 3, 'occupied', 'Executive board retreat', '2026-10-30 02:07:26', NULL),
('303', 'executive-suite', 3, 'cleaning', 'Ready for inspection', '2026-10-30 02:07:26', NULL),
('GV-1', 'garden-villa', 1, 'cleaning', 'Guest checked out - Housekeeping required', '2026-10-30 02:07:26', '2026-10-30 04:54:08'),
('GV-2', 'garden-villa', 1, 'available', 'Fresh floral arrangement placed', '2026-10-30 02:07:26', NULL),
('PH-801', 'presidential-suite', 8, 'occupied', 'Presidential Penthouse reserved for diplomat', '2026-10-30 02:07:26', NULL);

-- --------------------------------------------------------------------
-- Table structure for `system_rules`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `system_rules`;
CREATE TABLE `system_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rule_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rule_key` (`rule_key`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `system_rules`
INSERT INTO `system_rules` VALUES
(1, 'tax_rate', '0.12', NULL),
(2, 'resort_fee_per_night', '50', NULL),
(3, 'require_account_to_book', 'true', NULL),
(4, 'allow_instant_booking', 'true', NULL),
(5, 'max_booking_advance_days', '365', NULL),
(6, 'cancellation_grace_hours', '48', NULL),
(7, 'maintenance_mode', 'false', NULL),
(8, 'system_notice', 'The Grand Luxe operates under strict bespoke hospitality standards.', NULL);

-- --------------------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Records for `users`
INSERT INTO `users` VALUES
(1, 'lozada', 'Jeric Lozada (Super Administrator)', 'lozada@grandluxe.com', '5004f8bdbe2c6d69633bbf90f3ca3f771b0bfd61ea27a0c5c71f0645a45368cbedbe929354750f47a2bf3549a4b8caf4a8c17b60fed5f8216c7b0da587f266a0', '+1 (555) 019-8800', '2026-10-30 02:07:26', '2026-10-30 04:54:35', '2026-10-30 04:54:35'),
(2, 'admin', 'Lord Arthur Sterling (GM)', 'admin@grandluxe.com', 'f292920b41643db40b3bc8761dafcc150bf7f77667de2638ef8798ce751ca8e687e3bf596aa32171c976a465858fcec79aa184ad28242b2d25d82ce801ba6f02', '+1 (555) 019-2831', '2026-10-30 02:07:26', '2026-10-30 04:52:06', '2026-10-30 04:52:06'),
(3, 'clara', 'Clara Vance (Front Desk Mgr)', 'clara@grandluxe.com', 'fadb4a9f39d3e10c1c42495c450db29d333aeacef1a34af0a1390f5abf0b17f4d72015ef038badb0f3c659351f92afc8929b1949f67c95fbfc021cb6c830d9b5', '+1 (555) 019-2832', '2026-10-30 02:07:26', '2026-10-30 04:53:54', '2026-10-30 04:53:54'),
(4, 'guest_vip', 'Countess Camille De Monet (VIP Guest)', 'camille@monet.eu', 'adaa2528dff91dcece9d51a34646ecdb8807368e2ed42eaa348e7f6a9db1ff9359066b19c96ef68324bac5c48b45103128bc0a48a4f11a7ef35553f439634958', '+1 (555) 019-4411', '2026-10-30 02:07:26', '2026-10-30 04:54:52', '2026-10-30 04:54:52'),
(5, 'marcus', 'Marcus Aurelius', 'marcus@grandluxe.com', '0a50a89484d789046c99fc89c1ee9445fd8b554384d790f91a4014a978e3842c7ec892aa635a10d929b69b8e35c381b1a1ea5d650af922716bc16875fbde290f', '+1 555 491 2001', '2026-10-30 04:48:26', '2026-10-30 04:48:26', '2026-10-30 04:48:26'),
(6, 'brian', 'brian', 'brian@gmail.com', '789db45fa180aff49f72531c12eef268d5ae7aeeefafc75568eb98a99cb999260d4bf7e7fd120f43a45405127dc6c948f828038a9dd6bddfd8f172daf8e2e827', '09321332121', '2026-10-30 04:53:36', '2026-10-30 04:55:06', '2026-10-30 04:55:06');

SET FOREIGN_KEY_CHECKS = 1;
