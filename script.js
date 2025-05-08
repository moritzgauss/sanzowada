const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width, height;
const dots = [];
let isMobile = window.innerWidth < 768;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    isMobile = width < 768;
}
window.addEventListener('resize', resize);
resize();

class Dot {
    constructor(color) {
        this.color = color;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.r = isMobile ? 15 : 8;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.selected = false;
    }

    update() {
        if (!this.selected) {
            this.x += this.dx;
            this.y += this.dy;
            if (this.x < 0 || this.x > width) this.dx *= -1;
            if (this.y < 0 || this.y > height) this.dy *= -1;
        } else {
            this.x += (width / 2 - this.x) * 0.1;
            this.y += (height / 2 - this.y) * 0.1;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color.hex;
        ctx.fill();
        if (this.selected) {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = isMobile ? "14px sans-serif" : "16px sans-serif";
            ctx.fillText(this.color.hex, width / 2, height / 2 - 30);
            ctx.fillText(this.color.cmyk, width / 2, height / 2);
        }
    }
}

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    dots.forEach(dot => dot.selected = false);
    for (let dot of dots) {
        const dx = dot.x - mouseX;
        const dy = dot.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < dot.r + 5) {
            dot.selected = true;
            dot.r = isMobile ? 50 : 30;
        } else {
            dot.r = isMobile ? 15 : 8;
        }
    }
});

function animate() {
    ctx.clearRect(0, 0, width, height);
    dots.forEach(dot => {
        dot.update();
        dot.draw();
    });
    requestAnimationFrame(animate);
}

fetch('colors.json')
    .then(response => response.json())
    .then(data => {
        data.colors.forEach(color => {
            dots.push(new Dot({
                name: color.name,
                hex: color.hex,
                cmyk: `C:${color.cmyk_array[0]} M:${color.cmyk_array[1]} Y:${color.cmyk_array[2]} K:${color.cmyk_array[3]}`
            }));
        });
        animate();
    })
    .catch(err => console.error('Fehler beim Laden der Farben:', err));