/**
 * Crop Manager Module
 * Handles interactive crop functionality with draggable and resizable overlay
 */

import { stateManager } from './stateManager.js';
import { canvasManager } from './canvasManager.js';

class CropManager {
    constructor() {
        this.overlay = null;
        this.cropBox = null;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.initialCropState = null;
        this.aspectRatios = {
            'free': null,
            '1:1': 1,
            '4:3': 4/3,
            '16:9': 16/9,
            '3:2': 3/2,
            '5:4': 5/4
        };
    }

    initCropOverlay(canvasElement, containerElement) {
        // Store references
        this.canvasElement = canvasElement;
        this.containerElement = containerElement;
        
        // Ensure container has position relative for absolute positioning
        containerElement.style.position = 'relative';
        
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'crop-overlay';
        this.overlay.style.display = 'none';
        
        // Create crop box
        this.cropBox = document.createElement('div');
        this.cropBox.className = 'crop-box';
        
        // Create resize handles
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${position}`;
            handle.dataset.handle = position;
            this.cropBox.appendChild(handle);
        });
        
        // Create grid overlay (rule of thirds)
        const grid = document.createElement('div');
        grid.className = 'crop-grid';
        this.cropBox.appendChild(grid);
        
        this.overlay.appendChild(this.cropBox);
        containerElement.appendChild(this.overlay);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Add window resize handler
        window.addEventListener('resize', () => this.handleWindowResize());
    }

    setupEventListeners() {
        // Crop box dragging
        this.cropBox.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) return;
            this.startDrag(e);
        });

        // Resize handles
        this.cropBox.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.startResize(e, handle.dataset.handle);
            });
        });

        // Global mouse events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }

    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialCropState = this.getCropBoxState();
        e.preventDefault();
    }

    startResize(e, handle) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialCropState = this.getCropBoxState();
        e.preventDefault();
        e.stopPropagation();
    }

    handleMouseMove(e) {
        if (!this.isDragging && !this.isResizing) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        const state = stateManager.getState();
        const canvas = state.currentCanvas;
        
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = this.containerElement.getBoundingClientRect();
        
        // Calculate scale factors
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        if (this.isDragging) {
            this.handleDrag(dx, dy, scaleX, scaleY);
        } else if (this.isResizing) {
            this.handleResize(dx, dy, scaleX, scaleY);
        }
    }

    handleDrag(dx, dy, scaleX, scaleY) {
        const state = stateManager.getState();
        const canvasRect = state.currentCanvas.getBoundingClientRect();
        const containerRect = this.containerElement.getBoundingClientRect();
        
        // Calculate new position in canvas coordinates
        const newX = this.initialCropState.x + dx * scaleX;
        const newY = this.initialCropState.y + dy * scaleY;
        
        // Constrain to canvas bounds
        const maxNewX = state.currentCanvas.width - this.initialCropState.width;
        const maxNewY = state.currentCanvas.height - this.initialCropState.height;
        
        const constrainedX = Math.max(0, Math.min(maxNewX, newX));
        const constrainedY = Math.max(0, Math.min(maxNewY, newY));
        
        this.updateCropBox(constrainedX, constrainedY, this.initialCropState.width, this.initialCropState.height);
    }

    handleResize(dx, dy, scaleX, scaleY) {
        const state = stateManager.getState();
        const current = this.initialCropState;
        let newX = current.x;
        let newY = current.y;
        let newWidth = current.width;
        let newHeight = current.height;

        const aspectRatio = state.cropState.aspectRatio;
        const ratio = this.aspectRatios[aspectRatio];

        switch (this.resizeHandle) {
            case 'se':
                newWidth = current.width + dx * scaleX;
                newHeight = ratio ? newWidth / ratio : current.height + dy * scaleY;
                break;
            case 'sw':
                newX = current.x + dx * scaleX;
                newWidth = current.width - dx * scaleX;
                newHeight = ratio ? newWidth / ratio : current.height + dy * scaleY;
                break;
            case 'ne':
                newY = current.y + dy * scaleY;
                newWidth = current.width + dx * scaleX;
                newHeight = ratio ? newWidth / ratio : current.height - dy * scaleY;
                break;
            case 'nw':
                newX = current.x + dx * scaleX;
                newY = current.y + dy * scaleY;
                newWidth = current.width - dx * scaleX;
                newHeight = ratio ? newWidth / ratio : current.height - dy * scaleY;
                break;
            case 'n':
                newY = current.y + dy * scaleY;
                newHeight = current.height - dy * scaleY;
                if (ratio) newWidth = newHeight * ratio;
                break;
            case 's':
                newHeight = current.height + dy * scaleY;
                if (ratio) newWidth = newHeight * ratio;
                break;
            case 'e':
                newWidth = current.width + dx * scaleX;
                if (ratio) newHeight = newWidth / ratio;
                break;
            case 'w':
                newX = current.x + dx * scaleX;
                newWidth = current.width - dx * scaleX;
                if (ratio) newHeight = newWidth / ratio;
                break;
        }

        // Ensure minimum size
        const minSize = 20;
        if (newWidth < minSize || newHeight < minSize) return;

        // Constrain to canvas bounds
        if (newX < 0) {
            newWidth += newX;
            newX = 0;
        }
        if (newY < 0) {
            newHeight += newY;
            newY = 0;
        }
        if (newX + newWidth > state.currentCanvas.width) {
            newWidth = state.currentCanvas.width - newX;
        }
        if (newY + newHeight > state.currentCanvas.height) {
            newHeight = state.currentCanvas.height - newY;
        }

        this.updateCropBox(newX, newY, newWidth, newHeight);
    }

    handleMouseUp() {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.resizeHandle = null;
            
            // Update state
            const cropState = this.getCropBoxState();
            stateManager.setCropState(cropState);
        }
    }

    getCropBoxState() {
        const state = stateManager.getState();
        const canvas = state.currentCanvas;
        if (!canvas || !this.cropBox) return { x: 0, y: 0, width: 0, height: 0 };

        const canvasRect = canvas.getBoundingClientRect();
        const boxRect = this.cropBox.getBoundingClientRect();
        const containerRect = this.containerElement.getBoundingClientRect();
        
        // Calculate position relative to canvas
        const containerCanvasLeft = canvasRect.left - containerRect.left;
        const containerCanvasTop = canvasRect.top - containerRect.top;
        
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        return {
            x: (boxRect.left - containerRect.left - containerCanvasLeft) * scaleX,
            y: (boxRect.top - containerRect.top - containerCanvasTop) * scaleY,
            width: boxRect.width * scaleX,
            height: boxRect.height * scaleY
        };
    }

    updateCropBox(x, y, width, height) {
        const state = stateManager.getState();
        const canvas = state.currentCanvas;
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = this.containerElement.getBoundingClientRect();
        
        // Calculate position relative to container
        const containerCanvasLeft = canvasRect.left - containerRect.left;
        const containerCanvasTop = canvasRect.top - containerRect.top;
        
        const scaleX = canvasRect.width / canvas.width;
        const scaleY = canvasRect.height / canvas.height;

        this.cropBox.style.left = `${containerCanvasLeft + x * scaleX}px`;
        this.cropBox.style.top = `${containerCanvasTop + y * scaleY}px`;
        this.cropBox.style.width = `${width * scaleX}px`;
        this.cropBox.style.height = `${height * scaleY}px`;
    }

    showCropOverlay() {
        const state = stateManager.getState();
        if (!state.currentCanvas) return;

        const canvas = state.currentCanvas;
        const canvasContainer = canvas.parentElement;
        
        if (!canvasContainer) return;

        // Position overlay relative to canvas container
        this.overlay.style.position = 'absolute';
        this.overlay.style.left = '0';
        this.overlay.style.top = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.display = 'block';

        // Initialize crop box to cover full canvas
        this.updateCropBox(0, 0, canvas.width, canvas.height);
        
        stateManager.setCropState({ active: true });
    }

    hideCropOverlay() {
        this.overlay.style.display = 'none';
        stateManager.setCropState({ active: false });
    }

    executeCrop() {
        const cropState = this.getCropBoxState();
        
        if (cropState.width > 0 && cropState.height > 0) {
            canvasManager.cropCanvas(cropState.x, cropState.y, cropState.width, cropState.height);
            this.hideCropOverlay();
            
            // Save to history
            const newDataUrl = canvasManager.getCanvasDataURL();
            stateManager.saveToHistory(newDataUrl);
            
            return true;
        }
        return false;
    }

    setAspectRatio(ratio) {
        const state = stateManager.getState();
        stateManager.setCropState({ aspectRatio: ratio });
        
        // Update crop box to match aspect ratio
        const current = this.getCropBoxState();
        if (current.width > 0 && current.height > 0) {
            const targetRatio = this.aspectRatios[ratio];
            if (targetRatio) {
                let newWidth = current.width;
                let newHeight = current.width / targetRatio;
                
                if (newHeight > state.currentCanvas.height) {
                    newHeight = state.currentCanvas.height;
                    newWidth = newHeight * targetRatio;
                }
                
                this.updateCropBox(current.x, current.y, newWidth, newHeight);
            }
        }
    }

    cancelCrop() {
        this.hideCropOverlay();
    }

    handleWindowResize() {
        const state = stateManager.getState();
        if (state.cropState.active && state.currentCanvas) {
            // Re-calculate crop box position on resize
            const cropState = this.getCropBoxState();
            if (cropState.width > 0 && cropState.height > 0) {
                this.updateCropBox(cropState.x, cropState.y, cropState.width, cropState.height);
            }
        }
    }
}

export const cropManager = new CropManager();
