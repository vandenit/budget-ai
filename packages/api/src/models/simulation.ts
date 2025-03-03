import { Schema, model, Document, Types } from 'mongoose';

interface ICategoryChange {
  categoryId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  targetAmount: number;
}

export interface ISimulation extends Document {
  budgetId: Types.ObjectId;
  name: string;
  isActive: boolean;
  categoryChanges: ICategoryChange[];
}

const categoryChangeSchema = new Schema<ICategoryChange>({
  categoryId: { type: Schema.Types.ObjectId, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetAmount: { type: Number, required: true }
});

const simulationSchema = new Schema<ISimulation>({
  budgetId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  categoryChanges: [categoryChangeSchema]
}, {
  timestamps: true
});

// Index voor snelle queries op budgetId
simulationSchema.index({ budgetId: 1 });

export const Simulation = model<ISimulation>('Simulation', simulationSchema); 