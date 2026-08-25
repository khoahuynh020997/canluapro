// ============================================
// stats.js - Thống kê người dùng (ẩn, dành cho chủ app)
// Chỉ lưu mã máy ẩn danh + thời gian. Không lưu tên, SĐT, dữ liệu cân.
// ============================================

const STATS_API = 'https://crudcrud.com/api/d296149886ae468c98303c35113b16dc/clients';
const STATS_PIN = '325488';
const STATS_ONLINE_MS = 5 * 60 * 1000;
const STATS_DEVICE_KEY = 'canlua_stats_did';
const STATS_RECORD_KEY = 'canlua_stats_rid';
const STATS_FIRST_KEY = 'canlua_stats_first';
const STATS_OPENS_KEY = 'canlua_stats_opens';

let statsHeartbeatTimer = null;
let statsUnlocked = false;

function getOrCreateDeviceId() {
    let id = localStorage.getItem(STATS_DEVICE_KEY);
    if (id) return id;
    id = (crypto.randomUUID && crypto.randomUUID()) ||
        ('d' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    localStorage.setItem(STATS_DEVICE_KEY, id);
    return id;
}

function statsNowIso() {
    return new Date().toISOString();
}

function statsPayload() {
    const first = localStorage.getItem(STATS_FIRST_KEY) || statsNowIso();
    localStorage.setItem(STATS_FIRST_KEY, first);
    const opens = parseInt(localStorage.getItem(STATS_OPENS_KEY) || '0', 10) || 0;
    return {
        d: getOrCreateDeviceId(),
        f: first,
        l: statsNowIso(),
        c: opens
    };
}

async function pingUsage(isNewOpen) {
    try {
        if (isNewOpen) {
            const opens = (parseInt(localStorage.getItem(STATS_OPENS_KEY) || '0', 10) || 0) + 1;
            localStorage.setItem(STATS_OPENS_KEY, String(opens));
        }
        const body = statsPayload();
        const recordId = localStorage.getItem(STATS_RECORD_KEY);
        const json = JSON.stringify(body);

        if (recordId) {
            const res = await fetch(STATS_API + '/' + recordId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: json
            });
            if (res.ok) return;
            localStorage.removeItem(STATS_RECORD_KEY);
        }

        const created = await fetch(STATS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: json
        });
        if (!created.ok) return;
        const data = await created.json();
        if (data && data._id) {
            localStorage.setItem(STATS_RECORD_KEY, data._id);
        }
    } catch (e) {
        // Im lặng — không làm gián đoạn cân lúa
    }
}

function startUsageTracking() {
    pingUsage(true);
    if (statsHeartbeatTimer) clearInterval(statsHeartbeatTimer);
    statsHeartbeatTimer = setInterval(() => {
        if (document.visibilityState === 'visible') pingUsage(false);
    }, 60000);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') pingUsage(false);
    });
}

function parseStatsTime(val) {
    if (!val) return 0;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
}

function formatStatsTime(val) {
    const t = parseStatsTime(val);
    if (!t) return '--';
    return new Date(t).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isSameLocalDay(ts, now) {
    const a = new Date(ts);
    const b = new Date(now);
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

async function loadUsageStats() {
    const res = await fetch(STATS_API);
    if (!res.ok) throw new Error('Không tải được thống kê');
    const rows = await res.json();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const unique = new Map();
    (rows || []).forEach((row) => {
        const key = row.d || row._id;
        const prev = unique.get(key);
        if (!prev || parseStatsTime(row.l) > parseStatsTime(prev.l)) {
            unique.set(key, row);
        }
    });

    const list = Array.from(unique.values()).sort(
        (a, b) => parseStatsTime(b.l) - parseStatsTime(a.l)
    );

    const online = list.filter((r) => now - parseStatsTime(r.l) <= STATS_ONLINE_MS).length;
    const today = list.filter((r) => isSameLocalDay(parseStatsTime(r.l), now)).length;
    const week = list.filter((r) => parseStatsTime(r.l) >= weekAgo).length;

    return { total: list.length, online, today, week, list };
}

function openStatsGate() {
    const gate = document.getElementById('statsGate');
    const dash = document.getElementById('statsDashboard');
    const pin = document.getElementById('statsPinInput');
    if (statsUnlocked) {
        if (gate) gate.classList.add('hidden');
        if (dash) dash.classList.remove('hidden');
        refreshUsageStats();
        return;
    }
    if (gate) gate.classList.remove('hidden');
    if (dash) dash.classList.add('hidden');
    if (pin) {
        pin.value = '';
        setTimeout(() => pin.focus(), 150);
    }
}

function openStatsModal() {
    closeSettingsModal();
    const modal = document.getElementById('statsModal');
    if (modal) modal.classList.remove('hidden');
    openStatsGate();
}

function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) modal.classList.add('hidden');
}

function submitStatsPin() {
    const pin = (document.getElementById('statsPinInput').value || '').trim();
    if (pin !== STATS_PIN) {
        showToast('⚠️ Mã truy cập không đúng!');
        return;
    }
    statsUnlocked = true;
    document.getElementById('statsGate').classList.add('hidden');
    document.getElementById('statsDashboard').classList.remove('hidden');
    refreshUsageStats();
}

async function refreshUsageStats() {
    const status = document.getElementById('statsStatus');
    const listEl = document.getElementById('statsRecentList');
    if (status) status.innerText = 'Đang tải...';
    try {
        const data = await loadUsageStats();
        document.getElementById('statsTotal').innerText = data.total;
        document.getElementById('statsOnline').innerText = data.online;
        document.getElementById('statsToday').innerText = data.today;
        document.getElementById('statsWeek').innerText = data.week;
        if (status) {
            status.innerText = 'Cập nhật lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        if (listEl) {
            if (data.list.length === 0) {
                listEl.innerHTML = '<p class="text-center text-slate-400 py-4 text-xs">Chưa có máy nào gửi tín hiệu.</p>';
            } else {
                listEl.innerHTML = data.list.slice(0, 30).map((row, idx) => {
                    const last = parseStatsTime(row.l);
                    const isOnline = Date.now() - last <= STATS_ONLINE_MS;
                    const dot = isOnline ? 'bg-emerald-500' : 'bg-slate-300';
                    const label = isOnline ? 'Đang dùng' : 'Ngoại tuyến';
                    const labelColor = isOnline ? 'text-emerald-700' : 'text-slate-400';
                    return `
                        <div class="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            <div>
                                <span class="font-extrabold text-slate-700 text-xs">Máy #${idx + 1}</span>
                                <span class="block text-[10px] text-slate-500">Lần cuối: ${formatStatsTime(row.l)}</span>
                                <span class="block text-[10px] text-slate-400">Lần đầu: ${formatStatsTime(row.f)} • Mở ${row.c || 1} lần</span>
                            </div>
                            <span class="flex items-center gap-1 text-[10px] font-bold ${labelColor}">
                                <span class="w-2 h-2 rounded-full ${dot}"></span>${label}
                            </span>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (e) {
        if (status) status.innerText = 'Không tải được. Kiểm tra mạng rồi thử lại.';
        showToast('⚠️ Không lấy được thống kê người dùng');
    }
}
