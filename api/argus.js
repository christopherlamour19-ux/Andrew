app.post('/api/estimate', async (req, res) => {
    try {
        const { bikeData } = req.body;
        
        const prompt = `Tu es un expert en négociation d'occasion et cotation de motos sur LeBonCoin en France.
Un particulier souhaite vendre sa moto sur LeBonCoin et te demande d'estimer son juste prix de vente.

Voici les informations de sa moto :
- Modèle : ${bikeData.model} (${bikeData.year})
- Kilométrage : ${bikeData.mileage}
- Entretien / Historique : ${bikeData.history}
- État esthétique : ${bikeData.condition}
- Consommables : ${bikeData.wear}
- Options / Équipements : ${bikeData.options}
- Défauts / Frais à prévoir : ${bikeData.defects}

Rédige une analyse claire pour le vendeur structurée ainsi :

---PRIX_VENTE_CONSEILLE---
💶 PRIX D'AFFICHAGE RECOMMANDÉ (LeBonCoin) : [Donne un montant exact, ex: 5 800 €]
🛡️ PRIX PLANCHER DE NÉGOCIATION : [Donne le montant minimal en dessous duquel ne pas céder, ex: 5 400 €]
📊 FOURCHETTE DU MARCHÉ : [Moyenne constatée sur Leboncoin]
⚡ ATTRACTIVITÉ DE LA VENTE : [Élevée / Moyenne / Faible] et délai estimé pour vendre.

---CONSEILS_VENTE_LEBONCOIN---
📝 POINTS FORTS À METTRE EN AVANT : (Ce qui justifie le prix dans l'annonce)
⚠️ ÉLÉMENT(S) DE NÉGOCIATION DES ACHETEURS : (Ce que les acheteurs vont utiliser pour baisser le prix)
💡 ASTUCES POUR UNE VENTE RAPIDE : (Photos, mots-clés, timing)`;

        // Remplace 'callGeminiAI' par le nom de ta fonction d'appel à Gemini
        const responseText = await callGeminiAI(prompt);
        res.json({ result: responseText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
