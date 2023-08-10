document.getElementById('startApp').addEventListener('click', function() {
  initApp();
  document.getElementById('startApp').style.display = 'none';
});

window.addEventListener('resize', function() {
  var viewportBounds = Physics.aabb(0, 0, viewportElement.clientWidth, viewportElement.clientHeight);
  // update any physics behaviors or properties that depend on these bounds
});

// This function returns a promise that resolves when the image is loaded
function loadImage(src) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = function() {
            resolve(img);
        };
        img.onerror = function() {
            reject(new Error("Failed to load image at " + src));
        };
        img.src = src;
    });
}



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

  var renderer = Physics.renderer('canvas', {
      el: 'viewport',
      width: window.innerWidth,
      height: window.innerHeight,
      meta: false,
  });
  world.add(renderer);

  var objects = [
      { radius: 20, mass: 1, sound: 'sounds/marble1.mp3', image: 'images/marble.png', className: 'marble' },
      { radius: 50, mass: 2, sound: 'sounds/billiard1.mp3', image: 'images/billiard.png', className: 'billiard' },
      { radius: 30, mass: .5, sound: 'sounds/pingpong1.mp3', image: 'images/pingpong.png', className: 'pingpong' },
  ];

  var soundCache = {};
  objects.forEach(function(obj) {
      var sound = new Howl({
          src: [obj.sound],
          preload: true
      });
      soundCache[obj.sound] = sound;
  });

  var imageCanvasCache = {};

  Promise.all(objects.map(obj => loadImage(obj.image))).then(() => {
      objects.forEach(function(obj) {
          if (obj.image) {
              var img = new Image();
              img.onload = function() {
                  var canvas = document.createElement('canvas');
                  canvas.width = obj.radius * 2;
                  canvas.height = obj.radius * 2;
                  var ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  imageCanvasCache[obj.image] = canvas;
              };
              img.src = obj.image;
          }
      });

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
              sound: obj.sound,
              view: imageCanvasCache[obj.image] || null,
          });
          world.add(circle);
      });

      }).catch(error => {
        console.error("Error loading images:", error);
      });


  world.add(Physics.behavior('body-collision-detection'));
  world.add(Physics.behavior('sweep-prune'));
  world.add(Physics.behavior('body-impulse-response'));
  
  world.on('collisions:detected', function(data) {
      data.collisions.forEach(function(collision) {
          var sound = soundCache[collision.bodyA.sound];
          if (sound) {
              sound.play();
          }
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

  var currentGravity = null;
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
      if (currentGravity) {
          world.remove(currentGravity);
      }
      world.add(gravity);
      currentGravity = gravity;
  });

  document.addEventListener('keyup', function() {
      if (currentGravity) {
          world.remove(currentGravity);
          currentGravity = null;
      }
  });

  document.getElementById('viewport').addEventListener('click', function(event) {
      var x = event.offsetX;
      var y = event.offsetY;
      var randomObject = objects[Math.floor(Math.random() * objects.length)];
      var vx = (Math.random() - 0.5) * 2;
      var vy = (Math.random() - 0.5) * 2;

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
          sound: randomObject.sound,
          view: imageCanvasCache[randomObject.image] || null,
      });
      world.add(circle);
  });
}
