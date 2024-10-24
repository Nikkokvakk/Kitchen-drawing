window.onload = function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Configuration
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapThreshold: 20,
        scale: 1,
        guideLineColors: {
            cornerToCorner: 'red',
            cornerToEdge: 'green',
            edgeToEdge: 'black'
        }
    };

    // Guide line and measurement display
    let guideLine = null;
    let guideText = null;
    let snapPoints = null;

    function createGuideLine(start, end, type) {
        // Remove existing guide elements
        if (guideLine) guideLine.remove();
        if (guideText) guideText.remove();

        // Create new guide line
        guideLine = new paper.Path.Line({
            from: start,
            to: end,
            strokeColor: config.guideLineColors[type],
            strokeWidth: 1,
            dashArray: null
        });

        // Calculate distance
        const distance = start.getDistance(end);
        const roundedDistance = Math.round(distance);

        // Create text with background
        const midPoint = start.add(end).divide(2);
        const background = new paper.Path.Rectangle({
            center: midPoint,
            size: [55, 20],
            fillColor: 'white',
            opacity: 0.8
        });

        guideText = new paper.PointText({
            point: midPoint,
            content: `${roundedDistance} mm`,
            fillColor: 'black',
            fontSize: 12,
            justification: 'center'
        });

        // Center the text vertically
        guideText.position = midPoint;
        background.position = guideText.position;

        // Group text and background
        guideText = new paper.Group([background, guideText]);
        
        return { line: guideLine, text: guideText };
    }

    function removeGuideElements() {
        if (guideLine) {
            guideLine.remove();
            guideLine = null;
        }
        if (guideText) {
            guideText.remove();
            guideText = null;
        }
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

    function findSnapPoints(activeGroup, otherGroup) {
        const activeRect = activeGroup.children[0];
        const otherRect = otherGroup.children[0];
        const activeBounds = activeRect.bounds;
        const otherBounds = otherRect.bounds;

        // Get corners of both rectangles
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
        let snapType = null;

        // Check corner-to-corner
        for (let activeCorner of activeCorners) {
            for (let otherCorner of otherCorners) {
                const distance = activeCorner.getDistance(otherCorner);
                if (distance < minDistance && distance < config.snapThreshold) {
                    minDistance = distance;
                    closestPoints = {
                        from: activeCorner,
                        to: otherCorner
                    };
                    snapType = 'cornerToCorner';
                }
            }
        }

        // If no corner-to-corner found, check corner-to-edge
        if (!closestPoints) {
            const otherEdges = [
                { start: otherBounds.topLeft, end: otherBounds.topRight },
                { start: otherBounds.topRight, end: otherBounds.bottomRight },
                { start: otherBounds.bottomRight, end: otherBounds.bottomLeft },
                { start: otherBounds.bottomLeft, end: otherBounds.topLeft }
            ];

            for (let activeCorner of activeCorners) {
                for (let edge of otherEdges) {
                    const nearestPoint = getNearestPointOnLine(activeCorner, edge.start, edge.end);
                    const distance = activeCorner.getDistance(nearestPoint);
                    if (distance < minDistance && distance < config.snapThreshold) {
                        minDistance = distance;
                        closestPoints = {
                            from: activeCorner,
                            to: nearestPoint
                        };
                        snapType = 'cornerToEdge';
                    }
                }
            }
        }

        return { points: closestPoints, type: snapType, distance: minDistance };
    }

    function createRectangle(width, height) {
        console.log('Creating rectangle:', width, height); // Debug log

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

        // Create labels for all four sides
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

        // Group rectangle with all labels
        const group = new paper.Group([rectangle, topLabel, rightLabel, bottomLabel, leftLabel]);
        
        // Store original position for potential snap cancellation
        let originalPosition = null;
        let potentialSnap = null;

        group.onMouseDown = function(event) {
            originalPosition = this.position.clone();
            removeGuideElements();
        };
        
        group.onMouseDrag = function(event) {
            this.translate(event.delta);
            updateLabels(this);

            if (config.snapEnabled) {
                // Check for potential snap points with other rectangles
                let closestSnap = null;
                paper.project.activeLayer.children.forEach(otherGroup => {
                    if (otherGroup !== this && otherGroup instanceof paper.Group) {
                        const snapResult = findSnapPoints(this, otherGroup);
                        if (snapResult.points && (!closestSnap || snapResult.distance < closestSnap.distance)) {
                            closestSnap = snapResult;
                        }
                    }
                });

                // Update guide line if snap points found
                if (closestSnap && closestSnap.points) {
                    createGuideLine(closestSnap.points.from, closestSnap.points.to, closestSnap.type);
                    potentialSnap = closestSnap;
                } else {
                    removeGuideElements();
                    potentialSnap = null;
                }
            }
        };

        group.onMouseUp = function(event) {
            if (config.snapEnabled && potentialSnap && potentialSnap.points) {
                const confirmed = confirm("Snap together?");
                if (confirmed) {
                    // Calculate and apply the snap translation
                    const translation = potentialSnap.points.to.subtract(potentialSnap.points.from);
                    this.translate(translation);
                    updateLabels(this);
                }
                removeGuideElements();
                potentialSnap = null;
            }
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
        removeGuideElements();
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
    });
};
