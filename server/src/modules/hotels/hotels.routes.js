import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as hotelsController from './hotels.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/cities', hotelsController.listCities);
router.get('/catalog', hotelsController.listCatalog);
router.get('/', hotelsController.listHotels);
router.get('/:hotelId/rooms', hotelsController.listRooms);
router.get('/:hotelId/availability', hotelsController.getAvailability);

export default router;
