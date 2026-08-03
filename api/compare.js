import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé API manquante." });

        // Récupération des données envoyées par le front-end pour le duel
        const { moto1, moto2, profile } = req.body;
        if (!moto1 || !moto2) {
            return res.status(400).json({ error: 'Veuillez fournir deux motos à comparer.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Utilisation d'un modèle Gemini stable
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `
        Agis en tant qu'expert motard chevronné. 
        Fais une analyse comparative détaillée sous forme de duel entre ces deux motos :
        - Moto 1 : ${moto1}
        - Moto 2 : ${moto2}
        Profil et utilisation de l'utilisateur : ${profile || "Non précisé"}

        Structure ta réponse en séparant clairement l'analyse de chaque moto pour qu'elle s'intègre parfaitement dans deux blocs distincts.
        Utilise exactement ce format de séparation dans ton texte :

        ---MOTO_1---
        Rédige ici l'analyse complète de la ${moto1} (points forts, points faibles, moteur, comportement, et si elle correspond au profil).

        ---MOTO_2---
        Rédige ici l'analyse complète de la ${moto2} (points forts, points faibles, moteur, comportement, et si elle correspond au profil).
        `;

        const result = await model.generateContent(prompt);
        let text = await result.response.text();
        
        let resultMoto1 = "Analyse non disponible.";
        let resultMoto2 = "Analyse non disponible.";

        // Découpage de la réponse de l'IA pour alimenter les deux blocs séparés du front-end
        if (text.includes("---MOTO_1---") && text.includes("---MOTO_2---")) {
            const parts = text.split("---MOTO_2---");
            resultMoto1 = parts[0].replace("---MOTO_1---", "").trim();
            resultMoto2 = parts[1].trim();
        } else {
            resultMoto1 = text;
        }

        return res.status(200).json({ 
            resultMoto1, 
            resultMoto2 
        });

    } catch (error) {
        console.error("Erreur Duel:", error);
        return res.status(500).json({ error: error.message || 'Erreur serveur.' });
    }
}
