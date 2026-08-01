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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const systemInstructions = `Tu es un conseiller expert en choix de motos d'occasion et neuves. 
Analyse le profil du motard ci-dessous et recommande-lui LA moto idéale. 

Ton rôle :
1. Proposer un modèle de moto précis (marque et modèle exacts).
2. Expliquer pourquoi cette moto correspond parfaitement à son profil, sa taille, son budget et son expérience.
3. Indiquer les points forts et faibles de ce choix pour lui.
4. À la toute fin de ta réponse, écris une ligne exacte au format : PHOTO_QUERY: [Nom exact de la moto en anglais pour recherche d'image]`;

    const userPrompt = `Voici mon profil de motard :
- Tranche d'âge : ${profile.ageRange}
- Taille : ${profile.height}
- Permis / Expérience : ${profile.license}
- Depuis quand il roule / Expérience : ${profile.experience}
- Style recherché : ${profile.style}
- Budget max : ${profile.budget}`;

    const result = await model.generateContent(`${systemInstructions}\n\n${userPrompt}`);
    const responseText = result.response.text();

    // Extraction d'une requête de recherche d'image simple pour illustrer la moto
    let imageUrl = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"; // Image par défaut moto
    const photoQueryMatch = responseText.match(/PHOTO_QUERY:\s*(.*)/);
    
    if (photoQueryMatch && photoQueryMatch[1]) {
      const query = encodeURIComponent(photoQueryMatch[1].trim());
      // Utilisation d'un service d'image libre basé sur des mots clés
      imageUrl = `https://source.unsplash.com/featured/800x600/?${query},motorcycle`;
    }

    return res.status(200).json({ result: responseText, imageUrl: imageUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de la simulation." });
  }
}
