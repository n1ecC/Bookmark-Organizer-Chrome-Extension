import { getBookmarks, flattenBookmarks, createBookmark, findOrCreateFolder } from './bookmarks';
import { classifyBatch } from './ai';
import { downloadBookmarks } from './bookmarks_export';

export class OrganizerService {
    constructor(apiKey, categories, onProgress) {
        this.apiKey = apiKey;
        this.categories = categories;
        this.onProgress = onProgress || (() => { });
        this.batchSize = 10;
        this.isCancelled = false;
    }

    cancel() {
        this.isCancelled = true;
    }

    async start(fileBookmarks = null) {
        let allLinks = [];

        if (fileBookmarks) {
            this.onProgress({ status: 'info', message: '📂 Processing uploaded file...' });
            allLinks = fileBookmarks;
        } else {
            this.onProgress({ status: 'info', message: '📥 Reading bookmarks (Browser)...' });
            const tree = await getBookmarks();

            const traverse = (nodes) => {
                for (const node of nodes) {
                    if (node.url) {
                        if (node.url.startsWith('http')) {
                            allLinks.push({ title: node.title, url: node.url, id: node.id });
                        }
                    }
                    if (node.children) {
                        traverse(node.children);
                    }
                }
            };
            traverse(tree);
        }

        this.onProgress({ status: 'info', message: `Found ${allLinks.length} bookmarks.` });

        if (allLinks.length === 0) {
            this.onProgress({ status: 'done', message: 'No bookmarks to organize.' });
            return;
        }

        let rootFolder = null;
        if (!fileBookmarks) {
            this.onProgress({ status: 'info', message: '📁 Creating output directory...' });
            const rootId = '2'; // 'Other Bookmarks' usually
            rootFolder = await findOrCreateFolder(rootId, "AI Organized Bookmarks-" + new Date().toISOString().slice(0, 10));
        }

        const total = allLinks.length;
        let processed = 0;
        const finalResults = [];

        for (let i = 0; i < total; i += this.batchSize) {
            if (this.isCancelled) {
                this.onProgress({ status: 'warning', message: 'Process cancelled.' });
                break;
            }

            const batch = allLinks.slice(i, i + this.batchSize);
            this.onProgress({ status: 'processing', message: `Classifying batch ${Math.ceil((i + 1) / this.batchSize)}...`, percent: Math.round((processed / total) * 100) });

            try {
                const classified = await classifyBatch(batch, this.apiKey, this.categories);

                if (fileBookmarks) {
                    // Collect for export
                    finalResults.push(...classified);
                } else {
                    // Save to browser immediately
                    this.onProgress({ status: 'info', message: `Saving ${classified.length} bookmarks...` });
                    for (const item of classified) {
                        if (!item.category) item.category = "Uncategorized";

                        const catFolder = await findOrCreateFolder(rootFolder.id, item.category);
                        let targetParentId = catFolder.id;

                        if (item.sub_category) {
                            const subFolder = await findOrCreateFolder(catFolder.id, item.sub_category);
                            targetParentId = subFolder.id;
                        }

                        await createBookmark(targetParentId, item.title, item.url);
                    }
                }

                processed += batch.length;
                this.onProgress({ status: 'progress', percent: Math.round((processed / total) * 100) });

            } catch (err) {
                console.error(err);
                this.onProgress({ status: 'error', message: `Batch failed: ${err.message}` });
            }
        }

        if (fileBookmarks && !this.isCancelled) {
            this.onProgress({ status: 'info', message: '💾 Generating organized file...' });
            downloadBookmarks(finalResults);
        }

        this.onProgress({ status: 'done', message: '✅ Organization complete!' });
    }
}

