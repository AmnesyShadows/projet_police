
/* ============================================================
   POINTS — LIEUX ET ZONES
   ============================================================ */

let pointsTypes = [];
let pointsLocations = [];
let pointsZones = [];

let pointsLeafletReady = false;
let pointsMapInstances = [];

let pointsMapHeight = 0;

/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initPointsPage();
});

async function initPointsPage() {

    const container = document.getElementById("points-table");

    if (!container) {
        console.error("Conteneur #points-table introuvable.");
        return;
    }

    await loadPointsLeaflet();
    await loadPointsData();
    renderPointsCards();
}

/* ============================================================
   CHARGEMENT LEAFLET
   ============================================================ */

async function loadPointsLeaflet() {
    if (window.L) {
        pointsLeafletReady = true;
        return;
    }

    await new Promise((resolve, reject) => {
        const script = document.createElement("script");

        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
    });

    pointsLeafletReady = true;
}

/* ============================================================
   CHARGEMENT DES DONNÉES
   ============================================================ */

async function loadPointsData() {
    try {
        const [
            typesResult,
            locationsResult,
            zonesResult
        ] = await Promise.all([
            supabaseClient
                .from("types")
                .select("*")
                .order("name", { ascending: true }),

            supabaseClient
                .from("locations")
                .select("*")
                .order("name", { ascending: true }),

            supabaseClient
                .from("zones")
                .select("*")
                .order("name", { ascending: true })
        ]);

        if (typesResult.error) throw typesResult.error;
        if (locationsResult.error) throw locationsResult.error;
        if (zonesResult.error) throw zonesResult.error;

        pointsTypes = typesResult.data ?? [];
        pointsLocations = locationsResult.data ?? [];
        pointsZones = zonesResult.data ?? [];

    } catch (error) {
        console.error("Erreur chargement des points :", error);

        createAlert(
            "Impossible de charger les lieux et les zones.",
            "danger",
            { title: "Erreur" }
        );
    }
}

/* ============================================================
   AFFICHAGE DES DEUX CARTES
   ============================================================ */


/* ============================================================
   AFFICHAGE DES LISTES PAR TYPE
   ============================================================ */

function renderPointsCards() {
    const container = document.getElementById("points-table");

    if (!container) return;

    container.innerHTML = "";

    const listsContainer = document.createElement("div");
    listsContainer.className = "points-lists";

    // Une liste pour chaque type de lieu.
    pointsTypes
        .filter(type => type.name.trim().toLowerCase() !== "zone")
        .forEach(type => {
            const locations = pointsLocations.filter(
                location => String(location.type_id) === String(type.id)
            );

            listsContainer.appendChild(
                createPointsList({
                    title: type.name,
                    subtitle: `Gestion des lieux de type ${type.name}`,
                    data: locations,
                    type: "location",
                    typeId: type.id,
                    createLabel: `Ajouter ${type.name}`
                })
            );
        });

    // Une liste unique pour toutes les zones.
    listsContainer.appendChild(
        createPointsList({
            title: "Zones",
            subtitle: "Gestion des zones géographiques",
            data: pointsZones,
            type: "zone",
            createLabel: "Ajouter Zone"
        })
    );

    container.appendChild(listsContainer);
}

/* ============================================================
   CRÉATION D'UNE LISTE
   ============================================================ */

