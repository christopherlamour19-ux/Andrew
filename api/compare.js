import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { motos } = req.body;

        if (!motos || motos.length < 2) {
            return res.status(400).json({ error: 'Veuillez fournir au moins deux motos à comparer.' });
        }

        const prompt = `
        Agis en tant qu'expert motard passionné et analyste technique pour RadarMoto. 
        Fais un comparatif technique, esthétique, et d'usage détaillé, structuré et percutant entre les motos suivantes (en tenant compte de leurs années respectives) :
        - ${motos[0]}
        - ${motos[1]}
        ${motos[2] ? `- ${motos[2]}` : ''}

        Structure ta réponse en français de manière claire et lisible avec :
        1. Un résumé rapide du duel / match.
        2. Les points forts et faiblesses de chaque modèle (selon son année).
        3. Le comparatif des performances (moteur, poids, partie cycle, technologie).
        4. Le verdict final / laquelle choisir selon le profil du pilote.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return res.status(200).json({ result: response.text });

    } catch (error) {
        console.error("Erreur API Compare:", error);
        return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
    }
}