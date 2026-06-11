/**
 * Parses the Netscape Bookmark HTML content and extracts links.
 * @param {string} htmlContent - The raw HTML content of the bookmarks file.
 * @returns {Array} - Array of bookmark objects {title, url, add_date}.
 */
export const parseBookmarks = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const links = [];
    const seen = new Set();

    doc.querySelectorAll("a").forEach(a => {
        const url = a.href;
        // Basic validation and dedup
        if (url && !seen.has(url) && !url.startsWith("place:")) {
            seen.add(url);
            // Deliberately NOT keeping the ICON attribute: exports embed base64
            // favicons there, and holding thousands of them in memory bloats the
            // panel for data nothing downstream uses.
            links.push({
                title: a.textContent.trim() || "Untitled",
                url: url,
                add_date: a.getAttribute("add_date")
            });
        }
    });

    return links;
};
