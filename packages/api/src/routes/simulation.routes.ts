import { Router } from 'express';
import { SimulationController } from '../controllers/simulation.controller';

const router = Router();
const controller = new SimulationController();

router.get('/', controller.getSimulations);
router.post('/', controller.createSimulation);
router.put('/:id/active', controller.toggleSimulation);

export default router; 