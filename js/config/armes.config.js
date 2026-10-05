const armesConfig = {
    table: "armes",
    list: {
        newButton: true,
        columns: [
            {
                key: "nom",
                label: "Nom"
            },
            {
                key: "ppa_minimum",
                label: "PPA minimum"
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
        title: "Nouvelle arme",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Glock 17",
                required: true,
                width: 2
            },
            {
                name: "ppa_minimum",
                label: "PPA minimum",
                type: "select",
                required: true,
                width: 2,

                options: [
                    {
                        value: 0,
                        label: "Sans PPA",
                    },
                    {
                        value: 1,
                        label: "PPA 1"
                    },
                    {
                        value: 2,
                        label: "PPA 2"
                    },
                    {
                        value: 3,
                        label: "PPA 3"
                    }
                ]
            }
        ]
    },


    /*
     * Modification
     */

    edit: {
        title: "Modifier l'arme",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Glock 17",
                required: true,
                width: 2
            },
            {
                name: "ppa_minimum",
                label: "PPA minimum",
                type: "select",
                required: true,
                width: 2,

                options: [
                    {
                        value: 0,
                        label: "Sans PPA",
                    },
                    {
                        value: 1,
                        label: "PPA 1"
                    },
                    {
                        value: 2,
                        label: "PPA 2"
                    },
                    {
                        value: 3,
                        label: "PPA 3"
                    }
                ]
            }
        ]
    }
};