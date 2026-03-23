// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

let _thuocData = {
    viThuoc: [],
    baiThuoc: [],
    activeTab: 'vi-thuoc',
};

// ─── Khởi tạo ─────────────────────────────────────────────
async function initThuocManagement() {
    await loadAllThuocData();
    renderThuocSection();
}

async function loadAllThuocData() {
    try {
        const [vt, bt] = await Promise.all([
            apiGetViThuoc(),
            apiGetBaiThuoc(),
        ]);
        _thuocData.viThuoc = vt || [];
        _thuocData.baiThuoc = bt || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Thuốc:', e);
    }
}

// ─── Render section chính ─────────────────────────────────
function renderThuocSection() {
    const container = document.getElementById('thuoc-section');
    if (!container) return;

    const tab = _thuocData.activeTab;
    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin:0;">Quản Lý Thuốc (Vị thuốc & Bài thuốc)</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border); overflow-x:auto; white-space:nowrap;">
                <button class="tayy-tab ${tab === 'vi-thuoc' ? 'active' : ''}" onclick="switchThuocTab('vi-thuoc')">Danh mục Vị thuốc</button>
                <button class="tayy-tab ${tab === 'bai-thuoc' ? 'active' : ''}" onclick="switchThuocTab('bai-thuoc')">Danh mục Bài thuốc</button>
            </div>

            <div id="thuoc-tab-content"></div>
        </div>
    `;

    renderThuocTabContent();
}

function switchThuocTab(tab) {
    _thuocData.activeTab = tab;
    renderThuocSection();
}

function renderThuocTabContent() {
    const el = document.getElementById('thuoc-tab-content');
    if (!el) return;

    switch (_thuocData.activeTab) {
        case 'vi-thuoc': renderViThuocTab(el); break;
        case 'bai-thuoc': renderBaiThuocTab(el); break;
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: VỊ THUỐC
// ═══════════════════════════════════════════════════════════
function renderViThuocTab(el) {
    const rows = _thuocData.viThuoc.map(item => `
        <tr>
            <td><strong>${escHtml(item.ten_vi_thuoc)}</strong></td>
            <td style="text-align:center;">${escHtml(item.tinh_vi)}</td>
            <td style="text-align:center;">${escHtml(item.quy_kinh)}</td>
            <td style="font-size:0.8rem;">${escHtml(item.cong_dung)}</td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th>Tên vị thuốc</th><th style="text-align:center;">Khí vị</th><th style="text-align:center;">Quy kinh</th><th>Công dụng</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;
    showTayyModal('Vị thuốc', `
        <label class="tayy-form-label">Tên vị thuốc<br><input id="vt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_vi_thuoc) : ''}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Khí vị<br><input id="vt-inp-tinhvi" type="text" class="tayy-form-input" value="${item ? escHtml(item.tinh_vi) : ''}"></label>
            <label class="tayy-form-label">Quy kinh<br><input id="vt-inp-quykinh" type="text" class="tayy-form-input" value="${item ? escHtml(item.quy_kinh) : ''}"></label>
        </div>
        <label class="tayy-form-label">Công dụng<br><textarea id="vt-inp-congdung" class="tayy-form-input" rows="3">${item ? escHtml(item.cong_dung) : ''}</textarea></label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id || 0})">Lưu</button>
        </div>
    `);
}

async function saveViThuoc(id) {
    const payload = { 
        ten_vi_thuoc: document.getElementById('vt-inp-ten').value.trim(), 
        tinh_vi: document.getElementById('vt-inp-tinhvi').value.trim(), 
        quy_kinh: document.getElementById('vt-inp-quykinh').value.trim(), 
        cong_dung: document.getElementById('vt-inp-congdung').value.trim() 
    };
    if(!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if(!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteViThuoc(id) {
    if(confirm('Xóa vị thuốc này?')) { 
        await apiDeleteViThuoc(id); 
        await loadAllThuocData(); 
        renderThuocSection(); 
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: BÀI THUỐC
// ═══════════════════════════════════════════════════════════
function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ingredients = (item.chiTietViThuoc || []).map(d => `${d.viThuoc?.ten_vi_thuoc} (${d.lieu_luong || ''})`).join(', ');
        return `
            <tr>
                <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
                <td>${escHtml(item.nguon_goc || '—')}</td>
                <td style="font-size:0.8rem;">${escHtml(ingredients || 'Chưa có vị thuốc')}</td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openBaiThuocForm(${item.id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBaiThuoc(${item.id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBaiThuocForm()">+ Thêm bài thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Thành phần</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openBaiThuocForm(id) {
    const item = id ? _thuocData.baiThuoc.find(x => x.id == id) : null;
    showTayyModal('Bài thuốc', `
        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item?escHtml(item.ten_bai_thuoc):''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item?escHtml(item.nguon_goc):''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item?escHtml(item.cach_dung):''}</textarea></label>
        <p style="font-size:0.8rem; color:#8B7355; margin:10px 0 5px;">* Thành phần chi tiết có thể chỉnh sửa sau khi khởi tạo bài thuốc.</p>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBaiThuoc(${id||0})">Lưu</button>
        </div>
    `);
}

async function saveBaiThuoc(id) {
    const payload = { 
        ten_bai_thuoc: document.getElementById('bt-inp-ten').value.trim(), 
        nguon_goc: document.getElementById('bt-inp-source').value.trim(), 
        cach_dung: document.getElementById('bt-inp-usage').value.trim() 
    };
    if(!payload.ten_bai_thuoc) return alert('Thiếu tên bài thuốc');
    const res = id ? await apiUpdateBaiThuoc(id, payload) : await apiCreateBaiThuoc(payload);
    if(!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteBaiThuoc(id) {
    if(confirm('Xóa bài thuốc này?')) { 
        await apiDeleteBaiThuoc(id); 
        await loadAllThuocData(); 
        renderThuocSection(); 
    }
}
