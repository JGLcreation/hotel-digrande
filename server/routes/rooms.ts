import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../mysqlDb.ts';
import { requireStaff, AuthRequest } from '../auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../src/assets/images/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── 1. Upload Room Image (Staff, Admin, Superadmin) ───────────────────────────
router.post('/upload-image', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    // Match base64 regex data:image/(png|jpeg|jpg|webp);base64,...
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const cleanName = (filename || 'room')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueFileName = `room_${Date.now()}_${cleanName}.${ext}`;
    const targetFilePath = path.join(uploadDir, uniqueFileName);

    fs.writeFileSync(targetFilePath, buffer);

    // Also mirror to dist if exists
    const distUploadDir = path.resolve(__dirname, '../../dist/src/assets/images/uploads');
    if (fs.existsSync(distUploadDir)) {
      try {
        fs.writeFileSync(path.join(distUploadDir, uniqueFileName), buffer);
      } catch (e) {
        // non-fatal
      }
    }

    const imageUrl = `/src/assets/images/uploads/${uniqueFileName}`;
    return res.json({
      success: true,
      imageUrl,
      filename: uniqueFileName,
      message: 'Room image uploaded successfully'
    });
  } catch (err) {
    console.error('Error uploading room image:', err);
    return res.status(500).json({ error: 'Failed to process and store room image' });
  }
});

// ── 2. Get all room types (Public/Staff) ──────────────────────────────────────
router.get('/types', async (_req: Request, res: Response) => {
  try {
    const roomTypes = await db.getRoomTypes();
    const rooms = await db.getRooms();

    const formatted = roomTypes.map(rt => {
      const units = rooms.filter(r => r.room_type_id === rt.id);
      const availableUnits = units.filter(r => r.status === 'available');
      return {
        ...rt,
        total_units: units.length,
        available_units: availableUnits.length
      };
    });

    return res.json({ roomTypes: formatted });
  } catch (err) {
    console.error('Error fetching room types:', err);
    return res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

// ── 3. Get single room type ──────────────────────────────────────────────────
router.get('/types/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomType = await db.getRoomTypeById(id);
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }
    return res.json({ roomType });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch room type' });
  }
});

// ── 4. Create Room Type / Suite Category (Staff/Admin/Superadmin) ─────────────
router.post('/types', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const {
      id,
      name,
      category,
      description,
      base_price,
      max_occupancy,
      size_sqm,
      bed_type,
      view_type,
      image_url,
      amenities
    } = req.body;

    if (!name || !base_price) {
      return res.status(400).json({ error: 'Suite name and base nightly price are required' });
    }

    const typeId = (id || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `suite-${Date.now()}`;

    // Check if duplicate
    const existing = await db.getRoomTypeById(typeId);
    if (existing) {
      return res.status(400).json({ error: `Room suite with ID '${typeId}' already exists` });
    }

    const parsedAmenities = Array.isArray(amenities)
      ? amenities
      : typeof amenities === 'string'
      ? amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['Complimentary Wi-Fi', 'Luxury Marble Bath'];

    await db.createRoomType({
      id: typeId,
      name: name.trim(),
      category: category ? category.trim() : 'Suites',
      description: description ? description.trim() : 'Luxurious boutique suite with bespoke hospitality amenities.',
      base_price: parseFloat(base_price) || 350,
      max_occupancy: parseInt(max_occupancy, 10) || 2,
      size_sqm: parseFloat(size_sqm) || 45,
      bed_type: bed_type ? bed_type.trim() : 'Heritage King Bed',
      view_type: view_type ? view_type.trim() : 'Courtyard View',
      image_url: image_url || '/src/assets/images/hero_luxury_hotel_1790748121852.jpg',
      amenities: parsedAmenities,
      created_at: new Date().toISOString()
    });

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_TYPE_CREATED',
        details: `Created new room category '${name}' (ID: ${typeId}) at $${base_price}/night`
      });
    }

    const created = await db.getRoomTypeById(typeId);
    return res.status(201).json({ success: true, message: `Room suite '${name}' created`, roomType: created });
  } catch (err) {
    console.error('Error creating room type:', err);
    return res.status(500).json({ error: 'Failed to create room suite category' });
  }
});

// ── 5. Update Room Type / Suite Information (Staff/Admin/Superadmin) ─────────
router.put('/types/:id', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      base_price,
      description,
      max_occupancy,
      size_sqm,
      bed_type,
      view_type,
      image_url,
      amenities
    } = req.body;

    const existing = await db.getRoomTypeById(id);
    if (!existing) {
      return res.status(404).json({ error: `Room suite '${id}' not found` });
    }

    const parsedAmenities = amenities !== undefined
      ? (Array.isArray(amenities)
          ? amenities
          : typeof amenities === 'string'
          ? amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
          : existing.amenities)
      : undefined;

    await db.updateRoomType(id, {
      ...(name && { name }),
      ...(category && { category }),
      ...(base_price !== undefined && { base_price: parseFloat(base_price) }),
      ...(description !== undefined && { description }),
      ...(max_occupancy !== undefined && { max_occupancy: parseInt(max_occupancy, 10) }),
      ...(size_sqm !== undefined && { size_sqm: parseFloat(size_sqm) }),
      ...(bed_type && { bed_type }),
      ...(view_type && { view_type }),
      ...(image_url && { image_url }),
      ...(parsedAmenities && { amenities: parsedAmenities })
    });

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_TYPE_UPDATED',
        details: `Updated suite '${existing.name}' (${id}) details and pricing`
      });
    }

    const updated = await db.getRoomTypeById(id);
    return res.json({ success: true, message: 'Room suite updated successfully', roomType: updated });
  } catch (err) {
    console.error('Error updating room type:', err);
    return res.status(500).json({ error: 'Failed to update room type' });
  }
});