function createPointsList(options) {
    const {
        title,
        subtitle,
        data,
        type,
        typeId = null,
        createLabel
    } = options;

    const section = document.createElement("section");
    section.className = "points-list-section";

    const heading = document.createElement("div");
    heading.className = "points-list-heading";

    const headingTitle = document.createElement("h3");

    const typeData = type === "location"
        ? pointsTypes.find(item => String(item.id) === String(typeId))
        : pointsTypes.find(item => item.name.trim().toLowerCase() === "zone");

    if (typeData?.icon) {
        headingTitle.appendChild(
            document.createTextNode(`${typeData.icon} `)
        );
    }
    // if (type === "location") {
    //     const typeData = pointsTypes.find(
    //         item => String(item.id) === String(typeId)
    //     );

    //     if (typeData?.icon) {
    //         headingTitle.appendChild(
    //             document.createTextNode(`${typeData.icon} `)
    //         );
    //     }
    // }

    headingTitle.appendChild(document.createTextNode(title));

    const headingSubtitle = document.createElement("p");
    headingSubtitle.textContent = subtitle;

    heading.append(headingTitle, headingSubtitle);

    const columns = [
        {
            key: "type_id",
            label: "Type",
            render: (value, row) => {
                const pointType = pointsTypes.find(
                    item => String(item.id) === String(value)
                );

                if (!pointType) return "—";

                const badge = createBadge(
                    pointType.name,
                    "default"
                );

                badge.style.backgroundColor = pointType.color || "#6b7280";
                badge.style.color = "#fff";

                return badge.outerHTML;
            }
        },
        {
            key: "name",
            label: "Nom"
        },
        {
            key: "visible",
            label: "Visibilité",
            render: value => value
                ? '<span class="badge badge-success">Visible</span>'
                : '<span class="badge badge-danger">Non visible</span>'
        },
        {
            key: "actions",
            label: "Actions",
            buttons: [
                {
                    key: "edit",
                    label: "✎ Modifier",
                    action: row => openPointModal(type, row)
                },
                {
                    key: "delete",
                    label: "🗑 Supprimer",
                    action: row => deletePoint(type, row)
                }
            ]
        }
    ];

    const config = {
        table: type === "location" ? "locations" : "zones",

        list: {
            newButton: false,
            columns
        },

        create: {
            title: createLabel,
            fields: []
        },

        edit: {
            title: `Modifier — ${title}`,
            fields: []
        }
    };

    const table = createTable({
        config,
        data,
        columns
    });

    // Bouton de création propre à cette liste.
    const toolbar = table.querySelector(".table-toolbar");

    if (toolbar) {
        const addButton = document.createElement("button");

        addButton.type = "button";
        addButton.className = "btn-table-new";
        addButton.textContent = `+ ${createLabel}`;

        addButton.addEventListener("click", () => {
            openPointModal(type, null, typeId);
        });

        toolbar.appendChild(addButton);
    }

    section.append(
        heading,
        table
    );

    return section;
}

/* ============================================================
   SUPPRESSION D'UN POINT
   ============================================================ */

async function deletePoint(type, point) {
    const confirmed = confirm(
        `Voulez-vous vraiment supprimer "${point.name}" ?`
    );

    if (!confirmed) return;

    const table = type === "location"
        ? "locations"
        : "zones";

    const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq("id", point.id);

    if (error) {
        console.error("Erreur suppression :", error);

        createAlert(
            "Impossible de supprimer cet élément.",
            "danger",
            { title: "Erreur" }
        );

        return;
    }

    createAlert(
        `"${point.name}" a été supprimé.`,
        "success",
        { title: "Suppression réussie" }
    );

    await loadPointsData();
    renderPointsCards();
}


/* ============================================================
   CRÉATION D'UNE CARTE
   ============================================================ */

function createPointsCard(options) {
    const {
        title,
        subtitle,
        icon,
        type
    } = options;

    const content = document.createElement("div");
    content.className = "points-card";

    const footer = document.createElement("div");
    footer.className = "card-actions";

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.className = "btn-table-new";

    addButton.textContent = type === "location"
        ? "+ Ajouter Lieux"
        : "+ Ajouter Zone";

    addButton.addEventListener("click", () => {
        openPointModal(type, null);
    });

    footer.appendChild(addButton);

    const columns = [
        {
            key: "name",
            label: "Nom",
        },
        {
            key: "type_id",
            label: "Type",
            render: value => escapePointsHtml(
                getPointsTypeName(value)
            )
        },
        {
            key: "visible",
            label: "Visibilité",
            render: value => value
                ? '<span class="points-visibility visible">● Visible</span>'
                : '<span class="points-visibility hidden">● Masqué</span>'
        },
        {
            key: "actions",
            label: "Actions",
            buttons: [
                {
                    key: "edit",
                    label: "✎ Modifier",
                    action: row => openPointModal(type, row)
                }
            ]
        }
    ];

    const data = type === "location"
        ? pointsLocations
        : pointsZones;

    const config = {
        table: type === "location" ? "locations" : "zones",

        list: {
            newButton: false,
            columns
        },

        create: {
            title: type === "location" ? "Ajouter Lieux" : "Ajouter Zone",
            fields: []
        },

        edit: {
            title: type === "location" ? "Modifier le lieu" : "Modifier la zone",
            fields: []
        }
    };

    const table = createTable({
        config,
        data,
        columns
    });

    content.appendChild(table);

    const card = createCard({
        title,
        subtitle,
        icon,
        width: 1,
        content,
        footer
    });

    return card;
}

