// ============================================================
// AGENTS V2
// ============================================================

// ============================================================
// INITIALISATION
// ============================================================

async function initAgentsPage() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const agentId =
        params.get("id");

    if (agentId) {
        const firstPageTitle =
            document.querySelector(
                ".page-title-wrapper"
            );

        if (firstPageTitle) {
            firstPageTitle.style.display =
                "none";
        }

        await loadAgentFiche(agentId);
        return;
    }

    await loadAgents();
}

// ============================================================
// LISTE DES AGENTS
// ============================================================

async function loadAgents() {
    const { data, error } =
        await supabaseClient
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

    const table =
        createTable({
            config: agentsConfig,
            data,
            columns:
                agentsConfig.list.columns,

            onRowClick: agent => {
                window.location.href =
                    `agents.html?id=${agent.id}`;
            },

            onDelete: async agent => {
                const { error } =
                    await supabaseClient
                        .from("agents")
                        .delete()
                        .eq("id", agent.id);

                if (error) {
                    console.error(
                        "Erreur suppression agent :",
                        error
                    );

                    createAlert(
                        "Impossible de supprimer cet agent.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `L'agent ${agent.prenom} ${agent.nom} a été supprimé.`,
                    "success",
                    {
                        title:
                            "Suppression réussie"
                    }
                );

                await loadAgents();
            },

            onCreate: async values => {
                const { error } =
                    await supabaseClient
                        .from("agents")
                        .insert(values);

                if (error) {
                    console.error(
                        "Erreur création agent :",
                        error
                    );

                    createAlert(
                        "Impossible de créer l'agent.",
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
                        title:
                            "Création réussie"
                    }
                );

                await loadAgents();
            },

            onEdit: async (
                values,
                originalData
            ) => {
                const { error } =
                    await supabaseClient
                        .from("agents")
                        .update(values)
                        .eq(
                            "id",
                            originalData.id
                        );

                if (error) {
                    console.error(
                        "Erreur modification agent :",
                        error
                    );

                    createAlert(
                        "Impossible de modifier l'agent.",
                        "danger",
                        {
                            title: "Erreur"
                        }
                    );

                    return;
                }

                createAlert(
                    `L'agent ${values.prenom} ${values.nom} a été modifié avec succès.`,
                    "success",
                    {
                        title:
                            "Modification réussie"
                    }
                );

                await loadAgents();
            }
        });

    const container =
        document.getElementById(
            "agents-table"
        );

    const ficheContainer =
        document.getElementById(
            "agent-fiche"
        );

    if (!container) {
        console.error(
            "Le conteneur #agents-table est introuvable."
        );

        return;
    }

    container.style.display = "";

    if (ficheContainer) {
        ficheContainer.style.display =
            "none";
    }

    container.innerHTML = "";
    container.appendChild(table);
}

// ============================================================
// FICHE AGENT
// ============================================================

async function loadAgentFiche(agentId) {
    const {
        data: agent,
        error
    } =
        await supabaseClient
            .from("agents")
            .select(`
                *,
                grades (
                    id,
                    nom,
                    priority
                )
            `)
            .eq("id", agentId)
            .single();

    if (error) {
        console.error(
            "Erreur récupération fiche agent :",
            error
        );

        createAlert(
            "Impossible de récupérer la fiche de cet agent.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    if (!agent) {
        createAlert(
            "Agent introuvable.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    renderAgentFiche(agent);

    const ficheContainer =
        document.getElementById(
            "agent-fiche"
        );

    document
        .querySelectorAll(
            ".page-title-wrapper"
        )
        .forEach(wrapper => {
            if (
                !ficheContainer?.contains(
                    wrapper
                )
            ) {
                wrapper.style.display =
                    "none";
            }
        });
}

// ============================================================
// AFFICHAGE FICHE
// ============================================================

function renderAgentFiche(agent) {
    const tableContainer =
        document.getElementById(
            "agents-table"
        );

    const ficheContainer =
        document.getElementById(
            "agent-fiche"
        );

    if (!ficheContainer) {
        console.error(
            "Le conteneur #agent-fiche est introuvable."
        );

        return;
    }

    if (tableContainer) {
        tableContainer.style.display =
            "none";
    }

    ficheContainer.style.display = "";
    ficheContainer.innerHTML = "";

    // Bouton retour
    const backButton =
        document.createElement(
            "button"
        );

    backButton.type = "button";
    backButton.className =
        "btn-table view card-back-button";
    backButton.textContent =
        "← Retour aux agents";

    backButton.addEventListener(
        "click",
        () => {
            window.location.href =
                "agents.html";
        }
    );

    ficheContainer.appendChild(
        backButton
    );

    // Titre
    ficheContainer.appendChild(
        createPageTitle(
            `${agent.prenom} ${agent.nom}`,
            `Matricule ${agent.matricule}`,
            {
                className:
                    "agent-fiche-title",
                icon: "👮"
            }
        )
    );

    // Grille des cards
    const grid =
        document.createElement(
            "div"
        );

    grid.className =
        "card-grid-detail";

    // Configuration des cards
    const cards =
        agentsConfig.cards ?? [];

    cards.forEach(cardConfig => {
        const card =
            createAgentCard(
                cardConfig,
                agent
            );

        if (card) {
            grid.appendChild(card);
        }
    });

    ficheContainer.appendChild(
        grid
    );
}

// ============================================================
// CREATION D'UNE CARD
// ============================================================

function createAgentCard(
    cardConfig,
    agent
) {
    // Cards spécialisées
    if (cardConfig.modal) {
        return createSpecializedAgentCard(
            cardConfig,
            agent
        );
    }

    // Contenu
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
            document.createElement(
                "div"
            );

        row.className =
            field.type === "textarea"
                ? "card-field card-field-textarea"
                : "card-field";

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "card-field-label";

        label.textContent =
            field.label ??
            field.name;

        const value =
            document.createElement(
                "div"
            );

        value.className =
            "card-field-value";

        value.innerHTML =
            renderAgentField(
                field,
                agent
            );

        row.appendChild(label);
        row.appendChild(value);
        content.appendChild(row);
    });

    // Action Modifier dans le header
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
            document.createElement(
                "button"
            );

        editButton.type = "button";

        editButton.className =
            "btn-card-edit";

        editButton.textContent =
            "✎ Modifier";

        editButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                openAgentCardEditModal(
                    cardConfig,
                    agent
                );
            }
        );

        headerActions =
            editButton;
    }

    // Création de la card avec le composant générique
    return createCard({
        title:
            cardConfig.title ?? "",
        subtitle:
            cardConfig.subtitle ?? "",
        icon:
            cardConfig.icon ?? "",
        width:
            cardConfig.width ?? 1,
        content,
        footer: null,
        headerActions
    });
}

