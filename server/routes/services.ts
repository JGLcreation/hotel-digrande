import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../mysqlDb.ts';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const services = await db.getServices();
    return res.json({ services });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch hotel services' });
  }
});

export default router;
