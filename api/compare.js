import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    // Autoriser uniquement les requêtes POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        // Récupération des données envoyées par le front
        const { motos } = req.body;

        if (!motos || !Array.isArray(motos) || motos.length < 2) {
            return res.status(400).json({ error: 'Veuillez fournir au moins deux motos à comparer.' });
        }

        // Initialisation de l'IA (vérifie que ta variable d'environnement GEMINI_API_KEY est bien configurée sur Vercel)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
        Agis en tant qu'expert motard passionné et analyste technique. 
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
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        // S'assurer de renvoyer du JSON valide
        return res.status(200).json({ result: response.text });

    } catch (error) {
        console.error("Erreur détaillée dans /api/compare:", error);
        return res.status(500).json({ 
            error: error.message || 'Erreur interne du serveur lors de la génération du comparatif.' 
        });
    }
}
