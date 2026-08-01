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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    let prompt = "";

    if (type === 'ad') {
      // Cas 1 : Analyse d'annonce Leboncoin / liens
      prompt = `Tu es un expert en inspection de motos d'occasion. Analyse cette annonce : "${content}".
      Donne un avis structuré avec :
      1. Points forts et cohérence du prix.
      2. Pièges potentiels ou questions à poser au vendeur.
      3. Estimation de la cote réelle.`;
    } else {
      // Cas 2 : Simulateur moto idéale
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
