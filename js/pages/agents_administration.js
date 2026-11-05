
// ============================================================
// ADMINISTRATION AGENTS
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    await initAgentsAdministrationPage();
});

async function initAgentsAdministrationPage() {

    // Vérification de l'accès à la page
    const allowed = await Permissions.can(
        "agents.administration.access"
    );

    if (!allowed) {
        window.location.replace("../index.html");
        return;
    }

    await loadAgentsAdministration();
}


// ============================================================
// LISTE DES AGENTS
// ============================================================

async function loadAgentsAdministration() {

    const container = document.getElementById(
        "agents-administration-table"
    );

    if (!container) {
        console.error(
            "Le conteneur #agents-administration-table est introuvable."
        );
        return;
    }

    // Récupération des agents
    const { data, error } = await supabaseClient
        .from("agents")
        .select(`
            *,
            grades (
                id,
                nom,
                priority
            )
        `)
        .order("matricule", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération agents :",
            error
        );

        createAlert(
            "Impossible de récupérer les agents.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    // Mise à jour du sous-titre
    const pageSubtitle = document.querySelector(
        ".page-subtitle"
    );

    if (pageSubtitle) {
        pageSubtitle.textContent =
            `${data.length} ${data.length > 1
                ? "agents enregistrés"
                : "agent enregistré"}`;
    }

    // Création du tableau
    const table = createTable({
        config: agentsConfig,
        data: data,
        columns: agentsConfig.list.columns,

        // ====================================================
        // CRÉATION
        // ====================================================

        onCreate: async values => {

            const allowed = await Permissions.can(
                "agents.administration.edit"
            );

            if (!allowed) return;

            const payload = {
                prenom: values.prenom,
                nom: values.nom,
                matricule: values.matricule,
                grade: values.grade || null,
                discord_id: values.discord_id || null,
                admin: values.admin ?? false
            };

            const { error } = await supabaseClient
                .from("agents")
                .insert(payload);

            if (error) {
                console.error(
                    "Erreur création agent :",
                    error
                );

                createAlert(
                    "Impossible de créer cet agent.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "L'agent a été créé avec succès.",
                "success",
                {
                    title: "Création réussie"
                }
            );

            await loadAgentsAdministration();
        },

        // ====================================================
        // MODIFICATION
        // ====================================================

        onEdit: async (values, originalData) => {

            const allowed = await Permissions.can(
                "agents.administration.edit"
            );

            if (!allowed) return;

            // Seuls l'ID Discord et le statut Admin
            // peuvent être modifiés depuis cette page.
            const payload = {
                discord_id: values.discord_id || null,
                admin: values.admin ?? false
            };

            const { error } = await supabaseClient
                .from("agents")
                .update(payload)
                .eq("id", originalData.id);

            if (error) {
                console.error(
                    "Erreur modification agent :",
                    error
                );

                createAlert(
                    "Impossible de modifier cet agent.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                `Les informations de ${originalData.prenom} ${originalData.nom} ont été mises à jour.`,
                "success",
                {
                    title: "Modification réussie"
                }
            );

            await loadAgentsAdministration();
        }
    });

    // Affichage du tableau
    container.innerHTML = "";
    container.appendChild(table);
}
