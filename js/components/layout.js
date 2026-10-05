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

                            <div class="user-avatar">
                                ?
                            </div>

                            <div class="user-info">

                                <strong>
                                    Utilisateur
                                </strong>

                                <span>
                                    Chargement...
                                </span>

                            </div>

                        </div>

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

}

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