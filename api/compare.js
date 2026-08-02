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

    const duelPrompt = `Tu es RadarMoto, un expert essayeur et comparateur moto intransigeant. 
    Un utilisateur hésite entre deux modèles et te demande un duel comparatif direct.
    
    Profil de l'utilisateur (pour contextualiser le choix) :
    - Taille : ${userProfile?.height || 'Non précisée'}
    - Permis : ${userProfile?.license || 'Non précisé'}
    - Expérience : ${userProfile?.experience || 'Non précisée'}
    - Utilisation / Style : ${userProfile?.style || 'Non précisé'}

    Les deux motos en lice :
    - Moto A : ${motoA}
    - Moto B : ${motoB}

    Analyse et compare ces deux motos point par point de manière objective et percutante. Ta réponse doit suivre strictement cette structure :

async function lancerDuel() {
    const motoA = document.getElementById('compare-moto-a').value.trim();
    const motoB = document.getElementById('compare-moto-b').value.trim();
    const btn = document.getElementById('compare-submit-btn');
    const spinner = document.getElementById('compare-spinner');
    const resultContainer = document.getElementById('compare-result-container');
    const contentEl = document.getElementById('compare-tab-content');

    if (!motoA || !motoB) {
        alert("Veuillez renseigner les deux motos à comparer.");
        return;
    }

    btn.disabled = true;
    spinner.style.display = 'inline-block';
    resultContainer.style.display = 'none';

    // On récupère si possible les infos de profil si l'utilisateur a rempli le simulateur
    const userProfile = {
        height: document.getElementById('sim-height')?.value || 'Standard',
        license: document.getElementById('sim-license')?.value || 'A2',
        experience: document.getElementById('sim-experience')?.value || 'Moyenne',
        style: document.getElementById('sim-style')?.value || 'Polyvalent'
    };

    try {
        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motoA, motoB, userProfile })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur serveur.');

        contentEl.textContent = data.result;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        contentEl.textContent = "Erreur : " + error.message;
        resultContainer.style.display = 'block';
    } finally {
        btn.disabled = false;
        spinner.style.display = 'none';
    }
}

// Adapte ta fonction switchMode existante pour inclure 'compare'
function switchMode(mode) {
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('simulator-result-container').style.display = 'none';
    document.getElementById('compare-result-container').style.display = 'none';

    document.getElementById('container-mode-ad').style.display = 'none';
    document.getElementById('simulator-form').style.display = 'none';
    document.getElementById('container-mode-compare').style.display = 'none';

    document.getElementById('btn-mode-ad').classList.remove('active');
    document.getElementById('btn-mode-sim').classList.remove('active');
    document.getElementById('btn-mode-compare').classList.remove('active');

    if (mode === 'ad') {
        document.getElementById('btn-mode-ad').classList.add('active');
        document.getElementById('container-mode-ad').style.display = 'block';
    } else if (mode === 'simulator') {
        document.getElementById('btn-mode-sim').classList.add('active');
        document.getElementById('simulator-form').style.display = 'block';
    } else if (mode === 'compare') {
        document.getElementById('btn-mode-compare').classList.add('active');
        document.getElementById('container-mode-compare').style.display = 'block';
    }
}

    ---VERDICT_GLOBAL---
    [Dis clairement quelle moto gagne le duel pour ce profil en 2-3 phrases.]

    ---COMPARATIF_DETAILLE---
    - **Moteur & Performance :** [Comparaison des blocs, sensations, puissance]
    - **Partie cycle & Maniabilité :** [Comportement, poids, agilité]
    - **Ergonomie & Confort :** [Adaptation au gabarit du pilote, position]
    - **Budget & Entretien :** [Coût d'achat, assurance, consommation]

    ---VAINQUEUR---
    [Nom de la moto gagnante et résumé de la raison décisive]`;

    const result = await model.generateContent(duelPrompt);
    const text = result.response.text();

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({ error: error.message || "Erreur lors du duel." });
  }
}
