
// About the author
document.addEventListener('DOMContentLoaded', function() {
  var aboutTrigger = document.getElementById('about-trigger');
  if (aboutTrigger) {
      aboutTrigger.onclick = function() {
          var aboutBox = document.getElementById('about-box');
          if (aboutBox) {
              aboutBox.style.display = aboutBox.style.display === 'none' ? 'block' : 'none';
          }
      };
  }
});
