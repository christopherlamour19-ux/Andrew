import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { motoA, motoB, userProfile } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const duelPrompt = `Tu es un expert en moto. Fais un comparatif direct (duel) entre ces deux motos :
    - Moto A : ${motoA}
    - Moto B : ${motoB}

    Profil de l'utilisateur concerné :
    - Taille : ${userProfile?.height || 'Standard'}
    - Permis : ${userProfile?.license || 'A2'}
    - Expérience : ${userProfile?.experience || 'Moyenne'}
    - Style recherché : ${userProfile?.style || 'Polyvalent'}

    Structure ta réponse de manière claire et percutante avec :
    1. 🥊 Le match up global (Forces en présence)
    2. ⚡ Performances & Moteur (Comparatif des sensations)
    3. 📐 Ergonomie, Confort & Vie Quotidienne (Adaptme-t-elle au profil ?)
    4. 🏆 Le Verdict / Laquelle choisir selon le profil.`;

    const result = await model.generateContent(duelPrompt);
    const text = result.response.text();

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors du duel." });
  }
}