/* ============================================================
   TYPES
   ============================================================ */

function getPointsTypeName(typeId) {
    const type = pointsTypes.find(
        item => String(item.id) === String(typeId)
    );

    return type?.name ?? "Type inconnu";
}

function getPointsTypeOptions() {
    return pointsTypes.map(type => ({
        value: type.id,
        label: type.name
    }));
}

/* ============================================================
   CONFIGURATION DES MODALES
   ============================================================ */

function getPointModalConfig(type) {
    const commonFields = [
        {
            name: "name",
            label: "Nom",
            type: "text",
            required: true,
            width: 2
        },
        {
            name: "type_id",
            label: "Type",
            type: "select",
            required: true,
            width: 2,
            options: getPointsTypeOptions()
        },
        {
            name: "description",
            label: "Description",
            type: "textarea",
            width: 4
        },
        {
            name: "visible",
            label: "Visible sur la carte",
            type: "checkbox",
            width: 4
        }
    ];

    if (type === "location") {
        commonFields.push(
            {
                name: "x",
                label: "Coordonnée X",
                type: "number",
                valueType: "number",
                required: true,
                width: 2
            },
            {
                name: "y",
                label: "Coordonnée Y",
                type: "number",
                valueType: "number",
                required: true,
                width: 2
            }
        );
    } else {
        commonFields.push({
            name: "color",
            label: "Couleur de la zone",
            type: "color",
            required: true,
            width: 2
        });
    }

    return {
        create: {
            title: type === "location"
                ? "Ajouter Lieux"
                : "Ajouter Zone",
            fields: commonFields
        },

        edit: {
            title: type === "location"
                ? "Modifier le lieu"
                : "Modifier la zone",
            fields: commonFields
        }
    };
}

/* ============================================================
   OUVERTURE MODALE
   ============================================================ */

function openPointModal(type, point = null, presetTypeId = null) {
    const isEdit = Boolean(point);

    const config = getPointModalConfig(type);

    const initialData = point
        ? { ...point }
        : {
            visible: true,
            color: "#3388ff",
            points: [],
            type_id: presetTypeId
        };

    if (type === "zone") {
        initialData.points = normalizeZonePoints(
            initialData.points
        );
    }

    // Les images sont gérées uniquement pour les lieux.
    // On copie le tableau pour ne pas modifier les données déjà chargées.
    const locationImages = Array.isArray(initialData.images)
        ? initialData.images.map(image =>
            typeof image === "object" && image !== null
                ? { ...image }
                : image
        )
        : [];

    // Pour un nouveau lieu, on utilise un identifiant temporaire stable
    // pendant toute la modale pour ranger ses fichiers dans Storage.
    const imageFolderId = initialData.id || crypto.randomUUID();

    createModal({
        config,
        data: initialData,
        mode: isEdit ? "edit" : "create",

        title: isEdit
            ? (type === "location"
                ? "Modifier le lieu"
                : "Modifier la zone")
            : (type === "location"
                ? "Ajouter Lieux"
                : "Ajouter Zone"),

        content: (contentContainer, form) => {
            
            contentContainer.className = "modal-field modal-field-full";

            const typeSelect = form.elements["type_id"];

            if (typeSelect) {
                typeSelect.value = type === "zone"
                    ? pointsTypes.find(
                        item => item.name.trim().toLowerCase() === "zone"
                    )?.id
                    : initialData.type_id;

                typeSelect.disabled = true;
            }

            if (type === "location") {
                form.elements["x"].disabled = true;
                form.elements["y"].disabled = true;

                createLocationImagesContent(
                    contentContainer,
                    locationImages,
                    imageFolderId
                );

                createLocationMapContent(
                    contentContainer,
                    initialData,
                    form
                );
            } else {
                createZoneMapContent(
                    contentContainer,
                    initialData,
                    form
                );
            }
        },

        onSave: async values => {
            await savePoint(
                type,
                values,
                initialData,
                isEdit,
                locationImages
            );
        }
    });
}

