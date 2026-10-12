// ============================================================
// ARMES V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initArmesPage() {
    await loadArmes();
}

// ============================================================
// LISTE DES ARMES
// ============================================================

async function loadArmes() {
    const {
        data,
        error
    } = await supabaseClient
        .from("armes")
        .select("*")
        .order("ppa_minimum", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération armes :",
            error
        );

        createAlert(
            "Impossible de récupérer les armes.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    const pageSubtitle =
        document.querySelector(".page-subtitle");

    if (pageSubtitle) {
        pageSubtitle.textContent =
            `${data.length} ${data.length > 1 ? "armes enregistrées" : "arme enregistrée"}`;
    }

    const table =
        createTable({
            config: armesConfig,
            data,
            columns:
                armesConfig.list.columns,

            // Pas de show
            // Pas de clic sur la ligne
            onRowClick: null,

            // ====================================================
            // SUPPRESSION
            // ====================================================

            onDelete: async arme => {
                const {
                    error
                } = await supabaseClient
                    .from("armes")
                    .delete()
                    .eq(
                        "id",
                        arme.id
                    );

                if (error) {
                    console.error(
                        "Erreur suppression arme :",
                        error
                    );

                    createAlert(
                        "Impossible de supprimer cette arme.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `L'arme ${arme.nom} a été supprimée.`,
                    "success",
                    {
                        title:
                            "Suppression réussie"
                    }
                );

                await loadArmes();
            },

            // ====================================================
            // CREATION
            // ====================================================

            onCreate: async values => {
                const {
                    error
                } = await supabaseClient
                    .from("armes")
                    .insert(values);

                if (error) {
                    console.error(
                        "Erreur création arme :",
                        error
                    );

                    createAlert(
                        "Impossible de créer l'arme.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    "L'arme a été créée avec succès.",
                    "success",
                    {
                        title:
                            "Création réussie"
                    }
                );

                await loadArmes();
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
                    .from("armes")
                    .update(values)
                    .eq(
                        "id",
                        originalData.id
                    );

                if (error) {
                    console.error(
                        "Erreur modification arme :",
                        error
                    );

                    createAlert(
                        "Impossible de modifier l'arme.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `L'arme ${values.nom} a été modifiée avec succès.`,
                    "success",
                    {
                        title:
                            "Modification réussie"
                    }
                );

                await loadArmes();
            }
        });

    // ============================================================
    // CONTENEUR
    // ============================================================

    const container =
        document.getElementById(
            "armes-table"
        );

    if (!container) {
        console.error(
            "Le conteneur #armes-table est introuvable."
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
        initArmesPage
    );
} else {
    initArmesPage();
}