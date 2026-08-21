// ============================================
// grid.js - Quản lý bảng cân 5x5
// ============================================

const ROWS_PER_COL = 5;
const TOTAL_COLS_PER_TABLE = 5;
const CELLS_PER_TABLE = ROWS_PER_COL * TOTAL_COLS_PER_TABLE; // 25
const MAX_TABLE_PAGES = 100;
const TOTAL_MAX_CELLS = CELLS_PER_TABLE * MAX_TABLE_PAGES; // 2500

let gridData = new Array(TOTAL_MAX_CELLS).fill(null);
let currentIndex = 0;
let currentTablePage = 0;

/**
 * Xây dựng giao diện bảng cân cho trang hiện tại
 */
function buildGridUI() {
    const container = document.getElementById('gridContainer');
    if (!container) return;
    container.innerHTML = '';

    const pageBaseIndex = currentTablePage * CELLS_PER_TABLE;
    const codeBaseNumber = currentTablePage * TOTAL_COLS_PER_TABLE;

    for (let c = 0; c < TOTAL_COLS_PER_TABLE; c++) {
        const colDiv = document.createElement('div');
        colDiv.className = "flex flex-col h-full justify-between bg-slate-50/90 p-0.5 rounded-lg border border-slate-200";

        // Header mã
        const header = document.createElement('div');
        header.className = "text-center font-black text-sm sm:text-base text-slate-900 border-b border-slate-200 pb-0.5 mb-0.5 bg-amber-100/80 rounded py-0.5 shadow-sm";
        header.innerText = `MÃ ${codeBaseNumber + c + 1}`;
        colDiv.appendChild(header);

        // Các ô bao
        const cellsDiv = document.createElement('div');
        cellsDiv.className = "flex-1 flex flex-col justify-between gap-0.5";

        for (let r = 0; r < ROWS_PER_COL; r++) {
            const localIndex = c * ROWS_PER_COL + r;
            const globalIndex = pageBaseIndex + localIndex;
            const baoNumber = globalIndex + 1;

            const cellBtn = document.createElement('button');
            cellBtn.id = `cell-${globalIndex}`;
            cellBtn.onclick = () => selectCell(globalIndex);
            cellBtn.className = "cell-item bg-white border border-slate-200 rounded py-0.5 px-0.5 flex flex-col items-center justify-center transition relative h-full min-h-[40px]";

            cellBtn.innerHTML = `
                <span class="text-[9px] text-slate-400 font-extrabold leading-none">Bao ${baoNumber}</span>
                <span class="text-base sm:text-lg font-black text-slate-800 leading-tight val-text">--.--</span>
            `;
            cellsDiv.appendChild(cellBtn);
        }

        colDiv.appendChild(cellsDiv);

        // Footer tổng mã
        const footer = document.createElement('div');
        footer.className = "mt-0.5 pt-0.5 border-t border-slate-200 text-center bg-amber-100 rounded py-0.5";
        footer.innerHTML = `
            <span class="text-[8px] text-slate-500 font-extrabold block leading-none">T.MÃ</span>
            <span id="col-total-${c}" class="font-black text-xs sm:text-sm text-amber-900 leading-tight">0.0</span>
        `;
        colDiv.appendChild(footer);

        container.appendChild(colDiv);
    }

    // Cập nhật dữ liệu lên các ô
    for (let i = 0; i < CELLS_PER_TABLE; i++) {
        updateCellUI(pageBaseIndex + i);
    }
    updateSummary();
}

/**
 * Chọn ô đang nhập
 */
