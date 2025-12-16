
import { GoogleGenAI } from "@google/genai";
import { ProjectConfig, SourceType, GeneratedResult, AssetEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectConfig = async (
  config: ProjectConfig, 
  fileList?: string[],
  assets?: AssetEntry[]
): Promise<GeneratedResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const model = "gemini-2.5-flash";

  // Prepare Asset Summary for AI
  let assetInstructions = "No custom icons or splash screens detected. Use default Cordova assets.";
  
  if (assets && assets.length > 0) {
      const androidIcons = assets.filter(a => a.platform === 'android' && (a.assetType === 'icon' || !a.assetType)).map(a => a.name).join(', ');
      const iosIcons = assets.filter(a => a.platform === 'ios' && (a.assetType === 'icon' || !a.assetType)).map(a => a.name).join(', ');
      
      const androidSplash = assets.filter(a => a.platform === 'android' && a.assetType === 'splash').map(a => a.name).join(', ');
      const iosSplash = assets.filter(a => a.platform === 'ios' && a.assetType === 'splash').map(a => a.name).join(', ');

      assetInstructions = `
        CUSTOM ASSETS DETECTED:
        
        ICONS:
        For Android <platform name="android">: Map filenames to density.
        Files: ${androidIcons}
        Example: <icon density="hdpi" src="res/icon/android/mipmap-hdpi.png" />

        For iOS <platform name="ios">: Map filenames to width/height.
        Files: ${iosIcons}
        Example: <icon src="res/icon/ios/icon-60@3x.png" width="180" height="180" />

        SPLASH SCREENS:
        You MUST generate <splash> tags within platform tags.
        
        For Android (inside <platform name="android">):
        Files: ${androidSplash}
        Path: res/screen/android/[filename]
        Logic: Map 'land-hdpi' etc to density="land-hdpi" or "port-hdpi".
        Example: <splash density="land-hdpi" src="res/screen/android/screen-hdpi-landscape.png" />
        
        For iOS (inside <platform name="ios">):
        Files: ${iosSplash}
        Path: res/screen/ios/[filename]
        Logic: Map to src width and height if possible, or use standard Cordova mapping.
        Example: <splash src="res/screen/ios/Default@2x~universal~anyany.png" />
      `;
  }

  const contextPrompt = `
    You are an expert Apache Cordova and Capacitor developer.
    Your task is to generate a 'config.xml' file and analyze project requirements.
    
    User Input:
    - Project Name: ${config.name}
    - Package ID: ${config.id}
    - Version: ${config.version}
    - Description: ${config.description}
    - Source Type: ${config.sourceType}
    - Source Value: ${config.sourceValue}
    - Target Platforms: ${(config.platforms || []).join(', ') || "None selected"}
    - Requested Plugins: ${config.plugins.join(', ') || "None"}
    ${fileList ? `- Detected Files: ${fileList.slice(0, 20).join(', ')}... (truncated)` : ''}

    ${assetInstructions}

    Task 1: Generate a valid, production-ready Cordova 'config.xml'.
    - Include standard preferences (DisallowOverscroll, Orientation, etc.).
    - INCLUDE all 'Requested Plugins' using <plugin name="..." /> tags.
    - GENERATE <platform name="..."> tags for the 'Target Platforms'. 
    - CRITICAL: Use the CUSTOM ASSETS instructions above to generate <icon> and <splash> tags correctly if assets exist.
    - CRITICAL: If plugins require permissions (Camera, Location, etc.), you MUST add <edit-config> blocks for iOS (NS...UsageDescription) and <config-file> for Android Manifest inside the respective platform tags.
    - Ensure the widget id, version, name, and description match the input.

    Task 2: Provide a short analysis (max 3 sentences) suggesting what plugins might be needed.

    Task 3: List specifically what permissions/privacy descriptions were added or are recommended.

    Output Format (JSON):
    {
      "configXml": "string (full xml content)",
      "analysis": "string",
      "permissions": [
        { "platform": "ios" | "android" | "both", "name": "string (e.g. NSCameraUsageDescription)", "reason": "string (why it is needed)" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contextPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const json = JSON.parse(text);
    return {
        configXml: json.configXml || '',
        analysis: json.analysis || '',
        readme: '', // Placeholder
        permissions: json.permissions || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate configuration. Please check your API key.");
  }
};

export const analyzeUrlRequirements = async (url: string, type: SourceType = 'url'): Promise<Partial<ProjectConfig>> => {
    if (!process.env.API_KEY) return {};

    const model = "gemini-2.5-flash";
    const prompt = type === 'github' 
      ? `
          Analyze this GitHub repository URL: "${url}".
          Infer the project Purpose, Name, and suggest a Package ID.
          Output JSON: { "name": string, "id": string, "description": string }
        `
      : `
          Analyze this URL or Project Source: "${url}".
          Suggest a Project Name, a reverse-domain Package ID (e.g., com.example.app), and a short Description for a Cordova wrapper app.
          Output JSON: { "name": string, "id": string, "description": string }
        `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.warn("Auto-fill failed", e);
      return {};
    }
};

export const generateCodeSuggestion = async (
    filename: string, 
    content: string
): Promise<{ explanation: string, code: string }> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");

    const model = "gemini-2.5-flash";
    const prompt = `
        You are a smart coding assistant for a Hybrid Mobile App (Cordova).
        
        File: ${filename}
        Content: 
        \`\`\`
        ${content.substring(0, 3000)} ${content.length > 3000 ? '...(truncated)' : ''}
        \`\`\`

        Your Task:
        Analyze the file content and suggest a single, practical feature addition, improvement, or optimization. 
        Examples: Add a mobile-friendly navbar, add a pull-to-refresh script, fix CSS for responsiveness, or add Cordova device-ready event listener.

        Output JSON:
        {
            "explanation": "Short description of what this feature does (max 1 sentence)",
            "code": "The code snippet to insert or replace"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Gemini Suggestion Error", e);
        throw new Error("Failed to get suggestions");
    }
};
