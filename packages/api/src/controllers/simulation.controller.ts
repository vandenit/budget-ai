import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Simulation } from '../models/simulation';

export class SimulationController {
  async getSimulations(req: Request, res: Response) {
    try {
      const { budgetId } = req.query;
      if (!budgetId || !Types.ObjectId.isValid(budgetId as string)) {
        return res.status(400).json({ error: 'Valid budgetId is required' });
      }

      const simulations = await Simulation.find({ budgetId: new Types.ObjectId(budgetId as string) });
      res.json(simulations);
    } catch (error) {
      console.error('Error getting simulations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createSimulation(req: Request, res: Response) {
    try {
      const { budgetId, name, categoryChanges } = req.body;

      if (!budgetId || !Types.ObjectId.isValid(budgetId)) {
        return res.status(400).json({ error: 'Valid budgetId is required' });
      }

      if (!name || !categoryChanges || !Array.isArray(categoryChanges)) {
        return res.status(400).json({ error: 'Name and categoryChanges array are required' });
      }

      // Validate each category change
      for (const change of categoryChanges) {
        if (!change.categoryId || !Types.ObjectId.isValid(change.categoryId)) {
          return res.status(400).json({ error: 'Valid categoryId is required for each change' });
        }
        if (!change.startDate || !change.endDate || !change.targetAmount) {
          return res.status(400).json({ error: 'startDate, endDate and targetAmount are required for each change' });
        }
      }

      const simulation = new Simulation({
        budgetId: new Types.ObjectId(budgetId),
        name,
        categoryChanges: categoryChanges.map(change => ({
          ...change,
          categoryId: new Types.ObjectId(change.categoryId),
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
      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Valid simulation id is required' });
      }

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