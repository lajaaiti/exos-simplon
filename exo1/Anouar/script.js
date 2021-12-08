var square = document.getElementById("square"),
  contador = 1;
document.body.addEventListener("mousemove", function (e) {
  square.style.transform =
    "rotateY(" + e.pageX / 2 + "deg)rotateX(" + e.pageY / 2 + "deg)";
});

addEventListener("wheel", function (e) {
  if (e.deltaY > 0) {
    square.style.width = square.clientWidth - 100 + "px";
    square.style.height = square.clientHeight + 100 + "px";
  } else {
    square.style.width = square.clientWidth + 100 + "px";
    square.style.height = square.clientHeight - 100 + "px";
  }
});
