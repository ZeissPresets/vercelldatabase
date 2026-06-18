let memoryChart;
const maxDataPoints = 20;
const chartLabels = [];
const chartData = [];
let syncCounter = 5; // Set ke 5 agar sinkronisasi pertama terjadi lebih cepat (5 detik setelah load)

// Traffic Monitoring Vars
let dataSentCount = 0;
let dataReceivedCount = 0;

const TOTAL_RAM_LIMIT = 3000; // Limit dalam MB

// GANTI INI dengan URL domain InfinityFree Anda agar Vercel bisa terhubung
const INFINITY_FREE_BASE_URL = 'https://ddoslayer7.page.gd/';

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

async function clearMemory() {
    console.log('[System] Initiating automatic memory cleanup...');
    try {
        const response = await fetch('/api/clear-memory', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            console.log(`[System] ${result.message}`);
            fetchMetrics();
        }
    } catch (e) {
        console.error('[System] Automatic cleanup failed. Ensure --expose-gc is active if running locally.');
    }
}

async function fetchMetrics() {
    try {
        const response = await fetch('/api/monitor');
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        const { cpu, memory, storage } = data.server; // Ambil juga 'storage'
        
        // Kalkulasi berdasarkan limit 3000MB (RSS lebih akurat untuk limit RAM sistem)
        const rssValue = parseInt(memory.rss.replace(' MB', ''));
        const ramPercent = Math.round((rssValue / TOTAL_RAM_LIMIT) * 100);

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
        document.getElementById('mem-progress').style.width = `${ramPercent}%`;
        document.getElementById('mem-progress').style.backgroundColor = ramPercent > 80 ? '#ff4d4d' : '#0070f3';

        // Update UI Storage
        document.getElementById('total-storage').textContent = storage.total;
        document.getElementById('used-storage').textContent = storage.used;
        document.getElementById('free-storage').textContent = storage.free;

        // Auto-Trigger: Menggunakan limit 3000MB
        if (ramPercent > 80) {
            console.warn(`[Warning] RAM usage high (${ramPercent}%). Cleaning...`);
            clearMemory();
            fetchLogs(); // Segera ambil log setelah pembersihan
        }

        // Database Sync: Hanya kirim ke DB setiap 30 detik (6 x 5 detik)
        // Agar InfinityFree tidak menganggap ini sebagai serangan spam/flood
        syncCounter++;
        if (syncCounter >= 6) { 
            syncToDatabase({
                heapUsed: memory.heapUsed,
                cpuLoad: data.server.loadAvg[0],
                timestamp: new Date().toISOString()
            });
            syncCounter = 0;
            fetchLogs(); // Update panel log secara berkala
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

async function fetchLogs() {
    try {
        const response = await fetch(INFINITY_FREE_BASE_URL + 'database/api_logs.php');
        const data = await response.json();
        
        // Jika data adalah array (dari GET request)
        const logs = Array.isArray(data) ? data : [];
        const logList = document.getElementById('log-list');
        
        if (logs.length > 0) {
            logList.innerHTML = logs.map(log => `
                <div class="log-item">
                    [${new Date(log.timestamp).toLocaleTimeString()}] ${log.event_type.toUpperCase()}: Heap ${log.heap_used} | CPU ${log.cpu_load}%
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Failed to fetch logs:', e);
    }
}

async function syncToDatabase(payload) {
    try {
        const startTime = performance.now();
        document.getElementById('sync-status').textContent = 'Syncing...';
        document.getElementById('sync-status').style.color = '#ffaa00';

        // Pastikan path ini sesuai dengan lokasi file di InfinityFree
        // Jika file api_logs.php ada di htdocs langsung (bukan folder database), hapus '/database'
        // Menggunakan URL absolut agar Vercel bisa mengirim data ke database di InfinityFree
        const apiPath = INFINITY_FREE_BASE_URL + 'database/api_logs.php';
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
        });

        const result = await response.json();
        const endTime = performance.now();
        
        if (result.success) {
            dataSentCount++;
            dataReceivedCount = result.total_count || dataReceivedCount;
            
            document.getElementById('sync-sent').textContent = dataSentCount;
            document.getElementById('sync-received').textContent = dataReceivedCount;
            document.getElementById('sync-latency').textContent = `${Math.round(endTime - startTime)}ms`;
            document.getElementById('sync-status').textContent = 'Success';
            document.getElementById('sync-status').style.color = '#00ff00';
        }
    } catch (e) {
        console.error('Database Sync Failed:', e);
        document.getElementById('sync-status').textContent = 'Failed';
        document.getElementById('sync-status').style.color = '#ff4d4d';
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
fetchLogs();
setInterval(fetchMetrics, 5000);