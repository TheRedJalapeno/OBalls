document.getElementById('startApp').addEventListener('click', function() {
  initApp();
  document.getElementById('startApp').style.display = 'none';
});

window.addEventListener('resize', function() {
  var viewportBounds = Physics.aabb(0, 0, viewportElement.clientWidth, viewportElement.clientHeight);
  // update any physics behaviors or properties that depend on these bounds
});


function initApp() {
  var canvas = document.getElementById('viewport');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  var viewport = document.getElementById('viewport');
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  
  var world = Physics();

  var viewportElement = document.getElementById('viewport');
  var viewportBounds = Physics.aabb(0, 0, viewportElement.clientWidth, viewportElement.clientHeight);
  
  console.log(document.getElementById('viewport').width, document.getElementById('viewport').height);
  var renderer = Physics.renderer('canvas', {
        el: 'viewport',
        width: window.innerWidth,
        height: window.innerHeight,
        meta: false,
    });
    world.add(renderer);

    // create objects with properties
    var objects = [
        { radius: 25, mass: 1, sound: 'sounds/marble_sound.mp3' },
        { radius: 50, mass: 2, sound: 'sounds/billiard_sound.mp3' },
        // ... add more object types
    ];

    objects.forEach(function(obj) {
      var circle = Physics.body('circle', {
        x: obj.radius + Math.random() * (window.innerWidth - 2 * obj.radius),
        y: obj.radius + Math.random() * (window.innerHeight - 2 * obj.radius),
            vx: Math.random(),
            vy: Math.random(),
            radius: obj.radius,
            mass: obj.mass,
            restitution: 0.8,
            styles: {
                fillStyle: '#d33682',
                angleIndicator: '#751b4b'
            },
            sound: obj.sound
        });
        world.add(circle);
    });

    world.add(Physics.behavior('body-collision-detection'));
    world.add(Physics.behavior('sweep-prune'));
    world.add(Physics.behavior('body-impulse-response'));

    world.on('collisions:detected', function(data) {
        data.collisions.forEach(function(collision) {
            var sound = new Howl({
                src: [collision.bodyA.sound]
            });
            sound.play();
        });
    });

    world.add(Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds,
        restitution: 0.99,
        cof: 0.99
    }));

    Physics.util.ticker.on(function(time, dt) {
        world.step(time);
    });

    Physics.util.ticker.start();

    world.on('step', function() {
        world.render();
    });

    document.addEventListener('keydown', function(event) {
        var gravity;
        switch (event.code) {
            case 'KeyW':
                gravity = Physics.behavior('constant-acceleration', { acc: { x: 0, y: -0.0004 } });
                break;
            case 'KeyA':
                gravity = Physics.behavior('constant-acceleration', { acc: { x: -0.0004, y: 0 } });
                break;
            case 'KeyS':
                gravity = Physics.behavior('constant-acceleration', { acc: { x: 0, y: 0.0004 } });
                break;
            case 'KeyD':
                gravity = Physics.behavior('constant-acceleration', { acc: { x: 0.0004, y: 0 } });
                break;
            default:
                return;
        }
        world.add(gravity);
    });

    document.addEventListener('keyup', function() {
        world.remove(world._behaviors.pop());
    });

    
// ----------------------------------------    
// ----------------------------------------
// CREATE NEW BALLS
    document.getElementById('viewport').addEventListener('click', function(event) {
      // Get the clicked location
      var x = event.offsetX;
      var y = event.offsetY;
  
      // Randomly select an object type from the objects array
      var randomObject = objects[Math.floor(Math.random() * objects.length)];
  
      // Assign random velocities (You can adjust the range for randomness as needed)
      var vx = (Math.random() - 0.5) * 2; // random between -1 and 1
      var vy = (Math.random() - 0.5) * 2; // random between -1 and 1
  
      // Create the circle using the selected properties and the random velocities
      var circle = Physics.body('circle', {
          x: x,
          y: y,
          vx: vx,
          vy: vy,
          radius: randomObject.radius,
          mass: randomObject.mass,
          restitution: 0.8,
          styles: {
              fillStyle: '#d33682',
              angleIndicator: '#751b4b'
          },
          sound: randomObject.sound
      });
  
      // Add the new circle to the world
      world.add(circle);
  });
  
  
  
  
  }

