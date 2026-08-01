import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'URL manquante.' });
        }

        let pageContent = prompt;

        // 1. Scraping via Jina AI avec gestion d'erreur sécurisée
        if (prompt.startsWith('http')) {
            try {
                const jinaResponse = await fetch(`https://r.jina.ai/${prompt}`, {
                    headers: { 'Accept': 'text/plain' }
                });
                
                if (jinaResponse.ok) {
                    pageContent = await jinaResponse.text();
                }
            } catch (scrapeError) {
                console.error("Avertissement scraping Jina:", scrapeError);
            }
        }

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

        // 2. Appel Gemini (utilisation du modèle alias stable)
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemInstruction }, { text: `Voici le contenu à analyser :\n\n${pageContent}` }] }
            ],
        });

        // 3. Sécurité pour extraire le texte
        const textResult = typeof response.text === 'function' ? response.text() : response.text;

        return res.status(200).json({ result: textResult });

    } catch (error) {
        console.error("Erreur critique API:", error);
        return res.status(500).json({ error: 'Erreur serveur : ' + error.message });
    }
}
