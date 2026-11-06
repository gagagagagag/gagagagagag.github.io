export class SvgEngine {
    private svgDoc: Document | null = null;
    private svgElement: SVGElement | null = null;

    loadFromString(xmlString: string): boolean {
        try {
            const parser = new DOMParser();
            this.svgDoc = parser.parseFromString(xmlString, 'image/svg+xml');
            this.svgElement = this.svgDoc.documentElement as SVGElement;
            
            // Validate it's actually SVG
            if (this.svgElement.tagName !== 'svg') {
                throw new Error('Not a valid SVG document');
            }
            
            return true;
        } catch (e) {
            console.error('Failed to load SVG:', e);
            return false;
        }
    }

    getSvgElement(): SVGElement | null {
        return this.svgElement;
    }

    getSvgWidth(): number {
        if (!this.svgElement) return 80000;
        const w = this.svgElement.getAttribute('width');
        const viewBox = this.svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/\s+/);
            if (parts.length >= 3) return parseFloat(parts[2]) || 80000;
        }
        return parseFloat(w || '80000');
    }

    getSvgHeight(): number {
        if (!this.svgElement) return 40000;
        const h = this.svgElement.getAttribute('height');
        const viewBox = this.svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/\s+/);
            if (parts.length >= 4) return parseFloat(parts[3]) || 40000;
        }
        return parseFloat(h || '40000');
    }

    extractElementsInBBox(x: number, y: number, w: number, h: number): string {
        if (!this.svgDoc || !this.svgElement) return '';

        // Get all elements
        const allElements = this.svgElement.querySelectorAll('*');
        const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // Copy attributes from original SVG
        const attrs = this.svgElement.attributes;
        for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name !== 'width' && attrs[i].name !== 'height') {
                container.setAttribute(attrs[i].name, attrs[i].value);
            }
        }
        container.setAttribute('width', w.toString());
        container.setAttribute('height', h.toString());
        container.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

        // Find elements that intersect the bbox
        allElements.forEach(el => {
            const rect = el.getBoundingClientRect?.();
            // Simple intersection check using getBBox if available
            try {
                const bbox = (el as SVGGraphicsElement).getBBox?.();
                if (bbox) {
                    if (bbox.x + bbox.width > x && bbox.x < x + w &&
                        bbox.y + bbox.height > y && bbox.y < y + h) {
                        const clone = el.cloneNode(true) as Element;
                        container.appendChild(clone);
                    }
                }
            } catch (e) {
                // Some elements might not have getBBox
            }
        });

        return container.outerHTML;
    }
}