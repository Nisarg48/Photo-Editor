/**
 * UI Manager Module
 * Handles UI event listeners, updates, and theme management
 */

import { stateManager } from './stateManager.js';
import { canvasManager } from './canvasManager.js';
import { filterManager } from './filterManager.js';
import { cropManager } from './cropManager.js';
import { watermarkManager } from './watermarkManager.js';
import { socialMediaManager } from './socialMediaManager.js';
import { autoEnhanceManager } from './autoEnhanceManager.js';
import { metadataManager } from './metadataManager.js';

class UIManager {
    constructor() {
        this.elements = {};
        this.currentFilter = 'brightness';
        this.filterConfig = {
            brightness: { min: 0, max: 200, default: 100, unit: '%' },
            contrast: { min: 0, max: 200, default: 100, unit: '%' },
            saturation: { min: 0, max: 200, default: 100, unit: '%' },
            exposure: { min: -100, max: 100, default: 0, unit: '' },
            hue: { min: -180, max: 180, default: 0, unit: '°' },
            vibrance: { min: -100, max: 100, default: 0, unit: '' },
            blur: { min: 0, max: 20, default: 0, unit: 'px' }
        };
    }

    initialize() {
        this.cacheElements();
        this.initEventListeners();
        this.applyTheme();
        this.updateUndoRedoButtons();
        this.subscribeToStateChanges();
    }

    cacheElements() {
        this.elements = {
            // Image input
            chooseImageButton: document.querySelector('.choose_image button'),
            chooseImageInput: document.querySelector('.choose_image input'),
            canvasContainer: document.querySelector('.insert_image'),
            
            // Filter controls
            filterButtons: document.querySelectorAll('.filter_icon_buttons button'),
            slider: document.querySelector('.slider input'),
            filterName: document.querySelector('.filter_info .name'),
            sliderValue: document.querySelector('.filter_info .value'),
            
            // Transformation controls
            alignmentButtons: document.querySelectorAll('.alignment_icon_buttons button'),
            
            // Crop controls
            cropButton: document.querySelector('.crop'),
            resizeButton: document.querySelector('.resize'),
            cropResizeOptions: document.querySelector('.crop_resize_options'),
            applyCropButton: document.querySelector('.apply_crop'),
            cancelCropButton: document.querySelector('.cancel_crop'),
            aspectRatioSelect: document.getElementById('aspect_ratio'),
            
            // Preset filters
            presetFilterButtons: document.querySelectorAll('.preset_filter_buttons button'),
            
            // Action buttons
            resetButton: document.querySelector('.reset'),
            saveButton: document.querySelector('.save'),
            undoButton: document.querySelector('.undo'),
            redoButton: document.querySelector('.redo'),
            
            // Save options
            saveFormatSelect: document.getElementById('save_format'),
            saveQualitySlider: document.getElementById('save_quality'),
            saveQualityValue: document.querySelector('.quality-value'),
            saveFilenameInput: document.getElementById('save_filename'),
            
            // Theme toggle
            themeToggleButton: document.querySelector('.theme-toggle'),
            
            // Notification
            notification: document.querySelector('.notification'),
            
            // Watermark tool
            addWatermarkButton: document.querySelector('.add_watermark'),
            clearWatermarksButton: document.querySelector('.clear_watermarks'),
            watermarkOptions: document.querySelector('.watermark_options'),
            watermarkText: document.getElementById('watermark_text'),
            watermarkFont: document.getElementById('watermark_font'),
            watermarkSize: document.getElementById('watermark_size'),
            watermarkColor: document.getElementById('watermark_color'),
            watermarkOpacity: document.getElementById('watermark_opacity'),
            applyWatermarkButton: document.querySelector('.apply_watermark'),
            cancelWatermarkButton: document.querySelector('.cancel_watermark'),
            sizeValue: document.querySelector('.size-value'),
            opacityValue: document.querySelector('.opacity-value'),
            
            // Social media presets
            platformSelect: document.getElementById('platform_select'),
            formatSelect: document.getElementById('format_select'),
            applyPresetButton: document.querySelector('.apply_preset'),
            dimensionsValue: document.querySelector('.dimensions-value'),
            
            // Auto enhance
            autoEnhanceButton: document.querySelector('.auto_enhance_button'),
            
            // Metadata
            stripMetadataCheckbox: document.getElementById('strip_metadata')
        };
    }

