module.exports = class ColorUtils {
  static RGBAtoInt(arr) {
    return ((Math.round(arr[3] * 255) << 24) >>> 0 | arr[0] << 16 | arr[1] << 8 | arr[2]) >>> 0;
  }

  static intToRGBA(num) {
    let alpha = num >> 24 & 255;
    if (alpha > 1) alpha = alpha / 255;
    return `rgba(${num >> 16 & 255},${num >> 8  & 255},${num & 255},${alpha})`;
  }

  static intToRGBAArray(num) {
    let alpha = num >> 24 & 255;
    if (alpha > 1) alpha = alpha / 255;
    return [num >> 16 & 255, num >> 8  & 255, num & 255, alpha];
  }

  static RGBToArray(rgbString) {
    const arr = rgbString.replace('rgba(', '').replace('rgb(', '').replace(')', '').replace(/\s/g, '').split(',').map(i => parseInt(i));
    if (arr.length > 3) arr.pop();
    return arr;
  }

  static RGBAToArray(rgbString) {
    const arr = rgbString.replace('rgba(', '').replace('rgb(', '').replace(')', '').replace(/\s/g, '').split(',').map(i => parseInt(i));
    if (arr.length === 3) arr.push(1);
    return arr;
  }
};
