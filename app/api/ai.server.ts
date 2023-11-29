import OpenAI from "openai";
import { MonthSummary } from "./budget.server";

export type AIFinancialAnalysis = {
  response: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          monthSummary
        )}`,
      },
      {
        role: "user",
        content: "What are your main insights and advices?",
      },
    ],
  });
  return {
    response: response.choices[0].message.content || "",
  };
}
