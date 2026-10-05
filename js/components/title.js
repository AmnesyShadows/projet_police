function createPageTitle(title, subtitle = "", options = {}) {

    const {
        level = 2,
        className = "",
        icon = ""
    } = options;

    const wrapper = document.createElement("div");

    wrapper.className = `page-title-wrapper ${className}`.trim();

    if (icon) {
        const iconElement = document.createElement("div");

        iconElement.className = "page-title-icon";
        iconElement.innerHTML = icon;

        wrapper.appendChild(iconElement);
    }

    const content = document.createElement("div");

    content.className = "page-title-content";

    const heading = document.createElement(`h${level}`);

    heading.className = "page-title";
    heading.textContent = title;

    content.appendChild(heading);

    if (subtitle) {

        const description = document.createElement("div");

        description.className = "page-subtitle";
        description.textContent = subtitle;

        content.appendChild(description);
    }

    wrapper.appendChild(content);

    return wrapper;
}