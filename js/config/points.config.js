const pointsConfig = {

    locations: {
        table: "locations",

        list: {
            newButton: true,

            columns: [
                {
                    key: "name",
                    label: "Nom"
                },
                {
                    key: "visible",
                    label: "Visibilité"
                },
                {
                    key: "actions",
                    label: "Actions",
                    buttons: ["edit"]
                }
            ]
        }
    },

    zones: {
        table: "zones",

        list: {
            newButton: true,

            columns: [
                {
                    key: "name",
                    label: "Nom"
                },
                {
                    key: "visible",
                    label: "Visibilité"
                },
                {
                    key: "actions",
                    label: "Actions",
                    buttons: ["edit"]
                }
            ]
        }
    }

};