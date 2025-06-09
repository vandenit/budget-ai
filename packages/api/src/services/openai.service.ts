import OpenAI from 'openai';

/**
 * OpenAI service for AI-powered transaction categorization
 */
export class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize OpenAI client with API key from environment
   */
  private initializeClient(): void {
    const apiKey = process.env.AI_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI suggestions will not be available.');
      return;
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Check if OpenAI client is available
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Suggest a category for a single transaction using OpenAI
   */
  public async suggestCategory(
    transaction: {
      payee_name: string;
      amount: number;
      date: string;
    },
    categories: Array<{ name: string }>,
    mappingsContext: string = ''
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    const categoryNames = categories.map(cat => cat.name).join(', ');
    
    const prompt = `
    Suggest the most suitable category for the following transaction based on these available categories: ${categoryNames}.
    Special cases:
    - 'Afrekening op" means KBC credit.
    - Kbc business => Unexpected
    - Ava => Unexpected
    ${mappingsContext}
    Transaction Details:
    - Description: ${transaction.payee_name}
    - Amount: ${transaction.amount}
    - Date: ${transaction.date}

    Return only the name of the category.
    `;

    console.log('OpenAI prompt:', prompt);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const suggestedCategory = response.choices[0]?.message?.content?.trim();
    
    if (!suggestedCategory) {
      throw new Error('No suggestion received from OpenAI');
    }

    console.log('OpenAI suggestion:', suggestedCategory);
    return suggestedCategory;
  }

  /**
   * Create batch tasks for multiple transaction categorizations
   */
  public createBatchTasks(
    transactions: Array<{
      id: string;
      payee_name: string;
      amount: number;
      date: string;
    }>,
    categories: Array<{ name: string }>,
    mappingsContext: string = ''
  ): Array<any> {
    const categoryNames = categories.map(cat => cat.name).join(', ');
    
    const tasks = transactions.map((transaction, index) => {
      const prompt = `
        Suggest the most suitable category for the following transaction based on these available categories: ${categoryNames}.
        Special cases:
        - 'Afrekening op" means KBC credit.
        - Kbc business => Unexpected
        - Ava => Unexpected
        ${mappingsContext}
        Transaction Details:
        - Description: ${transaction.payee_name}
        - Amount: ${transaction.amount}
        - Date: ${transaction.date}

        Return only the name of the category.
        `;
      
      return {
        custom_id: `transaction-${transaction.id}-${index}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
      };
    });

    return tasks;
  }

  /**
   * Submit a batch job to OpenAI
   */
  public async submitBatchJob(
    tasks: Array<any>,
    jobDescription: string = 'Transaction categorization'
  ): Promise<any> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    // Create JSONL content in memory
    const jsonlContent = tasks.map(task => JSON.stringify(task)).join('\n');
    
    // Convert to buffer for file upload
    const jsonlBuffer = Buffer.from(jsonlContent, 'utf-8');
    
    try {
      // Upload the file
      const batchFile = await this.client.files.create({
        file: new File([jsonlBuffer], `batch_tasks_${Date.now()}.jsonl`, {
          type: 'application/jsonl',
        }),
        purpose: 'batch',
      });

      // Create the batch job
      const batchJob = await this.client.batches.create({
        input_file_id: batchFile.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
        metadata: {
          description: jobDescription,
        },
      });

      console.log(`Batch job created with ID: ${batchJob.id}`);
      return batchJob;
    } catch (error) {
      console.error('Error creating batch job:', error);
      throw error;
    }
  }

  /**
   * Get batch job status and results
   */
  public async getBatchJobStatus(batchId: string): Promise<any> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    try {
      const batch = await this.client.batches.retrieve(batchId);
      return batch;
    } catch (error) {
      console.error('Error retrieving batch job:', error);
      throw error;
    }
  }

  /**
   * Process batch job results
   */
  public async processBatchResults(batchId: string): Promise<Array<any>> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    try {
      const batch = await this.client.batches.retrieve(batchId);
      
      if (batch.status !== 'completed' || !batch.output_file_id) {
        throw new Error(`Batch job not completed. Status: ${batch.status}`);
      }

      const file = await this.client.files.content(batch.output_file_id);
      const fileContent = await file.text();
      
      // Parse JSONL results
      const results = fileContent
        .trim()
        .split('\n')
        .map(line => JSON.parse(line));

      return results;
    } catch (error) {
      console.error('Error processing batch results:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
