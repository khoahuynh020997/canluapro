// ============================================
// ui.js - Giao diện, Modal, Toast, Danh sách
// ============================================

let pendingConfirmCallback = null;
let audioEnabled = true;

// ===== Toast thông báo =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    if (!toast || !msgEl) return;

    msgEl.innerText = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 2500);
}

// ===== Chuyển View =====
function switchView(viewName) {
    const homeView = document.getElementById('homeView');
    const scaleView = document.getElementById('scaleView');
    if (!homeView || !scaleView) return;

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        scaleView.classList.add('hidden');
        renderHomeDashboard();
    } else {
        homeView.classList.add('hidden');
        scaleView.classList.remove('hidden');
    }
}

// ===== Welcome Modal =====
function openWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.remove('hidden');
}

function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.add('hidden');
}

// ===== New Farmer Modal =====
function openNewFarmerModal() {
    editingBatchId = null;
    const badge = document.getElementById('editingBadge');
    if (badge) badge.classList.add('hidden');

    document.getElementById('newFarmerNameInput').value = "";
    document.getElementById('newFarmerPhoneInput').value = "";
    document.getElementById('newFarmerAddressInput').value = "";
    document.getElementById('newFarmerRiceTypeInput').value = config.riceType || "ST25";
    document.getElementById('newFarmerPriceInput').value = config.price || 8500;

    document.getElementById('newFarmerModal').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('newFarmerNameInput').focus();
    }, 200);
}

function closeNewFarmerModal() {
    document.getElementById('newFarmerModal').classList.add('hidden');
}