    initEventListeners() {
        // Image loading
        this.elements.chooseImageButton.addEventListener('click', () => {
            this.elements.chooseImageInput.click();
        });

        this.elements.chooseImageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Filter buttons
        if (this.elements.filterButtons) {
            this.elements.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.selectFilter(button.id);
                });
            });
        }

        // Slider input
        this.elements.slider.addEventListener('input', (e) => {
            this.handleSliderChange(e.target.value);
        });

        // Transformation buttons
        if (this.elements.alignmentButtons) {
            this.elements.alignmentButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.handleTransformation(button.id);
                });
            });
        }

        // Crop controls
        if (this.elements.cropButton) {
            this.elements.cropButton.addEventListener('click', () => {
                this.handleCropClick();
            });
        }

        if (this.elements.resizeButton) {
            this.elements.resizeButton.addEventListener('click', () => {
                this.handleResizeClick();
            });
        }

        if (this.elements.applyCropButton) {
            this.elements.applyCropButton.addEventListener('click', () => {
                this.handleApplyCrop();
            });
        }

        if (this.elements.cancelCropButton) {
            this.elements.cancelCropButton.addEventListener('click', () => {
                this.handleCancelCrop();
            });
        }

        if (this.elements.aspectRatioSelect) {
            this.elements.aspectRatioSelect.addEventListener('change', (e) => {
                cropManager.setAspectRatio(e.target.value);
            });
        }

        // Preset filters
        if (this.elements.presetFilterButtons) {
            this.elements.presetFilterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.handlePresetFilter(button.id);
                });
            });
        }

        // Action buttons
        this.elements.resetButton.addEventListener('click', () => {
            this.handleReset();
        });

        this.elements.saveButton.addEventListener('click', () => {
            this.handleSave();
        });

        this.elements.undoButton.addEventListener('click', () => {
            this.handleUndo();
        });

        this.elements.redoButton.addEventListener('click', () => {
            this.handleRedo();
        });

        // Theme toggle
        if (this.elements.themeToggleButton) {
            this.elements.themeToggleButton.addEventListener('click', () => {
                stateManager.toggleTheme();
            });
        }

        // Save quality slider
        if (this.elements.saveQualitySlider) {
            this.elements.saveQualitySlider.addEventListener('input', (e) => {
                if (this.elements.saveQualityValue) {
                    this.elements.saveQualityValue.textContent = `${e.target.value}%`;
                }
            });
        }



        // Watermark tool controls
        if (this.elements.addWatermarkButton) {
            this.elements.addWatermarkButton.addEventListener('click', () => {
                this.showWatermarkOptions();
            });
        }

        if (this.elements.clearWatermarksButton) {
            this.elements.clearWatermarksButton.addEventListener('click', () => {
                watermarkManager.clearAllWatermarks();
                this.showNotification('All watermarks cleared');
            });
        }

        if (this.elements.applyWatermarkButton) {
            this.elements.applyWatermarkButton.addEventListener('click', () => {
                this.applyWatermark();
            });
        }

        if (this.elements.cancelWatermarkButton) {
            this.elements.cancelWatermarkButton.addEventListener('click', () => {
                this.hideWatermarkOptions();
            });
        }

        // Watermark size slider
        if (this.elements.watermarkSize) {
            this.elements.watermarkSize.addEventListener('input', (e) => {
                if (this.elements.sizeValue) {
                    this.elements.sizeValue.textContent = `${e.target.value}px`;
                }
            });
        }

        // Watermark opacity slider
        if (this.elements.watermarkOpacity) {
            this.elements.watermarkOpacity.addEventListener('input', (e) => {
                if (this.elements.opacityValue) {
                    this.elements.opacityValue.textContent = `${e.target.value}%`;
                }
            });
        }

        // Social media platform selector
        if (this.elements.platformSelect) {
            this.elements.platformSelect.addEventListener('change', (e) => {
                this.handlePlatformChange(e.target.value);
            });
        }

        // Social media format selector
        if (this.elements.formatSelect) {
            this.elements.formatSelect.addEventListener('change', (e) => {
                this.updateApplyPresetButton();
            });
        }

        // Apply preset button
        if (this.elements.applyPresetButton) {
            this.elements.applyPresetButton.addEventListener('click', () => {
                this.applySocialMediaPreset();
            });
        }

        // Auto enhance button
        if (this.elements.autoEnhanceButton) {
            this.elements.autoEnhanceButton.addEventListener('click', () => {
                this.handleAutoEnhance();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            // Create canvas element if it doesn't exist
            let canvas = this.elements.canvasContainer.querySelector('canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'editor-canvas';
                this.elements.canvasContainer.innerHTML = '';
                this.elements.canvasContainer.appendChild(canvas);
            }

            // Initialize canvas manager
            canvasManager.initializeCanvas(canvas);
            
            // Load image
            canvasManager.loadImageToCanvas(event.target.result)
                .then(() => {
                    this.showNotification('Image loaded successfully');
                })
                .catch((error) => {
                    this.showNotification('Error loading image', 'error');
                    console.error(error);
                });
        };
        reader.readAsDataURL(file);
    }

    selectFilter(filterId) {
        this.currentFilter = filterId.toLowerCase();
        
        // Update active button
        if (this.elements.filterButtons) {
            this.elements.filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.id.toLowerCase() === this.currentFilter) {
                    btn.classList.add('active');
                }
            });
        }

        // Update slider config
        const config = this.filterConfig[this.currentFilter];
        if (config && this.elements.slider) {
            this.elements.slider.min = config.min;
            this.elements.slider.max = config.max;
            this.elements.slider.value = filterManager.getFilterValue(this.currentFilter);
            
            // Update display
            if (this.elements.filterName) {
                this.elements.filterName.textContent = filterId;
            }
            this.updateSliderValue(this.elements.slider.value);
        }
    }

    handleSliderChange(value) {
        const numValue = parseFloat(value);
        filterManager.setFilterValue(this.currentFilter, numValue);
        this.updateSliderValue(numValue);
        
        // Update button tag immediately for better UX
        const buttonId = this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1);
        const initialState = stateManager.getInitialState();
        const defaultValue = initialState.filters[this.currentFilter];
        this.updateButtonWithTag(buttonId, numValue, defaultValue);
        
        // Debounce filter application
        if (this.sliderTimeout) {
            clearTimeout(this.sliderTimeout);
        }
        this.sliderTimeout = setTimeout(() => {
            this.applyCurrentFilters();
        }, 300);
    }

    applyCurrentFilters() {
        const state = stateManager.getState();
        if (state.currentCanvas && state.originalImage) {
            // Reload original image and apply all current filters
            canvasManager.loadImageToCanvas(state.originalImage.src).then(() => {
                filterManager.applyFilters();
                // Update tags after applying filters
                this.updateFilterTags();
                // Save to history
                const newDataUrl = canvasManager.getCanvasDataURL();
                stateManager.saveToHistory(newDataUrl);
            });
        }
    }

    resetIndividualSetting(filterName) {
        if (filterName === 'transformations') {
            // Reset transformations
            const state = stateManager.getState();
            if (state.currentCanvas && state.originalImage) {
                canvasManager.loadImageToCanvas(state.originalImage.src).then(() => {
                    stateManager.resetTransformations();
                    // Save to history
                    const newDataUrl = canvasManager.getCanvasDataURL();
                    stateManager.saveToHistory(newDataUrl);
                    this.showNotification('Transformations reset');
                });
            }
        } else {
            // Reset individual filter
            const initialState = stateManager.getInitialState();
            const defaultValue = initialState.filters[filterName];
            filterManager.setFilterValue(filterName, defaultValue);
            
            // If this is the current filter, update slider
            if (this.currentFilter === filterName) {
                this.elements.slider.value = defaultValue;
                this.updateSliderValue(defaultValue);
            }
            
            // Apply the reset changes
            this.applyCurrentFilters();
            this.showNotification(`${filterName} reset`);
        }
    }

    updateSliderValue(value) {
        const config = this.filterConfig[this.currentFilter];
        this.elements.sliderValue.textContent = `${value}${config.unit}`;
    }

    handleTransformation(transformationId) {
        const state = stateManager.getState();
        
        switch (transformationId) {
            case 'Rotate_Right':
                canvasManager.rotateCanvas(90);
                stateManager.setTransformation('rotate', state.transformations.rotate + 90);
                break;
            case 'Rotate_Left':
                canvasManager.rotateCanvas(-90);
                stateManager.setTransformation('rotate', state.transformations.rotate - 90);
                break;
            case 'Flip_X':
                canvasManager.flipCanvas(true, false);
                stateManager.setTransformation('flipX', state.transformations.flipX * -1);
                break;
            case 'Flip_Y':
                canvasManager.flipCanvas(false, true);
                stateManager.setTransformation('flipY', state.transformations.flipY * -1);
                break;
        }

        // Update transformation tags
        this.updateFilterTags();

        // Save to history
        const newDataUrl = canvasManager.getCanvasDataURL();
        stateManager.saveToHistory(newDataUrl);
    }

    handleCropClick() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        // Show crop overlay
        cropManager.showCropOverlay();
        
        // Show crop options
        if (this.elements.cropResizeOptions) {
            this.elements.cropResizeOptions.style.display = 'block';
        }
    }

    handleResizeClick() {
        const state = stateManager.getState();
        if (!state.originalImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        // Reset to original image
        canvasManager.loadImageToCanvas(state.originalImage.src);
        filterManager.resetFilters();
        stateManager.resetTransformations();
        stateManager.clearHistory();
        
        this.showNotification('Image reset to original');
    }

    handleApplyCrop() {
        if (cropManager.executeCrop()) {
            this.showNotification('Crop applied successfully');
            if (this.elements.cropResizeOptions) {
                this.elements.cropResizeOptions.style.display = 'none';
            }
        } else {
            this.showNotification('Invalid crop dimensions', 'error');
        }
    }

    handleCancelCrop() {
        cropManager.cancelCrop();
        if (this.elements.cropResizeOptions) {
            this.elements.cropResizeOptions.style.display = 'none';
        }
        this.showNotification('Crop cancelled');
    }

    handlePresetFilter(filterId) {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        filterManager.applyPresetFilter(filterId.toLowerCase());
        
        // Save to history
        const newDataUrl = canvasManager.getCanvasDataURL();
        stateManager.saveToHistory(newDataUrl);
        
        this.showNotification(`${filterId} filter applied`);
    }

    handleReset() {
        const state = stateManager.getState();
        if (!state.originalImage) {
            this.showNotification('No image to reset', 'error');
            return;
        }

        // Reload original image
        canvasManager.loadImageToCanvas(state.originalImage.src);
        filterManager.resetFilters();
        stateManager.resetTransformations();
        stateManager.clearHistory();
        stateManager.clearSettingsFromStorage();
        
        // Reset slider
        this.selectFilter('Brightness');
        
        this.showNotification('Image reset to original');
    }

    handleSave() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('No image to save', 'error');
            return;
        }

        const format = this.elements.saveFormatSelect?.value || 'image/png';
        const quality = this.elements.saveQualitySlider?.value / 100 || 1.0;
        const filename = this.elements.saveFilenameInput?.value || 'edited-image';
        const stripMetadata = this.elements.stripMetadataCheckbox?.checked || false;
        
        // Apply current filters before saving
        filterManager.applyFilters();
        
        const dataUrl = canvasManager.getCanvasDataURL(format, quality);
        const extension = format.split('/')[1];
        
        const link = document.createElement('a');
        link.download = `${filename}.${extension}`;
        link.href = dataUrl;
        link.click();
        
        const message = stripMetadata 
            ? 'Image saved (metadata stripped)' 
            : 'Image saved successfully';
        this.showNotification(message);
    }

    handleUndo() {
        const previousState = stateManager.undo();
        if (previousState) {
            const canvas = stateManager.getState().currentCanvas;
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
            };
            img.src = previousState;
            this.updateUndoRedoButtons();
            this.showNotification('Undo successful');
        }
    }

    handleRedo() {
        const nextState = stateManager.redo();
        if (nextState) {
            const canvas = stateManager.getState().currentCanvas;
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
            };
            img.src = nextState;
            this.updateUndoRedoButtons();
            this.showNotification('Redo successful');
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.handleUndo();
        }
        
        // Ctrl+Y or Ctrl+Shift+Z for redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.handleRedo();
        }
        
        // Escape to cancel crop
        if (e.key === 'Escape') {
            cropManager.cancelCrop();
            if (this.elements.cropResizeOptions) {
                this.elements.cropResizeOptions.style.display = 'none';
            }
        }
        
        // Enter to apply crop
        if (e.key === 'Enter' && stateManager.getState().cropState.active) {
            this.handleApplyCrop();
        }
    }

    updateUndoRedoButtons() {
        this.elements.undoButton.disabled = !stateManager.canUndo();
        this.elements.redoButton.disabled = !stateManager.canRedo();
    }

    applyTheme() {
        const state = stateManager.getState();
        document.body.setAttribute('data-theme', state.theme);
    }

    showNotification(message, type = 'success') {
        if (!this.elements.notification) return;
        
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification notification-${type}`;
        this.elements.notification.style.display = 'block';
        
        setTimeout(() => {
            this.elements.notification.style.display = 'none';
        }, 3000);
    }

    subscribeToStateChanges() {
        stateManager.subscribe((state) => {
            this.applyTheme();
            this.updateUndoRedoButtons();
            this.updateFilterTags();
            this.updateDimensionsDisplay();
        });
    }

    updateFilterTags() {
        const state = stateManager.getState();
        const filters = state.filters;
        const transformations = state.transformations;
        const initialState = stateManager.getInitialState();
        const defaults = initialState.filters;
        const transformDefaults = initialState.transformations;

        // Update adjustment filter buttons
        this.elements.filterButtons.forEach(button => {
            const filterName = button.id.toLowerCase();
            if (filters[filterName] !== undefined) {
                this.updateButtonWithTag(button.id, filters[filterName], defaults[filterName]);
            }
        });

        // Update transformation buttons
        this.elements.alignmentButtons.forEach(button => {
            const transformName = button.id.toLowerCase();
            let isModified = false;
            let value = '';

            if (transformName === 'rotate_right' || transformName === 'rotate_left') {
                isModified = transformations.rotate !== 0;
                value = `${transformations.rotate}°`;
            } else if (transformName === 'flip_x') {
                isModified = transformations.flipX !== 1;
                value = transformations.flipX === -1 ? 'Flip H' : '';
            } else if (transformName === 'flip_y') {
                isModified = transformations.flipY !== 1;
                value = transformations.flipY === -1 ? 'Flip V' : '';
            }

            if (isModified && value) {
                this.updateButtonWithTag(button.id, value, '', true);
            } else {
                this.removeButtonTag(button.id);
            }
        });
    }

    updateButtonWithTag(buttonId, value, defaultValue, isTransformation = false) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const existingTag = button.querySelector('.filter-tag');
        const existingReset = button.querySelector('.filter-reset-btn');

        // Remove existing if value is default
        if (value === defaultValue || (isTransformation && value === '')) {
            this.removeButtonTag(buttonId);
            return;
        }

        // Create or update tag
        let tag = existingTag;
        if (!tag) {
            tag = document.createElement('span');
            tag.className = 'filter-tag';
            button.appendChild(tag);
        }

        // Set tag content and styling
        let tagClass = 'neutral';
        if (!isTransformation) {
            const config = this.filterConfig[buttonId.toLowerCase()];
            if (config) {
                tag.textContent = `${value}${config.unit}`;
                tagClass = value > defaultValue ? 'positive' : value < defaultValue ? 'negative' : 'neutral';
            } else {
                tag.textContent = value.toString();
            }
        } else {
            tag.textContent = value;
        }

        tag.className = `filter-tag ${tagClass}`;

        // Add reset button
        let resetBtn = existingReset;
        if (!resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'filter-reset-btn';
            resetBtn.textContent = '✕';
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetIndividualSetting(buttonId);
            });
            button.appendChild(resetBtn);
        }

        button.classList.add('button-with-tag');
    }

    removeButtonTag(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const existingTag = button.querySelector('.filter-tag');
        const existingReset = button.querySelector('.filter-reset-btn');

        if (existingTag) existingTag.remove();
        if (existingReset) existingReset.remove();
        button.classList.remove('button-with-tag');
    }

    showWatermarkOptions() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }
        
        if (this.elements.watermarkOptions) {
            this.elements.watermarkOptions.style.display = 'block';
        }
    }

    hideWatermarkOptions() {
        if (this.elements.watermarkOptions) {
            this.elements.watermarkOptions.style.display = 'none';
        }
    }

    applyWatermark() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const watermarkSettings = {
            text: this.elements.watermarkText?.value || '© Your Name',
            font: this.elements.watermarkFont?.value || 'Arial',
            size: parseInt(this.elements.watermarkSize?.value) || 24,
            color: this.elements.watermarkColor?.value || '#ffffff',
            opacity: (parseInt(this.elements.watermarkOpacity?.value) || 80) / 100,
            x: state.currentCanvas.width / 2,
            y: state.currentCanvas.height / 2
        };

        watermarkManager.addWatermark(watermarkSettings);
        this.hideWatermarkOptions();
        this.showNotification('Watermark added');
        
        // Save to history
        const newDataUrl = canvasManager.getCanvasDataURL();
        stateManager.saveToHistory(newDataUrl);
    }

    handlePlatformChange(platform) {
        const formatSelect = this.elements.formatSelect;
        if (!formatSelect) return;

        // Clear existing options
        formatSelect.innerHTML = '';

        if (!platform) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Select Platform First';
            formatSelect.appendChild(option);
            formatSelect.disabled = true;
            this.updateApplyPresetButton();
            return;
        }

        // Get presets for selected platform
        const presets = socialMediaManager.getPresets()[platform];
        if (presets) {
            Object.entries(presets).forEach(([format, preset]) => {
                const option = document.createElement('option');
                option.value = format;
                option.textContent = `${preset.name} (${preset.width}x${preset.height})`;
                formatSelect.appendChild(option);
            });
            formatSelect.disabled = false;
        }

        this.updateApplyPresetButton();
    }

    updateApplyPresetButton() {
        if (this.elements.applyPresetButton) {
            const platform = this.elements.platformSelect?.value;
            const format = this.elements.formatSelect?.value;
            this.elements.applyPresetButton.disabled = !platform || !format;
        }
    }

    applySocialMediaPreset() {
        const platform = this.elements.platformSelect?.value;
        const format = this.elements.formatSelect?.value;

        if (!platform || !format) {
            this.showNotification('Please select platform and format', 'error');
            return;
        }

        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        if (socialMediaManager.applyPreset(platform, format)) {
            this.updateDimensionsDisplay();
            this.showNotification(`Applied ${platform} ${format} preset`);
            
            // Save to history
            const newDataUrl = canvasManager.getCanvasDataURL();
            stateManager.saveToHistory(newDataUrl);
        } else {
            this.showNotification('Failed to apply preset', 'error');
        }
    }

    updateDimensionsDisplay() {
        if (this.elements.dimensionsValue) {
            const dimensions = socialMediaManager.getCurrentDimensions();
            this.elements.dimensionsValue.textContent = `${dimensions.width} x ${dimensions.height}`;
        }
    }

    handleAutoEnhance() {
        const state = stateManager.getState();
        if (!state.currentCanvas) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        if (autoEnhanceManager.applyAutoEnhance()) {
            this.showNotification('Auto enhance applied');
            
            // Save to history
            const newDataUrl = canvasManager.getCanvasDataURL();
            stateManager.saveToHistory(newDataUrl);
        } else {
            this.showNotification('Auto enhance failed', 'error');
        }
    }
}

export const uiManager = new UIManager();
