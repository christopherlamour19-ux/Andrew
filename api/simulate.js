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

Tu dois répondre obligatoirement et strictement selon ce format pour alimenter deux onglets :

---RESUME_IDEAL---
- 🏍️ Modèle idéal : (Marque et modèle exacts)
- 🎯 Pourquoi ce choix : (En 2 phrases max, résumé direct par rapport à sa taille, son budget et son expérience)
- ⭐ Point fort principal : (Le gros avantage de cette moto pour lui)
- ⚠️ Point faible principal : (Le petit compromis à accepter)

---RAPPORT_DETAILLE---
1. 📏 Adéquation Morphologique & Permis : Analyse détaillée par rapport à sa taille (${profile.height}), son âge (${profile.ageRange}), son permis (${profile.license}) et son expérience (${profile.experience}).
2. 💰 Analyse du Budget & Coût d'usage : Est-ce que le budget de ${profile.budget} est cohérent (achat, assurance, entretien pour ce type ${profile.style}) ?
3. 🛣️ Alternatives intéressantes : 2 autres modèles de motos qu'il pourrait aussi envisager si le modèle idéal ne lui plaît pas.
4. 💡 Conseils personnalisés pour débuter ou progresser avec cette moto.

À la toute fin absolue de ta réponse, écris une ligne exacte au format : PHOTO_QUERY: [Nom exact de la moto en anglais pour recherche d'image]`;

    const userPrompt = `Voici mon profil de motard :
- Tranche d'âge : ${profile.ageRange}
- Taille : ${profile.height}
- Permis / Expérience : ${profile.license}
- Depuis quand il roule : ${profile.experience}
- Style recherché : ${profile.style}
- Budget max : ${profile.budget}`;

    const result = await model.generateContent(`${systemInstructions}\n\n${userPrompt}`);
    const responseText = result.response.text();

    let imageUrl = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80";
    const photoQueryMatch = responseText.match(/PHOTO_QUERY:\s*(.*)/);
    
    if (photoQueryMatch && photoQueryMatch[1]) {
      const query = encodeURIComponent(photoQueryMatch[1].trim());
      imageUrl = `https://source.unsplash.com/featured/800x600/?${query},motorcycle`;
    }

    return res.status(200).json({ result: responseText, imageUrl: imageUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors de la simulation." });
  }
}
