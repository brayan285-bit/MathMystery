import { GoogleGenAI, Type } from "@google/genai";
import { MathTopic, Question, SearchResult } from "../types";

// Using the specific API key provided via environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Local Fallback Questions Bank ---
// Used when API quota is exceeded (Error 429) or offline
const LOCAL_QUESTIONS: Record<MathTopic, Question[]> = {
  [MathTopic.ALGEBRA]: [
    {
      id: 'alg-fallback-1',
      topic: MathTopic.ALGEBRA,
      difficulty: 1,
      text: 'Si 2x = 10, ¿cuál es el valor de x?',
      options: ['2', '5', '10', '20'],
      correctAnswer: '5',
      explanation: 'Dividiendo ambos lados por 2, obtenemos x = 5.'
    },
    {
      id: 'alg-fallback-2',
      topic: MathTopic.ALGEBRA,
      difficulty: 2,
      text: 'Simplifica la expresión: 3a + 2a - a',
      options: ['4a', '5a', '3a', 'a'],
      correctAnswer: '4a',
      explanation: 'Sumamos coeficientes: 3 + 2 - 1 = 4. Resultado: 4a.'
    },
    {
      id: 'alg-fallback-3',
      topic: MathTopic.ALGEBRA,
      difficulty: 1,
      text: '¿Cuál es el valor de x en x + 5 = 12?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '7',
      explanation: 'Restando 5 a ambos lados: x = 12 - 5 = 7.'
    }
  ],
  [MathTopic.GEOMETRY]: [
    {
      id: 'geo-fallback-1',
      topic: MathTopic.GEOMETRY,
      difficulty: 1,
      text: '¿Cuántos grados suman los ángulos internos de un triángulo?',
      options: ['90°', '180°', '360°', '270°'],
      correctAnswer: '180°',
      explanation: 'La suma de los ángulos internos de cualquier triángulo siempre es 180 grados.'
    },
    {
      id: 'geo-fallback-2',
      topic: MathTopic.GEOMETRY,
      difficulty: 1,
      text: '¿Cómo se llama un polígono de 5 lados?',
      options: ['Cuadrado', 'Hexágono', 'Pentágono', 'Triángulo'],
      correctAnswer: 'Pentágono',
      explanation: 'Penta significa cinco y gono significa ángulo/lado.'
    }
  ],
  [MathTopic.CALCULUS]: [
    {
      id: 'calc-fallback-1',
      topic: MathTopic.CALCULUS,
      difficulty: 1,
      text: '¿Cuál es la derivada de una constante (ej: f(x) = 5)?',
      options: ['0', '1', 'x', '5'],
      correctAnswer: '0',
      explanation: 'La derivada representa la tasa de cambio. Una constante no cambia, por lo tanto su derivada es 0.'
    },
    {
      id: 'calc-fallback-2',
      topic: MathTopic.CALCULUS,
      difficulty: 2,
      text: '¿Cuál es el límite de 1/x cuando x tiende a infinito?',
      options: ['Infinito', '1', '0', 'Indefinido'],
      correctAnswer: '0',
      explanation: 'Al dividir 1 entre un número extremadamente grande, el resultado se acerca cada vez más a 0.'
    }
  ],
  [MathTopic.STATISTICS]: [
    {
      id: 'stat-fallback-1',
      topic: MathTopic.STATISTICS,
      difficulty: 1,
      text: 'En el conjunto {2, 4, 6}, ¿cuál es la media (promedio)?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'La suma es 12. Dividido entre 3 elementos, el promedio es 4.'
    },
    {
      id: 'stat-fallback-2',
      topic: MathTopic.STATISTICS,
      difficulty: 1,
      text: '¿Cuál es la moda en el conjunto {1, 2, 2, 3, 4}?',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      explanation: 'La moda es el valor que más se repite en un conjunto de datos.'
    }
  ],
  [MathTopic.TRIGONOMETRY]: [
    {
      id: 'trig-fallback-1',
      topic: MathTopic.TRIGONOMETRY,
      difficulty: 1,
      text: '¿A qué equivale sen(30°)?',
      options: ['0.5', '1', '0', '0.866'],
      correctAnswer: '0.5',
      explanation: 'El seno de 30 grados es exactamente un medio (0.5).'
    },
    {
      id: 'trig-fallback-2',
      topic: MathTopic.TRIGONOMETRY,
      difficulty: 1,
      text: '¿Cuál es la relación trigonométrica opuesto/hipotenusa?',
      options: ['Seno', 'Coseno', 'Tangente', 'Secante'],
      correctAnswer: 'Seno',
      explanation: 'El Seno se define como la longitud del cateto opuesto dividida por la hipotenusa.'
    }
  ]
};

export const generateMathQuestion = async (topic: MathTopic, difficulty: number): Promise<Question> => {
  
  const getRandomFallback = () => {
    const fallbacks = LOCAL_QUESTIONS[topic] || [];
    // Fallback genérico si no hay preguntas para el tema específico
    const fallback = fallbacks.length > 0 
        ? fallbacks[Math.floor(Math.random() * fallbacks.length)]
        : {
            id: 'fallback-generic',
            topic: topic,
            difficulty: difficulty,
            text: '¿Cuál es el resultado de 5 x 5?',
            options: ['10', '20', '25', '55'],
            correctAnswer: '25',
            explanation: 'La multiplicación de 5 por 5 es 25.'
        };
    // Ensure unique ID for React keys
    return { ...fallback, id: `${fallback.id}-${Date.now()}` };
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
    console.warn("Empty response from AI, using fallback.");
    return getRandomFallback();

  } catch (error: any) {
    // Handle Quota Exceeded (429) specifically
    if (error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn("Gemini API Quota Exceeded. Using local fallback questions.");
    } else {
        console.error("Error generating question:", error);
    }
    return getRandomFallback();
  }
};

// --- Feature: Search Grounding (Oráculo Matemático) ---
export const searchMathConcept = async (query: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Investiga y explica brevemente para un estudiante: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
        return null;
      })
      .filter((s: any) => s !== null) || [];

    return {
      text: response.text || "No pude encontrar información al respecto.",
      sources: sources as { uri: string; title: string }[]
    };
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
         return { text: "El oráculo está descansando (Límite de uso alcanzado). Intenta más tarde.", sources: [] };
    }
    console.error("Search error:", error);
    return { text: "El oráculo está nublado temporalmente.", sources: [] };
  }
};

// --- Feature: Thinking Mode (Sabio Matemático) ---
export const askMathSage = async (query: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Eres un sabio matemático profundo. Analiza cuidadosamente, razona paso a paso y explica detalladamente este concepto o problema: ${query}`,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768 // Max budget for deep reasoning
        }
      }
    });

    return {
      text: response.text || "El sabio meditó profundamente pero no encontró palabras.",
      sources: [] // Thinking models primarily generate reasoning, not external sources
    };
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return { text: "El sabio ha agotado su energía por hoy. Vuelve mañana.", sources: [] };
    }
    console.error("Thinking error:", error);
    return { text: "El proceso de pensamiento profundo encontró un obstáculo. Intenta reformular tu consulta.", sources: [] };
  }
};

// --- Feature: Fast AI Responses (Pistas Rápidas) ---
export const getFastHint = async (questionText: string): Promise<string> => {
  try {
    // Uses gemini-2.5-flash-lite for low latency
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Eres un tutor amable. Da una pista muy breve (máximo 20 palabras) para resolver esto SIN dar la respuesta directa: "${questionText}"`,
    });
    return response.text || "Intenta descomponer el problema.";
  } catch (error) {
    return "Revisa las fórmulas básicas del tema.";
  }
};