import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../mysqlDb.ts';
import { requireStaff, requireAdmin, AuthRequest } from '../auth.ts';

const router = Router();

// Get all room types
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

// Get single room type
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

// Update room type price or details (Admin only)
router.put('/types/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, base_price, description, max_occupancy, bed_type, amenities } = req.body;

    await db.updateRoomType(id, {
      ...(name && { name }),
      ...(base_price !== undefined && { base_price: parseFloat(base_price) }),
      ...(description && { description }),
      ...(max_occupancy !== undefined && { max_occupancy: parseInt(max_occupancy, 10) }),
      ...(bed_type && { bed_type }),
      ...(amenities && { amenities })
    });

    return res.json({ success: true, message: 'Room type updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update room type' });
  }
});

// Get visual room matrix / floor inventory (Staff/Admin)
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

// Update individual room status (Staff/Admin)
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

// Add new physical room (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id, room_type_id, floor, notes } = req.body;
    if (!id || !room_type_id || !floor) {
      return res.status(400).json({ error: 'Room number, type, and floor are required' });
    }

    await db.createRoom({
      id: id.trim(),
      room_type_id,
      floor: parseInt(floor, 10),
      status: 'available',
      notes: notes || ''
    });

    return res.status(201).json({ success: true, message: `Room ${id} created` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

export default router;
