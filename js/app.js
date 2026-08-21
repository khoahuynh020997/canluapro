// ============================================
// app.js - Logic chính + Khởi động ứng dụng
// ============================================

let config = {};
let currentInputStr = "";
let editingBatchId = null;

// ===== Khởi động khi trang load xong =====
window.onload = () => {
    config = loadConfig();
    applyConfigToUI();
    buildGridUI();
    selectCell(0);
    updateSummary();
    renderHomeDashboard();

    // Hiện welcome modal sau 100ms
    setTimeout(() => {
        openWelcomeModal();
    }, 100);
};

// Đưa config lên các ô input
function applyConfigToUI() {
    const farmerName = document.getElementById('farmerName');
    const riceType = document.getElementById('riceType');
    const ricePrice = document.getElementById('ricePrice');
    const settingTare = document.getElementById('settingTare');
    const settingDeduct = document.getElementById('settingDeduct');
    const settingAutoDecimal = document.getElementById('settingAutoDecimal');
    const settingVoice = document.getElementById('settingVoice');
    const boatName = document.getElementById('boatName');

    if (farmerName) farmerName.value = config.farmer || "";
    if (riceType) riceType.value = config.riceType || "ST25";
    if (ricePrice) ricePrice.value = config.price || 8500;
    if (settingTare) settingTare.value = config.tarePerBag || 0.125;
    if (settingDeduct) settingDeduct.value = config.deductRatio || 0;
    if (settingAutoDecimal) settingAutoDecimal.checked = config.autoDecimal !== false;
    if (settingVoice) settingVoice.checked = config.voiceEnabled !== false;
    if (boatName) boatName.value = config.boatName || "Ghe anh Tám (Kiên Giang)";

    audioEnabled = config.voiceEnabled !== false;
    const icon = document.getElementById('audioIcon');
    if (icon) {
        icon.className = audioEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    }
}

// ===== Cập nhật thông tin chủ ghe =====
function updateBoatInfo() {
    config.boatName = document.getElementById('boatName').value;
    saveConfig(config);
    showToast("Đã cập nhật tên Chủ Ghe / Xe!");
}

// ===== Cập nhật thông tin đợt cân hiện tại =====
function updateBatchInfo() {
    config.farmer = document.getElementById('farmerName').value;
    config.riceType = document.getElementById('riceType').value;
    config.price = parseFloat(document.getElementById('ricePrice').value) || 0;
    saveConfig(config);
}

// ===== Tạo nông dân mới =====
function confirmCreateNewFarmer() {
    const name = document.getElementById('newFarmerNameInput').value.trim();
    if (!name) {
        showToast("⚠️ Vui lòng nhập tên nông dân / chủ ruộng!");
        return;
    }

    const phone = document.getElementById('newFarmerPhoneInput').value.trim();
    const address = document.getElementById('newFarmerAddressInput').value.trim();
    const riceType = document.getElementById('newFarmerRiceTypeInput').value.trim() || "ST25";
    const price = parseFloat(document.getElementById('newFarmerPriceInput').value) || 8500;

    config.farmer = name;
    config.farmerPhone = phone;
    config.farmerAddress = address;
    config.riceType = riceType;
    config.price = price;

    document.getElementById('farmerName').value = name;
    document.getElementById('riceType').value = riceType;
    document.getElementById('ricePrice').value = price;

    saveConfig(config);
    clearGridForNextFarmer(false);
    closeNewFarmerModal();
    switchView('scale');
    showToast(`Đã tạo nông dân "${name}". Bắt đầu cân lúa!`);
}

// ===== Xóa bảng + reset =====
function clearGridForNextFarmer(resetFarmerName = true) {
    editingBatchId = null;
    const badge = document.getElementById('editingBadge');
    if (badge) badge.classList.add('hidden');

    clearGridData();

    if (resetFarmerName) {
        document.getElementById('farmerName').value = "Nông Dân Mới";
        config.farmer = "Nông Dân Mới";
        config.farmerPhone = "";
        config.farmerAddress = "";
    }
}

function resetCurrentGridManual() {
    showConfirmModal(
        "Xóa Bảng Cân Hiện Tại",
        "Bạn có chắc chắn muốn xóa tất cả dữ liệu cân hiện tại trên bảng?",
        () => {
            clearGridForNextFarmer(true);
            closeSettingsModal();
            showToast("Đã xóa làm lại!");
        }
    );
}

