paper.install(window);
window.onload = function() {
    paper.setup('canvas');

    const config = {
        snapEnabled: false,
        measureEnabled: true,
        snapDistance: 20,
        scale: 1 // 1 pixel = 1mm
    };

    function createRectangle(width, height) {
        const rectangle = new Path.Rectangle({
            point: view.center.subtract(new Point(width/2, height/2)),
            size: new Size(width, height),
            strokeColor: 'black',
            fillColor: new Color(0, 0.5, 1, 0.5),
            strokeWidth: 2
        });

        // Add measurement labels
        const labels = new Group();
        
        // Width label
        const widthLabel = new PointText({
            point: rectangle.bounds.center.add(new Point(0, -height/2 - 20)),
            content: width + ' mm',
            justification: 'center',
            fillColor: 'black',
            fontSize: 14
        });
        
        // Height label
        const heightLabel = new PointText({
            point: rectangle.bounds.center.add(new Point(width/2 + 20, 0)),
            content: height + ' mm',
            justification: 'left',
            fillColor: 'black',
            fontSize: 14
        });

        labels.addChildren([widthLabel, heightLabel]);
        labels.visible = config.measureEnabled;

        // Make rectangle interactive
        rectangle.onMouseDrag = function(event) {
            this.position = this.position.add(event.delta);
            updateLabels();
            if (config.snapEnabled) checkSnap();
        };

        function updateLabels() {
            widthLabel.point = rectangle.bounds.center.add(new Point(0, -height/2 - 20));
            heightLabel.point = rectangle.bounds.center.add(new Point(width/2 + 20, 0));
        }

        function checkSnap() {
            // Add snapping logic here
        }

        return { rectangle, labels };
    }

    // UI Controls
    document.getElementById('addRect').onclick = function() {
        const width = Number(document.getElementById('width').value);
        const height = Number(document.getElementById('height').value);
        if (width > 0 && height > 0) {
            createRectangle(width, height);
        }
    };

    document.getElementById('toggleSnap').onclick = function() {
        config.snapEnabled = !config.snapEnabled;
        this.textContent = config.snapEnabled ? 'Slå av snap' : 'Slå på snap';
    };

    document.getElementById('toggleMeasure').onclick = function() {
        config.measureEnabled = !config.measureEnabled;
        this.textContent = config.measureEnabled ? 'Skjul mål' : 'Vis mål';
        project.activeLayer.children.forEach(child => {
            if (child instanceof Group) {
                child.visible = config.measureEnabled;
            }
        });
    };

    view.draw();
};
