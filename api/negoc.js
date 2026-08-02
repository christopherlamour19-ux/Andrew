async function sendNegocMessage() {
    const input = document.getElementById('negoc-input');
    const container = document.getElementById('negoc-messages');
    const text = input.value.trim();
    if (!text) return;

    // 1. Afficher ton message dans le chat
    container.innerHTML += `<div class="negoc-msg user">${text}</div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // 2. Afficher un indicateur de chargement "en train d'écrire..."
    const loadingId = 'loading-' + Date.now();
    container.innerHTML += `<div class="negoc-msg bot" id="${loadingId}"><i class="fa-solid fa-spinner fa-spin"></i> Réflexion stratégique...</div>`;
    container.scrollTop = container.scrollHeight;

    try {
        // 3. Envoyer la demande au backend (tu peux utiliser /api/analyze ou créer une route /api/negoc)
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: "Agis comme un coach de négociation Leboncoin expert en moto. Réponds précisément à cette situation d'acheteur : " + text 
            })
        });

        const data = await response.json();
        
        // Supprimer le message de chargement
        document.getElementById(loadingId).remove();

        if (!response.ok) throw new Error(data.error || 'Erreur de communication.');

        // 4. Afficher la vraie réponse de l'IA
        container.innerHTML += `
            <div class="negoc-msg bot">
                <strong>💡 Conseil Négociation :</strong><br>
                ${data.result.replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (error) {
        document.getElementById(loadingId).remove();
        container.innerHTML += `
            <div class="negoc-msg bot" style="color: #ef4444;">
                Oups, une erreur est survenue : ${error.message}
            </div>
        `;
    }
    
    container.scrollTop = container.scrollHeight;
}