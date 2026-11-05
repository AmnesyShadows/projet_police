// ============================================================
// COMPTABILITÉ
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("comptabilites-table");

    if (!container) {
        console.error("Conteneur comptabilité introuvable.");
        return;
    }

    const allowed = await Permissions.can("comptabilite.access");

    if (!allowed) {
        window.location.replace("../index.html");
        return;
    }

    container.innerHTML = "";

    // ========================================================
    // OUTILS
    // ========================================================

    const formatMoney = value =>
        new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: 0
        }).format(Math.round(value)) + " $";

    const formatHours = (heures, minutes) => {
        const totalMinutes = heures * 60 + minutes;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;

        return `${h}h${String(m).padStart(2, "0")}`;
    };

    // Même calcul que dans agents.js
    const calculerPrime = (totalHeures, taux) => {
        const plafond = taux * 30;
        const heuresPlafond = 30;

        const primeBase = totalHeures * taux;

        if (taux <= 0 || primeBase < plafond) {
            return primeBase;
        }

        const heuresSupplementaires =
            totalHeures - heuresPlafond;

        const bonus =
            Math.floor(heuresSupplementaires / 10) * 500;

        return plafond + bonus;
    };

    // Retourne le lundi de la semaine ISO
    const getWeekDates = (annee, semaine) => {
        const premierJanvier = new Date(annee, 0, 4);

        const jour = premierJanvier.getDay() || 7;

        const lundiSemaine1 = new Date(premierJanvier);
        lundiSemaine1.setDate(
            premierJanvier.getDate() - jour + 1
        );

        const lundi = new Date(lundiSemaine1);
        lundi.setDate(
            lundiSemaine1.getDate() + (semaine - 1) * 7
        );

        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);

        return { lundi, dimanche };
    };

    const formatDate = date =>
        date.toLocaleDateString("fr-FR");

    // ========================================================
    // RÉCUPÉRATION DES POINTAGES
    // ========================================================

    const { data: pointages, error } = await supabaseClient
        .from("pointages")
        .select(`
            id,
            agent_id,
            annee,
            semaine,
            heures,
            minutes,
            taux_horaire,
            paye,
            agents (
                id,
                prenom,
                nom,
                matricule,
                grade,
                grades (
                    nom,
                    priority
                )
            )
        `)
        .order("annee", { ascending: false })
        .order("semaine", { ascending: false });

    if (error) {
        console.error("Erreur récupération comptabilité :", error);

        createAlert(
            "Impossible de récupérer les pointages.",
            "danger",
            { title: "Erreur" }
        );

        return;
    }

    if (!pointages || pointages.length === 0) {
        const empty = document.createElement("div");
        empty.className = "specialized-card-placeholder";
        empty.textContent = "Aucun pointage disponible.";
        container.appendChild(empty);
        return;
    }

    // ========================================================
    // CALCUL ET REGROUPEMENT PAR SEMAINE
    // ========================================================

    const semaines = new Map();

    pointages.forEach(pointage => {
        const annee = Number(pointage.annee);
        const semaine = Number(pointage.semaine);

        const heures = Number(pointage.heures) || 0;
        const minutes = Number(pointage.minutes) || 0;
        const taux = Number(pointage.taux_horaire) || 0;

        const totalHeures = heures + minutes / 60;

        const prime = calculerPrime(totalHeures, taux);

        // Ne pas prendre en compte les primes nulles
        if (prime <= 0) {
            return;
        }

        const key = `${annee}-${String(semaine).padStart(2, "0")}`;

        if (!semaines.has(key)) {
            const dates = getWeekDates(annee, semaine);

            semaines.set(key, {
                annee,
                semaine,
                lundi: dates.lundi,
                dimanche: dates.dimanche,
                agents: [],
                totalMinutes: 0,
                totalPrimes: 0,
                nonPayes: 0
            });
        }

        const semaineData = semaines.get(key);

        const agent = pointage.agents || {};

        const agentNom =
            `${agent.prenom || ""} ${agent.nom || ""}`.trim();

        semaineData.agents.push({
            pointageId: pointage.id,
            agentId: pointage.agent_id,
            prenom: agent.prenom || "",
            nom: agent.nom || "",
            nomComplet: agentNom || "Agent inconnu",
            matricule: agent.matricule || "—",
            grade: agent.grades?.nom || agent.grade || "—",
            priority: Number(agent.grades?.priority ?? Infinity),
            heures,
            minutes,
            taux,
            prime,
            paye: pointage.paye === true
        });

        semaineData.totalMinutes += heures * 60 + minutes;
        semaineData.totalPrimes += prime;

        if (pointage.paye !== true) {
            semaineData.nonPayes++;
        }
    });

    const semainesTriees = [...semaines.values()].sort(
        (a, b) =>
            b.annee - a.annee ||
            b.semaine - a.semaine
    );

    // ========================================================
    // AFFICHAGE DES CARDS
    // ========================================================

    const grid = document.createElement("div");

    grid.className = "cards-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns =
        "repeat(4, minmax(0, 1fr))";
    grid.style.gap = "16px";

    container.appendChild(grid);

    // Adaptation mobile
    const responsiveStyle = document.createElement("style");

    responsiveStyle.textContent = `
        @media (max-width: 1100px) {
            #comptabilites-table .cards-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
        }

        @media (max-width: 600px) {
            #comptabilites-table .cards-grid {
                grid-template-columns: 1fr !important;
            }
        }

        .comptabilite-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 14px;
        }

        .comptabilite-actions button {
            flex: 1;
            min-width: 90px;
        }

        .comptabilite-stats {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .comptabilite-stat {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .comptabilite-stat-label {
            font-size: 12px;
            opacity: .65;
        }

        .comptabilite-stat-value {
            font-size: 19px;
            font-weight: 700;
        }

        .comptabilite-checkbox {
            width: 17px;
            height: 17px;
            cursor: pointer;
        }
    `;

    document.head.appendChild(responsiveStyle);

    semainesTriees.forEach(semaineData => {

        const totalHeures = Math.floor(
            semaineData.totalMinutes / 60
        );

        const totalMinutes = semaineData.totalMinutes % 60;

        const content = document.createElement("div");
        content.className = "comptabilite-stats";

        // Total de service
        const service = document.createElement("div");
        service.className = "comptabilite-stat";

        const serviceLabel = document.createElement("span");
        serviceLabel.className = "comptabilite-stat-label";
        serviceLabel.textContent = "Total de service";

        const serviceValue = document.createElement("span");
        serviceValue.className = "comptabilite-stat-value";
        serviceValue.textContent = formatHours(
            totalHeures,
            totalMinutes
        );

        service.append(serviceLabel, serviceValue);

        // Total des primes
        const primes = document.createElement("div");
        primes.className = "comptabilite-stat";

        const primesLabel = document.createElement("span");
        primesLabel.className = "comptabilite-stat-label";
        primesLabel.textContent = "Total des primes";

        const primesValue = document.createElement("span");
        primesValue.className = "comptabilite-stat-value";
        primesValue.textContent = formatMoney(
            semaineData.totalPrimes
        );

        primes.append(primesLabel, primesValue);

        // Agents non payés
        const nonPayes = document.createElement("div");
        nonPayes.className = "comptabilite-stat";

        const nonPayesLabel = document.createElement("span");
        nonPayesLabel.className = "comptabilite-stat-label";
        nonPayesLabel.textContent = "Agents non payés";

        const nonPayesValue = document.createElement("span");
        nonPayesValue.className = "comptabilite-stat-value";
        nonPayesValue.textContent = String(semaineData.nonPayes);

        nonPayes.append(nonPayesLabel, nonPayesValue);

        content.append(service, primes, nonPayes);

        // Boutons
        const actions = document.createElement("div");
        actions.className = "comptabilite-actions";

        const detailsButton = document.createElement("button");
        detailsButton.type = "button";
        detailsButton.className = "btn-card-edit";
        detailsButton.textContent = "Détails";

        detailsButton.addEventListener("click", () => {
            ouvrirDetails(semaineData, {
                nonPayesValue,
                primesValue
            });
        });

        const subventionButton = document.createElement("button");
        subventionButton.type = "button";
        subventionButton.className = "btn-table other";
        subventionButton.textContent = "⬇ Télécharger";

        subventionButton.addEventListener("click", () => {
            genererSubvention(semaineData);
        });

        actions.append(detailsButton, subventionButton);
        content.appendChild(actions);

        const lundi = formatDate(semaineData.lundi);
        const dimanche = formatDate(semaineData.dimanche);

        const card = createCard({
            title: `Semaine ${semaineData.semaine} — du ${lundi} au ${dimanche}`,
            subtitle: "Subvention",
            icon: "🧾",
            width: 1,
            content
        });

        grid.appendChild(card);
    });

    // ========================================================
    // MODAL DÉTAILS
    // ========================================================

    function ouvrirDetails(semaineData, elementsCard) {

        createModal({
            config: {},
            data: {},
            mode: "view",
            title: `Détails — Semaine ${semaineData.semaine}`,

            content: container => {

                container.className = "modal-field-full";

                const wrapper = document.createElement("div");
                wrapper.className = "pointeuse-wrapper";

                // En-tête
                const header = document.createElement("div");
                header.className = "pointeuse-header";

                const headerInfo = document.createElement("div");
                headerInfo.className = "pointeuse-header-info";

                const heading = document.createElement("h4");
                heading.textContent = "Détail des primes";

                const description = document.createElement("p");
                description.textContent =
                    `Du ${formatDate(semaineData.lundi)} au ${formatDate(semaineData.dimanche)}`;

                headerInfo.append(heading, description);

                const count = document.createElement("span");
                count.className = "pointeuse-count";
                count.textContent =
                    `${semaineData.agents.length} agent${semaineData.agents.length > 1 ? "s" : ""}`;

                header.append(headerInfo, count);
                wrapper.appendChild(header);

                // Tableau
                const tableContainer = document.createElement("div");
                tableContainer.className = "pointeuse-table-container";

                const table = document.createElement("table");
                table.className = "pointeuse-table";

                const thead = document.createElement("thead");
                const headerRow = document.createElement("tr");

                [
                    "Agent",
                    "Grade",
                    "Temps de service",
                    "Prime",
                    "Payé"
                ].forEach(label => {
                    const th = document.createElement("th");
                    th.textContent = label;
                    headerRow.appendChild(th);
                });

                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement("tbody");

                semaineData.agents.forEach(agent => {

                    const row = document.createElement("tr");

                    // Agent
                    const agentCell = document.createElement("td");

                    const agentWrapper = document.createElement("div");
                    agentWrapper.className = "pointeuse-agent";

                    const avatar = document.createElement("div");
                    avatar.className = "pointeuse-avatar";
                    avatar.textContent =
                        `${agent.prenom.charAt(0)}${agent.nom.charAt(0)}`.toUpperCase();

                    const agentInfo = document.createElement("div");
                    agentInfo.className = "pointeuse-agent-info";

                    const agentName = document.createElement("span");
                    agentName.className = "pointeuse-agent-name";
                    agentName.textContent = agent.nomComplet;

                    const matricule = document.createElement("span");
                    matricule.className = "pointeuse-agent-matricule";
                    matricule.textContent = `Matricule : ${agent.matricule}`;

                    agentInfo.append(agentName, matricule);
                    agentWrapper.append(avatar, agentInfo);
                    agentCell.appendChild(agentWrapper);

                    // Grade
                    const gradeCell = document.createElement("td");
                    const grade = document.createElement("span");
                    grade.className = "pointeuse-grade";
                    grade.textContent = agent.grade;
                    gradeCell.appendChild(grade);

                    // Temps
                    const tempsCell = document.createElement("td");
                    const temps = document.createElement("span");
                    temps.className = "pointeuse-taux";
                    temps.textContent = formatHours(
                        agent.heures,
                        agent.minutes
                    );
                    tempsCell.appendChild(temps);

                    // Prime
                    const primeCell = document.createElement("td");
                    const prime = document.createElement("span");
                    prime.className = "pointeuse-prime";
                    prime.textContent = formatMoney(agent.prime);
                    primeCell.appendChild(prime);

                    // Checkbox paiement
                    const payeCell = document.createElement("td");

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "comptabilite-checkbox";
                    checkbox.checked = agent.paye;
                    checkbox.setAttribute(
                        "aria-label",
                        `Paiement de ${agent.nomComplet}`
                    );

                    checkbox.addEventListener("change", async () => {

                        checkbox.disabled = true;

                        const nouvelleValeur = checkbox.checked;

                        const { error } = await supabaseClient
                            .from("pointages")
                            .update({ paye: nouvelleValeur })
                            .eq("id", agent.pointageId);

                        if (error) {
                            console.error(
                                "Erreur sauvegarde paiement :",
                                error
                            );

                            checkbox.checked = !nouvelleValeur;

                            createAlert(
                                "Impossible d'enregistrer le paiement.",
                                "danger",
                                { title: "Erreur" }
                            );
                        } else {
                            agent.paye = nouvelleValeur;

                            semaineData.nonPayes +=
                                nouvelleValeur ? -1 : 1;

                            elementsCard.nonPayesValue.textContent =
                                String(semaineData.nonPayes);

                            createAlert(
                                nouvelleValeur
                                    ? "Paiement enregistré."
                                    : "Paiement annulé.",
                                "success",
                                { title: "Comptabilité" }
                            );
                        }

                        checkbox.disabled = false;
                    });

                    payeCell.appendChild(checkbox);

                    row.append(
                        agentCell,
                        gradeCell,
                        tempsCell,
                        primeCell,
                        payeCell
                    );

                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                tableContainer.appendChild(table);
                wrapper.appendChild(tableContainer);

                // Total
                const footer = document.createElement("div");
                footer.className = "pointeuse-header";

                const totalLabel = document.createElement("strong");
                totalLabel.textContent = "Total des primes";

                const totalValue = document.createElement("strong");
                totalValue.className = "pointeuse-prime";
                totalValue.textContent = formatMoney(
                    semaineData.totalPrimes
                );

                footer.append(totalLabel, totalValue);
                wrapper.appendChild(footer);

                container.appendChild(wrapper);
            }
        });
    }

    // ========================================================
    // GÉNÉRATION DE LA SUBVENTION PDF
    // ========================================================

    async function genererSubvention(semaineData) {

        // ========================================================
        // RÉCUPÉRATION DE L'AGENT CONNECTÉ
        // ========================================================

        let agentConnecte = null;

        try {
            const { data: sessionData, error: sessionError } =
                await supabaseClient.auth.getSession();

            if (sessionError) throw sessionError;

            const user = sessionData.session?.user;

            if (!user) {
                createAlert(
                    "Impossible d'identifier l'agent connecté.",
                    "danger"
                );
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
                createAlert(
                    "Identifiant Discord introuvable.",
                    "danger"
                );
                return;
            }

            const { data, error } = await supabaseClient
                .from("agents")
                .select("prenom, nom, matricule")
                .eq("discord_id", discordId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                createAlert(
                    "Votre profil agent est introuvable.",
                    "danger"
                );
                return;
            }

            agentConnecte = data;

        } catch (error) {
            console.error(
                "Erreur récupération agent connecté :",
                error
            );

            createAlert(
                "Impossible de récupérer les informations de signature.",
                "danger"
            );

            return;
        }

        // ========================================================
        // DONNÉES DE LA DEMANDE
        // ========================================================

        const { annee, semaine, lundi, dimanche } = semaineData;

        const numeroFacture =
            `${String(semaine).padStart(2, "0")}${annee}`;

        const formatDate = date =>
            date.toLocaleDateString("fr-FR");

        const formatMoney = value =>
            new Intl.NumberFormat("fr-FR", {
                maximumFractionDigits: 0
            }).format(Math.round(value)) + " $";

        const totalHeures = Math.floor(
            semaineData.totalMinutes / 60
        );

        const totalMinutes = semaineData.totalMinutes % 60;

        const heuresTotales =
            `${totalHeures} h ${String(totalMinutes).padStart(2, "0")}`;

        const dateEdition = new Date().toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

        const nomSignature = (
            agentConnecte.nom || "Agent"
        ).toUpperCase();

        const matriculeSignature =
            agentConnecte.matricule || "—";

        // ========================================================
        // TRI DES AGENTS
        // Priorité la plus basse = grade le plus important
        // Puis matricule croissant
        // ========================================================

        const agentsTries = [...semaineData.agents].sort((a, b) => {

            const priorityA = Number(a.priority ?? Infinity);
            const priorityB = Number(b.priority ?? Infinity);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            return String(a.matricule ?? "").localeCompare(
                String(b.matricule ?? ""),
                "fr",
                { numeric: true }
            );
        });

        // ========================================================
        // LIGNES DU TABLEAU
        // ========================================================

        const lignes = agentsTries.map(agent => {

            const matricule = agent.matricule ?? "—";

            const nomComplet = [
                agent.prenom,
                agent.nom
            ].filter(Boolean).join(" ") || "Agent inconnu";

            const grade = agent.grade ?? "—";

            const heures = Number(agent.heures ?? 0);
            const minutes = Number(agent.minutes ?? 0);

            const totalMinutes = heures * 60 + minutes;

            const heuresAffichees =
                `${Math.floor(totalMinutes / 60)} h ${
                    String(totalMinutes % 60).padStart(2, "0")
                }`;

            return `
                <tr>
                    <td class="agent-name">
                        <strong>${escapeHtml(matricule)}</strong>
                        <span class="agent-fullname">
                            ${escapeHtml(nomComplet)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(grade)}
                    </td>

                    <td class="hours">
                        ${heuresAffichees}
                    </td>

                    <td class="amount">
                        ${formatMoney(agent.prime)}
                    </td>
                </tr>
            `;
        }).join("");

        // ========================================================
        // LOGO
        // ========================================================

        const logoUrl = new URL(
            "../assets/images/logo.png",
            window.location.href
        ).href;

        // ========================================================
        // DOCUMENT HTML
        // ========================================================

        const documentHtml = `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>Demande de subvention ${numeroFacture}</title>

                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        background: #ffffff;
                        color: #252a32;
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 12px;
                    }

                    .document {
                        width: 100%;
                        max-width: 210mm;
                        margin: auto;
                    }

                    .top-line {
                        height: 7px;
                        background: #d5a52b;
                        margin-bottom: 25px;
                    }

                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: 20px;
                        background: #ffffff;
                    }

                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }

                    .brand img {
                        width: 75px;
                        height: 75px;
                        object-fit: contain;
                    }

                    .brand-name {
                        font-size: 19px;
                        font-weight: 800;
                        letter-spacing: 2px;
                        color: #202936;
                    }

                    .brand-subtitle {
                        margin-top: 5px;
                        color: #747d89;
                        font-size: 10px;
                        letter-spacing: 1.5px;
                    }

                    .document-label {
                        text-align: right;
                        color: #202936;
                        font-size: 21px;
                        font-weight: 800;
                        line-height: 1.3;
                    }

                    .document-label span {
                        display: block;
                        margin-top: 5px;
                        color: #c09224;
                        font-size: 10px;
                        letter-spacing: 2px;
                    }

                    .reference {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        margin: 25px 0;
                        padding: 16px 18px;
                        background: #f2f4f7;
                        border-left: 4px solid #d5a52b;
                    }

                    .reference-label {
                        color: #7b8490;
                        font-size: 9px;
                        font-weight: bold;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        margin-bottom: 6px;
                    }

                    .reference-value {
                        color: #202936;
                        font-size: 15px;
                        font-weight: bold;
                    }

                    .section-title {
                        margin: 25px 0 12px;
                        color: #202936;
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    thead {
                        display: table-header-group;
                    }

                    th {
                        padding: 12px 9px;
                        background: #202936;
                        color: #ffffff;
                        text-align: left;
                        font-size: 9px;
                        letter-spacing: .5px;
                        text-transform: uppercase;
                    }

                    td {
                        padding: 12px 9px;
                        border-bottom: 1px solid #e4e7eb;
                        color: #343b45;
                        font-size: 11px;
                    }

                    tbody tr:nth-child(even) {
                        background: #f7f8fa;
                    }

                    tr {
                        page-break-inside: avoid;
                    }

                    .matricule {
                        font-weight: bold;
                        color: #202936;
                    }

                    .agent-name {
                        font-weight: 600;
                        color: #202936;
                    }

                    .agent-name strong {
                        display: block;
                        font-size: 11px;
                        font-weight: 800;
                    }

                    .agent-fullname {
                        display: block;
                        margin-top: 4px;
                        color: #68717d;
                        font-size: 10px;
                    }

                    .hours {
                        white-space: nowrap;
                    }

                    .amount {
                        text-align: right;
                        font-weight: bold;
                        white-space: nowrap;
                    }

                    th:last-child {
                        text-align: right;
                    }

                    .total-box {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 20px;
                        padding: 19px 20px;
                        background: #202936;
                        color: white;
                        border-bottom: 4px solid #d5a52b;
                    }

                    .total-label {
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }

                    .total-value {
                        color: #f0c75e;
                        font-size: 23px;
                        font-weight: 800;
                    }

                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        gap: 30px;
                        margin-top: 55px;
                        page-break-inside: avoid;
                    }

                    .edition {
                        color: #7b8490;
                        font-size: 10px;
                        line-height: 1.8;
                    }

                    .signature {
                        min-width: 220px;
                        text-align: center;
                    }

                    .signature-title {
                        margin-bottom: 10px;
                        color: #7b8490;
                        font-size: 9px;
                        font-weight: bold;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }

                    .signature-name {
                        min-height: 48px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #202936;
                        font-family: "Brush Script MT",
                            "Segoe Script", cursive;
                        font-size: 32px;
                        font-style: italic;
                        transform: rotate(-4deg);
                    }

                    .signature-line {
                        border-top: 1px solid #202936;
                        padding-top: 7px;
                        color: #59616d;
                        font-size: 10px;
                    }

                    .footer {
                        margin-top: 35px;
                        padding-top: 12px;
                        border-top: 1px solid #dfe3e8;
                        color: #9299a3;
                        text-align: center;
                        font-size: 9px;
                        letter-spacing: .5px;
                    }

                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        .document {
                            max-width: none;
                        }
                    }
                </style>
            </head>

            <body>
                <main class="document">

                    <div class="top-line"></div>

                    <header class="header">
                        <div class="brand">
                            <img
                                src="${logoUrl}"
                                alt="Logo BCSO"
                            >

                            <div>
                                <div class="brand-name">
                                    BCSO
                                </div>

                                <div class="brand-subtitle">
                                    BLAINE COUNTY SHERIFF'S OFFICE
                                </div>
                            </div>
                        </div>

                        <div class="document-label">
                            DEMANDE DE<br>SUBVENTION
                            <span>DOCUMENT ADMINISTRATIF</span>
                        </div>
                    </header>

                    <section class="reference">
                        <div>
                            <div class="reference-label">
                                Numéro de facture
                            </div>

                            <div class="reference-value">
                                ${numeroFacture}
                            </div>
                        </div>

                        <div>
                            <div class="reference-label">
                                Période concernée
                            </div>

                            <div class="reference-value">
                                Du ${formatDate(lundi)}
                                au ${formatDate(dimanche)}
                            </div>
                        </div>
                    </section>

                    <div class="section-title">
                        Détail des agents et des primes
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Grade</th>
                                <th>Heures effectuées</th>
                                <th>Prime</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${lignes}
                        </tbody>
                    </table>

                    <section class="total-box">
                        <div class="total-label">
                            Total général de la subvention
                        </div>

                        <div class="total-value">
                            ${formatMoney(semaineData.totalPrimes)}
                        </div>
                    </section>

                    <section class="signature-section">
                        <div class="edition">
                            <strong>Date d'édition</strong><br>
                            ${dateEdition}<br><br>

                            <strong>Document émis par</strong><br>
                            ${escapeHtml(agentConnecte.prenom ?? "")}
                            ${escapeHtml(agentConnecte.nom ?? "")}
                        </div>

                        <div class="signature">
                            <div class="signature-title">
                                Signature de l'agent
                            </div>

                            <div class="signature-name">
                                ${escapeHtml(nomSignature)}
                            </div>

                            <div class="signature-line">
                                Matricule ${escapeHtml(matriculeSignature)}
                            </div>
                        </div>
                    </section>

                    <footer class="footer">
                        BLAINE COUNTY SHERIFF'S OFFICE
                        — DOCUMENT DE DEMANDE DE SUBVENTION
                    </footer>

                </main>
            </body>
            </html>
        `;

        // Prépare le document HTML pour sa conversion en PDF.
        const parsedDocument = new DOMParser().parseFromString(
            documentHtml,
            "text/html"
        );

        const pdfStyle = parsedDocument.querySelector("style");
        const pdfElement = parsedDocument.querySelector(".document");

        if (!pdfStyle || !pdfElement) {
            createAlert(
                "Impossible de préparer le document PDF.",
                "danger"
            );
            return;
        }

        // Charge html2pdf uniquement si la bibliothèque n'est pas déjà présente.
        const chargerHtml2Pdf = () => {
            if (typeof window.html2pdf === "function") {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        let pdfHost = null;
        let styleElement = null;

        try {
            await chargerHtml2Pdf();

            styleElement = document.createElement("style");
            styleElement.textContent = pdfStyle.textContent;
            document.head.appendChild(styleElement);

            pdfHost = document.createElement("div");
            pdfHost.style.position = "fixed";
            pdfHost.style.left = "-10000px";
            pdfHost.style.top = "0";
            pdfHost.style.width = "180mm";
            pdfHost.style.background = "#ffffff";
            pdfHost.style.zIndex = "-1";

            pdfHost.appendChild(pdfElement);
            document.body.appendChild(pdfHost);

            const logo = pdfElement.querySelector("img");

            if (logo && !logo.complete) {
                await new Promise(resolve => {
                    logo.onload = resolve;
                    logo.onerror = resolve;
                });
            }

            await window.html2pdf()
                .set({
                    margin: [12, 15, 12, 15],
                    filename: "demande_subvention_" + numeroFacture + ".pdf",
                    image: {
                        type: "jpeg",
                        quality: 0.98
                    },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                        logging: false
                    },
                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait"
                    },
                    pagebreak: {
                        mode: ["css", "legacy"]
                    }
                })
                .from(pdfElement)
                .save();

            createAlert(
                "La demande de subvention a été téléchargée.",
                "success",
                { title: "Téléchargement terminé" }
            );

        } catch (error) {
            console.error("Erreur génération PDF :", error);

            createAlert(
                "Impossible de télécharger la demande de subvention.",
                "danger",
                { title: "Erreur PDF" }
            );

        } finally {
            if (pdfHost) pdfHost.remove();
            if (styleElement) styleElement.remove();
        }
    }

    // ========================================================
    // SÉCURISATION HTML
    // ========================================================

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

});