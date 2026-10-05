const gradesConfig = {
    table: "grades",
    list: {
        newButton: true,
        columns: [
            {
                key: "nom",
                label: "Nom"
            },
            {
                key: "priority",
                label: "Ordre"
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
        title: "Nouveau grade",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Sheriff",
                required: true,
                width: 2
            },
            {
                name: "priority",
                label: "Ordre",
                type: "number",
                placeholder: "Ex : 1",
                required: true,
                width: 2
            }
        ]
    },


    /*
     * Modification
     */

    edit: {
        title: "Modifier le grade",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Sheriff",
                required: true,
                width: 2
            },
            {
                name: "priority",
                label: "Ordre",
                type: "number",
                placeholder: "Ex : 1",
                required: true,
                width: 2
            }
        ]
    }
};