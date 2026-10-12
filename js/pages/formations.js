// ============================================================
// FORMATIONS V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initFormationsPage() {
    await loadFormations();
}

// ============================================================
// LISTE DES Formations
// ============================================================

async function loadFormations() {
    const {
        data,
        error
    } = await supabaseClient
        .from("formations")
        .select("*")
        .order("nom", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération formations :",
            error
        );

        createAlert(
            "Impossible de récupérer les formations.",
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
            `${data.length} ${data.length > 1 ? "formations enregistrées" : "formation enregistrée"}`;
    }

    renderFormationCards(data ?? []);
}

// ============================================================
// AFFICHAGE DES CARDS
// ============================================================

function renderFormationCards(formations) {
    const container =
        document.getElementById(
            "formations-table"
        );

    if (!container) {
        console.error(
            "Le conteneur #formations-table est introuvable."
        );

        return;
    }

    container.innerHTML = "";

    // ========================================================
    // BOUTON NOUVELLE DIVISION
    // ========================================================

    const toolbar =
        document.createElement("div");

    toolbar.className =
        "table-toolbar";

    const newButton =
        document.createElement("button");

    newButton.type = "button";
    newButton.className =
        "btn-table-new";

    newButton.textContent =
        "+ Nouvelle formation";

    newButton.addEventListener(
        "click",
        openCreateFormationModal
    );

    toolbar.appendChild(newButton);
    container.appendChild(toolbar);

    // ========================================================
    // GRILLE
    // ========================================================

    const grid =
        document.createElement("div");

    grid.className =
        "card-grid-detail";

    const cardConfig =
        formationsConfig.cards;

    if (!cardConfig) {
        console.error(
            "Aucune configuration de card pour les formations."
        );

        return;
    }

    if (formations.length === 0) {
        const empty =
            document.createElement("div");

        empty.className =
            "card-field-value";

        empty.textContent =
            "Aucune formation enregistrée.";

        grid.appendChild(empty);
        container.appendChild(grid);

        return;
    }

    formations.forEach(formation => {
        const card =
            createFormationCard(
                cardConfig,
                formation
            );

        if (card) {
            grid.appendChild(card);
        }
    });

    container.appendChild(grid);
}

// ============================================================
// CREATION D'UNE CARD
// ============================================================

function createFormationCard(
    cardConfig,
    formation
) {
    const content =
        document.createElement("div");

    content.className =
        "card-fields";

    const fields =
        Array.isArray(
            cardConfig.fields
        )
            ? cardConfig.fields
            : [];

    fields.forEach(field => {
        const row =
            document.createElement("div");

        row.className =
            field.type === "textarea"
                ? "card-field card-field-textarea"
                : "card-field";

        const label =
            document.createElement("div");

        label.className =
            "card-field-label";

        label.textContent =
            field.label ??
            field.name;

        const value =
            document.createElement("div");

        value.className =
            "card-field-value";

        value.textContent =
            getFormationFieldValue(
                field,
                formation
            );

        row.appendChild(label);
        row.appendChild(value);

        content.appendChild(row);
    });

    // ========================================================
    // BOUTON MODIFIER
    // ========================================================

    const editableFields =
        fields.filter(
            field =>
                field.edit === true
        );

    let headerActions = null;

    if (
        editableFields.length > 0
    ) {
        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.className =
            "btn-card-edit";

        editButton.textContent =
            "✎ Modifier";

        editButton.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openFormationCardEditModal(
                    cardConfig,
                    formation
                );
            }
        );

        headerActions =
            editButton;
    }

    // ========================================================
    // BOUTON SUPPRIMER
    // ========================================================

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "btn-table delete";

    deleteButton.textContent =
        "🗑 Supprimer";

    deleteButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            deleteFormation(formation);
        }
    );

    const footer =
        document.createElement("div");

    footer.className =
        "card-actions";

    footer.appendChild(
        deleteButton
    );

    // ========================================================
    // CARD GENERIQUE
    // ========================================================

    const badge = createBadge(formation.nom, formation.couleur);

    return createCard({
        title:
            formation.nom ?? "",
        icon: 
            formation.icon ?? "",
        width:
            cardConfig.width ?? 1,
        content,
        footer,
        headerActions
    });
}

// ============================================================
// RECUPERATION VALEUR
// ============================================================

function getFormationFieldValue(
    field,
    formation
) {
    const value =
        formation[field.name];

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return String(value);
}

// ============================================================
// MODIFICATION DEPUIS UNE CARD
// ============================================================

function openFormationCardEditModal(
    cardConfig,
    formation
) {
    const fields =
        Array.isArray(
            formationsConfig.edit?.fields
        )
            ? formationsConfig.edit.fields
            : [];

    if (
        fields.length === 0
    ) {
        return;
    }

    const modalConfig = {
        ...formationsConfig,

        edit: {
            ...formationsConfig.edit,
            title:
                `Modifier — ${cardConfig.title}`,
            fields
        }
    };

    createModal({
        config: modalConfig,
        data: formation,
        mode: "edit",
        title:
            `Modifier — ${cardConfig.title}`,

        onSave: async (
            values,
            originalData
        ) => {
            const {
                error
            } = await supabaseClient
                .from("formations")
                .update(values)
                .eq(
                    "id",
                    originalData.id
                );

            if (error) {
                console.error(
                    "Erreur modification formation :",
                    error
                );

                createAlert(
                    "Impossible de modifier la formation.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La formation a été modifiée avec succès.",
                "success",
                {
                    title:
                        "Modification réussie"
                }
            );

            await loadFormations();
        }
    });
}

// ============================================================
// SUPPRESSION
// ============================================================

async function deleteFormation(
    formation
) {
    const confirmed =
        window.confirm(
            `Supprimer la formation "${formation.nom_complet}" ?`
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("formations")
        .delete()
        .eq(
            "id",
            formation.id
        );

    if (error) {
        console.error(
            "Erreur suppression formation :",
            error
        );

        createAlert(
            "Impossible de supprimer cette formation.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    createAlert(
        `La formation ${formation.nom} a été supprimée.`,
        "success",
        {
            title:
                "Suppression réussie"
        }
    );

    await loadFormations();
}

// ============================================================
// CREATION
// ============================================================

function openCreateFormationModal() {
    createModal({
        config: formationsConfig,
        data: {},
        mode: "create",
        title:
            formationsConfig.create.title,

        onSave: async values => {
            const {
                error
            } = await supabaseClient
                .from("formations")
                .insert(values);

            if (error) {
                console.error(
                    "Erreur création formation :",
                    error
                );

                createAlert(
                    "Impossible de créer la formation.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La formation a été créée avec succès.",
                "success",
                {
                    title:
                        "Création réussie"
                }
            );

            await loadFormations();
        }
    });
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
        initFormationsPage
    );
} else {
    initFormationsPage();
}