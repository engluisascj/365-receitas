import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

// Assume process.env.API_KEY is configured in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export const analyzeImageForCalories = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    
    const prompt = `
      Analise os alimentos nesta imagem. O usuário segue uma dieta sem açúcar, sem glúten e sem lactose. 
      Para cada item alimentar que você identificar, estime o tamanho da porção e a contagem de calorias.
      Forneça uma contagem total de calorias estimada para a refeição inteira.
      Sua resposta deve ser um objeto JSON válido.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [imagePart, { text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    totalCalories: {
                        type: Type.NUMBER,
                        description: "O total de calorias estimadas para a refeição inteira.",
                    },
                    items: {
                        type: Type.ARRAY,
                        description: "Uma lista de itens alimentares identificados na refeição.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: {
                                    type: Type.STRING,
                                    description: "O nome do item alimentar.",
                                },
                                calories: {
                                    type: Type.NUMBER,
                                    description: "As calorias estimadas para este item alimentar.",
                                },
                            },
                            required: ["name", "calories"],
                        },
                    },
                },
                required: ["totalCalories", "items"],
            },
        },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (
        typeof result.totalCalories !== 'number' || 
        !Array.isArray(result.items)
    ) {
        throw new Error("Formato de resposta inválido da API");
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error("Erro ao analisar a imagem:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao analisar a imagem: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido durante a análise da imagem.");
  }
};