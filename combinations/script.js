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
});

closeBtn.addEventListener('click', () => infoBox.style.display = 'none');

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

    const clusters = Object.entries(combinations)
        .filter(([_, colors]) => colors.length >= 4)
        .map(([id, colors]) => ({
            id: id,
            colors: colors.slice(0, 4)
        }));

    animateClusters(clusters);
});

function animateClusters(clusters) {
    function drawCluster(cluster, scale = 1) {
        const centerX = Math.random() * width;
        const centerY = Math.random() * height;
        const r = 20 * scale;

        const positions = [
            [centerX, centerY - r * 2],
            [centerX - r, centerY],
            [centerX + r, centerY],
            [centerX, centerY + r * 2]
        ];

        ctx.save();
        cluster.hexes = [];

        cluster.positions = positions.map(([x, y], i) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = cluster.colors[i].hex;
            ctx.fill();
            cluster.hexes.push(cluster.colors[i].hex);
            return { x, y, r };
        });

        ctx.restore();
    }

    canvas.addEventListener('click', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        for (const cluster of clusters) {
            for (const dot of cluster.positions || []) {
                const dx = dot.x - x;
                const dy = dot.y - y;
                if (Math.sqrt(dx * dx + dy * dy) < dot.r) {
                    const name = generateName(cluster.colors, cluster.id);
                    infoContent.innerHTML = `<h2>${name}</h2><p>${cluster.hexes.join('<br>')}</p>`;
                    navigator.clipboard.writeText(cluster.hexes.join(', '));
                    infoBox.style.display = 'block';
                    return;
                }
            }
        }
    });

    function loop() {
        ctx.clearRect(0, 0, width, height);
        clusters.forEach(cluster => drawCluster(cluster));
        requestAnimationFrame(loop);
    }
    loop();
}

function generateName(colors, id) {
    const words = colors.map(c => c.name.split(' '));
    const part1 = words[0][0] || 'Color';
    const part2 = (words[1] || words[2] || ['Mix'])[0];
    return `${part1} ${part2} Combination ${id}`;
}
