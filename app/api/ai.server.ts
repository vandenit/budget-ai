import OpenAI from "openai";
import { MonthSummary } from "./budget.server";

export type AIFinancialAnalysis = {
  response: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const filterLastXMonths = (monthSummary: Array<MonthSummary>, x = 4) => {
  return monthSummary.slice(-x);
};

const stripTransactionsOnAllLevels = (monthSummary: Array<MonthSummary>) => {
  return monthSummary.map((month) => {
    return {
      month: month.month,
      isCurrentMonth: month.isCurrentMonth,
      categoryUsage: month.categoryUsages.map((categoryUsage) => {
        return {
          category: categoryUsage.category,
          categoryId: categoryUsage.categoryId,
          amount: categoryUsage.amount,
        };
      }),
    };
  });
};

export async function getAIAnalysis(
  monthSummary: Array<MonthSummary>
): Promise<AIFinancialAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a financial adviser" },
      {
        role: "system",
        content: "The amounts are in euros and need to be diveded by 1000",
      },
      {
        role: "user",
        content: `This is the financial data of the last months ${JSON.stringify(
          stripTransactionsOnAllLevels(filterLastXMonths(monthSummary))
        )}`,
      },
      {
        role: "user",
        content: "What ",
      },
    ],
  });
  return {
    response: response.choices[0].message.content || "",
  };
}
