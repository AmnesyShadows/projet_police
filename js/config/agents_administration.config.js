const agentsConfig = {
    table: "agents-administration",
    list: {
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
                key: "discord_id",
                label: "ID Discord"
            },
            {
                key: "admin",
                label: "Est Admin ?",
                render: (value, row) => {
                    return createBadge(
                        value ? "Admin" : "Pas Admin",
                        value ? "success" : "danger"
                    ).outerHTML
                }
            },
            {
                key: "actions",
                label: "Actions",
                buttons: [
                    {
                        key: "edit",
                        permission: "agents.administration.edit"
                    }
                ]
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
                name: "discord_id",
                label: "ID Discord",
                type: "text",
                placeholder: "Ex : 21345156456456165084065486",
                width: 2
            },
            {
                name: "admin",
                label: "Est Admin ?",
                type: "checkbox",
                width: 2
            }
        ]
    }
};