// ============================================================
// CARD SPECIALISEE
// ============================================================

function createSpecializedAgentCard(
    cardConfig,
    agent
) {
    const content =
        document.createElement(
            "div"
        );

    content.className =
        "specialized-card";

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "specialized-card-placeholder";

    message.textContent =
        "Chargement...";

    content.appendChild(message);

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "card-actions";

    const addButton =
        document.createElement(
            "button"
        );

    addButton.type = "button";

    addButton.className =
        "btn-table-new";

    addButton.textContent =
        "+ Ajouter";

    // ========================================================
    // ACTION AJOUTER
    // ========================================================

    addButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            if (
                cardConfig.key ===
                "armements"
            ) {
                openAddArmementModal(
                    agent,
                    content
                );

                return;
            }

            console.warn(
                `Aucune action d'ajout configurée pour la card "${cardConfig.key}".`
            );
        }
    );

    footer.appendChild(
        addButton
    );

    const card =
        createCard({
            title:
                cardConfig.title ?? "",
            subtitle:
                cardConfig.subtitle ?? "",
            icon:
                cardConfig.icon ?? "",
            width:
                cardConfig.width ?? 1,
            content,
            footer
        });

    if (
        cardConfig.key ===
        "armements"
    ) {
        loadAgentArmements(
            agent.id,
            content
        );
    }

    return card;
}

// ============================================================
// AJOUT ARMEMENT
// ============================================================

