
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectConfig, SourceType, GeneratedResult, AssetEntry } from "../types";

export const generateProjectConfig = async (
  config: ProjectConfig, 
  fileList?: string[],
  assets?: AssetEntry[]
): Promise<GeneratedResult> => {
  if (!process.env.API_KEY) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";

  let assetInstructions = "No custom icons or splash screens detected. Use default Cordova assets.";
  if (assets && assets.length > 0) {
      const androidIcons = assets.filter(a => a.platform === 'android' && (a.assetType === 'icon' || !a.assetType)).map(a => a.name).join(', ');
      const iosIcons = assets.filter(a => a.platform === 'ios' && (a.assetType === 'icon' || !a.assetType)).map(a => a.name).join(', ');
      assetInstructions = `CUSTOM ASSETS: Android(${androidIcons}), iOS(${iosIcons})`;
  }

  const contextPrompt = `Generate Cordova config.xml for ${config.name}. ID: ${config.id}. Desc: ${config.description}. Plugins: ${config.plugins.join(', ')}. ${assetInstructions}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contextPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            configXml: { type: Type.STRING },
            analysis: { type: Type.STRING },
            permissions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["platform", "name", "reason"]
              }
            }
          },
          required: ["configXml", "analysis", "permissions"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
        configXml: json.configXml || '',
        analysis: json.analysis || '',
        readme: '', 
        permissions: json.permissions || []
    };
  } catch (error) {
    throw new Error("Gemini generation failed");
  }
};

export const generateAppIcon = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Gunakan gemini-2.5-flash-image untuk generate gambar
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Generate a professional, minimalist app icon for a mobile application. Prompt: ${prompt}. Solid background, modern design style, no text if possible.` }] }],
        config: {
            imageConfig: { aspectRatio: "1:1" }
        }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data returned from AI");
};

export const analyzeUrlRequirements = async (url: string, type: SourceType = 'url'): Promise<Partial<ProjectConfig>> => {
    if (!process.env.API_KEY) return {};
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-flash-preview";
    const prompt = `Analyze: "${url}". Output JSON: { "name": string, "id": string, "description": string }`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              id: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "id", "description"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
};

export const generateCodeSuggestion = async (filename: string, content: string): Promise<{ explanation: string, code: string }> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-pro-preview";
    const prompt = `Analyze file ${filename} and suggest improvement. JSON: { "explanation": string, "code": string }`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
};