// ===== Lưu cấu hình =====
function saveSettings() {
    let tareInput = document.getElementById('settingTare').value;
    tareInput = tareInput.replace(',', '.');
    const parsedTare = parseFloat(tareInput);

    config.tarePerBag = isNaN(parsedTare) ? 0.125 : parsedTare;
    config.deductRatio = parseFloat(document.getElementById('settingDeduct').value) || 0;
    config.autoDecimal = document.getElementById('settingAutoDecimal').checked;
    config.voiceEnabled = document.getElementById('settingVoice').checked;

    config.farmer = document.getElementById('farmerName').value;
    config.riceType = document.getElementById('riceType').value;
    config.price = parseFloat(document.getElementById('ricePrice').value) || 0;

    saveConfig(config);
    audioEnabled = config.voiceEnabled;
    closeSettingsModal();
    showToast("Đã lưu cấu hình!");
}

// ===== Bàn phím số =====
function pressNum(digit) {
    if (digit === '.' && currentInputStr.includes('.')) return;

    if (currentInputStr === "0") {
        currentInputStr = digit;
    } else {
        currentInputStr += digit;
    }

    updateKeypadDisplay();

    if (config.autoDecimal && !currentInputStr.includes('.') && currentInputStr.length === 3) {
        autoSubmitInputValue();
    }
}

function deleteDigit() {
    currentInputStr = currentInputStr.slice(0, -1);
    updateKeypadDisplay();
}

function updateKeypadDisplay() {
    const display = document.getElementById('keypadDisplay');
    if (!display) return;

    if (!currentInputStr) {
        display.innerText = "0";
        return;
    }

    let formattedVal = currentInputStr;
    if (config.autoDecimal && !currentInputStr.includes('.') && currentInputStr.length >= 3) {
        formattedVal = (parseFloat(currentInputStr) / 10).toFixed(1);
    }

    display.innerText = formattedVal;
}

function getParsedInputValue() {
    if (!currentInputStr) return null;
    if (config.autoDecimal && !currentInputStr.includes('.') && currentInputStr.length >= 3) {
        return (parseFloat(currentInputStr) / 10).toFixed(1);
    }
    return parseFloat(currentInputStr).toFixed(1);
}

function autoSubmitInputValue() {
    let val = getParsedInputValue();
    if (val === null) return;

    val = parseFloat(val);

    if (val > 120 || val < 10) {
        showToast("⚠️ Số kg bất thường! Hãy kiểm tra lại.");
    }

    gridData[currentIndex] = val;
    updateCellUI(currentIndex);
    updateSummary();

    if (config.voiceEnabled) {
        speakNumber(val);
    }

    moveToNextCell();
}

function quickAddFraction(fracStr) {
    let baseVal = 50.0;
    if (gridData[currentIndex] !== null) {
        baseVal = Math.floor(gridData[currentIndex]);
    } else if (currentInputStr) {
        baseVal = Math.floor(parseFloat(getParsedInputValue()) || 50);
    }

    const val = (baseVal + parseFloat(fracStr)).toFixed(1);
    currentInputStr = val.toString();
    updateKeypadDisplay();
    autoSubmitInputValue();
}

function moveToNextCell() {
    currentInputStr = "";
    const display = document.getElementById('keypadDisplay');
    if (display) display.innerText = "0";

    const isEndOfColumn = (currentIndex + 1) % ROWS_PER_COL === 0;
    if (isEndOfColumn && config.voiceEnabled) {
        playBeepSound();
    }

    if (currentIndex < TOTAL_MAX_CELLS - 1) {
        selectCell(currentIndex + 1);
    } else {
        showToast("🎉 Đã nhập tối đa 2500 bao (100 Bảng)!");
    }
}

function deleteCurrentBagValue() {
    let targetIdx = currentIndex;

    if (gridData[targetIdx] === null && targetIdx > 0) {
        targetIdx = targetIdx - 1;
    }

    if (gridData[targetIdx] !== null) {
        gridData[targetIdx] = null;
        updateCellUI(targetIdx);
        selectCell(targetIdx);
        updateSummary();
        showToast(`Đã xóa số kg Bao #${targetIdx + 1}`);
    } else {
        showToast("Ô hiện tại đang trống!");
    }
}

