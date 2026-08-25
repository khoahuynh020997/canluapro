// ============================================
// storage.js - Quản lý lưu trữ dữ liệu
// ============================================

const STORAGE_KEYS = {
    CONFIG: 'rice_app_config',
    HISTORY: 'rice_app_history'
};

// Đọc dữ liệu an toàn từ localStorage
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        if (data === null) return defaultValue;
        return JSON.parse(data);
    } catch (e) {
        console.error('Lỗi đọc dữ liệu:', e);
        showToast('⚠️ Không đọc được dữ liệu lưu trữ!');
        return defaultValue;
    }
}

// Lưu dữ liệu an toàn vào localStorage
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Lỗi lưu dữ liệu:', e);
        if (e.name === 'QuotaExceededError') {
            showToast('⚠️ Bộ nhớ đầy! Hãy xóa bớt lịch sử cũ.');
        } else {
            showToast('⚠️ Không lưu được dữ liệu!');
        }
        return false;
    }
}

// ===== Cấu hình (Config) =====
function loadConfig() {
    const saved = loadFromStorage(STORAGE_KEYS.CONFIG, {}) || {};
    // deductRatio là theo từng đợt/nông dân, không lấy từ cấu hình chung
    return {
        tarePerBag: 0.125,
        autoDecimal: true,
        voiceEnabled: true,
        boatName: "Ghe anh Tám (Kiên Giang)",
        farmer: "Anh Ba Cường",
        farmerPhone: "",
        farmerAddress: "",
        riceType: "ST25",
        price: 8500,
        ...saved,
        deductRatio: 0.0
    };
}

function saveConfig(config) {
    const persist = { ...config };
    delete persist.deductRatio;
    return saveToStorage(STORAGE_KEYS.CONFIG, persist);
}

// ===== Lịch sử (History) =====
function loadHistory() {
    return loadFromStorage(STORAGE_KEYS.HISTORY, []);
}

function saveHistory(history) {
    return saveToStorage(STORAGE_KEYS.HISTORY, history);
}

function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        return true;
    } catch (e) {
        showToast('⚠️ Không xóa được lịch sử!');
        return false;
    }
}
