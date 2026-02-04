/**
 * Generates the Netscape Bookmark HTML string from organized data.
 * @param {Array} bookmarks - Array of classified bookmark objects.
 * @returns {string} - The formatted HTML string.
 */
export const generateNetscapeHtml = (bookmarks) => {
    const tree = {};

    // Group by Category -> SubCategory
    bookmarks.forEach(item => {
        const cat = item.category || "Other";
        const sub = item.sub_category || "General";

        if (!tree[cat]) tree[cat] = {};
        if (!tree[cat][sub]) tree[cat][sub] = [];

        tree[cat][sub].push(item);
    });

    const html = [
        '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
        '<TITLE>Organized Bookmarks</TITLE>',
        '<H1>Bookmarks</H1>',
        '<DL><p>'
    ];

    Object.keys(tree).sort().forEach(cat => {
        html.push(`    <DT><H3>${cat}</H3>`);
        html.push('    <DL><p>');

        Object.keys(tree[cat]).sort().forEach(sub => {
            html.push(`        <DT><H3>${sub}</H3>`);
            html.push('        <DL><p>');

            const sortedLinks = tree[cat][sub].sort((a, b) => a.title.localeCompare(b.title));

            sortedLinks.forEach(link => {
                const icon = link.icon ? ` ICON="${link.icon}"` : "";
                const date = link.add_date ? ` ADD_DATE="${link.add_date}"` : "";
                // Simple escaping
                const title = link.title.replace(/"/g, '&quot;');
                const url = link.url;

                html.push(`            <DT><A HREF="${url}"${date}${icon}>${title}</A>`);
            });

            html.push('        </DL><p>');
        });

        html.push('    </DL><p>');
    });

    html.push('</DL><p>');
    return html.join('\n');
};
