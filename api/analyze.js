import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { type, content, profile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash'' });

    let prompt = "";

    if (type === 'ad') {
      prompt = `Tu es un expert en inspection et cotation de motos d'occasion. Analyse cette annonce : "${content}".
      Fournis une analyse claire, détaillée mais présentée sous un format simple et lisible avec ces sections exactes :

      📊 1. COHÉRENCE DU PRIX DU MARCHÉ
      - Le prix demandé est-il cohérent, surcoté ou une bonne affaire par rapport à la cote actuelle de ce modèle et de son année ? Donne une estimation de la fourchette de prix réelle.

      🛣️ 2. ANALYSE DU KILOMÉTRAGE
      - Le kilométrage est-il cohérent par rapport à l'âge de la moto (moyenne standard d'environ 6000 km/an) ? Est-ce un point de vigilance ?

      🛠️ 3. RÉVISIONS ET FRAIS À PRÉVOIR
      - Quels sont les entretiens imminents ou l'historique critique à vérifier (kits chaîne, pneus, vidange, purge des freins, soupapes, jeu de direction, embrayage) selon le kilométrage et l'âge de cette moto ?

      🎯 4. MON AVIS D'EXPERT
      - Donne ton point de vue tranché et direct sur cette annonce en format court (faut-il foncer, négocier fermement ou fuir, et pourquoi en quelques mots).`;

    } else {
      prompt = `Tu es un conseiller moto expert. Trouve la moto idéale pour ce profil :
      - Âge : ${profile.age} ans
      - Taille : ${profile.height} cm
      - Permis : ${profile.license}
      - Expérience : ${profile.experience}
      - Style : ${profile.style}
      - Budget : ${profile.budget}

      Structure ta réponse clairement :
      - 🏍️ Le top choix (Modèle et année)
      - 💡 Pourquoi ce choix par rapport à sa taille (${profile.height}cm) et son permis (${profile.license})
      - 🥈 2 alternatives solides
      - ⚠️ Les pièges à éviter pour son profil.`;
    }

    const result = await model.generateContent(prompt);
    return res.status(200).json({ result: result.response.text() });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur serveur." });
  }
}
