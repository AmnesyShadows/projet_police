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

    const pageSubtitle =
        document.querySelector(".page-subtitle");

    if (pageSubtitle) {
        pageSubtitle.textContent =
            `${data.length} ${data.length > 1 ? "agents enregistrés" : "agent enregistré"}`;
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

    const grid =
        document.createElement(
            "div"
        );

    grid.className =
        "card-grid-detail";

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
    if (cardConfig.modal) {
        return createSpecializedAgentCard(
            cardConfig,
            agent
        );
    }

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
        document.createElement("div");

    content.className =
        "specialized-card";

    const message =
        document.createElement("div");

    message.className =
        "specialized-card-placeholder";

    message.textContent =
        "Chargement...";

    content.appendChild(message);

    const footer =
        document.createElement("div");

    footer.className =
        "card-actions";

    const addButton =
        document.createElement("button");

    addButton.type = "button";
    addButton.className =
        "btn-table-new";
    addButton.textContent =
        "+ Ajouter";

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

            if (
                cardConfig.key ===
                "divisions"
            ) {
                openAddDivisionModal(
                    agent,
                    content
                );

                return;
            }

            if (
                cardConfig.key ===
                "formations"
            ) {
                openAddFormationModal(
                    agent,
                    content
                );

                return;
            }
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

    if (
        cardConfig.key ===
        "divisions"
    ) {
        loadAgentDivisions(
            agent.id,
            content
        );
    }

    if (
        cardConfig.key ===
        "formations"
    ) {
        loadAgentFormations(
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
// AJOUT DIVISION
// ============================================================

function openAddDivisionModal(
    agent,
    container
) {
    const modalConfig = {
        create: {
            fields: [
                {
                    name: "division_id",
                    label: "Division",
                    type: "select",
                    required: true,
                    width: 4,
                    source: {
                        table: "divisions",
                        value: "id",
                        label: "nom",
                        orderBy: "nom",
                        ascending: true
                    }
                },
                {
                    name: "role",
                    label: "Rôle",
                    type: "select",
                    required: true,
                    width: 4,
                    options: [
                        {
                            value: "none",
                            label: "Aucun rôle"
                        },
                        {
                            value: "lead",
                            label: "Lead"
                        },
                        {
                            value: "co_lead",
                            label: "Co-lead"
                        }
                    ]
                }
            ]
        }
    };

    createModal({
        config: modalConfig,
        data: {},
        mode: "create",
        title: "Ajouter une division",

        onSave: async values => {
            const lead =
                values.role === "lead";

            const coLead =
                values.role === "co_lead";

            const payload = {
                agent_id: agent.id,
                division_id:
                    values.division_id,
                lead,
                co_lead: coLead
            };

            const { error } =
                await supabaseClient
                    .from("agent_divisions")
                    .insert(payload);

            if (error) {
                console.error(
                    "Erreur ajout division :",
                    error
                );

                createAlert(
                    "Impossible d'ajouter cette division.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La division a été ajoutée avec succès.",
                "success",
                {
                    title: "Ajout réussi"
                }
            );

            await loadAgentDivisions(
                agent.id,
                container
            );
        }
    });
}

// ============================================================
// AJOUT FORMATION
// ============================================================

function openAddFormationModal(
    agent,
    container
) {
    const modalConfig = {
        create: {
            fields: [
                {
                    name: "formation_id",
                    label: "Formation",
                    type: "select",
                    required: true,
                    width: 4,
                    source: {
                        table: "formations",
                        value: "id",
                        label: "nom",
                        orderBy: "nom",
                        ascending: true
                    }
                }
            ]
        }
    };

    createModal({
        config: modalConfig,
        data: {},
        mode: "create",
        title: "Ajouter une formation",

        onSave: async values => {
            const { error } =
                await supabaseClient
                    .from("agent_formations")
                    .insert({
                        agent_id: agent.id,
                        formation_id:
                            values.formation_id
                    });

            if (error) {
                console.error(
                    "Erreur ajout formation :",
                    error
                );

                createAlert(
                    "Impossible d'ajouter cette formation.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                "La formation a été ajoutée avec succès.",
                "success",
                {
                    title: "Ajout réussi"
                }
            );

            await loadAgentFormations(
                agent.id,
                container
            );
        }
    });
}

// ============================================================
// FORMATIONS AGENT
// ============================================================

async function loadAgentFormations(
    agentId,
    container
) {
    const {
        data: associations,
        error: associationsError
    } =
        await supabaseClient
            .from("agent_formations")
            .select(`
                agent_id,
                formation_id
            `)
            .eq(
                "agent_id",
                agentId
            );

    if (associationsError) {
        console.error(
            "Erreur récupération associations formations :",
            associationsError
        );

        container.innerHTML = "";

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les formations.";

        container.appendChild(
            message
        );

        return;
    }

    container.innerHTML = "";

    if (
        !associations ||
        associations.length === 0
    ) {
        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucune formation attribuée.";

        container.appendChild(
            message
        );

        return;
    }

    const formationIds = [
        ...new Set(
            associations
                .map(
                    association =>
                        association.formation_id
                )
                .filter(Boolean)
        )
    ];

    if (
        formationIds.length === 0
    ) {
        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucune formation attribuée.";

        container.appendChild(
            message
        );

        return;
    }

    const {
        data: formations,
        error: formationsError
    } =
        await supabaseClient
            .from("formations")
            .select(`
                id,
                nom,
                icon
            `)
            .in(
                "id",
                formationIds
            )
            .order(
                "nom",
                {
                    ascending: true
                }
            );

    if (formationsError) {
        console.error(
            "Erreur récupération formations :",
            formationsError
        );

        container.innerHTML = "";

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les formations.";

        container.appendChild(
            message
        );

        return;
    }

    const formationsById =
        new Map(
            (formations ?? []).map(
                formation => [
                    formation.id,
                    formation
                ]
            )
        );

    associations.forEach(
        association => {
            const formation =
                formationsById.get(
                    association.formation_id
                );

            if (!formation) {
                return;
            }

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "specialized-card-item";

            const badge =
                createBadge(
                    `${formation.icon ?? ""}${formation.icon ? " " : ""}${formation.nom}`,
                    "default"
                );
            
            badge.classList.add(
                "agent-division-large-badge"
            );

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
                "Retirer cette formation";

            deleteButton.addEventListener(
                "click",
                async event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const confirmed =
                        window.confirm(
                            `Retirer la formation "${formation.nom}" de cet agent ?`
                        );

                    if (!confirmed) {
                        return;
                    }

                    const { error } =
                        await supabaseClient
                            .from(
                                "agent_formations"
                            )
                            .delete()
                            .eq(
                                "agent_id",
                                agentId
                            )
                            .eq(
                                "formation_id",
                                association.formation_id
                            );

                    if (error) {
                        console.error(
                            "Erreur suppression formation agent :",
                            error
                        );

                        createAlert(
                            "Impossible de retirer cette formation.",
                            "danger",
                            {
                                title: "Erreur"
                            }
                        );

                        return;
                    }

                    createAlert(
                        "La formation a été retirée de l'agent.",
                        "success",
                        {
                            title:
                                "Suppression réussie"
                        }
                    );

                    await loadAgentFormations(
                        agentId,
                        container
                    );
                }
            );

            item.appendChild(
                badge
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

// ============================================================
// DIVISIONS AGENT
// ============================================================

async function loadAgentDivisions(
    agentId,
    container
) {
    const {
        data: associations,
        error: associationsError
    } =
        await supabaseClient
            .from("agent_divisions")
            .select(`
                agent_id,
                division_id,
                lead,
                co_lead
            `)
            .eq(
                "agent_id",
                agentId
            );

    if (associationsError) {
        console.error(
            "Erreur récupération associations divisions :",
            associationsError
        );

        container.innerHTML = "";

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les divisions.";

        container.appendChild(
            message
        );

        return;
    }

    container.innerHTML = "";

    if (
        !associations ||
        associations.length === 0
    ) {
        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucune division attribuée.";

        container.appendChild(
            message
        );

        return;
    }

    const divisionIds = [
        ...new Set(
            associations
                .map(
                    association =>
                        association.division_id
                )
                .filter(Boolean)
        )
    ];

    if (
        divisionIds.length === 0
    ) {
        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucune division attribuée.";

        container.appendChild(
            message
        );

        return;
    }

    const {
        data: divisions,
        error: divisionsError
    } =
        await supabaseClient
            .from("divisions")
            .select(`
                id,
                nom,
                nom_complet,
                couleur
            `)
            .in(
                "id",
                divisionIds
            );

    if (divisionsError) {
        console.error(
            "Erreur récupération divisions :",
            divisionsError
        );

        container.innerHTML = "";

        const message =
            document.createElement(
                "div"
            );

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les divisions.";

        container.appendChild(
            message
        );

        return;
    }

    const divisionsById =
        new Map(
            (divisions ?? []).map(
                division => [
                    division.id,
                    division
                ]
            )
        );

    associations.forEach(
        association => {
            const division =
                divisionsById.get(
                    association.division_id
                );

            if (!division) {
                return;
            }

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "specialized-card-item";

            let label =
                division.nom ?? "—";

            if (
                association.lead
            ) {
                label =
                    `LEAD ${label}`;
            } else if (
                association.co_lead
            ) {
                label =
                    `CO-LEAD ${label}`;
            }

            const badge =
                createBadge(
                    label,
                    division.couleur ||
                        "default"
                );

            badge.classList.add(
                "agent-division-large-badge"
            );

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
                "Retirer cette division";

            deleteButton.addEventListener(
                "click",
                async event => {
                    event.preventDefault();
                    event.stopPropagation();

                    const confirmed =
                        window.confirm(
                            `Retirer la division "${division.nom_complet ?? division.nom}" de cet agent ?`
                        );

                    if (!confirmed) {
                        return;
                    }

                    const {
                        error
                    } =
                        await supabaseClient
                            .from(
                                "agent_divisions"
                            )
                            .delete()
                            .eq(
                                "agent_id",
                                agentId
                            )
                            .eq(
                                "division_id",
                                association.division_id
                            );

                    if (error) {
                        console.error(
                            "Erreur suppression division agent :",
                            error
                        );

                        createAlert(
                            "Impossible de retirer cette division.",
                            "danger",
                            {
                                title:
                                    "Erreur"
                            }
                        );

                        return;
                    }

                    createAlert(
                        "La division a été retirée de l'agent.",
                        "success",
                        {
                            title:
                                "Suppression réussie"
                        }
                    );

                    await loadAgentDivisions(
                        agentId,
                        container
                    );
                }
            );

            item.appendChild(
                badge
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

            armements.forEach(
                armement => {
                    const item =
                        document.createElement(
                            "div"
                        );

                    item.className =
                        "specialized-card-item";

                    const weaponName =
                        document.createElement(
                            "div"
                        );

                    weaponName.className =
                        "specialized-card-item-title";

                    weaponName.textContent =
                        armement.armes?.nom ??
                        "Arme inconnue";

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

    if (
        field.name === "grade"
    ) {
        return escapeAgentHtml(
            agent.grades?.nom ??
            "—"
        );
    }

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