import { Router, Request, Response } from 'express';
import { db } from '../mysqlDb.ts';
import { requireStaff, requireAuth, AuthRequest } from '../auth.ts';

const router = Router();

// Check availability for specific dates & guests
router.get('/check-availability', async (req: Request, res: Response) => {
  try {
    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut dates are required' });
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ error: 'Invalid dates provided' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const guestsCount = guests ? parseInt(guests as string, 10) : 1;

    const roomTypes = await db.getRoomTypes();
    const rooms = await db.getRooms();
    const reservations = await db.getReservations();

    const formatted = roomTypes
      .filter(rt => rt.max_occupancy >= guestsCount)
      .map(rt => {
        const units = rooms.filter(r => r.room_type_id === rt.id);
        const bookedUnitIds = reservations
          .filter(res => res.room_type_id === rt.id && ['confirmed', 'checked_in'].includes(res.status))
          .filter(res => res.check_in_date < (checkOut as string) && res.check_out_date > (checkIn as string))
          .map(res => res.assigned_room_id);

        const availableUnits = units.filter(r => !bookedUnitIds.includes(r.id)).length;
        const subtotal = rt.base_price * nights;
        const tax = subtotal * 0.12;

        return {
          ...rt,
          nights,
          subtotal,
          tax,
          total_estimate: subtotal + tax,
          total_units: units.length,
          available_units: availableUnits
        };
      });

    return res.json({
      checkIn,
      checkOut,
      nights,
      guestsCount,
      roomTypes: formatted
    });
  } catch (err) {
    console.error('Check availability error:', err);
    return res.status(500).json({ error: 'Failed to verify availability' });
  }
});

// Create new reservation (Requires registered and authenticated account)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      guest_name,
      guest_email,
      guest_phone,
      room_type_id,
      check_in_date,
      check_out_date,
      guests_count,
      special_requests,
      add_ons = [],
      payment_method = 'credit_card'
    } = req.body;

    if (!guest_name || !guest_email || !room_type_id || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Required booking parameters missing' });
    }

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    const roomType = await db.getRoomTypeById(room_type_id);
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const roomSubtotal = roomType.base_price * nights;
    let addOnsTotal = 0;
    if (Array.isArray(add_ons)) {
      addOnsTotal = add_ons.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0);
    }

    const subtotal = roomSubtotal + addOnsTotal;
    const tax = subtotal * 0.12;
    const totalPrice = Math.round((subtotal + tax) * 100) / 100;

    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const reservationId = `GL-2026-${codeSuffix}`;

    const candidateRooms = (await db.getRooms()).filter(r => r.room_type_id === room_type_id && r.status !== 'maintenance');
    const bookedRooms = (await db.getReservations())
      .filter(res => ['confirmed', 'checked_in'].includes(res.status))
      .filter(res => res.check_in_date < check_out_date && res.check_out_date > check_in_date)
      .map(res => res.assigned_room_id);

    const availableRoom = candidateRooms.find(r => !bookedRooms.includes(r.id));
    const assignedRoomId = availableRoom ? availableRoom.id : null;
    const userId = req.user ? req.user.id : null;

    await db.createReservation({
      id: reservationId,
      user_id: userId,
      guest_name: guest_name.trim(),
      guest_email: guest_email.trim().toLowerCase(),
      guest_phone: guest_phone || '',
      room_type_id,
      assigned_room_id: assignedRoomId,
      check_in_date,
      check_out_date,
      guests_count: guests_count || 1,
      total_price: totalPrice,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method,
      special_requests: special_requests || '',
      add_ons,
      created_at: new Date().toISOString()
    });

    // Add folio line items
    await db.addFolioItem({
      reservation_id: reservationId,
      description: `${roomType.name} (${nights} nights @ $${roomType.base_price}/night)`,
      category: 'room',
      amount: roomSubtotal
    });

    await db.addFolioItem({
      reservation_id: reservationId,
      description: 'Hospitality Tax & State Tourism Levy (12%)',
      category: 'tax',
      amount: tax
    });

    if (Array.isArray(add_ons)) {
      for (const addon of add_ons) {
        await db.addFolioItem({
          reservation_id: reservationId,
          description: addon.name,
          category: addon.category ? addon.category.toLowerCase() : 'service',
          amount: parseFloat(addon.price)
        });
      }
    }

    return res.status(201).json({
      success: true,
      reservationId,
      message: `Suite reserved successfully. Confirmation code: ${reservationId}`,
      totalPrice,
      assignedRoomId
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    return res.status(500).json({ error: 'Failed to complete reservation' });
  }
});

