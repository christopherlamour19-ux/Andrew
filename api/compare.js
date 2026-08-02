import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Vérification de la méthode HTTP
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        // 2. Vérification de la clé API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "La variable d'environnement GEMINI_API_KEY est manquante sur le serveur." });
        }

        // 3. Récupération et validation des données
        const { motos } = req.body;
        if (!motos || !Array.isArray(motos) || motos.length < 2) {
            return res.status(400).json({ error: 'Veuillez fournir au moins deux motos à comparer.' });
        }

        // 4. Initialisation de l'IA avec le SDK standard
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        // 5. Création du prompt
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

        // 6. Génération du contenu
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("Erreur critique dans /api/compare:", error);
        return res.status(500).json({ 
            error: error.message || 'Erreur interne du serveur lors de la génération.' 
        });
    }
}
