import { Router } from 'express';
import { SimulationController } from '../controllers/simulation.controller';

const router = Router();
const controller = new SimulationController();

router.get('/budget/:budgetUuid', controller.getSimulations);
router.post('/budget/:budgetUuid', controller.createSimulation);
router.put('/:id/active', controller.toggleSimulation);

export default router; 