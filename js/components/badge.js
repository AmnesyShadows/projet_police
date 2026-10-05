function createBadge(text, type = "default", options = {}) {

    const {
        className = ""
    } = options;

    const badge = document.createElement("span");

    badge.className = `badge badge-${type} ${className}`.trim();
    badge.textContent = text;

    return badge;
}