// ── 6. Delete Room Type (Staff/Admin/Superadmin) ─────────────────────────────
router.delete('/types/:id', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.getRoomTypeById(id);
    if (!existing) {
      return res.status(404).json({ error: `Room suite '${id}' not found` });
    }

    await db.deleteRoomType(id);

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_TYPE_DELETED',
        details: `Deleted room suite '${existing.name}' (${id}) and associated inventory units`
      });
    }

    return res.json({ success: true, message: `Room suite '${existing.name}' deleted successfully` });
  } catch (err) {
    console.error('Error deleting room type:', err);
    return res.status(500).json({ error: 'Failed to delete room suite' });
  }
});

// ── 7. Get visual room matrix / floor inventory (Staff/Admin/Superadmin) ─────
router.get('/matrix', requireStaff, async (_req: AuthRequest, res: Response) => {
  try {
    const rooms = await db.getRooms();
    const roomTypes = await db.getRoomTypes();
    const reservations = await db.getReservations();

    const formatted = rooms.map(r => {
      const rt = roomTypes.find(t => t.id === r.room_type_id);
      const activeRes = reservations.find(res => res.assigned_room_id === r.id && res.status === 'checked_in');

      return {
        id: r.id,
        floor: r.floor,
        status: r.status,
        notes: r.notes,
        room_type_id: r.room_type_id,
        room_type_name: rt ? rt.name : r.room_type_id,
        category: rt ? rt.category : '',
        base_price: rt ? rt.base_price : 0,
        image_url: rt ? rt.image_url : '',
        current_reservation_id: activeRes ? activeRes.id : null,
        guest_name: activeRes ? activeRes.guest_name : null,
        check_in_date: activeRes ? activeRes.check_in_date : null,
        check_out_date: activeRes ? activeRes.check_out_date : null
      };
    });

    return res.json({ rooms: formatted });
  } catch (err) {
    console.error('Error fetching room matrix:', err);
    return res.status(500).json({ error: 'Failed to load room matrix' });
  }
});

// ── 8. Update individual room status (Staff/Admin/Superadmin) ────────────────
router.put('/:id/status', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowed = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    await db.updateRoomStatus(id, status, notes);
    return res.json({ success: true, message: `Room ${id} status updated to ${status}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update room status' });
  }
});

// ── 9. Add new physical room unit (Staff/Admin/Superadmin) ────────────────────
router.post('/', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id, room_type_id, floor, notes } = req.body;
    if (!id || !room_type_id || !floor) {
      return res.status(400).json({ error: 'Room number, suite type, and floor are required' });
    }

    const roomId = String(id).trim();
    const existing = await db.getRoomById(roomId);
    if (existing) {
      return res.status(400).json({ error: `Room unit '${roomId}' already exists` });
    }

    await db.createRoom({
      id: roomId,
      room_type_id,
      floor: parseInt(floor, 10),
      status: 'available',
      notes: notes || ''
    });

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_CREATED',
        details: `Added new physical room unit '${roomId}' on Floor ${floor} (${room_type_id})`
      });
    }

    return res.status(201).json({ success: true, message: `Room ${roomId} created successfully` });
  } catch (err) {
    console.error('Error creating physical room:', err);
    return res.status(500).json({ error: 'Failed to create room unit' });
  }
});

// ── 10. Edit physical room unit (Staff/Admin/Superadmin) ──────────────────────
router.put('/:id', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { room_type_id, floor, status, notes } = req.body;

    const existing = await db.getRoomById(id);
    if (!existing) {
      return res.status(404).json({ error: `Room ${id} not found` });
    }

    await db.updateRoom(id, {
      ...(room_type_id && { room_type_id }),
      ...(floor !== undefined && { floor: parseInt(floor, 10) }),
      ...(status && { status }),
      ...(notes !== undefined && { notes })
    });

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_UPDATED',
        details: `Updated room unit ${id} details (Floor: ${floor}, Type: ${room_type_id})`
      });
    }

    return res.json({ success: true, message: `Room ${id} updated successfully` });
  } catch (err) {
    console.error('Error updating physical room:', err);
    return res.status(500).json({ error: 'Failed to update room unit' });
  }
});

// ── 11. Delete physical room unit (Staff/Admin/Superadmin) ────────────────────
router.delete('/:id', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.getRoomById(id);
    if (!existing) {
      return res.status(404).json({ error: `Room ${id} not found` });
    }

    await db.deleteRoom(id);

    if (req.user) {
      await db.addAuditLog({
        actor_id: req.user.id,
        actor_name: req.user.name,
        action: 'ROOM_DELETED',
        details: `Deleted physical room unit ${id}`
      });
    }

    return res.json({ success: true, message: `Room ${id} deleted successfully` });
  } catch (err) {
    console.error('Error deleting physical room:', err);
    return res.status(500).json({ error: 'Failed to delete room unit' });
  }
});

export default router;
