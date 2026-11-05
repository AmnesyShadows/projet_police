(() => {
    "use strict";

    const COMPETENCES = [
        { id: "communication", name: "Communication radio", icon: "📻" },
        { id: "conduite", name: "Conduite & véhicule", icon: "🚔" },
        { id: "procedures", name: "Connaissance des procédures", icon: "⚖️" },
        { id: "interpellation", name: "Contrôle / interpellation", icon: "👮" },
        { id: "interventions", name: "Gestion des interventions", icon: "🚨" },
        { id: "equipe", name: "Travail en équipe", icon: "🤝" },
        { id: "decision", name: "Prise de décision", icon: "🧠" },
        { id: "secteur", name: "Connaissance du secteur", icon: "🗺️" },
        { id: "stress", name: "Gestion du stress", icon: "😌" },
        { id: "professionnalisme", name: "Comportement & professionnalisme", icon: "⭐" }
    ];

    const NIVEAUX = [
        { value: 1, label: "Niveau 1 — Découverte" },
        { value: 2, label: "Niveau 2 — Formation" },
        { value: 3, label: "Niveau 3 — Progression" },
        { value: 4, label: "Niveau 4 — Autonomie" },
        { value: 5, label: "Niveau 5 — Confirmé / expert" }
    ];

    const NOTES = [
        { value: 1, label: "Insuffisant", color: "🟥" },
        { value: 2, label: "À améliorer", color: "🟧" },
        { value: 3, label: "Satisfaisant", color: "🟨" },
        { value: 4, label: "Bon", color: "🟩" },
        { value: 5, label: "Excellent", color: "🟦" }
    ];

    const todayISO = () => {
        const date = new Date();
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);
    };

    const getGrade = agent =>
        agent?.grades?.nom ?? agent?.grade_label ?? agent?.grade ?? "";

    const getAgentLabel = agent =>
        `[${agent?.matricule ? `${agent.matricule}` : ""}] — ${agent?.prenom ?? ""} ${agent?.nom ?? ""}`.trim();

    function createField(parent, labelText, control, width = 2) {
        const wrapper = document.createElement("div");

        wrapper.className = width === 4
            ? "modal-field modal-field-full"
            : width === 3
                ? "modal-field modal-field-three"
                : "modal-field modal-field-wide";

        const label = document.createElement("label");
        label.textContent = labelText;

        if (control.id) {
            label.htmlFor = control.id;
        }

        wrapper.append(label, control);
        parent.appendChild(wrapper);

        return control;
    }

    function createInput(type, name, value = "", attributes = {}) {
        const element = document.createElement("input");
        element.type = type;
        element.name = name;
        element.value = value ?? "";

        Object.entries(attributes).forEach(([key, val]) => {
            if (key === "required") {
                element.required = Boolean(val);
            } else {
                element.setAttribute(key, val);
            }
        });

        return element;
    }

    function createTextarea(name, placeholder = "", rows = 3) {
        const element = document.createElement("textarea");
        element.name = name;
        element.placeholder = placeholder;
        element.rows = rows;
        return element;
    }

    function createSelect(name, options, placeholder, selected = "") {
        const element = document.createElement("select");
        element.name = name;

        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = placeholder;
        element.appendChild(emptyOption);

        options.forEach(option => {
            const item = document.createElement("option");
            item.value = String(option.value);
            item.textContent = option.label;

            if (
                selected !== "" &&
                selected !== null &&
                selected !== undefined &&
                String(option.value) === String(selected)
            ) {
                item.selected = true;
            }

            element.appendChild(item);
        });

        return element;
    }

    let sectionCounter = 0;

    function createSection(parent, title, description = "", counter = true) {
        if (counter) sectionCounter++;

        const wrapper = document.createElement("div");
        wrapper.className = "modal-field modal-field-full";

        const heading = document.createElement("h2");
        heading.textContent = `${counter ? `${sectionCounter}. ` : ""}${title}`;
        wrapper.appendChild(heading);

        if (description) {
            const help = document.createElement("p");
            help.textContent = description;
            wrapper.appendChild(help);
        }

        parent.appendChild(wrapper);
        return wrapper;
    }

    async function getActiveAgents() {
        const { data: agents, error } = await supabaseClient
            .from("agents")
            .select("id, prenom, nom, matricule, grade, fti, statut, grades(nom)")
            .eq("statut", "En service")
            .order("matricule", { ascending: true });

        if (error) {
            console.error("Erreur récupération des agents :", error);
            throw error;
        }

        return agents ?? [];
    }

    async function getPreviousLevel(agentId) {
        const { data, error } = await supabaseClient
            .from("suivis_agents")
            .select("niveau_actuel, date_evaluation, created_at")
            .eq("agent_id", agentId)
            .order("date_evaluation", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) throw error;

        return data?.[0]?.niveau_actuel ?? 0;
    }

    function renderForm(form, agent, agents, previousLevel) {
        const identity = createSection(form, "Agent évalué", "", false);

        identity.innerHTML = `
            <div class="page-title-wrapper suivi-agent-title">
                <div class="page-title-icon">👮</div>
                <div class="page-title-content">
                    <h2 class="page-title">${agent.prenom} ${agent.nom}</h2>
                    <div class="page-subtitle">
                        Matricule ${agent.matricule} · Grade : ${getGrade(agent) || "Non renseigné"}
                    </div>
                </div>
            </div>
        `;

        createSection(form, "👤 Informations");

        const tutors = agents.filter(
            item => getGrade(item).trim().toLowerCase() !== "rookie"
        );

        const agentFromDatabase = agents.find(
            item => String(item.id) === String(agent.id)
        );

        const ftiValue = String(
            agent.fti ?? agentFromDatabase?.fti ?? ""
        );

        const existingFTI = tutors.find(item =>
            String(item.id) === ftiValue ||
            String(item.matricule ?? "") === ftiValue
        );

        createField(
            form,
            "Tuteur / FTI",
            createSelect(
                "tuteur_id",
                tutors.map(item => ({
                    value: item.id,
                    label: getAgentLabel(item)
                })),
                "Sélectionner un tuteur",
                existingFTI?.id ?? ""
            )
        );

        createField(
            form,
            "Patrouilles observées",
            createInput("number", "patrouilles_observees", "0", {
                min: "0",
                step: "1",
                required: true
            })
        );

        const skillsTitle = document.createElement("div");
        skillsTitle.className = "modal-field modal-field-full";

        createSection(form, "📊 Évaluation des compétences");

        const skillsDescription = document.createElement("p");
        skillsDescription.textContent =
            "Attribue une seule note de 1 à 5 à chacune des dix compétences.";
        skillsTitle.appendChild(skillsDescription);

        form.appendChild(skillsTitle);

        COMPETENCES.forEach(item => {
            const block = document.createElement("div");
            block.className = "modal-field modal-field-wide";

            const heading = document.createElement("h4");
            heading.textContent = `${item.icon} ${item.name}`;
            block.appendChild(heading);

            NOTES.forEach(note => {
                const wrapper = document.createElement("label");

                const checkbox = createInput(
                    "checkbox",
                    `note_${item.id}`,
                    String(note.value)
                );

                const text = document.createElement("span");
                text.textContent = `${note.color} ${note.value} — ${note.label}`;

                wrapper.style.display = "flex";
                wrapper.style.alignItems = "center";
                wrapper.style.gap = "8px";

                checkbox.addEventListener("change", () => {
                    if (checkbox.checked) {
                        block
                            .querySelectorAll('input[type="checkbox"]')
                            .forEach(otherCheckbox => {
                                if (otherCheckbox !== checkbox) {
                                    otherCheckbox.checked = false;
                                }
                            });
                    }
                });

                wrapper.append(checkbox, text);
                block.appendChild(wrapper);
            });

            createField(
                block,
                "Observations",
                createTextarea(
                    `observation_${item.id}`,
                    "Observations sur cette compétence…",
                    2
                ),
                4
            );

            form.appendChild(block);
        });

        function createListEditor(title, name, itemTitle) {
            const section = createSection(form, title);
            const list = document.createElement("div");
            section.appendChild(list);

            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "btn-table-new";
            addButton.textContent = "+ Ajouter";

            function updateTitles() {
                [...list.children].forEach((row, index) => {
                    const heading = row.querySelector("h4");

                    if (heading) {
                        heading.textContent = `${itemTitle} n°${index + 1}`;
                    }
                });
            }

            function addRow(value = "") {
                const row = document.createElement("div");
                row.className = "modal-field modal-field-full";

                const header = document.createElement("div");
                header.style.display = "flex";
                header.style.alignItems = "center";
                header.style.justifyContent = "space-between";
                header.style.width = "100%";
                header.style.boxSizing = "border-box";
                header.style.gap = "12px";

                const heading = document.createElement("h4");
                heading.textContent = `${itemTitle} n°${list.children.length + 1}`;
                heading.style.margin = "0";
                heading.style.flex = "1";
                heading.style.minWidth = "0";

                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "specialized-card-item-delete";
                removeButton.title = `Supprimer ${itemTitle.toLowerCase()}`;
                removeButton.textContent = "×";

                removeButton.style.position = "static";
                removeButton.style.top = "auto";
                removeButton.style.right = "auto";
                removeButton.style.bottom = "auto";
                removeButton.style.left = "auto";
                removeButton.style.transform = "none";
                removeButton.style.margin = "0";
                removeButton.style.flexShrink = "0";
                removeButton.style.alignSelf = "center";

                header.append(heading, removeButton);

                const textarea = createTextarea(
                    name,
                    "Saisir un élément…",
                    2
                );
                textarea.value = value;

                removeButton.addEventListener("click", () => {
                    row.remove();

                    if (list.children.length === 0) {
                        addRow();
                    }

                    updateTitles();
                });

                row.append(header, textarea);
                list.appendChild(row);
                updateTitles();
            }

            addButton.addEventListener("click", () => addRow());

            section.appendChild(addButton);
            addRow();
        }

        createListEditor("⭐ Points forts", "points_forts", "Point fort");

        createListEditor(
            "⚠️ Axes d’amélioration",
            "axes_amelioration",
            "Axe d’amélioration"
        );

        createListEditor(
            "🎯 Objectifs de la prochaine évaluation",
            "objectifs",
            "Objectif"
        );

        const bilan = createSection(form, "📝 Observations du superviseur");

        createField(
            bilan,
            "Bilan général",
            createTextarea(
                "bilan_general",
                "Bilan global de l’évaluation…",
                4
            ),
            4
        );

        createSection(form, "📈 Évolution de l'agent");

        const niveauxInfo = [
            {
                niveau: 1,
                couleur: "#ef4444",
                emoji: "🔴",
                titre: "Découverte",
                description: "L'agent découvre les procédures, le fonctionnement du service et nécessite un accompagnement constant."
            },
            {
                niveau: 2,
                couleur: "#f97316",
                emoji: "🟠",
                titre: "Formation",
                description: "L'agent commence à maîtriser les bases mais nécessite encore une supervision régulière."
            },
            {
                niveau: 3,
                couleur: "#eab308",
                emoji: "🟡",
                titre: "Progression",
                description: "L'agent est capable de gérer les situations courantes avec supervision et commence à prendre des initiatives."
            },
            {
                niveau: 4,
                couleur: "#22c55e",
                emoji: "🟢",
                titre: "Autonomie",
                description: "L'agent maîtrise les procédures courantes et peut intervenir de manière autonome sur la majorité des situations."
            },
            {
                niveau: 5,
                couleur: "#3b82f6",
                emoji: "🔵",
                titre: "Validation",
                description: "L'agent démontre un niveau suffisant pour terminer sa période de formation et être proposé à la validation."
            }
        ];

        const niveauxInfoContainer = document.createElement("div");
        niveauxInfoContainer.className = "modal-field modal-field-full";

        niveauxInfo.forEach(item => {
            const card = document.createElement("div");
            card.className = "niveau-info-card";
            card.style.setProperty("--niveau-couleur", item.couleur);

            const heading = document.createElement("div");
            heading.className = "niveau-info-heading";
            heading.textContent = `${item.emoji} Niveau ${item.niveau} — ${item.titre}`;

            const description = document.createElement("p");
            description.textContent = item.description;

            card.append(heading, description);
            niveauxInfoContainer.appendChild(card);
        });

        form.appendChild(niveauxInfoContainer);

        createField(
            form,
            "Niveau précédent",
            createSelect(
                "niveau_precedent",
                [
                    { value: 0, label: "Niveau 0 — Aucun niveau précédent" },
                    ...NIVEAUX
                ],
                "Choisir le niveau précédent",
                previousLevel
            )
        );

        createField(
            form,
            "Niveau actuel",
            createSelect(
                "niveau_actuel",
                NIVEAUX,
                "Choisir le niveau actuel"
            )
        );

        createField(
            form,
            "Justification de l’évolution",
            createTextarea(
                "justification_evolution",
                "Expliquer l’évolution du niveau…",
                4
            ),
            4
        );

        createSection(form, "✅ Validation");

        createField(
            form,
            "Évaluateur",
            createSelect(
                "evaluateur_id",
                agents.map(item => ({
                    value: item.id,
                    label: getAgentLabel(item)
                })),
                "Sélectionner un évaluateur"
            )
        );

        createField(
            form,
            "Date d’évaluation",
            createInput("date", "date_evaluation", todayISO(), {
                required: true
            })
        );
    }

    const getListValues = (root, name) =>
        [...root.querySelectorAll(`textarea[name="${name}"]`)]
            .map(item => item.value.trim())
            .filter(Boolean);

    function buildPayload(root, agent, agents) {
        const get = name => root.querySelector(`[name="${name}"]`);

        const evaluator = agents.find(
            item => String(item.id) === String(get("evaluateur_id").value)
        );

        const tutor = agents.find(
            item => String(item.id) === String(get("tuteur_id").value)
        );

        const evaluations = {};

        COMPETENCES.forEach(item => {
            const checked = root.querySelector(
                `input[name="note_${item.id}"]:checked`
            );

            evaluations[item.id] = {
                competence: item.name,
                note: checked ? Number(checked.value) : null,
                observations: get(`observation_${item.id}`).value.trim()
            };
        });

        return {
            agent_id: agent.id,
            date_evaluation: get("date_evaluation").value,
            tuteur: tutor ? getAgentLabel(tutor) : null,
            patrouilles_observees: Number(
                get("patrouilles_observees").value || 0
            ),
            niveau_precedent: Number(get("niveau_precedent").value || 0),
            niveau_actuel: Number(get("niveau_actuel").value),
            evaluateur_nom: evaluator
                ? `${evaluator.prenom ?? ""} ${evaluator.nom ?? ""}`.trim()
                : null,
            evaluateur_grade: evaluator ? getGrade(evaluator) : null,
            evaluateur_matricule: evaluator?.matricule ?? null,
            evaluations,
            points_forts: getListValues(root, "points_forts"),
            axes_amelioration: getListValues(root, "axes_amelioration"),
            objectifs: getListValues(root, "objectifs"),
            bilan_general: get("bilan_general").value.trim() || null,
            justification_evolution:
                get("justification_evolution").value.trim() || null
        };
    }

    function parseStoredValue(value, fallback) {
        if (value === null || value === undefined || value === "") {
            return fallback;
        }

        if (typeof value !== "string") return value;

        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function populateFormFromSuivi(root, suivi, agents) {
        if (!root || !suivi) return;

        const setValue = (name, value) => {
            const element = root.querySelector(`[name="${name}"]`);

            if (element && value !== null && value !== undefined) {
                element.value = String(value);
            }
        };

        setValue("date_evaluation", suivi.date_evaluation ?? "");
        setValue("patrouilles_observees", suivi.patrouilles_observees ?? 0);
        setValue("niveau_precedent", suivi.niveau_precedent ?? 0);
        setValue("niveau_actuel", suivi.niveau_actuel ?? "");
        setValue("bilan_general", suivi.bilan_general ?? "");
        setValue("justification_evolution", suivi.justification_evolution ?? "");

        const tutorLabel = String(suivi.tuteur ?? "").trim();

        const tutor = agents.find(
            item => getAgentLabel(item).trim() === tutorLabel
        );

        if (tutor) {
            setValue("tuteur_id", tutor.id);
        }

        const evaluatorName = String(suivi.evaluateur_nom ?? "")
            .trim()
            .toLowerCase();

        const evaluator = agents.find(item =>
            `${item.prenom ?? ""} ${item.nom ?? ""}`.trim().toLowerCase() === evaluatorName ||
            getAgentLabel(item).trim().toLowerCase() === evaluatorName
        );

        if (evaluator) {
            setValue("evaluateur_id", evaluator.id);
        }

        const evaluations = parseStoredValue(suivi.evaluations, {});

        COMPETENCES.forEach(skill => {
            const stored = evaluations?.[skill.id];
            if (!stored) return;

            if (
                stored.note !== null &&
                stored.note !== undefined &&
                stored.note !== ""
            ) {
                const note = root.querySelector(
                    `input[name="note_${skill.id}"][value="${Number(stored.note)}"]`
                );

                if (note) {
                    note.checked = true;
                }
            }

            setValue(
                `observation_${skill.id}`,
                stored.observations ?? ""
            );
        });

        const listMappings = [
            ["points_forts", "Points forts"],
            ["axes_amelioration", "Axes d’amélioration"],
            ["objectifs", "Objectifs de la prochaine évaluation"]
        ];

        listMappings.forEach(([name, title]) => {
            const values = parseStoredValue(suivi[name], []);
            if (!Array.isArray(values)) return;

            const section = [...root.querySelectorAll(".modal-field-full")].find(el =>
                el.querySelector(":scope > h4")?.textContent === title
            );

            if (!section) return;

            const addButton = section.querySelector("button.btn-table-new");

            let textareas = [
                ...section.querySelectorAll(`textarea[name="${name}"]`)
            ];

            const desiredCount = Math.max(values.length, 1);

            while (textareas.length < desiredCount && addButton) {
                addButton.click();

                textareas = [
                    ...section.querySelectorAll(`textarea[name="${name}"]`)
                ];
            }

            textareas.forEach((textarea, index) => {
                textarea.value = values[index] ?? "";
            });
        });
    }

    async function openSuiviModal({ agent, suivi = null, onSaved } = {}) {
        sectionCounter = 0;

        if (!agent?.id) {
            createAlert("L’agent à évaluer est introuvable.", "danger");
            return;
        }

        if (typeof createModal !== "function") {
            createAlert("La modal générique n’est pas chargée.", "danger");
            return;
        }

        let agents;
        let previousLevel;

        try {
            [agents, previousLevel] = await Promise.all([
                getActiveAgents(),
                getPreviousLevel(agent.id)
            ]);
        } catch (error) {
            console.error("Préparation du formulaire impossible :", error);
            createAlert(
                "Impossible de préparer le formulaire. Vérifie les accès Supabase aux agents et aux suivis.",
                "danger"
            );
            return;
        }

        const modalData = {
            agent,
            agents,
            previousLevel,
            suivi,
            formRoot: null
        };

        createModal({
            title: `${suivi ? "Modifier le suivi" : "Créer un suivi"} — ${getAgentLabel(agent)}`,
            mode: "create",
            config: { create: { fields: [] } },
            data: modalData,

            content: (container, form) => {
                container.className = "modal-field-full";
                container.hidden = true;

                renderForm(form, agent, agents, previousLevel);

                if (suivi) {
                    populateFormFromSuivi(form, suivi, agents);
                }

                modalData.formRoot = form;
            },

            onSave: async (_modalValues, data) => {
                const root = data.formRoot;

                if (!root) {
                    createAlert("Le formulaire n’a pas pu être lu.", "danger");
                    return false;
                }

                const missing = [];

                const requiredFields = [
                    ["date_evaluation", "la date d’évaluation"],
                    ["tuteur_id", "le tuteur"],
                    ["evaluateur_id", "l’évaluateur"],
                    ["niveau_actuel", "le niveau actuel"]
                ];

                requiredFields.forEach(([name, label]) => {
                    if (!root.querySelector(`[name="${name}"]`)?.value) {
                        missing.push(label);
                    }
                });

                const missingSkills = COMPETENCES.filter(item =>
                    !root.querySelector(
                        `input[name="note_${item.id}"]:checked`
                    )
                );

                if (missingSkills.length) {
                    missing.push(
                        `${missingSkills.length} compétence(s) sans note`
                    );
                }

                if (missing.length) {
                    createAlert(
                        `Merci de compléter : ${missing.join(", ")}.`,
                        "warning",
                        { title: "Formulaire incomplet" }
                    );
                    return false;
                }

                const payload = buildPayload(root, agent, agents);

                let request = supabaseClient.from("suivis_agents");

                request = suivi
                    ? request.update(payload).eq("id", suivi.id)
                    : request.insert(payload);

                const { error } = await request;

                if (error) {
                    console.error(
                        suivi
                            ? "Erreur lors de la modification du suivi :"
                            : "Erreur lors de la création du suivi :",
                        error,
                        payload
                    );

                    createAlert(
                        "L’enregistrement a échoué. Vérifie les noms et types de colonnes dans la table suivis_agents.",
                        "danger",
                        { title: "Échec de l’enregistrement" }
                    );

                    return false;
                }

                createAlert(
                    suivi
                        ? "Le suivi a bien été modifié."
                        : "Le suivi a bien été enregistré.",
                    "success",
                    { title: suivi ? "Suivi modifié" : "Suivi créé" }
                );

                if (typeof onSaved === "function") {
                    await onSaved();
                }

                return true;
            }
        });
    }

    window.openCreateSuiviModal = options => openSuiviModal(options);
    window.openEditSuiviModal = options => openSuiviModal(options);
})();