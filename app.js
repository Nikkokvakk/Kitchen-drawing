document.addEventListener('DOMContentLoaded', function() {
    // Initialize Paper.js
    paper.setup('canvas');
    
    // Set up some default values
    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapDistance: 20,
        scale: 1
    };

    // Test that Paper.js is working
    console.log('Paper.js initialized');

function checkSnap(activeGroup) {
    const snapThreshold = 10; // Distance for snap detection
    const cornerSnapThreshold = 15; // Slightly larger threshold for corner snapping
    const activeRect = activeGroup.children[0];
    const activeBounds = activeRect.bounds;
    let wasSnapped = false; // Track if snapping occurred

    paper.project.activeLayer.children.forEach(otherGroup => {
        if (otherGroup !== activeGroup && otherGroup instanceof paper.Group) {
            const otherRect = otherGroup.children[0];
            const otherBounds = otherRect.bounds;

            // Store original position before any snapping
            const originalPosition = activeGroup.position.clone();
            
            // Check corners first
            const corners = [
                { active: { x: activeBounds.left, y: activeBounds.top }, 
                  other: { x: otherBounds.right, y: otherBounds.bottom } },
                { active: { x: activeBounds.right, y: activeBounds.top }, 
                  other: { x: otherBounds.left, y: otherBounds.bottom } },
                { active: { x: activeBounds.left, y: activeBounds.bottom }, 
                  other: { x: otherBounds.right, y: otherBounds.top } },
                { active: { x: activeBounds.right, y: activeBounds.bottom }, 
                  other: { x: otherBounds.left, y: otherBounds.top } }
            ];

            // Check each corner
            for (let corner of corners) {
                const distance = Math.sqrt(
                    Math.pow(corner.active.x - corner.other.x, 2) + 
                    Math.pow(corner.active.y - corner.other.y, 2)
                );

                if (distance < cornerSnapThreshold) {
                    activeGroup.translate(new paper.Point(
                        corner.other.x - corner.active.x,
                        corner.other.y - corner.active.y
                    ));
                    wasSnapped = true;
                    return; // Exit after corner snap
                }
            }

            // If no corner snap, check edges
            if (!wasSnapped) {
                // Right to left
                if (Math.abs(activeBounds.right - otherBounds.left) < snapThreshold &&
                    activeBounds.top < otherBounds.bottom &&
                    activeBounds.bottom > otherBounds.top) {
                    activeGroup.translate(new paper.Point(
                        otherBounds.left - activeBounds.right,
                        0
                    ));
                    wasSnapped = true;
                }

                // Left to right
                if (Math.abs(activeBounds.left - otherBounds.right) < snapThreshold &&
                    activeBounds.top < otherBounds.bottom &&
                    activeBounds.bottom > otherBounds.top) {
                    activeGroup.translate(new paper.Point(
                        otherBounds.right - activeBounds.left,
                        0
                    ));
                    wasSnapped = true;
                }

                // Bottom to top
                if (Math.abs(activeBounds.bottom - otherBounds.top) < snapThreshold &&
                    activeBounds.left < otherBounds.right &&
                    activeBounds.right > otherBounds.left) {
                    activeGroup.translate(new paper.Point(
                        0,
                        otherBounds.top - activeBounds.bottom
                    ));
                    wasSnapped = true;
                }

                // Top to bottom
                if (Math.abs(activeBounds.top - otherBounds.bottom) < snapThreshold &&
                    activeBounds.left < otherBounds.right &&
                    activeBounds.right > otherBounds.left) {
                    activeGroup.translate(new paper.Point(
                        0,
                        otherBounds.bottom - activeBounds.top
                    ));
                    wasSnapped = true;
                }
            }

            // If we moved too fast and are now beyond threshold, cancel snap
            const currentPosition = activeGroup.position;
            const moveDistance = Math.sqrt(
                Math.pow(currentPosition.x - originalPosition.x, 2) +
                Math.pow(currentPosition.y - originalPosition.y, 2)
            );

            if (moveDistance > snapThreshold * 1.5) {
                activeGroup.position = originalPosition;
                wasSnapped = false;
            }
        }
    });

    return wasSnapped;
}
    function createRectangle(width, height) {
        console.log('Creating rectangle:', width, height);

        width = Number(width);
        height = Number(height);
        
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Vennligst skriv inn gyldige mål');
            return;
        }

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
            strokeWidth: 2
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
        
        // Make the entire group draggable
group.onMouseDrag = function(event) {
        const prevPosition = this.position.clone();
        this.translate(event.delta);
        
        if (config.snapEnabled) {
            const wasSnapped = checkSnap(this);
            // If we're moving fast enough, break out of snap
            if (wasSnapped && event.delta.length > config.snapDistance * 1.5) {
                this.position = prevPosition.add(event.delta);
            }
        }

        // Update all label positions
        topLabel.point = new paper.Point(
            rectangle.bounds.center.x,
            rectangle.bounds.top - 10
        );
        
        rightLabel.point = new paper.Point(
            rectangle.bounds.right + 10,
            rectangle.bounds.center.y
        );
        
        bottomLabel.point = new paper.Point(
            rectangle.bounds.center.x,
            rectangle.bounds.bottom + 20
        );
        
        leftLabel.point = new paper.Point(
            rectangle.bounds.left - 10,
            rectangle.bounds.center.y
        );
    };

        // Update positions when rectangle is resized or rotated
        rectangle.onChange = function() {
            topLabel.point = new paper.Point(
                this.bounds.center.x,
                this.bounds.top - 10
            );
            
            rightLabel.point = new paper.Point(
                this.bounds.right + 10,
                this.bounds.center.y
            );
            
            bottomLabel.point = new paper.Point(
                this.bounds.center.x,
                this.bounds.bottom + 20
            );
            
            leftLabel.point = new paper.Point(
                this.bounds.left - 10,
                this.bounds.center.y
            );
        };

        // Ensure we see the new elements
        paper.view.draw();
        console.log('Rectangle created');
    }

    // UI Controls
    document.getElementById('addRect').addEventListener('click', function() {
        const width = parseFloat(document.getElementById('width').value);
        const height = parseFloat(document.getElementById('height').value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Vennligst skriv inn gyldige verdier for bredde og høyde.');
            return;
        }

        createRectangle(width, height);
    });

    document.getElementById('toggleSnap').addEventListener('click', function() {
        config.snapEnabled = !config.snapEnabled;
        this.textContent = config.snapEnabled ? 'Slå av snap' : 'Slå på snap';
    });

    document.getElementById('toggleMeasure').addEventListener('click', function() {
        config.measureEnabled = !config.measureEnabled;
        this.textContent = config.measureEnabled ? 'Skjul mål' : 'Vis mål';
        paper.project.activeLayer.children.forEach(group => {
            if (group instanceof paper.Group) {
                group.children.forEach(child => {
                    if (child instanceof paper.PointText) {
                        child.visible = config.measureEnabled;
                    }
                });
            }
        });
        paper.view.draw();
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        paper.view.update();
    });
});
