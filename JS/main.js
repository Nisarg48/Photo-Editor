/**
 * Main Entry Point
 * Initializes the photo editor application
 */

import { uiManager } from './uiManager.js';
import { cropManager } from './cropManager.js';
import { watermarkManager } from './watermarkManager.js';
import { socialMediaManager } from './socialMediaManager.js';
import { autoEnhanceManager } from './autoEnhanceManager.js';
import { metadataManager } from './metadataManager.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI manager
    uiManager.initialize();
    
    // Initialize crop manager (will set up overlay when needed)
    const canvasContainer = document.querySelector('.insert_image');
    if (canvasContainer) {
        cropManager.initCropOverlay(null, canvasContainer.parentElement);
    }
    
    console.log('Photo Editor initialized successfully');
});
