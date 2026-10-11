/**
 * Auto-Enhance Manager Module
 * Algorithm-based automatic image enhancement (no AI/cloud)
 */

import { canvasManager } from './canvasManager.js';
import { stateManager } from './stateManager.js';

class AutoEnhanceManager {
    constructor() {
        this.defaultSettings = {
            autoExposure: true,
            autoWhiteBalance: true,
            autoContrast: true,
            autoSaturation: true
        };
    }

    analyzeHistogram(imageData) {
        const data = imageData.data;
        const histogram = {
            r: new Array(256).fill(0),
            g: new Array(256).fill(0),
            b: new Array(256).fill(0),
            luminance: new Array(256).fill(0)
        };

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            histogram.r[r]++;
            histogram.g[g]++;
            histogram.b[b]++;
            
            // Calculate luminance using standard formula
            const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            histogram.luminance[luminance]++;
        }

        return histogram;
    }

    calculateOptimalExposure(histogram) {
        const totalPixels = histogram.luminance.reduce((a, b) => a + b, 0);
        const meanLuminance = histogram.luminance.reduce((sum, count, index) => sum + index * count, 0) / totalPixels;
        
        // Target mean luminance is around 128 (middle of 0-255 range)
        const targetLuminance = 128;
        const exposureAdjustment = (targetLuminance - meanLuminance) / 128 * 50;
        
        return Math.max(-50, Math.min(50, exposureAdjustment));
    }

    calculateAutoWhiteBalance(imageData) {
        const data = imageData.data;
        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;

        // Sample pixels for gray world assumption
        for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skip very dark or very bright pixels
            if (r > 20 && r < 235 && g > 20 && g < 235 && b > 20 && b < 235) {
                rSum += r;
                gSum += g;
                bSum += b;
                count++;
            }
        }

        if (count === 0) return { r: 0, g: 0, b: 0 };

        const avgR = rSum / count;
        const avgG = gSum / count;
        const avgB = bSum / count;
        const avgGray = (avgR + avgG + avgB) / 3;

        // Calculate color balance adjustments
        return {
            r: (avgGray / avgR - 1) * 30,
            g: (avgGray / avgG - 1) * 30,
            b: (avgGray / avgB - 1) * 30
        };
    }

    calculateAutoContrast(histogram) {
        const luminanceHistogram = histogram.luminance;
        const totalPixels = luminanceHistogram.reduce((a, b) => a + b, 0);
        
        // Find 5th and 95th percentiles
        let cumulative = 0;
        let p5 = 0, p95 = 255;
        
        for (let i = 0; i < 256; i++) {
            cumulative += luminanceHistogram[i];
            if (p5 === 0 && cumulative >= totalPixels * 0.05) p5 = i;
            if (p95 === 255 && cumulative >= totalPixels * 0.95) p95 = i;
        }

        // Calculate contrast adjustment
        const currentRange = p95 - p5;
        const targetRange = 200; // Target range for good contrast
        const contrastAdjustment = ((targetRange / currentRange) - 1) * 100;
        
        return Math.max(-50, Math.min(50, contrastAdjustment));
    }

    calculateAutoSaturation(imageData) {
        const data = imageData.data;
        let totalSaturation = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to HSL
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (delta === 0) continue;
            
            const lightness = (max + min) / 2;
            let saturation = 0;
            
            if (lightness <= 127) {
                saturation = (delta / (max + min)) * 100;
            } else {
                saturation = (delta / (510 - max - min)) * 100;
            }
            
            totalSaturation += saturation;
            count++;
        }

        if (count === 0) return 0;

        const avgSaturation = totalSaturation / count;
        const targetSaturation = 45; // Target average saturation
        const saturationAdjustment = (targetSaturation - avgSaturation) * 1.5;
        
        return Math.max(-30, Math.min(30, saturationAdjustment));
    }

    applyAutoEnhance() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            console.error('No canvas to enhance');
            return false;
        }

        const imageData = canvasManager.getCanvasData();
        const histogram = this.analyzeHistogram(imageData);

        // Calculate optimal adjustments
        const exposureAdjustment = this.calculateOptimalExposure(histogram);
        const whiteBalance = this.calculateAutoWhiteBalance(imageData);
        const contrastAdjustment = this.calculateAutoContrast(histogram);
        const saturationAdjustment = this.calculateAutoSaturation(imageData);

        // Apply adjustments to the image data
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Apply exposure adjustment
            if (exposureAdjustment !== 0) {
                const exposureFactor = Math.pow(2, exposureAdjustment / 100);
                r = Math.min(255, Math.max(0, r * exposureFactor));
                g = Math.min(255, Math.max(0, g * exposureFactor));
                b = Math.min(255, Math.max(0, b * exposureFactor));
            }

            // Apply white balance
            if (whiteBalance.r !== 0 || whiteBalance.g !== 0 || whiteBalance.b !== 0) {
                r = Math.min(255, Math.max(0, r * (1 + whiteBalance.r / 100)));
                g = Math.min(255, Math.max(0, g * (1 + whiteBalance.g / 100)));
                b = Math.min(255, Math.max(0, b * (1 + whiteBalance.b / 100)));
            }

            // Apply contrast adjustment
            if (contrastAdjustment !== 0) {
                const factor = (259 * (contrastAdjustment + 255)) / (255 * (259 - contrastAdjustment));
                r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }

            // Apply saturation adjustment
            if (saturationAdjustment !== 0) {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                const saturationFactor = 1 + saturationAdjustment / 100;
                r = Math.min(255, Math.max(0, gray + saturationFactor * (r - gray)));
                g = Math.min(255, Math.max(0, gray + saturationFactor * (g - gray)));
                b = Math.min(255, Math.max(0, gray + saturationFactor * (b - gray)));
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        canvasManager.setCanvasData(imageData);
        
        return {
            exposure: exposureAdjustment,
            whiteBalance,
            contrast: contrastAdjustment,
            saturation: saturationAdjustment
        };
    }

    getEnhancementPreview() {
        const state = stateManager.getState();
        if (!state.currentCanvas) return null;

        const imageData = canvasManager.getCanvasData();
        const histogram = this.analyzeHistogram(imageData);

        return {
            exposure: this.calculateOptimalExposure(histogram),
            whiteBalance: this.calculateAutoWhiteBalance(imageData),
            contrast: this.calculateAutoContrast(histogram),
            saturation: this.calculateAutoSaturation(imageData)
        };
    }
}

export const autoEnhanceManager = new AutoEnhanceManager();
