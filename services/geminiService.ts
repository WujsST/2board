import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BlockData, ChatMessage, RagDocument } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// --- CORE UTILS ---

export const generateImageAsset = async (prompt: string): Promise<string | null> => {
    const ai = getAI();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                     return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Image gen error:", error);
        return null;
    }
}

// --- NEW NODES LOGIC ---

// 1. Audio Transcription
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Audio } },
                    { text: "Please transcribe this audio accurately. Output ONLY the transcription text, no preamble." }
                ]
            }
        });
        return response.text || "(No audio detected)";
    } catch (error) {
        console.error("Transcription error:", error);
        return "Failed to transcribe audio.";
    }
};

// 2. Text Refinement
export const refineText = async (inputText: string, instruction: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
                INPUT TEXT:
                "${inputText}"

                INSTRUCTION:
                ${instruction}

                Execute the instruction on the input text. Output only the result.
            `
        });
        return response.text || "";
    } catch (error) {
        console.error("Refinement error:", error);
        return "Failed to refine text.";
    }
};

// 3. Prompt Enhancement
export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return currentPrompt;

    try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: `
                You are an expert prompt engineer. Improve the following system instruction for an AI agent. 
                Make it more precise, robust, and effective, while keeping the original intent.
                
                ORIGINAL PROMPT: "${currentPrompt}"
                
                Output ONLY the improved prompt text, nothing else.
             `
        });
        return response.text || currentPrompt;
    } catch (error) {
        console.error("Enhance prompt error", error);
        return currentPrompt;
    }
};

// 4. Source Extraction (Web/YouTube) via Search Grounding
export const processUrlSource = async (url: string, type: 'link' | 'youtube'): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    const prompt = type === 'youtube' 
        ? `Analyze this YouTube video URL: ${url}. Provide a detailed summary of the video's transcript and key points.`
        : `Read the content of this website URL: ${url}. Extract the main text and provide a detailed summary of the content.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro for Search capability
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        // Check for grounding metadata to confirm search was used
        const grounding = response.candidates?.[0]?.groundingMetadata;
        let text = response.text || "Could not retrieve content.";
        
        if (grounding && grounding.groundingChunks) {
             text += "\n\n[Source verified via Google Search]";
        }
        
        return text;
    } catch (error) {
        console.error("URL processing error:", error);
        return "Failed to process URL. Ensure it is accessible.";
    }
};

// 5. PDF Processing
export const processPdf = async (base64Pdf: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Flash is great for documents
            contents: {
                parts: [
                    { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
                    { text: "Analyze this PDF document. Extract all text and provide a comprehensive structured summary of its content. Ensure no key information is lost." }
                ]
            }
        });
        return response.text || "Could not extract text from PDF.";
    } catch (error) {
        console.error("PDF processing error:", error);
        return "Failed to process PDF file.";
    }
};

// 6. Contextual Chat
export const chatWithContext = async (history: ChatMessage[], contextText: string, newMessage: string, systemInstruction?: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    const baseInstruction = `
        You are a specialized AI assistant inside a specific node of a workflow.
        You have access ONLY to the data connected to this node (Input Context).
    `;

    const customInstruction = systemInstruction ? `\n\nSPECIFIC ROLE/INSTRUCTION:\n${systemInstruction}` : "";

    const fullInstruction = `
        ${baseInstruction}
        ${customInstruction}
        
        INPUT CONTEXT:
        ${contextText ? contextText : "(No input blocks connected)"}

        Use this context to answer the user's latest message.
    `;

    try {
        let prompt = `System: ${fullInstruction}\n\n`;
        history.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}\n`;
        });
        prompt += `User: ${newMessage}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "I didn't catch that.";
    } catch (error) {
        console.error("Context Chat error:", error);
        return "Error communicating with Gemini.";
    }
};

// 7. RAG Database Query
export const queryRagDatabase = async (history: ChatMessage[], docs: RagDocument[], newMessage: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "Error: API Key missing.";

    // Format the "Knowledge Base"
    const knowledgeBase = docs.map((d, i) => `
    [DOCUMENT ${i+1}]
    Title: ${d.title}
    Type: ${d.type}
    Content: ${d.content}
    -------------------
    `).join('\n');

    const instruction = `
        You are a Retrieval-Augmented Generation (RAG) assistant.
        You have access to a specific Knowledge Base provided below.
        
        RULES:
        1. Answer the user's question using ONLY the information from the [DOCUMENT] sections below.
        2. If the answer is not in the documents, state clearly that the knowledge base does not contain that information.
        3. Cite the document title when providing specific facts (e.g., "According to 'Project Alpha Specs'...").
    `;

    try {
        let prompt = `System: ${instruction}\n\nKNOWLEDGE BASE:\n${knowledgeBase}\n\nCONVERSATION:\n`;
        history.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}\n`;
        });
        prompt += `User: ${newMessage}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Pro for better reasoning over larger context
            contents: prompt,
        });

        return response.text || "No response generated based on this knowledge base.";
    } catch (error) {
        console.error("RAG Query error:", error);
        return "Failed to query the RAG database.";
    }
}

// Legacy global synthesis
export const synthesizeBlocks = async (blocks: BlockData[], promptOverride?: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Error: API Key missing.";

  const context = blocks.map(b => `[Type: ${b.type}] Title: ${b.title || 'Untitled'}\nContent: ${b.content}`).join('\n\n---\n\n');

  const prompt = promptOverride || `
    You are the "Synthesis Engine" of a creative workspace. 
    Analyze the following connected blocks. Find patterns, gaps, or creative strategies connecting them.
    Output a concise, actionable summary or a new creative concept based on this combination.
    Format nicely with markdown.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: `Context:\n${context}\n\nTask:\n${prompt}`,
      config: { thinkingConfig: { thinkingBudget: 1024 } }
    });
    return response.text || "Could not generate synthesis.";
  } catch (error) {
    console.error("Synthesis error:", error);
    return "Failed to synthesize blocks. Please try again.";
  }
};

export const chatWithCanvas = async (history: ChatMessage[], contextBlocks: BlockData[], newMessage: string): Promise<string> => {
     // Re-using logic but for global chat
     const context = contextBlocks.map(b => `[${b.title || b.id}]: ${b.content}`).join('\n');
     return chatWithContext(history, context, newMessage);
};