// ===== Settings Modal =====
function openSettingsModal() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// ===== Bill Modal =====
function openBillModal() {
    const result = calculateAll(gridData, config.tarePerBag, config.deductRatio);
    if (result.totalBags === 0) {
        showToast("Chưa có dữ liệu bao lúa nào!");
        return;
    }

    const price = parseFloat(document.getElementById('ricePrice').value) || 0;
    const money = calculateMoney(result.netWeight, price, 0);

    document.getElementById('billDate').innerText = `Ngày: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
    document.getElementById('billBoat').innerText = config.boatName || "Chưa nhập";
    document.getElementById('billFarmer').innerText = document.getElementById('farmerName').value;

    // Phone
    const phoneRow = document.getElementById('billPhoneRow');
    if (config.farmerPhone) {
        phoneRow.classList.remove('hidden');
        document.getElementById('billFarmerPhone').innerText = config.farmerPhone;
    } else {
        phoneRow.classList.add('hidden');
    }

    // Address
    const addrRow = document.getElementById('billAddressRow');
    if (config.farmerAddress) {
        addrRow.classList.remove('hidden');
        document.getElementById('billFarmerAddress').innerText = config.farmerAddress;
    } else {
        addrRow.classList.add('hidden');
    }

    document.getElementById('billRiceType').innerText = document.getElementById('riceType').value;
    document.getElementById('billUnitPrice').innerText = `${formatMoney(price)} đ/kg`;

    document.getElementById('billTotalBags').innerText = `${result.totalBags} bao`;
    document.getElementById('billGrossWeight').innerText = `${result.grossWeight} kg`;
    document.getElementById('billBagsForTare').innerText = result.totalBags;
    document.getElementById('billTareRate').innerText = formatNumber(config.tarePerBag, 3);
    document.getElementById('billTotalTare').innerText = `-${result.totalTare} kg`;

    document.getElementById('billDeductRate').innerText = formatNumber(config.deductRatio, 1);
    document.getElementById('billTotalDeduct').innerText = `-${result.totalDeduct} kg`;
    document.getElementById('billNetWeight').innerText = `${result.netWeight} kg`;
    document.getElementById('billTotalAmount').innerText = `${formatMoney(money.totalAmount)} đ`;

    document.getElementById('billDeposit').value = "0";
    calculateFinalMoney();

    document.getElementById('billModal').classList.remove('hidden');
}

function closeBillModal() {
    document.getElementById('billModal').classList.add('hidden');
}

function calculateFinalMoney() {
    const result = calculateAll(gridData, config.tarePerBag, config.deductRatio);
    const price = parseFloat(document.getElementById('ricePrice').value) || 0;
    const deposit = parseFloat(document.getElementById('billDeposit').value) || 0;
    const money = calculateMoney(result.netWeight, price, deposit);

    document.getElementById('billRemainingAmount').innerText = `${formatMoney(money.remaining)} đ`;
}

// ===== History Modal =====
function openHistoryModal() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    const history = loadHistory();

    if (history.length === 0) {
        historyList.innerHTML = `<p class="text-center text-slate-400 py-6 text-xs">Chưa có chuyến lúa nào trên ghe.</p>`;
    } else {
        history.forEach((item, index) => {
            const stt = index + 1;
            const netWeight = item.netWeight !== undefined ? item.netWeight : 0;
            const totalAmount = item.totalAmount !== undefined ? item.totalAmount : 0;
            const remainingAmount = item.remainingAmount !== undefined ? item.remainingAmount : totalAmount - (item.deposit || 0);

            const isPaid = item.isPaid || false;
            const cardBgClass = isPaid ? "bg-emerald-50/90 border-emerald-300" : "bg-slate-50 border-slate-200 hover:border-amber-400";
            const paidBtnClass = isPaid ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800";
            const paidText = isPaid ? "✓ Đã Trả Tiền" : "⊙ Chưa Trả";

            const contactMeta = [];
            if (item.farmerPhone) contactMeta.push(`📞 ${item.farmerPhone}`);
            if (item.farmerAddress) contactMeta.push(`📍 ${item.farmerAddress}`);
            const contactStr = contactMeta.length > 0 ? `<span class="text-[10px] text-slate-500 font-normal block">${contactMeta.join(' • ')}</span>` : '';

            const card = document.createElement('div');
            card.className = `${cardBgClass} border p-2.5 rounded-xl text-xs space-y-2 shadow-sm transition relative group`;

            card.innerHTML = `
                <div class="flex justify-between items-start font-bold text-slate-800 border-b border-slate-200 pb-1 pr-6">
                    <div class="flex-1 cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                        <span class="text-blue-700 font-extrabold flex items-center gap-1.5 text-sm">
                            <span class="bg-amber-500 text-white rounded-md px-1.5 py-0.5 text-[11px] font-black shadow-sm">#${stt}</span>
                            <i class="fa-solid fa-user-tag text-amber-500"></i> ${item.farmer}
                            <span onclick="event.stopPropagation(); loadBatchForEditing(${item.id});" class="p-1.5 bg-amber-100 rounded text-amber-800 hover:bg-amber-200"><i class="fa-solid fa-pen text-[10px]"></i></span>
                        </span>
                        ${contactStr}
                    </div>
                    <span class="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 font-black">${formatMoney(item.price)} đ/kg</span>
                </div>

                <button onclick="event.stopPropagation(); deleteSingleHistory(${item.id});" class="absolute top-2 right-2 text-slate-300 hover:text-rose-600 p-1 rounded transition" title="Xóa đợt cân này">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>

                <div class="grid grid-cols-2 gap-1 text-[11px] bg-white p-1.5 rounded border border-slate-200 cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                    <div>
                        <span class="text-slate-400 block text-[9px]">SỐ BAO CÂN:</span>
                        <b class="text-slate-800 font-black">${item.totalBags} bao</b> <span class="text-[10px] text-slate-400">(${item.grossWeight}kg gộp)</span>
                    </div>
                    <div class="text-right">
                        <span class="text-slate-400 block text-[9px]">SỐ KG ĐÃ TRỪ BÌ:</span>
                        <b class="text-emerald-700 font-extrabold">${netWeight} kg</b>
                    </div>
                </div>

                <div class="flex justify-between items-center bg-amber-50/80 p-1.5 rounded border border-amber-200 text-xs">
                    <div class="cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                        <span class="text-slate-500 block text-[9px]">TỔNG TIỀN LÚA:</span>
                        <span class="font-extrabold text-slate-800">${formatMoney(totalAmount)} đ</span>
                    </div>
                    <div class="text-right flex items-center gap-2">
                        <div class="cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                            <span class="text-amber-700 block text-[9px] font-bold">CÒN TRẢ:</span>
                            <span class="font-black text-rose-700 text-sm">${formatMoney(remainingAmount)} đ</span>
                        </div>
                        <button onclick="togglePaymentStatus(${item.id}, event)" class="${paidBtnClass} text-[10px] font-extrabold px-2 py-0.5 rounded-md transition active:scale-95">
                            ${paidText}
                        </button>
                    </div>
                </div>

                <div class="flex justify-between items-center text-[10px] text-slate-400 pt-0.5 cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                    <span>Giống: <b>${item.riceType}</b> • Ghe: <b>${item.boatName || 'Chưa rõ'}</b></span>
                    <span class="text-amber-700 font-bold flex items-center gap-0.5">
                        <span>Mở nhập tiếp</span> <i class="fa-solid fa-chevron-right text-[8px]"></i>
                    </span>
                </div>
            `;
            historyList.appendChild(card);
        });
    }

    document.getElementById('historyModal').classList.remove('hidden');
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.add('hidden');
}

function closeHistoryDetailModal() {
    document.getElementById('historyDetailModal').classList.add('hidden');
}

// ===== Confirm Modal =====
function showConfirmModal(title, message, onConfirm, btnText = "Đồng Ý Xóa", btnClass = "bg-rose-600 hover:bg-rose-700") {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;

    const btn = document.getElementById('confirmExecuteBtn');
    btn.innerText = btnText;
    btn.className = `flex-1 text-white font-bold py-2 rounded-lg text-xs shadow-sm transition ${btnClass}`;

    pendingConfirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirmModal() {
    pendingConfirmCallback = null;
    document.getElementById('confirmModal').classList.add('hidden');
}

function executeConfirmAction() {
    if (typeof pendingConfirmCallback === 'function') {
        pendingConfirmCallback();
    }
    closeConfirmModal();
}

// ===== Home Dashboard =====
function renderHomeDashboard() {
    const history = loadHistory();
    let totalNetWeight = 0;
    let totalAmount = 0;

    const homeList = document.getElementById('homeRecentList');
    if (homeList) homeList.innerHTML = '';

    if (history.length === 0) {
        if (homeList) homeList.innerHTML = `<p class="text-center text-slate-400 py-6 text-xs">Chưa có chuyến lúa nào trên ghe.</p>`;
    } else {
        history.forEach((item, index) => {
            const net = item.netWeight !== undefined ? item.netWeight : 0;
            const amt = item.totalAmount !== undefined ? item.totalAmount : 0;

            totalNetWeight += net;
            totalAmount += amt;

            if (homeList && index < 10) {
                const isPaid = item.isPaid || false;
                const bgClass = isPaid ? "bg-emerald-50/90 border-emerald-300" : "bg-slate-50 border-slate-200 hover:border-amber-400";
                const paidBtnClass = isPaid ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800";
                const paidText = isPaid ? "✓ Đã Trả Tiền" : "⊙ Chưa Trả";
                const phoneText = item.farmerPhone ? ` • 📞 ${item.farmerPhone}` : '';

                const card = document.createElement('div');
                card.className = `${bgClass} border p-2.5 rounded-xl text-xs flex justify-between items-center shadow-sm transition relative group`;

                card.innerHTML = `
                    <div class="flex-1 cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                        <span class="font-extrabold text-blue-800 text-sm flex items-center gap-1.5">
                            <span>#${index+1}. ${item.farmer}</span>
                            <span onclick="event.stopPropagation(); loadBatchForEditing(${item.id});" class="p-1.5 bg-amber-100 rounded text-amber-800 hover:bg-amber-200"><i class="fa-solid fa-pen text-[10px]"></i></span>
                        </span>
                        <span class="text-[10px] text-slate-500 block font-medium mt-0.5">
                            ${item.riceType} • <b>${item.totalBags} bao</b>${phoneText}
                        </span>
                        ${item.farmerAddress ? `<span class="text-[9px] text-slate-400 block">${item.farmerAddress}</span>` : ''}
                    </div>
                    <div class="text-right flex flex-col items-end gap-1">
                        <div class="cursor-pointer select-none" onclick="loadBatchForEditing(${item.id})">
                            <span class="font-black text-emerald-700 text-sm block leading-tight">${net} kg</span>
                            <span class="text-xs text-amber-700 font-extrabold block leading-tight">${formatMoney(amt)} đ</span>
                        </div>
                        <button onclick="togglePaymentStatus(${item.id}, event)" class="${paidBtnClass} text-[10px] font-extrabold px-2 py-0.5 rounded-md transition active:scale-95">
                            ${paidText}
                        </button>
                    </div>
                `;
                homeList.appendChild(card);
            }
        });
    }

    const totalWeightEl = document.getElementById('homeTotalNetWeight');
    const totalAmountEl = document.getElementById('homeTotalAmount');
    if (totalWeightEl) totalWeightEl.innerText = `${totalNetWeight.toFixed(1)} kg`;
    if (totalAmountEl) totalAmountEl.innerText = `${formatMoney(totalAmount)} đ`;
}

// ===== Âm thanh =====
function toggleAudio() {
    audioEnabled = !audioEnabled;
    config.voiceEnabled = audioEnabled;
    const icon = document.getElementById('audioIcon');
    if (icon) {
        icon.className = audioEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    }
    showToast(audioEnabled ? "Đã BẬT âm thanh đọc số" : "Đã TẮT âm thanh");
}

function speakNumber(num) {
    if (!('speechSynthesis' in window) || !audioEnabled) return;
    window.speechSynthesis.cancel();

    const numStr = num.toFixed(1).toString().replace('.', ' phẩy ');
    const utterance = new SpeechSynthesisUtterance(numStr);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
}

function playBeepSound() {
    if (!audioEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
        // Bỏ qua lỗi audio
    }
}

function shareOrPrint() {
    window.print();
}