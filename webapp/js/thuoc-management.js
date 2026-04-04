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
    trieuChung: [],
    nhomDuocLy: [],
    congDung: [],
    chuTri: [],
    kiengKy: [],
    phapTriList: [],
    activeTab: 'vi-thuoc',
};

let _phapTriDongYCache = null;

// Draft de chi_tiet (thành phần vị thuốc) đang được chỉnh trong modal bài thuốc
let _btDraftChiTiet = [];
// Draft chips cho triệu chứng
let _btDraftTrieuChung = [];

// ─── Khởi tạo ─────────────────────────────────────────────
async function initThuocManagement() {
    await loadAllThuocData();
    renderThuocSection();
}

async function loadAllThuocData() {
    try {
        const [vt, bt, km, hv, tc, ndl, cd, cn, kk, pt] = await Promise.all([
            apiGetViThuoc(),
            apiGetBaiThuoc(),
            apiGetKinhMach(),
            apiGetHuyetVi(),
            apiGetTrieuChung(),
            apiGetNhomDuocLy(),
            apiGetCongDung(),
            apiGetChuTri(),
            apiGetKiengKy(),
            apiGetPhapTri(),
        ]);
        _thuocData.viThuoc = vt || [];
        _thuocData.baiThuoc = bt || [];
        _thuocData.kinhMach = km || [];
        _thuocData.huyetVi = hv || [];
        _thuocData.trieuChung = tc || [];
        _thuocData.nhomDuocLy = ndl || [];
        _thuocData.congDung = cd || [];
        _thuocData.chuTri = cn || [];
        _thuocData.kiengKy = kk || [];
        _thuocData.phapTriList = pt || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Thuốc:', e);
    }
}


// ─── Render section chính ─────────────────────────────────
function renderThuocSection() {
    const container = document.getElementById('thuoc-section');
    if (!container) return;

    if (_thuocData.activeTab === 'bien-chung') {
        _thuocData.activeTab = 'bai-thuoc';
    }
    const tab = _thuocData.activeTab;
    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin:0;">Quản Lý Thuốc (Vị thuốc & Bài thuốc)</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border); overflow-x:auto; white-space:nowrap;">
                <button class="tayy-tab ${tab === 'vi-thuoc' ? 'active' : ''}" onclick="switchThuocTab('vi-thuoc')">Danh mục Vị thuốc</button>
                <button class="tayy-tab ${tab === 'bai-thuoc' ? 'active' : ''}" onclick="switchThuocTab('bai-thuoc')">Danh mục Bài thuốc</button>
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
        case 'phap-tri': renderPhapTriTab(el); break;
        case 'nhom-duoc-ly': renderNhomDuocLyTab(el); break;
        case 'cong-dung': renderCongDungTab(el); break;
        case 'chu-tri': renderChuTriTab(el); break;
        case 'kieng-ky': renderKiengKyTab(el); break;
    }
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

function vtNhomSubNameList(vt) {
    const links = vt.nhomLinks || [];
    const out = [];
    for (const l of links) {
        const n = (l.nhomNho?.ten_nhom_nho || '').trim();
        if (n) out.push(n);
    }
    return out;
}

