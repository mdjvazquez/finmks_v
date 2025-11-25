import { GoogleGenAI, Type } from "@google/genai";
import {
  Transaction,
  ActivityGroup,
  TransactionType,
  AccountType,
  ReportType,
  TransactionStatus,
  FinancialRatio,
} from "../types";

// Initialize the client. The API_KEY is injected by the environment.
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_KEY,
});

/**
 * Analyzes a receipt image to extract transaction details.
 */
export const analyzeReceiptImage = async (
  base64Image: string
): Promise<Partial<Transaction>> => {
  try {
    const modelId = "gemini-3-pro-preview";

    const prompt = `
      Analyze this image of a financial receipt or invoice. 
      Extract the following information:
      1. Total Amount (number only)
      2. Date (ISO 8601 format YYYY-MM-DD)
      3. Due Date (ISO 8601 format YYYY-MM-DD) - if visible, otherwise null.
      4. Description (Brief summary of items)
      5. Suggest the Activity Group (OPERATING, INVESTING, FINANCING).
      6. Suggest Account Type: 
         - 'RECEIVABLE' if it's an invoice sent to a client.
         - 'PAYABLE' if it's a bill to be paid later.
         - 'CASH' if it's a receipt for immediate payment.
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING },
            group: {
              type: Type.STRING,
              enum: ["OPERATING", "INVESTING", "FINANCING"],
            },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            accountType: {
              type: Type.STRING,
              enum: ["CASH", "PAYABLE", "RECEIVABLE"],
            },
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);

      return {
        amount: data.amount,
        date: data.date,
        dueDate: data.dueDate || undefined,
        description: data.description,
        group: data.group as ActivityGroup,
        type: (data.type as TransactionType) || TransactionType.EXPENSE,
        accountType: data.accountType as AccountType,
        status:
          data.accountType === "PAYABLE" || data.accountType === "RECEIVABLE"
            ? TransactionStatus.PENDING
            : TransactionStatus.PAID,
      };
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};

/**
 * Generates qualitative analysis based on calculated data and ratios.
 */
export const generateReportAnalysis = async (
  reportType: ReportType,
  reportData: any,
  calculatedRatios: FinancialRatio[],
  language: "EN" | "ES"
): Promise<{ analysis: string; ratios: FinancialRatio[] }> => {
  try {
    const modelId = "gemini-3-pro-preview";

    const langInstruction =
      language === "ES" ? "Respond in Spanish." : "Respond in English.";

    const prompt = `
            Act as a Chief Financial Officer (CFO). ${langInstruction}
            
            I have generated a ${reportType}. 
            Here is the financial data summary:
            ${JSON.stringify(reportData, null, 2)}

            Here are the calculated Key Financial Ratios:
            ${JSON.stringify(calculatedRatios, null, 2)}

            Task:
            1. Review the provided ratios. 
            2. For each ratio provided, write a concise 1-sentence analysis of what this specific value indicates for the business health.
            3. Provide a professional executive summary (1 paragraph) of the overall financial health based on this data.
            
            IMPORTANT: 
            - Do NOT modify the 'value' field of the ratios. Keep the original calculated number/string exactly as is.
            - Do NOT modify the 'name' field.
            - Only populate the 'analysis' field.
            
            Return JSON format matching the schema.
        `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            ratios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.STRING }, // Keeping as string to allow formatting like "10%" or "1.5x"
                  analysis: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Failed to generate analysis");
  } catch (error) {
    console.error("Error generating report analysis:", error);
    // Return original ratios without analysis if AI fails
    return {
      analysis:
        "Could not generate AI analysis at this time. Displaying raw calculated data.",
      ratios: calculatedRatios.map((r) => ({
        ...r,
        analysis: r.analysis || "Analysis unavailable.",
      })),
    };
  }
};
