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
    
    // Make the entire group draggable with 1:1 movement
    group.onMouseDrag = function(event) {
        // Use direct event delta for 1:1 movement
        this.translate(event.delta);
        
        // Update all label positions relative to rectangle
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
