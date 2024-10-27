window.onload = function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Configuration
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapThreshold: 25,
        scale: 1,
        defaultWidth: 4000, // Default visible width in mm
        minZoom: 0.25,
        maxZoom: 4
    };

    let initialZoom = null;
    let lastPinchDistance = null;

    // Initialize zoom based on default visible width
    function initializeZoom() {
        const viewWidth = paper.view.viewSize.width;
        initialZoom = viewWidth / config.defaultWidth;
        paper.view.zoom = initialZoom;
        paper.view.center = new paper.Point(0, 0);
        updateWidthDisplay();
    }

    function updateWidthDisplay() {
        const visibleWidth = Math.round(paper.view.viewSize.width / paper.view.zoom);
        document.getElementById('visibleWidth').textContent = `Width visible: ${visibleWidth} mm`;
        document.getElementById('zoomSlider').value = (paper.view.zoom / initialZoom) * 100;
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

    function createGuideLine(start, end) {
        clearGuideLine();
        guideLine = new paper.Path.Line({
            from: start,
            to: end,
            strokeColor: 'red',
            strokeWidth: 2
        });
        return guideLine;
    }

    function findClosestCorners(activeGroup, otherGroup) {
        const activeRect = activeGroup.children[0];
        const otherRect = otherGroup.children[0];
        const activeBounds = activeRect.bounds;
        const otherBounds = otherRect.bounds;

        const activeCorners = [
            activeBounds.topLeft,
            activeBounds.topRight,
            activeBounds.bottomLeft,
            activeBounds.bottomRight
        ];

        const otherCorners = [
            otherBounds.topLeft,
            otherBounds.topRight,
            otherBounds.bottomLeft,
            otherBounds.bottomRight
        ];

        let minDistance = Infinity;
        let closestPoints = null;

        for (let activeCorner of activeCorners) {
            for (let otherCorner of otherCorners) {
                const distance = activeCorner.getDistance(otherCorner);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoints = {
                        from: activeCorner,
                        to: otherCorner,
                        distance: distance,
                        translation: otherCorner.subtract(activeCorner)
                    };
                }
            }
        }

        return minDistance <= config.snapThreshold ? closestPoints : null;
    }

    function createRectangle(width, height) {
        const center = paper.view.center;
        const topLeft = new paper.Point(
            center.x - width/2,
            center.y - height/2
        );

        const rectangle = new paper.Path.Rectangle({
            point: topLeft,
            size: new paper.Size(width, height),
            strokeColor: 'black',
            fillColor: new paper.Color(0, 0.5, 1, 0.3),
            strokeWidth: 2,
            strokeScaleEnabled: false
        });

        // Create labels
        const topLabel = new paper.PointText({
            point: new paper.Point(center.x, center.y - height/2 - 10),
            content: width + ' mm',
            justification: 'center',
            fillColor: 'black',
            fontSize: 14
        });

        const rightLabel = new paper.PointText({
            point: new paper.Point(center.x + width/2 + 10, center.y),
            content: height + ' mm',
            justification: 'left',
            fillColor: 'black',
            fontSize: 14
        });

        const bottomLabel = new paper.PointText({
            point: new paper.Point(center.x, center.y + height/2 + 20),
            content: width + ' mm',
            justification: 'center',
            fillColor: 'black',
            fontSize: 14
        });

        const leftLabel = new paper.PointText({
            point: new paper.Point(center.x - width/2 - 10, center.y),
            content: height + ' mm',
            justification: 'right',
            fillColor: 'black',
            fontSize: 14
        });

        const group = new paper.Group([rectangle, topLabel, rightLabel, bottomLabel, leftLabel]);
        
        group.onMouseDown = function(event) {
            clearGuideLine();
        };
        
        group.onMouseDrag = function(event) {
            this.translate(event.delta);
            updateLabels(this);

            if (config.snapEnabled) {
                clearGuideLine();
                currentSnapPoints = null;

                paper.project.activeLayer.children.forEach(otherGroup => {
                    if (otherGroup !== this && otherGroup instanceof paper.Group) {
                        const snapPoints = findClosestCorners(this, otherGroup);
                        if (snapPoints) {
                            createGuideLine(snapPoints.from, snapPoints.to);
                            currentSnapPoints = snapPoints;
                        }
                    }
                });
            }
        };

        group.onMouseUp = function(event) {
            if (config.snapEnabled && currentSnapPoints) {
                if (confirm('Snap corners together?')) {
                    this.translate(currentSnapPoints.translation);
                    updateLabels(this);
                }
            }
            clearGuideLine();
        };

        function updateLabels(group) {
            const rect = group.children[0];
            const [topLabel, rightLabel, bottomLabel, leftLabel] = group.children.slice(1);

            topLabel.point = new paper.Point(
                rect.bounds.center.x,
                rect.bounds.top - 10
            );
            
            rightLabel.point = new paper.Point(
                rect.bounds.right + 10,
                rect.bounds.center.y
            );
            
            bottomLabel.point = new paper.Point(
                rect.bounds.center.x,
                rect.bounds.bottom + 20
            );
            
            leftLabel.point = new paper.Point(
                rect.bounds.left - 10,
                rect.bounds.center.y
            );

            topLabel.visible = config.measureEnabled;
            rightLabel.visible = config.measureEnabled;
            bottomLabel.visible = config.measureEnabled;
            leftLabel.visible = config.measureEnabled;
        }

        paper.project.activeLayer.addChild(group);
        paper.view.draw();
        return group;
    }

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
        const padding = 50; // pixels of padding around content
        
        const scale = Math.min(
            (paper.view.viewSize.width - padding * 2) / bounds.width,
            (paper.view.viewSize.height - padding * 2) / bounds.height
        );
        
        paper.view.scale(scale);
        paper.view.center = bounds.center;
        updateWidthDisplay();
    });

    // Pinch-zoom handling
    paper.view.element.addEventListener('touchstart', function(event) {
        if (event.touches.length === 2) {
            lastPinchDistance = getPinchDistance(event);
        }
    }, false);

    paper.view.element.addEventListener('touchmove', function(event) {
        if (event.touches.length === 2) {
            event.preventDefault();
            const pinchDistance = getPinchDistance(event);
            
            if (lastPinchDistance) {
                const pinchScale = pinchDistance / lastPinchDistance;
                const viewCenter = paper.view.center;
                const pinchCenter = new paper.Point(
                    (event.touches[0].clientX + event.touches[1].clientX) / 2,
                    (event.touches[0].clientY + event.touches[1].clientY) / 2
                );
                
                const newZoom = paper.view.zoom * pinchScale;
                if (newZoom >= config.minZoom * initialZoom && newZoom <= config.maxZoom * initialZoom) {
                    paper.view.zoom = newZoom;
                    paper.view.center = viewCenter;
                }
            }
            lastPinchDistance = pinchDistance;
        }
    }, false);

    paper.view.element.addEventListener('touchend', function() {
        lastPinchDistance = null;
        updateWidthDisplay();
    }, false);

    function getPinchDistance(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    // Existing UI Controls
    document.getElementById('createRect').addEventListener('click', function() {
        const width = parseFloat(document.getElementById('width').value);
        const height = parseFloat(document.getElementById('height').value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Please enter valid dimensions.');
            return;
        }

        createRectangle(width, height);
    });

    document.getElementById('toggleSnap').addEventListener('click', function() {
        config.snapEnabled = !config.snapEnabled;
        this.textContent = config.snapEnabled ? 'Disable Snap' : 'Enable Snap';
        clearGuideLine();
    });

    document.getElementById('toggleMeasure').addEventListener('click', function() {
        config.measureEnabled = !config.measureEnabled;
        this.textContent = config.measureEnabled ? 'Hide Measurements' : 'Show Measurements';
        
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

    // Initialize zoom on startup
    initializeZoom();
};
