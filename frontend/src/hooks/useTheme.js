import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'themeMode'

function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}

// Resolve a mode ('dark' | 'light' | 'system') to an actual theme and apply it.
function applyTheme(mode) {
    const resolved = mode === 'system' ? getSystemTheme() : mode
    document.documentElement.setAttribute('data-theme', resolved)
    return resolved
}

/**
 * Theme controller. Returns the chosen mode, the resolved theme actually
 * shown, and a setter. Persists to chrome.storage (with localStorage fallback)
 * and reacts to OS changes while in "system" mode.
 */
export function useTheme() {
    const [theme, setThemeState] = useState('light')
    const [resolved, setResolved] = useState('light')

    // Initial load from storage
    useEffect(() => {
        const init = (saved) => {
            const mode = saved || 'light'
            setThemeState(mode)
            setResolved(applyTheme(mode))
        }
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([STORAGE_KEY], (r) => init(r[STORAGE_KEY]))
        } else {
            init(localStorage.getItem(STORAGE_KEY))
        }
    }, [])

    // Follow the OS when in "system" mode
    useEffect(() => {
        if (theme !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => setResolved(applyTheme('system'))
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme])

    const setTheme = useCallback((mode) => {
        setThemeState(mode)
        setResolved(applyTheme(mode))
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [STORAGE_KEY]: mode })
        } else {
            try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
        }
    }, [])

    return { theme, resolved, setTheme }
}
