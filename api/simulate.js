import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { profile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const { ageRange, height, style, license, budget } = profile || {};

    // Même initialisation exacte que ton fichier analyze.js qui fonctionne
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const simPrompt = `Tu es un conseiller expert en choix de moto. Un utilisateur recherche sa moto idéale selon son profil précis :
    - Tranche d'âge : ${ageRange}
    - Taille : ${height}
    - Style de moto recherché : ${style}
    - Permis : ${license}
    - Budget maximum : ${budget}

    Fournis une recommandation claire et structurée ainsi :
    ---MOTO_IDEALE---
    - 🏍️ Modèle conseillé : (Nom exact de la moto, année, cylindrée)
    - 💡 Pourquoi ce choix : (Explique en quelques lignes pourquoi elle correspond à son style ${style}, sa taille, son permis ${license} et son budget)
    - 🛡️ Assurance & Conso : (Analyse rapide de l'assurance pour son profil et la consommation réelle)
    - ⚠️ Points de vigilance : (Les pièges ou défauts connus de ce modèle à surveiller)
    - 🔍 Recherche photo : Donne un terme de recherche précis en anglais pour trouver une belle photo de cette moto (ex: "Yamaha MT-07 2022 studio shot") sur une ligne commençant par PHOTO_QUERY: [ton terme ici].`;

    const result = await model.generateContent(simPrompt);
    const text = result.response.text();

    let photoQuery = "motorcycle studio";
    const queryMatch = text.match(/PHOTO_QUERY:\s*(.*)/);
    if (queryMatch) {
      photoQuery = queryMatch[1].trim();
    }

    const encodedQuery = encodeURIComponent(photoQuery);
    const motoImageUrl = `https://pollinations.ai/p/${encodedQuery}?width=800&height=500&nologo=true`;

    return res.status(200).json({ 
      result: text, 
      imageUrl: motoImageUrl 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de la simulation." });
  }
}
