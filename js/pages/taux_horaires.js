// ============================================================
// TAUX HORAIRES V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initTauxHorairesPage() {
    await loadTauxHoraires();
}

// ============================================================
// LISTE DES GRADES
// ============================================================

async function loadTauxHoraires() {
    const {
        data,
        error
    } = await supabaseClient
        .from("taux_horaires")
        .select(
            `*,
            grades (
                id,
                nom,
                priority
            )
        `);

    if (error) {
        console.error(
            "Erreur récupération taux_horaires :",
            error
        );

        createAlert(
            "Impossible de récupérer les taux_horaires.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    data.sort(
        (a, b) =>
            (a.grades?.priority ?? 999) -
            (b.grades?.priority ?? 999)
    );

    const pageSubtitle =
        document.querySelector(".page-subtitle");

    if (pageSubtitle) {
        pageSubtitle.textContent =
            `${data.length} ${data.length > 1 ? "taux horaires enregistrés" : "taux horaires enregistré"}`;
    }

    const table =
        createTable({
            config: tauxHorairesConfig,
            data,
            columns:
                tauxHorairesConfig.list.columns,

            // Pas de show
            // Pas de clic sur la ligne
            onRowClick: null,

            // ====================================================
            // SUPPRESSION
            // ====================================================

            onDelete: async tauxHoraire => {
                const {
                    error
                } = await supabaseClient
                    .from("taux_horaires")
                    .delete()
                    .eq(
                        "id",
                        tauxHoraire.id
                    );

                if (error) {
                    console.error(
                        "Erreur suppression taux-horaire :",
                        error
                    );

                    createAlert(
                        "Impossible de supprimer ce taux-horaire.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `Le taux-horaire ${tauxHoraire.nom} a été supprimé.`,
                    "success",
                    {
                        title:
                            "Suppression réussie"
                    }
                );

                await loadTauxHoraires();
            },

            // ====================================================
            // CREATION
            // ====================================================

            onCreate: async values => {
                const {
                    error
                } = await supabaseClient
                    .from("taux_horaires")
                    .insert(values);

                if (error) {
                    console.error(
                        "Erreur création taux-horaire :",
                        error
                    );

                    createAlert(
                        "Impossible de créer le taux-horaire.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    "Le taux-horaire a été créé avec succès.",
                    "success",
                    {
                        title:
                            "Création réussie"
                    }
                );

                await loadTauxHoraires();
            },

            // ====================================================
            // MODIFICATION
            // ====================================================

            onEdit: async (
                values,
                originalData
            ) => {
                const {
                    error
                } = await supabaseClient
                    .from("taux_horaires")
                    .update(values)
                    .eq(
                        "id",
                        originalData.id
                    );

                if (error) {
                    console.error(
                        "Erreur modification taux-horaire :",
                        error
                    );

                    createAlert(
                        "Impossible de modifier le taux-horaire.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `Le taux-horaire ${values.nom} a été modifié avec succès.`,
                    "success",
                    {
                        title:
                            "Modification réussie"
                    }
                );

                await loadTauxHoraires();
            }
        });

    // ============================================================
    // CONTENEUR
    // ============================================================

    const container =
        document.getElementById(
            "taux-horaires-table"
        );

    if (!container) {
        console.error(
            "Le conteneur #taux-horaires-table est introuvable."
        );

        return;
    }

    container.innerHTML = "";

    container.appendChild(table);
}

// ============================================================
// START
// ============================================================

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initTauxHorairesPage
    );
} else {
    initTauxHorairesPage();
}