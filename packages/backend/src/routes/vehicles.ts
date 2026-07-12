import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import {
  createVehicle,
  getVehicles,
  searchVehicles,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController';

const router = Router();

// Apply auth middleware to all endpoints in this router
router.use(authenticateUser);

router.get('/search', searchVehicles);
router.post('/', createVehicle);
router.get('/', getVehicles);
router.put('/:id', updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

export default router;
