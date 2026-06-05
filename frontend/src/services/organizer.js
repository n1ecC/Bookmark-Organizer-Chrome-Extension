import { getBookmarks, flattenBookmarks, createBookmark, findOrCreateFolder } from './bookmarks';
import { classifyBatch } from './ai';
import { downloadBookmarks } from './bookmarks_export';

export class OrganizerService {
    constructor(apiKey, categories, onProgress) {
        this.apiKey = apiKey;
        this.categories = categories;
        this.onProgress = onProgress || (() => { });
        this.batchSize = 35;
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

        // Group into batches
        const batches = [];
        for (let i = 0; i < total; i += this.batchSize) {
            batches.push({
                index: batches.length,
                batchData: allLinks.slice(i, i + this.batchSize)
            });
        }

        const results = new Array(batches.length);
        let batchIdx = 0;

        const processNext = async () => {
            if (batchIdx >= batches.length || this.isCancelled) return;
            const currentIdx = batchIdx++;
            const { index, batchData } = batches[currentIdx];

            this.onProgress({
                status: 'processing',
                message: `Classifying batch ${currentIdx + 1}/${batches.length}...`,
                percent: Math.round((processed / total) * 100)
            });

            try {
                const classified = await classifyBatch(batchData, this.apiKey, this.categories);

                if (fileBookmarks) {
                    results[index] = classified;
                } else {
                    // Browser mode: Save immediately
                    this.onProgress({ status: 'info', message: `Saving ${classified.length} bookmarks...` });
                    for (const item of classified) {
                        if (this.isCancelled) break;
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

                processed += batchData.length;
                this.onProgress({ status: 'progress', percent: Math.min(100, Math.round((processed / total) * 100)) });

            } catch (err) {
                console.error(`Batch ${currentIdx + 1} failed:`, err);
                this.onProgress({ status: 'error', message: `Batch ${currentIdx + 1} failed: ${err.message}` });
            }

            await processNext();
        };

        // Run batches concurrently (limit to 3 concurrent requests to prevent rate limit issues)
        const concurrencyLimit = 3;
        const workers = [];
        for (let w = 0; w < Math.min(concurrencyLimit, batches.length); w++) {
            workers.push(processNext());
        }
        await Promise.all(workers);

        if (fileBookmarks && !this.isCancelled) {
            this.onProgress({ status: 'info', message: '💾 Generating organized file...' });
            const finalResults = results.flat().filter(Boolean);
            downloadBookmarks(finalResults);
        }

        if (this.isCancelled) {
            this.onProgress({ status: 'warning', message: 'Process cancelled.' });
        } else {
            this.onProgress({ status: 'done', message: '✅ Organization complete!' });
        }
    }
}

