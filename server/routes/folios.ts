import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../mysqlDb.ts';
import { requireStaff, AuthRequest } from '../auth.ts';

const router = Router();

// Get Folio items and balance for a reservation
router.get('/:reservationId', async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const reservation = await db.getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const items = await db.getFolioItems(reservationId);
    const totalCharges = items.reduce((sum, item) => sum + item.amount, 0);

    return res.json({
      reservation,
      folio: {
        reservation_id: reservationId,
        guest_name: reservation.guest_name,
        room_number: reservation.assigned_room_id,
        items,
        total_charges: Math.round(totalCharges * 100) / 100,
        payment_status: reservation.payment_status,
        payment_method: reservation.payment_method
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve folio' });
  }
});

// Post a new incidental charge to room folio
router.post('/:reservationId/charge', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { description, category = 'dining', amount } = req.body;

    if (!description || !amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Description and valid amount are required' });
    }

    const numAmount = parseFloat(amount);
    const reservation = await db.getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const item = await db.addFolioItem({
      reservation_id: reservationId,
      description: description.trim(),
      category,
      amount: numAmount
    });

    await db.updateReservation(reservationId, {
      total_price: reservation.total_price + numAmount
    });

    return res.status(201).json({
      success: true,
      message: `Charge of $${numAmount.toFixed(2)} posted to room folio`,
      item
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post folio charge' });
  }
});

// Settle Folio / Record Payment
router.post('/:reservationId/payment', requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { payment_method = 'credit_card' } = req.body;

    await db.updateReservation(reservationId, {
      payment_status: 'paid',
      payment_method
    });

    return res.json({
      success: true,
      message: `Folio for reservation ${reservationId} marked as fully settled.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
