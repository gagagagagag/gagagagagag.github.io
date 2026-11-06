export interface Viewport {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
}

export interface GridConfig {
    cellWidth: number;
    cellHeight: number;
    totalWidth: number;
    totalHeight: number;
}

export interface SelectedCell {
    id: string;
    row: number;
    col: number;
    bbox: { x: number; y: number; w: number; h: number };
    svgContent: string; // extracted SVG elements
}

export interface Point {
    x: number;
    y: number;
}