const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 300x300 canvas
const canvas = createCanvas(300, 300);
const ctx = canvas.getContext('2d');

// Clear canvas with transparent background
ctx.clearRect(0, 0, 300, 300);

// Set shadow properties
ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
ctx.shadowBlur = 5;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 8;

// Draw rounded rectangle that will cast the shadow
const x = 10;
const y = 10;
const width = 280;
const height = 280;
const radius = 12;

// Draw rounded rectangle
ctx.fillStyle = 'black';
ctx.beginPath();
ctx.moveTo(x + radius, y);
ctx.lineTo(x + width - radius, y);
ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
ctx.lineTo(x + width, y + height - radius);
ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
ctx.lineTo(x + radius, y + height);
ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
ctx.lineTo(x, y + radius);
ctx.quadraticCurveTo(x, y, x + radius, y);
ctx.closePath();
ctx.fill();

// Clear the shape itself, keeping only shadow
ctx.globalCompositeOperation = 'destination-out';
ctx.shadowColor = 'transparent';
ctx.fillStyle = 'black';
ctx.fill();

// Save as PNG first (WebP conversion would need additional libraries)
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/images/album-shadow.png', buffer);

console.log('Shadow image created as album-shadow.png');
console.log('You may want to convert it to WebP for better compression');