function selectCell(index) {
    if (index < 0 || index >= TOTAL_MAX_CELLS) return;

    const targetPage = Math.floor(index / CELLS_PER_TABLE);
    if (targetPage !== currentTablePage) {
        currentTablePage = targetPage;
        const label = document.getElementById('currentTablePageLabel');
        if (label) label.innerText = currentTablePage + 1;
        buildGridUI();
    }

    // Bỏ highlight ô cũ
    const prevCell = document.getElementById(`cell-${currentIndex}`);
    if (prevCell) {
        prevCell.classList.remove('active-cell', 'bg-blue-50', 'border-blue-500');
    }

    currentIndex = index;
    currentInputStr = "";
    const display = document.getElementById('keypadDisplay');
    if (display) display.innerText = "0";

    const newCell = document.getElementById(`cell-${currentIndex}`);
    if (newCell) {
        newCell.classList.add('active-cell');
    }

    const baoLabel = document.getElementById('currentBaoLabel');
    if (baoLabel) baoLabel.innerText = `#${currentIndex + 1}`;
}

/**
 * Cập nhật hiển thị 1 ô
 */
function updateCellUI(index) {
    const cell = document.getElementById(`cell-${index}`);
    if (!cell) return;

    const valText = cell.querySelector('.val-text');
    if (!valText) return;

    if (gridData[index] !== null && gridData[index] !== undefined) {
        valText.innerText = gridData[index].toFixed(1);
        valText.classList.remove('text-slate-800');
        valText.classList.add('text-blue-700', 'font-black');
    } else {
        valText.innerText = "--.--";
        valText.classList.remove('text-blue-700', 'font-black');
        valText.classList.add('text-slate-800');
    }
}

/**
 * Cập nhật tổng kết (số bao + tổng kg)
 */
function updateSummary() {
    let totalBags = 0;
    let grossWeight = 0;

    // Tổng theo cột (chỉ trang hiện tại)
    const pageBaseIndex = currentTablePage * CELLS_PER_TABLE;
    for (let c = 0; c < TOTAL_COLS_PER_TABLE; c++) {
        let colSum = 0;
        for (let r = 0; r < ROWS_PER_COL; r++) {
            const idx = pageBaseIndex + c * ROWS_PER_COL + r;
            if (gridData[idx] !== null && gridData[idx] !== undefined) {
                colSum += gridData[idx];
            }
        }
        const totalElem = document.getElementById(`col-total-${c}`);
        if (totalElem) totalElem.innerText = colSum.toFixed(1);
    }

    // Tổng toàn bộ
    for (let i = 0; i < TOTAL_MAX_CELLS; i++) {
        if (gridData[i] !== null && gridData[i] !== undefined) {
            totalBags++;
            grossWeight += gridData[i];
        }
    }

    const bagsEl = document.getElementById('totalBags');
    const codesEl = document.getElementById('totalCodes');
    const weightEl = document.getElementById('grossWeight');

    if (bagsEl) bagsEl.innerText = totalBags;
    if (codesEl) codesEl.innerText = (totalBags / 5).toFixed(1);
    if (weightEl) weightEl.innerText = grossWeight.toFixed(1);
}

/**
 * Đổi trang bảng (trước / sau)
 */
function changeTablePage(delta) {
    const newPage = currentTablePage + delta;
    if (newPage < 0 || newPage >= MAX_TABLE_PAGES) return;

    currentTablePage = newPage;
    const label = document.getElementById('currentTablePageLabel');
    if (label) label.innerText = currentTablePage + 1;

    buildGridUI();
    selectCell(currentTablePage * CELLS_PER_TABLE);
}

/**
 * Xóa sạch bảng để bắt đầu nông dân mới
 */
function clearGridData() {
    gridData = new Array(TOTAL_MAX_CELLS).fill(null);
    currentTablePage = 0;
    currentIndex = 0;

    const label = document.getElementById('currentTablePageLabel');
    if (label) label.innerText = "1";

    buildGridUI();
    selectCell(0);
    updateSummary();
}

/**
 * Load dữ liệu grid từ lịch sử (khi sửa)
 */
function loadGridData(savedGrid) {
    gridData = new Array(TOTAL_MAX_CELLS).fill(null);
    if (savedGrid && Array.isArray(savedGrid)) {
        for (let i = 0; i < savedGrid.length && i < TOTAL_MAX_CELLS; i++) {
            gridData[i] = savedGrid[i];
        }
    }
}