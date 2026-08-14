import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // 1. Accepter uniquement les requêtes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { bikeData } = req.body;

        if (!bikeData) {
            return res.status(400).json({ error: 'Données de la moto manquantes' });
        }

        // 2. Initialisation de Gemini avec la clé d'environnement
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

        // 3. Prompt structuré pour l'estimation de vente LeBonCoin
        const prompt = `Tu es un expert en cotation de motos d'occasion et en vente sur LeBonCoin en France.
Un particulier veut vendre sa moto et te demande d'estimer son prix de vente optimal.

Voici les caractéristiques de sa moto :
- Modèle : ${bikeData.model} (${bikeData.year})
- Kilométrage : ${bikeData.mileage}
- Entretien / Suivi : ${bikeData.history}
- État esthétique : ${bikeData.condition}
- Consommables : ${bikeData.wear}
- Options / Équipements : ${bikeData.options}
- Défauts / Frais à prévoir : ${bikeData.defects}

Rédige une réponse claire et structurée EXACTEMENT avec ces deux balises :

---PRIX_VENTE_CONSEILLE---
💶 PRIX D'AFFICHAGE RECOMMANDÉ (LeBonCoin) : [Indique le prix de départ idéal]
🛡️ PRIX PLANCHER DE NÉGOCIATION : [Le prix minimal net vendeur]
📊 FOURCHETTE DU MARCHÉ : [Fourchette constatée sur Leboncoin pour ce modèle/année/km]
⚡ ATTRACTIVITÉ DE LA VENTE : [Élevée / Moyenne / Faible] + Délai de vente estimé.

---CONSEILS_VENTE_LEBONCOIN---
📝 POINTS FORTS À VALORISER : (Les atouts qui justifient le prix)
⚠️ ARGUMENTS DE NÉGOCIATION DES ACHETEURS : (Ce que les acheteurs vont attaquer pour baisser le prix)
💡 ASTUCES D'ANNONCE : (Titre, photos clés, mots-clés à inclure dans le texte)`;

        // 4. Génération de la réponse
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.status(200).json({ result: responseText });

    } catch (error) {
        console.error("Erreur Gemini API:", error);
        return res.status(500).json({ error: error.message || "Erreur lors de l'estimation par l'IA" });
    }
}
