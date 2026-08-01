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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemInstructions = `Tu es un expert en motocyclisme, conseiller aguerri en choix de motos d'occasion et neuves. 
Analyse le profil du motard suivant :
- Âge : ${profile.age} ans
- Taille : ${profile.height} cm
- Permis : ${profile.license}
- Ancienneté du permis : ${profile.experience}
- Style préféré : ${profile.style}
- Budget max : ${profile.budget}
- Attente assurance : ${profile.insurance}
- Consommation / Usage : ${profile.consumption}

Propose la moto idéale en tenant compte de sa taille (hauteur de selle adaptée), de son permis (légalité A2 ou bridage si nécessaire), de son budget et de son assurance. 
Réponds obligatoirement et strictement selon ce format exact avec les séparateurs :

---TOP_PICK---
- 🏍️ Modèle conseillé : (Nom exact de la moto, année type)
- 💡 Pourquoi c'est la moto parfaite pour toi : (Analyse par rapport à sa taille, son style et son usage)
- 📏 Accessibilité / Hauteur de selle : (Est-ce adapté à ses ${profile.height} cm ?)
- 💰 Budget & Entretien estimé : (Prix moyen en occasion et coût d'entretien)

---ALTERNATIVES---
1. 🥈 Deuxième option intéressante (Modèle + arguments rapides)
2. 🥉 Troisième option intéressante (Modèle + arguments rapides)
3. ⚠️ Pièges à éviter pour ton profil (Les motos à ne surtout pas acheter avec ton expérience/permis et pourquoi).`;

    const result = await model.generateContent(systemInstructions);
    const responseText = result.response.text();

    return res.status(200).json({ result: responseText });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors du calcul de la moto idéale." });
  }
}
