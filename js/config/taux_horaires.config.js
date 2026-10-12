const tauxHorairesConfig = {
    table: "grades",
    list: {
        newButton: true,
        columns: [
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
                key: "taux",
                label: "Taux",
                render: value =>
                    value + " $ / h"
            },
            {
                key: "actions",
                label: "Actions",
                buttons: [
                    "edit",
                    "delete"
                ]
            }
        ]
    },

    /*
     * Création
     */

    create: {
        title: "Nouveau taux horaire",
        fields: [
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
                name: "taux",
                label: "Taux",
                type: "number",
                placeholder: "Ex : 100",
                required: true,
                width: 2
            },
        ]
    },


    /*
     * Modification
     */

    edit: {
        title: "Modifier le taux horaire",
        fields: [
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
                name: "taux",
                label: "Taux",
                type: "number",
                placeholder: "Ex : 100",
                required: true,
                width: 2
            },
        ]
    }
};