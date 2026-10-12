# Photo Editor

A modern, feature-rich browser-based photo editor built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no dependencies, no cloud services - completely offline and privacy-focused.

## Features

### Core Functionality
- **Image Loading**: Support for PNG, JPG, WebP formats
- **Canvas-Based Editing**: All edits are destructive and properly saved
- **Undo/Redo System**: Full history management with keyboard shortcuts (Ctrl+Z/Y)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Image Adjustments
- **Brightness**: Light/dark adjustment (0-200%)
- **Contrast**: Image contrast control (0-200%)
- **Saturation**: Color saturation (0-200%)
- **Exposure**: Light exposure adjustment (-100 to 100)
- **Hue**: Color rotation (-180° to 180°)
- **Vibrance**: Smart saturation boost for muted colors (-100 to 100)
- **Blur**: Gaussian blur effect (0-20px)

### Transformations
- **Rotation**: Rotate left/right (90° increments)
- **Flip**: Horizontal and vertical flip
- **Crop**: Interactive crop tool with draggable overlay
- **Aspect Ratios**: Free, 1:1, 4:3, 16:9, 3:2, 5:4

### Preset Filters
- **Grayscale**: Black and white conversion
- **Sepia**: Warm brown tone effect
- **Invert**: Color inversion
- **Sharpen**: Edge enhancement
- **Vintage**: Film grain + color grading + vignette
- **Noir**: High contrast black & white + grain
- **Portrait**: Skin tone enhancement + saturation boost
- **HDR**: Tone mapping + local contrast enhancement

### Advanced Features
- **Auto-Enhance**: One-click algorithm-based optimization (histogram analysis, auto white balance, contrast enhancement)
- **Watermark**: Add customizable text overlays with font, size, color, opacity controls
- **Social Media Presets**: Platform-specific dimensions for Instagram, Facebook, Twitter, LinkedIn
- **Metadata Management**: Privacy-focused EXIF data removal option
- **Theme Toggle**: Dark mode (default) with light mode option
- **Settings Persistence**: Auto-save settings to localStorage

### UI Features
- **Tag System**: Visual indicators on buttons showing current values
- **Individual Reset**: X buttons to reset individual settings
- **Real-time Feedback**: Live preview of adjustments
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo), Esc (cancel crop), Enter (apply crop)

## Technology Stack

- **HTML5**: Semantic markup, canvas elements
- **CSS3**: Modern CSS with Grid/Flexbox, CSS variables, clamp() for responsive design
- **Vanilla JavaScript (ES6)**: Modular architecture with no frameworks
- **Canvas API**: Pixel manipulation and image processing
- **localStorage**: Settings persistence

## Project Structure
```text
Photo-Editor/
├── HTML/
│   └── Photo_Editor.html    # Main HTML file
├── CSS/
│   └── Photo_Editor.css     # Modern CSS with dark/light themes
├── JS/
│   ├── main.js              # Entry point and initialization
│   ├── stateManager.js      # Centralized state management
│   ├── canvasManager.js     # Canvas operations and pixel manipulation
│   ├── filterManager.js     # Filter application logic
│   ├── cropManager.js       # Interactive crop functionality
│   ├── uiManager.js         # UI event handling and updates
│   ├── watermarkManager.js  # Text overlay functionality
│   ├── socialMediaManager.js # Social media dimension presets
│   ├── autoEnhanceManager.js # Algorithm-based auto-enhance
│   └── metadataManager.js   # EXIF data management
└── README.md                # This file
```

## How to Start

### Option 1: Python Local Server (Recommended)

1. Navigate to the project directory:
   ```bash
   cd /home/nisarg-patel/Documents/Photo-Editor
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open in browser:
   ```
   http://localhost:8000/
   ```

### Option 2: Different Port

If port 8000 is in use:
```bash
python3 -m http.server 3000
```
Then visit: `http://localhost:3000/`

### Option 3: Node.js (if installed)

```bash
cd /home/nisarg-patel/Documents/Photo-Editor
npx serve
```

### Option 4: Direct File Access

You can also open the HTML file directly, but may encounter CORS issues with ES6 modules:
```
file:///home/nisarg-patel/Documents/Photo-Editor/HTML/Photo_Editor.html
```

## Usage

1. **Load Image**: Click "Choose Image" button to select a photo
2. **Apply Adjustments**: Use sliders to adjust brightness, contrast, saturation, etc.
3. **Apply Filters**: Click preset filter buttons for instant effects
4. **Transform**: Rotate or flip the image
5. **Crop**: Click "Crop" to enter crop mode, adjust the overlay, then "Apply Crop"
6. **Auto-Enhance**: Click the "Auto Enhance" button for one-click optimization
7. **Social Media**: Select platform and format to auto-resize for social media
8. **Watermark**: Add text overlays with customization options
9. **Save**: Choose format, quality, and filename, then click "Save Image"
10. **Undo/Redo**: Use Ctrl+Z and Ctrl+Y (or buttons) to navigate history

## Architecture

The project uses a modular ES6 architecture with:

- **State Management**: Centralized state with localStorage persistence
- **Canvas-Based Processing**: All edits use canvas API for consistency
- **Module Isolation**: Each module has single responsibility
- **Event Delegation**: Centralized event handling in uiManager
- **Responsive Design**: Fluid sizing with CSS clamp() and media queries

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (responsive design)

## Privacy & Security

- **Offline Processing**: All image processing happens locally in your browser
- **No Data Collection**: No cloud services, no tracking, no data sent to servers
- **Metadata Control**: Option to strip EXIF data for privacy
- **No External Dependencies**: Pure HTML/CSS/JS, no external scripts or CDNs

## Future Enhancements

Potential features for future development:
- Zoom and pan controls
- Before/after comparison
- Drawing/annotation tools
- Advanced color tools (curves, levels, HSL)
- Layer system for professional editing
- Batch processing for multiple images

## License
```text
This project is open source and available for educational and personal use.
You can copy this content and update your README.md file with it. It includes comprehensive documentation about the features, architecture, usage instructions, and how to start the application.
```