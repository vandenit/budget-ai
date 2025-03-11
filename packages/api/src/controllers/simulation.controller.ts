import { Request, Response } from 'express';
import { getUserFromReq } from './utils';
import { findSimulationsForBudget, createSimulation, toggleSimulation, updateSimulation as updateSimulationInDb } from '../data/simulation/simulation.server';
import { getBudget } from '../data/budget/budget.server';
import { getCategory } from '../data/category/category.server';

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
      console.log('Creating simulation:', { budgetUuid, body: req.body });
      const user = await getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name || !categoryChanges || !Array.isArray(categoryChanges)) {
        console.log('Validation error: missing name or categoryChanges', { name, categoryChanges });
        return res.status(400).json({ error: 'Name and categoryChanges array are required' });
      }

      // Validate each category change and get category IDs
      const validatedChanges = await Promise.all(categoryChanges.map(async (change) => {
        if (!change.categoryUuid) {
          console.log('Validation error: missing categoryUuid', { change });
          throw new Error('categoryUuid is required for each change');
        }
        if (!change.targetAmount) {
          console.log('Validation error: missing targetAmount', { change });
          throw new Error('targetAmount is required for each change');
        }

        const category = await getCategory(change.categoryUuid);
        if (!category) {
          console.log('Validation error: category not found', { categoryUuid: change.categoryUuid });
          throw new Error(`Category not found for uuid: ${change.categoryUuid}`);
        }

        return {
          categoryUuid: change.categoryUuid,
          targetAmount: change.targetAmount,
          startDate: change.startDate ? new Date(change.startDate) : undefined,
          endDate: change.endDate ? new Date(change.endDate) : undefined
        };
      }));

      const simulation = await createSimulation(budgetUuid, user, {
        name,
        categoryChanges: validatedChanges
      });

      res.status(201).json(simulation);
    } catch (error: any) {
      console.error('Error creating simulation:', error);
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: 'Budget not found' });
      }
      if (error.message.includes('Category not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('categoryUuid') || error.message.includes('targetAmount')) {
        return res.status(400).json({ error: error.message });
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

  async updateSimulation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, categoryChanges } = req.body;
      console.log('Updating simulation:', { id, body: req.body });

      if (!name || !categoryChanges || !Array.isArray(categoryChanges)) {
        console.log('Validation error: missing name or categoryChanges', { name, categoryChanges });
        return res.status(400).json({ error: 'Name and categoryChanges array are required' });
      }

      // Validate each category change and get category IDs
      const validatedChanges = await Promise.all(categoryChanges.map(async (change) => {
        if (!change.categoryUuid) {
          console.log('Validation error: missing categoryUuid', { change });
          throw new Error('categoryUuid is required for each change');
        }
        if (!change.targetAmount) {
          console.log('Validation error: missing targetAmount', { change });
          throw new Error('targetAmount is required for each change');
        }

        const category = await getCategory(change.categoryUuid);
        if (!category) {
          console.log('Validation error: category not found', { categoryUuid: change.categoryUuid });
          throw new Error(`Category not found for uuid: ${change.categoryUuid}`);
        }

        return {
          categoryUuid: change.categoryUuid,
          targetAmount: change.targetAmount,
          startDate: change.startDate ? new Date(change.startDate) : undefined,
          endDate: change.endDate ? new Date(change.endDate) : undefined
        };
      }));

      const simulation = await updateSimulationInDb(id, {
        name,
        categoryChanges: validatedChanges
      });

      res.json(simulation);
    } catch (error: any) {
      console.error('Error updating simulation:', error);
      if (error.message === 'Simulation not found') {
        return res.status(404).json({ error: 'Simulation not found' });
      }
      if (error.message.includes('Category not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('categoryUuid') || error.message.includes('targetAmount')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 