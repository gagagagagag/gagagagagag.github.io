import { ViewportManager } from './Viewport';
import { SvgEngine } from './SvgEngine';
import { GridManager } from './GridManager';
import { SelectedCell } from './types';

// Global state
let viewportManager: ViewportManager;
let svgEngine: SvgEngine;
let gridManager: GridManager;
let svgWidth = 80000;
let svgHeight = 40000;

// UI callbacks
let onSelectionCallback: (cell: SelectedCell) => void;

export function setupP5(canvasContainer: HTMLElement, onSelection: (cell: SelectedCell) => void) {
    onSelectionCallback = onSelection;
    
    // Initialize managers
    viewportManager = new ViewportManager(svgWidth, svgHeight);
    svgEngine = new SvgEngine();
    gridManager = new GridManager(100, 30, svgWidth, svgHeight);

    // Create p5 sketch
    return new p5((p: any) => {
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        p.setup = () => {
            const rect = canvasContainer.getBoundingClientRect();
            const canvas = p.createCanvas(rect.width, rect.height);
            canvas.parent(canvasContainer);
            p.background(30);
            p.textFont('monospace');
        };

        p.draw = () => {
            p.background(30, 35, 50);
            
            const vp = viewportManager.getView();
            
            // Draw background grid (subtle)
            p.push();
            p.stroke(50, 55, 70);
            p.strokeWeight(1);
            const step = 1000;
            const startX = Math.floor(vp.x / step) * step;
            const startY = Math.floor(vp.y / step) * step;
            for (let x = startX; x < vp.x + vp.width + step; x += step) {
                const sx = (x - vp.x) * vp.scale;
                if (sx > 0 && sx < p.width) {
                    p.line(sx, 0, sx, p.height);
                }
            }
            for (let y = startY; y < vp.y + vp.height + step; y += step) {
                const sy = (y - vp.y) * vp.scale;
                if (sy > 0 && sy < p.height) {
                    p.line(0, sy, p.width, sy);
                }
            }
            p.pop();

            // Draw SVG content if loaded
            const svgEl = svgEngine.getSvgElement();
            if (svgEl) {
                p.push();
                p.translate(-vp.x * vp.scale, -vp.y * vp.scale);
                p.scale(vp.scale);
                
                // Render SVG using p5's SVG render capabilities
                // Since p5 doesn't directly render SVG, we use an image element
                // But for extraction, we keep this as a placeholder
                // We'll use the actual SVG rendering through p5.image
                const svgData = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                
                // Load as image (cached)
                p.loadImage(url, (img: any) => {
                    p.image(img, 0, 0, svgWidth, svgHeight);
                    URL.revokeObjectURL(url);
                });
                
                p.pop();
            }

            // Draw grid if visible
            if (gridManager.isVisible()) {
                const config = gridManager.getConfig();
                const startCol = Math.floor(vp.x / config.cellWidth);
                const endCol = Math.ceil((vp.x + vp.width) / config.cellWidth);
                const startRow = Math.floor(vp.y / config.cellHeight);
                const endRow = Math.ceil((vp.y + vp.height) / config.cellHeight);

                p.push();
                p.stroke(100, 200, 255, 150);
                p.strokeWeight(1 / vp.scale);

                for (let r = startRow; r <= endRow; r++) {
                    for (let c = startCol; c <= endCol; c++) {
                        const x = c * config.cellWidth;
                        const y = r * config.cellHeight;
                        const sx = (x - vp.x) * vp.scale;
                        const sy = (y - vp.y) * vp.scale;
                        const sw = config.cellWidth * vp.scale;
                        const sh = config.cellHeight * vp.scale;
                        
                        if (sx + sw > 0 && sx < p.width && sy + sh > 0 && sy < p.height) {
                            p.noFill();
                            p.rect(sx, sy, sw, sh);
                            
                            // Label
                            p.fill(100, 200, 255, 100);
                            p.noStroke();
                            p.textSize(10 / vp.scale);
                            p.text(`${r},${c}`, sx + 4, sy + 14);
                        }
                    }
                }
                p.pop();
            }

            // Draw selections
            const selections = gridManager.getSelections();
            if (selections.length > 0) {
                p.push();
                selections.forEach(cell => {
                    const x = (cell.bbox.x - vp.x) * vp.scale;
                    const y = (cell.bbox.y - vp.y) * vp.scale;
                    const w = cell.bbox.w * vp.scale;
                    const h = cell.bbox.h * vp.scale;
                    
                    if (x + w > 0 && x < p.width && y + h > 0 && y < p.height) {
                        p.fill(255, 215, 0, 60);
                        p.stroke(255, 215, 0, 200);
                        p.strokeWeight(2 / vp.scale);
                        p.rect(x, y, w, h);
                        
                        // ID label
                        p.fill(255, 215, 0);
                        p.noStroke();
                        p.textSize(12 / vp.scale);
                        p.text(cell.id, x + 4, y + 16);
                    }
                });
                p.pop();
            }

            // Update viewport info
            document.getElementById('viewportInfo')!.textContent = 
                `View: ${Math.round(vp.x)}, ${Math.round(vp.y)} | Zoom: ${vp.scale.toFixed(2)}x | Grid: ${gridManager.isVisible() ? 'ON' : 'OFF'}`;
        };

        p.mouseWheel = (event: any) => {
            const delta = event.delta > 0 ? 0.9 : 1.1;
            viewportManager.zoom(delta, p.mouseX, p.mouseY);
            return false;
        };

        p.mousePressed = () => {
            if (p.mouseButton === p.LEFT) {
                isDragging = true;
                lastMouseX = p.mouseX;
                lastMouseY = p.mouseY;
            }
        };

        p.mouseDragged = () => {
            if (isDragging) {
                const dx = p.mouseX - lastMouseX;
                const dy = p.mouseY - lastMouseY;
                viewportManager.pan(-dx, -dy);
                lastMouseX = p.mouseX;
                lastMouseY = p.mouseY;
            }
        };

        p.mouseReleased = () => {
            if (isDragging) {
                isDragging = false;
                // If mouse didn't move much, it's a click (for selection)
                const moved = Math.abs(p.mouseX - lastMouseX) < 5 && Math.abs(p.mouseY - lastMouseY) < 5;
                if (moved && gridManager.isVisible()) {
                    handleCellClick(p);
                }
            }
        };

        p.windowResized = () => {
            const rect = canvasContainer.getBoundingClientRect();
            p.resizeCanvas(rect.width, rect.height);
        };

        function handleCellClick(p: any) {
            const vp = viewportManager.getView();
            const worldX = p.mouseX / vp.scale + vp.x;
            const worldY = p.mouseY / vp.scale + vp.y;
            
            const cell = gridManager.getCellAt(worldX, worldY);
            if (cell) {
                const bbox = gridManager.getCellBBox(cell.row, cell.col);
                // Extract SVG content
                const svgContent = svgEngine.extractElementsInBBox(
                    bbox.x, bbox.y, bbox.w, bbox.h
                );
                
                if (svgContent) {
                    const selected = gridManager.selectCell(cell.row, cell.col, svgContent);
                    if (selected) {
                        onSelectionCallback(selected);
                        // Visual feedback
                        p.fill(255, 215, 0, 200);
                        p.noStroke();
                        const x = (bbox.x - vp.x) * vp.scale;
                        const y = (bbox.y - vp.y) * vp.scale;
                        p.ellipse(x, y, 20, 20);
                    }
                }
            }
        }
    });
}

// Expose functions for UI
export function loadSvgFromString(xmlString: string): boolean {
    const success = svgEngine.loadFromString(xmlString);
    if (success) {
        svgWidth = svgEngine.getSvgWidth();
        svgHeight = svgEngine.getSvgHeight();
        // Update grid manager
        gridManager = new GridManager(100, 30, svgWidth, svgHeight);
    }
    return success;
}

export function toggleGrid(): boolean {
    return gridManager.toggleVisible();
}

export function getGridState(): boolean {
    return gridManager.isVisible();
}

export function clearSelections() {
    gridManager.clearSelections();
    document.getElementById('selectionList')!.innerHTML = '';
    document.getElementById('selectionPreview')!.textContent = '';
}

export function getSelections(): SelectedCell[] {
    return gridManager.getSelections();
}

export function removeSelection(id: string) {
    gridManager.removeSelection(id);
}