const formationsConfig = {
    table: "formations",
    cards: {
        key: "formation",
        title: "Formation",
        icon: "🎓",
        width: 1,
        fields: [
            {
                name: "nom",
                label: "Nom",
                edit: true,
                width: 4
            }
        ]
    },
    create: {
        title: "Nouvelle formation",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Mary",
                required: true,
                width: 4
            },
            {
                name: "icon",
                label: "Icon",
                type: "text",
                placeholder: "Ex : 🏍️",
                required: true,
                width: 4
            }
        ]
    },

    edit: {
        title: "Modifier la formation",
        fields: [
            {
                name: "nom",
                label: "Nom",
                type: "text",
                placeholder: "Ex : Mary",
                required: true,
                width: 4
            },
            {
                name: "icon",
                label: "Icon",
                type: "text",
                placeholder: "Ex : 🏍️",
                required: true,
                width: 4
            }
        ]
    }
};