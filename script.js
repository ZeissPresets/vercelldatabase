let memoryChart;
const maxDataPoints = 20;
const chartLabels = [];
const chartData = [];

function initChart() {
    const ctx = document.getElementById('memoryChart').getContext('2d');
    memoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Heap Used (MB)',
                data: chartData,
                borderColor: '#0070f3',
                backgroundColor: 'rgba(0, 112, 243, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: '#333' },
                    ticks: { color: '#888', font: { size: 10 } }
                }
            }
        }
    });
}

async function clearMemory(isAuto = false) {
    const btn = document.getElementById('clear-mem-btn');
    if (!isAuto) btn.textContent = 'Clearing...';
    try {
        const response = await fetch('/api/clear-memory', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            if (!isAuto) alert('Memory Heap berhasil dibersihkan!');
            else console.log('Auto-cleanup executed successfully');
            fetchMetrics();
        } else {
            if (!isAuto) alert('Gagal: ' + result.message);
        }
    } catch (e) {
        if (!isAuto) alert('Fitur ini memerlukan server Node.js aktif dengan flag --expose-gc');
    } finally {
        if (!isAuto) btn.textContent = 'Clear Heap Memory';
    }
}

async function fetchMetrics() {
    try {
        const response = await fetch('/api/monitor');
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        const { cpu, memory } = data.server;

        // Update UI CPU
        document.getElementById('cpu-model').textContent = cpu.model;
        document.getElementById('cpu-arch').textContent = cpu.arch;
        document.getElementById('cpu-cores').textContent = cpu.cores;
        document.getElementById('cpu-speed').textContent = cpu.speed;
        document.getElementById('os-platform').textContent = data.server.platform;
        document.getElementById('server-uptime').textContent = formatUptime(data.server.uptime);
        document.getElementById('load-avg').textContent = data.server.loadAvg[0].toFixed(2);

        // Update UI Memory
        document.getElementById('ram-total').textContent = memory.total;
        document.getElementById('ram-free').textContent = memory.free;
        document.getElementById('mem-used').textContent = memory.heapUsed;
        document.getElementById('mem-rss').textContent = memory.rss;
        document.getElementById('mem-progress').style.width = `${memory.percentUsed}%`;

        // Auto-Trigger: Jika penggunaan memori > 80% terdeteksi di UI, 
        // panggil fungsi pembersihan tanpa interaksi user
        if (memory.percentUsed > 80) {
            console.warn('High memory detected. Triggering auto-cleanup...');
            clearMemory(true);
        }

        // Update Chart
        const numericValue = parseInt(memory.heapUsed.replace(' MB', ''));
        const now = new Date().toLocaleTimeString();
        
        chartLabels.push(now);
        chartData.push(numericValue);

        if (chartLabels.length > maxDataPoints) {
            chartLabels.shift();
            chartData.shift();
        }

        memoryChart.update('none'); // Update without animation for performance

        document.getElementById('timestamp').textContent = `Last Update: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
        document.getElementById('timestamp').textContent = 'Status: Connection Error';
    }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// Initialize
initChart();
fetchMetrics();
document.getElementById('clear-mem-btn').addEventListener('click', clearMemory);
setInterval(fetchMetrics, 5000);