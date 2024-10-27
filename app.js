window.onload = function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Configuration
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapThreshold: 25,
        scale: 1
    };

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

        // Get corners
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

        // Find closest corner pair
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

    window.addEventListener('resize', function() {
        paper.view.update();
    });
};
