import { Schema, model } from 'mongoose';

const categoryChangeSchema = new Schema({
    categoryId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targetAmount: { type: Number, required: true }
});

const simulationSchema = new Schema({
    budgetId: { type: Schema.Types.ObjectId, required: true, ref: 'Budget' },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    categoryChanges: [categoryChangeSchema]
}, {
    timestamps: true
});

export const Simulation = model('Simulation', simulationSchema); 