import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé API manquante." });

        const { brand, model, year, km, invoice } = req.body;
        if (!brand || !model || !year || !km) {
            return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelAI = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `
        Agis en tant qu'expert en cotation de motos d'occasion sur le marché français (style LeBonCoin / La Centrale).
        Estime la valeur marchande réaliste de cette moto pour une vente rapide et une vente au prix fort sur LeBonCoin :
        - Marque : ${brand}
        - Modèle : ${model}
        - Année : ${year}
        - Kilométrage : ${km} km
        - Historique / Factures : ${invoice}

        Structure ta réponse de manière claire et structurée :
        1. **Fourchette de prix conseillée** sur LeBonCoin (Prix "Achat rapide" et "Prix fort/marché").
        2. **Analyse de la décote** selon le kilométrage et l'année par rapport à sa cote d'origine.
        3. **Impact des factures** sur la valeur et la confiance de l'acheteur.
        4. **Conseils pour rédiger l'annonce** et vendre au meilleur prix rapidement.
        `;

        const result = await modelAI.generateContent(prompt);
        const text = await result.response.text();

        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("Erreur Argus:", error);
        return res.status(500).json({ error: error.message || 'Erreur serveur.' });
    }
}
