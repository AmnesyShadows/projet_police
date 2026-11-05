// ============================================================
// LAYOUT GLOBAL V2
// ============================================================

function createLayout(options = {}) {

    const {
        title = "Rivage",
        subtitle = "",
        activePage = ""
    } = options;

    // ========================================================
    // STRUCTURE PRINCIPALE
    // ========================================================

    document.body.innerHTML = `

        <div id="app-loader">
            <img
                src="../assets/images/loader.gif"
                alt="Chargement..."
            >

            <span>Chargement...</span>
        </div>

        <div class="app">

            <!-- ============================================ -->
            <!-- NAVBAR -->
            <!-- ============================================ -->

            <aside class="sidebar">

                <div class="sidebar-logo">

                    <img
                        src="../assets/images/logo.png"
                        alt="Rivage"
                    >

                    <div>
                        <strong>RIVAGE</strong>
                        <span>BCSO</span>
                    </div>

                </div>

                <nav class="sidebar-nav">

                    ${renderMenu()}

                </nav>

                <div class="sidebar-bottom">

                    <div class="connection-status">

                        <span class="status-dot"></span>

                        <div>
                            <strong>Système</strong>
                            <span>Opérationnel</span>
                        </div>

                    </div>

                </div>

            </aside>

            <!-- ============================================ -->
            <!-- CONTENU -->
            <!-- ============================================ -->

            <main class="main">

                <!-- HEADER -->

                <header class="header">

                    <div class="header-left">

                        <div>

                            <h1>
                                ${escapeLayoutHtml(title)}
                            </h1>

                            ${
                                subtitle
                                    ? `
                                        <p>
                                            ${escapeLayoutHtml(subtitle)}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                        <div class="header-right">

                            <div class="user-profile">

                                <div class="user-avatar" id="layout-user-avatar">
                                    ?
                                </div>

                                <div class="user-info">
                                    <strong id="layout-user-name">Utilisateur</strong>
                                    <span id="layout-user-grade">Chargement...</span>
                                </div>

                            </div>

                            <button id="logoutButton" class="btn-table delete" type="button">
                                Déconnexion
                            </button>

                        </div>

                </header>

                <!-- CONTENU DE LA PAGE -->

                <section class="page-content">

                    <div id="page-content"></div>

                </section>

            </main>

        </div>

    `;

    // ========================================================
    // PAGE ACTIVE
    // ========================================================

    if (activePage) {

        const activeLink =
            document.querySelector(
                `[data-page="${activePage}"]`
            );

        if (activeLink) {

            activeLink.classList.add(
                "active"
            );

        }

    }
    
    initLogoutButton();
    loadLayoutUser();
    applyMenuPermissions();

}

// ========================================================
// LOADER
// ========================================================

const loaderStartTime = Date.now();

window.addEventListener(
    "load",
    () => {

        const loader =
            document.getElementById(
                "app-loader"
            );

        if (!loader) {
            return;
        }

        const elapsed =
            Date.now() - loaderStartTime;

        const minimumDuration = 500;

        const remainingTime =
            Math.max(
                0,
                minimumDuration - elapsed
            );

        setTimeout(
            () => {

                loader.classList.add(
                    "hidden"
                );

                setTimeout(
                    () => loader.remove(),
                    350
                );

            },
            remainingTime
        );

    },
    { once: true }
);

// ============================================================
// GENERATION DU MENU
// ============================================================

function renderMenu() {

    if (
        typeof menuConfig === "undefined" ||
        !Array.isArray(menuConfig)
    ) {

        console.error(
            "menuConfig est introuvable ou invalide."
        );

        return "";
    }

    return menuConfig
        .map(section => {

            if (
                !section ||
                !Array.isArray(section.menu)
            ) {
                return "";
            }

            const items =
                section.menu
                    .map(item => {

                        if (
                            !item ||
                            !item.page
                        ) {
                            return "";
                        }

                        const page =
                            getPageName(
                                item.page
                            );

                        return `
                            <a
                                href="${escapeLayoutHtml(item.page)}"
                                class="nav-link"
                                data-page="${escapeLayoutHtml(page)}"
                                data-permission="${escapeLayoutHtml(item.permission ?? "")}"
                            >
                                <span class="nav-icon">
                                    ${item.icon ?? ""}
                                </span>

                                <span>
                                    ${escapeLayoutHtml(
                                        item.title ?? ""
                                    )}
                                </span>
                            </a>
                        `;
                    })
                    .join("");

            if (!items) {
                return "";
            }

            return `
                <div class="nav-section">

                    <span class="nav-section-title">
                        ${escapeLayoutHtml(
                            section.title ?? ""
                        )}
                    </span>

                    ${items}

                </div>
            `;
        })
        .join("");
}

// ============================================================
// PERMISSIONS DU MENU
// ============================================================

async function applyMenuPermissions() {

    if (typeof Permissions === "undefined") {
        console.error("Le système Permissions est introuvable.");
        return;
    }

    const links = document.querySelectorAll(
        ".sidebar-nav .nav-link[data-permission]"
    );

    for (const link of links) {

        const permission = link.dataset.permission;

        try {
            const allowed = await Permissions.can(permission);
            link.hidden = !allowed;

        } catch (error) {
            console.error(
                "Erreur permission menu :",
                permission,
                error
            );

            link.hidden = true;
        }
    }

    // Masquer les sections qui n'ont aucun lien visible
    const sections = document.querySelectorAll(
        ".sidebar-nav .nav-section"
    );

    sections.forEach(section => {

        const visibleLinks = [
            ...section.querySelectorAll(".nav-link")
        ].filter(link => !link.hidden);

        section.hidden = visibleLinks.length === 0;
    });

    document.querySelector(".sidebar-nav")?.classList.add("permissions-loaded");
}

// ============================================================
// RECUPERATION DU NOM DE PAGE
// ============================================================

function getPageName(path) {

    const cleanPath =
        String(path ?? "")
            .split("?")[0]
            .split("#")[0];

    const fileName =
        cleanPath
            .split("/")
            .pop();

    if (
        !fileName ||
        fileName === "index.html"
    ) {
        return "dashboard";
    }

    return fileName
        .replace(
            /\.html$/,
            ""
        );
}

// ============================================================
// SECURITE
// ============================================================

function escapeLayoutHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

async function loadLayoutUser() {
    const nameElement = document.getElementById("layout-user-name");
    const gradeElement = document.getElementById("layout-user-grade");
    const avatarElement = document.getElementById("layout-user-avatar");

    if (!nameElement || !gradeElement || !avatarElement) return;

    try {
        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        
        if (!user) {
            window.location.replace("./connexion.html");
            return;
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
            nameElement.textContent = user.user_metadata?.full_name ?? "Agent";
            gradeElement.textContent = "ID Discord introuvable";
            return;
        }

        
        const { data: agent, error } = await supabaseClient
            .from("agents")
            .select(`
                prenom,
                nom,
                discord_id,
                grade:grades (
                    nom
                )
            `)
            .eq("discord_id", discordId)
            .maybeSingle();


        if (error) throw error;

        if (!agent) {
            nameElement.textContent = user.user_metadata?.full_name ?? "Agent";
            gradeElement.textContent = "Agent non trouvé";
            return;
        }

        nameElement.textContent =
            [agent.prenom, agent.nom].filter(Boolean).join(" ") ||
            user.user_metadata?.full_name ||
            "Agent";

        gradeElement.textContent = agent.grade?.nom || "Agent";

        const avatarUrl = user.user_metadata?.avatar_url;

        if (avatarUrl) {
            const img = document.createElement("img");
            img.src = avatarUrl;
            img.alt = "Avatar Discord";
            img.referrerPolicy = "no-referrer";

            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.borderRadius = "50%";

            avatarElement.replaceChildren(img);
        } else {
            avatarElement.textContent =
                (agent.prenom || agent.nom || "A").charAt(0).toUpperCase();
        }

    } catch (error) {
        console.error("Erreur chargement profil :", error);
        nameElement.textContent = "Agent";
        gradeElement.textContent = "Erreur de chargement";
    }
}

async function initLogoutButton() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            window.location.replace("./connexion.html");
        } catch (error) {
            console.error("Erreur de déconnexion :", error);
            alert("Impossible de se déconnecter. Réessaie.");
            logoutButton.disabled = false;
        }
    });
}
