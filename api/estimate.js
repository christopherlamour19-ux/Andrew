import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
    }

    try {
        // Ta clé API
        const apiKey = "AQ.Ab8RN6Je5vxdnbO1sB69HgQXt-9YYm8VD7posrUsIDhMj1rEUw";

        // Récupération sécurisée du body (évite le crash si body est vide)
        const body = req.body || {};
        
        // Supporte à la fois { bikeData: { ... } } et { model: "...", year: "..." }
        const bike = body.bikeData || body;

        const bikeModel = bike.model || "Modèle non renseigné";
        const year = bike.year || "Non précisée";
        const mileage = bike.mileage || "Non précisé";
        const history = bike.history || "Non précisé";
        const condition = bike.condition || "Non précisé";
        const wear = bike.wear || "Non précisé";
        const options = bike.options || "Aucune";
        const defects = bike.defects || "Aucun";

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const prompt = `
        Agis en tant qu'expert de la cote moto d'occasion en France (Leboncoin, La Centrale).
        Analyse les données suivantes pour estimer le prix de vente d'une moto d'occasion :

        - Modèle : ${bikeModel}
        - Année : ${year}
        - Kilométrage : ${mileage}
        - Historique / Entretien : ${history}
        - État carrosserie : ${condition}
        - Consommables : ${wear}
        - Options : ${options}
        - Défauts : ${defects}

        Structure ta réponse clairement :
        1. Donne la fourchette de prix idéale et le prix conseillé pour une vente rapide.
        2. Donne 3 à 4 conseils clés pour l'annonce Leboncoin pour valoriser la moto.
        `;

        const result = await model.generateContent(prompt);
        const text = await result.response.text();

        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("Erreur Estimation:", error);
        return res.status(500).json({ error: error.message || 'Erreur serveur lors de l\'estimation.' });
    }
}
