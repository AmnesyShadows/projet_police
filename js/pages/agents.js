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

    await Promise.all(
        data.map(async agent => {
            agent.divisions =
                await fetchAgentDivisions(
                    agent.id
                );
            agent.formations =
                await fetchAgentFormations(
                    agent.id
                );
        })
    );

    const pageSubtitle =
        document.querySelector(".page-subtitle");

    if (pageSubtitle) {
        pageSubtitle.textContent =
            `${data.length} ${data.length > 1 ? "agents enregistrés" : "agent enregistré"}`;
    }

    const table =
        createTable({
            config: agentsConfig,
            data: data,
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

    const toolbar =
        table.querySelector(
            ".table-toolbar"
        );

    const canAccessPointeuse =
        await Permissions.can("pointeuse.access");

    if (toolbar && canAccessPointeuse) {
        const pointeuseButton =
            document.createElement(
                "button"
            );

        pointeuseButton.type =
            "button";

        pointeuseButton.className =
            "btn-table-new";

        pointeuseButton.textContent =
            "📋 Pointeuse";

        pointeuseButton.addEventListener(
            "click",
            () => {
                openPointeuseModal();
            }
        );

        toolbar.appendChild(
            pointeuseButton
        );
    }

    container.appendChild(
        table
    );
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

async function canAgentCardAction(cardConfig, action) {
    const permission = cardConfig[`${action}Permission`];

    if (!permission) return true;

    try {
        return await Permissions.can(permission);
    } catch (error) {
        console.error(
            "Erreur permission carte :",
            permission,
            error
        );

        return false;
    }
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

    if (editableFields.length > 0) {
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "btn-card-edit";
        editButton.textContent = "✎ Modifier";

        const permission = cardConfig.editPermission;

        editButton.hidden = Boolean(permission);

        (async () => {
            if (!permission) {
                editButton.hidden = false;
                return;
            }

            try {
                const allowed = await Permissions.can(permission);
                editButton.hidden = !allowed;
            } catch (error) {
                console.error("Erreur permission carte :", permission, error);
                editButton.hidden = true;
            }
        })();

        editButton.addEventListener("click", async event => {
            event.preventDefault();
            event.stopPropagation();

            if (permission) {
                const allowed = await Permissions.can(permission);

                if (!allowed) {
                    editButton.hidden = true;
                    return;
                }
            }

            openAgentCardEditModal(cardConfig, agent);
        });

        headerActions = editButton;
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
        headerActions,
        highcharts:
            cardConfig.highcharts
                ? {
                    ...cardConfig.highcharts,
                    agentId:
                        agent.id,
                    agent
                }
                : null
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
        async event => {
            event.preventDefault();
            event.stopPropagation();

            const allowed = await canAgentCardAction(
                cardConfig,
                "create"
            );

            if (!allowed) {
                addButton.hidden = true;
                return;
            }

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

    const createPermission = cardConfig.createPermission;

    addButton.hidden = Boolean(createPermission);

    (async () => {
        const allowed = await canAgentCardAction(
            cardConfig,
            "create"
        );

        addButton.hidden = !allowed;
    })();

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

async function fetchAgentFormations(
    agentId
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

        return [];
    }

    if (
        !associations ||
        associations.length === 0
    ) {
        return [];
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
        return [];
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

        return [];
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

    return associations
        .map(association => {
            const formation =
                formationsById.get(
                    association.formation_id
                );

            if (!formation) {
                return null;
            }

            return {
                ...formation,
                label:
                    `${formation.icon ?? ""}${formation.icon ? " " : ""}${formation.nom}`
            };
        })
        .filter(Boolean);
}

// ============================================================
// FORMATIONS AGENT
// ============================================================

async function loadAgentFormations(
    agentId,
    container
) {
    container.innerHTML = "";

    const canDelete =
        await canAgentCardAction(
            { deletePermission: "agents.edit" },
            "delete"
        );

    const formations =
        await fetchAgentFormations(
            agentId
        );

    if (
        formations.length === 0
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

    formations.forEach(
        formation => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "specialized-card-item";

            const badge =
                createBadge(
                    formation.label,
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
            
            deleteButton.hidden = !canDelete;

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
                                formation.id
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
                                title:
                                    "Erreur"
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

async function fetchAgentDivisions(
    agentId
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

        return [];
    }

    if (
        !associations ||
        associations.length === 0
    ) {
        return [];
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
        return [];
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

        return [];
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

    return associations
        .map(association => {
            const division =
                divisionsById.get(
                    association.division_id
                );

            if (!division) {
                return null;
            }

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

            return {
                ...division,
                lead: Boolean(
                    association.lead
                ),
                co_lead: Boolean(
                    association.co_lead
                ),
                label
            };
        })
        .filter(Boolean);
}

// ============================================================
// DIVISIONS AGENT
// ============================================================

async function loadAgentDivisions(
    agentId,
    container
) {
    container.innerHTML = "";

    const canDelete =
        await canAgentCardAction(
            { deletePermission: "agents.edit" },
            "delete"
        );

    const divisions =
        await fetchAgentDivisions(
            agentId
        );

    if (
        divisions.length === 0
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

    divisions.forEach(
        division => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "specialized-card-item";

            const badge =
                createBadge(
                    division.label,
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
            
            deleteButton.hidden = !canDelete;

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
                                division.id
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

    const canDelete =
            await canAgentCardAction(
                { deletePermission: "agents.edit" },
                "delete"
            );

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

                    deleteButton.hidden = !canDelete;

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
// GRAPHIQUE ACTIVITE AGENT
// ============================================================

async function renderAgentPrimeChart({
    container,
    agentId
}) {
    if (
        typeof Highcharts === "undefined"
    ) {
        container.innerHTML = "";

        const message =
            document.createElement("div");

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Highcharts n'est pas chargé.";

        container.appendChild(
            message
        );

        return;
    }

    container.innerHTML = "";

    const {
        data: pointages,
        error
    } = await supabaseClient
        .from("pointages")
        .select(`
            agent_id,
            annee,
            semaine,
            heures,
            minutes,
            taux_horaire
        `)
        .order("annee", {
            ascending: true
        })
        .order("semaine", {
            ascending: true
        });

    if (error) {
        console.error(
            "Erreur récupération pointages pour le graphique :",
            error
        );

        const message =
            document.createElement("div");

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Impossible de récupérer les données d'activité.";

        container.appendChild(
            message
        );

        return;
    }

    if (
        !pointages ||
        pointages.length === 0
    ) {
        const message =
            document.createElement("div");

        message.className =
            "specialized-card-placeholder";

        message.textContent =
            "Aucune donnée de pointage disponible.";

        container.appendChild(
            message
        );

        return;
    }

    /*
    ============================================================
    CALCUL DES PRIMES
    ============================================================
    */

    const weeks = new Map();

    pointages.forEach(
        pointage => {
            const annee =
                Number(
                    pointage.annee
                );

            const semaine =
                Number(
                    pointage.semaine
                );

            const heures =
                Number(
                    pointage.heures
                ) || 0;

            const minutes =
                Number(
                    pointage.minutes
                ) || 0;

            const taux =
                Number(
                    pointage.taux_horaire
                ) || 0;

            const totalHeures = heures + minutes / 60;

            const plafond = taux * 30;

            let prime = totalHeures * taux;

            if (prime >= plafond) {
                const heuresSupplementaires =
                    totalHeures - plafond / taux;

                const bonus = Math.floor(
                    heuresSupplementaires / 10
                ) * 500;

                prime = plafond + bonus;
            }

            const key =
                `${annee}-${String(
                    semaine
                ).padStart(2, "0")}`;

            if (
                !weeks.has(key)
            ) {
                weeks.set(
                    key,
                    {
                        annee,
                        semaine,
                        primes: []
                    }
                );
            }

            weeks
                .get(key)
                .primes
                .push({
                    agentId:
                        String(
                            pointage.agent_id
                        ),
                    prime
                });
        }
    );

    /*
    ============================================================
    TRI DES SEMAINES
    ============================================================
    */

    const sortedWeeks =
        [...weeks.values()]
            .sort(
                (a, b) =>
                    a.annee - b.annee ||
                    a.semaine - b.semaine
            );

    /*
    ============================================================
    AXE X
    ============================================================
    */

    const categories =
        sortedWeeks.map(
            week =>
                `${week.annee} • S${week.semaine}`
        );

    /*
    ============================================================
    PRIME DE L'AGENT
    ============================================================
    */

    const agentSeries =
        sortedWeeks.map(
            week => {
                const agentPrime =
                    week.primes.find(
                        item =>
                            item.agentId ===
                            String(agentId)
                    );

                if (
                    !agentPrime
                ) {
                    return null;
                }

                return Number(
                    agentPrime.prime.toFixed(2)
                );
            }
        );

    /*
    ============================================================
    MOYENNE DE TOUS LES AGENTS
    ============================================================
    */

    const averageSeries =
        sortedWeeks.map(
            week => {
                if (
                    week.primes.length === 0
                ) {
                    return null;
                }

                const total =
                    week.primes.reduce(
                        (
                            sum,
                            item
                        ) =>
                            sum +
                            item.prime,
                        0
                    );

                const average =
                    total /
                    week.primes.length;

                return Number(
                    average.toFixed(2)
                );
            }
        );

    /*
    ============================================================
    HIGHCHARTS
    ============================================================
    */

    Highcharts.chart(
        container,
        {
            chart: {
                type: "line",
                height: 320
            },

            title: {
                text: null
            },

            credits: {
                enabled: false
            },

            xAxis: {
                categories,

                title: {
                    text: "Semaine"
                }
            },

            yAxis: {
                title: {
                    text: "Prime"
                },

                labels: {
                    formatter() {
                        return `${this.value} $`;
                    }
                }
            },

            tooltip: {
                shared: true,

                valueDecimals: 2,

                valueSuffix: " $"
            },

            legend: {
                enabled: true,
                align: "center",
                verticalAlign: "bottom",
                layout: "horizontal",
                itemStyle: {
                    color: "var(--text-secondary)",
                    fontWeight: "500"
                },
                itemHoverStyle: {
                    color: "var(--accent)"
                }
            },
                        plotOptions: {
                series: {
                    connectNulls: false
                }
            },

            series: [
                {
                    name: "Agent",
                    data: agentSeries,
                    color: "var(--accent)",
                    dashStyle: "Solid"
                },
                {
                    name: "Moyenne agents",
                    data: averageSeries,
                    color: "var(--text-secondary)",
                    dashStyle: "Dash"
                }
            ]
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
// POINTEUSE
// ============================================================

async function openPointeuseModal() {
    const now = new Date();

    const getISOWeek = date => {
        const target = new Date(date.valueOf());

        const dayNumber =
            (date.getDay() + 6) % 7;

        target.setDate(
            target.getDate() - dayNumber + 3
        );

        const firstThursday =
            new Date(
                target.getFullYear(),
                0,
                4
            );

        return (
            1 +
            Math.round(
                (
                    target -
                    firstThursday
                ) /
                604800000
            )
        );
    };

    const weekStart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    const semaineActuelle =
        getISOWeek(now);

    const {
        data: agents,
        error: agentsError
    } = await supabaseClient
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

    if (agentsError) {
        console.error(
            "Erreur récupération agents pour la pointeuse :",
            agentsError
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

    const gradesIds = [
        ...new Set(
            (agents ?? [])
                .map(agent => agent.grade)
                .filter(Boolean)
        )
    ];

    let tauxHoraires = [];

    if (gradesIds.length > 0) {
        const {
            data,
            error
        } = await supabaseClient
            .from("taux_horaires")
            .select(`
                id,
                grade,
                taux
            `)
            .in("grade", gradesIds);

        if (error) {
            console.error(
                "Erreur récupération taux horaires :",
                error
            );

            createAlert(
                "Impossible de récupérer les taux horaires.",
                "danger",
                {
                    title: "Erreur"
                }
            );

            return;
        }

        tauxHoraires = data ?? [];
    }

    const tauxByGrade = new Map(
        tauxHoraires.map(taux => [
            taux.grade,
            taux.taux
        ])
    );

    const agentsSorted = [...(agents ?? [])].sort(
        (a, b) => {
            const priorityA =
                a.grades?.priority ?? 999;

            const priorityB =
                b.grades?.priority ?? 999;

            return priorityA - priorityB ||
                a.matricule - b.matricule;
        }
    );

    const formatMoney = value =>
        new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: 0
        }).format(
            Math.round(value)
        ) + " $";
    
    const calculerPrime = (totalHeures, taux) => {
        const plafond = taux * 30;
        const heuresPlafond = 30;

        const primeBase = totalHeures * taux;

        if (taux <= 0 || primeBase < plafond) {
            return primeBase;
        }

        const heuresSupplementaires =
            totalHeures - heuresPlafond;

        const bonus =
            Math.floor(heuresSupplementaires / 10) * 500;

        return plafond + bonus;
    };

    createModal({
        config: {
            create: {
                fields: [
                    {
                        name: "semaine",
                        label: "Semaine",
                        type: "date",
                        required: true,
                        width: 4
                    }
                ]
            }
        },

        data: {
            semaine: weekStart
        },

        mode: "create",
        title: "Pointeuse hebdomadaire",

        content: container => {
            container.className = "modal-field-full";

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "pointeuse-wrapper";

            const header =
                document.createElement("div");

            header.className =
                "pointeuse-header";

            const headerInfo =
                document.createElement("div");

            headerInfo.className =
                "pointeuse-header-info";

            const heading =
                document.createElement("h4");

            heading.textContent =
                "Pointage des agents";

            const description =
                document.createElement("p");

            description.textContent =
                "Saisis les heures travaillées pour chaque agent.";

            headerInfo.appendChild(heading);
            headerInfo.appendChild(description);

            const count =
                document.createElement("span");

            count.className =
                "pointeuse-count";

            count.textContent =
                `${agentsSorted.length} agent${agentsSorted.length > 1 ? "s" : ""}`;

            header.appendChild(headerInfo);
            header.appendChild(count);

            wrapper.appendChild(header);

            const tableContainer =
                document.createElement("div");

            tableContainer.className =
                "pointeuse-table-container";

            const table =
                document.createElement("table");

            table.className =
                "pointeuse-table";

            const thead =
                document.createElement("thead");

            const headerRow =
                document.createElement("tr");

            [
                "Agent",
                "Grade",
                "Taux horaire",
                "Plafond",
                "Heures",
                "Prime"
            ].forEach(label => {
                const th =
                    document.createElement("th");

                th.textContent = label;

                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody =
                document.createElement("tbody");

            agentsSorted.forEach(agent => {
                const row =
                    document.createElement("tr");

                // AGENT
                const agentCell =
                    document.createElement("td");

                const agentWrapper =
                    document.createElement("div");

                agentWrapper.className =
                    "pointeuse-agent";

                const avatar =
                    document.createElement("div");

                avatar.className =
                    "pointeuse-avatar";

                const initiales =
                    `${(agent.prenom ?? "").charAt(0)}${(agent.nom ?? "").charAt(0)}`;

                avatar.textContent =
                    initiales.toUpperCase();

                const agentInfo =
                    document.createElement("div");

                agentInfo.className =
                    "pointeuse-agent-info";

                const agentName =
                    document.createElement("span");

                agentName.className =
                    "pointeuse-agent-name";

                agentName.textContent =
                    `${agent.prenom ?? ""} ${agent.nom ?? ""}`;

                const matricule =
                    document.createElement("span");

                matricule.className =
                    "pointeuse-agent-matricule";

                matricule.textContent =
                    `Matricule #${agent.matricule}`;

                agentInfo.appendChild(agentName);
                agentInfo.appendChild(matricule);

                agentWrapper.appendChild(avatar);
                agentWrapper.appendChild(agentInfo);

                agentCell.appendChild(agentWrapper);

                // GRADE
                const gradeCell =
                    document.createElement("td");

                gradeCell.innerHTML =
                    agent.grades?.nom
                        ? createBadge(
                            agent.grades.nom,
                            "accent"
                        ).outerHTML
                        : "—";

                // TAUX HORAIRE
                const tauxCell =
                    document.createElement("td");

                const taux =
                    tauxByGrade.get(agent.grade);

                const tauxLabel =
                    document.createElement("span");

                tauxLabel.className =
                    "pointeuse-taux";

                if (
                    taux !== undefined &&
                    taux !== null
                ) {
                    tauxLabel.textContent =
                        `${taux} $`;

                    const tauxUnit =
                        document.createElement("small");

                    tauxUnit.textContent =
                        " / h";

                    tauxLabel.appendChild(tauxUnit);
                } else {
                    tauxLabel.textContent = "—";
                }

                tauxCell.appendChild(tauxLabel);

                // PLAFOND
                const plafondCell = document.createElement("td");

                const plafondLabel = document.createElement("span");
                plafondLabel.className = "pointeuse-plafond";

                if (taux !== undefined && taux !== null) {
                    plafondLabel.textContent = `${taux * 30} $`;
                } else {
                    plafondLabel.textContent = "—";
                }

                plafondCell.appendChild(plafondLabel);

                // HEURES
                const heuresCell =
                    document.createElement("td");

                const heuresInput =
                    document.createElement("input");

                heuresInput.type = "text";

                heuresInput.className =
                    "pointeuse-heures";

                heuresInput.placeholder =
                    "3h20";

                heuresInput.autocomplete =
                    "off";

                heuresInput.dataset.agentId =
                    agent.id;

                heuresInput.setAttribute(
                    "aria-label",
                    `Heures de ${agent.prenom} ${agent.nom}`
                );

                heuresCell.appendChild(heuresInput);

                // PRIME
                const primeCell =
                    document.createElement("td");

                const primeLabel =
                    document.createElement("span");

                primeLabel.className =
                    "pointeuse-prime pointeuse-prime-empty";

                primeLabel.textContent =
                    "—";

                primeCell.appendChild(primeLabel);

                // CALCUL VISUEL
                heuresInput.addEventListener(
                    "input",
                    () => {
                        const value =
                            heuresInput.value.trim();

                        if (value === "") {
                            heuresInput.style.borderColor = "";
                            primeLabel.textContent = "—";
                            primeLabel.classList.add(
                                "pointeuse-prime-empty"
                            );
                            return;
                        }

                        const match = value.match(
                            /^(\d+)\s*h\s*(\d{1,2})?$/i
                        );

                        if (!match) {
                            heuresInput.style.borderColor =
                                "#e57373";

                            primeLabel.textContent =
                                "Format invalide";

                            primeLabel.classList.remove(
                                "pointeuse-prime-empty"
                            );

                            return;
                        }

                        const heures =
                            Number(match[1]);

                        const minutes =
                            Number(match[2] ?? 0);

                        if (minutes > 59) {
                            heuresInput.style.borderColor =
                                "#e57373";

                            primeLabel.textContent =
                                "Minutes invalides";

                            return;
                        }

                        heuresInput.style.borderColor = "";

                        if (
                            taux === undefined ||
                            taux === null
                        ) {
                            primeLabel.textContent =
                                "Taux manquant";

                            return;
                        }

                        const totalHeures =
                            heures + minutes / 60;

                        const prime = calculerPrime(
                            totalHeures,
                            Number(taux)
                        );

                        primeLabel.textContent =
                            formatMoney(prime);

                        primeLabel.classList.remove(
                            "pointeuse-prime-empty"
                        );
                    }
                );

                row.appendChild(agentCell);
                row.appendChild(gradeCell);
                row.appendChild(tauxCell);
                row.appendChild(plafondCell);
                row.appendChild(heuresCell);
                row.appendChild(primeCell);

                tbody.appendChild(row);
            });

            if (agentsSorted.length === 0) {
                const emptyRow =
                    document.createElement("tr");

                const emptyCell =
                    document.createElement("td");

                emptyCell.colSpan = 5;

                emptyCell.className =
                    "pointeuse-empty";

                emptyCell.textContent =
                    "Aucun agent trouvé.";

                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
            }

            table.appendChild(tbody);
            tableContainer.appendChild(table);
            wrapper.appendChild(tableContainer);
            container.appendChild(wrapper);
        },

        onSave: async values => {
            const inputs =
                document.querySelectorAll(
                    ".pointeuse-heures"
                );

            const pointages = [];

            inputs.forEach(input => {
                const value =
                    input.value.trim();

                if (!value) {
                    return;
                }

                const match =
                    value.match(
                        /^(\d+)\s*h\s*(\d{1,2})?$/i
                    );

                if (!match) {
                    return;
                }

                const heures =
                    Number(match[1]);

                const minutes =
                    Number(match[2] ?? 0);

                if (
                    minutes < 0 ||
                    minutes > 59
                ) {
                    return;
                }

                const agentId =
                    input.dataset.agentId;

                const agent =
                    agentsSorted.find(
                        item =>
                            item.id === agentId
                    );

                if (!agent) {
                    return;
                }

                const taux =
                    tauxByGrade.get(
                        agent.grade
                    );

                if (
                    taux === undefined ||
                    taux === null
                ) {
                    return;
                }

                const semaineDate =
                    new Date(
                        `${values.semaine}T12:00:00`
                    );

                const annee =
                    semaineDate.getFullYear();

                const semaine =
                    getISOWeek(semaineDate);

                pointages.push({
                    agent_id: agent.id,
                    annee,
                    semaine,
                    heures,
                    minutes,
                    taux_horaire: Number(taux)
                });
            });

            if (pointages.length === 0) {
                createAlert(
                    "Aucun pointage à enregistrer.",
                    "warning",
                    {
                        title: "Pointeuse"
                    }
                );

                return;
            }

            const {
                error
            } =
                await supabaseClient
                    .from("pointages")
                    .upsert(
                        pointages,
                        {
                            onConflict:
                                "agent_id,annee,semaine"
                        }
                    );

            if (error) {
                console.error(
                    "Erreur enregistrement pointages :",
                    error
                );

                createAlert(
                    "Impossible d'enregistrer les pointages.",
                    "danger",
                    {
                        title: "Erreur"
                    }
                );

                return;
            }

            createAlert(
                `${pointages.length} pointage${pointages.length > 1 ? "s" : ""} enregistré${pointages.length > 1 ? "s" : ""} avec succès.`,
                "success",
                {
                    title: "Pointeuse"
                }
            );
        }
    });
}

// ============================================================
// START
// ============================================================

initAgentsPage();