const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const infoBox = document.getElementById('infoBox');

let width, height;
const dots = [];
let isMobile = window.innerWidth < 768;
let clusterMode = false;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    isMobile = width < 768;
}
window.addEventListener('resize', resize);
resize();

class Dot {
    constructor(color, index, combinations) {
        this.color = color;
        this.index = index;
        this.combinations = combinations;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.r = isMobile ? 10 : 8;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.selected = false;
    }

    update(dots) {
        if (!this.selected) {
            if (clusterMode && this.combinations.length > 0) {
                let friends = dots.filter(d => this.combinations.includes(d.index));
                if (friends.length > 0) {
                    let avgX = friends.reduce((sum, f) => sum + f.x, this.x) / (friends.length + 1);
                    let avgY = friends.reduce((sum, f) => sum + f.y, this.y) / (friends.length + 1);
                    this.x += (avgX - this.x) * 0.05;
                    this.y += (avgY - this.y) * 0.05;
                }
            } else {
                this.x += this.dx;
                this.y += this.dy;
                if (this.x < 0 || this.x > width) this.dx *= -1;
                if (this.y < 0 || this.y > height) this.dy *= -1;
            }
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
    }
}

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedDot = null;
    dots.forEach(dot => {
        const dx = dot.x - mouseX;
        const dy = dot.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < dot.r + 5) clickedDot = dot;
    });

    dots.forEach(dot => dot.selected = false);

    if (clickedDot) {
        clickedDot.selected = true;
        navigator.clipboard.writeText(clickedDot.color.hex).catch(() => {});
        infoBox.innerHTML = `
            <span><strong>${clickedDot.color.name}</strong></span>
            <span>${clickedDot.color.hex} (copied!)</span>
            <span class="cmyk">${clickedDot.color.cmyk}</span>
        `;
        infoBox.style.display = 'block';
    } else {
        infoBox.style.display = 'none';
    }
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered = null;
    dots.forEach(dot => {
        const dx = dot.x - mouseX;
        const dy = dot.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < dot.r + 5) hovered = dot;
    });

    if (hovered) {
        tooltip.style.left = e.clientX + 10 + 'px';
        tooltip.style.top = e.clientY + 10 + 'px';
        tooltip.innerHTML = `${hovered.color.name}<br>${hovered.color.hex}<br>${hovered.color.cmyk}`;
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
});

function animate() {
    ctx.clearRect(0, 0, width, height);
    dots.forEach(dot => {
        dot.update(dots);
        dot.draw();
    });
    requestAnimationFrame(animate);
}

function startClusterCycle() {
    setInterval(() => {
        clusterMode = true;
        setTimeout(() => {
            clusterMode = false;
        }, 4000);
    }, 12000);
}

fetch('colors.json')
    .then(response => response.json())
    .then(data => {
        data.colors.forEach(color => {
            dots.push(new Dot({
                name: color.name,
                hex: color.hex,
                cmyk: `C:${color.cmyk_array[0]} M:${color.cmyk_array[1]} Y:${color.cmyk_array[2]} K:${color.cmyk_array[3]}`
            }, color.index, color.combinations));
        });
        startClusterCycle();
        animate();
    })
    .catch(err => console.error('Fehler beim Laden der Farben:', err));