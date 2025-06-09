import connectDb from '../data/db';
import mongoose from 'mongoose';

/**
 * Schema for payee mappings stored in MongoDB
 */
const PayeeMappingSchema = new mongoose.Schema({
  budgetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  payeeName: { type: String, required: true },
  categoryName: { type: String, required: true },
  confidence: { type: Number, default: 1.0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create compound index for efficient lookups
PayeeMappingSchema.index({ budgetId: 1, payeeName: 1 });

const PayeeMapping = mongoose.model('PayeeMapping', PayeeMappingSchema);

/**
 * Service for managing payee to category mappings
 * Handles learning from user categorizations
 */
export class PayeeMappingsService {
  private budgetId: mongoose.Types.ObjectId;

  constructor(budgetId: string) {
    this.budgetId = new mongoose.Types.ObjectId(budgetId);
  }

  /**
   * Learn from a transaction categorization
   */
  public async learnFromTransaction(
    payeeName: string,
    categoryName: string,
    confidence: number = 1.0
  ): Promise<void> {
    await connectDb();

    try {
      // Update existing mapping or create new one
      await PayeeMapping.findOneAndUpdate(
        {
          budgetId: this.budgetId,
          payeeName: payeeName,
        },
        {
          categoryName: categoryName,
          confidence: confidence,
          updatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log(`Learned mapping: ${payeeName} -> ${categoryName}`);
    } catch (error) {
      console.error('Error learning from transaction:', error);
      throw error;
    }
  }

  /**
   * Get category suggestion for a payee based on learned mappings
   */
  public async getSuggestionForPayee(payeeName: string): Promise<string | null> {
    await connectDb();

    try {
      const mapping = await PayeeMapping.findOne({
        budgetId: this.budgetId,
        payeeName: payeeName,
      }).sort({ confidence: -1, updatedAt: -1 });

      return mapping?.categoryName || null;
    } catch (error) {
      console.error('Error getting suggestion for payee:', error);
      return null;
    }
  }

  /**
   * Get all mappings for this budget as context for AI prompts
   */
  public async getMappingsForPrompt(): Promise<string> {
    await connectDb();

    try {
      const mappings = await PayeeMapping.find({
        budgetId: this.budgetId,
      })
        .sort({ confidence: -1, updatedAt: -1 })
        .limit(20); // Limit to most relevant mappings

      if (mappings.length === 0) {
        return '';
      }

      const mappingStrings = mappings.map(
        mapping => `${mapping.payeeName} -> ${mapping.categoryName}`
      );

      return `\nPrevious categorizations:\n${mappingStrings.join('\n')}\n`;
    } catch (error) {
      console.error('Error getting mappings for prompt:', error);
      return '';
    }
  }

  /**
   * Get mapping statistics for a budget
   */
  public async getMappingStats(): Promise<{
    totalMappings: number;
    recentMappings: number;
    topPayees: Array<{ payeeName: string; categoryName: string; count: number }>;
  }> {
    await connectDb();

    try {
      const totalMappings = await PayeeMapping.countDocuments({
        budgetId: this.budgetId,
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentMappings = await PayeeMapping.countDocuments({
        budgetId: this.budgetId,
        updatedAt: { $gte: oneWeekAgo },
      });

      // Get top payees by frequency
      const topPayees = await PayeeMapping.aggregate([
        { $match: { budgetId: this.budgetId } },
        {
          $group: {
            _id: { payeeName: '$payeeName', categoryName: '$categoryName' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            payeeName: '$_id.payeeName',
            categoryName: '$_id.categoryName',
            count: 1,
            _id: 0,
          },
        },
      ]);

      return {
        totalMappings,
        recentMappings,
        topPayees,
      };
    } catch (error) {
      console.error('Error getting mapping stats:', error);
      throw error;
    }
  }

  /**
   * Clear all mappings for a budget (for testing/reset purposes)
   */
  public async clearAllMappings(): Promise<void> {
    await connectDb();

    try {
      await PayeeMapping.deleteMany({
        budgetId: this.budgetId,
      });

      console.log(`Cleared all mappings for budget ${this.budgetId}`);
    } catch (error) {
      console.error('Error clearing mappings:', error);
      throw error;
    }
  }

  /**
   * Delete a specific mapping
   */
  public async deleteMapping(payeeName: string): Promise<boolean> {
    await connectDb();

    try {
      const result = await PayeeMapping.deleteOne({
        budgetId: this.budgetId,
        payeeName: payeeName,
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting mapping:', error);
      throw error;
    }
  }

  /**
   * Search mappings by payee name pattern
   */
  public async searchMappings(searchTerm: string): Promise<Array<{
    payeeName: string;
    categoryName: string;
    confidence: number;
    updatedAt: Date;
  }>> {
    await connectDb();

    try {
      const mappings = await PayeeMapping.find({
        budgetId: this.budgetId,
        payeeName: { $regex: searchTerm, $options: 'i' },
      })
        .sort({ confidence: -1, updatedAt: -1 })
        .limit(50);

      return mappings.map(mapping => ({
        payeeName: mapping.payeeName,
        categoryName: mapping.categoryName,
        confidence: mapping.confidence,
        updatedAt: mapping.updatedAt,
      }));
    } catch (error) {
      console.error('Error searching mappings:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create PayeeMappingsService instance
 */
export const createPayeeMappingsService = (budgetId: string): PayeeMappingsService => {
  return new PayeeMappingsService(budgetId);
};
