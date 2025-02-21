# Predictions Page

## Current Status
- Balance prediction graph only visible on budget overview page
- Graph is relatively small and shares space with other components
- Future changes (salary, fixed costs etc.) are not clearly visible
- Limited interaction possibilities with the graph

## Wanted Status
- Dedicated predictions page for each budget
- Large, interactive graph utilizing full width
- Table view of future changes (similar to transactions page):
  - Date
  - Description
  - Amount
  - Type (income/expense)
  - Balance impact
- Ability to select different time periods
- Option to filter specific categories

## Implementation Steps
1. Create new route: `/budgets/[budget_id]/predictions`
2. Create predictions page component:
   ```tsx
   // Layout structure
   <div>
     <PredictionGraph />
     <FutureChangesTable changes={predictionData.changes} />
   </div>
   ```
3. Adapt graph component:
   - Use full width
   - Add zoom/pan controls
   - Improve tooltips
4. Create table component for future changes:
   - Reuse transactions table styling
   - Date-based sorting
   - Filtering options
   - Group changes by date
   - Show running balance
5. Add navigation from budget overview

## Technical Decisions
- Reuse existing transactions table styling for consistency
- Adjust Chart.js configuration for larger display
- Share TypeScript types between components
- Apply responsive design principles
- **Reuse existing `/balance-prediction/data` endpoint** which already provides all necessary data:
  ```typescript
  type PredictionData = {
    [simulationName: string]: {
      [date: string]: {
        balance: number;
        balance_diff: number;
        changes: Array<{
          amount: number;
          category: string;
          reason: string;
          is_simulation?: boolean;
          memo?: string;
        }>;
      };
    };
  };
  ```

## First Milestone
1. [ ] Route and basic page structure
2. [ ] Large graph implementation
3. [ ] Basic table for future changes
4. [ ] Navigation from budget overview

## Impact
- Better visualization of financial predictions
- More insight into future changes
- Improved user experience
- Reuse of existing components

## Dependencies
- Existing transactions page components
- Math API predictions endpoint
- Budget routes and authentication
- Chart.js library

## UX Navigation Flow
1. From Budget Overview:
   - Add "View Details" button next to the prediction chart title
   - Add "Predictions" tab in the main navigation menu
   - Add "📈" icon button in the chart corner for quick access

2. Interactive Elements:
   ```tsx
   // In MonthTotalOverview component
   <div className="flex justify-between items-center mb-4">
     <h2>Balance Prediction</h2>
     <Link 
       href={`/budgets/${budgetUuid}/predictions`}
       className="btn btn-primary btn-sm"
     >
       View Details
     </Link>
   </div>
   ```

3. Visual Feedback:
   - Highlight the prediction section on hover
   - Add tooltip: "Click for detailed predictions"
   - Smooth transition animation when switching views

4. Mobile Considerations:
   - Full-width tap target for better accessibility
   - Bottom navigation bar option for quick access
   - Swipe gestures for chart interaction

## Development Practices
- Test responsive design on various screen sizes
- Check accessibility for graph and table
- Performance optimization for large datasets
- Unit tests for new components 