/* ============================================================
   IMAGES — LIEUX
   ============================================================ */

function createLocationImagesContent(container, images, folderId) {
    const section = document.createElement("section");
    section.className = "points-images-section";

    const title = document.createElement("h4");
    title.textContent = "Images du lieu";

    const uploadLabel = document.createElement("label");
    uploadLabel.className = "points-images-upload";
    uploadLabel.textContent = "+ Ajouter des images";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.hidden = true;
    uploadLabel.appendChild(fileInput);

    const imageList = document.createElement("div");
    imageList.className = "points-images-list";

    section.append(title, uploadLabel, imageList);
    container.appendChild(section);

    function renderImages() {
        imageList.innerHTML = "";

        if (images.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Aucune image ajoutée.";
            imageList.appendChild(empty);
            return;
        }

        images.forEach((image, index) => {
            const url = typeof image === "string"
                ? image
                : image?.path || image?.url;

            if (!url) return;

            const item = document.createElement("div");
            item.className = "points-image-item";

            const preview = document.createElement("img");
            preview.src = url;
            preview.alt = typeof image === "object" && image !== null
                ? image.alt || ""
                : "";

            const filename = document.createElement("span");
            filename.textContent = url.split("/").pop();

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => {
                images.splice(index, 1);
                renderImages();
            });

            item.append(preview, filename, deleteButton);
            imageList.appendChild(item);
        });
    }

    fileInput.addEventListener("change", async () => {
        const files = [...(fileInput.files || [])];
        if (files.length === 0) return;

        uploadLabel.style.pointerEvents = "none";
        uploadLabel.style.opacity = "0.5";

        try {
            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    createAlert(
                        `${file.name} n'est pas une image.`,
                        "warning",
                        { title: "Fichier invalide" }
                    );
                    continue;
                }

                const safeName = file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "-"
                );

                const path = `locations/${folderId}/${Date.now()}-${safeName}`;

                try {
                    const { error } = await supabaseClient
                        .storage
                        .from("images")
                        .upload(path, file, {
                            contentType: file.type,
                            upsert: false
                        });

                    if (error) throw error;

                    const { data } = supabaseClient
                        .storage
                        .from("images")
                        .getPublicUrl(path);

                    if (!data?.publicUrl) {
                        throw new Error("Impossible de récupérer l'URL publique de l'image.");
                    }

                    images.push({
                        path: data.publicUrl,
                        alt: file.name
                    });
                } catch (error) {
                    console.error("Erreur upload image :", error);
                    createAlert(
                        `Impossible d'envoyer ${file.name} : ${error.message || error}`,
                        "danger",
                        { title: "Erreur d'envoi" }
                    );
                }
            }
        } finally {
            fileInput.value = "";
            uploadLabel.style.pointerEvents = "";
            uploadLabel.style.opacity = "";
            renderImages();
        }
    });

    renderImages();
}

/* ============================================================
   CARTE — LIEUX
   ============================================================ */

function createLocationMapContent(container, data, form) {
    const title = document.createElement("h4");
    title.textContent = "Emplacement sur la carte";

    const help = document.createElement("p");
    help.className = "points-map-help";
    help.textContent = "Clique sur la carte pour définir les coordonnées X et Y.";

    const mapContainer = document.createElement("div");
    mapContainer.className = "points-map";
    mapContainer.id = `points-map-location-${Date.now()}`;

    const coordinates = document.createElement("div");
    coordinates.className = "points-coordinates";
    coordinates.textContent = `X : ${data.x ?? "—"} | Y : ${data.y ?? "—"}`;

    container.append(
        title,
        help,
        mapContainer,
        coordinates
    );

    const xInput = form.elements["x"];
    const yInput = form.elements["y"];

    initializePointsMap(mapContainer, map => {
        let marker = null;

        if (
            data.x !== null &&
            data.x !== undefined &&
            data.y !== null &&
            data.y !== undefined
        ) {
            marker = L.marker([
                pointsMapHeight - Number(data.y),
                Number(data.x)
            ]).addTo(map);
        }

        map.on("click", event => {
            const x = Math.round(event.latlng.lng);
            const y = Math.round(
                pointsMapHeight - event.latlng.lat
            );

            xInput.value = x;
            yInput.value = y;

            coordinates.textContent = `X : ${x} | Y : ${y}`;

            if (marker) {
                marker.setLatLng([
                    pointsMapHeight - y,
                    x
                ]);
            } else {
                marker = L.marker([y, x]).addTo(map);
            }
        });
    });
}

