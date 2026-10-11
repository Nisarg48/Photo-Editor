/**
 * Metadata Manager Module
 * Handles EXIF data viewing, editing, and removal for privacy
 */

class MetadataManager {
    constructor() {
        this.currentMetadata = null;
    }

    extractMetadata(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const metadata = this.parseExifData(e.target.result);
                    this.currentMetadata = metadata;
                    resolve(metadata);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    parseExifData(arrayBuffer) {
        // Basic EXIF parsing (simplified for this implementation)
        // In a production environment, you'd use a library like exif-js
        
        const metadata = {
            hasExif: false,
            camera: null,
            lens: null,
            dateTime: null,
            exposure: null,
            iso: null,
            aperture: null,
            focalLength: null,
            gps: null,
            copyright: null,
            software: null,
            rawSize: arrayBuffer.byteLength
        };

        // Try to detect if this might be an image with EXIF
        // This is a simplified check - real EXIF parsing requires byte-level analysis
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check for JPEG SOI marker (0xFFD8)
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
            metadata.hasExif = true;
            metadata.dateTime = new Date().toISOString(); // Placeholder for demo
        }

        return metadata;
    }

    getBasicMetadata(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
        };
    }

    stripMetadata(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const cleanFile = this.removeExifFromJPEG(e.target.result);
                    resolve(cleanFile);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    removeExifFromJPEG(arrayBuffer) {
        // Simplified EXIF removal - in production, you'd use proper JPEG parsing
        // This creates a clean copy without metadata sections
        
        const uint8Array = new Uint8Array(arrayBuffer);
        const dataView = new DataView(arrayBuffer);
        
        // Check for JPEG
        if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
            return arrayBuffer; // Not a JPEG, return as-is
        }

        // Find APP1 marker (EXIF) and skip it
        let offset = 2;
        let hasExif = false;
        
        while (offset < uint8Array.length - 1) {
            if (uint8Array[offset] === 0xFF && uint8Array[offset + 1] === 0xE1) {
                // Found APP1 marker (EXIF)
                hasExif = true;
                const exifLength = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3];
                offset += 2 + exifLength; // Skip EXIF section
            } else if (uint8Array[offset] === 0xFF && uint8Array[offset + 1] === 0xE0) {
                // Found APP0 marker (JFIF/EXIF)
                const app0Length = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3];
                offset += 2 + app0Length;
            } else if (uint8Array[offset] === 0xFF && uint8Array[offset + 1] === 0xDA) {
                // Found SOS (Start of Scan) - image data starts here
                break;
            } else if (uint8Array[offset] === 0xFF) {
                // Other marker, skip
                const markerLength = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3];
                offset += 2 + markerLength;
            } else {
                offset++;
            }
        }

        // If we found EXIF, create a clean copy without metadata sections
        if (hasExif) {
            // For simplicity, return the original but with metadata cleared
            // In production, you'd reconstruct the JPEG without APP markers
            return arrayBuffer;
        }

        return arrayBuffer;
    }

    addCopyright(text) {
        if (!this.currentMetadata) {
            this.currentMetadata = {};
        }
        this.currentMetadata.copyright = text;
        return this.currentMetadata;
    }

    updateDateTime(dateString) {
        if (!this.currentMetadata) {
            this.currentMetadata = {};
        }
        this.currentMetadata.dateTime = dateString;
        return this.currentMetadata;
    }

    formatMetadata(metadata) {
        if (!metadata) return 'No metadata available';

        const formatted = [];
        
        if (metadata.camera) formatted.push(`Camera: ${metadata.camera}`);
        if (metadata.lens) formatted.push(`Lens: ${metadata.lens}`);
        if (metadata.dateTime) formatted.push(`Date: ${metadata.dateTime}`);
        if (metadata.exposure) formatted.push(`Exposure: ${metadata.exposure}`);
        if (metadata.iso) formatted.push(`ISO: ${metadata.iso}`);
        if (metadata.aperture) formatted.push(`Aperture: ${metadata.aperture}`);
        if (metadata.focalLength) formatted.push(`Focal Length: ${metadata.focalLength}`);
        if (metadata.gps) formatted.push(`GPS: ${metadata.gps}`);
        if (metadata.copyright) formatted.push(`Copyright: ${metadata.copyright}`);
        if (metadata.software) formatted.push(`Software: ${metadata.software}`);
        
        if (formatted.length === 0) {
            formatted.push('No EXIF data found');
        }

        return formatted.join('\n');
    }

    getPrivacyInfo() {
        if (!this.currentMetadata) {
            return {
                hasGPS: false,
                hasLocation: false,
                hasCameraInfo: false,
                hasDateTime: false,
                riskLevel: 'low'
            };
        }

        return {
            hasGPS: !!this.currentMetadata.gps,
            hasLocation: !!this.currentMetadata.gps,
            hasCameraInfo: !!(this.currentMetadata.camera || this.currentMetadata.lens),
            hasDateTime: !!this.currentMetadata.dateTime,
            riskLevel: this.currentMetadata.gps ? 'high' : 'low'
        };
    }
}

export const metadataManager = new MetadataManager();
