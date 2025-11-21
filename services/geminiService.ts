import { GoogleGenAI, Type } from "@google/genai";
import { MathTopic, Question } from "../types";

// Using the specific API key provided
const API_KEY = 'AIzaSyDCo2AQZ51y2WXzhOoUUzZXJebYhXvRCEs';
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateMathQuestion = async (topic: MathTopic, difficulty: number): Promise<Question> => {
  
  // Fallback question in case API fails
  const fallbackQuestion: Question = {
    id: 'fallback-1',
    topic: topic,
    difficulty: difficulty,
    text: '¿Cuál es el resultado de 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    explanation: 'La suma básica de 2 unidades más 2 unidades resulta en 4.'
  };

  const prompt = `
    Actúa como un profesor de matemáticas experto, basándote en el estilo del libro "Álgebra de Baldor".
    Genera un problema matemático de selección múltiple.
    
    Tema: ${topic}
    Nivel de Dificultad (1-5): ${difficulty}
    Público: Estudiantes de secundaria (Grados 6-11).
    
    La salida debe ser JSON puro.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "El enunciado del problema matemático." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "4 opciones de respuesta."
            },
            correctAnswer: { type: Type.STRING, description: "La respuesta correcta exacta (debe coincidir con una de las opciones)." },
            explanation: { type: Type.STRING, description: "Breve explicación paso a paso." }
          },
          required: ["text", "options", "correctAnswer", "explanation"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: Math.random().toString(36).substring(7),
        topic,
        difficulty,
        text: data.text,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation
      };
    }
    return fallbackQuestion;

  } catch (error) {
    console.error("Error generating question:", error);
    return fallbackQuestion;
  }
};