/* ============================================================
   CARTE — ZONES
   ============================================================ */


function createZoneMapContent(container, data, form) {
    const title = document.createElement("h4");
    title.textContent = "Délimitation de la zone";

    const help = document.createElement("p");
    help.className = "points-map-help";
    help.textContent =
        "Clique successivement sur la carte pour placer les sommets. Déplace les points pour ajuster le contour.";

    const mapContainer = document.createElement("div");
    mapContainer.className = "points-map";
    mapContainer.id = `points-map-zone-${Date.now()}`;

    const actions = document.createElement("div");
    actions.className = "points-map-actions";

    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.className = "btn-table edit";
    undoButton.textContent = "Annuler le dernier point";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "btn-table delete";
    clearButton.textContent = "Effacer le contour";

    actions.append(undoButton, clearButton);

    const coordinates = document.createElement("div");
    coordinates.className = "points-coordinates";

    container.append(
        title,
        help,
        mapContainer,
        actions,
        coordinates
    );

    const colorInput = form.elements["color"];

    // Affiche la couleur enregistrée lors de la modification
    colorInput.value = data.color || "#00ffff";

    let vertices = normalizeZonePoints(data.points);
    let markers = [];
    let polygon = null;
    let mapInstance = null;

    function updateCoordinates() {
        coordinates.textContent =
            `${vertices.length} point(s) placé(s). Minimum 3 points pour enregistrer une zone.`;
    }

    function redraw() {
        markers.forEach(marker => mapInstance.removeLayer(marker));
        markers = [];

        if (polygon) {
            mapInstance.removeLayer(polygon);
            polygon = null;
        }

        const color = colorInput.value || "#00ffff";

        // Dessin du contour et du remplissage
        if (vertices.length >= 2) {
            polygon = L.polygon(
                vertices.map(point => [
                    pointsMapHeight - point.y,
                    point.x
                ]),
                {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2
                }
            ).addTo(mapInstance);
        }

        // Petits points ronds aux sommets
        vertices.forEach((point, index) => {
            const marker = L.marker(
                [
                    pointsMapHeight - point.y,
                    point.x
                ],
                {
                    draggable: true,
                    icon: L.divIcon({
                        className: "",
                        html: `
                            <div style="
                                width: 9px;
                                height: 9px;
                                background: ${color};
                                border: 1px solid ${color};
                                border-radius: 50%;
                                box-sizing: border-box;
                            "></div>
                        `,
                        iconSize: [9, 9],
                        iconAnchor: [4.5, 4.5]
                    })
                }
            ).addTo(mapInstance);

            marker.on("drag", event => {
                const position = event.target.getLatLng();

                vertices[index] = {
                    x: Math.round(position.lng),
                    y: Math.round(pointsMapHeight - position.lat)
                };

                if (polygon) {
                    polygon.setLatLngs(
                        vertices.map(item => [
                            pointsMapHeight - item.y,
                            item.x
                        ])
                    );
                }
            });

            marker.on("dragend", updateCoordinates);

            markers.push(marker);
        });

        updateCoordinates();
    }

    initializePointsMap(mapContainer, map => {
        mapInstance = map;

        redraw();

        map.on("click", event => {
            vertices.push({
                x: Math.round(event.latlng.lng),
                y: Math.round(pointsMapHeight - event.latlng.lat)
            });

            redraw();
        });

        undoButton.addEventListener("click", () => {
            vertices.pop();
            redraw();
        });

        clearButton.addEventListener("click", () => {
            vertices = [];
            redraw();
        });

        colorInput.addEventListener("input", redraw);
        colorInput.addEventListener("change", redraw);
    });

    mapContainer.getZonePoints = () => vertices;
}


