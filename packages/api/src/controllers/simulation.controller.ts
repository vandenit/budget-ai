import { Request, Response } from 'express';
import { Simulation } from '../models/simulation';

export class SimulationController {
  async getSimulations(req: Request, res: Response) {
    try {
      const { budgetUuid } = req.params;
      const simulations = await Simulation.find({ budgetUuid });
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

      const simulation = new Simulation({
        budgetUuid,
        name,
        categoryChanges: categoryChanges.map(change => ({
          ...change,
          startDate: new Date(change.startDate),
          endDate: new Date(change.endDate)
        }))
      });

      await simulation.save();
      res.status(201).json(simulation);
    } catch (error) {
      console.error('Error creating simulation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleSimulation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const simulation = await Simulation.findById(id);
      
      if (!simulation) {
        return res.status(404).json({ error: 'Simulation not found' });
      }

      simulation.isActive = !simulation.isActive;
      await simulation.save();

      res.json(simulation);
    } catch (error) {
      console.error('Error toggling simulation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 