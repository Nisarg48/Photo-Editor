/**
 * Watermark Manager Module
 * Handles text overlay and watermark functionality
 */

import { stateManager } from './stateManager.js';
import { canvasManager } from './canvasManager.js';

class WatermarkManager {
    constructor() {
        this.watermarks = [];
        this.activeWatermark = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.defaultSettings = {
            text: '© Your Name',
            font: 'Arial',
            size: 24,
            color: '#ffffff',
            opacity: 0.8,
            x: 50,
            y: 50,
            rotation: 0,
            shadow: true,
            shadowColor: '#000000',
            shadowBlur: 4
        };
    }

    addWatermark(settings = {}) {
        const watermark = {
            id: Date.now(),
            ...this.defaultSettings,
            ...settings
        };
        
        this.watermarks.push(watermark);
        this.activeWatermark = watermark;
        this.renderWatermarks();
        return watermark;
    }

    removeWatermark(id) {
        this.watermarks = this.watermarks.filter(w => w.id !== id);
        if (this.activeWatermark && this.activeWatermark.id === id) {
            this.activeWatermark = null;
        }
        this.renderWatermarks();
    }

    updateWatermark(id, updates) {
        const watermark = this.watermarks.find(w => w.id === id);
        if (watermark) {
            Object.assign(watermark, updates);
            this.renderWatermarks();
        }
    }

    setActiveWatermark(id) {
        this.activeWatermark = this.watermarks.find(w => w.id === id);
    }

    renderWatermarks() {
        const state = stateManager.getState();
        if (!state.currentCanvas) return;

        const canvas = state.currentCanvas;
        const ctx = canvas.getContext('2d');

        // Re-render the current canvas state (this should be improved to not lose current edits)
        // For now, we'll assume watermarks are rendered on top of the current canvas state
        
        this.watermarks.forEach(watermark => {
            ctx.save();
            
            // Set font properties
            ctx.font = `${watermark.size}px ${watermark.font}`;
            ctx.fillStyle = watermark.color;
            ctx.globalAlpha = watermark.opacity;
            
            // Apply shadow if enabled
            if (watermark.shadow) {
                ctx.shadowColor = watermark.shadowColor;
                ctx.shadowBlur = watermark.shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            // Apply rotation
            ctx.translate(watermark.x, watermark.y);
            ctx.rotate(watermark.rotation * Math.PI / 180);
            ctx.translate(-watermark.x, -watermark.y);
            
            // Draw text
            ctx.fillText(watermark.text, watermark.x, watermark.y);
            
            ctx.restore();
        });
    }

    getTextMetrics(watermark) {
        const state = stateManager.getState();
        if (!state.currentCanvas) return { width: 0, height: 0 };

        const canvas = state.currentCanvas;
        const ctx = canvas.getContext('2d');
        
        ctx.font = `${watermark.size}px ${watermark.font}`;
        const metrics = ctx.measureText(watermark.text);
        
        return {
            width: metrics.width,
            height: watermark.size
        };
    }

    startDrag(e, watermarkId) {
        const watermark = this.watermarks.find(w => w.id === watermarkId);
        if (!watermark) return;

        this.isDragging = true;
        this.activeWatermark = watermark;
        this.dragOffset = {
            x: e.clientX - watermark.x,
            y: e.clientY - watermark.y
        };
    }

    handleDrag(e) {
        if (!this.isDragging || !this.activeWatermark) return;

        const state = stateManager.getState();
        if (!state.currentCanvas) return;

        const canvas = state.currentCanvas;
        const canvasRect = canvas.getBoundingClientRect();
        
        // Convert screen coordinates to canvas coordinates
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        
        const newX = (e.clientX - canvasRect.left) * scaleX;
        const newY = (e.clientY - canvasRect.top) * scaleY;
        
        this.updateWatermark(this.activeWatermark.id, {
            x: newX - this.dragOffset.x * scaleX,
            y: newY - this.dragOffset.y * scaleY
        });
    }

    endDrag() {
        this.isDragging = false;
    }

    clearAllWatermarks() {
        this.watermarks = [];
        this.activeWatermark = null;
        this.renderWatermarks();
    }

    getWatermarks() {
        return [...this.watermarks];
    }

    loadWatermarks(watermarks) {
        this.watermarks = watermarks;
        this.renderWatermarks();
    }

    exportWatermarks() {
        return JSON.stringify(this.watermarks);
    }

    importWatermarks(jsonString) {
        try {
            const watermarks = JSON.parse(jsonString);
            this.watermarks = watermarks;
            this.renderWatermarks();
            return true;
        } catch (error) {
            console.error('Failed to import watermarks:', error);
            return false;
        }
    }
}

export const watermarkManager = new WatermarkManager();
