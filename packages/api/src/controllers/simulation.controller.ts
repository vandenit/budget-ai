import { Request, Response } from 'express';
import { getUserFromReq } from './utils';
import { findSimulationsForBudget, createSimulation, toggleSimulation } from '../data/simulation/simulation.server';
import { getBudget } from '../data/budget/budget.server';

export class SimulationController {
  async getSimulations(req: Request, res: Response) {
    try {
      const { budgetUuid } = req.params;
      const user = await getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const budget = await getBudget(budgetUuid, user);
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      const simulations = await findSimulationsForBudget(budget._id);
      res.json(simulations);
    } catch (error) {
      console.error('Error getting simulations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createSimulation(req: Request, res: Response) {
    try {
      const { budgetUuid } = req.params;
      const { name, categoryChanges } = req.body;
      const user = await getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name || !categoryChanges || !Array.isArray(categoryChanges)) {
        return res.status(400).json({ error: 'Name and categoryChanges array are required' });
      }

      // Validate each category change
      for (const change of categoryChanges) {
        if (!change.categoryId) {
          return res.status(400).json({ error: 'categoryId is required for each change' });
        }
        if (!change.startDate || !change.endDate || !change.targetAmount) {
          return res.status(400).json({ error: 'startDate, endDate and targetAmount are required for each change' });
        }
      }

      const simulation = await createSimulation(budgetUuid, user, {
        name,
        categoryChanges: categoryChanges.map(change => ({
          ...change,
          startDate: new Date(change.startDate),
          endDate: new Date(change.endDate)
        }))
      });

      res.status(201).json(simulation);
    } catch (error: any) {
      console.error('Error creating simulation:', error);
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: 'Budget not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleSimulation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const simulation = await toggleSimulation(id);
      res.json(simulation);
    } catch (error: any) {
      console.error('Error toggling simulation:', error);
      if (error.message === 'Simulation not found') {
        return res.status(404).json({ error: 'Simulation not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 