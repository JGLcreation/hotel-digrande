import { Router, Response } from 'express';
import { db } from '../mysqlDb.ts';
import { requireStaff, AuthRequest } from '../auth.ts';

const router = Router();

router.get('/dashboard', requireStaff, async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const rooms = await db.getRooms();
    const roomTypes = await db.getRoomTypes();
    const reservations = await db.getReservations();

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;
    const reservedRooms = rooms.filter(r => r.status === 'reserved').length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const arrivals = reservations
      .filter(r => r.check_in_date === today && ['confirmed', 'checked_in'].includes(r.status))
      .map(r => {
        const rt = roomTypes.find(t => t.id === r.room_type_id);
        return { ...r, room_type_name: rt ? rt.name : r.room_type_id };
      });

    const departures = reservations
      .filter(r => r.check_out_date === today)
      .map(r => {
        const rt = roomTypes.find(t => t.id === r.room_type_id);
        return { ...r, room_type_name: rt ? rt.name : r.room_type_id };
      });

    const inHouseGuests = reservations
      .filter(r => r.status === 'checked_in')
      .map(r => {
        const rt = roomTypes.find(t => t.id === r.room_type_id);
        return { ...r, room_type_name: rt ? rt.name : r.room_type_id };
      });

    const validBookings = reservations.filter(r => r.status !== 'cancelled');
    const totalRevenue = validBookings.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    const totalReservations = validBookings.length;

    const occupiedRoomTypes = rooms
      .filter(r => r.status === 'occupied')
      .map(r => Number(roomTypes.find(rt => rt.id === r.room_type_id)?.base_price || 450));

    const adr = occupiedRoomTypes.length > 0
      ? occupiedRoomTypes.reduce((a, b) => a + Number(b || 0), 0) / occupiedRoomTypes.length
      : 580;

    const revpar = Math.round(Number(adr || 0) * (occupancyRate / 100) * 100) / 100;

    const monthlyTrend = [
      { month: 'Jan', revenue: 68400, occupancy: 72 },
      { month: 'Feb', revenue: 74200, occupancy: 78 },
      { month: 'Mar', revenue: 89600, occupancy: 84 },
      { month: 'Apr', revenue: 95400, occupancy: 88 },
      { month: 'May', revenue: 112000, occupancy: 92 },
      { month: 'Jun', revenue: 135800, occupancy: 96 },
      { month: 'Jul', revenue: 148200, occupancy: 98 },
      { month: 'Aug', revenue: 142600, occupancy: 95 },
      { month: 'Sep', revenue: 104500, occupancy: 85 }
    ];

    return res.json({
      metrics: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        cleaningRooms,
        reservedRooms,
        occupancyRate,
        totalRevenue,
        totalReservations,
        adr: Math.round(adr * 100) / 100,
        revpar
      },
      arrivals,
      departures,
      inHouseGuests,
      monthlyTrend
    });
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ error: 'Failed to generate operational reports' });
  }
});

export default router;
