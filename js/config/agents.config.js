const agentsConfig = {
    table: "agents",
    show: {
        url: "agents.html?id={id}"
    },
    list: {
        newButton: true,
        newButtonPermission: "agents.create",
        columns: [
            {
                key: "matricule",
                label: "Matricule"
            },
            {
                key: "nom",
                label: "Nom",
                render: (value, row) => {
                    return row.prenom + " " + row.nom.toUpperCase()
                }
            },
            {
                key: "grades",
                label: "Grade",
                render: value =>
                    value?.nom
                        ? createBadge(
                            value.nom,
                            "accent"
                        ).outerHTML
                        : "—"
            },
            {
                key: "divisions",
                label: "Divisions",
                render: value => {
                    if (
                        !value ||
                        value.length === 0
                    ) {
                        return "—";
                    }

                    return value
                        .map(
                            division =>
                                createBadge(
                                    division.label ??
                                        division.nom,
                                    division.couleur ??
                                        "default"
                                ).outerHTML
                        )
                        .join(" ");
                }
            },
            {
                key: "formations",
                label: "Formations",
                render: value => {
                    if (
                        !value ||
                        value.length === 0
                    ) {
                        return "—";
                    }

                    return value
                        .map(
                            formation =>
                                createBadge(
                                    formation.label ??
                                        formation.nom,
                                    "default"
                                ).outerHTML
                        )
                        .join(" ");
                }
            },
            {
                key: "ppa",
                label: "PPA",
                render: (value, row) => {
                    const count =
                        Number(Boolean(row.ppa_1)) +
                        Number(Boolean(row.ppa_2)) +
                        Number(Boolean(row.ppa_3));

                    return count > 0
                        ? createBadge(
                            `PPA ${count}/3`,
                            "accent"
                        ).outerHTML
                        : "—";
                }
            },
            {
                key: "statut",
                label: "Statut",
                render: value => {
                    const types = {
                        "En service": "success",
                        "En congé": "warning",
                        "Suspendu": "danger",
                        "Licencié": "danger",
                        "Retraité": "default",
                        "Démission": "default",
                        "Archivé": "default"
                    };

                    return createBadge(
                        value ?? "—",
                        types[value] ?? "default"
                    ).outerHTML;
                }
            },
            {
                key: "actions",
                label: "Actions",
                buttons: [
                    "show",
                    {
                        key: "edit",
                        permission: "agents.edit"
                    },
                    {
                        key: "delete",
                        permission: "agents.delete"
                    },
                    {
                        key: "suivi",
                        label: "Suivis",
                        icon: "▤",
                        permissionCheck: row =>
                            Permissions.canAccessSuivi(row.id),
                        action: async row => {
                            const allowed =
                                await Permissions.canAccessSuivi(row.id);

                            if (!allowed) return;

                            window.location.href =
                                `suivis.html?id=${encodeURIComponent(row.id)}`;
                        }
                    }
                ]
            }
        ]
    },


    /*
     * Création
     */

    create: {
        title: "Nouvel agent",
        fields: [
            {
                name: "prenom",
                label: "Prénom",
                type: "text",
                placeholder: "Ex : John",
                required: true,
                width: 2
            },
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Doe",
                required: true,
                width: 2
            },
            {
                name: "matricule",
                label: "Matricule",
                type: "number",
                placeholder: "Ex : 100",
                required: true,
                width: 2
            },
            {
                name: "grade",
                label: "Grade",
                type: "select",
                required: false,
                width: 2,

                source: {
                    table: "grades",
                    value: "id",
                    label: "nom",
                    orderBy: "priority",
                    ascending: true
                }
            },
            {
                name: "telephone",
                label: "Téléphone",
                type: "text",
                placeholder: "Ex : (555) 0000",
                required: false,
                width: 2
            },
            {
                name: "iban",
                label: "IBAN",
                type: "text",
                placeholder: "Ex : 524156435465413",
                required: false,
                width: 2
            },
            {
                name: "fti",
                label: "FTI",
                type: "select",
                required: false,
                width: 4,

                source: {
                    table: "agents",
                    value: "id",
                    label: "matricule",
                    orderBy: "nom",
                    ascending: true
                },
                render: (value, row) => {
                    return row.prenom + " " + row.nom.toUpperCase()
                }
            },
            {
                name: "agent_formateur",
                label: "Agent formateur",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "statut",
                label: "Statut",
                type: "select",
                required: true,
                width: 2,

                options: [
                    {
                        value: "En service",
                        label: "En service",
                        default: true
                    },
                    {
                        value: "En congé",
                        label: "En congé"
                    },
                    {
                        value: "Suspendu",
                        label: "Suspendu"
                    },
                    {
                        value: "Licencié",
                        label: "Licencié"
                    },
                    {
                        value: "Retraité",
                        label: "Retraité"
                    },
                    {
                        value: "Démission",
                        label: "Démission"
                    },
                    {
                        value: "Archivé",
                        label: "Archivé"
                    }
                ]
            },
            {
                name: "ppa_1",
                label: "PPA 1",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "ppa_2",
                label: "PPA 2",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "ppa_3",
                label: "PPA 3",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "blame",
                label: "Blâme",
                type: "select",
                valueType: "number",
                required: false,
                width: 4,

                options: [
                    {
                        value: "",
                        label: "Aucun",
                        default: true
                    },
                    {
                        value: "1",
                        label: "Blâme 1"
                    },
                    {
                        value: "2",
                        label: "Blâme 2"
                    },
                    {
                        value: "3",
                        label: "Blâme 3"
                    }
                ]
            },
            {
                name: "date_arrivee",
                label: "Date d'arrivée",
                type: "date",
                required: false,
                width: 2
            },
            {
                name: "last_promotion",
                label: "Dernière promotion",
                type: "date",
                required: false,
                width: 2
            },
            {
                name: "notes_internes",
                label: "Notes internes",
                type: "textarea",
                placeholder: "Ex : Ma note interne...",
                required: false,
                width: 4
            }
        ]
    },


    /*
     * Modification
     */

    edit: {
        title: "Modifier l'agent",

        fields: [
            {
                name: "prenom",
                label: "Prénom",
                type: "text",
                placeholder: "Ex : Doe",
                required: true,
                width: 2
            },
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : John",
                required: true,
                width: 2
            },
            {
                name: "matricule",
                label: "Matricule",
                type: "number",
                placeholder: "Ex : 100",
                required: true,
                width: 2
            },
            {
                name: "grade",
                label: "Grade",
                type: "select",
                required: false,
                width: 2,

                source: {
                    table: "grades",
                    value: "id",
                    label: "nom",
                    orderBy: "priority",
                    ascending: true
                }
            },
            {
                name: "telephone",
                label: "Téléphone",
                type: "text",
                placeholder: "Ex : (555) 0000",
                required: false,
                width: 2
            },
            {
                name: "iban",
                label: "IBAN",
                type: "text",
                placeholder: "Ex : 524156435465413",
                required: false,
                width: 2
            },
            {
                name: "fti",
                label: "FTI",
                type: "select",
                required: false,
                width: 4,

                source: {
                    table: "agents",
                    value: "id",
                    label: "nom",
                    orderBy: "nom",
                    ascending: true
                }
            },

            {
                name: "agent_formateur",
                label: "Agent formateur",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "statut",
                label: "Statut",
                type: "select",
                required: true,
                width: 2,

                options: [
                    {
                        value: "En service",
                        label: "En service"
                    },
                    {
                        value: "En congé",
                        label: "En congé"
                    },
                    {
                        value: "Suspendu",
                        label: "Suspendu"
                    },
                    {
                        value: "Licencié",
                        label: "Licencié"
                    },
                    {
                        value: "Retraité",
                        label: "Retraité"
                    },
                    {
                        value: "Démission",
                        label: "Démission"
                    },
                    {
                        value: "Archivé",
                        label: "Archivé"
                    }
                ]
            },
            {
                name: "ppa_1",
                label: "PPA 1",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "ppa_2",
                label: "PPA 2",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "ppa_3",
                label: "PPA 3",
                type: "checkbox",
                required: false,
                width: 4
            },
            {
                name: "blame",
                label: "Blâme",
                type: "select",
                valueType: "number",
                required: false,
                width: 4,

                options: [
                    {
                        value: "",
                        label: "Aucun"
                    },
                    {
                        value: "1",
                        label: "Blâme 1"
                    },
                    {
                        value: "2",
                        label: "Blâme 2"
                    },
                    {
                        value: "3",
                        label: "Blâme 3"
                    }
                ]
            },
            {
                name: "date_arrivee",
                label: "Date d'arrivée",
                type: "date",
                required: false,
                width: 2
            },
            {
                name: "last_promotion",
                label: "Dernière promotion",
                type: "date",
                required: false,
                width: 2
            },
            {
                name: "notes_internes",
                label: "Notes internes",
                type: "textarea",
                placeholder: "Ex : Ma note interne...",
                required: false,
                width: 4
            }
        ]
    },
    /*
     * ============================================================
     * FICHE AGENT
     * ============================================================
     */

    cards: [

        {
            key: "identite",
            title: "Identité",
            icon: "👤",
            width: 1,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "prenom",
                    label: "Prénom",
                    placeholder: "Ex : John",
                    edit: true,
                    width: 2
                },
                {
                    name: "nom",
                    label: "Nom",
                    placeholder: "Ex : Doe",
                    edit: true,
                    width: 2
                },
                {
                    name: "matricule",
                    label: "Matricule",
                    placeholder: "Ex : 100",
                    edit: true,
                    width: 2
                }

            ]
        },
        {
            key: "carriere",
            title: "Carrière",
            icon: "📈",
            width: 1,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "grade",
                    label: "Grade",
                    type: "select",
                    edit: true,
                    width: 2,
                    source: {
                        table: "grades",
                        value: "id",
                        label: "nom",
                        orderBy: "priority",
                        ascending: true
                    }
                },
                {
                    name: "statut",
                    label: "Statut",
                    edit: true,
                    width: 2,
                    type: "select",
                    options: [
                        {
                            value: "En service",
                            label: "En service",
                            default: true
                        },
                        {
                            value: "En congé",
                            label: "En congé"
                        },
                        {
                            value: "Suspendu",
                            label: "Suspendu"
                        },
                        {
                            value: "Licencié",
                            label: "Licencié"
                        },
                        {
                            value: "Retraité",
                            label: "Retraité"
                        },
                        {
                            value: "Démission",
                            label: "Démission"
                        },
                        {
                            value: "Archivé",
                            label: "Archivé"
                        }
                    ]
                },
                {
                    name: "agent_formateur",
                    label: "Agent formateur",
                    type: "checkbox",
                    edit: true,
                    width: 1
                }
            ]
        },
        {
            key: "coordonnees",
            title: "Coordonnées",
            icon: "📞",
            width: 1,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "telephone",
                    label: "Téléphone",
                    placeholder: "Ex : (555) 0000",
                    edit: true,
                    width: 2
                },
                {
                    name: "iban",
                    label: "IBAN",
                    placeholder: "Ex : 524156435465413",
                    edit: true,
                    width: 2
                }
            ]
        },
        {
            key: "informations",
            title: "Informations",
            icon: "ℹ️",
            width: 1,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "blame",
                    label: "Blâme",
                    type: "select",
                    valueType: "number",
                    edit: true,
                    width: 4,
                    options: [
                        {
                            value: "",
                            label: "Aucun",
                            default: true
                        },
                        {
                            value: "1",
                            label: "Blâme 1"
                        },
                        {
                            value: "2",
                            label: "Blâme 2"
                        },
                        {
                            value: "3",
                            label: "Blâme 3"
                        }
                    ]
                },
                {
                    name: "date_arrivee",
                    label: "Date d'arrivée",
                    type: "date",
                    edit: true,
                    width: 2
                },
                {
                    name: "last_promotion",
                    label: "Dernière promotion",
                    type: "date",
                    edit: true,
                    width: 2
                }
            ]
        },
        {
            key: "ppa",
            title: "PPA",
            icon: "📚",
            width: 1,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "ppa_1",
                    label: "PPA 1",
                    type: "checkbox",
                    edit: true,
                    width: 4
                },
                {
                    name: "ppa_2",
                    label: "PPA 2",
                    type: "checkbox",
                    edit: true,
                    width: 4
                },
                {
                    name: "ppa_3",
                    label: "PPA 3",
                    type: "checkbox",
                    edit: true,
                    width: 4
                }
            ]
        },
        
        /*
         * ========================================================
         * RELATIONS
         * ========================================================
         *
         * Pour l'instant ces cards sont préparées.
         * Les modals spécialisées seront ajoutées ensuite.
         */

        {
            key: "armements",
            title: "Armements",
            icon: "🔫",
            width: 1,
            modal: "armements",
            createPermission: "agents.create",
            editPermission: "agents.edit",
            deletePermission: "agents.delete"
        },
        {
            key: "divisions",
            title: "Divisions",
            icon: "🎖️",
            width: 1,
            modal: "divisions",
            createPermission: "agents.create",
            editPermission: "agents.edit",
            deletePermission: "agents.delete"
        },
        {
            key: "formations",
            title: "Formations",
            icon: "🎓",
            width: 1,
            modal: "formations",
            createPermission: "agents.create",
            editPermission: "agents.edit",
            deletePermission: "agents.delete"
        },
        {
            key: "notes",
            title: "Notes internes",
            icon: "📝",
            width: 4,
            editPermission: "agents.edit",
            fields: [
                {
                    name: "notes_internes",
                    label: "Notes internes",
                    edit: true,
                    type: "textarea",
                    placeholder: "Ex : Ma note interne...",
                    width: 4
                }
            ]
        },
        {
            key: "activite",
            title: "Activité",
            subtitle: "Primes hebdomadaires",
            icon: "📈",
            width: 4,
            highcharts: {
                render: "renderAgentPrimeChart"
            }
        }

    ]
};