/* ============================================================
   INITIALISATION DE LA CARTE LEAFLET
   ============================================================ */

function initializePointsMap(container, callback) {
    if (!pointsLeafletReady || !window.L) {
        console.error("Leaflet n'est pas chargé.");
        return;
    }

    const image = new Image();

    image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;

        container.style.width = "100%";
        container.style.height = "auto";
        container.style.aspectRatio = `${width} / ${height}`;

        pointsMapHeight = height;

        const bounds = [
            [0, 0],
            [height, width]
        ];

        const map = L.map(container, {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 2,
            zoomControl: true,
            attributionControl: false
        });

        L.imageOverlay(
            "../assets/images/map.jpg",
            bounds
        ).addTo(map);

        map.fitBounds(bounds);

        pointsMapInstances.push(map);

        callback(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 150);
    };

    image.onerror = () => {
        console.error(
            "Impossible de charger ../assets/images/map.jpg. Vérifie le chemin de l'image."
        );

        container.innerHTML = `
            <div style="
                padding:20px;
                color:white;
                text-align:center;
            ">
                Impossible de charger la carte.<br>
                Vérifie le chemin : ../assets/images/map.jpg
            </div>
        `;
    };

    image.src = "../assets/images/map.jpg";
}

/* ============================================================
   NORMALISATION DES POINTS DE ZONE
   ============================================================ */

function normalizeZonePoints(points) {
    if (!points) return [];

    let parsed = points;

    if (typeof parsed === "string") {
        try {
            parsed = JSON.parse(parsed);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed.map(point => {
        if (Array.isArray(point)) {
            return {
                x: Number(point[0]),
                y: Number(point[1])
            };
        }

        return {
            x: Number(point.x),
            y: Number(point.y)
        };
    }).filter(point =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y)
    );
}

/* ============================================================
   SAUVEGARDE
   ============================================================ */

async function savePoint(type, values, originalData, isEdit, locationImages = []) {
    const table = type === "location"
        ? "locations"
        : "zones";

    const payload = {
        name: values.name,
        type_id: values.type_id,
        description: values.description ?? "",
        visible: Boolean(values.visible)
    };

    if (type === "location") {
        payload.x = values.x;
        payload.y = values.y;

        // Enregistre les images conservées et celles ajoutées dans la modale.
        // Pour un lieu sans image, on enregistre un tableau vide.
        payload.images = locationImages;
    } else {
        payload.color = values.color || "#3388ff";

        const mapContainer = document.querySelector(
            ".points-map[id^='points-map-zone-']"
        );

        const vertices = mapContainer?.getZonePoints
            ? mapContainer.getZonePoints()
            : normalizeZonePoints(originalData.points);

        if (vertices.length < 3) {
            createAlert(
                "Une zone doit contenir au minimum 3 points.",
                "warning",
                { title: "Contour incomplet" }
            );

            throw new Error("Zone avec moins de 3 points.");
        }

        payload.points = vertices;
    }

    try {
        let result;

        if (isEdit) {
            result = await supabaseClient
                .from(table)
                .update(payload)
                .eq("id", originalData.id);
        } else {
            result = await supabaseClient
                .from(table)
                .insert(payload);
        }

        if (result.error) {
            throw result.error;
        }

        createAlert(
            isEdit
                ? "Les informations ont été modifiées."
                : "L'élément a été ajouté avec succès.",
            "success",
            {
                title: isEdit
                    ? "Modification réussie"
                    : "Ajout réussi"
            }
        );

        await loadPointsData();
        renderPointsCards();

    } catch (error) {
        console.error("Erreur sauvegarde point :", error);

        createAlert(
            error.message || "Impossible d'enregistrer cet élément.",
            "danger",
            { title: "Erreur" }
        );

        throw error;
    }
}

/* ============================================================
   UTILITAIRE HTML
   ============================================================ */

function escapePointsHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
