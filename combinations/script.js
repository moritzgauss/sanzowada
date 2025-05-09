const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const infoBox = document.getElementById('infoBox');
const infoContent = document.getElementById('infoContent');
const closeBtn = document.getElementById('closeBtn');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    positionClusters();
});

closeBtn.addEventListener('click', () => infoBox.style.display = 'none');

let clusters = [];

fetch('colors.json')
.then(res => res.json())
.then(data => {
    const combinations = {};
    data.colors.forEach(color => {
        color.combinations.forEach(c => {
            if (!combinations[c]) combinations[c] = [];
            combinations[c].push(color);
        });
    });

    clusters = Object.entries(combinations)
        .filter(([_, colors]) => colors.length >= 4)
        .map(([id, colors]) => ({
            id: id,
            colors: colors.slice(0, 4),
            center: { x: 0, y: 0 },
            floatOffset: { dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5 },
            hexes: [],
            dots: []
        }));

    positionClusters();
    animate();
});

function positionClusters() {
    const cols = Math.floor(width / 200);
    clusters.forEach((cluster, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        cluster.center.x = col * 200 + 100;
        cluster.center.y = row * 200 + 100;
        cluster.hexes = cluster.colors.map(c => c.hex);
    });
}

canvas.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    for (const cluster of clusters) {
        const dots = getClusterDots(cluster);
        for (const dot of dots) {
            const dx = dot.x - x;
            const dy = dot.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                const name = generateName(cluster.colors, cluster.id);
                const cmykList = cluster.colors.map(c => `<small>${c.cmyk}</small>`).join('<br>');
                infoContent.innerHTML = `<h2>${name}</h2><p>${cluster.hexes.join('<br>')}</p><hr>${cmykList}`;
                navigator.clipboard.writeText(cluster.hexes.join(', '));
                infoBox.style.display = 'block';
                return;
            }
        }
    }
});

function getClusterDots(cluster) {
    const r = 20;
    const { x, y } = cluster.center;
    return [
        { x: x, y: y - 40, color: cluster.colors[0] },
        { x: x - 30, y: y, color: cluster.colors[1] },
        { x: x + 30, y: y, color: cluster.colors[2] },
        { x: x, y: y + 40, color: cluster.colors[3] }
    ];
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    clusters.forEach(cluster => {
        cluster.center.x += cluster.floatOffset.dx;
        cluster.center.y += cluster.floatOffset.dy;

        // Bounce inside canvas
        if (cluster.center.x < 50 || cluster.center.x > width - 50) cluster.floatOffset.dx *= -1;
        if (cluster.center.y < 50 || cluster.center.y > height - 50) cluster.floatOffset.dy *= -1;

        const dots = getClusterDots(cluster);
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = dot.color.hex;
            ctx.fill();
        });

        cluster.dots = dots;
    });

    requestAnimationFrame(animate);
}

function generateName(colors, id) {
    const words = colors.map(c => c.name.split(' '));
    const part1 = words[0][0] || 'Color';
    const part2 = (words[1] || words[2] || ['Mix'])[0];
    return `${part1} ${part2} Combination ${id}`;
}