function openAddArmementModal(
    agent,
    container
) {
    if (
        typeof armementsConfig ===
        "undefined"
    ) {
        console.error(
            "armementsConfig est introuvable. Vérifie que armements.config.js est chargé avant agents.js."
        );

        createAlert(
            "La configuration des armements est introuvable.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    const fields =
        Array.isArray(
            armementsConfig.fields
        )
            ? armementsConfig.fields
            : [];

    if (fields.length === 0) {
        console.error(
            "Aucun champ n'est configuré dans armementsConfig."
        );

        createAlert(
            "Aucun champ n'est configuré pour les armements.",
            "danger",
            {
                title: "Erreur"
            }
        );

        return;
    }

    // createModal attend une configuration
    // sous la forme config.create.fields.
    const modalConfig = {
        ...armementsConfig,

        create: {
            ...(armementsConfig.create ?? {}),
            fields
        }
    };

    createModal({
        config: modalConfig,
        data: {},
        mode: "create",
        title: "Ajouter un armement",

        onSave: async values => {
            const payload = {
                agent_id: agent.id,
                arme_id: values.arme_id,
                numero_serie:
                    values.numero_serie
            };

            const { error } =
                await supabaseClient
                    .from("armements")
                    .insert(payload);

            if (error) {
                console.error(
                    "Erreur ajout armement :",
                    error
                );

                createAlert(
                    "Impossible d'ajouter cet armement.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "L'armement a été ajouté avec succès.",
                "success",
                {
                    title:
                        "Ajout réussi"
                }
            );

            await loadAgentArmements(
                agent.id,
                container
            );
        }
    });
}

// ============================================================
// ARMEMENTS AGENT
// ============================================================

async function loadAgentArmements(
    agentId,
    container
) {
    const {
        data,
        error
    } =
        await supabaseClient
            .from("armements")
            .select(`
                id,
                numero_serie,
                armes (
                    id,
                    nom,
                    ppa_minimum
                )
            `)
            .eq(
                "agent_id",
                agentId
            );

    if (error) {
        console.error(
            "Erreur récupération armements :",
            error
        );

        container.innerHTML = "";

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les armements.";

        container.appendChild(
            message
        );

        return;
    }

    container.innerHTML = "";

    if (
        !data ||
        data.length === 0
    ) {
        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucun armement attribué.";

        container.appendChild(
            message
        );

        return;
    }

    // ========================================================
    // REGROUPEMENT PAR NIVEAU DE PPA
    // ========================================================

    const groups = {
        0: [],
        1: [],
        2: [],
        3: []
    };

    data.forEach(armement => {
        const ppa =
            Number(
                armement.armes?.ppa_minimum
            ) || 0;

        if (
            groups[ppa] !== undefined
        ) {
            groups[ppa].push(
                armement
            );
        }
    });

    // ========================================================
    // AFFICHAGE DES GROUPES
    // ========================================================

    const groupLabels = {
        0: "Sans PPA",
        1: "PPA 1",
        2: "PPA 2",
        3: "PPA 3"
    };

    [0, 1, 2, 3].forEach(
        ppa => {
            const armements =
                groups[ppa];

            if (
                armements.length === 0
            ) {
                return;
            }

            // Titre du groupe
            const groupTitle =
                document.createElement(
                    "div"
                );

            groupTitle.className =
                "specialized-card-group-title";

            groupTitle.textContent =
                groupLabels[ppa];

            container.appendChild(
                groupTitle
            );

            // Armements du groupe
            armements.forEach(
                armement => {
                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "specialized-card-item";

                    // Nom de l'arme
                    const weaponName =
                        document.createElement(
                            "div"
                        );

                    weaponName.className =
                        "specialized-card-item-title";

                    weaponName.textContent =
                        armement.armes?.nom ??
                        "Arme inconnue";

                    // Numéro de série
                    const serial =
                        document.createElement(
                            "div"
                        );

                    serial.className =
                        "specialized-card-item-value";

                    serial.textContent =
                        armement.numero_serie
                            ? `S/N : ${armement.numero_serie}`
                            : "S/N : —";

                    // Bouton supprimer
                    const deleteButton =
                        document.createElement(
                            "button"
                        );

                    deleteButton.type =
                        "button";

                    deleteButton.className =
                        "specialized-card-item-delete";

                    deleteButton.textContent =
                        "×";

                    deleteButton.title =
                        "Supprimer cet armement";

                    deleteButton.addEventListener(
                        "click",
                        async event => {
                            event.preventDefault();
                            event.stopPropagation();

                            const confirmed =
                                window.confirm(
                                    `Supprimer l'armement "${armement.armes?.nom ?? "Arme inconnue"}" ?`
                                );

                            if (!confirmed) {
                                return;
                            }

                            const {
                                error
                            } =
                                await supabaseClient
                                    .from(
                                        "armements"
                                    )
                                    .delete()
                                    .eq(
                                        "id",
                                        armement.id
                                    );

                            if (error) {
                                console.error(
                                    "Erreur suppression armement :",
                                    error
                                );

                                createAlert(
                                    "Impossible de supprimer cet armement.",
                                    "danger",
                                    {
                                        title:
                                            "Erreur"
                                    }
                                );

                                return;
                            }

                            createAlert(
                                "L'armement a été supprimé avec succès.",
                                "success",
                                {
                                    title:
                                        "Suppression réussie"
                                }
                            );

                            await loadAgentArmements(
                                agentId,
                                container
                            );
                        }
                    );

                    item.appendChild(
                        weaponName
                    );

                    item.appendChild(
                        serial
                    );

                    item.appendChild(
                        deleteButton
                    );

                    container.appendChild(
                        item
                    );
                }
            );
        }
    );
}

// ============================================================
// AFFICHAGE DES VALEURS
// ============================================================

function renderAgentField(
    field,
    agent
) {
    const value =
        getAgentFieldValue(
            field,
            agent
        );

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    // Grade
    if (
        field.name === "grade"
    ) {
        return escapeAgentHtml(
            agent.grades?.nom ??
            "—"
        );
    }

    // Boolean
    if (
        field.type === "checkbox"
    ) {
        return value
            ? createBadge(
                "Oui",
                "success"
            ).outerHTML
            : createBadge(
                "Non",
                "default"
            ).outerHTML;
    }

    // Statut
    if (
        field.name === "statut"
    ) {
        const types = {
            "En service":
                "success",
            "En congé":
                "warning",
            "Suspendu":
                "danger",
            "Licencié":
                "danger",
            "Retraité":
                "default",
            "Démission":
                "default",
            "Archivé":
                "default"
        };

        return createBadge(
            String(value),
            types[value] ??
                "default"
        ).outerHTML;
    }

    // Blâme
    if (
        field.name === "blame"
    ) {
        return createBadge(
            `Blâme ${value}`,
            "warning"
        ).outerHTML;
    }

    return escapeAgentHtml(
        String(value)
    );
}

// ============================================================
// RECUPERATION VALEUR
// ============================================================

function getAgentFieldValue(
    field,
    agent
) {
    return agent[field.name];
}

// ============================================================
// MODAL MODIFICATION CARD
// ============================================================

function openAgentCardEditModal(
    cardConfig,
    agent
) {
    const fields =
        Array.isArray(
            cardConfig.fields
        )
            ? cardConfig.fields.filter(
                field =>
                    field.edit === true
            )
            : [];

    if (
        fields.length === 0
    ) {
        return;
    }

    // On réutilise la configuration globale de modification.
    // On ne modifie PAS agentsConfig.
    const modalConfig = {
        ...agentsConfig,

        edit: {
            ...agentsConfig.edit,
            title:
                `Modifier — ${cardConfig.title}`,
            fields
        }
    };

    createModal({
        config: modalConfig,
        data: agent,
        mode: "edit",
        title:
            `Modifier — ${cardConfig.title}`,

        onSave: async (
            values,
            originalData
        ) => {
            const { error } =
                await supabaseClient
                    .from("agents")
                    .update(values)
                    .eq(
                        "id",
                        originalData.id
                    );

            if (error) {
                console.error(
                    "Erreur modification agent :",
                    error
                );

                createAlert(
                    "Impossible de modifier l'agent.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "Les informations ont été modifiées avec succès.",
                "success",
                {
                    title:
                        "Modification réussie"
                }
            );

            await loadAgentFiche(
                originalData.id
            );
        }
    });
}

// ============================================================
// UTILITAIRE HTML
// ============================================================

function escapeAgentHtml(
    value
) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

// ============================================================
// START
// ============================================================

initAgentsPage();