function tayyChipsFromStrings(arr) {
    const list = [...new Set((arr || []).map(s => String(s).trim()).filter(Boolean))];
    if (!list.length) {
        return '<span style="color:#D1D5DB;font-size:0.78rem;">—</span>';
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${
        list.map(t => `<span class="chip" style="cursor:default;font-size:0.72rem;">${escHtml(t)}</span>`).join('')
    }</div>`;
}

/** Fallback nếu thuoc-yhct-analysis.js chưa ghi đè — schema Excel 11 cột */
function renderViThuocTab(el) {
    const rows = (_thuocData.viThuoc || []).map(item => `
        <tr>
            <td><strong>${escHtml(item.ten_vi_thuoc)}</strong></td>
            <td style="font-size:0.78rem;vertical-align:top;max-width:200px;">${tayyChipsFromStrings(vtNhomSubNameList(item))}</td>
            <td style="font-size:0.78rem;">${escHtml(item.tinh || '—')}</td>
            <td style="font-size:0.78rem;vertical-align:top;">${tayyChipsFromStrings(String(item.vi || '').split(/[,，]/).map(s => s.trim()).filter(Boolean))}</td>
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
/** Ghi đè bởi thuoc-yhct-analysis.js khi có form đầy đủ; fallback gửi danh sách rỗng cho liên kết danh mục. */
async function saveViThuoc(id) {
    const ten_goi_khac_list = String(document.getElementById('vt-inp-alias')?.value || '')
        .split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
    const payload = {
        ten_vi_thuoc: (document.getElementById('vt-inp-ten')?.value || '').trim(),
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
        ten_goi_khac_list,
        cong_dung_links: [],
        chu_tri_links: [],
        kieng_ky_links: [],
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

    _btDraftTrieuChung = (item?.trieu_chung || '').split(',').map(s => s.trim()).filter(Boolean);

    const rowsHtml = btRenderBaiThuocChiTietRowsHtml();
    showTayyModal('Bài thuốc', `
        <datalist id="bt-lieu-datalist">
            <option value="*"></option>
            <option value="#"></option>
        </datalist>

        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_bai_thuoc) : ''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item ? escHtml(item.nguon_goc) : ''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item ? escHtml(item.cach_dung) : ''}</textarea></label>

        <label class="tayy-form-label">Biện chứng<br><textarea id="bt-inp-bienchung" class="tayy-form-input" rows="2" placeholder="Nhập biện chứng (tự do)">${item ? escHtml(item.bien_chung || '') : ''}</textarea></label>

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

        <label class="tayy-form-label">Pháp trị<br><textarea id="bt-inp-phaptri" class="tayy-form-input" rows="2" placeholder="Nhập pháp trị (tự do)">${item ? escHtml(item.phap_tri || '') : ''}</textarea></label>

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
        btRenderTrieuChungChips();
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
        bien_chung: (document.getElementById('bt-inp-bienchung')?.value || '').trim(),
        trieu_chung: _btDraftTrieuChung.join(', '),
        phap_tri: (document.getElementById('bt-inp-phaptri')?.value || '').trim(),
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
        const viChipList = String(vt?.vi || '').split(/[,，]/).map(s => s.trim()).filter(Boolean);
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
                    <div><strong>Nhóm nhỏ:</strong></div>
                    <div style="margin-top:4px;">${vt ? tayyChipsFromStrings(vtNhomSubNameList(vt)) : '<span style="color:#D1D5DB;">—</span>'}</div>
                    <div style="margin-top:8px;"><strong>Tính:</strong> ${escHtml(tinh)}</div>
                    <div style="margin-top:4px;"><strong>Vị:</strong></div>
                    <div style="margin-top:4px;">${tayyChipsFromStrings(viChipList)}</div>
                    <div style="margin-top:8px;"><strong>Quy kinh:</strong> ${escHtml(vtQuyKinh)}</div>
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

/** Chuỗi con có xuất hiện trong tên chính hoặc một tên gọi khác không (tìm vị thuốc trong bài thuốc). */
function btViThuocMatchesSearchQuery(v, queryLower) {
    if (!queryLower) return true;
    const ten = (v?.ten_vi_thuoc || '').toLowerCase();
    if (ten.includes(queryLower)) return true;
    for (const row of v?.tenGoiKhacList || []) {
        const alias = String(row?.ten_goi_khac || '').trim().toLowerCase();
        if (alias && alias.includes(queryLower)) return true;
    }
    return false;
}

/** Khớp chính xác toàn bộ từ khóa — tránh nút «Thêm mới» trùng tên/alias có sẵn. */
function btViThuocExactNameOrAlias(v, queryLower) {
    if (!queryLower) return false;
    if ((v?.ten_vi_thuoc || '').trim().toLowerCase() === queryLower) return true;
    for (const row of v?.tenGoiKhacList || []) {
        const alias = String(row?.ten_goi_khac || '').trim().toLowerCase();
        if (alias && alias === queryLower) return true;
    }
    return false;
}

/** Alias khớpx từ khóa (để hiển thị dòng phụ trong gợi ý). */
function btViThuocFirstMatchingAliasHtml(v, queryLower) {
    for (const row of v?.tenGoiKhacList || []) {
        const raw = String(row?.ten_goi_khac || '').trim();
        if (raw && raw.toLowerCase().includes(queryLower)) {
            const main = (v?.ten_vi_thuoc || '').trim().toLowerCase();
            if (main.includes(queryLower)) return '';
            return `<div style="font-size:0.72rem;color:#8B7355;font-style:italic;">Tên gọi khác: ${escHtml(raw)}</div>`;
        }
    }
    return '';
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
        .filter(v => btViThuocMatchesSearchQuery(v, inpVal))
        .filter(v => !selectedIds.has(v.id))
        .slice(0, 10);

    const hasExactMatch = matches.some(v => btViThuocExactNameOrAlias(v, inpVal));

    let html = '';

    if (matches.length > 0) {
        html += matches.map(v => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btAddViThuocChip(${v.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(v.ten_vi_thuoc || '')}</div>
                ${btViThuocFirstMatchingAliasHtml(v, inpVal)}
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
    const payload = {
        ten_vi_thuoc: name,
        tinh: '',
        vi: '',
        quy_kinh: '',
        ten_goi_khac_list: [],
        cong_dung_links: [],
        chu_tri_links: [],
        kieng_ky_links: [],
    };
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
// TAB: PHÁP TRỊ (bảng phap_tri — theo cấu trúc Excel luận trị)
// ═══════════════════════════════════════════════════════════
let _ptChips = {
    bat_phap: [],
    bat_cuong: [],
    luc_dam: [],
    trieu_chung_mo_ta: [],
};
let _ptKinhIds = [];

function ptCsvToArr(s) {
    return String(s || '').split(/[,，]/).map(x => x.trim()).filter(Boolean);
}

function ptArrToCsv(arr) {
    return (arr || []).map(x => String(x).trim()).filter(Boolean).join(', ');
}

function kmRowId(k) {
    if (!k) return NaN;
    const v = k.idKinhMach != null ? k.idKinhMach : k.id_kinh_mach;
    return Number(v);
}

function ptChipsPreviewCsv(csv) {
    const parts = ptCsvToArr(csv);
    if (!parts.length) return '<span style="color:#D1D5DB;font-size:0.78rem;">—</span>';
    return `<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:220px;">${
        parts.map(p => `<span class="chip" style="cursor:default;font-size:0.68rem;">${escHtml(p)}</span>`).join('')
    }</div>`;
}

function ptNhomNhoOptionsHtml(selectedId) {
    let html = '<option value="">— Nhóm dược lý —</option>';
    for (const lon of _thuocData.nhomDuocLy || []) {
        const tLon = lon.ten_nhom_lon || '';
        for (const nho of lon.nhomNho || []) {
            const id = nho.id;
            const lab = (tLon ? tLon + ' › ' : '') + (nho.ten_nhom_nho || '');
            const sel = String(selectedId) === String(id) ? ' selected' : '';
            html += `<option value="${id}"${sel}>${escHtml(lab)}</option>`;
        }
    }
    return html;
}

function ptResetChips() {
    _ptChips = { bat_phap: [], bat_cuong: [], luc_dam: [], trieu_chung_mo_ta: [] };
    _ptKinhIds = [];
}

function ptRemoveChip(field, term) {
    _ptChips[field] = (_ptChips[field] || []).filter(x => x !== term);
    ptRenderChipGroups();
}

function ptOnChipKeydown(field, ev) {
    if (ev.key === 'Enter' && ev.target.value.trim()) {
        ev.preventDefault();
        const idMap = {
            bat_phap: 'pt-inp-batphap',
            bat_cuong: 'pt-inp-batcuong',
            luc_dam: 'pt-inp-lucdam',
            trieu_chung_mo_ta: 'pt-inp-tcmota',
        };
        const inp = document.getElementById(idMap[field]);
        if (!inp) return;
        const v = inp.value.trim();
        if (!v) return;
        if (!_ptChips[field].includes(v)) _ptChips[field].push(v);
        inp.value = '';
        ptRenderChipGroups();
    }
}

function ptRenderChipGroups() {
    const spec = [
        { field: 'bat_phap', box: 'pt-chips-batphap', inp: 'pt-inp-batphap' },
        { field: 'bat_cuong', box: 'pt-chips-batcuong', inp: 'pt-inp-batcuong' },
        { field: 'luc_dam', box: 'pt-chips-lucdam', inp: 'pt-inp-lucdam' },
        { field: 'trieu_chung_mo_ta', box: 'pt-chips-tcmota', inp: 'pt-inp-tcmota' },
    ];
    for (const { field, box, inp } of spec) {
        const container = document.getElementById(box);
        const input = document.getElementById(inp);
        if (!container || !input) continue;
        container.querySelectorAll('.chip').forEach(c => c.remove());
        (_ptChips[field] || []).forEach(term => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.appendChild(document.createTextNode(term + ' '));
            const x = document.createElement('span');
            x.className = 'chip-remove';
            x.textContent = '×';
            x.onclick = (e) => { e.stopPropagation(); ptRemoveChip(field, term); };
            chip.appendChild(x);
            container.insertBefore(chip, input);
        });
    }
}

function ptToggleKinhId(kid, on) {
    kid = Number(kid);
    if (!Number.isFinite(kid)) return;
    const i = _ptKinhIds.indexOf(kid);
    if (on && i < 0) _ptKinhIds.push(kid);
    if (!on && i >= 0) _ptKinhIds.splice(i, 1);
}

async function renderPhapTriTab(el) {
    try {
        if (!_phapTriDongYCache) {
            _phapTriDongYCache = await apiGetModels() || [];
        }
    } catch (e) {
        console.error(e);
        _phapTriDongYCache = [];
    }

    const rows = (_thuocData.phapTriList || []).map(r => {
        const ck = (r.benh_dong_y && r.benh_dong_y.tieuket) ? r.benh_dong_y.tieuket : '—';
        const bt = (r.bai_thuoc && r.bai_thuoc.ten_bai_thuoc) ? r.bai_thuoc.ten_bai_thuoc : '—';
        const nho = r.nhom_duoc_ly_nho;
        const lonTen = (nho && (nho.nhomLon || nho.nhom_lon)) ? (nho.nhomLon || nho.nhom_lon).ten_nhom_lon : '';
        const nn = nho
            ? ((lonTen ? lonTen + ' › ' : '') + (nho.ten_nhom_nho || '')).trim() || '—'
            : '—';
        const nt = (r.nguyen_tac || '').trim();
        const ntShort = nt.length > 48 ? escHtml(nt.slice(0, 48)) + '…' : escHtml(nt || '—');
        return `<tr>
            <td style="font-weight:600;color:#5B3A1A;">${escHtml(ck)}</td>
            <td style="font-size:0.78rem;max-width:200px;">${ntShort}</td>
            <td>${ptChipsPreviewCsv(r.bat_phap)}</td>
            <td style="font-size:0.8rem;">${escHtml(bt)}</td>
            <td style="font-size:0.78rem;">${escHtml(nn)}</td>
            <td style="text-align:center;width:130px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openPhapTriRowForm(${r.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePhapTriRow(${r.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <button type="button" class="btn btn-outline" onclick="exportPhapTriXlsx()">📥 Xuất Excel</button>
                <button type="button" class="btn btn-outline" title="Form mặc định không có id: cập nhật theo cột «Chứng trạng» (khớp tiểu kết benh_dong_y). Tùy chọn cột id. Các cột: Nguyên tắc, Ý nghĩa &amp; cơ chế, Bát pháp, Bát cương, Lục dâm, Tạng phủ, Triệu chứng, Bài thuốc, Nhóm dược. Nhiều giá trị: dấu phẩy."
                    onclick="document.getElementById('pt-import-xlsx').click()">📤 Cập nhật từ Excel</button>
                <input type="file" id="pt-import-xlsx" accept=".xlsx,.xls,.csv" style="display:none;" onchange="importPhapTriXlsx(event)">
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span style="font-size:0.82rem;color:#A09580;">
                    Pháp trị (luận trị): <strong>${(_thuocData.phapTriList || []).length}</strong> bản ghi
                </span>
                <button class="btn btn-primary" onclick="openPhapTriRowForm()">+ Thêm pháp trị</button>
            </div>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Chứng trạng (tiểu kết)</th>
                    <th>Nguyên tắc</th>
                    <th>Bát pháp</th>
                    <th>Bài thuốc</th>
                    <th>Nhóm dược</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#9CA3AF;">Chưa có bản ghi</td></tr>'}</tbody>
            </table>
        </div>`;
}

async function openPhapTriRowForm(id) {
    if (!_phapTriDongYCache) {
        try { _phapTriDongYCache = await apiGetModels() || []; } catch (e) { _phapTriDongYCache = []; }
    }
    const item = id ? (_thuocData.phapTriList || []).find(x => x.id == id) : null;
    ptResetChips();
    if (item) {
        _ptChips.bat_phap = ptCsvToArr(item.bat_phap);
        _ptChips.bat_cuong = ptCsvToArr(item.bat_cuong);
        _ptChips.luc_dam = ptCsvToArr(item.luc_dam);
        _ptChips.trieu_chung_mo_ta = ptCsvToArr(item.trieu_chung_mo_ta);
        _ptKinhIds = (item.kinh_mach_list || []).map(k => kmRowId(k)).filter(n => Number.isFinite(n));
    }
    const benhVal = item && item.benh_dong_y ? item.benh_dong_y.id : '';
    const btVal = item && item.bai_thuoc ? item.bai_thuoc.id : '';
    const nnVal = item && item.nhom_duoc_ly_nho ? item.nhom_duoc_ly_nho.id : '';

    const benhOpts = '<option value="">— Chứng trạng (benh_dong_y / tiểu kết) —</option>' +
        (_phapTriDongYCache || []).map(m => {
            const sel = String(m.id) === String(benhVal) ? ' selected' : '';
            return `<option value="${m.id}"${sel}>${escHtml(m.tieuket || ('#' + m.id))}</option>`;
        }).join('');

    const btOpts = '<option value="">— Bài thuốc —</option>' +
        (_thuocData.baiThuoc || []).map(bt => {
            const sel = String(bt.id) === String(btVal) ? ' selected' : '';
            return `<option value="${bt.id}"${sel}>${escHtml(bt.ten_bai_thuoc)}</option>`;
        }).join('');

    const kinhBoxes = (_thuocData.kinhMach || []).map(k => {
        const kid = kmRowId(k);
        const checked = _ptKinhIds.includes(kid) ? ' checked' : '';
        return `<label style="display:block;font-size:0.8rem;margin:2px 0;cursor:pointer;">
            <input type="checkbox"${checked} onchange="ptToggleKinhId(${kid}, this.checked)">
            ${k.ten_viet_tat ? escHtml(k.ten_viet_tat) + ' — ' : ''}${escHtml(k.ten_kinh_mach || '')}
        </label>`;
    }).join('');

    showTayyModal(item ? 'Sửa pháp trị' : 'Thêm pháp trị', `
        <label class="tayy-form-label">Chứng trạng (liên kết tiểu kết — benh_dong_y)<br>
            <select id="pt-sel-benhdy" class="tayy-form-input">${benhOpts}</select>
        </label>
        <label class="tayy-form-label">Nguyên tắc<br>
            <textarea id="pt-inp-nguyen_tac" class="tayy-form-input" rows="2">${item ? escHtml(item.nguyen_tac || '') : ''}</textarea>
        </label>
        <label class="tayy-form-label">Ý nghĩa &amp; cơ chế<br>
            <textarea id="pt-inp-y_nghia" class="tayy-form-input" rows="3">${item ? escHtml(item.y_nghia_co_che || '') : ''}</textarea>
        </label>

        <label class="tayy-form-label">Bát pháp <span style="font-size:0.72rem;color:#A09580;">(Enter để thêm chip)</span>
            <div id="pt-chips-batphap" class="chips-container" onclick="document.getElementById('pt-inp-batphap').focus()">
                <input id="pt-inp-batphap" type="text" class="chip-input" placeholder="VD: Hãn, Ôn..."
                    onkeydown="ptOnChipKeydown('bat_phap', event)">
            </div>
        </label>
        <label class="tayy-form-label">Bát cương
            <div id="pt-chips-batcuong" class="chips-container" onclick="document.getElementById('pt-inp-batcuong').focus()">
                <input id="pt-inp-batcuong" type="text" class="chip-input" placeholder="VD: Biểu, Hàn..."
                    onkeydown="ptOnChipKeydown('bat_cuong', event)">
            </div>
        </label>
        <label class="tayy-form-label">Lục dâm
            <div id="pt-chips-lucdam" class="chips-container" onclick="document.getElementById('pt-inp-lucdam').focus()">
                <input id="pt-inp-lucdam" type="text" class="chip-input" placeholder="VD: Phong, Hàn..."
                    onkeydown="ptOnChipKeydown('luc_dam', event)">
            </div>
        </label>

        <label class="tayy-form-label">Tạng phủ (nhiều kinh mạch)
            <div style="max-height:160px;overflow-y:auto;border:1px solid #D4C5A0;border-radius:8px;padding:8px;background:#FBF8F1;">
                ${kinhBoxes || '<span style="color:#9CA3AF;">Chưa có danh sách kinh mạch</span>'}
            </div>
        </label>

        <label class="tayy-form-label">Triệu chứng (nhiều giá trị)
            <div id="pt-chips-tcmota" class="chips-container" onclick="document.getElementById('pt-inp-tcmota').focus()">
                <input id="pt-inp-tcmota" type="text" class="chip-input" placeholder="Thêm triệu chứng..."
                    onkeydown="ptOnChipKeydown('trieu_chung_mo_ta', event)">
            </div>
        </label>

        <label class="tayy-form-label">Bài thuốc<br>
            <select id="pt-sel-baithuoc" class="tayy-form-input">${btOpts}</select>
        </label>
        <label class="tayy-form-label">Nhóm dược lý (nhóm nhỏ)<br>
            <select id="pt-sel-nhomnho" class="tayy-form-input">${ptNhomNhoOptionsHtml(nnVal)}</select>
        </label>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhapTriRow(${id || 0})">Lưu</button>
        </div>
    `, 'wide');
    setTimeout(() => ptRenderChipGroups(), 0);
}

async function savePhapTriRow(id) {
    function numOrNull(v) {
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    const payload = {
        id_benh_dong_y: numOrNull(document.getElementById('pt-sel-benhdy')?.value),
        nguyen_tac: (document.getElementById('pt-inp-nguyen_tac')?.value || '').trim() || null,
        y_nghia_co_che: (document.getElementById('pt-inp-y_nghia')?.value || '').trim() || null,
        bat_phap: ptArrToCsv(_ptChips.bat_phap) || null,
        bat_cuong: ptArrToCsv(_ptChips.bat_cuong) || null,
        luc_dam: ptArrToCsv(_ptChips.luc_dam) || null,
        trieu_chung_mo_ta: ptArrToCsv(_ptChips.trieu_chung_mo_ta) || null,
        id_bai_thuoc: numOrNull(document.getElementById('pt-sel-baithuoc')?.value),
        id_nhom_duoc_ly_nho: numOrNull(document.getElementById('pt-sel-nhomnho')?.value),
        id_kinh_mach_list: _ptKinhIds.filter(n => Number.isFinite(n)),
    };
    const res = id ? await apiUpdatePhapTri(id, payload) : await apiCreatePhapTri(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function deletePhapTriRow(id) {
    if (!confirm('Xóa bản ghi pháp trị này?')) return;
    const res = await apiDeletePhapTri(id);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    await loadAllThuocData();
    renderThuocSection();
}

function ptNhomDuocExportLabel(nho) {
    if (!nho) return '';
    const lon = nho.nhomLon || nho.nhom_lon;
    const lonTen = lon ? String(lon.ten_nhom_lon || '').trim() : '';
    const nhoTen = String(nho.ten_nhom_nho || '').trim();
    if (lonTen && nhoTen) return lonTen + ' › ' + nhoTen;
    return nhoTen;
}

function ptKinhIdsFromTangPhuCell(raw, kinhList) {
    const parts = String(raw || '')
        .split(/[,，、]/g)
        .map(s => s.trim())
        .filter(Boolean);
    if (!parts.length) return [];
    const byTen = new Map();
    const byTat = new Map();
    for (const k of kinhList || []) {
        const id = kmRowId(k);
        if (!Number.isFinite(id)) continue;
        const t = String(k.ten_kinh_mach || '').trim().toLowerCase();
        const a = String(k.ten_viet_tat || '').trim().toLowerCase();
        if (t) byTen.set(t, id);
        if (a) byTat.set(a, id);
    }
    const out = [];
    for (const p of parts) {
        const key = p.toLowerCase();
        const id = byTen.get(key) || byTat.get(key);
        if (id != null && !out.includes(id)) out.push(id);
    }
    return out;
}

function ptResolveBenhDongYIdFromExcel(tieuket) {
    const s = String(tieuket || '').trim();
    if (!s) return null;
    const models = _phapTriDongYCache || [];
    const m = models.find(x => String(x.tieuket || '').trim().toLowerCase() === s.toLowerCase());
    return m ? m.id : null;
}

function ptResolveBaiThuocIdFromExcel(name) {
    const s = String(name || '').trim();
    if (!s) return null;
    const bt = (_thuocData.baiThuoc || []).find(b => String(b.ten_bai_thuoc || '').trim().toLowerCase() === s.toLowerCase());
    return bt ? bt.id : null;
}

function ptResolveNhomNhoIdFromExcel(cell) {
    const s = String(cell || '').trim();
    if (!s) return null;
    const want = s.toLowerCase();
    for (const lon of _thuocData.nhomDuocLy || []) {
        for (const nho of lon.nhomNho || []) {
            const nhoTen = String(nho.ten_nhom_nho || '').trim().toLowerCase();
            if (nhoTen === want) return nho.id;
        }
    }
    const norm = s.replace(/\s*[›>]\s*/g, ' › ').toLowerCase();
    for (const lon of _thuocData.nhomDuocLy || []) {
        const lonTen = String(lon.ten_nhom_lon || '').trim().toLowerCase();
        for (const nho of lon.nhomNho || []) {
            const nhoTen = String(nho.ten_nhom_nho || '').trim().toLowerCase();
            const label = (lonTen ? lonTen + ' › ' : '') + nhoTen;
            if (label === norm) return nho.id;
        }
    }
    return null;
}

function ptPhapTriImportRowSkippable(row) {
    const idStr = ndlPickNhomCol(row, ['id', 'ID']);
    if (String(idStr || '').trim() !== '') return false;
    const probes = [
        ['Chứng trạng', 'Chứng Trạng', 'Tiểu kết', 'Tieu ket', 'Chung trang', 'tieuket'],
        ['Nguyên tắc', 'Nguyen tac', 'Nguyên Tắc'],
        ['Ý nghĩa & cơ chế', 'Y nghia & co che', 'Y nghia', 'Co che'],
        ['Bát pháp', 'Bat phap', 'Bát Pháp'],
        ['Bát cương', 'Bat cuong', 'Bát Cương'],
        ['Lục dâm', 'Luc dam', 'Lục Dâm'],
        ['Tạng phủ', 'Tang phu', 'Tạng Phủ', 'Kinh mạch', 'Kinh mach'],
        ['Triệu chứng', 'Trieu chung', 'Triệu Chứng'],
        ['Bài thuốc', 'Bai thuoc', 'Ten bai thuoc', 'Bài Thuốc'],
        ['Nhóm dược', 'Nhom duoc', 'Nhom duoc ly', 'Nhóm Dược', 'Nhóm dược lý'],
    ];
    for (const keys of probes) {
        if (ndlPickNhomCol(row, keys)) return false;
    }
    return true;
}

function ptBuildPayloadFromExcelRow(row, warnAcc) {
    const chungTrang = ndlPickNhomCol(row, [
        'Chứng trạng', 'Chứng Trạng', 'Tiểu kết', 'Tieu ket', 'Chung trang', 'tieuket',
    ]);
    const nguyen_tac = ndlPickNhomCol(row, ['Nguyên tắc', 'Nguyen tac', 'Nguyên Tắc']);
    const y_nghia = ndlPickNhomCol(row, ['Ý nghĩa & cơ chế', 'Y nghia & co che', 'Ý nghĩa', 'Y nghia', 'Co che', 'Ý Nghĩa & Cơ Chế']);
    const bat_phap = ndlPickNhomCol(row, ['Bát pháp', 'Bat phap', 'Bát Pháp']);
    const bat_cuong = ndlPickNhomCol(row, ['Bát cương', 'Bat cuong', 'Bát Cương']);
    const luc_dam = ndlPickNhomCol(row, ['Lục dâm', 'Luc dam', 'Lục Dâm']);
    const tang_phu = ndlPickNhomCol(row, ['Tạng phủ', 'Tang phu', 'Tạng Phủ', 'Kinh mạch', 'Kinh mach']);
    const trieu_chung = ndlPickNhomCol(row, ['Triệu chứng', 'Trieu chung', 'Triệu Chứng']);
    const bai_thuoc = ndlPickNhomCol(row, ['Bài thuốc', 'Bai thuoc', 'Ten bai thuoc', 'Tên bài thuốc', 'Bài Thuốc']);
    const nhom_duoc = ndlPickNhomCol(row, ['Nhóm dược', 'Nhom duoc', 'Nhóm dược lý', 'Nhom duoc ly', 'Ten nhom nho', 'Nhóm Dược']);

    const idBenh = ptResolveBenhDongYIdFromExcel(chungTrang);
    if (chungTrang && !idBenh) {
        warnAcc.push('Không khớp chứng trạng với benh_dong_y (tiểu kết): «' + chungTrang + '»');
    }

    const idBt = ptResolveBaiThuocIdFromExcel(bai_thuoc);
    if (bai_thuoc && !idBt) warnAcc.push('Không khớp bài thuốc: «' + bai_thuoc + '»');

    const idNho = ptResolveNhomNhoIdFromExcel(nhom_duoc);
    if (nhom_duoc && !idNho) warnAcc.push('Không khớp nhóm dược: «' + nhom_duoc + '»');

    const idKinhList = ptKinhIdsFromTangPhuCell(tang_phu, _thuocData.kinhMach);
    const kinhParts = String(tang_phu || '')
        .split(/[,，、]/g)
        .map(s => s.trim())
        .filter(Boolean);
    if (kinhParts.length && idKinhList.length < kinhParts.length) {
        warnAcc.push('Một số tạng phủ/kinh không khớp: «' + tang_phu + '»');
    }

    return {
        id_benh_dong_y: idBenh,
        nguyen_tac: nguyen_tac ? nguyen_tac : null,
        y_nghia_co_che: y_nghia ? y_nghia : null,
        bat_phap: bat_phap ? bat_phap : null,
        bat_cuong: bat_cuong ? bat_cuong : null,
        luc_dam: luc_dam ? luc_dam : null,
        trieu_chung_mo_ta: trieu_chung ? trieu_chung : null,
        id_bai_thuoc: idBt,
        id_nhom_duoc_ly_nho: idNho,
        id_kinh_mach_list: idKinhList,
    };
}

function ptResolveUpsertPhapTriTarget(row, payload, existingIds) {
    const idStr = ndlPickNhomCol(row, ['id', 'ID']);
    const idNum = parseInt(String(idStr || '').trim(), 10);
    if (Number.isFinite(idNum) && existingIds.has(idNum)) {
        return { targetId: idNum, via: 'id', extraWarn: null };
    }
    const idBenh = payload.id_benh_dong_y;
    if (idBenh != null) {
        const matches = (_thuocData.phapTriList || []).filter(p =>
            p.benh_dong_y && Number(p.benh_dong_y.id) === Number(idBenh)
        );
        if (matches.length > 0) {
            const sorted = [...matches].sort((a, b) => a.id - b.id);
            const chosen = sorted[0];
            const extraWarn = matches.length > 1
                ? 'Cùng chứng trạng có ' + matches.length + ' bản ghi — cập nhật bản id ' + chosen.id
                : null;
            return { targetId: chosen.id, via: 'chung_trang', extraWarn };
        }
    }
    return { targetId: null, via: 'create', extraWarn: null };
}

function exportPhapTriXlsx() {
    if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
    const list = _thuocData.phapTriList || [];
    const data = list.map(r => ({
        'Chứng trạng': (r.benh_dong_y && r.benh_dong_y.tieuket) ? r.benh_dong_y.tieuket : '',
        'Nguyên tắc': r.nguyen_tac || '',
        'Ý nghĩa & cơ chế': r.y_nghia_co_che || '',
        'Bát pháp': r.bat_phap || '',
        'Bát cương': r.bat_cuong || '',
        'Lục dâm': r.luc_dam || '',
        'Tạng phủ': (r.kinh_mach_list || []).map(k => k.ten_kinh_mach || k.ten_viet_tat || '').filter(Boolean).join(', '),
        'Triệu chứng': r.trieu_chung_mo_ta || '',
        'Bài thuốc': (r.bai_thuoc && r.bai_thuoc.ten_bai_thuoc) ? r.bai_thuoc.ten_bai_thuoc : '',
        'Nhóm dược': ptNhomDuocExportLabel(r.nhom_duoc_ly_nho),
    }));
    const emptyRow = {
        'Chứng trạng': '',
        'Nguyên tắc': '',
        'Ý nghĩa & cơ chế': '',
        'Bát pháp': '',
        'Bát cương': '',
        'Lục dâm': '',
        'Tạng phủ': '',
        'Triệu chứng': '',
        'Bài thuốc': '',
        'Nhóm dược': '',
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.length ? data : [emptyRow]), 'PhapTri');
    XLSX.writeFile(wb, 'Phap_Tri_Luan_Tri.xlsx');
}

function importPhapTriXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files?.[0];
    const inputEl = e.target;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const buf = new Uint8Array(evt.target.result);
            const wb = XLSX.read(buf, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            if (!rawRows.length) {
                alert('File Excel không có dữ liệu.');
                return;
            }
            if (!_phapTriDongYCache) {
                try { _phapTriDongYCache = await apiGetModels() || []; } catch (err) { _phapTriDongYCache = []; }
            }
            const toProcess = rawRows.filter(r => r && typeof r === 'object' && !ptPhapTriImportRowSkippable(r));
            if (!toProcess.length) {
                alert('Không có dòng dữ liệu hợp lệ (bỏ qua dòng trống).');
                return;
            }
            if (!confirm(`Tìm thấy ${toProcess.length} dòng. Ghi vào hệ thống?\n• Mặc định: «Chứng trạng» khớp tiểu kết benh_dong_y → nếu đã có pháp trị cho bệnh đó thì cập nhật, không thì tạo mới.\n• Nếu file có cột «id» hợp lệ: ưu tiên cập nhật theo id.`)) {
                return;
            }

            ndlNhomImportSetLoading(true, 'Đang nhập Excel pháp trị…');
            const existingIds = new Set((_thuocData.phapTriList || []).map(x => x.id));
            let created = 0;
            let updated = 0;
            const allWarn = [];
            const errors = [];
            let idx = 0;
            for (const row of toProcess) {
                idx++;
                ndlNhomImportSetLoading(true, `Đang nhập pháp trị… (${idx}/${toProcess.length})`);
                const rowWarn = [];
                const payload = ptBuildPayloadFromExcelRow(row, rowWarn);
                const { targetId, via, extraWarn } = ptResolveUpsertPhapTriTarget(row, payload, existingIds);
                if (rowWarn.length) {
                    allWarn.push('Dòng ~' + idx + ': ' + rowWarn.join('; '));
                }
                if (extraWarn) {
                    allWarn.push('Dòng ~' + idx + ': ' + extraWarn);
                }
                try {
                    if (targetId != null) {
                        const res = await apiUpdatePhapTri(targetId, payload);
                        if (!res.success) {
                            errors.push('Dòng ' + idx + (via === 'id' ? ' (id ' + targetId + ')' : ' (chứng trạng → id ' + targetId + ')') + ': ' + (res.error || 'Lỗi'));
                            continue;
                        }
                        updated++;
                    } else {
                        const res = await apiCreatePhapTri(payload);
                        if (!res.success) {
                            errors.push('Dòng ' + idx + ': ' + (res.error || 'Lỗi'));
                            continue;
                        }
                        created++;
                        if (res.id != null) {
                            existingIds.add(res.id);
                            if (payload.id_benh_dong_y != null) {
                                _thuocData.phapTriList = _thuocData.phapTriList || [];
                                _thuocData.phapTriList.push({
                                    id: res.id,
                                    benh_dong_y: { id: payload.id_benh_dong_y },
                                });
                            }
                        }
                    }
                } catch (err) {
                    errors.push('Dòng ' + idx + ': ' + (err && err.message ? err.message : String(err)));
                }
            }
            ndlNhomImportSetLoading(false, '');
            await loadAllThuocData();
            renderThuocSection();
            let msg = 'Hoàn tất. Tạo mới: ' + created + ', cập nhật: ' + updated + '.';
            if (errors.length) msg += '\n\nLỗi (' + errors.length + '):\n' + errors.slice(0, 8).join('\n') + (errors.length > 8 ? '\n…' : '');
            if (allWarn.length) msg += '\n\nCảnh báo khớp tên (' + allWarn.length + '):\n' + allWarn.slice(0, 6).join('\n') + (allWarn.length > 6 ? '\n…' : '');
            alert(msg);
        } catch (err) {
            ndlNhomImportSetLoading(false, '');
            console.error(err);
            alert('Lỗi đọc Excel: ' + (err && err.message ? err.message : String(err)));
        } finally {
            inputEl.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
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

/** Danh sách id vị thuốc → chip (đọc tên từ `_thuocData.viThuoc`). */
function ndlViThuocChipsFromIds(idList) {
    const ids = idList || [];
    const vts = _thuocData.viThuoc || [];
    const idToTen = new Map(vts.map(v => [v.id, (v.ten_vi_thuoc || '').trim() || ('#' + v.id)]));
    if (!ids.length) {
        return '<span style="color:#D1D5DB;font-size:0.76rem;font-style:italic;">Chưa có</span>';
    }
    return `<div class="ndl-vi-chip-wrap" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-start;align-items:center;">${ids.map(id => {
        const ten = idToTen.get(id) || '#' + id;
        return `<span class="chip" style="cursor:default;max-width:100%;">${escHtml(ten)}</span>`;
    }).join('')}</div>`;
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
            const mt = (nho.mo_ta || '').trim();
            return `<tr>
                <td style="font-weight:600;color:#5B3A1A;">${escHtml(nho.ten_nhom_nho)}</td>
                <td style="color:#8B7355;font-size:0.78rem;">${escHtml(mt ? (mt.length > 100 ? mt.slice(0, 100) + '…' : mt) : '—')}</td>
                <td style="vertical-align:top;min-width:180px;max-width:480px;">${ndlViThuocChipsFromIds(nho.id_vi_thuoc)}</td>
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
                        <th>Nhóm nhỏ (Tác dụng YHCT)</th><th>Mô tả</th><th>Vị thuốc</th><th style="text-align:center;width:240px;">Thao tác</th>
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
        const usageCount = (_thuocData.viThuoc || []).filter(vt =>
            (vt.congDungLinks || []).some(l => Number(l.id_cong_dung) === id)
        ).length;

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
    if (!confirm('Xóa công dụng này? Các liên kết từ vị thuốc tới mục này cũng sẽ bị gỡ.')) return;
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
        const usageCount = (_thuocData.viThuoc || []).filter(vt =>
            (vt.chuTriLinks || []).some(l => Number(l.id_chu_tri) === id)
        ).length;

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
    if (!confirm('Xóa chủ trị này? Các liên kết từ vị thuốc tới mục này cũng sẽ bị gỡ.')) return;
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
        const usageCount = (_thuocData.viThuoc || []).filter(vt =>
            (vt.kiengKyLinks || []).some(l => Number(l.id_kieng_ky) === id)
        ).length;

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
    if (!confirm('Xóa kiêng kỵ này? Các liên kết từ vị thuốc tới mục này cũng sẽ bị gỡ.')) return;
    await apiDeleteKiengKy(id);
    await loadAllThuocData();
    renderThuocSection();
}
