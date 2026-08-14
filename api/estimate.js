const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    // 1. Accepter uniquement les requêtes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { bikeData } = req.body || {};

        if (!bikeData) {
            return res.status(400).json({ error: 'Données de la moto manquantes.' });
        }

        // 2. Vérification de la clé API Gemini
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'La clé GEMINI_API_KEY est introuvable sur le serveur.' });
        }

        // 3. Initialisation du SDK Google Gen AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

        // 4. Prompt calibré pour correspondre aux balises de ton index.html
        const prompt = `Tu es un expert reconnu en cotation et estimation de prix de vente de motos d'occasion sur Leboncoin en France.

Analyse précisément la moto suivante :
- Modèle : ${bikeData.model} (${bikeData.year})
- Kilométrage : ${bikeData.mileage}
- Entretien / Suivi : ${bikeData.history}
- État esthétique : ${bikeData.condition}
- État des consommables : ${bikeData.wear}
- Équipements / Options : ${bikeData.options}
- Défauts / Frais à prévoir : ${bikeData.defects}

Rédige une réponse structurée en utilisant EXACTEMENT les deux balises ci-dessous pour séparer les parties :

---PRIX_VENTE_CONSEILLE---
💶 PRIX D'AFFICHAGE RECOMMANDÉ (Leboncoin) : [Indique le prix de départ idéal]
🛡️ PRIX PLANCHER DE NÉGOCIATION : [Le prix minimal net vendeur]
📊 FOURCHETTE DU MARCHÉ : [Prix bas - Prix haut constatés sur Leboncoin pour ce modèle/année/km]
⚡ ATTRACTIVITÉ DE LA VENTE : [Élevée / Moyenne / Faible] + Délai de vente estimé.

---CONSEILS_VENTE_LEBONCOIN---
📝 POINTS FORTS À VALORISER DANS L'ANNONCE :
- Atout 1
- Atout 2

⚠️ ARGUMENTS DE NÉGOCIATION DES ACHETEURS (Points faibles) :
- Argument 1
- Argument 2

💡 ASTUCES D'ANNONCE (Titre, photos clés, conseils de rédaction) :
- Astuce 1
- Astuce 2`;

        // 5. Génération et renvoi du résultat
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.status(200).json({ result: responseText });

    } catch (error) {
        console.error("Erreur serveur estimate.js :", error);
        return res.status(500).json({ error: error.message || "Erreur lors de la génération d'estimation." });
    }
};
