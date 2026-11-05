document.addEventListener("DOMContentLoaded", async () => {
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return;

    const agentId = new URLSearchParams(window.location.search).get("id");

    if (agentId) {
        await loadAgentSuivis(agentId, pageContent);
    } else {
        const allowed = await Permissions.can("suivis.access");

        if (!allowed) {
            window.location.replace("./agents.html");
            return;
        }

        await loadSuivis();
    }
});

async function loadSuivis() {
    const container = document.getElementById("suivis-table");
    if (!container) return;

    container.innerHTML = "";

    const currentAgent = await Permissions.getCurrentAgent();
    if (!currentAgent) return;

    const isPrivileged =
        currentAgent.admin === true ||
        currentAgent.grade?.etat_major === true;

    let agentIds = [];

    // Un FTI ne récupère que les agents qui lui sont affectés.
    if (!isPrivileged) {
        const { data: assignedAgents, error: assignedError } =
            await supabaseClient
                .from("agents")
                .select("id")
                .eq("fti", currentAgent.id);

        if (assignedError) {
            console.error(
                "Erreur récupération des agents affectés au FTI :",
                assignedError
            );

            createAlert(
                "Impossible de récupérer les agents qui vous sont affectés.",
                "danger",
                { title: "Erreur" }
            );
            return;
        }

        agentIds = (assignedAgents ?? []).map(agent => agent.id);

        if (agentIds.length === 0) {
            const subtitle = document.querySelector(".page-subtitle");

            if (subtitle) {
                subtitle.textContent = "0 évaluation enregistrée";
            }

            container.textContent =
                "Aucun suivi enregistré pour le moment.";
            return;
        }
    }

    let query = supabaseClient
        .from("suivis_agents")
        .select(`*, agents(id, prenom, nom, matricule, grades(nom))`);

    if (!isPrivileged) {
        query = query.in("agent_id", agentIds);
    }

    const { data, error } = await query
        .order("date_evaluation", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erreur récupération suivis :", error);
        createAlert("Impossible de récupérer les suivis.", "danger", {
            title: "Erreur"
        });
        return;
    }

    const suivis = data ?? [];
    const subtitle = document.querySelector(".page-subtitle");

    if (subtitle) {
        subtitle.textContent =
            `${suivis.length} évaluation(s) enregistrée(s)`;
    }

    if (!suivis.length) {
        container.textContent = "Aucun suivi enregistré pour le moment.";
        return;
    }

    const table = createTable({
        config: suivisConfig,
        data: suivis,
        columns: suivisConfig.list.columns,
        onRowClick: suivi => openSuiviAgent(suivi),
        onDelete: async suivi => {
            const { error } = await supabaseClient
                .from("suivis_agents")
                .delete()
                .eq("id", suivi.id);

            if (error) {
                console.error(error);
                createAlert("Impossible de supprimer ce suivi.", "danger");
                return;
            }

            createAlert("Suivi supprimé.", "success");
            await loadSuivis();
        }
    });

    container.appendChild(table);
}

function openSuiviAgent(suivi) {
    if (!suivi?.agent_id) {
        createAlert("Identifiant de l'agent introuvable.", "danger");
        return;
    }

    window.location.href =
        `suivis.html?id=${encodeURIComponent(suivi.agent_id)}`;
}

