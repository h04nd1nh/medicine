// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

// Vị ngũ vị — chips (tối đa 5), đồng bộ thuoc-yhct-analysis.js
var _VT_VI_OPTIONS = ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'];
var _vtCurrentVi = [];

// State quy kinh (đồng bộ với thuoc-yhct-analysis.js — file đó load sau và gán lại)
var _vtCurrentQuyKinh = [];
var _vtCurrentCongDung = [];
var _vtCurrentChuTri = [];
var _vtCurrentKiengKy = [];

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

function vtNhomSubLabels(vt) {
    const links = vt.nhomLinks || [];
    const names = [];
    for (const l of links) {
        const n = l.nhomNho?.ten_nhom_nho;
        if (n) names.push(n);
    }
    if (!names.length) return '—';
    return names.join(', ');
}

/** Fallback nếu thuoc-yhct-analysis.js chưa ghi đè — schema Excel 11 cột */
function renderViThuocTab(el) {
    const rows = (_thuocData.viThuoc || []).map(item => `
        <tr>
            <td><strong>${escHtml(item.ten_vi_thuoc)}</strong></td>
            <td style="font-size:0.78rem;">${escHtml(vtNhomSubLabels(item))}</td>
            <td style="font-size:0.78rem;">${escHtml(item.tinh || '—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.vi || '—')}</td>
            <td style="text-align:center;width:120px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th><th>Nhóm nhỏ (dược lý)</th><th>Tính</th><th>Vị</th>
                    <th style="width:120px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
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

function vtRenderViChips() {
    const container = document.getElementById('vt-vi-chips');
    const input = document.getElementById('vt-inp-vi');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _vtCurrentVi.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="vtRemoveViChip(${JSON.stringify(name)}); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function vtRemoveViChip(name) {
    _vtCurrentVi = _vtCurrentVi.filter(x => x !== name);
    vtRenderViChips();
}

function vtRemoveLastViChip() {
    if (_vtCurrentVi.length > 0) {
        _vtCurrentVi.pop();
        vtRenderViChips();
    }
}

function vtSelectVi(name) {
    if (_vtCurrentVi.length >= 5) return;
    if (_vtCurrentVi.includes(name)) return;
    _vtCurrentVi.push(name);
    const inp = document.getElementById('vt-inp-vi');
    if (inp) { inp.value = ''; inp.focus(); }
    vtRenderViChips();
    const s = document.getElementById('vt-vi-suggest');
    if (s) s.style.display = 'none';
}

function vtSelectViByInput(val) {
    const opts = typeof _VT_VI_OPTIONS !== 'undefined' ? _VT_VI_OPTIONS : ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'];
    const q = (val || '').trim();
    if (!q) return;
    const hit = opts.find(o => o.toLowerCase() === q.toLowerCase());
    if (hit) vtSelectVi(hit);
}

function vtOnViSearchInput(val) {
    const suggestEl = document.getElementById('vt-vi-suggest');
    if (!suggestEl) return;
    const opts = typeof _VT_VI_OPTIONS !== 'undefined' ? _VT_VI_OPTIONS : ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'];
    if (_vtCurrentVi.length >= 5) {
        suggestEl.style.display = 'none';
        return;
    }
    const query = (val || '').trim().toLowerCase();
    const available = opts.filter(o => !_vtCurrentVi.includes(o));
    const filtered = !query
        ? available
        : available.filter(o => o.toLowerCase().includes(query));
    if (filtered.length === 0) { suggestEl.style.display = 'none'; return; }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = filtered.map(o => `
        <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background='transparent'"
             onclick='vtSelectVi(${JSON.stringify(o)})'>
            <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(o)}</div>
        </div>
    `).join('');
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

/** Fallback — form đầy đủ nằm trong thuoc-yhct-analysis.js */
async function saveViThuoc(id) {
    const payload = {
        ten_vi_thuoc: (document.getElementById('vt-inp-ten')?.value || '').trim(),
        ten_goi_khac: (document.getElementById('vt-inp-alias')?.value || '').trim(),
        tinh: (document.getElementById('vt-inp-tinh')?.value || '').trim(),
        vi: (typeof _vtCurrentVi !== 'undefined' && _vtCurrentVi.length)
            ? (typeof yhctNormalizeViString === 'function'
                ? yhctNormalizeViString(_vtCurrentVi.join(','))
                : _vtCurrentVi.join(', '))
            : (typeof yhctNormalizeViString === 'function'
                ? yhctNormalizeViString(document.getElementById('vt-inp-vi')?.value)
                : (document.getElementById('vt-inp-vi')?.value || '').trim()),
        lieu_dung: (document.getElementById('vt-inp-lieudung')?.value || '').trim(),
        quy_kinh: (typeof _vtCurrentQuyKinh !== 'undefined' && _vtCurrentQuyKinh.length) ? _vtCurrentQuyKinh.join(', ') : '',
        cong_dung: (document.getElementById('vt-ta-congdung')?.value || '').trim(),
        chu_tri: (document.getElementById('vt-ta-chutri')?.value || '').trim(),
        kieng_ky: (document.getElementById('vt-ta-kiengky')?.value || '').trim(),
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
                    <div><strong>Nhóm nhỏ:</strong> ${escHtml(vt ? vtNhomSubLabels(vt) : '—')}</div>
                    <div style="margin-top:4px;"><strong>Tính:</strong> ${escHtml(tinh)} <span style="margin:0 4px;color:#D4C5A0;">|</span> <strong>Vị:</strong> ${escHtml(vi)}</div>
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
// TAB: NHÓM DƯỢC LÝ (cây: nhóm lớn → nhóm nhỏ → danh sách vị thuốc)
// ═══════════════════════════════════════════════════════════
function ndlFindNhoById(idNho) {
    for (const lon of _thuocData.nhomDuocLy || []) {
        const nho = (lon.nhomNho || []).find(x => x.id == idNho);
        if (nho) return { lon, nho };
    }
    return null;
}

function renderNhomDuocLyTab(el) {
    const catalog = _thuocData.nhomDuocLy || [];
    const lonCount = catalog.filter(l => !l.isOrphanBucket).length;
    let totalNho = 0;
    const blocks = catalog.map(lon => {
        const nhoList = lon.nhomNho || [];
        totalNho += nhoList.length;
        const isBucket = !!lon.isOrphanBucket;
        const idLonJs = isBucket ? 'null' : lon.id;
        const rows = nhoList.map(nho => {
            const cnt = (nho.id_vi_thuoc || []).length;
            const mt = (nho.mo_ta || '').trim();
            return `<tr>
                <td style="font-weight:600;color:#5B3A1A;">${escHtml(nho.ten_nhom_nho)}</td>
                <td style="color:#8B7355;font-size:0.78rem;">${escHtml(mt ? (mt.length > 100 ? mt.slice(0, 100) + '…' : mt) : '—')}</td>
                <td style="text-align:center;">${cnt}</td>
                <td style="text-align:center;">
                    <div class="table-actions" style="justify-content:center;flex-wrap:wrap;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="openNhomNhoMembersModal(${nho.id})">Vị thuốc</button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="openNhomDuocLyNhoForm(${idLonJs}, ${nho.id})">Sửa</button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteNhomDuocLyNho(${nho.id})">🗑</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        const headerBtns = isBucket
            ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-sm btn-primary" onclick="openNhomDuocLyNhoForm(null, 0)">+ Nhóm nhỏ</button>
               </div>`
            : `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-sm btn-outline" onclick="openNhomDuocLyLonForm(${lon.id})">Sửa nhóm lớn</button>
                    <button type="button" class="btn btn-sm btn-primary" onclick="openNhomDuocLyNhoForm(${lon.id}, 0)">+ Nhóm nhỏ</button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteNhomDuocLyLon(${lon.id})">Xóa nhóm lớn</button>
               </div>`;
        const subHint = isBucket
            ? `<div style="font-size:0.76rem;color:#8B7355;margin-bottom:8px;">Các nhóm nhỏ ở đây không gắn với nhóm lớn nào (tùy chọn). Có thể gán vào nhóm lớn khi sửa.</div>`
            : '';
        return `<div style="border:1px solid #E2D4B8;border-radius:10px;padding:12px;margin-bottom:14px;background:${isBucket ? '#FAFAF8' : '#FFFDF7'};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                <div style="font-weight:800;color:#5B3A1A;font-size:1rem;">${escHtml(lon.ten_nhom_lon)}</div>
                ${headerBtns}
            </div>
            ${subHint}
            <div class="data-table-container" style="overflow-x:auto;">
                <table style="font-size:0.85rem;width:100%;">
                    <thead><tr>
                        <th>Nhóm nhỏ (Tác dụng YHCT)</th><th>Mô tả</th><th style="text-align:center;">Số vị</th><th style="text-align:center;width:240px;">Thao tác</th>
                    </tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;">Chưa có nhóm nhỏ — bấm «+ Nhóm nhỏ»</td></tr>'}</tbody>
                </table>
            </div>
        </div>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="button" class="btn btn-outline" onclick="exportNhomDuocLyXlsx()">📥 Xuất Excel</button>
                <button type="button" class="btn btn-outline" title="Cột: Nhóm lớn (có thể để trống), Nhóm nhỏ, Các vị thuốc (cách nhau bởi dấu phẩy). Tùy chọn: Mô tả."
                    onclick="document.getElementById('ndl-import-file').click()">📤 Nhập Excel</button>
                <input type="file" id="ndl-import-file" accept=".xlsx, .xls, .csv" style="display:none;" onchange="importNhomDuocLyXlsx(event)">
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span style="font-size:0.82rem;color:#A09580;">
                    <strong>${lonCount}</strong> nhóm lớn · <strong>${totalNho}</strong> nhóm nhỏ
                </span>
                <button type="button" class="btn btn-primary" onclick="openNhomDuocLyLonForm(0)">+ Thêm nhóm lớn</button>
            </div>
        </div>
        ${blocks}`;
}

function openNhomDuocLyLonForm(id) {
    const catalog = _thuocData.nhomDuocLy || [];
    const item = id ? catalog.find(x => x.id == id) : null;
    showTayyModal(item ? 'Sửa nhóm lớn' : 'Thêm nhóm lớn', `
        <label class="tayy-form-label">Tên nhóm lớn *<br>
            <input id="ndl-lon-ten" type="text" class="tayy-form-input"
                value="${item ? escHtml(item.ten_nhom_lon) : ''}"
                placeholder="VD: Giải biểu, Thanh nhiệt...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveNhomDuocLyLon(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('ndl-lon-ten')?.focus(), 50);
}

