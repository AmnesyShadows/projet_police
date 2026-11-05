function createTable(options = {}) {

    const {
        config = {},
        data = [],
        columns = [],
        className = "",
        onRowClick = null,
        onDelete = null,
        onCreate = null,
        onEdit = null
    } = options;


    /*
    ============================================================
    BOUTONS DISPONIBLES
    ============================================================
    */

    const tableButtons = {

        show: {
            label: "👁 Voir",
            className: "btn-table view"
        },

        edit: {
            label: "✎ Modifier",
            className: "btn-table edit"
        },

        delete: {
            label: "🗑 Supprimer",
            className: "btn-table delete"
        }

    };


    /*
    ============================================================
    WRAPPER
    ============================================================
    */

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `table-wrapper ${className}`.trim();


    /*
    ============================================================
    TOOLBAR
    ============================================================
    */

    const toolbar =
        document.createElement("div");

    toolbar.className =
        "table-toolbar";


    if (config.list?.newButton === true) {

        const newButton = document.createElement("button");

        newButton.type = "button";
        newButton.className = "btn-table-new";
        newButton.textContent =
            `+ ${config.create?.title ?? "Nouveau"}`;

        newButton.hidden = true;

        newButton.addEventListener("click", () => {
            handleTableNew(config, onCreate);
        });

        toolbar.appendChild(newButton);

        (async () => {
            const permission = config.list?.newButtonPermission;

            if (!permission) {
                newButton.hidden = false;
                return;
            }

            try {
                const allowed = await Permissions.can(permission);
                newButton.hidden = !allowed;
            } catch (error) {
                console.error(
                    "Erreur vérification permission :",
                    permission,
                    error
                );

                newButton.hidden = true;
            }
        })();
    }

    wrapper.appendChild(
        toolbar
    );


    /*
    ============================================================
    TABLE
    ============================================================
    */

    const table =
        document.createElement("table");

    table.className =
        "table";


    /*
    ============================================================
    THEAD
    ============================================================
    */

    const thead =
        document.createElement("thead");

    const headerRow =
        document.createElement("tr");


    columns.forEach(
        column => {

            const th =
                document.createElement("th");

            th.textContent =
                column.label ??
                column.key ??
                "";


            headerRow.appendChild(
                th
            );

        }
    );


    thead.appendChild(
        headerRow
    );


    /*
    ============================================================
    TBODY
    ============================================================
    */

    const tbody =
        document.createElement("tbody");


    data.forEach(
        row => {

            const tr =
                document.createElement("tr");


            /*
            --------------------------------------------------------
            CLIC SUR LA LIGNE
            --------------------------------------------------------
            */

            if (
                typeof onRowClick ===
                "function"
            ) {

                tr.classList.add(
                    "clickable"
                );


                tr.addEventListener(
                    "click",
                    () => {

                        onRowClick(row);

                    }
                );

            }


            /*
            --------------------------------------------------------
            COLONNES
            --------------------------------------------------------
            */

            columns.forEach(
                column => {

                    const td =
                        document.createElement("td");


                    /*
                    ====================================================
                    COLONNE D'ACTIONS
                    ====================================================
                    */

                    if (
                        Array.isArray(
                            column.buttons
                        )
                    ) {

                        td.classList.add(
                            "table-actions"
                        );


                        column.buttons.forEach(buttonItem => {

                            // Compatibilité avec les anciens boutons en texte
                            const buttonOptions = typeof buttonItem === "string"
                                ? { key: buttonItem }
                                : buttonItem;

                            const buttonType = buttonOptions?.key;

                            if (!buttonType) {
                                console.warn("Configuration de bouton invalide :", buttonItem);
                                return;
                            }

                            const buttonConfig = tableButtons[buttonType];

                            // Un bouton personnalisé doit posséder une action
                            if (!buttonConfig && typeof buttonOptions.action !== "function") {
                                console.warn(`Bouton table inconnu : ${buttonType}`);
                                return;
                            }

                            const button = document.createElement("button");

                            button.type = "button";

                            button.className = buttonConfig
                                ? buttonConfig.className
                                : "btn-table other";

                            button.textContent = buttonOptions.label ??
                                buttonConfig?.label ??
                                buttonType;

                            // Ajout facultatif d'une icône personnalisée
                            if (buttonOptions.icon) {
                                button.textContent =
                                    `${buttonOptions.icon} ${button.textContent}`;
                            }

                            // Masquer immédiatement les boutons protégés
                            const permission = buttonOptions.permission;
                            const permissionCheck = buttonOptions.permissionCheck;

                            button.hidden = Boolean(permission || permissionCheck);

                            td.appendChild(button);

                            // Vérification de la permission
                            if (permission) {
                                (async () => {
                                    try {
                                        const allowed = await Permissions.can(permission);
                                        button.hidden = !allowed;
                                    } catch (error) {
                                        console.error(
                                            "Erreur de permission du bouton :",
                                            permission,
                                            error
                                        );

                                        button.hidden = true;
                                    }
                                })();
                            }

                            if (permissionCheck) {
                                (async () => {
                                    try {
                                        const allowed = await permissionCheck(row);
                                        button.hidden = !allowed;
                                    } catch (error) {
                                        console.error(
                                            "Erreur vérification accès Suivis :",
                                            error
                                        );

                                        button.hidden = true;
                                    }
                                })();
                            }

                            button.addEventListener("click", async event => {

                                event.stopPropagation();

                                // Nouvelle vérification au moment du clic
                                if (permission) {
                                    const allowed = await Permissions.can(permission);

                                    if (!allowed) {
                                        button.hidden = true;
                                        return;
                                    }
                                }

                                if (permissionCheck) {
                                    const allowed = await permissionCheck(row);

                                    if (!allowed) {
                                        button.hidden = true;
                                        return;
                                    }
                                }

                                // Action personnalisée
                                if (typeof buttonOptions.action === "function") {
                                    await buttonOptions.action(row);
                                    return;
                                }

                                // Bouton Voir
                                if (buttonType === "show") {
                                    handleTableShow(config, row);
                                    return;
                                }

                                // Bouton Modifier
                                if (buttonType === "edit") {
                                    handleTableEdit(config, row, onEdit);
                                    return;
                                }

                                // Bouton Supprimer
                                if (buttonType === "delete") {
                                    await handleTableDelete(row, onDelete);
                                }

                            });

                        });

                    }


                    /*
                    ====================================================
                    COLONNE NORMALE
                    ====================================================
                    */

                    else {

                        if (
                            typeof column.render ===
                            "function"
                        ) {

                            td.innerHTML =
                                column.render(
                                    row[column.key],
                                    row
                                );

                        }

                        else {

                            const value =
                                row[column.key];

                            td.textContent =
                                value ?? "—";

                        }

                    }


                    tr.appendChild(
                        td
                    );

                }
            );


            tbody.appendChild(
                tr
            );

        }
    );


    /*
    ============================================================
    ASSEMBLAGE
    ============================================================
    */

    table.appendChild(
        thead
    );

    table.appendChild(
        tbody
    );

    wrapper.appendChild(
        table
    );


    return wrapper;

}


