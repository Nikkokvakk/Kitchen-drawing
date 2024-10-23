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

    function createRectangle(width, height) {
        console.log('Creating rectangle:', width, height); // Debug log

        // Convert measurements to numbers and validate
        width = Number(width);
        height = Number(height);
        
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert('Vennligst skriv inn gyldige mål');
            return;
        }

        // Create the rectangle centered on the screen
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

        // Make rectangle draggable
        rectangle.onMouseDown = function(event) {
            console.log('Rectangle clicked');
        };

        rectangle.onMouseDrag = function(event) {
            this.position = this.position.add(event.delta);
        };

        // Add measurements
        const widthLabel = new paper.PointText({
            point: new paper.Point(center.x, center.y - height/2 - 10),
            content: width + ' mm',
            justification: 'center',
            fillColor: 'black',
            fontSize: 14
        });

        const heightLabel = new paper.PointText({
            point: new paper.Point(center.x + width/2 + 10, center.y),
            content: height + ' mm',
            justification: 'left',
            fillColor: 'black',
            fontSize: 14
        });

        // Group rectangle with its labels
        const group = new paper.Group([rectangle, widthLabel, heightLabel]);
        
        // Make the entire group draggable
        group.onMouseDrag = function(event) {
            this.position = this.position.add(event.delta);
        };

        // Ensure we see the new elements
        paper.view.draw();
        console.log('Rectangle created');
    }

    // UI Controls
    document.getElementById('addRect').addEventListener('click', function() {
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        console.log('Button clicked:', width, height); // Debug log
        createRectangle(width, height);
    });

    document.getElementById('toggleSnap').addEventListener('click', function() {
        config.snapEnabled = !config.snapEnabled;
        this.textContent = config.snapEnabled ? 'Slå av snap' : 'Slå på snap';
    });

    document.getElementById('toggleMeasure').addEventListener('click', function() {
        config.measureEnabled = !config.measureEnabled;
        this.textContent = config.measureEnabled ? 'Skjul mål' : 'Vis mål';
        // Update visibility of all measurements
        paper.project.activeLayer.children.forEach(child => {
            if (child instanceof paper.Group) {
                child.children.forEach(item => {
                    if (item instanceof paper.PointText) {
                        item.visible = config.measureEnabled;
                    }
                });
            }
        });
    });

    // Handle window resize
    window.onresize = function() {
        paper.view.update();
    };
});
