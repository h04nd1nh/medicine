// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

let _thuocData = {
    viThuoc: [],
    baiThuoc: [],
    kinhMach: [],
    huyetVi: [],
    bienChung: [],
    phapTri: [],
    trieuChung: [],
    nhomDuocLy: [],
    congDung: [],
    chuTri: [],
    kiengKy: [],
    activeTab: 'vi-thuoc',
};

// Draft de chi_tiet (thành phần vị thuốc) đang được chỉnh trong modal bài thuốc
let _btDraftChiTiet = [];
// Draft chips cho biện chứng, triệu chứng, pháp trị
let _btDraftBienChung = [];
let _btDraftTrieuChung = [];
let _btDraftPhapTri = [];

// ─── Khởi tạo ─────────────────────────────────────────────
async function initThuocManagement() {
    await loadAllThuocData();
    renderThuocSection();
}

async function loadAllThuocData() {
    try {
        const [vt, bt, km, hv, bc, pt, tc, ndl, cd, cn, kk] = await Promise.all([
            apiGetViThuoc(),
            apiGetBaiThuoc(),
            apiGetKinhMach(),
            apiGetHuyetVi(),
            apiGetBienChung(),
            apiGetPhapTri(),
            apiGetTrieuChung(),
            apiGetNhomDuocLy(),
            apiGetCongDung(),
            apiGetChuTri(),
            apiGetKiengKy(),
        ]);
        _thuocData.viThuoc = vt || [];
        _thuocData.baiThuoc = bt || [];
        _thuocData.kinhMach = km || [];
        _thuocData.huyetVi = hv || [];
        _thuocData.bienChung = bc || [];
        _thuocData.phapTri = pt || [];
        _thuocData.trieuChung = tc || [];
        _thuocData.nhomDuocLy = ndl || [];
        _thuocData.congDung = cd || [];
        _thuocData.chuTri = cn || [];
        _thuocData.kiengKy = kk || [];
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
                <button class="tayy-tab ${tab === 'bien-chung' ? 'active' : ''}" onclick="switchThuocTab('bien-chung')">Biện chứng</button>
                <button class="tayy-tab ${tab === 'phap-tri' ? 'active' : ''}" onclick="switchThuocTab('phap-tri')">Pháp trị</button>
                <button class="tayy-tab ${tab === 'nhom-duoc-ly' ? 'active' : ''}" onclick="switchThuocTab('nhom-duoc-ly')">Nhóm dược lý</button>
                <button class="tayy-tab ${tab === 'cong-dung' ? 'active' : ''}" onclick="switchThuocTab('cong-dung')">Công dụng</button>
                <button class="tayy-tab ${tab === 'chu-tri' ? 'active' : ''}" onclick="switchThuocTab('chu-tri')">Chủ trị</button>
                <button class="tayy-tab ${tab === 'kieng-ky' ? 'active' : ''}" onclick="switchThuocTab('kieng-ky')">Kiêng kỵ</button>
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
        case 'bien-chung': renderBienChungTab(el); break;
        case 'phap-tri': renderPhapTriTab(el); break;
        case 'nhom-duoc-ly': renderNhomDuocLyTab(el); break;
        case 'cong-dung': renderCongDungTab(el); break;
        case 'chu-tri': renderChuTriTab(el); break;
        case 'kieng-ky': renderKiengKyTab(el); break;
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: BIỆN CHỨNG
// ═══════════════════════════════════════════════════════════
function renderBienChungTab(el) {
    const rows = (_thuocData.bienChung || []).map(item => {
        const id = item.id;
        const usageCount = (_thuocData.baiThuoc || []).filter(bt =>
            (bt.bien_chung || '').split(',').map(s => s.trim()).includes(item.ten_bien_chung)
        ).length;
        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(item.ten_bien_chung)}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} bài thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openBienChungForm(${id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBienChung(${id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;color:#A09580;">
                Tổng: <strong>${(_thuocData.bienChung||[]).length}</strong> biện chứng
            </div>
            <button class="btn btn-primary" onclick="openBienChungForm()">+ Thêm biện chứng</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên biện chứng</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có biện chứng nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openBienChungForm(id) {
    const item = id ? (_thuocData.bienChung || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa biện chứng' : 'Thêm biện chứng', `
        <label class="tayy-form-label">Tên biện chứng *<br>
            <input id="bc-inp-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_bien_chung) : ''}"
                placeholder="VD: Can đảm thấp nhiệt, Thận dương hư...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBienChung(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('bc-inp-ten')?.focus(), 50);
}

async function saveBienChung(id) {
    const ten = (document.getElementById('bc-inp-ten')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên biện chứng!');
    const payload = { ten_bien_chung: ten };
    const res = id ? await apiUpdateBienChung(id, payload) : await apiCreateBienChung(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteBienChung(id) {
    if (!confirm('Xóa biện chứng này?')) return;
    await apiDeleteBienChung(id);
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════
// TAB: PHÁP TRị
// ═══════════════════════════════════════════════════════════
function renderPhapTriTab(el) {
    const rows = (_thuocData.phapTri || []).map(item => {
        const id = item.id;
        const usageCount = (_thuocData.baiThuoc || []).filter(bt =>
            (bt.phap_tri || '').split(',').map(s => s.trim()).includes(item.ten_phap_tri)
        ).length;
        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(item.ten_phap_tri)}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} bài thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openPhapTriForm(${id})">&#9999; Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePhapTri(${id})">&#128465;</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;color:#A09580;">
                Tổng: <strong>${(_thuocData.phapTri||[]).length}</strong> pháp trị
            </div>
            <button class="btn btn-primary" onclick="openPhapTriForm()">+ Thêm pháp trị</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên pháp trị</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có pháp trị nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openPhapTriForm(id) {
    const item = id ? (_thuocData.phapTri || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa pháp trị' : 'Thêm pháp trị', `
        <label class="tayy-form-label">Tên pháp trị *<br>
            <input id="pt-inp-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_phap_tri) : ''}"
                placeholder="VD: Bổ thận dưỡng, Thanh can tả hỏa...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhapTri(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('pt-inp-ten')?.focus(), 50);
}

async function savePhapTri(id) {
    const ten = (document.getElementById('pt-inp-ten')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên pháp trị!');
    const payload = { ten_phap_tri: ten };
    const res = id ? await apiUpdatePhapTri(id, payload) : await apiCreatePhapTri(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deletePhapTri(id) {
    if (!confirm('Xóa pháp trị này?')) return;
    await apiDeletePhapTri(id);
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════
// TAB: VỊ THUỐC
// ═══════════════════════════════════════════════════════════

// Mapping Tính (Tứ Khí): tên hiển thị → số
const _TINH_OPTIONS = [
    { label: 'Đại Hàn', value: -2 },
    { label: 'Hàn',     value: -1 },
    { label: 'Bình',    value:  0 },
    { label: 'Ôn',      value:  1 },
    { label: 'Nhiệt',   value:  2 },
];

// Mapping Hướng (Thăng/Giáng): tên hiển thị → số
const _HUONG_OPTIONS = [
    { label: 'Giáng mạnh', value: 1 },
    { label: 'Giáng nhẹ',  value: 2 },
    { label: 'Bình',       value: 3 },
    { label: 'Thăng nhẹ',  value: 4 },
    { label: 'Thăng mạnh', value: 5 },
];

function _tinhLabel(num) {
    const opt = _TINH_OPTIONS.find(o => o.value === Number(num));
    return opt ? opt.label : (num != null ? String(num) : '—');
}
function _huongLabel(num) {
    const opt = _HUONG_OPTIONS.find(o => o.value === Number(num));
    return opt ? opt.label : (num != null ? String(num) : '—');
}

function renderViThuocTab(el) {
    const rows = _thuocData.viThuoc.map(item => {
        const aliasStr = item.ten_goi_khac ? `<div style="font-size:0.75rem; color:#A09580; font-style:italic;">(${escHtml(item.ten_goi_khac)})</div>` : '';
        // Công dụng: format "cd||ghi chú" or plain "cd"
        const congDungHtml = (item.cong_dung || '').split('; ').filter(Boolean).map(entry => {
            const parts = entry.split('||');
            const cd = escHtml(parts[0] || '');
            const note = parts[1] ? `<span style="color:#A09580; font-style:italic;"> — ${escHtml(parts[1])}</span>` : '';
            return `• ${cd}${note}`;
        }).join('<br>');

        // Ngũ vị summary
        const viParts = [];
        if (Number(item.vi_toan) > 0) viParts.push(`Chua(${item.vi_toan})`);
        if (Number(item.vi_khu)  > 0) viParts.push(`Đắng(${item.vi_khu})`);
        if (Number(item.vi_cam)  > 0) viParts.push(`Ngọt(${item.vi_cam})`);
        if (Number(item.vi_tan)  > 0) viParts.push(`Cay(${item.vi_tan})`);
        if (Number(item.vi_ham)  > 0) viParts.push(`Mặn(${item.vi_ham})`);

        // Quy kinh: stored as full names, display shortened
        const quyKinhShort = (item.quy_kinh || '').split(',').map(s => {
            const s2 = s.trim();
            const km = (_thuocData.kinhMach || []).find(k => k.ten_kinh_mach === s2);
            return km ? (km.ten_viet_tat || s2) : s2;
        }).filter(Boolean).join(', ');

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:#5B3A1A;">${escHtml(item.ten_vi_thuoc)}</div>
                    ${aliasStr}
                    ${item.nhom_duoc_ly ? `<div style="font-size:0.72rem;color:#8B7355;margin-top:2px;">📂 ${escHtml(item.nhom_duoc_ly)}</div>` : ''}
                </td>
                <td style="text-align:center;">${_tinhLabel(item.tu_khi)}</td>
                <td style="font-size:0.78rem;text-align:center;">${escHtml(viParts.join(', ') || '—')}</td>
                <td style="text-align:center; font-size:0.8rem;">${_huongLabel(item.huong_tgpt)}</td>
                <td style="text-align:center; font-size:0.78rem;">${escHtml(quyKinhShort || '—')}</td>
                <td style="font-size:0.78rem; line-height:1.4;">${congDungHtml || '—'}</td>
                <td style="text-align:center;width:120px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th>
                    <th style="text-align:center;">Tính</th>
                    <th style="text-align:center;">Vị</th>
                    <th style="text-align:center;">Hướng</th>
                    <th style="text-align:center;">Quy kinh</th>
                    <th>Công dụng</th>
                    <th style="width:120px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

// Code cho form Vị Thuốc đã được chuyển sang thuoc-yhct-analysis.js

function vtRenderQuyKinhChips() {
    const container = document.getElementById('vt-quykinh-chips');
    const input = document.getElementById('vt-inp-quykinh');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _vtCurrentQuyKinh.forEach(fullName => {
        // Display as abbreviated name if available
        const km = (_thuocData.kinhMach || []).find(k => k.ten_kinh_mach === fullName);
        const displayName = km ? (km.ten_viet_tat || fullName) : fullName;
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.title = fullName; // Full name on hover
        chip.innerHTML = `${escHtml(displayName)} <span class="chip-remove" onclick="vtRemoveQuyKinhChip('${escHtml(fullName)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function vtRemoveQuyKinhChip(name) {
    _vtCurrentQuyKinh = _vtCurrentQuyKinh.filter(x => x !== name);
    vtRenderQuyKinhChips();
}

function vtRemoveLastQuyKinhChip() {
    if (_vtCurrentQuyKinh.length > 0) {
        _vtCurrentQuyKinh.pop();
        vtRenderQuyKinhChips();
    }
}

function vtOnQuyKinhSearchInput(val) {
    const suggestEl = document.getElementById('vt-quykinh-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    // Match by abbreviated name or full name
    const allKM = (_thuocData.kinhMach || []).filter(k =>
        (k.ten_viet_tat || '').toLowerCase().includes(query) ||
        (k.ten_kinh_mach || '').toLowerCase().includes(query)
    );
    const filtered = allKM.filter(k => !_vtCurrentQuyKinh.includes(k.ten_kinh_mach)).slice(0, 10);

    if (filtered.length === 0) { suggestEl.style.display = 'none'; return; }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = filtered.map(k => `
        <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background='transparent'"
             onclick="vtSelectQuyKinh('${escHtml(k.ten_kinh_mach)}')">
            <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">
                ${k.ten_viet_tat ? `<span style="background:#E8DCCB; border-radius:4px; padding:1px 6px; margin-right:6px;">${escHtml(k.ten_viet_tat)}</span>` : ''}
                ${escHtml(k.ten_kinh_mach)}
            </div>
        </div>
    `).join('');
}

function vtSelectQuyKinh(fullName) {
    if (!_vtCurrentQuyKinh.includes(fullName)) {
        _vtCurrentQuyKinh.push(fullName);
    }
    const inp = document.getElementById('vt-inp-quykinh');
    if (inp) { inp.value = ''; inp.focus(); }
    vtRenderQuyKinhChips();
    const s = document.getElementById('vt-quykinh-suggest');
    if (s) s.style.display = 'none';
}

function vtSelectQuyKinhByLabel(label) {
    // Try to find by abbreviated name
    const km = (_thuocData.kinhMach || []).find(k =>
        (k.ten_viet_tat || '').toLowerCase() === label.toLowerCase() ||
        (k.ten_kinh_mach || '').toLowerCase() === label.toLowerCase()
    );
    vtSelectQuyKinh(km ? km.ten_kinh_mach : label);
}

// ── Công dụng với ghi chú ─────────────────────────────────
function vtRenderCongDungList() {
    const container = document.getElementById('vt-congdung-list');
    if (!container) return;
    container.innerHTML = _vtCurrentCongDung.map((entry, idx) => `
        <div style="display:flex; gap:6px; align-items:center;">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:2;"
                value="${escHtml(entry.text || '')}"
                oninput="_vtCurrentCongDung[${idx}].text = this.value"
                placeholder="Nhập công dụng...">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:1; font-style:italic; color:#8B7355;"
                value="${escHtml(entry.note || '')}"
                oninput="_vtCurrentCongDung[${idx}].note = this.value"
                placeholder="Ghi chú...">
            <button class="btn btn-sm" style="background:#FDECEA; color:#B03A2E; padding:0 10px; flex-shrink:0;" onclick="vtRemoveCongDungInput(${idx})">×</button>
        </div>
    `).join('');
}
function vtAddCongDungInput() {
    _vtCurrentCongDung.push({ text: '', note: '' });
    vtRenderCongDungList();
}
function vtRemoveCongDungInput(idx) {
    if (_vtCurrentCongDung.length > 1) {
        _vtCurrentCongDung.splice(idx, 1);
    } else {
        _vtCurrentCongDung[0] = { text: '', note: '' };
    }
    vtRenderCongDungList();
}

// ── Chủ trị với ghi chú ─────────────────────────────────
function vtRenderChuTriList() {
    const container = document.getElementById('vt-chutri-list');
    if (!container) return;
    container.innerHTML = _vtCurrentChuTri.map((entry, idx) => `
        <div style="display:flex; gap:6px; align-items:center;">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:2;"
                value="${escHtml(entry.text || '')}"
                oninput="_vtCurrentChuTri[${idx}].text = this.value"
                placeholder="Nhập chủ trị (VD: Ăn không tiêu)...">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:1; font-style:italic; color:#8B7355;"
                value="${escHtml(entry.note || '')}"
                oninput="_vtCurrentChuTri[${idx}].note = this.value"
                placeholder="Ghi chú...">
            <button class="btn btn-sm" style="background:#FDECEA; color:#B03A2E; padding:0 10px; flex-shrink:0;" onclick="vtRemoveChuTriInput(${idx})">×</button>
        </div>
    `).join('');
}
function vtAddChuTriInput() {
    _vtCurrentChuTri.push({ text: '', note: '' });
    vtRenderChuTriList();
}
function vtRemoveChuTriInput(idx) {
    if (_vtCurrentChuTri.length > 1) {
        _vtCurrentChuTri.splice(idx, 1);
    } else {
        _vtCurrentChuTri[0] = { text: '', note: '' };
    }
    vtRenderChuTriList();
}

// ── Kiêng kỵ với ghi chú ─────────────────────────────────
function vtRenderKiengKyList() {
    const container = document.getElementById('vt-kiengky-list');
    if (!container) return;
    container.innerHTML = _vtCurrentKiengKy.map((entry, idx) => `
        <div style="display:flex; gap:6px; align-items:center;">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:2;"
                value="${escHtml(entry.text || '')}"
                oninput="_vtCurrentKiengKy[${idx}].text = this.value"
                placeholder="Nhập kiêng kỵ (VD: Phụ nữ có thai)...">
            <input type="text" class="tayy-form-input" style="margin-top:0; flex:1; font-style:italic; color:#8B7355;"
                value="${escHtml(entry.note || '')}"
                oninput="_vtCurrentKiengKy[${idx}].note = this.value"
                placeholder="Ghi chú...">
            <button class="btn btn-sm" style="background:#FDECEA; color:#B03A2E; padding:0 10px; flex-shrink:0;" onclick="vtRemoveKiengKyInput(${idx})">×</button>
        </div>
    `).join('');
}
function vtAddKiengKyInput() {
    _vtCurrentKiengKy.push({ text: '', note: '' });
    vtRenderKiengKyList();
}
function vtRemoveKiengKyInput(idx) {
    if (_vtCurrentKiengKy.length > 1) {
        _vtCurrentKiengKy.splice(idx, 1);
    } else {
        _vtCurrentKiengKy[0] = { text: '', note: '' };
    }
    vtRenderKiengKyList();
}

async function saveViThuoc(id) {
    const congDungStr = _vtCurrentCongDung
        .filter(e => (e.text || '').trim())
        .map(e => e.note.trim() ? `${e.text.trim()}||${e.note.trim()}` : e.text.trim())
        .join('; ');

    const payload = {
        ten_vi_thuoc: document.getElementById('vt-inp-ten').value.trim(),
        ten_goi_khac: document.getElementById('vt-inp-alias').value.trim(),
        nhom_duoc_ly: document.getElementById('vt-inp-nhom').value.trim(),
        tu_khi:   Number(document.getElementById('vt-inp-tukhi').value),
        vi_toan:  Number(document.getElementById('vt-inp-vi_toan').value || 0),
        vi_khu:   Number(document.getElementById('vt-inp-vi_khu').value  || 0),
        vi_cam:   Number(document.getElementById('vt-inp-vi_cam').value  || 0),
        vi_tan:   Number(document.getElementById('vt-inp-vi_tan').value  || 0),
        vi_ham:   Number(document.getElementById('vt-inp-vi_ham').value  || 0),
        huong_tgpt: Number(document.getElementById('vt-inp-huong').value),
        quy_kinh: _vtCurrentQuyKinh.join(', '),
        cong_dung: congDungStr,
    };
    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteViThuoc(id) {
    if (confirm('Xóa vị thuốc này?')) {
        await apiDeleteViThuoc(id);
        await loadAllThuocData();
        renderThuocSection();
    }
}



// Helper tính preview gram — mọi liều lượng đều hiển thị ra g
function btGetGramPreviewText(lieu) {
    if (lieu === '*') return '1.5g - 3g';
    if (lieu === '#') return '15g - 30g';
    if (!lieu) return '4.5g - 9g';

    const lower = lieu.toLowerCase().trim();

    // Đã có đơn vị g rồi → giữ nguyên
    if (/^\d+(\.\d+)?g$/.test(lower)) return lower;

    // Số thuần (không có đơn vị) → thêm g
    if (/^\d+([.,]\d+)?$/.test(lower)) {
        const val = parseFloat(lower.replace(',', '.'));
        return isNaN(val) ? lieu : `${val}g`;
    }

    // Chuyển đổi tiền / chỉ → g (1 tiền = 3g)
    // Chuyển đổi lượng / lạng → g (1 lượng = 30g)
    if (lower.includes('tiền') || lower.includes('lượng') || lower.includes('chỉ') || lower.includes('lạng')) {
        return lower
            .replace(/([\d.,]+)\s*(lượng|lạng)/gi, (match, p1) => {
                const val = parseFloat(p1.replace(',', '.'));
                return isNaN(val) ? match : `${Math.round(val * 30 * 100) / 100}g`;
            })
            .replace(/([\d.,]+)\s*(tiền|chỉ)/gi, (match, p1) => {
                const val = parseFloat(p1.replace(',', '.'));
                return isNaN(val) ? match : `${Math.round(val * 3 * 100) / 100}g`;
            });
    }

    // Trường hợp khác (ký tự lạ, ghi chú...) → giữ nguyên
    return lieu;
}


// ═══════════════════════════════════════════════════════════
// TAB: BÀI THUỐC
// ═══════════════════════════════════════════════════════════
function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ingredients = (item.chiTietViThuoc || []).map(d => {
            const ten = d?.viThuoc?.ten_vi_thuoc || '';
            const lieu = (d?.lieu_luong || '').trim();
            const displayLieu = btGetGramPreviewText(lieu);
            return `${ten} (${displayLieu})`;
        }).filter(Boolean).join(', ');
        const bienChungStr = escHtml(item.bien_chung || '—');
        const trieuChungStr = escHtml(item.trieu_chung || '—');
        const phapTriStr = escHtml(item.phap_tri || '—');
        return `
            <tr>
                <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
                <td>${escHtml(item.nguon_goc || '—')}</td>
                <td style="font-size:0.8rem;">${bienChungStr}</td>
                <td style="font-size:0.8rem;">${trieuChungStr}</td>
                <td style="font-size:0.8rem;">${phapTriStr}</td>
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
                <thead><tr><th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Biện chứng</th><th>Triệu chứng</th><th>Pháp trị</th><th>Thành phần</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openBaiThuocForm(id) {
    const item = id ? _thuocData.baiThuoc.find(x => x.id == id) : null;

    // Chuẩn hóa dữ liệu chi tiết hiện có -> state chips
    _btDraftChiTiet = (item?.chiTietViThuoc || []).map(d => {
        const idViThuoc = d?.idViThuoc ?? d?.id_vi_thuoc;
        return {
            idViThuoc,
            lieu_luong: d?.lieu_luong ?? '',
            vai_tro: d?.vai_tro ?? '',
            ghi_chu: d?.ghi_chu ?? '',
            quy_kinh: d?.quy_kinh ?? d?.viThuoc?.quy_kinh ?? '',
        };
    }).filter(x => Number.isFinite(x.idViThuoc));

    // Khởi tạo draft chips cho biện chứng, triệu chứng, pháp trị
    _btDraftBienChung = (item?.bien_chung || '').split(',').map(s => s.trim()).filter(Boolean);
    _btDraftTrieuChung = (item?.trieu_chung || '').split(',').map(s => s.trim()).filter(Boolean);
    _btDraftPhapTri = (item?.phap_tri || '').split(',').map(s => s.trim()).filter(Boolean);

    const rowsHtml = btRenderBaiThuocChiTietRowsHtml();
    showTayyModal('Bài thuốc', `
        <datalist id="bt-lieu-datalist">
            <option value="*"></option>
            <option value="#"></option>
        </datalist>

        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_bai_thuoc) : ''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item ? escHtml(item.nguon_goc) : ''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item ? escHtml(item.cach_dung) : ''}</textarea></label>

        <!-- Biện chứng -->
        <label class="tayy-form-label">
            Biện chứng
            <div style="position:relative; margin-top:6px;">
                <div id="bt-bienchung-chips" class="chips-container" onclick="document.getElementById('bt-inp-bienchung').focus()">
                    <input id="bt-inp-bienchung" type="text" class="chip-input"
                        placeholder="Thêm biện chứng..."
                        oninput="btOnBienChungSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectBienChung(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-bienchung-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <!-- Triệu chứng -->
        <label class="tayy-form-label">
            Triệu chứng
            <div style="position:relative; margin-top:6px;">
                <div id="bt-trieuchung-chips" class="chips-container" onclick="document.getElementById('bt-inp-trieuchung').focus()">
                    <input id="bt-inp-trieuchung" type="text" class="chip-input"
                        placeholder="Thêm triệu chứng..."
                        oninput="btOnTrieuChungSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectTrieuChung(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-trieuchung-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <!-- Pháp trị -->
        <label class="tayy-form-label">
            Pháp trị
            <div style="position:relative; margin-top:6px;">
                <div id="bt-phaptri-chips" class="chips-container" onclick="document.getElementById('bt-inp-phaptri').focus()">
                    <input id="bt-inp-phaptri" type="text" class="chip-input"
                        placeholder="Thêm pháp trị..."
                        oninput="btOnPhapTriSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectPhapTri(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-phaptri-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <label class="tayy-form-label">
            Thành phần vị thuốc
            <div style="position:relative; margin-top:6px;">
                <input id="bt-inp-vi-search" type="text" class="tayy-form-input"
                    placeholder="Gõ tên vị thuốc để thêm..."
                    oninput="btOnViThuocSearchInput(this.value)">
                <div id="bt-vi-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 6px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:220px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>

            <div style="margin-top:12px;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:22%;">Tên vị thuốc</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:18%;">Liều lượng</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:20%;">Vai trò</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:40%;">Tính / Vị / Quy kinh</th>
                        </tr>
                    </thead>
                    <tbody id="bt-ingredient-tbody" style="background:#FBF8F1;">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </label>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBaiThuoc(${id || 0})">Lưu</button>
        </div>
    `, 'wide');

    // Khởi tạo UI chips và suggestion cho modal mới
    setTimeout(() => {
        btRenderBienChungChips();
        btRenderTrieuChungChips();
        btRenderPhapTriChips();
        btOnViThuocSearchInput('');
        btRerenderBaiThuocChiTietRows();
    }, 0);
}

async function saveBaiThuoc(id) {
    // Luôn gửi chi_tiet để backend có thể xóa/thêm lại theo state chips.
    const chi_tiet = (_btDraftChiTiet || []).map(d => {
        const idViThuoc = d?.idViThuoc;
        const obj = {
            id_vi_thuoc: idViThuoc,
            idViThuoc: idViThuoc,
        };
        const lieu = (d?.lieu_luong || '').trim();
        if (lieu) obj.lieu_luong = lieu;

        const vaiTro = (d?.vai_tro || '').trim();
        if (vaiTro) obj.vai_tro = vaiTro;

        const ghiChu = (d?.ghi_chu || '').trim();
        if (ghiChu) obj.ghi_chu = ghiChu;

        return obj;
    }).filter(d => Number.isFinite(d.id_vi_thuoc));

    const payload = {
        ten_bai_thuoc: document.getElementById('bt-inp-ten').value.trim(),
        nguon_goc: document.getElementById('bt-inp-source').value.trim(),
        cach_dung: document.getElementById('bt-inp-usage').value.trim(),
        bien_chung: _btDraftBienChung.join(', '),
        trieu_chung: _btDraftTrieuChung.join(', '),
        phap_tri: _btDraftPhapTri.join(', '),
        chi_tiet
    };
    if (!payload.ten_bai_thuoc) return alert('Thiếu tên bài thuốc');
    const res = id ? await apiUpdateBaiThuoc(id, payload) : await apiCreateBaiThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteBaiThuoc(id) {
    if (confirm('Xóa bài thuốc này?')) {
        await apiDeleteBaiThuoc(id);
        await loadAllThuocData();
        renderThuocSection();
    }
}

function btGetViThuocById(idViThuoc) {
    return _thuocData.viThuoc.find(v => (v.id === idViThuoc)) || null;
}

function btRenderBaiThuocChiTietRowsHtml() {
    if (!_btDraftChiTiet || _btDraftChiTiet.length === 0) {
        return `<tr><td colspan="4" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa thêm vị thuốc</td></tr>`;
    }

    return _btDraftChiTiet.map(d => {
        const vt = btGetViThuocById(d.idViThuoc);
        const ten = vt?.ten_vi_thuoc || d?.ten_vi_thuoc || 'Vị thuốc';
        const vaiTro = d?.vai_tro || '';
        const tinh = vt?.tinh || '-';
        const vi = vt?.vi || '-';
        const vtQuyKinh = vt?.quy_kinh || '-';

        // Extract value and unit naturally for the 2 inputs
        const rawLieu = d?.lieu_luong || '';
        let val = rawLieu;
        let unit = '';
        if (rawLieu.trim().endsWith(' tiền')) {
            val = rawLieu.replace('tiền', '').trim();
            unit = 'tiền';
        } else if (rawLieu.trim().endsWith(' lượng')) {
            val = rawLieu.replace('lượng', '').trim();
            unit = 'lượng';
        }

        return `
            <tr>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <span style="font-weight:700; color:#5B3A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:280px;">
                            ${escHtml(ten)}
                        </span>
                        <button class="btn btn-sm btn-danger"
                            style="padding:2px 7px; font-size:0.72rem; height:24px;"
                            type="button"
                            onclick="btRemoveViThuocChip(${d.idViThuoc})">✕</button>
                    </div>
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <div style="display:flex; gap:4px; max-width:140px;">
                        <input type="text"
                            style="flex:1; width:50%; padding:6px 6px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                            placeholder="Số, *, #"
                            list="bt-lieu-datalist"
                            value="${escHtml(val)}"
                            oninput="btUpdateBaiThuocChipLieuCompound(${d.idViThuoc}, this.value, this.nextElementSibling.value)">
                        <select
                            style="flex:1; width:50%; padding:6px 2px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.8rem;"
                            onchange="btUpdateBaiThuocChipLieuCompound(${d.idViThuoc}, this.previousElementSibling.value, this.value)">
                            <option value="" ${unit === '' ? 'selected' : ''}>-</option>
                            <option value="tiền" ${unit === 'tiền' ? 'selected' : ''}>tiền</option>
                            <option value="lượng" ${unit === 'lượng' ? 'selected' : ''}>lượng</option>
                        </select>
                    </div>
                    <div id="bt-lieu-preview-${d.idViThuoc}" style="margin-top:4px; font-size:0.75rem; color:#8B7355; font-style:italic;">
                        ≈ ${escHtml(btGetGramPreviewText(rawLieu))}
                    </div>
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="Quân, Thần..."
                        value="${escHtml(vaiTro)}"
                        oninput="btUpdateBaiThuocChipVaiTro(${d.idViThuoc}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; font-size:0.8rem; line-height:1.4; color:#5B3A1A;">
                    <div><strong>Tính:</strong> ${escHtml(tinh)} <span style="margin:0 4px;color:#D4C5A0;">|</span> <strong>Vị:</strong> ${escHtml(vi)}</div>
                    <div style="margin-top:2px;"><strong>Quy kinh:</strong> ${escHtml(vtQuyKinh)}</div>
                </td>
            </tr>
        `;
    }).join('');
}

function btRerenderBaiThuocChiTietRows() {
    const el = document.getElementById('bt-ingredient-tbody');
    if (!el) return;
    el.innerHTML = btRenderBaiThuocChiTietRowsHtml();
}

function btOnViThuocSearchInput(query) {
    const exactVal = (query || '').trim();
    const inpVal = exactVal.toLowerCase();
    const suggestEl = document.getElementById('bt-vi-suggest');
    if (!suggestEl) return;

    // Nếu modal chưa sẵn sàng hoặc input rỗng -> ẩn gợi ý
    if (!inpVal) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
        return;
    }

    const selectedIds = new Set((_btDraftChiTiet || []).map(d => d.idViThuoc));
    const matches = (_thuocData.viThuoc || [])
        .filter(v => (v?.ten_vi_thuoc || '').toLowerCase().includes(inpVal))
        .filter(v => !selectedIds.has(v.id))
        .slice(0, 10);

    const hasExactMatch = matches.some(v => (v?.ten_vi_thuoc || '').toLowerCase() === inpVal);

    let html = '';

    if (matches.length > 0) {
        html += matches.map(v => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btAddViThuocChip(${v.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(v.ten_vi_thuoc || '')}</div>
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy vị thuốc có sẵn</div>`;
    }

    // UX: Cho phép thêm mới (soft-create) luôn nếu chưa có match chính xác
    if (!hasExactMatch && exactVal) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateViThuoc('${escHtml(exactVal)}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm vị thuốc "${escHtml(exactVal)}"
                </div>
            </div>
        `;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateViThuoc(name) {
    if (!name) return;

    // UI Feedback đang thêm...
    const inp = document.getElementById('bt-inp-vi-search');
    const suggestEl = document.getElementById('bt-vi-suggest');
    const oldVal = inp ? inp.value : '';

    if (inp) {
        inp.disabled = true;
        inp.value = 'Đang thêm...';
    }
    if (suggestEl) suggestEl.style.display = 'none';

    // Gọi API lưu tức thời (soft-create)
    const payload = { ten_vi_thuoc: name, tinh: '', vi: '', quy_kinh: '', cong_dung: '' };
    const res = await apiCreateViThuoc(payload);

    if (inp) {
        inp.disabled = false;
        inp.value = ''; // Xóa input khi cập nhật xong
        inp.focus();
    }

    if (!res.success) {
        alert('Lỗi khi thêm vị thuốc mới: ' + (res.error || 'Vui lòng thử lại sau.'));
        if (inp) inp.value = oldVal;
        return;
    }

    // Cập nhật State danh sách vị thuốc dùng chung
    const newItem = { id: res.id, ...payload, ...(res.data || {}) };
    _thuocData.viThuoc.push(newItem);

    // Kích hoạt thêm vào bài thuốc theo ID vừa có được
    btAddViThuocChip(res.id);
}

function btAddViThuocChip(viThuocId) {
    if (!Number.isFinite(viThuocId)) return;

    const selected = (_btDraftChiTiet || []).some(d => d.idViThuoc === viThuocId);
    if (selected) return;

    const vt = btGetViThuocById(viThuocId);
    _btDraftChiTiet.push({
        idViThuoc: viThuocId,
        lieu_luong: '',
        vai_tro: '',
        ghi_chu: '',
        quy_kinh: vt?.quy_kinh || '',
        ten_vi_thuoc: vt?.ten_vi_thuoc || ''
    });

    btRerenderBaiThuocChiTietRows();
    btOnViThuocSearchInput(document.getElementById('bt-inp-vi-search')?.value || '');
}

function btRemoveViThuocChip(viThuocId) {
    _btDraftChiTiet = (_btDraftChiTiet || []).filter(d => d.idViThuoc !== viThuocId);
    btRerenderBaiThuocChiTietRows();
    const suggestEl = document.getElementById('bt-vi-suggest');
    if (suggestEl) {
        btOnViThuocSearchInput(document.getElementById('bt-inp-vi-search')?.value || '');
    }
}

function btUpdateBaiThuocChipLieu(viThuocId, lieuValue) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;
    target.lieu_luong = lieuValue ?? '';
}

function btUpdateBaiThuocChipVaiTro(viThuocId, vaiTro) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc == viThuocId);
    if (target) {
        target.vai_tro = vaiTro;
    }
}

function btUpdateBaiThuocChipLieuCompound(viThuocId, val, unit) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc == viThuocId);
    if (!target) return;

    const v = (val || '').trim();
    const u = (unit || '').trim();
    let finalLieu = '';
    
    if (!v) {
        finalLieu = '';
    } else if (v === '*' || v === '#') {
        finalLieu = v;
    } else {
        finalLieu = u ? `${v} ${u}` : v;
    }
    
    target.lieu_luong = finalLieu;
    
    const previewEl = document.getElementById(`bt-lieu-preview-${viThuocId}`);
    if (previewEl) {
        previewEl.innerText = '≈ ' + btGetGramPreviewText(finalLieu);
    }
}

function btUpdateBaiThuocChipVi(viThuocId, viValue) {
    // No-op - Tình/Vị removed from UI
}

// ═══════════════════════════════════════════════════════════
// BIỆN CHỨNG — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderBienChungChips() {
    const container = document.getElementById('bt-bienchung-chips');
    const input = document.getElementById('bt-inp-bienchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftBienChung.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemoveBienChungChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemoveBienChungChip(name) {
    _btDraftBienChung = _btDraftBienChung.filter(x => x !== name);
    btRenderBienChungChips();
}

function btSelectBienChung(name) {
    if (!name || _btDraftBienChung.includes(name)) return;
    _btDraftBienChung.push(name);
    const inp = document.getElementById('bt-inp-bienchung');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderBienChungChips();
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnBienChungSearchInput(val) {
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.bienChung || []).map(b => b.ten_bien_chung);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftBienChung.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectBienChung('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy biện chứng có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateBienChung('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm biện chứng "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateBienChung(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-bienchung');
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateBienChung({ ten_bien_chung: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm biện chứng: ' + (res.error || '')); return; }

    _thuocData.bienChung.push({ id: res.id, ten_bien_chung: name, ...(res.data || {}) });
    btSelectBienChung(name);
}

// ═══════════════════════════════════════════════════════════
// TRIỆU CHỨNG — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderTrieuChungChips() {
    const container = document.getElementById('bt-trieuchung-chips');
    const input = document.getElementById('bt-inp-trieuchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftTrieuChung.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemoveTrieuChungChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemoveTrieuChungChip(name) {
    _btDraftTrieuChung = _btDraftTrieuChung.filter(x => x !== name);
    btRenderTrieuChungChips();
}

function btSelectTrieuChung(name) {
    if (!name || _btDraftTrieuChung.includes(name)) return;
    _btDraftTrieuChung.push(name);
    const inp = document.getElementById('bt-inp-trieuchung');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderTrieuChungChips();
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnTrieuChungSearchInput(val) {
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.trieuChung || []).map(t => t.ten_trieu_chung);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftTrieuChung.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectTrieuChung('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy triệu chứng có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateTrieuChung('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm triệu chứng "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateTrieuChung(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-trieuchung');
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateTrieuChung({ ten_trieu_chung: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm triệu chứng: ' + (res.error || '')); return; }

    _thuocData.trieuChung.push({ id: res.id, ten_trieu_chung: name, ...(res.data || {}) });
    btSelectTrieuChung(name);
}

// ═══════════════════════════════════════════════════════════
// PHÁP TRỊ — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderPhapTriChips() {
    const container = document.getElementById('bt-phaptri-chips');
    const input = document.getElementById('bt-inp-phaptri');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftPhapTri.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemovePhapTriChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemovePhapTriChip(name) {
    _btDraftPhapTri = _btDraftPhapTri.filter(x => x !== name);
    btRenderPhapTriChips();
}

function btSelectPhapTri(name) {
    if (!name || _btDraftPhapTri.includes(name)) return;
    _btDraftPhapTri.push(name);
    const inp = document.getElementById('bt-inp-phaptri');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderPhapTriChips();
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnPhapTriSearchInput(val) {
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.phapTri || []).map(p => p.ten_phap_tri);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftPhapTri.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectPhapTri('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy pháp trị có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreatePhapTri('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm pháp trị "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreatePhapTri(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-phaptri');
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreatePhapTri({ ten_phap_tri: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm pháp trị: ' + (res.error || '')); return; }

    _thuocData.phapTri.push({ id: res.id, ten_phap_tri: name, ...(res.data || {}) });
    btSelectPhapTri(name);
}

// ═══════════════════════════════════════════════════════════
// TAB: NHÓM DƯỢC LÝ
// ═══════════════════════════════════════════════════════════
function renderNhomDuocLyTab(el) {
    const getDisplayNhomNho = (item) => (item.nhom_nho || item.ten_nhom || '').trim();
    const getDisplayNhomCon = (item) => (item.nhom_con || '').trim();
    const getDisplayNhomLon = (item) => (item.nhom_lon || '').trim();
    const getDisplayMoTa = (item) => (item.mo_ta || '').trim();

    const rows = (_thuocData.nhomDuocLy || []).map(item => {
        const id = item.id;
        const nhomLon = getDisplayNhomLon(item);
        const nhomCon = getDisplayNhomCon(item);
        const nhomNho = getDisplayNhomNho(item);
        const moTa = getDisplayMoTa(item);

        const usageCount = (_thuocData.viThuoc || []).filter(vt =>
            (vt.nhom_duoc_ly || '').trim() === nhomNho
        ).length;
        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(nhomLon || '—')}</td>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(nhomCon || '—')}</td>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(nhomNho || '—')}</td>
            <td style="color:#8B7355;font-size:0.8rem;">${escHtml(moTa || '—')}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} vị thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openNhomDuocLyForm(${id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteNhomDuocLy(${id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline" onclick="exportNhomDuocLyXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('ndl-import-file').click()">📤 Nhập Excel</button>
                <input type="file" id="ndl-import-file" accept=".xlsx, .xls, .csv" style="display:none;" onchange="importNhomDuocLyXlsx(event)">
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="font-size:0.82rem;color:#A09580;">
                    Tổng: <strong>${(_thuocData.nhomDuocLy||[]).length}</strong> nhóm dược lý
                </div>
                <button class="btn btn-primary" onclick="openNhomDuocLyForm()">+ Thêm nhóm dược lý</button>
            </div>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Nhóm lớn</th>
                    <th>Nhóm con</th>
                    <th>Nhóm nhỏ</th>
                    <th>Mô tả</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có nhóm dược lý nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openNhomDuocLyForm(id) {
    const item = id ? (_thuocData.nhomDuocLy || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa nhóm dược lý' : 'Thêm nhóm dược lý', `
        <label class="tayy-form-label">Nhóm lớn *<br>
            <input id="ndl-inp-lon" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.nhom_lon || '') : ''}"
                placeholder="VD: Giải biểu, Thanh nhiệt...">
        </label>
        <label class="tayy-form-label">Nhóm con<br>
            <input id="ndl-inp-con" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.nhom_con || '') : ''}"
                placeholder="VD: Tân ôn giải biểu...">
        </label>
        <label class="tayy-form-label">Nhóm nhỏ *<br>
            <input id="ndl-inp-nho" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.nhom_nho || item.ten_nhom || '') : ''}"
                placeholder="VD: Tân lương giải biểu...">
        </label>
        <label class="tayy-form-label">Mô tả<br>
            <textarea id="ndl-inp-mota" class="tayy-form-input" style="min-height:60px;" placeholder="Mô tả công dụng nhóm...">${item ? escHtml(item.mo_ta || '') : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveNhomDuocLy(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('ndl-inp-lon')?.focus(), 50);
}

async function saveNhomDuocLy(id) {
    const nhomLon = (document.getElementById('ndl-inp-lon')?.value || '').trim();
    const nhomCon = (document.getElementById('ndl-inp-con')?.value || '').trim();
    const nhomNho = (document.getElementById('ndl-inp-nho')?.value || '').trim();
    const moTa = (document.getElementById('ndl-inp-mota')?.value || '').trim();
    if (!nhomLon) return alert('Vui lòng nhập Nhóm lớn!');
    if (!nhomNho) return alert('Vui lòng nhập Nhóm nhỏ!');
    const payload = {
        nhom_lon: nhomLon,
        nhom_con: nhomCon,
        nhom_nho: nhomNho,
        mo_ta: moTa,
        ten_nhom: nhomNho,
    };
    const res = id ? await apiUpdateNhomDuocLy(id, payload) : await apiCreateNhomDuocLy(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteNhomDuocLy(id) {
    if (!confirm('Xóa nhóm dược lý này?')) return;
    await apiDeleteNhomDuocLy(id);
    await loadAllThuocData();
    renderThuocSection();
}

function exportNhomDuocLyXlsx() {
    if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
    const data = (_thuocData.nhomDuocLy || []).map(item => ({
        'Nhóm lớn': item.nhom_lon || '',
        'Nhóm con': item.nhom_con || '',
        'Nhóm nhỏ': item.nhom_nho || item.ten_nhom || '',
        'Mô tả': item.mo_ta || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'NhomDuocLy');
    XLSX.writeFile(wb, 'Danh_Muc_Nhom_Duoc_Ly.xlsx');
}

function importNhomDuocLyXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (!rows.length) {
            alert('File Excel không có dữ liệu.');
            e.target.value = '';
            return;
        }
        if (!confirm(`Tìm thấy ${rows.length} dòng nhóm dược lý. Tiến hành import?`)) {
            e.target.value = '';
            return;
        }

        for (const r of rows) {
            const nhomLon = (r['Nhóm lớn'] || '').toString().trim();
            const nhomCon = (r['Nhóm con'] || '').toString().trim();
            const nhomNho = (r['Nhóm nhỏ'] || r['Tên nhóm dược lý'] || '').toString().trim();
            const moTa = (r['Mô tả'] || '').toString().trim();
            if (!nhomLon || !nhomNho) continue;

            const existed = (_thuocData.nhomDuocLy || []).find(x =>
                (x.nhom_lon || '').trim().toLowerCase() === nhomLon.toLowerCase() &&
                (x.nhom_con || '').trim().toLowerCase() === nhomCon.toLowerCase() &&
                (x.nhom_nho || x.ten_nhom || '').trim().toLowerCase() === nhomNho.toLowerCase()
            );

            const payload = {
                nhom_lon: nhomLon,
                nhom_con: nhomCon,
                nhom_nho: nhomNho,
                mo_ta: moTa,
                ten_nhom: nhomNho,
            };

            if (existed?.id) await apiUpdateNhomDuocLy(existed.id, payload);
            else await apiCreateNhomDuocLy(payload);
        }
        alert('Import nhóm dược lý thành công!');
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// ═══════════════════════════════════════════════════════════
// TAB: CÔNG DỤNG (quản lý danh mục công dụng chung)
// ═══════════════════════════════════════════════════════════
function renderCongDungTab(el) {
    const rows = (_thuocData.congDung || []).map(item => {
        const id = item.id;
        // Count vi thuoc using this cong dung
        const usageCount = (_thuocData.viThuoc || []).filter(vt => {
            const cdStr = vt.cong_dung || '';
            const entries = cdStr.split('; ').filter(Boolean).map(e => e.split('||')[0].trim());
            return entries.includes(item.ten_cong_dung);
        }).length;

        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(item.ten_cong_dung)}</td>
            <td style="color:#8B7355; font-style:italic;">${escHtml(item.ghi_chu || '—')}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} vị thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openCongDungForm(${id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCongDung(${id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;color:#A09580;">
                Tổng: <strong>${(_thuocData.congDung||[]).length}</strong> công dụng
            </div>
            <button class="btn btn-primary" onclick="openCongDungForm()">+ Thêm công dụng</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên công dụng</th>
                    <th>Ghi chú mặc định</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có công dụng nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openCongDungForm(id) {
    const item = id ? (_thuocData.congDung || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa công dụng' : 'Thêm công dụng', `
        <label class="tayy-form-label">Tên công dụng *<br>
            <input id="cd-inp-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_cong_dung) : ''}"
                placeholder="VD: Thanh nhiệt, Giải độc...">
        </label>
        <label class="tayy-form-label">Ghi chú mặc định<br>
            <textarea id="cd-inp-ghichu" class="tayy-form-input" style="min-height:60px;" placeholder="Ghi chú thêm...">${item ? escHtml(item.ghi_chu || '') : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveCongDung(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('cd-inp-ten')?.focus(), 50);
}

async function saveCongDung(id) {
    const ten = (document.getElementById('cd-inp-ten')?.value || '').trim();
    const ghichu = (document.getElementById('cd-inp-ghichu')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên công dụng!');
    const payload = { ten_cong_dung: ten, ghi_chu: ghichu };
    const res = id ? await apiUpdateCongDung(id, payload) : await apiCreateCongDung(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteCongDung(id) {
    if (!confirm('Xóa công dụng này? Các vị thuốc đang có sẽ không bị ảnh hưởng.')) return;
    await apiDeleteCongDung(id);
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════
// TAB: CHỦ TRỊ
// ═══════════════════════════════════════════════════════════
function renderChuTriTab(el) {
    const rows = (_thuocData.chuTri || []).map(item => {
        const id = item.id;
        // Count vi thuoc using this chu tri
        const usageCount = (_thuocData.viThuoc || []).filter(vt => {
            const cdStr = vt.chu_tri || '';
            const entries = cdStr.split('; ').filter(Boolean).map(e => e.split('||')[0].trim());
            return entries.includes(item.ten_chu_tri);
        }).length;

        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(item.ten_chu_tri)}</td>
            <td style="color:#8B7355; font-style:italic;">${escHtml(item.ghi_chu || '—')}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} vị thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openChuTriForm(${id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteChuTri(${id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;color:#A09580;">
                Tổng: <strong>${(_thuocData.chuTri||[]).length}</strong> chủ trị
            </div>
            <button class="btn btn-primary" onclick="openChuTriForm()">+ Thêm chủ trị</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên chủ trị</th>
                    <th>Ghi chú mặc định</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có chủ trị nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openChuTriForm(id) {
    const item = id ? (_thuocData.chuTri || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa chủ trị' : 'Thêm chủ trị', `
        <label class="tayy-form-label">Tên chủ trị *<br>
            <input id="ct-inp-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_chu_tri) : ''}"
                placeholder="VD: Ăn không tiêu, Đau bụng kinh...">
        </label>
        <label class="tayy-form-label">Ghi chú mặc định<br>
            <textarea id="ct-inp-ghichu" class="tayy-form-input" style="min-height:60px;" placeholder="Ghi chú thêm...">${item ? escHtml(item.ghi_chu || '') : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveChuTri(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('ct-inp-ten')?.focus(), 50);
}

async function saveChuTri(id) {
    const ten = (document.getElementById('ct-inp-ten')?.value || '').trim();
    const ghichu = (document.getElementById('ct-inp-ghichu')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên chủ trị!');
    const payload = { ten_chu_tri: ten, ghi_chu: ghichu };
    const res = id ? await apiUpdateChuTri(id, payload) : await apiCreateChuTri(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteChuTri(id) {
    if (!confirm('Xóa chủ trị này? Các vị thuốc đang có sẽ không bị ảnh hưởng.')) return;
    await apiDeleteChuTri(id);
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════
// TAB: KIÊNG KỴ
// ═══════════════════════════════════════════════════════════
function renderKiengKyTab(el) {
    const rows = (_thuocData.kiengKy || []).map(item => {
        const id = item.id;
        // Count vi thuoc using this kieng ky
        const usageCount = (_thuocData.viThuoc || []).filter(vt => {
            const cdStr = vt.kieng_ky || '';
            const entries = cdStr.split('; ').filter(Boolean).map(e => e.split('||')[0].trim());
            return entries.includes(item.ten_kieng_ky);
        }).length;

        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(item.ten_kieng_ky)}</td>
            <td style="color:#8B7355; font-style:italic;">${escHtml(item.ghi_chu || '—')}</td>
            <td style="text-align:center;">
                ${usageCount > 0
                    ? `<span style="background:#F5F0E8;color:#8B7355;border-radius:10px;padding:2px 10px;font-size:0.78rem;font-weight:600;">${usageCount} vị thuốc</span>`
                    : `<span style="color:#D1D5DB;font-size:0.78rem;">Chưa dùng</span>`}
            </td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openKiengKyForm(${id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKiengKy(${id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:0.82rem;color:#A09580;">
                Tổng: <strong>${(_thuocData.kiengKy||[]).length}</strong> kiêng kỵ
            </div>
            <button class="btn btn-primary" onclick="openKiengKyForm()">+ Thêm kiêng kỵ</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên kiêng kỵ</th>
                    <th>Ghi chú mặc định</th>
                    <th style="text-align:center;">Sử dụng</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có kiêng kỵ nào</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openKiengKyForm(id) {
    const item = id ? (_thuocData.kiengKy || []).find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa kiêng kỵ' : 'Thêm kiêng kỵ', `
        <label class="tayy-form-label">Tên kiêng kỵ *<br>
            <input id="kk-inp-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_kieng_ky) : ''}"
                placeholder="VD: Phụ nữ có thai...">
        </label>
        <label class="tayy-form-label">Ghi chú mặc định<br>
            <textarea id="kk-inp-ghichu" class="tayy-form-input" style="min-height:60px;" placeholder="Ghi chú thêm...">${item ? escHtml(item.ghi_chu || '') : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveKiengKy(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('kk-inp-ten')?.focus(), 50);
}

async function saveKiengKy(id) {
    const ten = (document.getElementById('kk-inp-ten')?.value || '').trim();
    const ghichu = (document.getElementById('kk-inp-ghichu')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên kiêng kỵ!');
    const payload = { ten_kieng_ky: ten, ghi_chu: ghichu };
    const res = id ? await apiUpdateKiengKy(id, payload) : await apiCreateKiengKy(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteKiengKy(id) {
    if (!confirm('Xóa kiêng kỵ này? Các vị thuốc đang có sẽ không bị ảnh hưởng.')) return;
    await apiDeleteKiengKy(id);
    await loadAllThuocData();
    renderThuocSection();
}
