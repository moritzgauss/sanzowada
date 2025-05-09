const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const infoBox = document.getElementById('infoBox');
const infoContent = document.getElementById('infoContent');
const closeBtn = document.getElementById('closeBtn');
const tooltip = document.getElementById('tooltip');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    positionClusters();
});

closeBtn.addEventListener('click', () => {
    infoBox.style.display = 'none';
    enlargedCluster = null;
});

let clusters = [];
let enlargedCluster = null;
let hoveredCluster = null;

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
            floatOffset: { dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4 },
            hexes: colors.slice(0, 4).map(c => c.hex)
        }));

    positionClusters();
    animate();
});

function positionClusters() {
    // Use smaller spacing on mobile
    const spacing = window.innerWidth <= 768 ? 60 : 120;
    const cols = Math.floor(width / spacing);
    
    clusters.forEach((cluster, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        cluster.center.x = col * spacing + spacing/2;
        cluster.center.y = row * spacing + spacing/2;
    });
}

function getClusterDots(cluster, scale = 1) {
    const baseR = 10 * scale;
    const spacing = 14; // reduced from 20 to 15 units
    const { x, y } = cluster.center;
    return [
        { x: x, y: y - spacing * scale, r: baseR, color: cluster.colors[0] },
        { x: x - spacing * scale, y: y, r: baseR, color: cluster.colors[1] },
        { x: x + spacing * scale, y: y, r: baseR, color: cluster.colors[2] },
        { x: x, y: y + spacing * scale, r: baseR, color: cluster.colors[3] }
    ];
}

canvas.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    for (const cluster of clusters) {
        const dots = getClusterDots(cluster);
        for (const dot of dots) {
            const dx = dot.x - x;
            const dy = dot.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < dot.r + 5) {
                const name = generateName(cluster.colors, cluster.id);
                const cmykList = cluster.colors.map(c => `<small>${c.cmyk}</small>`).join('<br>');
                infoContent.innerHTML = `<h2>${name}</h2><p>${cluster.hexes.join('<br>')}</p><hr>${cmykList}`;
                navigator.clipboard.writeText(cluster.hexes.join(', '));
                infoBox.style.display = 'block';
                enlargedCluster = cluster;
                return;
            }
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 768) return; // Skip on mobile

    const x = e.clientX;
    const y = e.clientY;
    let found = false;

    for (const cluster of clusters) {
        const dots = getClusterDots(cluster);
        for (const dot of dots) {
            const dx = dot.x - x;
            const dy = dot.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < dot.r + 5) {
                hoveredCluster = cluster;
                const name = generateName(cluster.colors, cluster.id);
                tooltip.textContent = name;
                tooltip.style.display = 'block';
                tooltip.style.left = (x + 10) + 'px';
                tooltip.style.top = (y + 10) + 'px';
                found = true;
                canvas.style.cursor = 'pointer'; // Add this line
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        hoveredCluster = null;
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default'; // Add this line
    }
});

canvas.addEventListener('mouseout', () => {
    hoveredCluster = null;
    tooltip.style.display = 'none';
});

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw background clusters first
    clusters.forEach(cluster => {
        if (cluster !== enlargedCluster && cluster !== hoveredCluster) {
            updateAndDrawCluster(cluster);
        }
    });

    // Draw hovered or enlarged cluster last
    if (hoveredCluster && hoveredCluster !== enlargedCluster) {
        updateAndDrawCluster(hoveredCluster, 2);
    }
    if (enlargedCluster) {
        updateAndDrawCluster(enlargedCluster, 6);
    }

    requestAnimationFrame(animate);
}

function updateAndDrawCluster(cluster, scale = 1) {
    // If it's mobile and this is the enlarged cluster, center it
    if (window.innerWidth <= 768 && cluster === enlargedCluster) {
        // Smoothly move towards center
        const targetX = width / 2;
        const targetY = height / 2;
        cluster.center.x += (targetX - cluster.center.x) * 0.1;
        cluster.center.y += (targetY - cluster.center.y) * 0.1;
    } else {
        // Normal floating behavior for other cases
        cluster.center.x += cluster.floatOffset.dx;
        cluster.center.y += cluster.floatOffset.dy;

        // bounce
        if (cluster.center.x < 30 || cluster.center.x > width - 30) cluster.floatOffset.dx *= -1;
        if (cluster.center.y < 30 || cluster.center.y > height - 30) cluster.floatOffset.dy *= -1;
    }

    const dots = getClusterDots(cluster, scale);
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = dot.color.hex;
        ctx.fill();
    });
}

function generateName(colors, id) {
    const words = colors.map(c => c.name.split(' '));
    const part1 = words[0][0] || 'Color';
    const part2 = (words[1] || words[2] || ['Mix'])[0];
    return `${part1} ${part2} Combination ${id}`;
}

const creditsLink = document.querySelector('.credits-link');
const creditsPopup = document.querySelector('.credits-popup');

if (window.innerWidth > 768) {
    // Desktop behavior
    creditsLink.addEventListener('mouseenter', () => {
        creditsPopup.style.display = 'block';
    });
    
    creditsLink.addEventListener('mouseleave', () => {
        creditsPopup.style.display = 'none';
    });
} else {
    // Mobile behavior
    creditsLink.addEventListener('click', (e) => {
        e.preventDefault();
        creditsPopup.style.display = 'block';
        setTimeout(() => {
            creditsPopup.style.display = 'none';
        }, 4000);
    });
}