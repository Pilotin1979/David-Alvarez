import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAerodynamics = async (
  imageBase64: string,
  windSpeed: number
): Promise<string> => {
  try {
    // Remove header if present (data:image/png;base64,)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
          {
            text: `You are an expert aerodynamicist. 
            Analyze this wind tunnel visualization. 
            The object is being subjected to a simulated wind speed of ${windSpeed} m/s.
            
            The visualization uses a color scale:
            - RED/YELLOW areas indicate High Pressure (direct impact).
            - BLUE/CYAN areas indicate Low Pressure (wake/shielded).
            
            Please provide:
            1. An assessment of the drag coefficient potential based on the frontal area shown in red.
            2. Identification of problem areas causing excessive resistance.
            3. Specific suggestions to improve the aerodynamic efficiency of this shape.
            
            Keep the response concise and technical but readable. Use Markdown.`
          },
        ],
      },
      config: {
        responseModalities: [Modality.TEXT],
      }
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze the aerodynamics. Please check your API key and internet connection.");
  }
};