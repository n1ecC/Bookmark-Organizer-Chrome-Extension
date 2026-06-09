import { getBookmarks, flattenBookmarks, createBookmark, findOrCreateFolder, clearFolderCache, shouldCreateSubFolder } from './bookmarks';
import { generateSchema, classifyBatch } from './ai';
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

        // --- Phase 1: Generate Schema ---
        this.onProgress({ status: 'info', message: '🧠 Analyzing bookmarks to generate a clean, non-redundant folder structure...' });
        
        let schema;
        try {
            schema = await generateSchema(allLinks, this.apiKey, this.categories);
            this.onProgress({ status: 'info', message: '✨ Generated category schema:' });
            if (schema && schema.categories) {
                schema.categories.forEach(cat => {
                    const subCats = cat.sub_categories && cat.sub_categories.length > 0 
                        ? ` (${cat.sub_categories.join(', ')})` 
                        : '';
                    this.onProgress({ status: 'info', message: `  • ${cat.name}${subCats}` });
                });
            }
        } catch (err) {
            console.error('Schema generation failed, falling back to basic categories:', err);
            this.onProgress({ status: 'warning', message: '⚠️ Schema generation failed. Using default categories.' });
            schema = {
                categories: this.categories.map(c => ({ name: c, sub_categories: [] }))
            };
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
                const classified = await classifyBatch(batchData, this.apiKey, schema);

                // Accumulate results
                results[index] = classified;
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

        if (this.isCancelled) {
            this.onProgress({ status: 'warning', message: 'Process cancelled.' });
            return;
        }

        const finalResults = results.flat().filter(Boolean);

        if (fileBookmarks) {
            this.onProgress({ status: 'info', message: '💾 Generating organized file...' });
            downloadBookmarks(finalResults);
        } else {
            // Browser mode: Save all sequentially at the end
            this.onProgress({ status: 'info', message: `💾 Saving ${finalResults.length} bookmarks to browser...` });
            
            // Clean up the folder cache before starting the write operation
            clearFolderCache();

            // To avoid duplicate folder creation and empty folders:
            const createdFolders = {}; // path key -> folder Object

            for (const item of finalResults) {
                if (this.isCancelled) break;
                
                const category = item.category || "Uncategorized";
                
                // Find or create category folder
                let catFolder;
                if (createdFolders[category]) {
                    catFolder = createdFolders[category];
                } else {
                    catFolder = await findOrCreateFolder(rootFolder.id, category);
                    createdFolders[category] = catFolder;
                }
                
                let targetParentId = catFolder.id;
                
                const subCategory = item.sub_category;
                if (shouldCreateSubFolder(category, subCategory)) {
                    const subPath = `${category}/${subCategory}`;
                    let subFolder;
                    if (createdFolders[subPath]) {
                        subFolder = createdFolders[subPath];
                    } else {
                        subFolder = await findOrCreateFolder(catFolder.id, subCategory);
                        createdFolders[subPath] = subFolder;
                    }
                    targetParentId = subFolder.id;
                }
                
                await createBookmark(targetParentId, item.title, item.url);
            }
        }

        if (this.isCancelled) {
            this.onProgress({ status: 'warning', message: 'Process cancelled.' });
        } else {
            this.onProgress({ status: 'done', message: '✅ Organization complete!' });
        }
    }
}

