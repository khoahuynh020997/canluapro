// ============================================
// calc.js - Các hàm tính toán
// ============================================

/**
 * Tính toán toàn bộ số liệu từ gridData
 * @param {Array} gridData - Mảng dữ liệu cân
 * @param {number} tarePerBag - Trọng lượng bì mỗi bao (kg)
 * @param {number} deductRatio - Tỷ lệ trừ hao (%)
 * @returns {Object} Kết quả tính toán
 */
function calculateAll(gridData, tarePerBag = 0.125, deductRatio = 0) {
    let totalBags = 0;
    let grossWeight = 0;

    for (let i = 0; i < gridData.length; i++) {
        if (gridData[i] !== null && gridData[i] !== undefined) {
            totalBags++;
            grossWeight += gridData[i];
        }
    }

    const totalTare = totalBags * (parseFloat(tarePerBag) || 0);
    const totalDeduct = ((grossWeight - totalTare) * ((parseFloat(deductRatio) || 0) / 100));
    const netWeight = Math.max(0, grossWeight - totalTare - totalDeduct);

    return {
        totalBags,
        grossWeight: parseFloat(grossWeight.toFixed(1)),
        totalTare: parseFloat(totalTare.toFixed(3)),
        totalDeduct: parseFloat(totalDeduct.toFixed(1)),
        netWeight: parseFloat(netWeight.toFixed(1))
    };
}

/**
 * Tính tổng tiền
 */
function calculateMoney(netWeight, price, deposit = 0) {
    const totalAmount = Math.round(netWeight * (parseFloat(price) || 0));
    const remaining = totalAmount - (parseFloat(deposit) || 0);

    return {
        totalAmount,
        remaining
    };
}

/**
 * Format số đẹp (dùng cho hiển thị)
 */
function formatNumber(val, decimals = 1) {
    if (val === null || val === undefined || isNaN(val)) return "0";
    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
    return num.toFixed(decimals);
}

/**
 * Format tiền Việt Nam
 */
function formatMoney(amount) {
    return Math.round(amount).toLocaleString('vi-VN');
}

/**
 * Chỉ lấy phần dữ liệu có giá trị (bỏ các null thừa phía sau)
 * Giúp tiết kiệm dung lượng khi lưu
 */
function compactGridData(gridData) {
    let lastIndex = -1;
    for (let i = 0; i < gridData.length; i++) {
        if (gridData[i] !== null && gridData[i] !== undefined) {
            lastIndex = i;
        }
    }
    if (lastIndex === -1) return [];
    return gridData.slice(0, lastIndex + 1);
}