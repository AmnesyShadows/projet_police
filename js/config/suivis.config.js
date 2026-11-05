
const suivisConfig = {
    table: "suivis_agents",

    show: {
        url: row =>
            `suivis.html?id=${encodeURIComponent(row.agent_id)}`
    },

    list: {
        columns: [
            {
                key: "agent",
                label: "Agent",
                render: (value, row) => {
                    const agent = row.agents;

                    if (!agent) return "Agent inconnu";

                    return `${agent.prenom ?? ""} ${agent.nom ?? ""}`.trim();
                }
            },
            {
                key: "date_evaluation",
                label: "Date d'évaluation",
                render: value => {
                    if (!value) return "—";

                    return new Date(`${value}T00:00:00`)
                        .toLocaleDateString("fr-FR");
                }
            },
            {
                key: "niveau_actuel",
                label: "Niveau",
                render: value => createBadge(
                    value ? `Niveau ${value}/5` : "Niveau 0",
                    value ? "accent" : "default"
                ).outerHTML
            },
            {
                key: "evaluateur_nom",
                label: "Évaluateur",
                render: value => value || "—"
            },
            {
                key: "patrouilles_observees",
                label: "Patrouilles observées",
                render: value => value ?? 0
            },
            {
                key: "actions",
                label: "Actions",
                buttons: ["show"]
            }
        ]
    },

    /*
     * UNE SEULE CARD PAR ÉVALUATION
     */
    cards: [
        {
            key: "evaluation",
            title: "Évaluation",
            icon: "📋",
            width: 2,

            fields: [
                {
                    name: "agent.prenom",
                    label: "Nom",
                    render: (value, row) => {
                        const agent = row.agent;

                        if (!agent) return "Agent inconnu";

                        return `${agent.prenom ?? ""} ${agent.nom ?? ""}`.trim();
                    },
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "agent.matricule",
                    label: "Matricule",
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "agent.grades.nom",
                    label: "Grade",
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "agent.date_arrivee",
                    label: "Date d'arrivée",
                    type: "date",
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "tuteur",
                    label: "FTI",
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "patrouilles_observees",
                    label: "Patrouilles observées",
                    width: 2,
                    block: "informations",
                    blockTitle: "👤 Informations"
                },
                {
                    name: "evaluations",
                    label: "Compétences évaluées",
                    type: "json",
                    width: 2,
                    block: "evaluation",
                    blockTitle: "📊 Évaluation des compétences",
                    blockSubtitle:  `
                            🟥 <strong>1 — Insuffisant</strong><br>
                            🟧 <strong>2 — À améliorer</strong><br>
                            🟨 <strong>3 — Satisfaisant</strong><br>
                            🟩 <strong>4 — Bon</strong><br>
                            🟦 <strong>5 — Excellent</strong>
                        `
                },
                {
                    name: "points_forts",
                    label: "Points forts",
                    type: "json",
                    width: 2,
                    block: "points_forts",
                    blockTitle: "⭐ Points forts"
                },
                {
                    name: "axes_amelioration",
                    label: "Axes d'amélioration",
                    type: "json",
                    width: 2,
                    block: "axes",
                    blockTitle: "⚠️ Axes d'amélioration"
                },
                {
                    name: "objectifs",
                    label: "Objectifs",
                    type: "json",
                    width: 2,
                    block: "objectifs",
                    blockTitle: "🎯 Objectifs pour la prochaine évaluation"
                },
                {
                    name: "bilan_general",
                    label: "Bilan général",
                    type: "textarea",
                    width: 2,
                    block: "observations",
                    blockTitle: "📝 Observation du superviseur"
                },
                {
                    name: "niveau_actuel",
                    label: "Niveau actuel",
                    width: 2,
                    block: "evolution",
                    blockTitle: "📈 Évolution de l'agent",
                    render: value => {
                        const niveaux = {
                            1: "🔴 Niveau 1 - Découverte",
                            2: "🟠 Niveau 2 - Formation",
                            3: "🟡 Niveau 3 - Autonomie",
                            4: "🟢 Niveau 4 - Confirmé",
                            5: "🔵 Niveau 5 - Expert"
                        };

                        return niveaux[value] ?? "—";
                    }
                },
                // {
                //     name: "niveau_precedent",
                //     label: "Niveau précédent",
                //     width: 2,
                //     block: "evolution",
                //     blockTitle: "📈 Évolution du Rookie",
                //     render: value => {
                //         const niveaux = {
                //             1: "🔴 Niveau 1 - Découverte",
                //             2: "🟠 Niveau 2 - Formation",
                //             3: "🟡 Niveau 3 - Autonomie",
                //             4: "🟢 Niveau 4 - Confirmé",
                //             5: "🔵 Niveau 5 - Expert"
                //         };

                //         return niveaux[value] ?? "—";
                //     }
                // },
                {
                    name: "historique",
                    label: "Historique",
                    width: 2,
                    block: "evolution",
                    blockTitle: "📈 Évolution de l'agent"
                },
                {
                    name: "justification_evolution",
                    label: "Justification de l'évolution",
                    type: "textarea",
                    width: 2,
                    block: "evolution",
                    blockTitle: "📈 Évolution de l'agent",
                    blockSubtitle: `
                            ⚪ <strong>Niveau 0 — Aucun niveau précédent</strong><br><br>
                            🔴 <strong>Niveau 1 — Découverte</strong><br>L'agent découvre les procédures, le fonctionnement du service et nécessite un accompagnement constant.<br><br>
                            🟠 <strong>Niveau 2 — Formation</strong><br>L'agent commence à maîtriser les bases mais nécessite encore une supervision régulière.<br><br>
                            🟡 <strong>Niveau 3 — Progression</strong><br>L'agent est capable de gérer les situations courantes avec supervision et commence à prendre des initiatives.<br><br>
                            🟢 <strong>Niveau 4 — Autonomie</strong><br>L'agent maîtrise les procédures courantes et peut intervenir de manière autonome sur la majorité des situations.<br><br>
                            🔵 <strong>Niveau 5 — Validation</strong><br>L'agent démontre un niveau suffisant pour terminer sa période de formation et être proposé à la validation.
                        `
                },
                {
                    name: "evaluateur_nom",
                    label: "Nom de l'évaluateur",
                    width: 2,
                    block: "validation",
                    blockTitle: "✅ Validation"
                },
                {
                    name: "evaluateur_grade",
                    label: "Grade de l'évaluateur",
                    width: 2,
                    block: "validation",
                    blockTitle: "✅ Validation"
                },
                {
                    name: "evaluateur_matricule",
                    label: "Matricule de l'évaluateur",
                    width: 2,
                    block: "validation",
                    blockTitle: "✅ Validation"
                },
                {
                    name: "date_evaluation",
                    type: "date",
                    label: "Date",
                    width: 2,
                    block: "validation",
                    blockTitle: "✅ Validation"
                }
            ]
        }
    ]
};
