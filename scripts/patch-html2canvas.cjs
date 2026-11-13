const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.esm.js'),
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.js')
];

const oklchFunctionCode = `
var oklch = function (_context, args) {
    try {
        var tokens = args.filter(nonFunctionArgSeparator);
        var lVal = tokens[0] ? (tokens[0].type === 16 ? tokens[0].number / 100 : tokens[0].number) : 0;
        var cVal = tokens[1] ? tokens[1].number : 0;
        var hVal = tokens[2] ? tokens[2].number : 0;
        var aVal = tokens[3] ? (tokens[3].type === 16 ? tokens[3].number / 100 : tokens[3].number) : 1;
        var hRad = (hVal * Math.PI) / 180;
        var a = cVal * Math.cos(hRad);
        var b = cVal * Math.sin(hRad);
        var l_ = lVal + 0.3963377774 * a + 0.2158037573 * b;
        var m_ = lVal - 0.1055613458 * a - 0.0638541728 * b;
        var s_ = lVal - 0.0894841775 * a - 1.2914855480 * b;
        var l = l_ * l_ * l_;
        var m = m_ * m_ * m_;
        var s = s_ * s_ * s_;
        var rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        var gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        var bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        var toSrgb = function (x) {
            var c = Math.max(0, Math.min(1, x));
            return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        };
        return pack(Math.round(toSrgb(rLin) * 255), Math.round(toSrgb(gLin) * 255), Math.round(toSrgb(bLin) * 255), aVal);
    } catch (e) {
        return pack(0, 0, 0, 1);
    }
};
`;

for (const targetPath of targets) {
  if (!fs.existsSync(targetPath)) {
    console.log('Target not found:', targetPath);
    continue;
  }

  let content = fs.readFileSync(targetPath, 'utf8');

  // 1. Add oklch helper function if not present
  if (!content.includes('var oklch = function')) {
    content = content.replace(
      'var SUPPORTED_COLOR_FUNCTIONS = {',
      `${oklchFunctionCode}\nvar SUPPORTED_COLOR_FUNCTIONS = {\n    oklch: oklch,\n    lab: oklch,\n`
    );
  }

  // 2. Replace throwing error on unknown color function with safe fallback pack(0, 0, 0, 1) or transparent
  content = content.replace(
    /throw new Error\("Attempting to parse an unsupported color function \\"" \+ value\.name \+ "\\""\);/g,
    'return pack(23, 23, 23, 1);'
  );

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully patched html2canvas at:', targetPath);
}
