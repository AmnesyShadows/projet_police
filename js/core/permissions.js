
/* ============================================================
   SYSTÈME CENTRALISÉ DE PERMISSIONS
   ============================================================ */

const Permissions = (() => {
    let currentAgent = null;
    let loadingAgent = null;

    const rules = permissionsConfig.rules;

    async function getCurrentAgent() {
        if (currentAgent) return currentAgent;
        if (loadingAgent) return loadingAgent;

        loadingAgent = (async () => {
            const { data: sessionData, error: sessionError } =
                await supabaseClient.auth.getSession();

            if (sessionError) throw sessionError;

            const user = sessionData.session?.user;

            if (!user) {
                window.location.replace("./connexion.html");
                return null;
            }

            const identity = user.identities?.find(
                item => item.provider === "discord"
            );

            const discordId = String(
                user.user_metadata?.provider_id ??
                user.user_metadata?.sub ??
                identity?.identity_data?.provider_id ??
                identity?.identity_data?.sub ??
                identity?.id ??
                ""
            );

            if (!discordId) {
                throw new Error("Identifiant Discord introuvable.");
            }

            const { data: agent, error } = await supabaseClient
                .from("agents")
                .select(`
                    id,
                    prenom,
                    nom,
                    discord_id,
                    admin,
                    grade:grades (
                        id,
                        nom,
                        priority,
                        etat_major
                    )
                `)
                .eq("discord_id", discordId)
                .maybeSingle();

            if (error) throw error;

            if (!agent) {
                await supabaseClient.auth.signOut();
                window.location.replace("./connexion.html");
                return null;
            }

            currentAgent = agent;
            return currentAgent;
        })();

        try {
            return await loadingAgent;
        } finally {
            loadingAgent = null;
        }
    }

    async function can(permission) {
        const agent = await getCurrentAgent();

        if (!agent) return false;

        const rule = rules[permission];

        if (!rule) return false;

        // Administrateur : accès prioritaire
        if (agent.admin === true) return true;

        const grade = agent.grade;
        const conditions = [];

        if (
            rule.minPriority !== undefined &&
            rule.minPriority !== null &&
            grade
        ) {
            conditions.push(grade.priority <= rule.minPriority);
        }

        if (rule.etatMajor === true) {
            conditions.push(grade?.etat_major === true);
        }

        if (rule.admin === true) {
            conditions.push(agent.admin === true);
        }

        // FTI : accès si l'agent est affecté à au moins un agent
        if (rule.assignedFti === true) {
            const { data, error } = await supabaseClient
                .from("agents")
                .select("id")
                .eq("fti", agent.id)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error(
                    "Erreur vérification attribution FTI :",
                    error
                );
                return false;
            }

            conditions.push(Boolean(data));
        }

        // Aucune condition définie : accès autorisé
        if (conditions.length === 0) return true;

        // Au moins une condition doit être remplie
        return conditions.some(Boolean);
    }

    async function canAccessSuivi(agentId) {
        const currentAgent = await getCurrentAgent();

        if (!currentAgent || !agentId) return false;

        // Admin : accès à tous les suivis
        if (currentAgent.admin === true) return true;

        // État-major : accès à tous les suivis
        if (currentAgent.grade?.etat_major === true) return true;

        // FTI : accès uniquement à ses agents
        const { data: agent, error } = await supabaseClient
            .from("agents")
            .select("id, fti")
            .eq("id", agentId)
            .maybeSingle();

        if (error) {
            console.error("Erreur vérification accès suivi :", error);
            return false;
        }

        return String(agent?.fti ?? "") === String(currentAgent.id);
    }

    async function applyPermissions(root = document) {
        const elements = root.querySelectorAll("[data-permission]");

        for (const element of elements) {
            const permission = element.dataset.permission;
            const allowed = await can(permission);

            element.hidden = !allowed;
        }
    }

    async function requirePage(permission) {
        const allowed = await can(permission);

        if (!allowed) {
            window.location.replace("./index.html");
            return false;
        }

        return true;
    }

    return {
        getCurrentAgent,
        can,
        canAccessSuivi,
        applyPermissions,
        requirePage
    };
})();
