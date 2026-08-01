import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Le champ prompt est requis.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Clé API Gemini manquante dans l\'environnement Vercel.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `Tu es un expert en motos d'occasion. Analyse l'annonce fournie et réponds strictement sous ce format avec ces balises :
---RESUME_RAPIDE---
[Donne un résumé percutant, points forts/faibles en quelques lignes]
---RAPPORT_DETAILLE---
[Donne un rapport complet, estimation du prix, points de contrôle à vérifier lors de la visite]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return res.status(200).json({ result: response.text });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
}
