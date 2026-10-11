/**
 * Social Media Manager Module
 * Handles social media dimension presets and optimization
 */

import { stateManager } from './stateManager.js';
import { canvasManager } from './canvasManager.js';

class SocialMediaManager {
    constructor() {
        this.presets = {
            instagram: {
                square: { width: 1080, height: 1080, name: 'Square', quality: 95 },
                portrait: { width: 1080, height: 1350, name: 'Portrait', quality: 95 },
                story: { width: 1080, height: 1920, name: 'Story', quality: 90 },
                reel: { width: 1080, height: 1920, name: 'Reel', quality: 90 }
            },
            facebook: {
                post: { width: 1200, height: 630, name: 'Post', quality: 90 },
                cover: { width: 820, height: 312, name: 'Cover', quality: 85 },
                story: { width: 1080, height: 1920, name: 'Story', quality: 90 },
                ad: { width: 1200, height: 628, name: 'Ad', quality: 90 }
            },
            twitter: {
                post: { width: 1200, height: 675, name: 'Post', quality: 90 },
                header: { width: 1500, height: 500, name: 'Header', quality: 85 },
                profile: { width: 400, height: 400, name: 'Profile', quality: 95 }
            },
            linkedin: {
                post: { width: 1200, height: 627, name: 'Post', quality: 90 },
                cover: { width: 1128, height: 191, name: 'Cover', quality: 85 },
                profile: { width: 400, height: 400, name: 'Profile', quality: 95 }
            }
        };
    }

    getPresets() {
        return this.presets;
    }

    getPreset(platform, format) {
        if (this.presets[platform] && this.presets[platform][format]) {
            return this.presets[platform][format];
        }
        return null;
    }

    applyPreset(platform, format) {
        const preset = this.getPreset(platform, format);
        if (!preset) {
            console.error(`Preset not found: ${platform} ${format}`);
            return false;
        }

        const state = stateManager.getState();
        if (!state.currentCanvas) {
            console.error('No canvas to resize');
            return false;
        }

        // Resize canvas to preset dimensions
        canvasManager.resizeCanvasTo(preset.width, preset.height);
        
        // Store current preset info
        stateManager.setState({
            currentPreset: { platform, format, ...preset }
        });

        return true;
    }

    getCurrentDimensions() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            return { width: 0, height: 0 };
        }
        return {
            width: state.currentCanvas.width,
            height: state.currentCanvas.height
        };
    }

    findMatchingPreset() {
        const current = this.getCurrentDimensions();
        if (current.width === 0 || current.height === 0) return null;

        for (const [platform, formats] of Object.entries(this.presets)) {
            for (const [format, preset] of Object.entries(formats)) {
                // Allow small tolerance for rounding
                if (Math.abs(current.width - preset.width) < 5 && 
                    Math.abs(current.height - preset.height) < 5) {
                    return { platform, format, ...preset };
                }
            }
        }
        return null;
    }

    getOptimizedQuality(platform, format) {
        const preset = this.getPreset(platform, format);
        return preset ? preset.quality : 90;
    }

    generateFilename(platform, format, originalName) {
        const preset = this.getPreset(platform, format);
        if (!preset) return originalName;

        const baseName = originalName.replace(/\.[^/.]+$/, '');
        return `${baseName}_${platform}_${preset.name.toLowerCase()}`;
    }
}

export const socialMediaManager = new SocialMediaManager();
