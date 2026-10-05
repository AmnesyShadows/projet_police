// ============================================================
// CARDS V2
// ============================================================

function createCard(options = {}) {
    const {
        title = "",
        subtitle = "",
        content = "",
        footer = "",
        headerActions = "",
        icon = "",
        className = "",
        width = 1
    } = options;

    const card =
        document.createElement("div");

    /*
     * Largeur de la card
     *
     * 1 = 1 colonne
     * 2 = 2 colonnes
     * 3 = 3 colonnes
     * 4 = 4 colonnes
     *
     * La grille de la fiche sera basée sur 4 colonnes.
     */
    const cardWidth = [1, 2, 3, 4].includes(Number(width))
        ? Number(width)
        : 1;

    card.className =
        `card card-width-${cardWidth} ${className}`.trim();

    card.dataset.cardWidth = cardWidth;

    /*
     * HEADER
     */

    const hasHeader =
        icon ||
        title ||
        subtitle;

    if (hasHeader) {
        const header =
            document.createElement("div");

        header.className =
            "card-header";

        const headerLeft =
            document.createElement("div");

        headerLeft.className =
            "card-header-left";

        /*
         * ICONE
         */

        if (icon) {
            const iconElement =
                document.createElement("div");

            iconElement.className =
                "card-icon";

            iconElement.innerHTML =
                icon;

            headerLeft.appendChild(
                iconElement
            );
        }

        /*
         * TITRE / SOUS-TITRE
         */

        if (title || subtitle) {
            const textWrapper =
                document.createElement("div");

            if (title) {
                const heading =
                    document.createElement("h3");

                heading.textContent =
                    title;

                textWrapper.appendChild(
                    heading
                );
            }

            if (subtitle) {
                const description =
                    document.createElement("div");

                /*
                 * Le subtitle reste volontairement
                 * compatible avec du HTML.
                 */
                description.className =
                    "card-subtitle";

                description.innerHTML =
                    subtitle;

                textWrapper.appendChild(
                    description
                );
            }

            headerLeft.appendChild(
                textWrapper
            );
        }

        header.appendChild(
            headerLeft
        );

        /*
         * ACTIONS DU HEADER
         */

        if (
            headerActions !== null &&
            headerActions !== undefined &&
            headerActions !== ""
        ) {
            const headerActionsElement =
                document.createElement("div");

            headerActionsElement.className =
                "card-header-actions";

            if (
                headerActions instanceof HTMLElement
            ) {
                headerActionsElement.appendChild(
                    headerActions
                );
            } else {
                headerActionsElement.innerHTML =
                    String(headerActions);
            }

            header.appendChild(
                headerActionsElement
            );
        }

        card.appendChild(
            header
        );
    }

    /*
     * CONTENU
     */

    if (
        content !== null &&
        content !== undefined &&
        content !== ""
    ) {
        const contentElement =
            document.createElement("div");

        contentElement.className =
            "card-content";

        /*
         * On accepte maintenant :
         *
         * - une chaîne HTML
         * - un HTMLElement
         *
         * Cela permettra à la fiche agent
         * de construire son contenu proprement
         * en JavaScript.
         */

        if (
            content instanceof HTMLElement
        ) {
            contentElement.appendChild(
                content
            );
        } else {
            contentElement.innerHTML =
                String(content);
        }

        card.appendChild(
            contentElement
        );
    }

    /*
     * FOOTER
     */

    if (
        footer !== null &&
        footer !== undefined &&
        footer !== ""
    ) {
        const footerElement =
            document.createElement("div");

        footerElement.className =
            "card-footer";

        if (
            footer instanceof HTMLElement
        ) {
            footerElement.appendChild(
                footer
            );
        } else {
            footerElement.innerHTML =
                String(footer);
        }

        card.appendChild(
            footerElement
        );
    }

    return card;
}

// ============================================================
// SECURITE
// ============================================================

function escapeCardHtml(value) {
    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}