/*
================================================================
SHOW
================================================================
*/

function handleTableShow(config, row) {

    if (!config.show?.url) {
        console.warn("Aucune URL de fiche définie pour ce tableau.");
        return;
    }

    let url = config.show.url;

    if (typeof url === "function") {
        url = url(row);
    } else {
        url = String(url)
            .replaceAll("{id}", encodeURIComponent(row.id))
            .replaceAll(":id", encodeURIComponent(row.id));
    }

    if (!url) {
        console.warn("URL de fiche invalide.");
        return;
    }

    window.location.href = url;
}


/*
================================================================
EDIT
================================================================
*/

function handleTableEdit(
    config,
    row,
    onEdit = null
) {

    if (
        typeof createModal !==
        "function"
    ) {

        console.error(
            "createModal() est introuvable."
        );

        return;

    }


    createModal({

        config,

        data: row,

        mode: "edit",

        title:
            config.edit?.title ||
            "Modifier",

        onSave: async (
            values,
            originalData
        ) => {

            if (
                typeof onEdit ===
                "function"
            ) {

                await onEdit(
                    values,
                    originalData
                );

                return;

            }


            console.log(
                "Modification :",
                values
            );

        }

    });

}


/*
================================================================
DELETE
================================================================
*/

async function handleTableDelete(
    row,
    onDelete
) {

    /*
    ------------------------------------------------------------
    CONFIRMATION
    ------------------------------------------------------------
    */

    const confirmed =
        window.confirm(
            "Voulez-vous vraiment supprimer cet élément ?"
        );


    if (!confirmed) {

        return;

    }


    /*
    ------------------------------------------------------------
    CALLBACK
    ------------------------------------------------------------
    */

    if (
        typeof onDelete ===
        "function"
    ) {

        await onDelete(
            row
        );

        return;

    }


    console.log(
        "Suppression :",
        row
    );

}


/*
================================================================
NEW
================================================================
*/

function handleTableNew(
    config,
    onCreate = null
) {

    if (
        typeof createModal !==
        "function"
    ) {

        console.error(
            "createModal() est introuvable."
        );

        return;

    }


    createModal({

        config,

        data: {},

        mode: "create",

        title:
            config.create?.title ||
            "Nouveau",

        onSave: async values => {

            if (
                typeof onCreate ===
                "function"
            ) {

                await onCreate(
                    values
                );

                return;

            }


            console.log(
                "Création :",
                values
            );

        }

    });

}