function gridToBase64Img(grid) {
  var height = grid.length,
      width = grid[0].length,
      pix = new Uint8ClampedArray(width * height * 4); // have enough bytes
  for(var y = 0; y < height; y++) {
    for(var x = 0; x < width; x++) {
        var pos = (y * width + x) * 4; // position in buffer based on x and y
        pix[pos] = pix[pos+1] = pix[pos+2] = grid[y][x] === 1 ? 0 : 255;
        pix[pos+3] = 255; // alpha
    }
  }
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  var imgData = ctx.createImageData(width, height);
  imgData.data.set(pix);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL();

}

function gridFromImage(image, callback) {
  if (!image.width || image.width > 64 || !image.height || image.height > 64) {
    var msg = `Invalid image of size ${image.width}x${image.height}px, must be non empty and max 64x64px`;
    alert(msg);
    throw new Error(msg);
  }
  console.log('Image loaded, now converting to nonogram grid');
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  var imageData = ctx.getImageData(0, 0, image.width, image.height);
  var pix = imageData.data;

  var isBlackAndWhite = true, colorSum = 0;
  for (var i = 0, n = pix.length; i < n; i += 4) {
      colorSum += pix[i] + pix[i+1] + pix[i+2];
      if ((pix[i] != 0 && pix[i] != 255)
       || pix[i+1] != pix[i] || pix[i+2] != pix[i]) {
          if (isBlackAndWhite) { console.log('First non B&W pixel:', {y: Math.floor(i/image.width), x: i % image.width}, pix[i], pix[i+1], pix[i+2]); }
          isBlackAndWhite = false;
      }
  }
  if (isBlackAndWhite) {
      console.log('B&W image detected');
      var grid = new Array(image.height);
      for (let i = 0; i < image.height; i += 1) {
        grid[i] = new Array(image.width)
        for (let j = 0; j < image.width; j += 1) {
          grid[i][j] = 1 - pix[4* (i * image.width + j)] / 255;
        }
      }
      return callback(grid);
  }

  var tripleGreyThreshold = colorSum / pix.length;
  console.log('Colored image detected, with average grey: ', tripleGreyThreshold / 3);

  var grid = new Array(image.height);
  for (let i = 0; i < image.height; i += 1) {
    grid[i] = new Array(image.width)
    for (let j = 0; j < image.width; j += 1) {
      var k = 4* (i * image.width + j);
      grid[i][j] = (pix[k] + pix[k+1] + pix[k+2]) < tripleGreyThreshold ? 1 : 0;
    }
  }
  return callback(grid);
}
