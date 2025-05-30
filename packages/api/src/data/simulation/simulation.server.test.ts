import { describe, it, expect, vi, afterEach } from "vitest";
import { findSimulationsForBudget, createSimulation, toggleSimulation, updateSimulation } from "./simulation.server";
import { Simulation } from "./simulation.schema";
import { getBudget } from "../budget/budget.server";
import type { Budget } from "common-ts";
import type { UserType } from "../user/user.server";
import mongoose from "mongoose";

// Mock dependencies
vi.mock("../db", () => ({
    default: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("../budget/budget.server", () => ({
    getBudget: vi.fn()
}));

// Mock the Simulation model
const mockFind = vi.fn();
const mockFindById = vi.fn();
const mockSave = vi.fn();

vi.mock("./simulation.schema", () => ({
    Simulation: function(data: any) {
        return {
            _id: "sim123",
            ...data,
            save: mockSave
        };
    }
}));

// Add static methods to the mocked Simulation
(Simulation as any).find = mockFind;
(Simulation as any).findById = mockFindById;

describe("simulation.server tests", () => {
    describe("findSimulationsForBudget", () => {
        it("should return simulations for the given budget", async () => {
            const mockSimulations = [
                { _id: "1", name: "Test Simulation 1" },
                { _id: "2", name: "Test Simulation 2" }
            ];

            // Mock Simulation.find
            mockFind.mockResolvedValue(mockSimulations);

            const result = await findSimulationsForBudget("budget123");

            expect(mockFind).toHaveBeenCalledWith({ budgetId: "budget123" });
            expect(result).toEqual(mockSimulations);
        });
    });

    describe("createSimulation", () => {
        it("should create a new simulation with the correct data", async () => {
            const mockBudget = {
                _id: "budget123",
                uuid: "budget-uuid-123",
                name: "Test Budget"
            } as Budget;

            const mockUser = {
                _id: "user123" as unknown as mongoose.Schema.Types.ObjectId,
                authId: "auth0|123",
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    preferredBudgetUuid: "budget-uuid-123"
                }
            } as UserType;

            const mockSimulation = {
                _id: "sim123",
                name: "Test Simulation",
                budgetId: "budget123",
                categoryChanges: [{
                    categoryUuid: "cat123",
                    targetAmount: 1000,
                    startDate: new Date("2024-01-01"),
                    endDate: new Date("2024-12-31")
                }]
            };

            // Mock getBudget
            vi.mocked(getBudget).mockResolvedValue(mockBudget);

            // Mock save method
            mockSave.mockResolvedValue(mockSimulation);

            const result = await createSimulation(
                mockBudget.uuid,
                mockUser,
                {
                    name: "Test Simulation",
                    categoryChanges: [
                        {
                            categoryUuid: "cat123",
                            startDate: new Date("2024-01-01"),
                            endDate: new Date("2024-12-31"),
                            targetAmount: 1000
                        }
                    ]
                }
            );

            expect(getBudget).toHaveBeenCalledWith(mockBudget.uuid, mockUser);
            expect(mockSave).toHaveBeenCalled();
            expect(result._id).toBe(mockSimulation._id);
            expect(result.name).toBe(mockSimulation.name);
            expect(result.budgetId).toBe(mockSimulation.budgetId);
            expect(result.categoryChanges).toEqual(mockSimulation.categoryChanges);
        });

        it("should throw error when budget is not found", async () => {
            const mockUser = {
                _id: "user123" as unknown as mongoose.Schema.Types.ObjectId,
                authId: "auth0|123",
                name: "Test User",
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    preferredBudgetUuid: "budget-uuid-123"
                }
            } as UserType;

            // Mock getBudget to return null
            vi.mocked(getBudget).mockResolvedValue(null);

            await expect(createSimulation(
                "non-existent-uuid",
                mockUser,
                {
                    name: "Test Simulation",
                    categoryChanges: []
                }
            )).rejects.toThrow("Budget not found");
        });
    });

    describe("toggleSimulation", () => {
        it("should toggle the simulation active state", async () => {
            const mockSimulation = {
                _id: "sim123",
                name: "Test Simulation",
                isActive: false,
                save: vi.fn()
            };

            // Mock findById to return the simulation
            mockFindById.mockResolvedValue(mockSimulation);

            // Mock save to return the updated simulation
            mockSimulation.save.mockResolvedValue({
                ...mockSimulation,
                isActive: true
            });

            const result = await toggleSimulation("sim123");

            expect(mockFindById).toHaveBeenCalledWith("sim123");
            expect(mockSimulation.isActive).toBe(true);
            expect(mockSimulation.save).toHaveBeenCalled();
            expect(result.isActive).toBe(true);
        });

        it("should throw error when simulation is not found", async () => {
            // Mock findById to return null
            mockFindById.mockResolvedValue(null);

            await expect(toggleSimulation("non-existent-id"))
                .rejects.toThrow("Simulation not found");
        });
    });

    describe("updateSimulation", () => {
        it("should update an existing simulation with new data", async () => {
            const mockSimulation = {
                _id: "sim123",
                name: "Old Name",
                categoryChanges: [],
                save: vi.fn()
            };

            const updateData = {
                name: "Updated Name",
                categoryChanges: [
                    {
                        categoryUuid: "cat123",
                        startDate: new Date("2024-01-01"),
                        endDate: new Date("2024-12-31"),
                        targetAmount: 1500
                    }
                ]
            };

            // Mock findById to return the simulation
            mockFindById.mockResolvedValue(mockSimulation);

            // Mock save to return the updated simulation
            mockSimulation.save.mockResolvedValue({
                ...mockSimulation,
                ...updateData
            });

            const result = await updateSimulation("sim123", updateData);

            expect(mockFindById).toHaveBeenCalledWith("sim123");
            expect(mockSimulation.name).toBe(updateData.name);
            expect(mockSimulation.categoryChanges).toEqual(updateData.categoryChanges);
            expect(mockSimulation.save).toHaveBeenCalled();
            expect(result.name).toBe(updateData.name);
            expect(result.categoryChanges).toEqual(updateData.categoryChanges);
        });

        it("should throw error when simulation is not found", async () => {
            // Mock findById to return null
            mockFindById.mockResolvedValue(null);

            const updateData = {
                name: "Updated Name",
                categoryChanges: []
            };

            await expect(updateSimulation("non-existent-id", updateData))
                .rejects.toThrow("Simulation not found");
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });
}); 