const pointeuseConfig = {
    list: {
        columns: [
            {
                key: "matricule",
                label: "Matricule"
            },
            {
                key: "nom",
                label: "Nom"
            },
            {
                key: "prenom",
                label: "Prénom"
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
                key: "heures",
                label: "Heures"
            },
            {
                key: "prime",
                label: "Prime"
            },
            {
                key: "actions",
                label: "Actions",
                buttons: [
                    "pointage"
                ]
            }
        ]
    }
};