// ===== Lưu đợt cân vào lịch sử =====
function saveBatchToHistory() {
    const farmer = document.getElementById('farmerName').value;
    const riceType = document.getElementById('riceType').value;
    const price = parseFloat(document.getElementById('ricePrice').value) || 0;

    const result = calculateAll(gridData, config.tarePerBag, config.deductRatio);
    const deposit = parseFloat(document.getElementById('billDeposit').value) || 0;
    const money = calculateMoney(result.netWeight, price, deposit);

    let history = loadHistory();
    let prevPaidState = false;

    if (editingBatchId) {
        const existing = history.find(item => item.id === editingBatchId);
        if (existing) prevPaidState = existing.isPaid || false;
    }

    const batchRecord = {
        id: editingBatchId ? editingBatchId : Date.now(),
        date: new Date().toLocaleDateString('vi-VN') + " " + new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}),
        boatName: config.boatName || "Ghe anh Tám (Kiên Giang)",
        farmer,
        farmerPhone: config.farmerPhone || "",
        farmerAddress: config.farmerAddress || "",
        riceType,
        price,
        totalBags: result.totalBags,
        grossWeight: result.grossWeight,
        netWeight: result.netWeight,
        totalTare: result.totalTare,
        tareRate: config.tarePerBag,
        deposit,
        totalAmount: money.totalAmount,
        remainingAmount: money.remaining,
        isPaid: prevPaidState,
        gridData: compactGridData(gridData)   // Chỉ lưu phần có dữ liệu
    };

    if (editingBatchId) {
        const existingIdx = history.findIndex(item => item.id === editingBatchId);
        if (existingIdx !== -1) {
            history[existingIdx] = batchRecord;
        } else {
            history.unshift(batchRecord);
        }
    } else {
        history.unshift(batchRecord);
    }

    saveHistory(history);

    document.getElementById('billDeposit').value = "0";
    clearGridForNextFarmer(true);
    closeBillModal();
    renderHomeDashboard();
    switchView('home');
    showToast("💾 Đã lưu & cập nhật đợt cân thành công!");
}

// ===== Load đợt cân để sửa =====
function loadBatchForEditing(batchId) {
    const history = loadHistory();
    const record = history.find(item => item.id === batchId);

    if (!record) {
        showToast("⚠️ Không tìm thấy đợt cân!");
        return;
    }

    editingBatchId = record.id;
    loadGridData(record.gridData || []);

    config.farmer = record.farmer || "Nông Dân Mới";
    config.farmerPhone = record.farmerPhone || "";
    config.farmerAddress = record.farmerAddress || "";
    config.riceType = record.riceType || "ST25";
    config.price = record.price || 8500;
    if (record.tareRate) config.tarePerBag = record.tareRate;

    document.getElementById('farmerName').value = config.farmer;
    document.getElementById('riceType').value = config.riceType;
    document.getElementById('ricePrice').value = config.price;
    document.getElementById('settingTare').value = config.tarePerBag;

    const badge = document.getElementById('editingBadge');
    if (badge) {
        badge.classList.remove('hidden');
        document.getElementById('editingFarmerTitle').innerText = config.farmer;
    }

    currentTablePage = 0;
    document.getElementById('currentTablePageLabel').innerText = "1";
    buildGridUI();

    // Tìm ô trống đầu tiên
    let firstEmptyIdx = 0;
    for (let i = 0; i < TOTAL_MAX_CELLS; i++) {
        if (gridData[i] === null) {
            firstEmptyIdx = i;
            break;
        }
    }
    selectCell(firstEmptyIdx);
    updateSummary();

    closeHistoryModal();
    closeHistoryDetailModal();
    switchView('scale');
    showToast(`Đã mở đợt cân của "${config.farmer}". Có thể nhập tiếp hoặc sửa!`);
}

function cancelEditingBatch() {
    editingBatchId = null;
    const badge = document.getElementById('editingBadge');
    if (badge) badge.classList.add('hidden');
    clearGridForNextFarmer(true);
    showToast("Đã thoát chế độ chỉnh sửa đợt cân!");
}

// ===== Xóa lịch sử =====
function deleteSingleHistory(id) {
    showConfirmModal(
        "Xóa Đợt Cân",
        "Bạn có muốn xóa đợt cân của nông dân này khỏi lịch sử?",
        () => {
            let history = loadHistory();
            history = history.filter(item => item.id !== id);
            saveHistory(history);
            openHistoryModal();
            renderHomeDashboard();
            showToast("Đã xóa đợt cân khỏi lịch sử!");
        }
    );
}

function clearAllHistory() {
    showConfirmModal(
        "Xóa Tất Cả Lịch Sử",
        "Bạn có chắc chắn muốn xóa toàn bộ lịch sử thu mua không? Dữ liệu không thể khôi phục!",
        () => {
            clearHistory();
            openHistoryModal();
            renderHomeDashboard();
            showToast("Đã xóa toàn bộ lịch sử!");
        }
    );
}

// ===== Đổi trạng thái đã trả tiền =====
function togglePaymentStatus(batchId, event) {
    if (event) event.stopPropagation();

    let history = loadHistory();
    const index = history.findIndex(item => item.id === batchId);

    if (index !== -1) {
        history[index].isPaid = !history[index].isPaid;
        saveHistory(history);

        const statusMsg = history[index].isPaid ? "Đã trả tiền" : "Chưa trả tiền";
        showToast(`Đã đổi trạng thái "${history[index].farmer}": ${statusMsg}`);

        renderHomeDashboard();
        if (!document.getElementById('historyModal').classList.contains('hidden')) {
            openHistoryModal();
        }
    }
}