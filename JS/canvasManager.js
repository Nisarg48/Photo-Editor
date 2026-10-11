/**
 * Canvas Manager Module
 * Handles canvas operations, image loading, and pixel manipulation
 */

import { stateManager } from './stateManager.js';

class CanvasManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }

    initializeCanvas(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        stateManager.setCurrentCanvas(canvasElement);
        return this.canvas;
    }

    loadImageToCanvas(imageSource) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Set canvas size to match image
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                // Draw image to canvas
                this.ctx.drawImage(img, 0, 0);
                
                // Store original image
                stateManager.setOriginalImage(img);
                
                // Save initial state to history
                const initialDataUrl = this.canvas.toDataURL('image/png');
                stateManager.saveToHistory(initialDataUrl);
                
                resolve(img);
            };
            img.onerror = reject;
            img.src = imageSource;
        });
    }

    getCanvasData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    setCanvasData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resizeCanvas(width, height) {
        // Create temporary canvas to hold current image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Resize main canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Draw image back
        this.ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    getCanvasDataURL(format = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(format, quality);
    }

    getCanvasBlob(format = 'image/png', quality = 1.0) {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, format, quality);
        });
    }

    rotateCanvas(degrees) {
        const radians = degrees * (Math.PI / 180);
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        
        const newWidth = this.canvas.width * cos + this.canvas.height * sin;
        const newHeight = this.canvas.width * sin + this.canvas.height * cos;
        
        // Create temporary canvas
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        // Rotate and draw
        tempCtx.translate(newWidth / 2, newHeight / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
        
        // Update main canvas
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    flipCanvas(horizontal, vertical) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        tempCtx.save();
        tempCtx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
        tempCtx.drawImage(this.canvas, horizontal ? -this.canvas.width : 0, vertical ? -this.canvas.height : 0);
        tempCtx.restore();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    cropCanvas(x, y, width, height) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        tempCtx.drawImage(this.canvas, x, y, width, height, 0, 0, width, height);
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    resizeCanvasTo(newWidth, newHeight) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // Use better quality scaling
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    }

    applyPixelManipulation(pixelProcessor) {
        const imageData = this.getCanvasData();
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const result = pixelProcessor(data[i], data[i + 1], data[i + 2], data[i + 3]);
            data[i] = result.r;
            data[i + 1] = result.g;
            data[i + 2] = result.b;
            data[i + 3] = result.a;
        }
        
        this.setCanvasData(imageData);
    }

    applyConvolution(kernel) {
        const imageData = this.getCanvasData();
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const output = this.ctx.createImageData(width, height);
        const outputData = output.data;
        
        const side = Math.round(Math.sqrt(kernel.length));
        const halfSide = Math.floor(side / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let ky = 0; ky < side; ky++) {
                    for (let kx = 0; kx < side; kx++) {
                        const scy = y + ky - halfSide;
                        const scx = x + kx - halfSide;
                        
                        if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                            const srcOffset = (scy * width + scx) * 4;
                            const weight = kernel[ky * side + kx];
                            
                            r += data[srcOffset] * weight;
                            g += data[srcOffset + 1] * weight;
                            b += data[srcOffset + 2] * weight;
                        }
                    }
                }
                
                const dstOffset = (y * width + x) * 4;
                outputData[dstOffset] = r;
                outputData[dstOffset + 1] = g;
                outputData[dstOffset + 2] = b;
                outputData[dstOffset + 3] = data[(y * width + x) * 4 + 3];
            }
        }
        
        this.setCanvasData(output);
    }
}

export const canvasManager = new CanvasManager();