async function loadAgentSuivis(agentId, pageContent) {
    const allowed = await Permissions.canAccessSuivi(agentId);

    if (!allowed) {
        window.location.replace("./agents.html");
        return;
    }

    pageContent.querySelectorAll(
        ".card-back-button, .suivi-agent-title, .suivi-actions, .card-grid-detail"
    ).forEach(el => el.remove());

    const tableContainer = document.getElementById("suivis-table");
    const ficheContainer = document.getElementById("suivi-fiche");

    if (tableContainer) tableContainer.style.display = "none";
    if (ficheContainer) ficheContainer.style.display = "none";

    pageContent.querySelectorAll(".page-title-wrapper").forEach(el => el.remove());

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id, prenom, nom, matricule, grades(nom), date_arrivee")
        .eq("id", agentId)
        .single();

    if (agentError || !agent) {
        console.error("Erreur récupération agent :", agentError);
        createAlert("Impossible de retrouver cet agent.", "danger", {
            title: "Fiche introuvable"
        });
        return;
    }

    const { data: evaluations, error } = await supabaseClient
        .from("suivis_agents")
        .select("*")
        .eq("agent_id", agentId)
        .order("date_evaluation", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erreur récupération évaluations :", error);
        createAlert("Impossible de récupérer les évaluations de cet agent.", "danger");
        return;
    }

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "btn-table view card-back-button";
    backButton.textContent = "← Retour aux agents";

    backButton.addEventListener("click", () => {
        window.location.href = "agents.html";
    });

    pageContent.appendChild(backButton);

    const title = createPageTitle(
        `${agent.prenom} ${agent.nom}`,
        `Matricule ${agent.matricule ?? "—"} · ${evaluations?.length ?? 0} évaluation(s)`,
        { className: "suivi-agent-title", icon: "👮" }
    );

    pageContent.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "suivi-actions";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.marginBottom = "20px";

    const createButton = document.createElement("button");
    createButton.type = "button";
    createButton.className = "btn-table-new";
    createButton.textContent = "+ Créer un rapport";

    createButton.addEventListener("click", () => {
        if (typeof window.openCreateSuiviModal !== "function") {
            console.error(
                "openCreateSuiviModal est introuvable. Vérifie le chargement de suivis-form.js."
            );
            createAlert(
                "Le formulaire de création n'est pas chargé.",
                "danger"
            );
            return;
        }

        window.openCreateSuiviModal({
            agent,
            onSaved: async () => {
                await loadAgentSuivis(agentId, pageContent);
            }
        });
    });

    actions.appendChild(createButton);
    pageContent.appendChild(actions);

    const grid = document.createElement("div");
    grid.className = "card-grid-detail";
    pageContent.appendChild(grid);

    if (!evaluations?.length) {
        const empty = document.createElement("div");
        empty.className = "specialized-card-placeholder";
        empty.textContent = "Aucune évaluation enregistrée pour cet agent.";
        grid.appendChild(empty);
        return;
    }

    const radarContent = document.createElement("div");
    radarContent.style.width = "100%";
    radarContent.style.minWidth = "0";

    const radarCard = createCard({
        title: "Radar des compétences",
        subtitle: "Progression au fil des évaluations",
        icon: "🎯",
        width: 4,
        content: radarContent
    });

    grid.appendChild(radarCard);

    renderAgentCompetencesRadar({
        container: radarContent,
        evaluations,
        agent
    });

    evaluations.forEach((evaluation, index) => {
        const date = evaluation.date_evaluation
            ? new Date(`${evaluation.date_evaluation}T00:00:00`)
                .toLocaleDateString("fr-FR")
            : "Date inconnue";

        const couleursNote = {
            1: "🟥",
            2: "🟧",
            3: "🟨",
            4: "🟩",
            5: "🟦"
        };

        const valuesNote = {
            1: "Insuffisant",
            2: "À améliorer",
            3: "Satisfaisant",
            4: "Bon",
            5: "Excellent"
        };

        (suivisConfig.cards ?? []).forEach(cardConfig => {
            const contents = {};

            (cardConfig.fields ?? []).forEach(field => {
                const block = field.block ?? "informations";
                const blockTitle = field.blockTitle ?? "";
                const blockSubtitle = field.blockSubtitle ?? "";

                if (!contents[block]) {
                    contents[block] = {
                        title: blockTitle || block,
                        subtitle: blockSubtitle,
                        content: document.createElement("div")
                    };

                    contents[block].content.className = "card-fields";
                }

                if (field.name === "historique") {
                    const row = document.createElement("div");
                    row.className = "card-field card-field-textarea";

                    const label = document.createElement("div");
                    label.className = "card-field-label";
                    label.textContent = field.label ?? "Historique";

                    const value = document.createElement("div");
                    value.className = "card-field-value";

                    const couleursNiveau = {
                        1: "🔴",
                        2: "🟠",
                        3: "🟡",
                        4: "🟢",
                        5: "🔵"
                    };

                    const nomsNiveaux = {
                        1: "Niveau 1 - Découverte",
                        2: "Niveau 2 - Formation",
                        3: "Niveau 3 - Autonomie",
                        4: "Niveau 4 - Confirmé",
                        5: "Niveau 5 - Expert"
                    };

                    evaluations.slice(index + 1).forEach(precedente => {
                        const ligne = document.createElement("div");
                        ligne.className = "card-field";

                        const datePrecedente = document.createElement("div");
                        datePrecedente.className = "card-field-label";
                        datePrecedente.textContent =
                            `📅 ${formatDate(precedente.date_evaluation)}`;

                        const niveauPrecedent = document.createElement("div");
                        niveauPrecedent.className = "card-field-value";

                        const niveau = precedente.niveau_actuel;

                        niveauPrecedent.textContent = niveau
                            ? `${couleursNiveau[niveau] ?? "⚪"} ${nomsNiveaux[niveau] ?? `Niveau ${niveau}`}`
                            : "Niveau non renseigné";

                        ligne.append(datePrecedente, niveauPrecedent);
                        value.appendChild(ligne);
                    });

                    row.append(label, value);
                    contents[block].content.appendChild(row);
                    return;
                }

                const row = document.createElement("div");

                row.className = field.type === "textarea"
                    ? "card-field card-field-textarea"
                    : "card-field";

                const label = document.createElement("div");
                label.className = "card-field-label";
                label.textContent = field.label ?? field.name;

                const value = document.createElement("div");
                value.className = "card-field-value";

                const rowData = { ...evaluation, agent };

                const raw = field.render
                    ? field.render(
                        field.name.split(".").reduce(
                            (obj, key) => obj?.[key],
                            rowData
                        ),
                        rowData
                    )
                    : field.name.split(".").reduce(
                        (obj, key) => obj?.[key],
                        rowData
                    );

                if (field.type === "json" && field.block === "evaluation") {
                    const evaluationsJson = typeof raw === "string"
                        ? JSON.parse(raw)
                        : raw;

                    if (
                        evaluationsJson &&
                        typeof evaluationsJson === "object"
                    ) {
                        Object.values(evaluationsJson).forEach(item => {
                            const row = document.createElement("div");
                            row.className = "card-field card-field-textarea";

                            const label = document.createElement("div");
                            label.className = "card-field-label";
                            label.textContent = item.competence ?? "Compétence";

                            const value = document.createElement("div");
                            value.className = "card-field-value";

                            const note = document.createElement("div");
                            note.textContent =
                                `Niveau : ${couleursNote[item.note] ?? "—"} ${item.note ?? "—"}/5 — ${valuesNote[item.note] ?? "—"}`;

                            const observations = document.createElement("div");
                            observations.textContent =
                                `Observations : ${item.observations ?? "—"}`;

                            value.append(note, observations);
                            row.append(label, value);
                            contents[block].content.appendChild(row);
                        });
                    }

                    return;
                }

                if (
                    field.type === "json" &&
                    (
                        field.block === "points_forts" ||
                        field.block === "axes" ||
                        field.block === "objectifs"
                    )
                ) {
                    const pointsForts = typeof raw === "string"
                        ? JSON.parse(raw)
                        : raw;

                    if (Array.isArray(pointsForts)) {
                        const liste = document.createElement("ul");
                        liste.style.listStyleType = "disc";
                        liste.style.paddingLeft = "20px";
                        liste.style.margin = "0";

                        pointsForts.forEach(point => {
                            const item = document.createElement("li");
                            item.textContent = point;
                            liste.appendChild(item);
                        });

                        contents[block].content.appendChild(liste);
                    }

                    return;
                }

                const formattedRaw = field.type === "date" && raw
                    ? formatDate(raw)
                    : raw;

                if (
                    formattedRaw === null ||
                    formattedRaw === undefined ||
                    formattedRaw === ""
                ) {
                    value.textContent = "—";
                } else if (formattedRaw instanceof HTMLElement) {
                    value.appendChild(formattedRaw);
                } else if (typeof formattedRaw === "object") {
                    value.textContent = JSON.stringify(formattedRaw, null, 2);
                    value.style.whiteSpace = "pre-wrap";
                } else {
                    value.textContent = String(formattedRaw);
                }

                row.append(label, value);
                contents[block].content.appendChild(row);
            });

            const card = createCard({
                title: `${cardConfig.title} du ${date}`,
                subtitle: "",
                icon: cardConfig.icon,
                width: cardConfig.width
            });

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn-card-edit";
            editButton.textContent = "✎ Modifier";

            editButton.addEventListener("click", event => {
                event.stopPropagation();

                if (typeof window.openEditSuiviModal !== "function") {
                    createAlert(
                        "Le formulaire de modification n'est pas chargé.",
                        "danger"
                    );
                    return;
                }

                window.openEditSuiviModal({
                    agent,
                    suivi: evaluation,
                    onSaved: async () => {
                        await loadAgentSuivis(agentId, pageContent);
                    }
                });
            });

            const cardHeaderActions = document.createElement("div");
            cardHeaderActions.className = "card-header-actions";
            cardHeaderActions.appendChild(editButton);

            const cardHeader = card.querySelector(".card-header");

            if (cardHeader) {
                cardHeader.appendChild(cardHeaderActions);
            }

            Object.entries(contents).forEach(([block, section]) => {
                addToCard(card, {
                    title: section.title,
                    subtitle: section.subtitle,
                    icon: "",
                    content: section.content
                });
            });

            grid.appendChild(card);
        });
    });
}

