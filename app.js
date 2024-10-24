window.onload = function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Configuration
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapThreshold: 50, // Increased to 50px
        scale: 1,
        guideLineColors: {
            cornerToCorner: 'red',
            cornerToEdge: 'green',
            edgeToEdge: 'black'
        }
    };

    // Guide lines array to store multiple lines
    let guideLines = [];
    let currentSnaps = [];

    function clearGuideLines() {
        guideLines.forEach(line => line.remove());
        guideLines = [];
        currentSnaps = [];
    }

    function createGuideLine(start, end, type) {
        const line = new paper.Path.Line({
            from: start,
            to: end,
            strokeColor: config.guideLineColors[type],
            strokeWidth: 2,
            strokeCap: 'round'
        });
        guideLines.push(line);
        return line;
    }

    function findAllSnapPoints(activeGroup, otherGroup) {
        const snapPoints = [];
        const activeRect = activeGroup.children[0];
        const otherRect = otherGroup.children[0];
        const activeBounds = activeRect.bounds;
        const otherBounds = otherRect.bounds;

        // Get corners
        const activeCorners = [
            { point: activeBounds.topLeft, name: 'topLeft' },
            { point: activeBounds.topRight, name: 'topRight' },
            { point: activeBounds.bottomLeft, name: 'bottomLeft' },
            { point: activeBounds.bottomRight, name: 'bottomRight' }
        ];

        const otherCorners = [
            { point: otherBounds.topLeft, name: 'topLeft' },
            { point: otherBounds.topRight, name: 'topRight' },
            { point: otherBounds.bottomLeft, name: 'bottomLeft' },
            { point: otherBounds.bottomRight, name: 'bottomRight' }
        ];

        // Corner to Corner snaps
        for (let activeCorner of activeCorners) {
            for (let otherCorner of otherCorners) {
                const distance = activeCorner.point.getDistance(otherCorner.point);
                if (distance < config.snapThreshold) {
                    snapPoints.push({
                        type: 'cornerToCorner',
                        from: activeCorner.point,
                        to: otherCorner.point,
                        distance: distance,
                        translation: otherCorner.point.subtract(activeCorner.point)
                    });
                }
            }
        }

        // Corner to Edge snaps
        const otherEdges = [
            { start: otherBounds.topLeft, end: otherBounds.topRight, name: 'top' },
            { start: otherBounds.topRight, end: otherBounds.bottomRight, name: 'right' },
            { start: otherBounds.bottomRight, end: otherBounds.bottomLeft, name: 'bottom' },
            { start: otherBounds.bottomLeft, end: otherBounds.topLeft, name: 'left' }
        ];

        for (let activeCorner of activeCorners) {
            for (let edge of otherEdges) {
                const nearestPoint = getNearestPointOnLine(activeCorner.point, edge.start, edge.end);
                const distance = activeCorner.point.getDistance(nearestPoint);
                if (distance < config.snapThreshold) {
                    snapPoints.push({
                        type: 'cornerToEdge',
                        from: activeCorner.point,
                        to: nearestPoint,
                        distance: distance,
                        translation: nearestPoint.subtract(activeCorner.point)
                    });
                }
            }
        }

        // Edge to Edge snaps
        const activeEdges = [
            { start: activeBounds.topLeft, end: activeBounds.topRight, name: 'top' },
            { start: activeBounds.topRight, end: activeBounds.bottomRight, name: 'right' },
            { start: activeBounds.bottomRight, end: activeBounds.bottomLeft, name: 'bottom' },
            { start: activeBounds.bottomLeft, end: activeBounds.topLeft, name: 'left' }
        ];

        for (let activeEdge of activeEdges) {
            for (let otherEdge of otherEdges) {
                const distance = Math.min(
                    activeEdge.start.getDistance(otherEdge.start),
                    activeEdge.start.getDistance(otherEdge.end),
                    activeEdge.end.getDistance(otherEdge.start),
                    activeEdge.end.getDistance(otherEdge.end)
                );
                if (distance < config.snapThreshold) {
                    snapPoints.push({
                        type: 'edgeToEdge',
                        from: activeEdge.start,
                        to: otherEdge.start,
                        distance: distance,
                        translation: getEdgeAlignment(activeEdge, otherEdge)
                    });
                }
            }
        }

        return snapPoints;
    }

    function getEdgeAlignment(edge1, edge2) {
        // Calculate translation to align edges
        const translation = edge2.start.subtract(edge1.start);
        if (edge1.name === edge2.name) {
            return translation;
        }
        // Handle perpendicular edges
        return translation;
    }

    function getNearestPointOnLine(p, lineStart, lineEnd) {
        const line = lineEnd.subtract(lineStart);
        const len = line.length;
        const lineNorm = line.divide(len);
        const projection = p.subtract(lineStart).dot(lineNorm);
        
        if (projection <= 0) return lineStart;
        if (projection >= len) return lineEnd;
        
        return lineStart.add(lineNorm.multiply(projection));
    }

    function showSnapDialog(snaps) {
        let options = '';
        const availableTypes = new Set(snaps.map(snap => snap.type));
        
        if (availableTypes.has('cornerToCorner')) {
            options += '🔴 Corner to Corner\n';
        }
        if (availableTypes.has('cornerToEdge')) {
            options += '🟢 Corner to Edge\n';
        }
        if (availableTypes.has('edgeToEdge')) {
            options += '⚫ Edge to Edge\n';
        }
        
        const choice = window.prompt(
            'Choose snap type:\n\n' + options + '\nOr press Cancel',
            ''
        );

        if (choice === null) return null;
        
        const lowerChoice = choice.toLowerCase().trim();
        if (lowerChoice.includes('corner to corner')) return 'cornerToCorner';
        if (lowerChoice.includes('corner to edge')) return 'cornerToEdge';
        if (lowerChoice.includes('edge to edge')) return 'edgeToEdge';
        return null;
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
        
        let originalPosition = null;

        group.onMouseDown = function(event) {
            originalPosition = this.position.clone();
            clearGuideLines();
        };
        
        group.onMouseDrag = function(event) {
            this.translate(event.delta);
            updateLabels(this);

            if (config.snapEnabled) {
                clearGuideLines();
                currentSnaps = [];

                paper.project.activeLayer.children.forEach(otherGroup => {
                    if (otherGroup !== this && otherGroup instanceof paper.Group) {
                        const snapResults = findAllSnapPoints(this, otherGroup);
                        snapResults.forEach(snap => {
                            createGuideLine(snap.from, snap.to, snap.type);
                            currentSnaps.push(snap);
                        });
                    }
                });
            }
        };

        group.onMouseUp = function(event) {
            if (config.snapEnabled && currentSnaps.length > 0) {
                const snapType = showSnapDialog(currentSnaps);
                if (snapType) {
                    const selectedSnap = currentSnaps.find(snap => snap.type === snapType);
                    if (selectedSnap) {
                        this.translate(selectedSnap.translation);
                        updateLabels(this);
                    }
                }
            }
            clearGuideLines();
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

    // UI Controls
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
        clearGuideLines();
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

    window.addEventListener('resize', function() {
        paper.view.update();
    });
};
