const menuConfig = [
    {
        title: "Général",
        menu: [
            {
                title: "Agents",
                icon: "👮‍♂️",
                page: "../pages/agents.html",
                index: true,
                permission: "agents.access"
            },
            {
                title: "Suivis",
                icon: "📝",
                page: "../pages/suivis.html",
                permission: "suivis.access"
            },
            {
                title: "Carte",
                icon: "🗺️",
                page: "../pages/carte.html",
                permission: "carte.access"
            }
        ]
    },
    {
        title: "Administration",
        menu: [
            {
                title: "Comptabilité",
                icon: "🧾",
                page: "../pages/comptabilite.html",
                permission: "comptabilite.access"
            },
            {
                title: "Administration Agents",
                icon: "⛔",
                page: "../pages/agents_administration.html",
                permission: "agents.administration.access"
            },
            {
                title: "Points",
                icon: "📍",
                page: "../pages/points.html",
                permission: "points.access"
            },
            {
                title: "Armes",
                icon: "🔫",
                page: "../pages/armes.html",
                permission: "armes.access"
            },
            {
                title: "Grades",
                icon: "⭐",
                page: "../pages/grades.html",
                permission: "grades.access"
            },
            {
                title: "Divisions",
                icon: "🎖️",
                page: "../pages/divisions.html",
                permission: "divisions.access"
            },
            {
                title: "Formations",
                icon: "🎓",
                page: "../pages/formations.html",
                permission: "formations.access"
            },
            {
                title: "Taux horaires",
                icon: "💵",
                page: "../pages/taux-horaires.html",
                permission: "taux_horaires.access"
            }
        ]
    }
];