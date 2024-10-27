window.onload = function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Configuration
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        panEnabled: false,
        snapThreshold: 25,
        scale: 1,
        defaultWidth: 4000,
        minZoom: 0.25,
        maxZoom: 4,
        controlPanelOffset: 100 // Half of control panel width
    };

    let initialZoom = null;
    let lastPinchDistance = null;
    let isPanning = false;
    let lastPoint = null;

    // Initialize zoom based on default visible width
    function initializeZoom() {
        const viewWidth = paper.view.viewSize.width;
        initialZoom = viewWidth / config.defaultWidth;
        paper.view.zoom = initialZoom;
        paper.view.center = new paper.Point(config.controlPanelOffset, 0);
        updateWidthDisplay();
    }

    function updateWidthDisplay() {
        const visibleWidth = Math.round(paper.view.viewSize.width / paper.view.zoom);
        document.getElementById('visibleWidth').textContent = `Width visible: ${visibleWidth} mm`;
        document.getElementById('zoomSlider').value = (paper.view.zoom / initialZoom) * 100;
    }

    // Update cursor based on pan mode
    function updateCursor() {
        const canvas = document.getElementById('canvas');
        canvas.style.cursor = config.panEnabled ? (isPanning ? 'grabbing' : 'grab') : 'default';
    }

    // Toggle button active state
    function updateButtonState(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    // Guide line
    let guideLine = null;
    let currentSnapPoints = null;

    function clearGuideLine() {
        if (guideLine) {
            guideLine.remove();
            guideLine = null;
        }
        currentSnapPoints = null;
    }

    [Previous functions remain the same until the event listeners...]

    // Zoom Controls
    const zoomSlider = document.getElementById('zoomSlider');
    zoomSlider.addEventListener('input', function(e) {
        if (initialZoom) {
            const newZoom = (this.value / 100) * initialZoom;
            const viewCenter = paper.view.center;
            paper.view.zoom = newZoom;
            paper.view.center = viewCenter;
        }
    });

    zoomSlider.addEventListener('change', function() {
        updateWidthDisplay();
    });

    document.getElementById('resetView').addEventListener('click', function() {
        initializeZoom();
    });

    document.getElementById('zoomFit').addEventListener('click', function() {
        if (paper.project.activeLayer.children.length === 0) return;
        
        const bounds = paper.project.activeLayer.bounds;
        const padding = 50;
        
        const scale = Math.min(
            (paper.view.viewSize.width - padding * 2) / bounds.width,
            (paper.view.viewSize.height - padding * 2) / bounds.height
        );
        
        paper.view.scale(scale);
        // Adjust center point to account for control panel
        paper.view.center = new paper.Point(
            bounds.center.x + config.controlPanelOffset,
            bounds.center.y
        );
        updateWidthDisplay();
    });

    // Pan mode
    document.getElementById('togglePan').addEventListener('click', function() {
        config.panEnabled = !config.panEnabled;
        this.textContent = config.panEnabled ? 'Disable Pan' : 'Enable Pan';
        updateButtonState('togglePan', config.panEnabled);
        updateCursor();
    });

    // Mouse/Touch event handling
    let isZooming = false;

    paper.view.element.addEventListener('mousedown', function(event) {
        if (config.panEnabled) {
            isPanning = true;
            lastPoint = new paper.Point(event.clientX, event.clientY);
            updateCursor();
        }
    });

    paper.view.element.addEventListener('mousemove', function(event) {
        if (isPanning && config.panEnabled) {
            const newPoint = new paper.Point(event.clientX, event.clientY);
            const delta = newPoint.subtract(lastPoint).divide(paper.view.zoom);
            paper.view.center = paper.view.center.subtract(delta);
            lastPoint = newPoint;
        }
    });

    paper.view.element.addEventListener('mouseup', function() {
        isPanning = false;
        updateCursor();
    });

    // Touch events for pinch-zoom
    paper.view.element.addEventListener('touchstart', function(event) {
        if (event.touches.length === 2) {
            isZooming = true;
            lastPinchDistance = getPinchDistance(event);
        } else if (config.panEnabled) {
            isPanning = true;
            lastPoint = new paper.Point(event.touches[0].clientX, event.touches[0].clientY);
        }
    }, false);

    paper.view.element.addEventListener('touchmove', function(event) {
        if (event.touches.length === 2 && isZooming) {
            event.preventDefault();
            const pinchDistance = getPinchDistance(event);
            
            if (lastPinchDistance) {
                const pinchScale = pinchDistance / lastPinchDistance;
                const pinchCenter = new paper.Point(
                    (event.touches[0].clientX + event.touches[1].clientX) / 2,
                    (event.touches[0].clientY + event.touches[1].clientY) / 2
                );
                
                // Convert screen coordinates to view coordinates
                const viewPosition = paper.view.viewToProject(pinchCenter);
                
                const newZoom = paper.view.zoom * pinchScale;
                if (newZoom >= config.minZoom * initialZoom && newZoom <= config.maxZoom * initialZoom) {
                    const beta = paper.view.zoom / newZoom;
                    const pc = viewPosition;
                    const pc2 = viewPosition;
                    paper.view.zoom = newZoom;
                    paper.view.center = pc2.subtract(pc.subtract(paper.view.center).multiply(beta));
                }
            }
            lastPinchDistance = pinchDistance;
        } else if (isPanning && config.panEnabled && event.touches.length === 1) {
            const newPoint = new paper.Point(event.touches[0].clientX, event.touches[0].clientY);
            const delta = newPoint.subtract(lastPoint).divide(paper.view.zoom);
            paper.view.center = paper.view.center.subtract(delta);
            lastPoint = newPoint;
        }
    }, false);

    paper.view.element.addEventListener('touchend', function() {
        isZooming = false;
        isPanning = false;
        lastPinchDistance = null;
        updateWidthDisplay();
        updateCursor();
    }, false);

    function getPinchDistance(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    // Existing UI Controls with updated button states
    document.getElementById('toggleSnap').addEventListener('click', function() {
        config.snapEnabled = !config.snapEnabled;
        this.textContent = config.snapEnabled ? 'Disable Snap' : 'Enable Snap';
        updateButtonState('toggleSnap', config.snapEnabled);
        clearGuideLine();
    });

    document.getElementById('toggleMeasure').addEventListener('click', function() {
        config.measureEnabled = !config.measureEnabled;
        this.textContent = config.measureEnabled ? 'Hide Measurements' : 'Show Measurements';
        updateButtonState('toggleMeasure', config.measureEnabled);
        
        paper.project.activeLayer.children.forEach(group => {
            if (group instanceof paper.Group) {
                for (let i = 1; i < group.children.length; i++) {
                    if (group.children[i] instanceof paper.PointText) {
                        group.children[i].visible = config.measureEnabled;
                    }
                }
            }
        });
        paper.view.draw();
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        paper.view.update();
        updateWidthDisplay();
    });

    // Initialize
    initializeZoom();
    updateCursor();
};
