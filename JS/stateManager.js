/**
 * State Manager Module
 * Centralized state management for the photo editor application
 */

export const initialState = {
    originalImage: null,
    currentCanvas: null,
    filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        exposure: 0,
        hue: 0,
        vibrance: 0,
        blur: 0
    },
    transformations: {
        rotate: 0,
        flipX: 1,
        flipY: 1
    },
    cropState: {
        active: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: 'free'
    },
    history: {
        stack: [],
        currentIndex: -1,
        maxHistory: 50
    },
    theme: 'dark'
};

class StateManager {
    constructor() {
        this.state = { ...initialState };
        this.listeners = [];
        this.loadThemeFromStorage();
        this.loadSettingsFromStorage();
    }

    getState() {
        return this.state;
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    getInitialState() {
        return { ...initialState };
    }

    resetState() {
        const currentCanvas = this.state.currentCanvas;
        const originalImage = this.state.originalImage;
        
        this.state = { 
            ...initialState, 
            currentCanvas,
            originalImage,
            theme: this.state.theme 
        };
        this.notifyListeners();
    }

    setOriginalImage(image) {
        this.state.originalImage = image;
        this.notifyListeners();
    }

    setCurrentCanvas(canvas) {
        this.state.currentCanvas = canvas;
        this.notifyListeners();
    }

    setFilter(filterName, value) {
        this.state.filters[filterName] = value;
        this.saveSettingsToStorage();
        this.notifyListeners();
    }

    resetFilters() {
        this.state.filters = { ...initialState.filters };
        this.notifyListeners();
    }

    setTransformation(transformName, value) {
        this.state.transformations[transformName] = value;
        this.saveSettingsToStorage();
        this.notifyListeners();
    }

    resetTransformations() {
        this.state.transformations = { ...initialState.transformations };
        this.notifyListeners();
    }

    setCropState(updates) {
        this.state.cropState = { ...this.state.cropState, ...updates };
        this.notifyListeners();
    }

    saveToHistory(canvasDataUrl) {
        const { stack, currentIndex, maxHistory } = this.state.history;
        
        // Remove any states after current index (if we're in middle of history)
        const newStack = stack.slice(0, currentIndex + 1);
        
        // Add new state
        newStack.push(canvasDataUrl);
        
        // Limit history size
        if (newStack.length > maxHistory) {
            newStack.shift();
        }
        
        this.state.history = {
            stack: newStack,
            currentIndex: newStack.length - 1,
            maxHistory
        };
        this.notifyListeners();
    }

    undo() {
        const { stack, currentIndex } = this.state.history;
        
        if (currentIndex > 0) {
            this.state.history.currentIndex = currentIndex - 1;
            this.notifyListeners();
            return this.state.history.stack[this.state.history.currentIndex];
        }
        return null;
    }

    redo() {
        const { stack, currentIndex } = this.state.history;
        
        if (currentIndex < stack.length - 1) {
            this.state.history.currentIndex = currentIndex + 1;
            this.notifyListeners();
            return this.state.history.stack[this.state.history.currentIndex];
        }
        return null;
    }

    canUndo() {
        return this.state.history.currentIndex > 0;
    }

    canRedo() {
        return this.state.history.currentIndex < this.state.history.stack.length - 1;
    }

    clearHistory() {
        this.state.history = { ...initialState.history };
        this.notifyListeners();
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.saveThemeToStorage();
        this.notifyListeners();
    }

    loadThemeFromStorage() {
        const savedTheme = localStorage.getItem('photoEditorTheme');
        if (savedTheme) {
            this.state.theme = savedTheme;
        }
    }

    saveThemeToStorage() {
        localStorage.setItem('photoEditorTheme', this.state.theme);
    }

    saveSettingsToStorage() {
        const settingsToSave = {
            filters: this.state.filters,
            transformations: this.state.transformations,
            theme: this.state.theme
        };
        localStorage.setItem('photoEditorSettings', JSON.stringify(settingsToSave));
    }

    loadSettingsFromStorage() {
        const savedSettings = localStorage.getItem('photoEditorSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.filters) {
                    this.state.filters = { ...this.state.filters, ...parsed.filters };
                }
                if (parsed.transformations) {
                    this.state.transformations = { ...this.state.transformations, ...parsed.transformations };
                }
                if (parsed.theme) {
                    this.state.theme = parsed.theme;
                }
                this.notifyListeners();
            } catch (error) {
                console.error('Failed to load settings from storage:', error);
            }
        }
    }

    clearSettingsFromStorage() {
        localStorage.removeItem('photoEditorSettings');
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

export const stateManager = new StateManager();
