# simulation improvements
The simulations can be entered from the /predictions web view

# 1. Get rid of hardcoded json files. 
- Store simulations in new mongodb collection connected to the active budget

# 2. category simulations
- support possibility to simulate a category and have the ability to specify a time range. Eg: in April I want to simulate a target amount of 200eur for category restaurants

# main requirements
- easy UX. easy to activate/deactivate compare categories

# Implementation Design (Quick MVP)

## Data Model v1

```typescript
// MongoDB Schema
interface Simulation {
  _id: ObjectId;           
  budgetId: ObjectId;      
  name: string;
  isActive: boolean;
  categoryChanges: {
    categoryId: ObjectId;    
    startDate: Date;
    endDate: Date;
    targetAmount: number;
  }[];
}
```

## API Endpoints v1

```typescript
// SimulationController endpoints
GET    /api/simulations?budgetId=xxx    // List all simulations for budget
POST   /api/simulations                 // Create new simulation
PUT    /api/simulations/:id/active      // Toggle simulation active state

// Request/Response examples:
interface CreateSimulationRequest {
  budgetId: string;
  name: string;
  categoryChanges: {
    categoryId: string;
    startDate: string;     // ISO date string
    endDate: string;       // ISO date string
    targetAmount: number;
  }[];
}

interface SimulationResponse {
  id: string;
  name: string;
  isActive: boolean;
  categoryChanges: {
    categoryId: string;
    startDate: string;
    endDate: string;
    targetAmount: number;
  }[];
}
```

## UI Mockup v1

```
+------------------------------------------------------------------+
|                      Balance Prediction                            |
+------------------------------------------------------------------+
| [+ New Simulation]                                                |
+------------------------------------------------------------------+
|                                                                    |
| SIMULATIONS                  [Interactive Line Chart]              |
| ☑ Current Balance           (Existing chart)                      |
| ☐ Less Restaurants                                               |
|                                                                    |
| [+ Category Change]                                               |
| Category: [Restaurants ▼]                                         |
| Target Amount: [200] EUR                                          |
| Period: [Apr 2024 ▼] to [Jun 2024 ▼]                            |
+------------------------------------------------------------------+
```

## Quick Implementation Steps

1. **Backend (Today)**
   - Create basic MongoDB collection
   - Add simple CRUD endpoints
   - Basic validation

2. **Math API (Today)**
   - Add MongoDB connection
   - Modify prediction to include category target amounts
   - Simple test case

3. **Frontend (Today)**
   - Add simulation toggle to existing chart
   - Simple form to create category simulation
   - Show impact on chart

## Test Plan v1
1. Create a simulation with reduced restaurant expenses
2. Verify it appears in predictions chart
3. Toggle simulation on/off
4. Verify amounts are correctly adjusted


## Extended Data Model

```typescript
// MongoDB Schema
interface Simulation {
  _id: ObjectId;           // Internal MongoDB id
  publicId: string;        // UUID v4 for API exposure
  budgetId: ObjectId;      // Internal reference
  budgetPublicId: string;  // Public budget identifier
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  transactions: TransactionSimulation[];
  categoryChanges: CategorySimulation[];
}

interface TransactionSimulation {
  _id: ObjectId;
  publicId: string;
  date: Date;
  amount: number;
  description: string;
  categoryId?: ObjectId;
  categoryPublicId?: string;
  recurringType?: 'once' | 'monthly' | 'yearly';
  recurringEndDate?: Date;
}

interface CategorySimulation {
  _id: ObjectId;
  publicId: string;
  categoryId: ObjectId;
  categoryPublicId: string;
  startDate: Date;
  endDate: Date;
  targetAmount: number;
  recurringType?: 'once' | 'monthly' | 'yearly';
}
```