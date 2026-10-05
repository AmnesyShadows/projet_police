const armementsConfig = {
    table: "armements",
    fields: [
        {
            name: "arme_id",
            label: "Arme",
            type: "select",
            required: true,
            width: 2,

            source: {
                table: "armes",
                value: "id",
                label: "nom",
                orderBy: "ppa_minimum",
                ascending: true
            }
        },
        {
            name: "numero_serie",
            label: "Numéro de série",
            type: "text",
            placeholder: "Ex : ABC123456",
            required: true,
            width: 2
        }
    ]
};