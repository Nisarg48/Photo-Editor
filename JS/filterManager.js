/**
 * Filter Manager Module
 * Handles filter application using canvas pixel manipulation
 */

import { stateManager } from './stateManager.js';
import { canvasManager } from './canvasManager.js';

class FilterManager {
    constructor() {
        this.filterDefaults = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            exposure: 0,
            hue: 0,
            vibrance: 0,
            blur: 0
        };
    }

    applyFilters() {
        const state = stateManager.getState();
        const filters = state.filters;
        
        // First apply blur (convolution) as it affects spatial data
        if (filters.blur !== this.filterDefaults.blur) {
            this.applyBlur(filters.blur);
        }
        
        // Then apply all color adjustments in a single pass for efficiency
        const hasColorAdjustments = 
            filters.brightness !== this.filterDefaults.brightness ||
            filters.contrast !== this.filterDefaults.contrast ||
            filters.saturation !== this.filterDefaults.saturation ||
            filters.exposure !== this.filterDefaults.exposure ||
            filters.hue !== this.filterDefaults.hue ||
            filters.vibrance !== this.filterDefaults.vibrance;
        
        if (hasColorAdjustments) {
            this.applyCombinedColorFilters(filters);
        }
    }

    applyCombinedColorFilters(filters) {
        const brightnessFactor = filters.brightness / 100;
        const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
        const saturationFactor = filters.saturation / 100;
        const exposureFactor = Math.pow(2, filters.exposure / 100);
        const hueAngle = filters.hue * (Math.PI / 180);
        const vibranceFactor = filters.vibrance / 100;
        
        const cosHue = Math.cos(hueAngle);
        const sinHue = Math.sin(hueAngle);
        
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Apply exposure first
            r = Math.min(255, Math.max(0, r * exposureFactor));
            g = Math.min(255, Math.max(0, g * exposureFactor));
            b = Math.min(255, Math.max(0, b * exposureFactor));
            
            // Apply brightness
            r = Math.min(255, Math.max(0, r * brightnessFactor));
            g = Math.min(255, Math.max(0, g * brightnessFactor));
            b = Math.min(255, Math.max(0, b * brightnessFactor));
            
            // Apply contrast
            r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
            g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
            b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
            
            // Apply saturation
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            r = Math.min(255, Math.max(0, gray + saturationFactor * (r - gray)));
            g = Math.min(255, Math.max(0, gray + saturationFactor * (g - gray)));
            b = Math.min(255, Math.max(0, gray + saturationFactor * (b - gray)));
            
            // Apply vibrance
            const max = Math.max(r, g, b);
            const avg = (r + g + b) / 3;
            const amt = ((Math.abs(max - avg) * 2 / 255) * vibranceFactor) / 100;
            r = Math.min(255, Math.max(0, r + (r - avg) * amt));
            g = Math.min(255, Math.max(0, g + (g - avg) * amt));
            b = Math.min(255, Math.max(0, b + (b - avg) * amt));
            
            // Apply hue rotation
            const hueMatrix = [
                0.213 + cosHue * 0.787 - sinHue * 0.213,
                0.715 - cosHue * 0.715 - sinHue * 0.715,
                0.072 - cosHue * 0.072 + sinHue * 0.928,
                0.213 - cosHue * 0.213 + sinHue * 0.143,
                0.715 + cosHue * 0.285 + sinHue * 0.140,
                0.072 - cosHue * 0.072 - sinHue * 0.283,
                0.213 - cosHue * 0.213 - sinHue * 0.787,
                0.715 - cosHue * 0.715 + sinHue * 0.715,
                0.072 + cosHue * 0.928 + sinHue * 0.072
            ];
            
            const newR = Math.min(255, Math.max(0, r * hueMatrix[0] + g * hueMatrix[1] + b * hueMatrix[2]));
            const newG = Math.min(255, Math.max(0, r * hueMatrix[3] + g * hueMatrix[4] + b * hueMatrix[5]));
            const newB = Math.min(255, Math.max(0, r * hueMatrix[6] + g * hueMatrix[7] + b * hueMatrix[8]));
            
            return { r: newR, g: newG, b: newB, a };
        });
    }

    applyBrightness(value) {
        const factor = value / 100;
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            return {
                r: Math.min(255, Math.max(0, r * factor)),
                g: Math.min(255, Math.max(0, g * factor)),
                b: Math.min(255, Math.max(0, b * factor)),
                a
            };
        });
    }

    applyContrast(value) {
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            return {
                r: Math.min(255, Math.max(0, factor * (r - 128) + 128)),
                g: Math.min(255, Math.max(0, factor * (g - 128) + 128)),
                b: Math.min(255, Math.max(0, factor * (b - 128) + 128)),
                a
            };
        });
    }

    applySaturation(value) {
        const factor = value / 100;
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            return {
                r: Math.min(255, Math.max(0, gray + factor * (r - gray))),
                g: Math.min(255, Math.max(0, gray + factor * (g - gray))),
                b: Math.min(255, Math.max(0, gray + factor * (b - gray))),
                a
            };
        });
    }

    applyExposure(value) {
        const factor = Math.pow(2, value / 100);
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            return {
                r: Math.min(255, Math.max(0, r * factor)),
                g: Math.min(255, Math.max(0, g * factor)),
                b: Math.min(255, Math.max(0, b * factor)),
                a
            };
        });
    }

    applyHue(value) {
        const angle = value * (Math.PI / 180);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Convert to HSL-like space, rotate hue, convert back
            const matrix = [
                0.213 + cos * 0.787 - sin * 0.213,
                0.715 - cos * 0.715 - sin * 0.715,
                0.072 - cos * 0.072 + sin * 0.928,
                0.213 - cos * 0.213 + sin * 0.143,
                0.715 + cos * 0.285 + sin * 0.140,
                0.072 - cos * 0.072 - sin * 0.283,
                0.213 - cos * 0.213 - sin * 0.787,
                0.715 - cos * 0.715 + sin * 0.715,
                0.072 + cos * 0.928 + sin * 0.072
            ];
            
            return {
                r: Math.min(255, Math.max(0, r * matrix[0] + g * matrix[1] + b * matrix[2])),
                g: Math.min(255, Math.max(0, r * matrix[3] + g * matrix[4] + b * matrix[5])),
                b: Math.min(255, Math.max(0, r * matrix[6] + g * matrix[7] + b * matrix[8])),
                a
            };
        });
    }

    applyVibrance(value) {
        const factor = value / 100;
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            const max = Math.max(r, g, b);
            const avg = (r + g + b) / 3;
            const amt = ((Math.abs(max - avg) * 2 / 255) * factor) / 100;
            
            return {
                r: Math.min(255, Math.max(0, r + (r - avg) * amt)),
                g: Math.min(255, Math.max(0, g + (g - avg) * amt)),
                b: Math.min(255, Math.max(0, b + (b - avg) * amt)),
                a
            };
        });
    }

    applyBlur(value) {
        if (value <= 0) return;
        
        // Simple box blur for performance
        const radius = Math.floor(value / 2);
        if (radius === 0) return;
        
        const kernel = [];
        const size = radius * 2 + 1;
        const total = size * size;
        
        for (let i = 0; i < total; i++) {
            kernel.push(1 / total);
        }
        
        canvasManager.applyConvolution(kernel);
    }

    // Preset Filters
    applyPresetFilter(filterName) {
        switch (filterName) {
            case 'grayscale':
                this.applyGrayscale();
                break;
            case 'sepia':
                this.applySepia();
                break;
            case 'invert':
                this.applyInvert();
                break;
            case 'sharpen':
                this.applySharpen();
                break;
            case 'vintage':
                this.applyVintage();
                break;
            case 'noir':
                this.applyNoir();
                break;
            case 'portrait':
                this.applyPortrait();
                break;
            case 'hdr':
                this.applyHDR();
                break;
            default:
                console.warn(`Unknown preset filter: ${filterName}`);
        }
    }

    applyGrayscale() {
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            return { r: gray, g: gray, b: gray, a };
        });
    }

    applySepia() {
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            return {
                r: Math.min(255, r * 0.393 + g * 0.769 + b * 0.189),
                g: Math.min(255, r * 0.349 + g * 0.686 + b * 0.168),
                b: Math.min(255, r * 0.272 + g * 0.534 + b * 0.131),
                a
            };
        });
    }

    applyInvert() {
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            return {
                r: 255 - r,
                g: 255 - g,
                b: 255 - b,
                a
            };
        });
    }

    applySharpen() {
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        canvasManager.applyConvolution(kernel);
    }

    applyVintage() {
        // Vintage: film grain + warm color grading + vignette
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Warm color grading
            const newR = Math.min(255, r * 1.1 + g * 0.1);
            const newG = Math.min(255, r * 0.05 + g * 0.95 + b * 0.05);
            const newB = Math.min(255, b * 0.9);
            
            // Add slight sepia tone
            const sepiaR = Math.min(255, newR * 0.393 + newG * 0.769 + newB * 0.189);
            const sepiaG = Math.min(255, newR * 0.349 + newG * 0.686 + newB * 0.168);
            const sepiaB = Math.min(255, newR * 0.272 + newG * 0.534 + newB * 0.131);
            
            // Blend 70% vintage, 30% original
            return {
                r: Math.min(255, Math.max(0, sepiaR * 0.7 + r * 0.3)),
                g: Math.min(255, Math.max(0, sepiaG * 0.7 + g * 0.3)),
                b: Math.min(255, Math.max(0, sepiaB * 0.7 + b * 0.3)),
                a
            };
        });
    }

    applyNoir() {
        // Noir: high contrast black & white + grain
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Convert to grayscale
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // High contrast adjustment
            const contrast = 1.3;
            const newGray = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
            
            // Add film grain effect
            const grain = (Math.random() - 0.5) * 20;
            const finalGray = Math.min(255, Math.max(0, newGray + grain));
            
            return { r: finalGray, g: finalGray, b: finalGray, a };
        });
    }

    applyPortrait() {
        // Portrait: skin tone enhancement + slight saturation boost
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Detect skin tones (simplified RGB ranges)
            const isSkinTone = r > 95 && g > 40 && b > 20 && 
                               r > g && r > b && 
                               Math.abs(r - g) < 45 && Math.abs(r - b) < 45;
            
            if (isSkinTone) {
                // Enhance skin tones - boost red slightly, warm the tone
                const newR = Math.min(255, r * 1.05);
                const newG = Math.min(255, g * 1.02);
                const newB = Math.min(255, b * 0.95);
                
                // Slight saturation boost
                const avg = (newR + newG + newB) / 3;
                const saturationBoost = 1.1;
                
                return {
                    r: Math.min(255, Math.max(0, avg + saturationBoost * (newR - avg))),
                    g: Math.min(255, Math.max(0, avg + saturationBoost * (newG - avg))),
                    b: Math.min(255, Math.max(0, avg + saturationBoost * (newB - avg))),
                    a
                };
            }
            
            // Slight saturation boost for non-skin areas
            const avg = (r + g + b) / 3;
            const saturationBoost = 1.05;
            
            return {
                r: Math.min(255, Math.max(0, avg + saturationBoost * (r - avg))),
                g: Math.min(255, Math.max(0, avg + saturationBoost * (g - avg))),
                b: Math.min(255, Math.max(0, avg + saturationBoost * (b - avg))),
                a
            };
        });
    }

    applyHDR() {
        // HDR: tone mapping + local contrast enhancement
        canvasManager.applyPixelManipulation((r, g, b, a) => {
            // Convert to luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Tone mapping curve (S-curve for HDR effect)
            const toneMapped = luminance < 128 
                ? luminance * 1.2 
                : 128 + (luminance - 128) * 0.8;
            
            // Increase local contrast
            const contrast = 1.15;
            const enhanced = Math.min(255, Math.max(0, (toneMapped - 128) * contrast + 128));
            
            // Apply back to RGB channels proportionally
            const ratio = enhanced / (luminance || 1);
            const clampedRatio = Math.min(2, Math.max(0.5, ratio));
            
            return {
                r: Math.min(255, Math.max(0, r * clampedRatio)),
                g: Math.min(255, Math.max(0, g * clampedRatio)),
                b: Math.min(255, Math.max(0, b * clampedRatio)),
                a
            };
        });
    }

    resetFilters() {
        stateManager.resetFilters();
    }

    getFilterValue(filterName) {
        const state = stateManager.getState();
        return state.filters[filterName];
    }

    setFilterValue(filterName, value) {
        stateManager.setFilter(filterName, value);
    }
}

export const filterManager = new FilterManager();
