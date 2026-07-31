document.addEventListener("DOMContentLoaded", () => {

    const bouton = document.querySelector(".search button");
    const input = document.querySelector(".search input");

    bouton.addEventListener("click", analyserAnnonce);

    async function analyserAnnonce() {

        const url = input.value.trim();

        if (!url) {
            alert("Veuillez coller un lien Leboncoin.");
            return;
        }

        bouton.disabled = true;
        bouton.textContent = "Analyse en cours...";

        try {

            const reponse = await fetch("/api/analyse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: url
                })
            });

            const data = await reponse.json();

            if (!reponse.ok) {
                throw new Error(data.error || "Erreur");
            }

            alert(
                "🚗 " + data.marque + " " + data.modele +
                "\n\n💰 Prix : " + data.prix +
                "\n⭐ Score : " + data.score + "/100" +
                "\n\n" + data.verdict +
                "\n\n" + data.message
            );

        } catch (erreur) {

            alert("Erreur : " + erreur.message);

        }

        bouton.disabled = false;
        bouton.textContent = "Analyser";

    }

});