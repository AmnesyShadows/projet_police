const permissionsConfig = {
    rules: {

        // ============================================================
        // TABLEAU DE BORD
        // ============================================================

        "dashboard.access": {},


        // ============================================================
        // AGENTS
        // ============================================================

        // Accès à la page
        "agents.access": {},

        // Gestion générale des agents
        "agents.create": {
            admin: true,
            etatMajor: true
        },

        "agents.edit": {
            admin: true,
            etatMajor: true
        },

        "agents.delete": {
            admin: true,
            etatMajor: true
        },

        // Notes internes et promotions
        "agents.internal_notes": {
            etatMajor: true
        },

        "agents.promote": {
            minPriority: null
        },


        // ============================================================
        // SUIVIS
        // ============================================================

        "suivis.access": {
            admin: true,
            etatMajor: true,
            assignedFti: true
        },

        "suivis.create": { 
            admin: true, 
            etatMajor: true 
        },

        "suivis.edit": { 
            admin: true,
            etatMajor: true 
        },


        // ============================================================
        // ADMINISTRATION AGENTS
        // ============================================================

        "agents.administration.access": { 
            admin: true
        },

        "agents.administration.edit": { 
            admin: true
        },

        // ============================================================
        // POINTEUSE
        // ============================================================

        "pointeuse.access": {
            admin: true,
            etatMajor: true
        },


        // ============================================================
        // CARTE
        // ============================================================

        "carte.access": {},


        // ============================================================
        // ARMES
        // ============================================================

        "armes.access": {
            admin: true
        },

        "armes.create": {
            admin: true
        },


        // ============================================================
        // GRADES
        // ============================================================

        "grades.access": {
            admin: true
        },

        "grades.create": {
            admin: true
        },


        // ============================================================
        // DIVISIONS
        // ============================================================

        "divisions.access": {
            admin: true
        },

        "divisions.create": {
            admin: true
        },


        // ============================================================
        // FORMATIONS
        // ============================================================

        "formations.access": {
            admin: true
        },

        "formations.create": {
            admin: true
        },


        // ============================================================
        // TAUX HORAIRES
        // ============================================================

        // Accès à la page
        "taux_horaires.access": {
            admin: true
        },

        // Création et modification
        "taux_horaires.create": {
            admin: true
        },

        "taux_horaires.edit": {
            etatMajor: true
        },
        

        // ============================================================
        // COMPTABILITE
        // ============================================================

        "comptabilite.access": {
            admin: true,
            etatMajor: true
        },
        

        // ============================================================
        // COMPTABILITE
        // ============================================================

        "points.access": {
            admin: true
        },


        // ============================================================
        // TESTS / DÉVELOPPEMENT
        // ============================================================

        "components_test.access": {}

    }
};