/**
 * Parses the Netscape Bookmark HTML content and extracts links.
 * @param {string} htmlContent - The raw HTML content of the bookmarks file.
 * @returns {Array} - Array of bookmark objects {title, url, add_date}.
 */
export const parseBookmarks = (htmlContent) => {
    // Strip embedded favicon attributes BEFORE parsing: exports carry a
    // base64 ICON on every <A>, so DOMParser would otherwise build a DOM
    // holding hundreds of MB of icon data, stalling or OOM-ing the panel.
    const stripped = htmlContent.replace(/\s(?:ICON|ICON_URI)="[^"]*"/gi, "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(stripped, "text/html");
    const links = [];
    const seen = new Set();

    doc.querySelectorAll("a").forEach(a => {
        const url = a.href;
        // Basic validation and dedup
        if (url && !seen.has(url) && !url.startsWith("place:")) {
            seen.add(url);
            links.push({
                title: a.textContent.trim() || "Untitled",
                url: url,
                add_date: a.getAttribute("add_date")
            });
        }
    });

    return links;
};
