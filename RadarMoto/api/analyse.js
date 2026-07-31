export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Méthode non autorisée"
        });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            error: "Aucune URL reçue."
        });
    }

    return res.status(200).json({
        success: true,
        marque: "Peugeot",
        modele: "308",
        prix: "12 900 €",
        score: 89,
        verdict: "Bon achat",
        message: "🎉 La communication avec Vercel fonctionne !"
    });

}