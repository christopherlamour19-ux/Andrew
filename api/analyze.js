import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { prompt } = req.body; // C'est ici qu'on reçoit l'URL ou le texte

        if (!prompt) {
            return res.status(400).json({ error: 'URL manquante.' });
        }

        let pageContent = prompt;

        // 1. Si l'utilisateur envoie une URL LeBonCoin, on la scrape via Jina AI
        if (prompt.startsWith('http')) {
            try {
                const jinaResponse = await fetch(`https://r.jina.ai/${prompt}`, {
                    headers: {
                        'Accept': 'text/plain',
                        // Optionnel si tu as une clé Jina : 'Authorization': 'Bearer TON_API_KEY'
                    }
                });
                
                if (jinaResponse.ok) {
                    pageContent = await jinaResponse.text();
                }
            } catch (scrapeError) {
                console.error("Erreur de scraping Jina:", scrapeError);
                // Si le scraping échoue, on continue quand même avec l'URL brute au cas où
            }
        }

        // 2. On prépare les instructions strictes pour l'IA
        const systemInstruction = `Tu es un expert mécanicien et acheteur de motos d'occasion. 
Tu vas analyser le contenu d'une annonce LeBonCoin qui te sera fourni.
Réponds obligatoirement et strictement sous ce format pour que l'interface puisse les séparer :

---RESUME_RAPIDE---
- 💰 Prix : (Analyse si c'est une bonne affaire, correct ou trop cher par rapport au modèle)
- 🛣️ Kilométrage : (Est-il cohérent ou suspect pour l'année ?)
- ⚠️ Piège majeur : (Le principal point noir ou panne connue de cette moto)
- 🎯 Verdict final : (Fonce / Négocie / Fuis)

---RAPPORT_DETAILLE---
(Donne ici une analyse complète et technique : points forts, historique à vérifier, points précis à inspecter lors du rendez-vous, et estimation de l'entretien futur).`;

        // 3. Appel à Gemini avec le modèle stable
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemInstruction }, { text: `Voici le contenu de l'annonce à analyser :\n\n${pageContent}` }] }
            ],
        });

        const textResult = response.text();

        return res.status(200).json({ result: textResult });

    } catch (error) {
        console.error("Erreur API:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur: ' + error.message });
    }
}
