import { Viewport, Point } from './types';

export class ViewportManager {
    private viewport: Viewport;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(totalWidth: number, totalHeight: number) {
        this.canvasWidth = totalWidth;
        this.canvasHeight = totalHeight;
        this.viewport = {
            x: 0,
            y: 0,
            width: totalWidth,
            height: totalHeight,
            scale: 1.0
        };
    }

    getView(): Viewport {
        return { ...this.viewport };
    }

    pan(dx: number, dy: number) {
        this.viewport.x += dx / this.viewport.scale;
        this.viewport.y += dy / this.viewport.scale;
        this.clamp();
    }

    zoom(factor: number, centerX: number, centerY: number) {
        const oldScale = this.viewport.scale;
        const newScale = Math.min(Math.max(oldScale * factor, 0.01), 100);
        
        // Zoom toward mouse position
        const worldX = centerX / oldScale + this.viewport.x;
        const worldY = centerY / oldScale + this.viewport.y;
        
        this.viewport.scale = newScale;
        this.viewport.x = worldX - centerX / newScale;
        this.viewport.y = worldY - centerY / newScale;
        
        this.clamp();
    }

    private clamp() {
        // Keep viewport within bounds
        const halfW = this.viewport.width / 2;
        const halfH = this.viewport.height / 2;
        this.viewport.x = Math.max(-halfW, Math.min(this.canvasWidth - halfW, this.viewport.x));
        this.viewport.y = Math.max(-halfH, Math.min(this.canvasHeight - halfH, this.viewport.y));
    }

    screenToWorld(screenX: number, screenY: number): Point {
        return {
            x: screenX / this.viewport.scale + this.viewport.x,
            y: screenY / this.viewport.scale + this.viewport.y
        };
    }
}