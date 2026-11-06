import { setupP5, loadSvgFromString, toggleGrid, clearSelections, getSelections, removeSelection } from './sketch';
import { SelectedCell } from './types';

// DOM elements
const canvasContainer = document.getElementById('canvasContainer')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const loadFileBtn = document.getElementById('loadFileBtn')!;
const loadUrlBtn = document.getElementById('loadUrlBtn')!;
const urlInput = document.getElementById('urlInput') as HTMLInputElement;
const toggleGridBtn = document.getElementById('toggleGridBtn')!;
const gridStatus = document.getElementById('gridStatus')!;
const clearSelectionsBtn = document.getElementById('clearSelectionsBtn')!;
const selectionList = document.getElementById('selectionList')!;
const selectionPreview = document.getElementById('selectionPreview')!;

// Selected cell display
function onSelection(cell: SelectedCell) {
    // Add to list
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `
        <span><strong>${cell.id}</strong> [${cell.row},${cell.col}]</span>
        <button class="copy-btn" data-id="${cell.id}">📋 Copy</button>
    `;
    selectionList.appendChild(item);
    
    // Show preview
    selectionPreview.textContent = cell.svgContent;
    
    // Copy button handler
    item.querySelector('.copy-btn')?.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) {
            const selections = getSelections();
            const found = selections.find(s => s.id === id);
            if (found) {
                try {
                    await navigator.clipboard.writeText(found.svgContent);
                    const btn = e.target as HTMLElement;
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
                } catch (err) {
                    alert('Failed to copy. Try selecting the text manually.');
                }
            }
        }
    });
}

// Initialize p5
setupP5(canvasContainer, onSelection);

// File load
loadFileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (loadSvgFromString(content)) {
            alert('✅ SVG loaded successfully!');
            gridStatus.textContent = 'Off';
            gridStatus.className = '';
        } else {
            alert('❌ Failed to load SVG. Check file format.');
        }
    };
    reader.readAsText(file);
    fileInput.value = '';
});

// URL load
loadUrlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        const content = await response.text();
        if (loadSvgFromString(content)) {
            alert('✅ SVG loaded successfully!');
            gridStatus.textContent = 'Off';
            gridStatus.className = '';
        } else {
            alert('❌ Failed to load SVG from URL.');
        }
    } catch (err) {
        alert('❌ Error loading URL: ' + (err as Error).message);
    }
});

// Toggle grid
toggleGridBtn.addEventListener('click', () => {
    const state = toggleGrid();
    gridStatus.textContent = state ? 'On' : 'Off';
    gridStatus.className = state ? 'on' : '';
});

// Clear selections
clearSelectionsBtn.addEventListener('click', () => {
    clearSelections();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        toggleGridBtn.click();
    }
    if (e.key === 'Escape') {
        clearSelectionsBtn.click();
    }
});