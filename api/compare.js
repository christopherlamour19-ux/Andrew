import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé API manquante." });

        const { motos } = req.body;
        if (!motos || !Array.isArray(motos) || motos.length < 2) {
            return res.status(400).json({ error: 'Veuillez fournir au moins deux motos.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        // On demande à l'IA de répondre STRICTEMENT au format JSON
        const prompt = `
        Agis en tant qu'expert motard. Compare ces motos : ${motos.join(', ')}.
        Tu dois retourner EXCLUSIVEMENT un objet JSON valide (sans texte autour, sans markdown \`\`\`json) avec cette structure exacte :
        {
          "motos": [
            {
              "nom": "Nom et année de la moto 1",
              "prixEstime": "ex: ~8 500 €",
              "moteur": "ex: 4 cylindres en ligne, 599cc",
              "puissance": "ex: 120 ch",
              "poids": "ex: 184 kg",
              "hauteurSelle": "ex: 810 mm",
              "pointsForts": "ex: Moteur rageur dans les tours, partie cycle incisive",
              "pointsFaibles": "ex: Creux à bas régimes, confort ferme",
              "verdict": "Excellente sur piste et sportive sur route."
            }
          ]
        }
        Remplis les données pour les ${motos.length} motos fournies.
        `;

        const result = await model.generateContent(prompt);
        let text = responseTextClean(await result.response.text());
        
        // Nettoyage au cas où l'IA met des balises markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonData = JSON.parse(text);
        return res.status(200).json(jsonData);

    } catch (error) {
        console.error("Erreur:", error);
        return res.status(500).json({ error: error.message || 'Erreur serveur.' });
    }
}

function responseTextClean(text) { return text; }
