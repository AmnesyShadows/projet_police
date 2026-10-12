// ============================================================
// GRADES V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initGradesPage() {
    await loadGrades();
}

// ============================================================
// LISTE DES GRADES
// ============================================================

async function loadGrades() {
    const {
        data,
        error
    } = await supabaseClient
        .from("grades")
        .select("*")
        .order("priority", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération grades :",
            error
        );

        createAlert(
            "Impossible de récupérer les grades.",
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
            `${data.length} ${data.length > 1 ? "grades enregistrés" : "grade enregistré"}`;
    }

    const table =
        createTable({
            config: gradesConfig,
            data,
            columns:
                gradesConfig.list.columns,

            // Pas de show
            // Pas de clic sur la ligne
            onRowClick: null,

            // ====================================================
            // SUPPRESSION
            // ====================================================

            onDelete: async grade => {
                const {
                    error
                } = await supabaseClient
                    .from("grades")
                    .delete()
                    .eq(
                        "id",
                        grade.id
                    );

                if (error) {
                    console.error(
                        "Erreur suppression grade :",
                        error
                    );

                    createAlert(
                        "Impossible de supprimer ce grade.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `Le grade ${grade.nom} a été supprimé.`,
                    "success",
                    {
                        title:
                            "Suppression réussie"
                    }
                );

                await loadGrades();
            },

            // ====================================================
            // CREATION
            // ====================================================

            onCreate: async values => {
                const {
                    error
                } = await supabaseClient
                    .from("grades")
                    .insert(values);

                if (error) {
                    console.error(
                        "Erreur création grade :",
                        error
                    );

                    createAlert(
                        "Impossible de créer le grade.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    "Le grade a été créé avec succès.",
                    "success",
                    {
                        title:
                            "Création réussie"
                    }
                );

                await loadGrades();
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
                    .from("grades")
                    .update(values)
                    .eq(
                        "id",
                        originalData.id
                    );

                if (error) {
                    console.error(
                        "Erreur modification grade :",
                        error
                    );

                    createAlert(
                        "Impossible de modifier le grade.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `Le grade ${values.nom} a été modifié avec succès.`,
                    "success",
                    {
                        title:
                            "Modification réussie"
                    }
                );

                await loadGrades();
            }
        });

    // ============================================================
    // CONTENEUR
    // ============================================================

    const container =
        document.getElementById(
            "grades-table"
        );

    if (!container) {
        console.error(
            "Le conteneur #grades-table est introuvable."
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
        initGradesPage
    );
} else {
    initGradesPage();
}