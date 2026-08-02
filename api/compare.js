import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "La variable GEMINI_API_KEY est manquante." });
        }

        const { motos } = req.body;
        if (!motos || !Array.isArray(motos) || motos.length < 2) {
            return res.status(400).json({ error: 'Veuillez fournir au moins deux motos.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `
        Agis en tant qu'expert motard. Fais un comparatif technique approfondi entre ces motos (avec leurs années) :
        - ${motos[0]}
        - ${motos[1]}
        ${motos[2] ? `- ${motos[2]}` : ''}

        IMPORTANT : Tu dois structurer l'essentiel de ton comparatif sous la forme d'un **tableau comparatif Markdown** (avec des colonnes pour les critères : Critères, ${motos[0]}, ${motos[1]}${motos[2] ? ', ' + motos[2] : ''}). 
        Critères à inclure dans le tableau : Année, Type de moteur, Puissance, Poids, Hauteur de selle, Points forts, Points faibles, Note globale.
        Ajoute juste en dessous un court paragraphe de verdict final.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return res.status(200).json({ result: response.text() });

    } catch (error) {
        console.error("Erreur:", error);
        return res.status(500).json({ error: error.message || 'Erreur serveur.' });
    }
}
