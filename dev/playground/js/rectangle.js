// function to create rectangle objects
class Rectangle {
  // you create new Rectangles by calling this as a function
  // these are the arguments you pass in
  // add default values to avoid errors on empty arguments
  constructor(
    ctx = null,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fillColor = "",
    strokeColor = "",
    strokeWidth = 2
  ) {
    // ensure the arguments passed in are numbers
    // a bit overkill for this tutorial
    this.x = Number(x);
    this.y = Number(y);
    this.width = Number(width);
    this.height = Number(height);
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }

  // get keyword causes this method to be called
  // when you use myRectangle.area
  get area() {
    return this.width * this.height;
  }

  // gets the X position of the left side
  get left() {
    // origin is at top left so just return x
    return this.x;
  }

  // get X position of right side
  get right() {
    // x is left position + the width to get end point
    return this.x + this.width;
  }

  // get the Y position of top side
  get top() {
    // origin is at top left so just return y
    return this.y;
  }

  // get Y position at bottom
  get bottom() {
    return this.y + this.height;
  }

  // draw rectangle to screen
  draw() {
    // destructuring
    const { x, y, width, height, fillColor, strokeColor, strokeWidth } = this;

    // saves the current styles set elsewhere
    // to avoid overwriting them
    ctx.save();

    // set the styles for this shape
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;

    // create the *path*
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.rect(x, y, width, height);

    // draw the path to screen
    ctx.fill();
    ctx.stroke();

    // restores the styles from earlier
    // preventing the colors used here
    // from polluting other drawings
    ctx.restore();
  }
}