async function saveNhomDuocLyLon(id) {
    const ten = (document.getElementById('ndl-lon-ten')?.value || '').trim();
    if (!ten) return alert('Vui lòng nhập tên nhóm lớn!');
    const res = id
        ? await apiUpdateNhomDuocLyLon(id, { ten_nhom_lon: ten })
        : await apiCreateNhomDuocLyLon({ ten_nhom_lon: ten });
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteNhomDuocLyLon(id) {
    if (!confirm('Xóa nhóm lớn? Các nhóm nhỏ trực thuộc sẽ chuyển xuống mục «Nhóm nhỏ độc lập» (không mất dữ liệu, không xóa gán vị thuốc).')) return;
    const res = await apiDeleteNhomDuocLyLon(id);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    await loadAllThuocData();
    renderThuocSection();
}

function openNhomDuocLyNhoForm(idLon, idNho) {
    const catalog = _thuocData.nhomDuocLy || [];
    const lonsOnly = catalog.filter(l => !l.isOrphanBucket && l.id != null);

    let nho = null;
    let defaultParent = idLon;
    if (idNho) {
        const found = ndlFindNhoById(idNho);
        if (!found) return alert('Không tìm thấy nhóm nhỏ.');
        nho = found.nho;
        defaultParent = nho.id_nhom_lon != null && nho.id_nhom_lon !== undefined ? nho.id_nhom_lon : '';
    } else if (idLon != null && idLon !== undefined) {
        const lon = lonsOnly.find(x => x.id == idLon);
        if (!lon) return alert('Không tìm thấy nhóm lớn.');
    }

    const opts = lonsOnly.map(l =>
        `<option value="${l.id}"${defaultParent !== '' && defaultParent != null && l.id == defaultParent ? ' selected' : ''}>${escHtml(l.ten_nhom_lon)}</option>`
    ).join('');
    const noneSel = defaultParent === '' || defaultParent == null ? ' selected' : '';

    showTayyModal(nho ? 'Sửa nhóm nhỏ' : 'Thêm nhóm nhỏ', `
        <label class="tayy-form-label">Thuộc nhóm lớn <span style="font-weight:400;color:#A09580;">(để «Không» nếu nhóm nhỏ độc lập)</span><br>
            <select id="ndl-nho-parent-lon" class="tayy-form-input">
                <option value=""${noneSel}>— Không —</option>
                ${opts}
            </select>
        </label>
        <label class="tayy-form-label">Tên nhóm nhỏ * <span style="font-weight:400;color:#A09580;">(hiển thị ở phân tích Tác dụng YHCT)</span><br>
            <input id="ndl-nho-ten" type="text" class="tayy-form-input"
                value="${nho ? escHtml(nho.ten_nhom_nho) : ''}"
                placeholder="VD: Tân lương giải biểu...">
        </label>
        <label class="tayy-form-label">Mô tả<br>
            <textarea id="ndl-nho-mota" class="tayy-form-input" style="min-height:60px;" placeholder="Mô tả nhóm nhỏ...">${nho ? escHtml(nho.mo_ta || '') : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveNhomDuocLyNho(${nho ? nho.id : 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('ndl-nho-ten')?.focus(), 50);
}

async function saveNhomDuocLyNho(idNho) {
    const ten = (document.getElementById('ndl-nho-ten')?.value || '').trim();
    const moTa = (document.getElementById('ndl-nho-mota')?.value || '').trim();
    const parentVal = (document.getElementById('ndl-nho-parent-lon')?.value || '').trim();
    const id_nhom_lon = parentVal === '' ? null : +parentVal;
    if (!ten) return alert('Vui lòng nhập tên nhóm nhỏ!');
    const res = idNho
        ? await apiUpdateNhomDuocLyNho(idNho, { ten_nhom_nho: ten, mo_ta: moTa, id_nhom_lon })
        : await apiCreateNhomDuocLyNho({ id_nhom_lon, ten_nhom_nho: ten, mo_ta: moTa });
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deleteNhomDuocLyNho(id) {
    if (!confirm('Xóa nhóm nhỏ và bỏ mọi gán vị thuốc?')) return;
    const res = await apiDeleteNhomDuocLyNho(id);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    await loadAllThuocData();
    renderThuocSection();
}

function openNhomNhoMembersModal(idNho) {
    const found = ndlFindNhoById(idNho);
    const nho = found?.nho;
    if (!nho) return alert('Không tìm thấy nhóm nhỏ.');
    const selected = new Set(nho.id_vi_thuoc || []);
    const vts = [...(_thuocData.viThuoc || [])].sort((a, b) =>
        (a.ten_vi_thuoc || '').localeCompare(b.ten_vi_thuoc || '', 'vi'));
    const list = vts.map(v => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F0E8D8;cursor:pointer;">
            <input type="checkbox" value="${v.id}" ${selected.has(v.id) ? 'checked' : ''}>
            <span style="font-size:0.85rem;">${escHtml(v.ten_vi_thuoc)}</span>
        </label>`).join('');
    showTayyModal(`Gán vị thuốc — ${escHtml(nho.ten_nhom_nho)}`, `
        <div style="max-height:55vh;overflow-y:auto;margin-bottom:12px;" id="ndl-members-box">${list || '<div style="color:#9CA3AF;">Chưa có vị thuốc trong danh mục.</div>'}</div>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveNhomNhoMembersFromModal(${idNho})">Lưu</button>
        </div>
    `, 'wide');
}

async function saveNhomNhoMembersFromModal(idNho) {
    const box = document.getElementById('ndl-members-box');
    if (!box) return;
    const ids = [...box.querySelectorAll('input[type=checkbox]:checked')].map(i => +i.value);
    const res = await apiSetNhomNhoMembers(idNho, ids);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

function ndlNhomImportSetLoading(show, message) {
    let el = document.getElementById('ndl-nhom-import-loading');
    if (!el) {
        el = document.createElement('div');
        el.id = 'ndl-nhom-import-loading';
        el.style.cssText = [
            'display:none', 'position:fixed', 'inset:0', 'z-index:99999',
            'background:rgba(245,240,232,.88)', 'backdrop-filter:blur(3px)',
            'align-items:center', 'justify-content:center', 'flex-direction:column', 'gap:14px',
        ].join(';');
        el.innerHTML = `
            <div style="width:46px;height:46px;border:4px solid #E2D4B8;border-top-color:#5B3A1A;border-radius:50%;
                animation:ndlNhomSpin .8s linear infinite;"></div>
            <div id="ndl-nhom-import-loading-msg" style="font-weight:700;color:#5B3A1A;font-size:0.95rem;text-align:center;max-width:min(420px,92vw);line-height:1.45;"></div>`;
        document.body.appendChild(el);
        if (!document.getElementById('ndl-nhom-import-spin-style')) {
            const st = document.createElement('style');
            st.id = 'ndl-nhom-import-spin-style';
            st.textContent = '@keyframes ndlNhomSpin{to{transform:rotate(360deg)}}';
            document.head.appendChild(st);
        }
    }
    const msgEl = document.getElementById('ndl-nhom-import-loading-msg');
    if (msgEl) msgEl.textContent = message || '';
    el.style.display = show ? 'flex' : 'none';
}

function ndlNormalizeNhomExcelRow(row) {
    const o = {};
    if (!row || typeof row !== 'object') return o;
    for (const [k, v] of Object.entries(row)) {
        o[String(k).trim()] = v;
    }
    return o;
}

function ndlPickNhomCol(row, keys) {
    for (const k of keys) {
        if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
        const v = row[k];
        if (v == null) continue;
        const s = String(v).trim();
        if (s !== '') return s;
    }
    return '';
}

function ndlHerbsColumnPresentInRow(row) {
    const herbsKeys = ['Các vị thuốc', 'Cac vi thuoc', 'Cac vi thuốc', 'Vi thuốc trong nhóm'];
    return herbsKeys.some(k => Object.prototype.hasOwnProperty.call(row, k));
}

function ndlParseHerbNamesFromCell(raw) {
    if (raw == null) return [];
    return String(raw)
        .split(/[,，、]/g)
        .map(s => s.trim())
        .filter(Boolean);
}

async function ndlEnsureViThuocIdByName(ten, lookupLowerToId) {
    const t = (ten || '').trim();
    if (!t) return null;
    const k = t.toLowerCase();
    if (lookupLowerToId.has(k)) return lookupLowerToId.get(k);
    const res = await apiCreateViThuoc({ ten_vi_thuoc: t });
    if (!res.success) {
        console.warn('Không tạo được vị thuốc:', t, res.error);
        return null;
    }
    lookupLowerToId.set(k, res.id);
    return res.id;
}

function exportNhomDuocLyXlsx() {
    if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
    const vts = _thuocData.viThuoc || [];
    const idToTen = new Map(vts.map(v => [v.id, (v.ten_vi_thuoc || '').trim()]));
    const data = [];
    for (const lon of _thuocData.nhomDuocLy || []) {
        if (lon.isOrphanBucket) {
            for (const n of lon.nhomNho || []) {
                const herbPart = (n.id_vi_thuoc || [])
                    .map(id => idToTen.get(id) || '')
                    .filter(Boolean)
                    .join(', ');
                data.push({
                    'Nhóm lớn': '',
                    'Nhóm nhỏ': n.ten_nhom_nho || '',
                    'Các vị thuốc': herbPart,
                    'Mô tả': n.mo_ta || '',
                });
            }
            continue;
        }
        for (const n of lon.nhomNho || []) {
            const herbPart = (n.id_vi_thuoc || [])
                .map(id => idToTen.get(id) || '')
                .filter(Boolean)
                .join(', ');
            data.push({
                'Nhóm lớn': lon.ten_nhom_lon || '',
                'Nhóm nhỏ': n.ten_nhom_nho || '',
                'Các vị thuốc': herbPart,
                'Mô tả': n.mo_ta || '',
            });
        }
    }
    const emptyRow = { 'Nhóm lớn': '', 'Nhóm nhỏ': '', 'Các vị thuốc': '', 'Mô tả': '' };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.length ? data : [emptyRow]), 'NhomDuocLy');
    XLSX.writeFile(wb, 'Danh_Muc_Nhom_Duoc_Ly.xlsx');
}

function importNhomDuocLyXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const buf = new Uint8Array(evt.target.result);
            const wb = XLSX.read(buf, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            const rows = rawRows.map(ndlNormalizeNhomExcelRow);
            if (!rows.length) {
                alert('File Excel không có dữ liệu.');
                return;
            }
            if (!confirm(`Tìm thấy ${rows.length} dòng. Import nhóm lớn / nhóm nhỏ và gán vị thuốc (tạo vị mới nếu chưa có)?`)) {
                return;
            }

            ndlNhomImportSetLoading(true, 'Đang nhập Excel nhóm dược lý…');

            const headerProbe = rows.find(rr => rr && Object.keys(rr).length) || {};
            const sheetHasHerbCol = ndlHerbsColumnPresentInRow(headerProbe);

            const viLookup = new Map();
            for (const v of _thuocData.viThuoc || []) {
                const tn = (v.ten_vi_thuoc || '').trim();
                if (tn) viLookup.set(tn.toLowerCase(), v.id);
            }

            let catalog = JSON.parse(JSON.stringify(_thuocData.nhomDuocLy || []));
            const findLonId = (name) => {
                const x = catalog.find(l => !l.isOrphanBucket && (l.ten_nhom_lon || '').trim().toLowerCase() === name.toLowerCase());
                return x?.id;
            };
            const findLon = (id) => catalog.find(l => !l.isOrphanBucket && l.id == id);

            const findOrphanNho = (name) => {
                const b = catalog.find(l => l.isOrphanBucket);
                const list = b?.nhomNho || [];
                return list.find(n => (n.ten_nhom_nho || '').trim().toLowerCase() === name.toLowerCase());
            };

            const colLon = ['Nhóm lớn', 'Nhom lon', 'Ten nhom lon'];
            const colNho = ['Nhóm nhỏ', 'Nhom nho', 'Tên nhóm dược lý', 'Nhóm con', 'Ten nhom nho'];
            const colMoTa = ['Mô tả', 'Mo ta'];
            const colHerbs = ['Các vị thuốc', 'Cac vi thuoc', 'Cac vi thuốc', 'Vi thuốc trong nhóm'];

            let rowIdx = 0;
            for (const r of rows) {
                rowIdx++;
                ndlNhomImportSetLoading(true, `Đang nhập nhóm dược lý… (${rowIdx}/${rows.length})`);

                const nhomLon = ndlPickNhomCol(r, colLon);
                const nhomNho = ndlPickNhomCol(r, colNho);
                const moTa = ndlPickNhomCol(r, colMoTa);
                const herbsCell = ndlPickNhomCol(r, colHerbs);

                if (!nhomNho) continue;

                let idNho = null;

                if (!nhomLon) {
                    const existedOr = findOrphanNho(nhomNho);
                    if (existedOr?.id) {
                        idNho = existedOr.id;
                        if (moTa) await apiUpdateNhomDuocLyNho(existedOr.id, { mo_ta: moTa });
                    } else {
                        const resN = await apiCreateNhomDuocLyNho({
                            id_nhom_lon: null,
                            ten_nhom_nho: nhomNho,
                            mo_ta: moTa || undefined,
                        });
                        if (!resN.success) continue;
                        idNho = resN.id;
                        const b = catalog.find(l => l.isOrphanBucket);
                        if (b) {
                            if (!b.nhomNho) b.nhomNho = [];
                            b.nhomNho.push({
                                id: idNho,
                                ten_nhom_nho: nhomNho,
                                mo_ta: moTa || null,
                                id_vi_thuoc: [],
                            });
                        }
                    }
                } else {
                    let idLon = findLonId(nhomLon);
                    if (!idLon) {
                        const resL = await apiCreateNhomDuocLyLon({ ten_nhom_lon: nhomLon });
                        if (!resL.success) continue;
                        idLon = resL.id;
                        catalog.push({ id: idLon, ten_nhom_lon: nhomLon, nhomNho: [], isOrphanBucket: false });
                    }
                    const lon = findLon(idLon);
                    if (!lon.nhomNho) lon.nhomNho = [];
                    const existedNho = lon.nhomNho.find(n =>
                        (n.ten_nhom_nho || '').trim().toLowerCase() === nhomNho.toLowerCase());
                    if (existedNho?.id) {
                        idNho = existedNho.id;
                        if (moTa) await apiUpdateNhomDuocLyNho(existedNho.id, { mo_ta: moTa });
                    } else {
                        const resN = await apiCreateNhomDuocLyNho({
                            id_nhom_lon: idLon,
                            ten_nhom_nho: nhomNho,
                            mo_ta: moTa || undefined,
                        });
                        if (!resN.success) continue;
                        idNho = resN.id;
                        lon.nhomNho.push({
                            id: idNho,
                            ten_nhom_nho: nhomNho,
                            mo_ta: moTa || null,
                            id_vi_thuoc: [],
                        });
                    }
                }

                if (idNho != null && sheetHasHerbCol) {
                    const names = ndlParseHerbNamesFromCell(herbsCell);
                    const ids = [];
                    for (const hn of names) {
                        const vid = await ndlEnsureViThuocIdByName(hn, viLookup);
                        if (vid) ids.push(vid);
                    }
                    const memRes = await apiSetNhomNhoMembers(idNho, ids);
                    if (!memRes.success) {
                        console.warn('Gán vị thuốc nhóm', idNho, memRes.error);
                    }
                }
            }

            alert('Import nhóm dược lý xong.');
            await loadAllThuocData();
            renderThuocSection();
        } finally {
            ndlNhomImportSetLoading(false, '');
            inputEl.value = '';
        }
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
