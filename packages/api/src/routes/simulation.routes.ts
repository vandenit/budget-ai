import { Router } from 'express';
import { SimulationController } from '../controllers/simulation.controller';
import { handleRequest } from '../controllers/utils';

const router = Router();
const controller = new SimulationController();

router.get('/budget/:budgetUuid', handleRequest(controller.getSimulations.bind(controller)));
router.post('/budget/:budgetUuid', handleRequest(controller.createSimulation.bind(controller)));
router.put('/:id/active', handleRequest(controller.toggleSimulation.bind(controller)));
router.put('/:id', handleRequest(controller.updateSimulation.bind(controller)));
router.delete('/:id', handleRequest(controller.deleteSimulation.bind(controller)));

export default router; 