// List all reservations (Staff / Admin with filters)
router.get('/', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, date } = req.query;
    let list = await db.getReservations();
    const roomTypes = await db.getRoomTypes();
    const rooms = await db.getRooms();

    if (status && status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    if (date) {
      list = list.filter(r => r.check_in_date === date || r.check_out_date === date);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.guest_name.toLowerCase().includes(q) ||
        r.guest_email.toLowerCase().includes(q) ||
        (r.assigned_room_id && r.assigned_room_id.toLowerCase().includes(q))
      );
    }

    const formatted = list.map(res => {
      const rt = roomTypes.find(t => t.id === res.room_type_id);
      const rm = rooms.find(r => r.id === res.assigned_room_id);
      return {
        ...res,
        room_type_name: rt ? rt.name : res.room_type_id,
        category: rt ? rt.category : '',
        base_price: rt ? rt.base_price : 0,
        floor: rm ? rm.floor : 1
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ reservations: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list reservations' });
  }
});

// Get user's own bookings
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const email = (req.query.email as string) || (req.user ? req.user.email : null);
    const userId = req.user ? req.user.id : null;

    if (!email && !userId) {
      return res.status(400).json({ error: 'Email parameter or login required' });
    }

    const roomTypes = await db.getRoomTypes();
    const list = (await db.getReservations())
      .filter(r => {
        if (userId && r.user_id === userId) return true;
        if (email && r.guest_email && r.guest_email.toLowerCase() === email.toLowerCase()) return true;
        return false;
      })
      .map(res => {
        const rt = roomTypes.find(t => t.id === res.room_type_id);
        return {
          ...res,
          room_type_name: rt ? rt.name : res.room_type_id,
          category: rt ? rt.category : '',
          image_url: rt ? rt.image_url : '',
          view_type: rt ? rt.view_type : '',
          size_sqm: rt ? rt.size_sqm : 0
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ reservations: list });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch personal reservations' });
  }
});

// Get single reservation detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await db.getReservationById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const rt = await db.getRoomTypeById(booking.room_type_id);
    const folio = await db.getFolioItems(id);

    return res.json({
      reservation: {
        ...booking,
        room_type_name: rt ? rt.name : booking.room_type_id,
        category: rt ? rt.category : '',
        base_price: rt ? rt.base_price : 0,
        image_url: rt ? rt.image_url : '',
        amenities: rt ? rt.amenities : []
      },
      folio
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Front Desk Check-in Action
router.post('/:id/check-in', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assigned_room_id } = req.body;

    const booking = await db.getReservationById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const targetRoomId = assigned_room_id || booking.assigned_room_id;
    if (!targetRoomId) {
      return res.status(400).json({ error: 'Please allocate a physical room before checking in' });
    }

    await db.updateReservation(id, {
      status: 'checked_in',
      assigned_room_id: targetRoomId
    });

    await db.updateRoomStatus(targetRoomId, 'occupied', `Occupied by ${booking.guest_name} (${id})`);

    return res.json({
      success: true,
      message: `Guest ${booking.guest_name} checked in to Room ${targetRoomId}`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to execute check-in' });
  }
});

// Front Desk Check-out Action
router.post('/:id/check-out', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await db.getReservationById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await db.updateReservation(id, {
      status: 'checked_out',
      payment_status: 'paid'
    });

    if (booking.assigned_room_id) {
      await db.updateRoomStatus(booking.assigned_room_id, 'cleaning', 'Guest checked out - Housekeeping required');
    }

    return res.json({
      success: true,
      message: `Guest ${booking.guest_name} checked out. Room ${booking.assigned_room_id} marked for cleaning.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to execute check-out' });
  }
});

// Cancel Reservation
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await db.getReservationById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (booking.assigned_room_id) {
      const room = await db.getRoomById(booking.assigned_room_id);
      if (room && room.status === 'reserved') {
        await db.updateRoomStatus(booking.assigned_room_id, 'available', 'Reservation cancelled');
      }
    }

    await db.updateReservation(id, { status: 'cancelled' });
    return res.json({ success: true, message: `Reservation ${id} has been cancelled.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// Assign Room
router.put('/:id/assign-room', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { room_id } = req.body;
    if (!room_id) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    await db.updateReservation(id, { assigned_room_id: room_id });
    return res.json({ success: true, message: `Room ${room_id} assigned to booking ${id}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to assign room' });
  }
});

export default router;
