import { GridConfig, SelectedCell, Point } from './types';

export class GridManager {
    private config: GridConfig;
    private visible: boolean = false;
    private selections: Map<string, SelectedCell> = new Map();
    private nextId: number = 1;

    constructor(cellWidth: number, cellHeight: number, totalWidth: number, totalHeight: number) {
        this.config = {
            cellWidth,
            cellHeight,
            totalWidth,
            totalHeight
        };
    }

    toggleVisible(): boolean {
        this.visible = !this.visible;
        return this.visible;
    }

    isVisible(): boolean {
        return this.visible;
    }

    getConfig(): GridConfig {
        return { ...this.config };
    }

    getCellAt(worldX: number, worldY: number): { row: number; col: number } | null {
        if (worldX < 0 || worldY < 0 || 
            worldX > this.config.totalWidth || 
            worldY > this.config.totalHeight) {
            return null;
        }
        return {
            row: Math.floor(worldY / this.config.cellHeight),
            col: Math.floor(worldX / this.config.cellWidth)
        };
    }

    getCellBBox(row: number, col: number): { x: number; y: number; w: number; h: number } {
        return {
            x: col * this.config.cellWidth,
            y: row * this.config.cellHeight,
            w: this.config.cellWidth,
            h: this.config.cellHeight
        };
    }

    selectCell(row: number, col: number, svgContent: string): SelectedCell | null {
        // Check if already selected
        for (const [id, cell] of this.selections) {
            if (cell.row === row && cell.col === col) {
                return cell;
            }
        }

        const id = `cell-${this.nextId++}`;
        const bbox = this.getCellBBox(row, col);
        const selected: SelectedCell = {
            id,
            row,
            col,
            bbox,
            svgContent
        };
        this.selections.set(id, selected);
        return selected;
    }

    getSelections(): SelectedCell[] {
        return Array.from(this.selections.values());
    }

    clearSelections() {
        this.selections.clear();
        this.nextId = 1;
    }

    removeSelection(id: string): boolean {
        return this.selections.delete(id);
    }
}