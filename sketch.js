let shapes = [];
let draggableShapes = [];
let selectedShape = null;
let zoomFactor = 1;
let zoomingOut = false;
let newShapesAdded = false;

function setup() {
  createCanvas(800, 600);

  // Formas fijas en el espacio
  shapes.push(new FixedShape(300, 300, 'rect', 100));
  shapes.push(new FixedShape(500, 300, 'circle', 50));
  shapes.push(new FixedShape(400, 500, 'triangle', 80));

  // Formas arrastrables con rotaciones iniciales
  draggableShapes.push(new DraggableShape(100, 100, 'rect', 100));
  draggableShapes.push(new DraggableShape(150, 150, 'circle', 50));
  draggableShapes.push(new DraggableShape(200, 200, 'triangle', 80, 45)); // Triángulo con ángulo inicial
}

function draw() {
  background(255);

  // Aplicar zoom si corresponde
  if (zoomingOut) {
    if (zoomFactor > 0.5) {
      zoomFactor -= 0.01;
    } else {
      zoomFactor = 0.5;
      zoomingOut = false;
      if (!newShapesAdded) {
        addNewShapes();
        newShapesAdded = true;
      }
    }
  }

  // Escalar para el efecto de zoom
  scale(zoomFactor);
  
  // Dibujar formas fijas
  shapes.forEach(shape => shape.display());

  // Dibujar y actualizar formas arrastrables
  draggableShapes.forEach(shape => {
    shape.update();
    shape.checkIfSnappedOrNear(shapes); // Verificar si encastró correctamente o si está cerca de otra forma incorrecta
  });

  // Si todas las piezas están encastradas correctamente, comenzar el zoom out
  if (allShapesSnapped() && !zoomingOut) {
    zoomingOut = true;
  }
}

function allShapesSnapped() {
  return draggableShapes.every(shape => shape.snapped);
}

function addNewShapes() {
  // Agregar nuevas formas fijas
  shapes.push(new FixedShape(300, 700, 'rect', 120));
  shapes.push(new FixedShape(500, 700, 'circle', 60));
  shapes.push(new FixedShape(400, 900, 'triangle', 100));

  // Agregar nuevas formas arrastrables
  draggableShapes.push(new DraggableShape(100, 600, 'rect', 120));
  draggableShapes.push(new DraggableShape(150, 600, 'circle', 60));
  draggableShapes.push(new DraggableShape(200, 600, 'triangle', 100, 45)); // Triángulo con ángulo inicial
}

function mousePressed() {
  draggableShapes.forEach(shape => {
    if (shape.isMouseOver() && !shape.snapped) {
      selectedShape = shape;
    }
  });
}

function mouseDragged() {
  if (selectedShape && !selectedShape.snapped) {
    selectedShape.x = mouseX / zoomFactor;
    selectedShape.y = mouseY / zoomFactor;
  }
}

function mouseReleased() {
  selectedShape = null;
}

function keyPressed() {
  if (selectedShape && !selectedShape.snapped) {
    if (keyCode === LEFT_ARROW) {
      selectedShape.angle -= 45;
    } else if (keyCode === RIGHT_ARROW) {
      selectedShape.angle += 45;
    }
  }
}

// Clase para formas fijas
class FixedShape {
  constructor(x, y, type, size) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
  }

  display() {
    push();
    translate(this.x, this.y);
    noFill();
    stroke(0);
    strokeWeight(2);

    if (this.type === 'rect') {
      rectMode(CENTER);
      rect(0, 0, this.size, this.size);
    } else if (this.type === 'circle') {
      ellipse(0, 0, this.size, this.size);
    } else if (this.type === 'triangle') {
      triangle(
        -this.size / 2, this.size / 2,
        this.size / 2, this.size / 2,
        0, -this.size / 2
      );
    }

    pop();
  }
}

// Clase para formas arrastrables
class DraggableShape {
  constructor(x, y, type, size, angle = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.angle = angle;
    this.snapped = false;
    this.incorrectlyNear = false;
    this.correctlyNear = false; // Nuevo estado
  }

  update() {
    push();
    translate(this.x, this.y);
    rotate(radians(this.angle));

    if (this.snapped) {
      fill(0, 255, 0); // Verde cuando está encastrada
    } else if (this.correctlyNear) {
      fill('#9ACD32'); // Amarillo verdoso cuando está cerca de encastrar
    } else if (this.incorrectlyNear) {
      fill(255, 255, 0); // Amarillo cuando está cerca pero mal
    } else {
      fill(255, 0, 0); // Rojo por defecto
    }
    stroke(0);
    strokeWeight(2);

    if (this.type === 'rect') {
      rectMode(CENTER);
      rect(0, 0, this.size, this.size);
    } else if (this.type === 'circle') {
      ellipse(0, 0, this.size, this.size);
    } else if (this.type === 'triangle') {
      triangle(
        -this.size / 2, this.size / 2,
        this.size / 2, this.size / 2,
        0, -this.size / 2
      );
    }

    pop();
  }

  checkIfSnappedOrNear(fixedShapes) {
    let nearAnyShape = false;
    this.correctlyNear = false; // Reiniciar estado

    for (let fixed of fixedShapes) {
      if (this.type === fixed.type) {
        let d = dist(this.x, this.y, fixed.x, fixed.y);
        if (d < 50) {
          if (this.angle % 360 === 0 && this.x === fixed.x && this.y === fixed.y) {
            this.snapped = true; // Encajó completamente
            this.incorrectlyNear = false;
            this.correctlyNear = false;
          } else {
            this.correctlyNear = true; // Está sobre la posición correcta pero con rotación incorrecta
            this.snapped = false;
          }
        } else {
          this.snapped = false;
        }
      } else {
        let d = dist(this.x, this.y, fixed.x, fixed.y);
        if (d < 50) {
          nearAnyShape = true; // Está cerca pero de la forma incorrecta
        }
      }
    }

    this.incorrectlyNear = nearAnyShape && !this.snapped && !this.correctlyNear;
  }

  isMouseOver() {
    let d = dist(mouseX / zoomFactor, mouseY / zoomFactor, this.x, this.y);
    return d < this.size / 2;
  }
}

