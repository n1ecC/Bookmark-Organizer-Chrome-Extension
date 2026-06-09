import { useState, useRef, useEffect } from 'react'
import { Terminal, Play, AlertCircle, Plus, X, Bookmark, Upload, FileText } from 'lucide-react'
import { OrganizerService } from '../services/organizer'
import { parseBookmarks } from '../utils/parser'

export default function Organizer() {
    const [status, setStatus] = useState('idle') // idle, processing, complete, error
    const [logs, setLogs] = useState([])
    const [progress, setProgress] = useState(0)
    const [errorMsg, setErrorMsg] = useState('')

    // API Keys
    const [apiKey, setApiKey] = useState('') // OpenRouter

    // Model Selection
    const [selectedModel, setSelectedModel] = useState('google/gemini-3.5-flash')
    const models = [
        { id: 'google/gemini-2.0-flash', label: '2.0 Flash' },
        { id: 'google/gemini-2.5-flash', label: '2.5 Flash' },
        { id: 'google/gemini-3.0-flash', label: '3.0 Flash' },
        { id: 'google/gemini-3.5-flash', label: '3.5 Flash' }
    ]

    const [categories, setCategories] = useState([
        "Technology & Coding",
        "News & Research",
        "Entertainment & Media",
        "Shopping & Products",
        "Finance & Business",
        "Education & Reference",
        "Social & Community",
        "Lifestyle & Health",
        "Work & Productivity",
        "Design & Creative"
    ])
    const [newCategory, setNewCategory] = useState('')

    const logContainerRef = useRef(null)
    const organizerRef = useRef(null)

    // Load Settings from storage
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['apiKey', 'selectedModel'], (result) => {
                if (result.apiKey) setApiKey(result.apiKey)
                if (result.selectedModel) setSelectedModel(result.selectedModel)
            })
        }
    }, [])

    // Save Settings
    const updateSetting = (key, val) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: val })
        }
    }

    const handleApiKeyChange = (val) => {
        setApiKey(val)
        updateSetting('apiKey', val)
    }

    const handleModelChange = (modelId) => {
        setSelectedModel(modelId)
        updateSetting('selectedModel', modelId)
    }

    // File Upload Handlers
    const [uploadedFile, setUploadedFile] = useState(null)
    const [parsedBookmarks, setParsedBookmarks] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    }

    const processFile = (file) => {
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            setErrorMsg("Please upload a valid bookmarks HTML file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                const links = parseBookmarks(content);
                setUploadedFile(file);
                setParsedBookmarks(links);
                setErrorMsg('');
                setLogs(prev => [...prev, `📂 Loaded ${file.name} (${links.length} bookmarks found)`]);
            } catch (err) {
                console.error(err);
                setErrorMsg("Failed to parse bookmarks file.");
            }
        };
        reader.readAsText(file);
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }

    const handleDragOver = (e) => {
        e.preventDefault();
    }

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
    }, [logs])

    const resetApp = () => {
        setStatus('idle')
        setLogs([])
        setProgress(0)
        setErrorMsg('')
        setUploadedFile(null)
        setParsedBookmarks(null)
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const startProcess = async () => {
        if (!apiKey) {
            setErrorMsg(`Please enter your OpenRouter API Key.`)
            return
        }

        try {
            setStatus('processing')
            setLogs(['🚀 Starting AI Organization...'])
            setProgress(0)
            setErrorMsg('')

            organizerRef.current = new OrganizerService(
                apiKey,
                categories,
                (data) => {
                    if (data.status === 'info') {
                        setLogs(prev => [...prev, `ℹ️ ${data.message}`])
                    } else if (data.status === 'progress') {
                        setProgress(data.percent)
                    } else if (data.status === 'warning') {
                        setLogs(prev => [...prev, `⚠️ ${data.message}`])
                    } else if (data.status === 'error') {
                        setErrorMsg(data.message)
                        setStatus('error')
                    } else if (data.status === 'success') {
                        setLogs(prev => [...prev, `🎉 ${data.message}`])
                    } else if (data.status === 'done') {
                        setLogs(prev => [...prev, `✅ ${data.message}`])
                        setStatus('complete')
                        setProgress(100)
                    }
                },
                selectedModel
            )

            // Pass parsed bookmarks if file mode, otherwise null (browser mode)
            await organizerRef.current.start(parsedBookmarks)

        } catch (err) {
            console.error(err)
            setErrorMsg("Failed to start process.")
            setStatus('error')
        }
    }

    return (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'left' }}>

            {/* API Key Input */}
            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '500' }}>
                    OpenRouter API Key <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                    type="password"
                    placeholder="sk-or-..."
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#e2e8f0',
                        fontSize: '1rem',
                        outline: 'none',
                        marginBottom: '0.5rem'
                    }}
                />

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#10b981' }}>🔒</span>
                        <span>Your API key is stored locally in your browser.</span>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                    <p style={{ margin: 0, display: 'flex', gap: '0.5rem' }}>
                        <span>⚡</span>
                        <span>
                            Powered by <strong>Google Gemini</strong> via OpenRouter.
                            Choose your preferred model for optimal performance.
                        </span>
                    </p>
                </div>
            </div>

            {/* Model Selector */}
            {status === 'idle' && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '500' }}>
                        🎯 Select AI Model
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => handleModelChange(model.id)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: selectedModel === model.id ? 'linear-gradient(to right, #6366f1, #a855f7)' : 'transparent',
                                    color: selectedModel === model.id ? '#fff' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: selectedModel === model.id ? '600' : '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: selectedModel === model.id ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
                                }}
                            >
                                {model.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
                        ℹ️ 3.5 Flash offers best speed/accuracy balance. Use 2.0-3.0 for faster processing.
                    </div>
                </div>
            )}

            {/* Category Editor */}
            {status === 'idle' && (
                <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#e2e8f0', fontSize: '1.1rem' }}>Customize Categories</h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Add generic category..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newCategory.trim()) {
                                    setCategories([...categories, newCategory.trim()]);
                                    setNewCategory('');
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: '#e2e8f0',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={() => {
                                if (newCategory.trim()) {
                                    setCategories([...categories, newCategory.trim()]);
                                    setNewCategory('');
                                }
                            }}
                            className="btn-secondary"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                background: '#334155',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {categories.map((cat, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                color: '#94a3b8'
                            }}>
                                {cat}
                                <X
                                    size={14}
                                    style={{ cursor: 'pointer', color: '#ef4444' }}
                                    onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File Upload Area */}
            {status === 'idle' && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        border: '2px dashed #334155',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'center',
                        background: uploadedFile ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        borderColor: uploadedFile ? '#10b981' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".html,.htm"
                        style={{ display: 'none' }}
                    />

                    {uploadedFile ? (
                        <div>
                            <div style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <FileText size={24} />
                                <span style={{ fontWeight: 'bold' }}>{uploadedFile.name}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {parsedBookmarks ? `${parsedBookmarks.length} bookmarks ready` : 'Ready to process'}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); resetApp(); }}
                                style={{
                                    marginTop: '0.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Remove File
                            </button>
                        </div>
                    ) : (
                        <div>
                            <Upload size={24} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                            <div style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>
                                Drag & drop bookmarks.html here
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                or click to browse
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1rem' }}>
                                (Optional - defaults to browser's current bookmarks)
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                {status === 'complete' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '1rem', color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {uploadedFile ? "File Processed! Check your downloads." : 'All Done! Check your "AI Organized Bookmarks" folder.'}
                        </div>
                        <div
                            onClick={resetApp}
                            style={{
                                cursor: 'pointer',
                                color: '#38bdf8',
                                fontSize: '0.9rem',
                                border: '1px solid #1e293b',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.05)',
                                display: 'inline-block'
                            }}
                        >
                            ✨ Organize Again
                        </div>
                    </div>
                ) : (
                    <button
                        className="btn-primary"
                        onClick={startProcess}
                        disabled={!apiKey || status === 'processing'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: (!apiKey || status === 'processing') ? 0.5 : 1,
                            cursor: (!apiKey || status === 'processing') ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {status === 'processing' ? (
                            <>Processing... {progress}%</>
                        ) : (
                            <>
                                {uploadedFile ? <FileText size={20} /> : <Bookmark size={20} />}
                                {uploadedFile ? 'Organize File & Download' : 'Organize My Bookmarks'}
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={20} />
                    {errorMsg}
                </div>
            )}

            {/* Logs / Terminal */}
            <div
                className="glass-panel"
                style={{
                    background: '#020617',
                    border: '1px solid #1e293b',
                    height: '300px',
                    overflowY: 'auto',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: '#38bdf8'
                }}
                ref={logContainerRef}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', color: '#64748b' }}>
                    <Terminal size={16} />
                    <span>System Output</span>
                </div>

                {logs.length === 0 && <span style={{ color: '#475569' }}>Waiting for start...</span>}

                {logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: '#64748b', marginRight: '0.5rem' }}>{new Date().toLocaleTimeString()}</span>
                        {log}
                    </div>
                ))}
                {status === 'processing' && (
                    <div className="animate-pulse">_</div>
                )}
            </div>

        </div>
    )
}

