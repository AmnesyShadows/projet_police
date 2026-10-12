const divisionsConfig = {
    table: "divisions",
    cards: {
        key: "division",
        title: "Division",
        icon: "🎖️",
        width: 1,
        fields: [
            {
                name: "nom_complet",
                label: "Nom complet",
                edit: true,
                width: 4
            },
            {
                name: "nom",
                label: "Abréviation",
                edit: true,
                width: 4
            }
        ]
    },
    create: {
        title: "Nouvelle division",
        fields: [
            {
                name: "nom_complet",
                label: "Nom complet",
                type: "text",
                placeholder: "Ex : Police Academy",
                required: true,
                width: 4
            },
            {
                name: "nom",
                label: "Abréviation",
                type: "text",
                placeholder: "Ex : PA",
                required: true,
                width: 4
            },
            {
                name: "couleur",
                label: "Affichage",
                type: "select",
                required: true,
                width: 4,

                options: [
                    {
                        value: "info",
                        label: "Bleu"
                    },
                    {
                        value: "accent",
                        label: "Doré"
                    },
                    {
                        value: "default",
                        label: "Gris",
                    },
                    {
                        value: "warning",
                        label: "Jaune"
                    },
                    {
                        value: "danger",
                        label: "Rouge"
                    },
                    {
                        value: "success",
                        label: "Vert"
                    }
                ]
            }
        ]
    },

    edit: {
        title: "Modifier la division",
        fields: [
            {
                name: "nom_complet",
                label: "Nom complet",
                type: "text",
                placeholder: "Ex : Police Academy",
                required: true,
                width: 4
            },
            {
                name: "nom",
                label: "Abréviation",
                type: "text",
                placeholder: "Ex : PA",
                required: true,
                width: 4
            },
            {
                name: "couleur",
                label: "Affichage",
                type: "select",
                required: true,
                width: 4,

                options: [
                    {
                        value: "info",
                        label: "Bleu"
                    },
                    {
                        value: "accent",
                        label: "Doré"
                    },
                    {
                        value: "default",
                        label: "Gris",
                    },
                    {
                        value: "warning",
                        label: "Jaune"
                    },
                    {
                        value: "danger",
                        label: "Rouge"
                    },
                    {
                        value: "success",
                        label: "Vert"
                    }
                ]
            }
        ]
    }
};