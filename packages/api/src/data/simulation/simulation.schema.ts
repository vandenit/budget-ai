import mongoose from "mongoose";
const { Schema } = mongoose;

export type SimulationType = {
    _id?: string;
    budgetId: mongoose.Schema.Types.ObjectId;
    name: string;
    isActive: boolean;
    categoryChanges: {
        categoryUuid: string;
        startDate?: Date;
        endDate?: Date;
        targetAmount: number;
    }[];
};

const categoryChangeSchema = new Schema({
    categoryUuid: { type: String, required: true },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
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

export const Simulation = mongoose.models.Simulation || mongoose.model('Simulation', simulationSchema); 