function formatDate(value, format = "d/m/Y") {
    if (!value) return "—";

    const date = value instanceof Date
        ? value
        : new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    const parts = {
        d: String(date.getDate()).padStart(2, "0"),
        m: String(date.getMonth() + 1).padStart(2, "0"),
        Y: String(date.getFullYear())
    };

    return format.replace(/[dmY]/g, token => parts[token]);
}

async function renderAgentCompetencesRadar({ container, evaluations, agent }) {
    container.innerHTML = "";

    if (
        typeof Highcharts === "undefined" ||
        !Highcharts.seriesTypes ||
        !Highcharts.seriesTypes.column
    ) {
        container.textContent =
            "Highcharts ou son module histogramme n'est pas chargé.";
        return;
    }

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
        container.textContent = "Aucune évaluation disponible.";
        return;
    }

    const styles = getComputedStyle(container);

    const getThemeColor = (variable, fallback) =>
        styles.getPropertyValue(variable).trim() || fallback;

    const textColor = getThemeColor("--text", "#e5e7eb");
    const borderColor = getThemeColor("--border", "#34383f");
    const surfaceColor = getThemeColor("--surface", "#202328");

    const couleursParNote = {
        1: "#ef4444",
        2: "#f97316",
        3: "#eab308",
        4: "#22c55e",
        5: "#0ea5e9"
    };

    const donnees = evaluations.map(evaluation => {
        let competences = evaluation.evaluations;

        if (typeof competences === "string") {
            try {
                competences = JSON.parse(competences);
            } catch (error) {
                console.error("Erreur JSON des compétences :", error);
                competences = {};
            }
        }

        return {
            date: evaluation.date_evaluation,
            createdAt: evaluation.created_at,
            competences:
                competences &&
                typeof competences === "object" &&
                !Array.isArray(competences)
                    ? competences
                    : {}
        };
    }).sort((a, b) => {
        const comparaison = String(a.date ?? "").localeCompare(
            String(b.date ?? "")
        );

        if (comparaison !== 0) return comparaison;

        return String(a.createdAt ?? "").localeCompare(
            String(b.createdAt ?? "")
        );
    });

    const dernierSuivi = donnees[donnees.length - 1];
    const competencesMap = new Map();

    donnees.forEach(evaluation => {
        Object.entries(evaluation.competences).forEach(([key, item]) => {
            if (!item || typeof item !== "object") return;

            if (!competencesMap.has(key)) {
                competencesMap.set(key, {
                    key,
                    label: item.competence || key
                });
            }
        });
    });

    const competences = [...competencesMap.values()];

    if (competences.length === 0) {
        container.textContent =
            "Aucune compétence exploitable dans les évaluations.";
        return;
    }

    const points = competences.map(competence => {
        const item = dernierSuivi.competences[competence.key];
        let note = null;

        if (
            item &&
            item.note !== null &&
            item.note !== undefined &&
            item.note !== ""
        ) {
            const valeur = Number(item.note);

            if (
                Number.isFinite(valeur) &&
                valeur >= 1 &&
                valeur <= 5
            ) {
                note = valeur;
            }
        }

        return {
            name: competence.label,
            y: note,
            color: note === null
                ? "transparent"
                : couleursParNote[Math.round(note)],
            custom: {
                note,
                competence: competence.label
            }
        };
    });

    if (!points.some(point => point.y !== null)) {
        container.textContent =
            "Aucune note disponible pour le dernier suivi.";
        return;
    }

    const dateLabel = dernierSuivi.date
        ? formatDate(dernierSuivi.date)
        : "";

    const notes = points
        .map(point => point.y)
        .filter(note => note !== null && note !== undefined);

    const moyenne = notes.length
        ? notes.reduce((total, note) => total + note, 0) / notes.length
        : 0;

    const moyenneAffichee = moyenne.toFixed(1).replace(".", ",");

    container.innerHTML = "";

    const layout = document.createElement("div");
    layout.style.display = "flex";
    layout.style.flexDirection = "column";
    layout.style.gap = "10px";
    layout.style.width = "100%";

    const moyenneBloc = document.createElement("div");
    moyenneBloc.style.textAlign = "center";

    moyenneBloc.innerHTML = `
        <div style="font-size: 15px; color: ${textColor};">
            Moyenne générale
        </div>
        <div style="font-size: 48px; font-weight: 800; color: ${textColor};">
            ${moyenneAffichee}
            <span style="font-size: 20px; opacity: 0.7;">/ 5</span>
        </div>
    `;

    const graphique = document.createElement("div");
    graphique.style.width = "100%";

    layout.appendChild(moyenneBloc);
    layout.appendChild(graphique);
    container.appendChild(layout);

    const chart = Highcharts.chart(graphique, {
        chart: {
            polar: true,
            type: "column",
            backgroundColor: "transparent",
            height: 450,
            spacing: [20, 18, 35, 18],
            style: {
                fontFamily: "inherit"
            },
            events: {
                render: function () {
                    const axis = this.yAxis[0];

                    const label3 = axis.ticks[3]?.label;
                    const label4 = axis.ticks[4]?.label;
                    const label5 = axis.ticks[5]?.label;

                    if (!label3 || !label4 || !label5) return;

                    const position3 = label3.xy;
                    const position4 = label4.xy;

                    if (!position3 || !position4) return;

                    const ecart = position3.y - position4.y;

                    label5.attr({
                        visibility: "visible",
                        opacity: 1,
                        x: position4.x,
                        y: position4.y - ecart
                    });
                }
            }
        },
        title: {
            text: null
        },
        exporting: {
            enabled: false
        },
        subtitle: {
            text: null
        },
        credits: {
            enabled: false
        },
        accessibility: {
            enabled: false
        },
        pane: {
            size: "84%",
            startAngle: 0,
            endAngle: 360
        },
        xAxis: {
            categories: competences.map(item => item.label),
            tickmarkPlacement: "on",
            lineWidth: 0,
            gridLineColor: borderColor,
            labels: {
                distance: 22,
                style: {
                    color: textColor,
                    fontSize: "12px",
                    textOutline: "none"
                }
            }
        },
        yAxis: {
            min: 0,
            max: 5,
            tickPositions: [0, 1, 2, 3, 4, 5],
            startOnTick: false,
            endOnTick: false,
            lineWidth: 0,
            gridLineInterpolation: "circle",
            gridLineColor: borderColor,
            gridLineWidth: 1,
            title: {
                text: null
            },
            labels: {
                enabled: true,
                align: "center",
                x: 0,
                y: 3,
                overflow: "allow",
                crop: false,
                reserveSpace: false,
                style: {
                    color: textColor,
                    fontSize: "10px",
                    textOutline: "none"
                }
            }
        },
        tooltip: {
            backgroundColor: surfaceColor,
            borderColor: borderColor,
            borderRadius: 6,
            shadow: false,
            style: {
                color: textColor
            },
            formatter: function () {
                const note = this.point.custom.note;

                if (note === null) {
                    return (
                        `<b>${this.point.custom.competence}</b><br>` +
                        "Aucune note"
                    );
                }

                const couleur = {
                    1: "🟥",
                    2: "🟧",
                    3: "🟨",
                    4: "🟩",
                    5: "🟦"
                }[Math.round(note)];

                const appreciation = {
                    1: "Insuffisant",
                    2: "À améliorer",
                    3: "Satisfaisant",
                    4: "Bon",
                    5: "Excellent"
                }[Math.round(note)];

                return (
                    `<b>${this.point.custom.competence}</b><br>` +
                    `Niveau : ${couleur}<b>${note}/5</b> — ${appreciation}`
                );
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            column: {
                pointPlacement: "on",
                pointPadding: 0,
                groupPadding: 0,
                borderWidth: 1,
                borderColor: surfaceColor,
                borderRadius: 0
            },
            series: {
                animation: false,
                states: {
                    inactive: {
                        opacity: 1
                    }
                }
            }
        },
        series: [{
            name: "Dernier suivi",
            data: points,
            showInLegend: false
        }]
    });

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "btn-table other";
    exportButton.textContent = "⬇ Télécharger en PNG";
    exportButton.style.display = "block";
    exportButton.style.margin = "25px auto";


    exportButton.addEventListener("click", async () => {
        const canvas = await html2canvas(layout, {
            backgroundColor: surfaceColor,
            scale: 2
        });

        const link = document.createElement("a");
        link.download = `suivi-${agent.prenom}-${agent.nom}`.toLowerCase();
        link.href = canvas.toDataURL("image/png");
        link.click();
    });

    container.appendChild(exportButton);

    const dateElement = document.createElement("div");
    dateElement.style.textAlign = "center";
    dateElement.style.color = textColor;
    dateElement.style.fontSize = "12px";
    dateElement.style.padding = "4px 0 10px";

    dateElement.textContent = dateLabel
        ? `Dernier suivi — ${dateLabel}`
        : "Dernier suivi";

    container.appendChild(dateElement);
}