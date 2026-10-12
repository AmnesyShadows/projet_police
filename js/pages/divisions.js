// ============================================================
// DIVISIONS V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initDivisionsPage() {
    await loadDivisions();
}

// ============================================================
// LISTE DES DIVISIONS
// ============================================================

async function loadDivisions() {
    const {
        data,
        error
    } = await supabaseClient
        .from("divisions")
        .select("*")
        .order("nom", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération divisions :",
            error
        );

        createAlert(
            "Impossible de récupérer les divisions.",
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
            `${data.length} ${data.length > 1 ? "divisions enregistrées" : "division enregistrée"}`;
    }

    renderDivisionCards(data ?? []);
}

// ============================================================
// AFFICHAGE DES CARDS
// ============================================================

function renderDivisionCards(divisions) {
    const container =
        document.getElementById(
            "divisions-table"
        );

    if (!container) {
        console.error(
            "Le conteneur #divisions-table est introuvable."
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
        "+ Nouvelle division";

    newButton.addEventListener(
        "click",
        openCreateDivisionModal
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
        divisionsConfig.cards;

    if (!cardConfig) {
        console.error(
            "Aucune configuration de card pour les divisions."
        );

        return;
    }

    if (divisions.length === 0) {
        const empty =
            document.createElement("div");

        empty.className =
            "card-field-value";

        empty.textContent =
            "Aucune division enregistrée.";

        grid.appendChild(empty);
        container.appendChild(grid);

        return;
    }

    divisions.forEach(division => {
        const card =
            createDivisionCard(
                cardConfig,
                division
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

function createDivisionCard(
    cardConfig,
    division
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
            getDivisionFieldValue(
                field,
                division
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

                openDivisionCardEditModal(
                    cardConfig,
                    division
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

            deleteDivision(division);
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

    const badge = createBadge(division.nom, division.couleur);

    return createCard({
        title:
            division.nom_complet ?? "",
        subtitle:
            division.nom ?? "",
        headerBadge: 
            badge,
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

function getDivisionFieldValue(
    field,
    division
) {
    const value =
        division[field.name];

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

function openDivisionCardEditModal(
    cardConfig,
    division
) {
    const fields =
        Array.isArray(
            divisionsConfig.edit?.fields
        )
            ? divisionsConfig.edit.fields
            : [];

    if (
        fields.length === 0
    ) {
        return;
    }

    const modalConfig = {
        ...divisionsConfig,

        edit: {
            ...divisionsConfig.edit,
            title:
                `Modifier — ${cardConfig.title}`,
            fields
        }
    };

    createModal({
        config: modalConfig,
        data: division,
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
                .from("divisions")
                .update(values)
                .eq(
                    "id",
                    originalData.id
                );

            if (error) {
                console.error(
                    "Erreur modification division :",
                    error
                );

                createAlert(
                    "Impossible de modifier la division.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La division a été modifiée avec succès.",
                "success",
                {
                    title:
                        "Modification réussie"
                }
            );

            await loadDivisions();
        }
    });
}

// ============================================================
// SUPPRESSION
// ============================================================

async function deleteDivision(
    division
) {
    const confirmed =
        window.confirm(
            `Supprimer la division "${division.nom_complet}" ?`
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("divisions")
        .delete()
        .eq(
            "id",
            division.id
        );

    if (error) {
        console.error(
            "Erreur suppression division :",
            error
        );

        createAlert(
            "Impossible de supprimer cette division.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    createAlert(
        `La division ${division.nom} a été supprimée.`,
        "success",
        {
            title:
                "Suppression réussie"
        }
    );

    await loadDivisions();
}

// ============================================================
// CREATION
// ============================================================

function openCreateDivisionModal() {
    createModal({
        config: divisionsConfig,
        data: {},
        mode: "create",
        title:
            divisionsConfig.create.title,

        onSave: async values => {
            const {
                error
            } = await supabaseClient
                .from("divisions")
                .insert(values);

            if (error) {
                console.error(
                    "Erreur création division :",
                    error
                );

                createAlert(
                    "Impossible de créer la division.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La division a été créée avec succès.",
                "success",
                {
                    title:
                        "Création réussie"
                }
            );

            await loadDivisions();
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
        initDivisionsPage
    );
} else {
    initDivisionsPage();
}