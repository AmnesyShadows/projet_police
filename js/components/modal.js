function createModal(options = {}) {
    const {
        config = {},
        data = {},
        title = "Modifier",
        mode = "edit",
        onSave = null,
        onClose = null
    } = options;

    const fields = mode === "create"
        ? config.create?.fields ?? []
        : config.edit?.fields ?? [];

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const header = document.createElement("div");
    header.className = "modal-header";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "modal-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Fermer");

    header.appendChild(heading);
    header.appendChild(closeButton);

    const form = document.createElement("form");
    form.className = "modal-form";

    fields.forEach(field => {
        if (field.break === true) {
            const breakElement = document.createElement("div");
            breakElement.className = "modal-field-break";
            form.appendChild(breakElement);
        }

        const fieldWrapper = document.createElement("div");
        fieldWrapper.className = "modal-field";

        if (field.width === 2) {
            fieldWrapper.classList.add("modal-field-wide");
        }

        if (field.width === 3) {
            fieldWrapper.classList.add("modal-field-three");
        }

        if (field.width === 4) {
            fieldWrapper.classList.add("modal-field-full");
        }

        const label = document.createElement("label");
        label.textContent = field.label ?? field.name;

        let input;

        if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.value = data[field.name] ?? "";

            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }

            fieldWrapper.appendChild(label);
            fieldWrapper.appendChild(input);
        } else if (field.type === "checkbox") {
            const checkboxWrapper = document.createElement("div");
            checkboxWrapper.className = "modal-checkbox";

            input = document.createElement("input");
            input.type = "checkbox";
            input.checked = Boolean(data[field.name]);

            checkboxWrapper.appendChild(input);
            fieldWrapper.appendChild(label);
            fieldWrapper.appendChild(checkboxWrapper);
        } else if (field.type === "select") {
            input = document.createElement("select");

            const emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = field.placeholder || "Sélectionner...";
            input.appendChild(emptyOption);

            if (Array.isArray(field.options)) {
                field.options.forEach(option => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;

                    const currentValue = data[field.name];

                    if (
                        currentValue !== undefined &&
                        currentValue !== null &&
                        currentValue !== "" &&
                        String(option.value) === String(currentValue)
                    ) {
                        optionElement.selected = true;
                    } else if (
                        (
                            currentValue === undefined ||
                            currentValue === null ||
                            currentValue === ""
                        ) &&
                        option.default === true
                    ) {
                        optionElement.selected = true;
                    }

                    input.appendChild(optionElement);
                });
            }

            fieldWrapper.appendChild(label);
            fieldWrapper.appendChild(input);

            if (field.source) {
                loadModalSelectOptions(input, field, data[field.name]);
            }
        } else {
            input = document.createElement("input");
            input.type = field.type ?? "text";
            input.value = data[field.name] ?? "";

            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }

            fieldWrapper.appendChild(label);
            fieldWrapper.appendChild(input);
        }

        input.name = field.name;

        if (field.required) {
            input.required = true;
        }

        if (field.valueType === "number") {
            input.dataset.valueType = "number";
        }

        form.appendChild(fieldWrapper);
    });

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "btn-secondary";
    cancelButton.textContent = "Annuler";

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.className = "btn-primary";
    saveButton.textContent = "Enregistrer";

    footer.appendChild(cancelButton);
    footer.appendChild(saveButton);

    modal.appendChild(header);
    form.appendChild(footer);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function closeModal() {
        overlay.remove();

        if (typeof onClose === "function") {
            onClose();
        }
    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeModal();
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        console.log("=== SUBMIT MODAL ===");
        console.log("Formulaire soumis");

        const values = {};

        fields.forEach(field => {
            const input = form.elements[field.name];

            if (!input) {
                console.warn(`Champ introuvable : ${field.name}`);
                return;
            }

            if (field.type === "checkbox") {
                values[field.name] = input.checked;
                return;
            }

            if (
                field.type === "number" ||
                field.valueType === "number"
            ) {
                values[field.name] =
                    input.value.trim() === ""
                        ? null
                        : Number(input.value);
                return;
            }

            const value = input.value.trim();

            values[field.name] = value === "" ? null : value;
        });

        console.log("Valeurs récupérées :", values);

        if (typeof onSave === "function") {
            console.log("Appel de onSave()");
            await onSave(values, data);
            console.log("onSave() terminé");
        } else {
            console.error("Aucun onSave() défini !");
        }

        closeModal();
    });

    return overlay;
}

async function loadModalSelectOptions(input, field, currentValue) {
    if (!field.source || typeof supabaseClient === "undefined") {
        return;
    }

    const {
        table,
        value,
        label,
        orderBy = label,
        ascending = true
    } = field.source;

    input.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = field.placeholder || "Sélectionner...";
    input.appendChild(emptyOption);

    const { data, error } = await supabaseClient
        .from(table)
        .select(`${value}, ${label}`)
        .order(orderBy, { ascending });

    if (error) {
        console.error(`Erreur chargement du select ${table} :`, error);

        const errorOption = document.createElement("option");
        errorOption.value = "";
        errorOption.textContent = "Erreur de chargement";
        errorOption.disabled = true;
        input.appendChild(errorOption);

        return;
    }

    data.forEach(row => {
        const option = document.createElement("option");
        option.value = row[value];
        option.textContent = row[label];

        if (String(row[value]) === String(currentValue ?? "")) {
            option.selected = true;
        }

        input.appendChild(option);
    });
}