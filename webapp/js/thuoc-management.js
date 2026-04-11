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
    /** Mô hình bệnh Đông y (apiGetModels) — dùng khi import Excel pháp trị (Chứng trạng ↔ tieuket) */
    benhDongYModels: [],
    activeTab: 'vi-thuoc',
};

// Draft de chi_tiet (thành phần vị thuốc) đang được chỉnh trong modal bài thuốc
let _btDraftChiTiet = [];
// Draft chips cho triệu chứng
let _btDraftTrieuChung = [];
/** Thứ tự = thứ tự gửi phap_tri_ids (liên kết danh mục pháp trị) */
let _btDraftPhapTriIds = [];

// ─── Khởi tạo ─────────────────────────────────────────────
async function initThuocManagement() {
    await loadAllThuocData();
    renderThuocSection();
}

async function initPhapTriManagement() {
    await loadAllThuocData();
    const container = document.getElementById('phaptri-section');
    if (!container) return;
    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin:0;">Quản Lý Pháp Trị</h2>
            </div>
            <div id="phaptri-tab-content"></div>
        </div>
    `;
    const host = document.getElementById('phaptri-tab-content');
    if (!host) return;
    await renderPhapTriTab(host);
}

async function loadAllThuocData() {
    try {
        const [vt, bt, km, hv, tc, ndl, cd, cn, kk, pt, models] = await Promise.all([
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
            apiGetModels().catch(() => []),
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
        _thuocData.benhDongYModels = Array.isArray(models) ? models : [];
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
    if (tab === 'phap-tri') tab = 'bai-thuoc';
    _thuocData.activeTab = tab;
    renderThuocSection();
}

function renderThuocTabContent() {
    const el = document.getElementById('thuoc-tab-content');
    if (!el) return;

    switch (_thuocData.activeTab) {
        case 'vi-thuoc': renderViThuocTab(el); break;
        case 'bai-thuoc': renderBaiThuocTab(el); break;
        case 'nhom-duoc-ly': renderNhomDuocLyTab(el); break;
        case 'cong-dung': renderCongDungTab(el); break;
        case 'chu-tri': renderChuTriTab(el); break;
        case 'kieng-ky': renderKiengKyTab(el); break;
    }
}

function rerenderPhapTriHost() {
    try {
        const inPhapTriSection =
            document.getElementById('phaptri-section')?.style.display !== 'none' &&
            typeof initPhapTriManagement === 'function';
        if (inPhapTriSection) {
            initPhapTriManagement();
            return;
        }
    } catch (_) {}
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
function btPhapTriLinksToOrderedIds(item) {
    const links = item?.phapTriLinks || [];
    return [...links]
        .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0))
        .map(l => l.idPhapTri ?? l.id_phap_tri ?? l.phapTri?.id)
        .filter(id => Number.isFinite(id));
}

function btFormatPhapTriLinksCell(item) {
    const links = item?.phapTriLinks || [];
    if (!links.length) return '—';
    const labels = [...links]
        .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0))
        .map(l => (l.phapTri?.chung_trang || l.phap_tri?.chung_trang || '').trim())
        .filter(Boolean);
    return labels.length ? escHtml(labels.join(' · ')) : '—';
}

function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ingredients = (item.chiTietViThuoc || []).map(d => {
            const ten = d?.viThuoc?.ten_vi_thuoc || '';
            const lieu = (d?.lieu_luong || '').trim();
            const displayLieu = btGetGramPreviewText(lieu);
            return `${ten} (${displayLieu})`;
        }).filter(Boolean).join(', ');
        const chungTrangStr = escHtml(item.chung_trang || '—');
        const trieuChungStr = escHtml(item.trieu_chung || '—');
        const ptLinkStr = btFormatPhapTriLinksCell(item);
        return `
            <tr>
                <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
                <td>${escHtml(item.nguon_goc || '—')}</td>
                <td style="font-size:0.8rem;">${chungTrangStr}</td>
                <td style="font-size:0.75rem;color:#5B3A1A;">${ptLinkStr}</td>
                <td style="font-size:0.8rem;">${trieuChungStr}</td>
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
                <thead><tr><th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Chứng trạng</th><th>Pháp trị (danh mục)</th><th>Triệu chứng</th><th>Thành phần</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
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
    _btDraftPhapTriIds = item ? btPhapTriLinksToOrderedIds(item) : [];

    const rowsHtml = btRenderBaiThuocChiTietRowsHtml();
    showTayyModal('Bài thuốc', `
        <datalist id="bt-lieu-datalist">
            <option value="*"></option>
            <option value="#"></option>
        </datalist>

        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_bai_thuoc) : ''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item ? escHtml(item.nguon_goc) : ''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item ? escHtml(item.cach_dung) : ''}</textarea></label>

        <label class="tayy-form-label">Chứng trạng<br><textarea id="bt-inp-chungtrang" class="tayy-form-input" rows="3" placeholder="Biện chứng, pháp trị… (tự do)">${item ? escHtml(item.chung_trang || '') : ''}</textarea></label>

        <label class="tayy-form-label">
            Liên kết pháp trị (danh mục)
            <div style="position:relative; margin-top:6px;">
                <div id="bt-phaptri-chips" class="chips-container" onclick="document.getElementById('bt-inp-phaptri-search').focus()">
                    <input id="bt-inp-phaptri-search" type="text" class="chip-input"
                        placeholder="Gõ chứng trạng / id để thêm từ tab Pháp trị…"
                        oninput="btOnPhapTriLinkSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter'){event.preventDefault(); btTrySelectPhapTriFromSearch();}">
                </div>
                <div id="bt-phaptri-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
            <div style="font-size:0.72rem;color:#8B7355;margin-top:6px;line-height:1.35;">Khớp với cột chứng trạng trong danh mục Pháp trị; thứ tự chip = thứ tự lưu.</div>
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
        btRenderPhapTriLinkChips();
        btOnPhapTriLinkSearchInput('');
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
        chung_trang: (document.getElementById('bt-inp-chungtrang')?.value || '').trim(),
        trieu_chung: _btDraftTrieuChung.join(', '),
        phap_tri_ids: [...(_btDraftPhapTriIds || [])],
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
// LIÊN KẾT PHÁP TRỊ (danh mục) — chips
// ═══════════════════════════════════════════════════════════
function btGetPhapTriById(id) {
    return (_thuocData.phapTriList || []).find(p => p.id === id) || null;
}

function btRenderPhapTriLinkChips() {
    const container = document.getElementById('bt-phaptri-chips');
    const input = document.getElementById('bt-inp-phaptri-search');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    (_btDraftPhapTriIds || []).forEach(ptId => {
        const pt = btGetPhapTriById(ptId);
        const label = (pt?.chung_trang || '').trim() || ('#' + ptId);
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(label)} <span class="chip-remove" onclick="btRemovePhapTriLinkChip(${ptId}); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemovePhapTriLinkChip(ptId) {
    _btDraftPhapTriIds = (_btDraftPhapTriIds || []).filter(x => x !== ptId);
    btRenderPhapTriLinkChips();
    btOnPhapTriLinkSearchInput(document.getElementById('bt-inp-phaptri-search')?.value || '');
}

function btSelectPhapTriLink(ptId) {
    if (!Number.isFinite(ptId) || (_btDraftPhapTriIds || []).includes(ptId)) return;
    _btDraftPhapTriIds.push(ptId);
    const inp = document.getElementById('bt-inp-phaptri-search');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderPhapTriLinkChips();
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnPhapTriLinkSearchInput(val) {
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (!suggestEl) return;
    const q = (val || '').trim();
    if (!q) { suggestEl.style.display = 'none'; return; }

    const qLow = q.toLowerCase();
    const selected = new Set(_btDraftPhapTriIds || []);
    const all = _thuocData.phapTriList || [];

    const idNum = /^\d+$/.test(q) ? parseInt(q, 10) : NaN;
    const filtered = all.filter(p => {
        if (selected.has(p.id)) return false;
        if (Number.isFinite(idNum) && p.id === idNum) return true;
        const ct = (p.chung_trang || '').trim().toLowerCase();
        return ct && ct.includes(qLow);
    }).slice(0, 12);

    if (filtered.length === 0) {
        suggestEl.innerHTML = '<div style="padding:10px;color:#A09580;font-size:0.82rem;">Không có mục pháp trị phù hợp</div>';
        suggestEl.style.display = 'block';
        return;
    }

    suggestEl.innerHTML = filtered.map(p => {
        const lab = (p.chung_trang || '').trim() || ('#' + p.id);
        return `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectPhapTriLink(${p.id})">
                <span style="font-weight:600;">${escHtml(lab)}</span>
                <span style="font-size:0.72rem;color:#9CA3AF;margin-left:6px;">id ${p.id}</span>
            </div>`;
    }).join('');
    suggestEl.style.display = 'block';
}

function btTrySelectPhapTriFromSearch() {
    const inp = document.getElementById('bt-inp-phaptri-search');
    const q = (inp?.value || '').trim();
    if (!q) return;
    const idNum = /^\d+$/.test(q) ? parseInt(q, 10) : NaN;
    const all = _thuocData.phapTriList || [];
    let p = Number.isFinite(idNum) ? all.find(x => x.id === idNum) : null;
    if (!p) {
        const qLow = q.toLowerCase();
        const cand = all.filter(x => (x.chung_trang || '').trim().toLowerCase() === qLow);
        if (cand.length === 1) p = cand[0];
    }
    if (p) btSelectPhapTriLink(p.id);
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
};
let _ptKinhIds = [];
/** Bài thuốc tham chiếu trong form pháp trị — { id, ten_bai_thuoc }[] */
let _ptBaiThuocDraft = [];
/** Nhóm dược lý nhỏ trong form pháp trị — { id, ten_nhom_nho }[] (tối đa 2) */
let _ptNhomNhoDraft = [];
/** Triệu chứng pháp trị — { id, ten_trieu_chung }; id null = legacy chưa khớp danh mục */
let _ptDraftTrieuChung = [];

function ptTrieuChungDraftFromPhapTriItem(item) {
    if (!item) return [];
    const list = item.trieu_chung_list || item.trieuChungList;
    if (Array.isArray(list) && list.length) {
        return list
            .map((t) => ({
                id: t.id,
                ten_trieu_chung: String(t.ten_trieu_chung || '').trim(),
            }))
            .filter((x) => x.id != null && x.ten_trieu_chung);
    }
    const names = ptCsvToArr(item.trieu_chung_mo_ta);
    return names.map((n) => {
        const hit = (_thuocData.trieuChung || []).find(
            (tc) => String(tc.ten_trieu_chung || '').trim().toLowerCase() === n.toLowerCase(),
        );
        return hit
            ? { id: hit.id, ten_trieu_chung: String(hit.ten_trieu_chung || '').trim() }
            : { id: null, ten_trieu_chung: n };
    });
}

/** Text «Thế bệnh» hiển thị: ưu tiên tieuket/ten bệnh Đông y đã liên kết, sau đó chung_trang. */
function ptTheBenhPlainText(r) {
    if (!r) return '';
    const benh = r.benh_dong_y || r.benhDongY;
    const tk =
        benh && (benh.tieuket != null || benh.ten != null)
            ? String(benh.tieuket || benh.ten || '').trim()
            : '';
    const ck = String(r.chung_trang || r.chungTrang || '').trim();
    return tk || ck;
}

function ptTheBenhDisplayHtml(r) {
    const main = ptTheBenhPlainText(r);
    if (!main) return '<span style="color:#D1D5DB;">—</span>';
    const idBd = r.id_benh_dong_y ?? r.idBenhDongY ?? ((r.benh_dong_y || r.benhDongY) && (r.benh_dong_y || r.benhDongY).id);
    const hasBenh = idBd != null && idBd !== '' && Number.isFinite(Number(idBd));
    const tag = hasBenh
        ? `<span style="display:inline-block;margin-left:6px;padding:1px 6px;font-size:0.65rem;font-weight:700;color:#0f766e;background:#ccfbf1;border:1px solid #5eead4;border-radius:4px;white-space:nowrap;">benh_dong_y</span>`
        : '';
    return `<span style="font-weight:600;color:#5B3A1A;">${escHtml(main)}</span>${tag}`;
}

/** Cột «Triệu chứng điển hình»: từ quan hệ trieu_chung hoặc chuỗi mô tả. */
function ptTrieuChungDienHinhCell(r) {
    const list = r.trieu_chung_list || r.trieuChungList;
    if (Array.isArray(list) && list.length) {
        const chips = list
            .map((t) => String(t.ten_trieu_chung || '').trim())
            .filter(Boolean)
            .map((n) => `<span class="chip" style="cursor:default;font-size:0.68rem;">${escHtml(n)}</span>`)
            .join('');
        return chips
            ? `<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:260px;">${chips}</div>`
            : '<span style="color:#D1D5DB;">—</span>';
    }
    return ptChipsPreviewCsv(r.trieu_chung_mo_ta);
}

function ptTcmTextCell(val, maxLen) {
    const raw = val != null ? String(val) : '';
    if (!raw.trim()) return '<span style="color:#D1D5DB;">—</span>';
    return ptTextPreview(raw, maxLen || 36);
}

function ptBaiThuocListFromPhapTriRow(r) {
    if (!r) return [];
    const links = r.bai_thuoc_links || r.baiThuocLinks;
    if (Array.isArray(links) && links.length) {
        return links
            .slice()
            .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0))
            .map((l) => l.baiThuoc || l.bai_thuoc)
            .filter(Boolean)
            .map((bt) => ({ id: bt.id, ten_bai_thuoc: String(bt.ten_bai_thuoc || '').trim() }));
    }
    const single = r.bai_thuoc || r.baiThuoc;
    if (single && single.id != null) {
        return [{ id: single.id, ten_bai_thuoc: String(single.ten_bai_thuoc || '').trim() }];
    }
    return [];
}

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

function ptAttrEsc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/\r?\n/g, ' ');
}

/** Ô bảng: text rút gọn, hover xem đủ (title). */
function ptTextPreview(raw, maxLen) {
    const t = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    if (!t) return '<span style="color:#D1D5DB;font-size:0.78rem;">—</span>';
    const short = t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
    return (
        '<span style="font-size:0.78rem;line-height:1.35;display:inline-block;max-width:min(260px,28vw);" title="' +
        ptAttrEsc(t) +
        '">' +
        escHtml(short) +
        '</span>'
    );
}

function ptKinhMachListPreview(r) {
    const list = r.kinh_mach_list || r.kinhMachList || [];
    const parts = list.map(k => ptKinhMachShortLabel(k)).filter(Boolean);
    if (!parts.length) return '<span style="color:#D1D5DB;font-size:0.78rem;">—</span>';
    return ptTextPreview(parts.join(', '), 56);
}

function ptBenhDongYOptionsHtml(selectedId) {
    let html = '<option value="">— Không gắn bệnh Đông y —</option>';
    const models = (_thuocData.benhDongYModels || []).slice().sort((a, b) => String(a.ten || '').localeCompare(String(b.ten || ''), 'vi'));
    for (const m of models) {
        const id = m.modelId;
        const ten = String(m.ten || '').trim();
        if (!ten || id == null) continue;
        const sel = selectedId != null && String(selectedId) === String(id) ? ' selected' : '';
        html += '<option value="' + escHtml(String(id)) + '"' + sel + '>' + escHtml(ten) + '</option>';
    }
    return html;
}

function ptNhomNhoOptionsHtml(selectedId) {
    let html = '<option value="">— Nhóm dược lý —</option>';
    for (const lon of _thuocData.nhomDuocLy || []) {
        for (const nho of lon.nhomNho || []) {
            const id = nho.id;
            const lab = nho.ten_nhom_nho || '';
            const sel = String(selectedId) === String(id) ? ' selected' : '';
            html += `<option value="${id}"${sel}>${escHtml(lab)}</option>`;
        }
    }
    return html;
}

function ptResetChips() {
    _ptChips = { bat_phap: [], bat_cuong: [], luc_dam: [] };
    _ptKinhIds = [];
    _ptBaiThuocDraft = [];
    _ptNhomNhoDraft = [];
    _ptDraftTrieuChung = [];
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

// ─── Pháp trị: triệu chứng từ danh mục trieu_chung + soft create (giống form bài thuốc) ───
function ptRenderTrieuChungChipsPhapTri() {
    const container = document.getElementById('pt-chips-trieuchung');
    const input = document.getElementById('pt-inp-trieuchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach((c) => c.remove());
    (_ptDraftTrieuChung || []).forEach((row) => {
        const label = String(row.ten_trieu_chung || '').trim();
        if (!label) return;
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(label + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = (e) => {
            e.stopPropagation();
            ptRemoveTrieuChungChipPhapTri(row.id, label);
        };
        chip.appendChild(x);
        container.insertBefore(chip, input);
    });
}

function ptRemoveTrieuChungChipPhapTri(id, ten) {
    const t = String(ten || '').trim();
    if (id != null && Number.isFinite(Number(id))) {
        _ptDraftTrieuChung = (_ptDraftTrieuChung || []).filter((x) => x.id !== id);
    } else {
        _ptDraftTrieuChung = (_ptDraftTrieuChung || []).filter((x) => x.ten_trieu_chung !== t);
    }
    ptRenderTrieuChungChipsPhapTri();
}

function ptDraftHasTrieuChungRow(id, ten) {
    const low = String(ten || '').trim().toLowerCase();
    return (_ptDraftTrieuChung || []).some((x) => {
        if (id != null && Number.isFinite(Number(id)) && x.id === id) return true;
        return String(x.ten_trieu_chung || '').trim().toLowerCase() === low;
    });
}

function ptSelectTrieuChungPhapTriPick(id, name) {
    const ten = String(name || '').trim();
    if (!ten || ptDraftHasTrieuChungRow(id, ten)) return;
    _ptDraftTrieuChung.push({ id: id != null && Number.isFinite(Number(id)) ? Number(id) : null, ten_trieu_chung: ten });
    const inp = document.getElementById('pt-inp-trieuchung');
    const suggestEl = document.getElementById('pt-trieuchung-suggest');
    if (inp) {
        inp.value = '';
        inp.focus();
    }
    if (suggestEl) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
    }
    ptRenderTrieuChungChipsPhapTri();
}

function ptOnTrieuChungPhapTriInput() {
    const inp = document.getElementById('pt-inp-trieuchung');
    const suggestEl = document.getElementById('pt-trieuchung-suggest');
    if (!suggestEl || !inp) return;
    const val = inp.value || '';
    const query = val.trim().toLowerCase();
    if (!query) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
        return;
    }

    const allRows = _thuocData.trieuChung || [];
    const allNames = allRows.map((t) => String(t.ten_trieu_chung || '').trim()).filter(Boolean);
    const filtered = allRows
        .filter((t) => {
            const n = String(t.ten_trieu_chung || '').trim();
            return n.toLowerCase().includes(query) && !ptDraftHasTrieuChungRow(t.id, n);
        })
        .slice(0, 12);
    const hasExact = allNames.some((n) => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered
            .map(
                (t) =>
                    `<div class="tayy-suggest-item" style="padding:8px 10px;cursor:pointer;border-bottom:1px solid #F0E8D8;font-size:0.85rem;" 
                        onmousedown="event.preventDefault();ptSelectTrieuChungPhapTriPick(${t.id},${JSON.stringify(String(t.ten_trieu_chung || '').trim())})">${escHtml(String(t.ten_trieu_chung || '').trim())}</div>`,
            )
            .join('');
    } else {
        html += `<div style="padding:10px;color:#A09580;font-size:0.82rem;">Không tìm thấy triệu chứng có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        const shown = escHtml(val.trim());
        html += `<div style="padding:8px 10px;cursor:pointer;background:#FAF6EE;border-top:1px dashed #D4C5A0;margin-top:4px;font-size:0.82rem;" 
            onmousedown="event.preventDefault();ptSoftCreateTrieuChungPhapTriFromInput()">
            <strong style="color:#CA6222;">+</strong> Thêm triệu chứng «${shown}» vào danh mục
        </div>`;
    }
    suggestEl.innerHTML = html;
    suggestEl.style.display = 'block';
}

function ptOnTrieuChungPhapTriInputFocus() {
    ptOnTrieuChungPhapTriInput();
}

function ptOnTrieuChungPhapTriKeydown(ev) {
    if (ev.key !== 'Enter') return;
    const inp = document.getElementById('pt-inp-trieuchung');
    if (!inp) return;
    const raw = inp.value.trim();
    if (!raw) return;
    ev.preventDefault();
    const low = raw.toLowerCase();
    const fromCat = (_thuocData.trieuChung || []).find(
        (t) => String(t.ten_trieu_chung || '').trim().toLowerCase() === low,
    );
    if (fromCat) {
        ptSelectTrieuChungPhapTriPick(fromCat.id, String(fromCat.ten_trieu_chung).trim());
        return;
    }
    ptSoftCreateTrieuChungPhapTri(raw);
}

function ptSoftCreateTrieuChungPhapTriFromInput() {
    const inp = document.getElementById('pt-inp-trieuchung');
    const name = (inp?.value || '').trim();
    if (!name) return;
    return ptSoftCreateTrieuChungPhapTri(name);
}

async function ptSoftCreateTrieuChungPhapTri(name) {
    if (!name) return;
    const inp = document.getElementById('pt-inp-trieuchung');
    const suggestEl = document.getElementById('pt-trieuchung-suggest');
    if (inp) {
        inp.disabled = true;
        inp.value = 'Đang thêm...';
    }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateTrieuChung({ ten_trieu_chung: name });
    if (inp) {
        inp.disabled = false;
        inp.value = '';
        inp.focus();
    }
    if (!res.success) {
        alert('Lỗi khi thêm triệu chứng: ' + (res.error || ''));
        return;
    }
    _thuocData.trieuChung = _thuocData.trieuChung || [];
    _thuocData.trieuChung.push({ id: res.id, ten_trieu_chung: name, ...(res.data || {}) });
    ptSelectTrieuChungPhapTriPick(res.id, name);
}

function ptToggleKinhId(kid, on) {
    kid = Number(kid);
    if (!Number.isFinite(kid)) return;
    const i = _ptKinhIds.indexOf(kid);
    if (on && i < 0) _ptKinhIds.push(kid);
    if (!on && i >= 0) _ptKinhIds.splice(i, 1);
}

function ptKinhMachDisplayLabel(k) {
    if (!k) return '';
    const tat = String(k.ten_viet_tat || '').trim();
    const ten = String(k.ten_kinh_mach || '').trim();
    return tat ? tat + ' — ' + ten : ten;
}

/** Chỉ tên viết tắt (chip / cột bảng pháp trị); không có tắt thì dùng tên đầy đủ. */
function ptKinhMachShortLabel(k) {
    if (!k) return '';
    const tat = String(k.ten_viet_tat || '').trim();
    if (tat) return tat;
    return String(k.ten_kinh_mach || '').trim();
}

/** Gõ tên / tắt / nhãn đầy đủ → id kinh mạch (ưu tiên khớp chính xác). */
function ptResolveKinhMachIdFromQuery(raw) {
    const want = ptStrNorm(raw);
    if (!want) return null;
    const scored = [];
    for (const k of _thuocData.kinhMach || []) {
        const id = kmRowId(k);
        if (!Number.isFinite(id)) continue;
        const tat = ptStrNorm(k.ten_viet_tat || '');
        const ten = ptStrNorm(k.ten_kinh_mach || '');
        const lab = ptStrNorm(ptKinhMachDisplayLabel(k));
        let pri = 0;
        if (tat === want || ten === want || lab === want) pri = 100;
        else if (want.length >= 1 && (tat.startsWith(want) || ten.startsWith(want))) pri = 80;
        else if (want.length >= 2 && lab.startsWith(want)) pri = 75;
        else if (want.length >= 2 && (ten.includes(want) || lab.includes(want) || tat.includes(want))) pri = 50;
        if (pri > 0) scored.push({ id, pri, tenlen: ten.length });
    }
    if (!scored.length) return null;
    scored.sort((a, b) => b.pri - a.pri || a.tenlen - b.tenlen || a.id - b.id);
    return scored[0].id;
}

function ptOnKinhChipKeydown(ev) {
    if (ev.key !== 'Enter') return;
    const inp = document.getElementById('pt-inp-kinh');
    if (!inp) return;
    const q = inp.value.trim();
    if (!q) return;
    ev.preventDefault();
    const kid = ptResolveKinhMachIdFromQuery(q);
    if (kid == null) {
        alert('Không tìm thấy kinh mạch khớp «' + q + '». Gõ rõ hơn hoặc chọn gợi ý trong danh sách.');
        return;
    }
    if (_ptKinhIds.includes(kid)) {
        inp.value = '';
        return;
    }
    ptToggleKinhId(kid, true);
    inp.value = '';
    ptRenderKinhChipGroup();
}

function ptFillKinhMachDatalist() {
    const dl = document.getElementById('pt-datalist-kinh');
    if (!dl) return;
    dl.innerHTML = '';
    for (const k of _thuocData.kinhMach || []) {
        const o = document.createElement('option');
        o.value = ptKinhMachDisplayLabel(k);
        dl.appendChild(o);
    }
}

function ptRenderKinhChipGroup() {
    const container = document.getElementById('pt-chips-kinh');
    if (!container) return;
    const inp = document.getElementById('pt-inp-kinh');
    container.querySelectorAll('.chip').forEach(c => c.remove());
    const byId = new Map();
    for (const k of _thuocData.kinhMach || []) {
        const id = kmRowId(k);
        if (Number.isFinite(id)) byId.set(id, k);
    }
    for (const kid of _ptKinhIds) {
        const k = byId.get(kid);
        if (!k) continue;
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(ptKinhMachShortLabel(k) + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = e => {
            e.stopPropagation();
            ptToggleKinhId(kid, false);
            ptRenderKinhChipGroup();
        };
        chip.appendChild(x);
        if (inp) container.insertBefore(chip, inp);
        else container.appendChild(chip);
    }
}

function ptRenderBaiThuocChipsForPhapTri() {
    const container = document.getElementById('pt-chips-baithuoc');
    const input = document.getElementById('pt-inp-baithuoc');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach((c) => c.remove());
    (_ptBaiThuocDraft || []).forEach((bt) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(String(bt.ten_bai_thuoc || '') + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = (e) => {
            e.stopPropagation();
            _ptBaiThuocDraft = (_ptBaiThuocDraft || []).filter((b) => b.id !== bt.id);
            ptRenderBaiThuocChipsForPhapTri();
        };
        chip.appendChild(x);
        container.insertBefore(chip, input);
    });
}

function ptOnPhapTriBaiThuocInputFocus() {
    ptOnPhapTriBaiThuocInput();
}

function ptOnPhapTriBaiThuocInput() {
    const inp = document.getElementById('pt-inp-baithuoc');
    const box = document.getElementById('pt-baithuoc-suggest');
    if (!inp || !box) return;
    const q = inp.value.trim().toLowerCase();
    if (!q) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    const all = _thuocData.baiThuoc || [];
    const chosen = new Set((_ptBaiThuocDraft || []).map((b) => b.id));
    const matches = all
        .filter((b) => !chosen.has(b.id))
        .filter((b) => String(b.ten_bai_thuoc || '')
            .toLowerCase()
            .includes(q))
        .slice(0, 12);
    if (!matches.length) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    box.innerHTML = matches
        .map(
            (bt) =>
                `<div class="tayy-suggest-item" style="padding:8px 10px;cursor:pointer;border-bottom:1px solid #E2D4B8;font-size:0.85rem;" 
                    onmousedown="event.preventDefault();ptSelectBaiThuocForPhapTriChip(${bt.id})">${escHtml(bt.ten_bai_thuoc || '')}</div>`,
        )
        .join('');
    box.style.display = 'block';
}

function ptSelectBaiThuocForPhapTriChip(id) {
    const bt = (_thuocData.baiThuoc || []).find((b) => b.id === id);
    if (!bt) return;
    if ((_ptBaiThuocDraft || []).some((b) => b.id === bt.id)) return;
    _ptBaiThuocDraft.push({ id: bt.id, ten_bai_thuoc: String(bt.ten_bai_thuoc || '').trim() });
    const inp = document.getElementById('pt-inp-baithuoc');
    const box = document.getElementById('pt-baithuoc-suggest');
    if (inp) inp.value = '';
    if (box) {
        box.style.display = 'none';
        box.innerHTML = '';
    }
    ptRenderBaiThuocChipsForPhapTri();
}

function ptOnPhapTriBaiThuocKeydown(ev) {
    if (ev.key !== 'Enter') return;
    const inp = document.getElementById('pt-inp-baithuoc');
    if (!inp) return;
    const name = inp.value.trim();
    if (!name) return;
    ev.preventDefault();
    const low = name.toLowerCase();
    const bt = (_thuocData.baiThuoc || []).find(
        (b) => String(b.ten_bai_thuoc || '').trim().toLowerCase() === low,
    );
    if (!bt) {
        alert('Không tìm thấy bài thuốc trùng khớp «' + name + '». Chọn trong gợi ý hoặc kiểm tra tên.');
        return;
    }
    ptSelectBaiThuocForPhapTriChip(bt.id);
}

function ptAllNhomNhoRows() {
    const out = [];
    for (const lon of _thuocData.nhomDuocLy || []) {
        for (const nho of lon.nhomNho || []) {
            if (!Number.isFinite(Number(nho?.id))) continue;
            out.push({ id: Number(nho.id), ten_nhom_nho: String(nho.ten_nhom_nho || '').trim() });
        }
    }
    return out;
}

function ptRenderNhomNhoChipsForPhapTri() {
    const container = document.getElementById('pt-chips-nhomnho');
    const input = document.getElementById('pt-inp-nhomnho');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach((c) => c.remove());
    (_ptNhomNhoDraft || []).forEach((nho) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(String(nho.ten_nhom_nho || '') + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = (e) => {
            e.stopPropagation();
            _ptNhomNhoDraft = (_ptNhomNhoDraft || []).filter((x) => x.id !== nho.id);
            ptRenderNhomNhoChipsForPhapTri();
        };
        chip.appendChild(x);
        container.insertBefore(chip, input);
    });
}

function ptOnPhapTriNhomNhoInputFocus() {
    ptOnPhapTriNhomNhoInput();
}

function ptOnPhapTriNhomNhoInput() {
    const inp = document.getElementById('pt-inp-nhomnho');
    const box = document.getElementById('pt-nhomnho-suggest');
    if (!inp || !box) return;
    const q = inp.value.trim().toLowerCase();
    if (!q) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    const all = ptAllNhomNhoRows();
    const chosen = new Set((_ptNhomNhoDraft || []).map((x) => x.id));
    const matches = all
        .filter((n) => !chosen.has(n.id))
        .filter((n) => String(n.ten_nhom_nho || '').toLowerCase().includes(q))
        .slice(0, 12);
    if (!matches.length) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
    box.innerHTML = matches
        .map(
            (n) =>
                `<div class="tayy-suggest-item" style="padding:8px 10px;cursor:pointer;border-bottom:1px solid #E2D4B8;font-size:0.85rem;" onmousedown="event.preventDefault();ptSelectNhomNhoForPhapTriChip(${n.id})">${escHtml(n.ten_nhom_nho || '')}</div>`,
        )
        .join('');
    box.style.display = 'block';
}

function ptSelectNhomNhoForPhapTriChip(id) {
    const nho = ptAllNhomNhoRows().find((x) => x.id === Number(id));
    if (!nho) return;
    if ((_ptNhomNhoDraft || []).some((x) => x.id === nho.id)) return;
    _ptNhomNhoDraft.push({ id: nho.id, ten_nhom_nho: String(nho.ten_nhom_nho || '').trim() });
    const inp = document.getElementById('pt-inp-nhomnho');
    const box = document.getElementById('pt-nhomnho-suggest');
    if (inp) inp.value = '';
    if (box) {
        box.style.display = 'none';
        box.innerHTML = '';
    }
    ptRenderNhomNhoChipsForPhapTri();
}

function ptOnPhapTriNhomNhoKeydown(ev) {
    if (ev.key !== 'Enter') return;
    const inp = document.getElementById('pt-inp-nhomnho');
    if (!inp) return;
    const name = inp.value.trim();
    if (!name) return;
    ev.preventDefault();
    const low = name.toLowerCase();
    const hit = ptAllNhomNhoRows().find((x) => String(x.ten_nhom_nho || '').toLowerCase() === low);
    if (!hit) {
        alert('Không tìm thấy nhóm dược lý trùng khớp «' + name + '». Chọn trong gợi ý.');
        return;
    }
    ptSelectNhomNhoForPhapTriChip(hit.id);
}

async function renderPhapTriTab(el) {
    const rows = (_thuocData.phapTriList || []).map((r) => {
        const id = r.id;
        const idBd = r.id_benh_dong_y ?? r.idBenhDongY ?? (r.benh_dong_y && r.benh_dong_y.id) ?? (r.benhDongY && r.benhDongY.id);
        const hasDoKinhLac = idBd != null && idBd !== '' && Number.isFinite(Number(idBd));
        const tagDoKinhLac = hasDoKinhLac
            ? `<span style="display:inline-block;margin-left:6px;padding:1px 7px;font-size:0.68rem;font-weight:700;color:#166534;background:#DCFCE7;border:1px solid #86EFAC;border-radius:4px;vertical-align:middle;white-space:nowrap;">Đo KL</span>`
            : '';
        const hasKinh = ((r.kinh_mach_list || r.kinhMachList || []).length > 0);
        const tangPhuCell =
            !hasKinh && !hasDoKinhLac
                ? '<span style="color:#D1D5DB;">—</span>'
                : `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;max-width:120px;">${ptKinhMachListPreview(r)}${tagDoKinhLac}</div>`;
        const btList = ptBaiThuocListFromPhapTriRow(r);
        const bt =
            btList.length > 0
                ? `<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:200px;">${btList
                      .map(
                          (b) =>
                              `<span class="chip" style="cursor:default;font-size:0.68rem;">${escHtml(b.ten_bai_thuoc)}</span>`,
                      )
                      .join('')}</div>`
                : '<span style="color:#D1D5DB;">—</span>';
        const ad = r.am_duong ?? r.amDuong;
        const tt = r.ton_thuong ?? r.tonThuong;
        const tn = r.tac_nhan ?? r.tacNhan;
        const bc = r.ban_chat ?? r.banChat;
        const vt = r.vi_tri_tien_trinh ?? r.viTriTienTrinh;
        const mc = r.mach_chan ?? r.machChan;
        const cl = r.chat_luoi ?? r.chatLuoi;
        const nn = r.nguyen_nhan ?? r.nguyenNhan;
        return `<tr>
            <td style="text-align:center;font-size:0.72rem;color:#78716c;white-space:nowrap;">${id}</td>
            <td style="min-width:72px;white-space:normal;">${tangPhuCell}</td>
            <td style="min-width:72px;white-space:normal;">${ptTcmTextCell(ad, 28)}</td>
            <td style="min-width:72px;white-space:normal;">${ptTcmTextCell(tt, 28)}</td>
            <td style="min-width:72px;white-space:normal;">${ptTcmTextCell(tn, 28)}</td>
            <td style="min-width:80px;white-space:normal;">${ptTcmTextCell(bc, 32)}</td>
            <td style="min-width:88px;white-space:normal;">${ptTcmTextCell(vt, 36)}</td>
            <td style="min-width:120px;white-space:normal;">${ptTheBenhDisplayHtml(r)}</td>
            <td style="min-width:100px;white-space:normal;">${ptTextPreview(r.nguyen_tac, 40)}</td>
            <td style="min-width:80px;white-space:normal;">${ptTcmTextCell(mc, 32)}</td>
            <td style="min-width:72px;white-space:normal;">${ptTcmTextCell(cl, 28)}</td>
            <td style="vertical-align:top;min-width:120px;">${ptTrieuChungDienHinhCell(r)}</td>
            <td style="min-width:88px;white-space:normal;">${ptTcmTextCell(nn, 36)}</td>
            <td style="font-size:0.78rem;min-width:100px;white-space:normal;">${bt}</td>
            <td style="text-align:center;width:130px;white-space:nowrap;">
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
                <button type="button" class="btn btn-outline" title="Cột «Thế bệnh» / «Chứng trạng»: khớp tieuket (benh_dong_y) → id_benh_dong_y. «Triệu chứng điển hình» / «Triệu chứng»: khớp bảng trieu_chung. «Bài thuốc tiêu biểu» / «Bài thuốc»: khớp baithuoc. Cột id: cập nhật đúng bản ghi; không id: upsert theo tieuket như cũ."
                    onclick="document.getElementById('pt-import-xlsx').click()">📤 Cập nhật từ Excel</button>
                <input type="file" id="pt-import-xlsx" accept=".xlsx,.xls,.csv" style="display:none;" onchange="importPhapTriXlsx(event)">
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span style="font-size:0.82rem;color:#A09580;">
                    Pháp trị (luận trị): <strong>${(_thuocData.phapTriList || []).length}</strong> bản ghi — kéo ngang nếu nhiều cột
                </span>
                <button class="btn btn-primary" onclick="openPhapTriRowForm()">+ Thêm pháp trị</button>
            </div>
        </div>
        <p style="margin:0 0 10px;font-size:0.8rem;color:#78716c;line-height:1.45;max-width:920px;">
            Bảng theo mẫu biện chứng: <strong>Thế bệnh</strong> liên kết <code>tieuket</code> (bảng <code>benh_dong_y</code>);
            <strong>Triệu chứng điển hình</strong> lấy từ danh mục <code>trieu_chung</code>;
            <strong>Bài thuốc tiêu biểu</strong> lấy từ <code>bai_thuoc</code>. Cột <strong>Tạng phủ</strong> = kinh mạch đã chọn.
        </p>
        <div class="data-table-container" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
            <table style="min-width:1480px;">
                <thead><tr>
                    <th style="width:44px;text-align:center;">id</th>
                    <th style="min-width:80px;white-space:normal;">Tạng phủ</th>
                    <th style="min-width:72px;white-space:normal;">Âm Dương</th>
                    <th style="min-width:72px;white-space:normal;">Tổn thương</th>
                    <th style="min-width:72px;white-space:normal;">Tác nhân</th>
                    <th style="min-width:80px;white-space:normal;">Bản chất</th>
                    <th style="min-width:88px;white-space:normal;">Vị trí / Tiến trình</th>
                    <th style="min-width:120px;white-space:normal;">Thế bệnh<br><span style="font-weight:400;font-size:0.68rem;color:#A8A29E;">(tieuket)</span></th>
                    <th style="min-width:100px;white-space:normal;">Pháp trị</th>
                    <th style="min-width:80px;white-space:normal;">Mạch chẩn</th>
                    <th style="min-width:72px;white-space:normal;">Chất lưỡi</th>
                    <th style="min-width:120px;white-space:normal;">Triệu chứng điển hình<br><span style="font-weight:400;font-size:0.68rem;color:#A8A29E;">(trieu_chung)</span></th>
                    <th style="min-width:88px;white-space:normal;">Nguyên nhân</th>
                    <th style="min-width:100px;white-space:normal;">Bài thuốc tiêu biểu<br><span style="font-weight:400;font-size:0.68rem;color:#A8A29E;">(bai_thuoc)</span></th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="15" style="text-align:center;padding:20px;color:#9CA3AF;">Chưa có bản ghi</td></tr>'}</tbody>
            </table>
        </div>`;
}

async function openPhapTriRowForm(id) {
    const item = id ? (_thuocData.phapTriList || []).find(x => x.id == id) : null;
    ptResetChips();
    if (item) {
        _ptChips.bat_phap = ptCsvToArr(item.bat_phap);
        _ptChips.bat_cuong = ptCsvToArr(item.bat_cuong);
        _ptChips.luc_dam = ptCsvToArr(item.luc_dam);
        _ptDraftTrieuChung = ptTrieuChungDraftFromPhapTriItem(item);
        _ptKinhIds = (item.kinh_mach_list || item.kinhMachList || []).map(k => kmRowId(k)).filter(n => Number.isFinite(n));
    }
    const chungInit = item ? String(item.chung_trang || item.chungTrang || '').trim() : '';
    let benhSelId = '';
    if (item) {
        const b = item.benh_dong_y || item.benhDongY;
        if (b && b.id != null) benhSelId = b.id;
        else if (item.id_benh_dong_y != null) benhSelId = item.id_benh_dong_y;
    }
    _ptBaiThuocDraft = item ? ptBaiThuocListFromPhapTriRow(item) : [];
    const nnList = item
        ? (item.nhom_duoc_ly_nho_list || item.nhomDuocLyNhoList || [])
        : [];
    const nnSingle = item ? (item.nhom_duoc_ly_nho || item.nhomDuocLyNho) : null;
    const nnIds = (Array.isArray(nnList) && nnList.length
        ? nnList.map((x) => x?.id).filter((x) => Number.isFinite(Number(x)))
        : (nnSingle ? [nnSingle.id] : []));
    const byIdNho = new Map(ptAllNhomNhoRows().map((x) => [x.id, x]));
    _ptNhomNhoDraft = nnIds
        .map((idVal) => byIdNho.get(Number(idVal)))
        .filter(Boolean)
        .map((x) => ({ id: x.id, ten_nhom_nho: x.ten_nhom_nho }));

    const ptTcm = (kSnake, kCamel) =>
        item ? escHtml(String(item[kSnake] != null ? item[kSnake] : item[kCamel] ?? '')) : '';
    const ptBatDetailsOpen =
        item &&
        (ptCsvToArr(item.bat_phap).length ||
            ptCsvToArr(item.bat_cuong).length ||
            ptCsvToArr(item.luc_dam).length ||
            String(item.y_nghia_co_che || '').trim())
            ? ' open'
            : '';

    showTayyModal(item ? 'Sửa pháp trị (luận trị)' : 'Thêm pháp trị (luận trị)', `
<div class="pt-form">
    <section class="pt-form-section" aria-labelledby="pt-sec-1">
        <h3 class="pt-form-section-title" id="pt-sec-1"><span class="pt-form-section-num">1</span>Chứng trạng (text &amp; Excel)</h3>
        <label class="tayy-form-label">Chứng trạng / ghi chú (chung_trang)
            <input id="pt-inp-chung-trang" type="text" class="tayy-form-input" value="${escHtml(chungInit)}"
                placeholder="Khớp cột «Chứng trạng» khi nhập Excel; có thể trùng với Thế bệnh…">
        </label>
        <span class="pt-field-hint">Cột bảng «Thế bệnh» lấy từ <strong>tieuket</strong> khi đã chọn bệnh Đông y bên dưới.</span>
    </section>

    <section class="pt-form-section" aria-labelledby="pt-sec-link">
        <h3 class="pt-form-section-title" id="pt-sec-link"><span class="pt-form-section-num">1b</span>Thế bệnh — liên kết <code>benh_dong_y.tieuket</code></h3>
        ${item ? `<p style="margin:0 0 10px;font-size:0.88rem;color:#57534e;">Mã bản ghi: <strong style="color:#44403c;">#${item.id}</strong></p>` : ''}
        <label class="tayy-form-label">Bệnh Đông y (tiểu kết — <code>tieuket</code>)
            <select id="pt-sel-benhdongy" class="tayy-form-input">${ptBenhDongYOptionsHtml(benhSelId)}</select>
        </label>
        <span class="pt-field-hint">Mỗi bệnh tối đa một pháp trị. Excel: cột «Thế bệnh» / «Chứng trạng» khớp <code>tieuket</code> → gán <code>id_benh_dong_y</code>.</span>
    </section>

    <section class="pt-form-section" aria-labelledby="pt-sec-tcm">
        <h3 class="pt-form-section-title" id="pt-sec-tcm"><span class="pt-form-section-num">1c</span>Bảng luận trị — các cột mô tả</h3>
        <div class="pt-form-grid-2">
            <label class="tayy-form-label">Âm Dương<input id="pt-inp-am-duong" type="text" class="tayy-form-input" value="${ptTcm('am_duong', 'amDuong')}" placeholder="VD: Dương, Âm…"></label>
            <label class="tayy-form-label">Tổn thương<input id="pt-inp-ton-thuong" type="text" class="tayy-form-input" value="${ptTcm('ton_thuong', 'tonThuong')}" placeholder="VD: Khí, Huyết…"></label>
            <label class="tayy-form-label">Tác nhân<input id="pt-inp-tac-nhan" type="text" class="tayy-form-input" value="${ptTcm('tac_nhan', 'tacNhan')}" placeholder="VD: Phong, Hàn…"></label>
            <label class="tayy-form-label">Bản chất<input id="pt-inp-ban-chat" type="text" class="tayy-form-input" value="${ptTcm('ban_chat', 'banChat')}" placeholder="VD: Khí hư…"></label>
            <label class="tayy-form-label">Vị trí / Tiến trình<input id="pt-inp-vi-tri" type="text" class="tayy-form-input" value="${ptTcm('vi_tri_tien_trinh', 'viTriTienTrinh')}" placeholder="VD: Lý (Thiếu Âm)…"></label>
            <label class="tayy-form-label">Mạch chẩn<input id="pt-inp-mach-chan" type="text" class="tayy-form-input" value="${ptTcm('mach_chan', 'machChan')}" placeholder="VD: Tế, Nhược…"></label>
            <label class="tayy-form-label">Chất lưỡi<input id="pt-inp-chat-luoi" type="text" class="tayy-form-input" value="${ptTcm('chat_luoi', 'chatLuoi')}" placeholder="VD: Nhạt…"></label>
        </div>
    </section>

    <details class="pt-form-section"${ptBatDetailsOpen} aria-labelledby="pt-sec-2" style="border:1px solid #e7e5e4;border-radius:10px;padding:12px 14px;margin-bottom:14px;background:#fafaf9;">
        <summary class="pt-form-section-title" id="pt-sec-2" style="cursor:pointer;list-style-position:outside;"><span class="pt-form-section-num">2</span>Bát cương · Bát pháp · Lục dâm <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(mở rộng)</span></summary>
        <div class="pt-form-grid-3" style="margin-top:12px;">
            <div>
                <label class="tayy-form-label">Bát cương</label>
                <div id="pt-chips-batcuong" class="chips-container" onclick="document.getElementById('pt-inp-batcuong').focus()">
                    <input id="pt-inp-batcuong" type="text" class="chip-input" placeholder="Biểu, lý, hàn, nhiệt…"
                        onkeydown="ptOnChipKeydown('bat_cuong', event)">
                </div>
                <span class="pt-field-hint">Enter để thêm từng mục.</span>
            </div>
            <div>
                <label class="tayy-form-label">Bát pháp</label>
                <div id="pt-chips-batphap" class="chips-container" onclick="document.getElementById('pt-inp-batphap').focus()">
                    <input id="pt-inp-batphap" type="text" class="chip-input" placeholder="Hãn, ôn, thanh, bổ…"
                        onkeydown="ptOnChipKeydown('bat_phap', event)">
                </div>
                <span class="pt-field-hint">Enter để thêm từng mục.</span>
            </div>
            <div>
                <label class="tayy-form-label">Lục dâm</label>
                <div id="pt-chips-lucdam" class="chips-container" onclick="document.getElementById('pt-inp-lucdam').focus()">
                    <input id="pt-inp-lucdam" type="text" class="chip-input" placeholder="Phong, hàn, thấp, táo…"
                        onkeydown="ptOnChipKeydown('luc_dam', event)">
                </div>
                <span class="pt-field-hint">Enter để thêm từng mục.</span>
            </div>
        </div>
    </details>

    <section class="pt-form-section" aria-labelledby="pt-sec-3">
        <h3 class="pt-form-section-title" id="pt-sec-3"><span class="pt-form-section-num">3</span>Pháp trị &amp; nguyên nhân</h3>
        <div class="pt-form-stack">
            <label class="tayy-form-label">Pháp trị <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(cột bảng — lưu nguyen_tac)</span>
                <textarea id="pt-inp-nguyen_tac" class="tayy-form-input" rows="2" placeholder="VD: Bổ ích tâm khí, Ôn thông tâm dương…">${item ? escHtml(item.nguyen_tac || '') : ''}</textarea>
            </label>
            <label class="tayy-form-label">Nguyên nhân
                <textarea id="pt-inp-nguyen-nhan" class="tayy-form-input" rows="2" placeholder="VD: Lao thương, Dương hư…">${ptTcm('nguyen_nhan', 'nguyenNhan')}</textarea>
            </label>
            <label class="tayy-form-label">Ý nghĩa &amp; cơ chế <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(bổ sung)</span>
                <textarea id="pt-inp-y_nghia" class="tayy-form-input" rows="3" placeholder="Giải thích cơ chế, liên hệ bệnh cơ…">${item ? escHtml(item.y_nghia_co_che || '') : ''}</textarea>
            </label>
        </div>
    </section>

    <section class="pt-form-section" aria-labelledby="pt-sec-4">
        <h3 class="pt-form-section-title" id="pt-sec-4"><span class="pt-form-section-num">4</span>Biểu hiện lâm sàng &amp; quy kinh / tạng phủ</h3>
        <div class="pt-form-grid-2">
            <div>
                <label class="tayy-form-label">Tạng phủ — kinh mạch liên quan</label>
                <div id="pt-chips-kinh" class="chips-container" onclick="document.getElementById('pt-inp-kinh').focus()">
                    <input id="pt-inp-kinh" type="text" class="chip-input" list="pt-datalist-kinh"
                        placeholder="Gõ tắt hoặc tên kinh, Enter để thêm…"
                        onkeydown="ptOnKinhChipKeydown(event)" autocomplete="off">
                </div>
                <span class="pt-field-hint">Chọn gợi ý hoặc Enter; mỗi kinh một chip.</span>
            </div>
            <div>
                <label class="tayy-form-label">Triệu chứng điển hình <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(bảng <code>trieu_chung</code>)</span></label>
                <div style="position:relative;margin-top:6px;">
                    <div id="pt-chips-trieuchung" class="chips-container" onclick="document.getElementById('pt-inp-trieuchung').focus()">
                        <input id="pt-inp-trieuchung" type="text" class="chip-input" placeholder="Gõ để tìm, Enter hoặc chọn gợi ý…"
                            autocomplete="off"
                            onfocus="ptOnTrieuChungPhapTriInputFocus()"
                            oninput="ptOnTrieuChungPhapTriInput()"
                            onkeydown="ptOnTrieuChungPhapTriKeydown(event)">
                    </div>
                    <div id="pt-trieuchung-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div>
                <span class="pt-field-hint">Chọn từ danh mục hoặc «+ Thêm» để tạo mới (soft create); nhiều chip.</span>
            </div>
        </div>
        <datalist id="pt-datalist-kinh"></datalist>
    </section>

    <section class="pt-form-section" aria-labelledby="pt-sec-5">
        <h3 class="pt-form-section-title" id="pt-sec-5"><span class="pt-form-section-num">5</span>Phương thuốc &amp; phân loại dược lý</h3>
        <div class="pt-form-grid-2">
            <div>
                <label class="tayy-form-label">Bài thuốc tiêu biểu <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(bảng <code>bai_thuoc</code>)</span></label>
                <div style="position:relative;margin-top:6px;">
                    <div id="pt-chips-baithuoc" class="chips-container" onclick="document.getElementById('pt-inp-baithuoc').focus()">
                        <input id="pt-inp-baithuoc" type="text" class="chip-input"
                            placeholder="Gõ tên bài thuốc, Enter hoặc chọn gợi ý…"
                            autocomplete="off"
                            onfocus="ptOnPhapTriBaiThuocInputFocus()"
                            oninput="ptOnPhapTriBaiThuocInput()"
                            onkeydown="ptOnPhapTriBaiThuocKeydown(event)">
                    </div>
                    <div id="pt-baithuoc-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div>
                <span class="pt-field-hint">Có thể gắn nhiều bài; tên phải trùng danh mục bài thuốc.</span>
            </div>
            <div>
                <label class="tayy-form-label">Nhóm dược lý (nhóm nhỏ)</label>
                <div style="position:relative;margin-top:6px;">
                    <div id="pt-chips-nhomnho" class="chips-container" onclick="document.getElementById('pt-inp-nhomnho').focus()">
                        <input id="pt-inp-nhomnho" type="text" class="chip-input"
                            placeholder="Gõ tên nhóm nhỏ, Enter hoặc chọn gợi ý…"
                            autocomplete="off"
                            onfocus="ptOnPhapTriNhomNhoInputFocus()"
                            oninput="ptOnPhapTriNhomNhoInput()"
                            onkeydown="ptOnPhapTriNhomNhoKeydown(event)">
                    </div>
                    <div id="pt-nhomnho-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div>
                <span class="pt-field-hint">Chỉ hiển thị tên nhóm nhỏ.</span>
            </div>
        </div>
    </section>

    <div class="tayy-form-actions pt-form-actions-wrap">
        <button type="button" class="btn" onclick="closeTayyModal()">Hủy</button>
        <button type="button" class="btn btn-primary" onclick="savePhapTriRow(${id || 0})">Lưu bản ghi</button>
    </div>
</div>
    `, 'phap-tri');
    setTimeout(() => {
        ptRenderChipGroups();
        ptFillKinhMachDatalist();
        ptRenderKinhChipGroup();
        ptRenderBaiThuocChipsForPhapTri();
        ptRenderNhomNhoChipsForPhapTri();
        ptRenderTrieuChungChipsPhapTri();
    }, 0);
}

function ptReadChungTrangFromModal() {
    const t = (document.getElementById('pt-inp-chung-trang')?.value || '').trim();
    return t || null;
}

async function savePhapTriRow(id) {
    function numOrNull(v) {
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    const payload = {
        chung_trang: ptReadChungTrangFromModal(),
        nguyen_tac: (document.getElementById('pt-inp-nguyen_tac')?.value || '').trim() || null,
        y_nghia_co_che: (document.getElementById('pt-inp-y_nghia')?.value || '').trim() || null,
        am_duong: (document.getElementById('pt-inp-am-duong')?.value || '').trim() || null,
        ton_thuong: (document.getElementById('pt-inp-ton-thuong')?.value || '').trim() || null,
        tac_nhan: (document.getElementById('pt-inp-tac-nhan')?.value || '').trim() || null,
        ban_chat: (document.getElementById('pt-inp-ban-chat')?.value || '').trim() || null,
        vi_tri_tien_trinh: (document.getElementById('pt-inp-vi-tri')?.value || '').trim() || null,
        mach_chan: (document.getElementById('pt-inp-mach-chan')?.value || '').trim() || null,
        chat_luoi: (document.getElementById('pt-inp-chat-luoi')?.value || '').trim() || null,
        nguyen_nhan: (document.getElementById('pt-inp-nguyen-nhan')?.value || '').trim() || null,
        bat_phap: ptArrToCsv(_ptChips.bat_phap) || null,
        bat_cuong: ptArrToCsv(_ptChips.bat_cuong) || null,
        luc_dam: ptArrToCsv(_ptChips.luc_dam) || null,
        ...(() => {
            const tc = _ptDraftTrieuChung || [];
            const allId =
                tc.length > 0 &&
                tc.every((t) => t.id != null && Number.isFinite(Number(t.id)));
            if (!tc.length) {
                return { id_trieu_chung_list: [] };
            }
            if (allId) {
                return { id_trieu_chung_list: tc.map((t) => Number(t.id)) };
            }
            return { trieu_chung_mo_ta: ptArrToCsv(tc.map((t) => t.ten_trieu_chung)) || null };
        })(),
        id_bai_thuoc_list: (_ptBaiThuocDraft || []).map((b) => b.id),
        ...(() => {
            const ids = (_ptNhomNhoDraft || [])
                .map((x) => Number(x.id))
                .filter((x) => Number.isFinite(x));
            const unique = Array.from(new Set(ids));
            return {
                id_nhom_duoc_ly_nho_list: unique,
                id_nhom_duoc_ly_nho: unique.length ? unique[0] : null,
            };
        })(),
        id_benh_dong_y: (() => {
            const el = document.getElementById('pt-sel-benhdongy');
            if (!el || el.value === '') return null;
            return numOrNull(el.value);
        })(),
        id_kinh_mach_list: _ptKinhIds.filter(n => Number.isFinite(n)),
    };
    const res = id ? await apiUpdatePhapTri(id, payload) : await apiCreatePhapTri(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    rerenderPhapTriHost();
}

async function deletePhapTriRow(id) {
    if (!confirm('Xóa bản ghi pháp trị này?')) return;
    const res = await apiDeletePhapTri(id);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    await loadAllThuocData();
    rerenderPhapTriHost();
}

function ptNhomDuocExportLabel(nho) {
    if (!nho) return '';
    return String(nho.ten_nhom_nho || '').trim();
}

function ptKinhIdsFromTangPhuCell(raw, kinhList) {
    const norm = ptExcelCellToCsvList(raw);
    const parts = String(norm || '')
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

/** Chuẩn hóa so sánh chuỗi (NFC, gộp khoảng trắng, không phân biệt hoa thường) */
function ptStrNorm(s) {
    return String(s == null ? '' : s).normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Làm sạch text chứng trạng lấy từ Excel (ký tự ẩn, NBSP, xuống dòng trong ô). */
function ptCleanChungTrangCell(s) {
    return String(s == null ? '' : s)
        .replace(/\u200b|\u200c|\u200d|\ufeff/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .trim()
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Khóa so khớp «gần giống»: không dấu, không khoảng, bỏ dấu câu thường gặp. */
function ptChungTrangFoldKey(raw) {
    const n = ptStrNorm(ptCleanChungTrangCell(raw));
    if (!n) return '';
    return n
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .replace(/[,;.:·…]/g, '');
}

/**
 * Điểm khớp Excel ↔ bản ghi đã lưu (càng cao càng chắc). 0 = không coi là cùng một chứng trạng.
 * Không cần cột id: dùng lớp khớp nhiều mức (đúng chữ → bỏ dấu → chuỗi con ≥ 4 ký tự sau khi fold).
 */
function ptChungTrangMatchScore(excelRaw, storedRaw) {
    const a = ptStrNorm(ptCleanChungTrangCell(excelRaw));
    const b = ptStrNorm(ptCleanChungTrangCell(storedRaw));
    if (!a || !b) return 0;
    if (ptNormTieuKetCompatible(a, b)) return 100000 + Math.min(a.length, b.length);
    const af = ptChungTrangFoldKey(excelRaw);
    const bf = ptChungTrangFoldKey(storedRaw);
    if (!af || !bf) return 0;
    if (af === bf) return 50000 + Math.min(af.length, bf.length);
    const short = af.length <= bf.length ? af : bf;
    const long = af.length > bf.length ? af : bf;
    if (short.length >= 4 && long.includes(short)) return 10000 + short.length;
    return 0;
}

/** Tiêu đề cột Excel: bỏ dấu để khớp «Chứng Trạng» / «Chứng trạng» */
function ptExcelHeaderNorm(s) {
    return String(s || '')
        .replace(/\u00a0/g, ' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function ptSanitizeExcelImportRow(row) {
    if (!row || typeof row !== 'object') return row;
    const out = {};
    for (const [k, v] of Object.entries(row)) {
        const k2 = String(k).replace(/\u00a0/g, ' ').replace(/\u2007/g, ' ').trim();
        out[k2] = v;
    }
    return out;
}

/**
 * Ô Excel nhiều mục: dấu «+» (ASCII hoặc fullwidth ＋) tương đương dấu phẩy.
 * Dùng cho Bát pháp / Bát cương / Lục dâm / Tạng phủ / Triệu chứng khi nhập pháp trị.
 */
function ptExcelCellToCsvList(raw) {
    if (raw == null) return '';
    let s = String(raw).replace(/\r\n?/g, ' ').replace(/\n/g, ' ').trim();
    if (!s) return '';
    s = s.replace(/\s*[\u002B\uFF0B]\s*/g, ',');
    s = s.replace(/\s*,\s*/g, ', ');
    s = s.replace(/(?:,\s*){2,}/g, ', ');
    return s.replace(/^,\s*|,\s*$/g, '').trim();
}

/**
 * Đọc ô «Chứng trạng» form mẫu (kể cả tiêu đề chỉ có NBSP / hơi khác chữ).
 * Không lấy nhầm cột «Triệu chứng».
 */
function ptPickChungTrangFromRow(row) {
    if (!row) return '';
    const keysTheBenh = ['Thế bệnh', 'Thể bệnh', 'The benh', 'The Benh', 'The benh (tieuket)'];
    const theBenhDirect = ndlPickNhomCol(row, keysTheBenh);
    if (theBenhDirect != null && String(theBenhDirect).trim() !== '') {
        return ptCleanChungTrangCell(String(theBenhDirect));
    }
    const keysExplicit = [
        'Chứng trạng', 'Chứng trạng (tiểu kết)', 'Chứng Trạng', 'CHỨNG TRẠNG',
        'Tiểu kết', 'Tieu ket', 'Chung trang', 'tieuket',
    ];
    const direct = ndlPickNhomCol(row, keysExplicit);
    if (direct != null && String(direct).trim() !== '') return ptCleanChungTrangCell(String(direct));
    for (const [k, val] of Object.entries(row)) {
        const hn = ptExcelHeaderNorm(k);
        if (!hn) continue;
        if (hn.includes('trieu') && hn.includes('chung')) continue;
        if (hn.includes('the benh') || hn === 'the benh' || hn === 'thebenh') continue;
        const isChungTrang = hn === 'chung trang'
            || hn.startsWith('chung trang (')
            || hn === 'tieu ket'
            || hn === 'tieuket';
        if (!isChungTrang) continue;
        const t = ptCleanChungTrangCell(String(val == null ? '' : val));
        if (t) return t;
    }
    return '';
}

/**
 * Phần dùng để so khớp 100% với tiểu kết (tieuket): chuẩn hóa + lowercase,
 * chỉ lấy đoạn trước ngoặc ( hoặc （ đầu tiên — bỏ mô tả trong ngoặc.
 * Ví dụ tieuket «A (ghi chú)» và ô Excel «A» → cùng base «a».
 */
function ptTieuKetCompareBase(raw) {
    const n = ptStrNorm(ptCleanChungTrangCell(raw));
    if (!n) return '';
    const cut = n.split(/[（(]/)[0];
    return cut.replace(/\s+/g, ' ').trim();
}

/** Danh sách id mô hình bệnh (modelId) có tieuket trùng base với ô Chứng trạng Excel. */
function ptBenhIdsMatchingTieuKetBase(excelRaw) {
    const want = ptTieuKetCompareBase(excelRaw);
    if (!want) return [];
    const ids = [];
    for (const m of _thuocData.benhDongYModels || []) {
        const tk = String(m.ten != null ? m.ten : '').trim();
        if (!tk) continue;
        if (ptTieuKetCompareBase(tk) === want) ids.push(m.modelId);
    }
    ids.sort((a, b) => Number(a) - Number(b));
    return ids;
}

/** Khớp text chứng trạng Excel ↔ bản ghi đã lưu (đúng chữ, tiền tố có ranh giới khoảng, hoặc cùng chữ sau khi bỏ mọi khoảng trắng). */
function ptNormTieuKetCompatible(snNorm, tkNorm) {
    if (!snNorm || !tkNorm) return false;
    if (snNorm === tkNorm) return true;
    if (snNorm.startsWith(tkNorm + ' ')) return true;
    if (tkNorm.startsWith(snNorm + ' ')) return true;
    const snC = snNorm.replace(/\s+/g, '');
    const tkC = tkNorm.replace(/\s+/g, '');
    if (snC.length && snC === tkC) return true;
    return false;
}

/** Id benh_dong_y khi Chứng trạng Excel trùng base tiểu kết với đúng một tieuket trong danh mục. */
function ptBenhDongYIdFromChungTrangExcel(chungTrangRaw, warnAcc) {
    const raw = ptCleanChungTrangCell(String(chungTrangRaw || ''));
    if (!raw) return null;
    const ids = ptBenhIdsMatchingTieuKetBase(chungTrangRaw);
    if (!ids.length) return null;
    if (ids.length > 1 && warnAcc) {
        warnAcc.push(
            'Nhiều bệnh cùng tiểu kết «' +
                ptTieuKetCompareBase(chungTrangRaw) +
                '» (sau ngoặc) — id: ' +
                ids.join(', ') +
                ' — không gán id_benh_dong_y',
        );
        return null;
    }
    return ids[0];
}

/** Trả về id phap_tri đang giữ id_benh_dong_y (ràng buộc UNIQUE), trừ bản ghi excludePhapTriId. */
function ptPhapTriBenhLinkedByOther(idBenhDongY, excludePhapTriId) {
    if (idBenhDongY == null) return null;
    const want = Number(idBenhDongY);
    for (const p of _thuocData.phapTriList || []) {
        if (excludePhapTriId != null && Number(p.id) === Number(excludePhapTriId)) continue;
        const bid = p.id_benh_dong_y ?? p.idBenhDongY ?? (p.benh_dong_y && p.benh_dong_y.id);
        if (bid != null && Number(bid) === want) return p.id;
    }
    return null;
}

function ptResolveBaiThuocIdFromExcel(name) {
    const s = String(name || '').trim();
    if (!s) return null;
    const bt = (_thuocData.baiThuoc || []).find(b => String(b.ten_bai_thuoc || '').trim().toLowerCase() === s.toLowerCase());
    return bt ? bt.id : null;
}

/** Một ô Excel có thể chứa nhiều tên bài, phân tách bằng dấu phẩy / tương tự. */
function ptResolveBaiThuocIdsFromExcelCell(cell) {
    const parts = String(cell || '')
        .split(/[,，、;；]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const ids = [];
    for (const p of parts) {
        const id = ptResolveBaiThuocIdFromExcel(p);
        if (id != null) ids.push(id);
    }
    return [...new Set(ids)];
}

/** Chuẩn hóa từng mục triệu chứng theo tên trong danh mục `trieu_chung` (không phân biệt hoa thường). */
function ptNormalizeTrieuChungMoTaForCatalog(csvLike) {
    if (!csvLike || !String(csvLike).trim()) return '';
    const parts = ptCsvToArr(String(csvLike));
    if (!parts.length) return '';
    const tc = _thuocData.trieuChung || [];
    const normalized = parts.map((p) => {
        const low = p.toLowerCase();
        const hit = tc.find((t) => String(t.ten_trieu_chung || '').trim().toLowerCase() === low);
        return hit ? String(hit.ten_trieu_chung).trim() : p;
    });
    return ptArrToCsv(normalized);
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
    const idStr = ndlPickNhomCol(row, ['id', 'ID', 'Id']);
    if (String(idStr ?? '').trim() !== '') return false;
    if (ptPickChungTrangFromRow(row)) return false;
    const probes = [
        ['Thế bệnh', 'Thể bệnh', 'The benh'],
        ['Pháp trị', 'Phap tri', 'Pháp Trị'],
        ['Nguyên nhân', 'Nguyen nhan', 'Nguyên Nhân'],
        ['Âm Dương', 'Am Duong'],
        ['Nguyên tắc', 'Nguyen tac', 'Nguyên Tắc'],
        ['Ý nghĩa & cơ chế', 'Y nghia & co che', 'Y nghia', 'Co che'],
        ['Bát pháp', 'Bat phap', 'Bát Pháp'],
        ['Bát cương', 'Bat cuong', 'Bát Cương'],
        ['Lục dâm', 'Luc dam', 'Lục Dâm'],
        ['Tạng phủ', 'Tang phu', 'Tạng Phủ', 'Kinh mạch', 'Kinh mach'],
        ['Triệu chứng điển hình', 'Trieu chung dien hinh'],
        ['Triệu chứng', 'Trieu chung', 'Triệu Chứng'],
        ['Bài thuốc tiêu biểu', 'Bai thuoc tieu bieu'],
        ['Bài thuốc', 'Bai thuoc', 'Ten bai thuoc', 'Bài Thuốc'],
        ['Nhóm dược', 'Nhom duoc', 'Nhom duoc ly', 'Nhóm Dược', 'Nhóm dược lý'],
    ];
    for (const keys of probes) {
        if (ndlPickNhomCol(row, keys)) return false;
    }
    return true;
}

function ptBuildPayloadFromExcelRow(row, warnAcc) {
    const chungTrang = ptPickChungTrangFromRow(row) || '';
    const nguyen_tac = ndlPickNhomCol(row, [
        'Pháp trị', 'Phap tri', 'Pháp Trị',
        'Nguyên tắc', 'Nguyen tac', 'Nguyên Tắc',
    ]);
    const nguyen_nhan = ndlPickNhomCol(row, ['Nguyên nhân', 'Nguyen nhan', 'Nguyên Nhân']);
    const am_duong = ndlPickNhomCol(row, ['Âm Dương', 'Am Duong', 'Âm dương']);
    const ton_thuong = ndlPickNhomCol(row, ['Tổn thương', 'Ton thuong', 'Tổn Thương']);
    const tac_nhan = ndlPickNhomCol(row, ['Tác nhân', 'Tac nhan', 'Tác Nhân']);
    const ban_chat = ndlPickNhomCol(row, ['Bản chất', 'Ban chat', 'Bản Chất']);
    const vi_tri_tien_trinh = ndlPickNhomCol(row, [
        'Vị trí / Tiến trình', 'Vi tri / Tien trinh', 'Vị trí/Tiến trình', 'Vi tri/Tien trinh', 'Vi tri', 'Vị trí',
    ]);
    const mach_chan = ndlPickNhomCol(row, ['Mạch chẩn', 'Mach chan', 'Mạch Chẩn']);
    const chat_luoi = ndlPickNhomCol(row, ['Chất lưỡi', 'Chat luoi', 'Chất Lưỡi']);
    const y_nghia = ndlPickNhomCol(row, [
        'Ý nghĩa & cơ chế', 'Ý Nghĩa & Cơ Chế', 'Y nghia & co che', 'Y nghia', 'Co che', 'Ý nghĩa', 'Y nghia',
    ]);
    const bat_phapRaw = ndlPickNhomCol(row, ['Bát pháp', 'Bat phap', 'Bát Pháp']);
    const bat_cuongRaw = ndlPickNhomCol(row, ['Bát cương', 'Bat cuong', 'Bát Cương']);
    const luc_damRaw = ndlPickNhomCol(row, ['Lục dâm', 'Luc dam', 'Lục Dâm']);
    const tang_phuRaw = ndlPickNhomCol(row, ['Tạng phủ', 'Tang phu', 'Tạng Phủ', 'Kinh mạch', 'Kinh mach']);
    const trieu_chungRaw = ndlPickNhomCol(row, [
        'Triệu chứng điển hình', 'Trieu chung dien hinh', 'Triệu Chứng Điển Hình',
        'Triệu chứng', 'Trieu chung', 'Triệu Chứng',
    ]);
    const bat_phap = bat_phapRaw ? ptExcelCellToCsvList(bat_phapRaw) : '';
    const bat_cuong = bat_cuongRaw ? ptExcelCellToCsvList(bat_cuongRaw) : '';
    const luc_dam = luc_damRaw ? ptExcelCellToCsvList(luc_damRaw) : '';
    const tang_phu = tang_phuRaw ? ptExcelCellToCsvList(tang_phuRaw) : '';
    const trieu_chung = trieu_chungRaw
        ? ptNormalizeTrieuChungMoTaForCatalog(ptExcelCellToCsvList(trieu_chungRaw))
        : '';
    const bai_thuoc = ndlPickNhomCol(row, [
        'Bài thuốc tiêu biểu', 'Bai thuoc tieu bieu', 'Bài Thuốc Tiêu Biểu',
        'Bài thuốc', 'Bai thuoc', 'Ten bai thuoc', 'Tên bài thuốc', 'Bài Thuốc',
    ]);
    const nhom_duoc = ndlPickNhomCol(row, ['Nhóm dược', 'Nhom duoc', 'Nhóm dược lý', 'Nhom duoc ly', 'Ten nhom nho', 'Nhóm Dược']);

    let idBtList = [];
    if (bai_thuoc !== undefined && bai_thuoc !== null) {
        const trimmedBt = String(bai_thuoc).trim();
        if (trimmedBt) {
            idBtList = ptResolveBaiThuocIdsFromExcelCell(bai_thuoc);
            if (!idBtList.length) warnAcc.push('Không khớp bài thuốc: «' + bai_thuoc + '»');
        }
    }

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

    const chungClean = ptCleanChungTrangCell(chungTrang);
    const idBenhDy = chungClean ? ptBenhDongYIdFromChungTrangExcel(chungTrang, warnAcc) : null;

    const out = {
        chung_trang: chungTrang ? chungTrang : null,
        nguyen_tac: nguyen_tac ? String(nguyen_tac).trim() : null,
        nguyen_nhan: nguyen_nhan ? String(nguyen_nhan).trim() : null,
        am_duong: am_duong ? String(am_duong).trim() : null,
        ton_thuong: ton_thuong ? String(ton_thuong).trim() : null,
        tac_nhan: tac_nhan ? String(tac_nhan).trim() : null,
        ban_chat: ban_chat ? String(ban_chat).trim() : null,
        vi_tri_tien_trinh: vi_tri_tien_trinh ? String(vi_tri_tien_trinh).trim() : null,
        mach_chan: mach_chan ? String(mach_chan).trim() : null,
        chat_luoi: chat_luoi ? String(chat_luoi).trim() : null,
        y_nghia_co_che: y_nghia ? y_nghia : null,
        bat_phap: bat_phap ? bat_phap : null,
        bat_cuong: bat_cuong ? bat_cuong : null,
        luc_dam: luc_dam ? luc_dam : null,
        trieu_chung_mo_ta: trieu_chung ? trieu_chung : null,
        id_nhom_duoc_ly_nho: idNho,
        id_kinh_mach_list: idKinhList,
    };
    /** Có Chứng trạng → luôn gán FK bệnh: khớp tieuket hoặc null (không cảnh báo khi không tìm thấy). */
    if (chungClean) {
        out.id_benh_dong_y = idBenhDy != null ? idBenhDy : null;
    }
    if (bai_thuoc !== undefined && bai_thuoc !== null && String(bai_thuoc).trim()) {
        out.id_bai_thuoc_list = idBtList;
    }
    return out;
}

/**
 * PUT pháp trị: backend chỉ đổi các key có trong JSON; null xóa FK/texto.
 * Import Excel: có Chứng trạng thì gửi id_benh_dong_y (số hoặc null) để đồng bộ tieuket — null vẫn gửi.
 * Ô Chứng trạng trống → payload không có id_benh_dong_y → không đổi liên kết bệnh cũ.
 */
function ptPayloadOmitEmptyForPhapTriUpdate(payload) {
    const body = { ...payload };
    const dropNullFk = k => {
        if (body[k] == null) delete body[k];
    };
    dropNullFk('id_bai_thuoc');
    dropNullFk('id_nhom_duoc_ly_nho');
    if (!Array.isArray(body.id_bai_thuoc_list)) {
        delete body.id_bai_thuoc_list;
    }
    if (!Array.isArray(body.id_trieu_chung_list)) {
        delete body.id_trieu_chung_list;
    }
    const dropEmptyText = k => {
        const v = body[k];
        if (v == null || v === '') delete body[k];
    };
    dropEmptyText('chung_trang');
    dropEmptyText('nguyen_tac');
    dropEmptyText('y_nghia_co_che');
    dropEmptyText('bat_phap');
    dropEmptyText('bat_cuong');
    dropEmptyText('luc_dam');
    dropEmptyText('am_duong');
    dropEmptyText('ton_thuong');
    dropEmptyText('tac_nhan');
    dropEmptyText('ban_chat');
    dropEmptyText('vi_tri_tien_trinh');
    dropEmptyText('mach_chan');
    dropEmptyText('chat_luoi');
    dropEmptyText('nguyen_nhan');
    dropEmptyText('trieu_chung_mo_ta');
    if (Array.isArray(body.id_kinh_mach_list) && body.id_kinh_mach_list.length === 0) {
        delete body.id_kinh_mach_list;
    }
    /* id_trieu_chung_list: [] vẫn gửi để xóa hết triệu chứng quan hệ */
    return body;
}

function ptResolveUpsertPhapTriTarget(row, payload, existingIds) {
    const idStr = ndlPickNhomCol(row, ['id', 'ID', 'Id']);
    const idNum = parseInt(String(idStr ?? '').trim().replace(/^[=']+|'+$/g, ''), 10);
    if (Number.isFinite(idNum) && existingIds.has(idNum)) {
        return { targetId: idNum, via: 'id', extraWarn: null };
    }
    const excelChung = payload.chung_trang || '';
    if (!ptCleanChungTrangCell(excelChung)) {
        return { targetId: null, via: 'create', extraWarn: null };
    }
    const wantBase = ptTieuKetCompareBase(excelChung);
    if (!wantBase) {
        return { targetId: null, via: 'create', extraWarn: null };
    }
    const matchedBenhIds = ptBenhIdsMatchingTieuKetBase(excelChung);
    if (!matchedBenhIds.length) {
        return { targetId: null, via: 'create', extraWarn: null };
    }
    const ptRows = (_thuocData.phapTriList || []).filter(p => {
        const rid = p.id_benh_dong_y ?? p.idBenhDongY ?? (p.benh_dong_y && p.benh_dong_y.id);
        if (rid == null) return false;
        return matchedBenhIds.some(mid => Number(mid) === Number(rid));
    });
    if (matchedBenhIds.length === 1) {
        if (ptRows.length === 1) {
            return { targetId: ptRows[0].id, via: 'tieuket_exact', extraWarn: null };
        }
        if (ptRows.length === 0) {
            return { targetId: null, via: 'create', extraWarn: null };
        }
        return {
            targetId: null,
            via: 'create',
            extraWarn:
                'Nhiều dòng pháp trị cùng id_benh_dong_y = ' +
                matchedBenhIds[0] +
                ' (bất thường) — không tự chọn; dùng cột id.',
        };
    }
    if (ptRows.length === 1) {
        return {
            targetId: ptRows[0].id,
            via: 'tieuket_exact',
            extraWarn:
                'Nhiều bệnh cùng tiểu kết «' +
                wantBase +
                '» nhưng chỉ một pháp trị liên kết — cập nhật id ' +
                ptRows[0].id,
        };
    }
    return {
        targetId: null,
        via: 'create',
        extraWarn:
            'Nhiều bệnh cùng tiểu kết «' +
            wantBase +
            '» — dùng cột id trong Excel hoặc phân biệt tieuket trong CSDL.',
    };
}

function ptTrieuChungExportCsv(r) {
    const list = r.trieu_chung_list || r.trieuChungList;
    if (Array.isArray(list) && list.length) {
        return list
            .map((t) => String(t.ten_trieu_chung || '').trim())
            .filter(Boolean)
            .join(', ');
    }
    return r.trieu_chung_mo_ta || '';
}

function exportPhapTriXlsx() {
    if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
    const list = _thuocData.phapTriList || [];
    const data = list.map((r) => {
        const benh = r.benh_dong_y || r.benhDongY;
        const tieuket = benh && benh.tieuket != null ? String(benh.tieuket).trim() : '';
        const ad = r.am_duong ?? r.amDuong ?? '';
        const tt = r.ton_thuong ?? r.tonThuong ?? '';
        const tn = r.tac_nhan ?? r.tacNhan ?? '';
        const bc = r.ban_chat ?? r.banChat ?? '';
        const vt = r.vi_tri_tien_trinh ?? r.viTriTienTrinh ?? '';
        const mc = r.mach_chan ?? r.machChan ?? '';
        const cl = r.chat_luoi ?? r.chatLuoi ?? '';
        const nn = r.nguyen_nhan ?? r.nguyenNhan ?? '';
        return {
            id: r.id,
            'Tạng phủ': (r.kinh_mach_list || r.kinhMachList || []).map((k) => ptKinhMachShortLabel(k)).filter(Boolean).join(', '),
            'Âm Dương': ad,
            'Tổn thương': tt,
            'Tác nhân': tn,
            'Bản chất': bc,
            'Vị trí / Tiến trình': vt,
            'Thế bệnh': tieuket || String(r.chung_trang || r.chungTrang || '').trim(),
            'Chứng trạng (chung_trang)': r.chung_trang || r.chungTrang || '',
            'Pháp trị': r.nguyen_tac || '',
            'Mạch chẩn': mc,
            'Chất lưỡi': cl,
            'Triệu chứng điển hình': ptTrieuChungExportCsv(r),
            'Nguyên nhân': nn,
            'Bài thuốc tiêu biểu': ptBaiThuocListFromPhapTriRow(r)
                .map((b) => b.ten_bai_thuoc)
                .filter(Boolean)
                .join(', '),
            'Bát pháp': r.bat_phap || '',
            'Bát cương': r.bat_cuong || '',
            'Lục dâm': r.luc_dam || '',
            'Ý nghĩa & cơ chế': r.y_nghia_co_che || '',
            'Nhóm dược': (() => {
                const nlist = r.nhom_duoc_ly_nho_list || r.nhomDuocLyNhoList || [];
                if (Array.isArray(nlist) && nlist.length) {
                    return nlist.map((x) => ptNhomDuocExportLabel(x)).filter(Boolean).join(', ');
                }
                return ptNhomDuocExportLabel(r.nhom_duoc_ly_nho || r.nhomDuocLyNho);
            })(),
        };
    });
    const emptyRow = {
        id: '',
        'Tạng phủ': '',
        'Âm Dương': '',
        'Tổn thương': '',
        'Tác nhân': '',
        'Bản chất': '',
        'Vị trí / Tiến trình': '',
        'Thế bệnh': '',
        'Chứng trạng (chung_trang)': '',
        'Pháp trị': '',
        'Mạch chẩn': '',
        'Chất lưỡi': '',
        'Triệu chứng điển hình': '',
        'Nguyên nhân': '',
        'Bài thuốc tiêu biểu': '',
        'Bát pháp': '',
        'Bát cương': '',
        'Lục dâm': '',
        'Ý nghĩa & cơ chế': '',
        'Nhóm dược': '',
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.length ? data : [emptyRow]), 'PhapTri');
    XLSX.writeFile(wb, 'Phap_Tri_Luan_Tri.xlsx');
}

/** Popup kết quả nhập Excel pháp trị: từng dòng lỗi / cảnh báo, đóng bằng nút hoặc click nền. */
function ptShowPhapTriImportToast({ created, updated, errors, warns }) {
    const prev = document.getElementById('pt-phap-tri-import-toast');
    if (prev) prev.remove();

    const errList = Array.isArray(errors) ? errors : [];
    const warnList = Array.isArray(warns) ? warns : [];
    const hasIssues = errList.length > 0 || warnList.length > 0;

    let autoCloseTimer = null;
    let root;
    const closeToast = () => {
        if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
        document.removeEventListener('keydown', onEsc);
        if (root && root.parentNode) root.remove();
    };
    const onEsc = (e) => {
        if (e.key === 'Escape') closeToast();
    };
    document.addEventListener('keydown', onEsc);

    root = document.createElement('div');
    root.id = 'pt-phap-tri-import-toast';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Kết quả nhập Excel pháp trị');
    root.style.cssText =
        'position:fixed;inset:0;z-index:100050;padding:20px;box-sizing:border-box;' +
        'display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;' +
        'font-family:system-ui,Segoe UI,sans-serif;font-size:14px;';

    const backdrop = document.createElement('div');
    backdrop.style.cssText =
        'position:absolute;inset:0;background:rgba(15,23,42,0.28);cursor:pointer;';
    backdrop.addEventListener('click', () => closeToast());

    const card = document.createElement('div');
    card.style.cssText =
        'position:relative;z-index:1;' +
        'width:100%;max-width:500px;max-height:min(78vh,680px);' +
        'display:flex;flex-direction:column;' +
        'background:#fffef8;color:#1c1917;border-radius:14px;' +
        'box-shadow:0 22px 55px rgba(0,0,0,0.22);border:1px solid #e7e5e4;overflow:hidden;';
    card.addEventListener('click', (e) => e.stopPropagation());

    const head = document.createElement('div');
    head.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:14px 16px;border-bottom:1px solid #e7e5e4;' +
        'background:linear-gradient(180deg,#fffbeb,#fffef8);flex-shrink:0;';
    const hTitle = document.createElement('strong');
    hTitle.textContent = 'Nhập Excel — Pháp trị';
    hTitle.style.fontSize = '15px';
    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.setAttribute('aria-label', 'Đóng');
    btnClose.textContent = '✕';
    btnClose.style.cssText =
        'border:none;background:transparent;font-size:18px;cursor:pointer;line-height:1;' +
        'padding:4px 10px;color:#57534e;border-radius:8px;';
    btnClose.addEventListener('click', () => closeToast());
    head.appendChild(hTitle);
    head.appendChild(btnClose);

    const body = document.createElement('div');
    body.style.cssText = 'padding:14px 16px;overflow-y:auto;flex:1;min-height:0;';

    const sum = document.createElement('p');
    sum.style.cssText = 'margin:0 0 12px;line-height:1.45;';
    sum.textContent = 'Hoàn tất. Tạo mới: ' + created + ', cập nhật: ' + updated + '.';
    body.appendChild(sum);

    function addSection(title, lines, borderColor, bgColor) {
        if (!lines.length) return;
        const sec = document.createElement('div');
        sec.style.cssText =
            'margin-top:12px;padding:12px 14px;border-radius:10px;' +
            'border-left:4px solid ' + borderColor + ';background:' + bgColor + ';';
        const t = document.createElement('div');
        t.style.cssText = 'font-weight:600;margin-bottom:8px;font-size:13px;';
        t.textContent = title + ' (' + lines.length + ')';
        sec.appendChild(t);
        const ul = document.createElement('ul');
        ul.style.cssText = 'margin:0;padding-left:1.1rem;line-height:1.5;font-size:13px;';
        for (let i = 0; i < lines.length; i++) {
            const li = document.createElement('li');
            li.style.marginBottom = '6px';
            li.textContent = lines[i];
            ul.appendChild(li);
        }
        sec.appendChild(ul);
        body.appendChild(sec);
    }

    addSection('Lỗi', errList, '#dc2626', '#fef2f2');
    addSection('Cảnh báo', warnList, '#d97706', '#fffbeb');

    if (!hasIssues) {
        const ok = document.createElement('p');
        ok.style.cssText = 'margin:0;color:#15803d;font-size:13px;';
        ok.textContent = 'Không có lỗi hay cảnh báo.';
        body.appendChild(ok);
    }

    const foot = document.createElement('div');
    foot.style.cssText =
        'padding:10px 16px 14px;border-top:1px solid #e7e5e4;flex-shrink:0;text-align:right;';
    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'btn btn-primary';
    btnOk.textContent = hasIssues ? 'Đã xem' : 'Đóng';
    btnOk.addEventListener('click', () => closeToast());
    foot.appendChild(btnOk);

    card.appendChild(head);
    card.appendChild(body);
    card.appendChild(foot);
    root.appendChild(backdrop);
    root.appendChild(card);
    document.body.appendChild(root);

    if (!hasIssues) {
        autoCloseTimer = window.setTimeout(() => {
            if (root.parentNode) closeToast();
        }, 5000);
    }
}

/**
 * Thay alert / confirm trong luồng nhập Excel pháp trị (cùng phong cách popup).
 * @param {{ type?: 'alert'|'confirm', title?: string, message: string, variant?: 'info'|'warn'|'error' }} opts
 * @returns {Promise<boolean|undefined>} confirm → true/false; alert → undefined
 */
function ptPhapTriShowDialog(opts) {
    const type = opts.type || 'alert';
    const title =
        opts.title ||
        (type === 'confirm' ? 'Xác nhận nhập Excel' : 'Pháp trị — Nhập Excel');
    const message = opts.message || '';
    const variant = opts.variant || 'info';
    const border = { info: '#57534e', warn: '#d97706', error: '#dc2626' }[variant] || '#57534e';

    return new Promise((resolve) => {
        const id = 'pt-phap-tri-dialog';
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        let root;
        const done = (value) => {
            document.removeEventListener('keydown', onKey);
            if (root && root.parentNode) root.remove();
            resolve(value);
        };
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (type === 'confirm') done(false);
            else done(undefined);
        };
        document.addEventListener('keydown', onKey);

        root = document.createElement('div');
        root.id = id;
        root.setAttribute('role', type === 'confirm' ? 'dialog' : 'alertdialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', title);
        root.style.cssText =
            'position:fixed;inset:0;z-index:100060;display:flex;flex-direction:column;' +
            'justify-content:flex-end;align-items:flex-end;padding:20px;box-sizing:border-box;' +
            'font-family:system-ui,Segoe UI,sans-serif;font-size:14px;';

        const backdrop = document.createElement('div');
        backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(15,23,42,0.32);cursor:pointer;';
        backdrop.addEventListener('click', () => {
            if (type === 'confirm') done(false);
            else done(undefined);
        });

        const card = document.createElement('div');
        card.style.cssText =
            'position:relative;z-index:1;width:100%;max-width:440px;border-radius:14px;overflow:hidden;' +
            'box-shadow:0 22px 55px rgba(0,0,0,0.22);border:1px solid #e7e5e4;background:#fffef8;' +
            'display:flex;flex-direction:column;';
        card.addEventListener('click', (ev) => ev.stopPropagation());

        const head = document.createElement('div');
        head.style.cssText =
            'padding:12px 16px;border-bottom:1px solid #e7e5e4;border-left:4px solid ' +
            border +
            ';font-weight:600;background:linear-gradient(180deg,#fffbeb,#fffef8);';
        head.textContent = title;

        const body = document.createElement('div');
        body.style.cssText = 'padding:16px;max-height:min(55vh,420px);overflow-y:auto;line-height:1.5;';
        const p = document.createElement('p');
        p.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-word;color:#292524;font-size:14px;';
        p.textContent = message;
        body.appendChild(p);

        const foot = document.createElement('div');
        foot.style.cssText =
            'padding:12px 16px 14px;border-top:1px solid #e7e5e4;display:flex;gap:8px;' +
            'justify-content:flex-end;flex-wrap:wrap;flex-shrink:0;';

        function addBtn(text, primary, onClick) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = text;
            b.className = primary ? 'btn btn-primary' : 'btn btn-outline';
            b.addEventListener('click', onClick);
            foot.appendChild(b);
        }

        if (type === 'confirm') {
            addBtn('Hủy', false, () => done(false));
            addBtn('Tiếp tục', true, () => done(true));
        } else {
            addBtn('Đóng', true, () => done(undefined));
        }

        card.appendChild(head);
        card.appendChild(body);
        card.appendChild(foot);
        root.appendChild(backdrop);
        root.appendChild(card);
        document.body.appendChild(root);
    });
}

function importPhapTriXlsx(e) {
    if (typeof XLSX === 'undefined') {
        void ptPhapTriShowDialog({
            type: 'alert',
            variant: 'error',
            message: 'Chưa tải xong thư viện SheetJS (XLSX). Tải lại trang hoặc kiểm tra mạng.',
        });
        return;
    }
    const file = e.target.files?.[0];
    const inputEl = e.target;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const buf = new Uint8Array(evt.target.result);
            const wb = XLSX.read(buf, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).map(ptSanitizeExcelImportRow);
            if (!rawRows.length) {
                await ptPhapTriShowDialog({
                    type: 'alert',
                    variant: 'warn',
                    message: 'File Excel không có dữ liệu.',
                });
                return;
            }
            const toProcess = rawRows.filter(r => r && typeof r === 'object' && !ptPhapTriImportRowSkippable(r));
            if (!toProcess.length) {
                await ptPhapTriShowDialog({
                    type: 'alert',
                    variant: 'warn',
                    message: 'Không có dòng dữ liệu hợp lệ (bỏ qua dòng trống).',
                });
                return;
            }
            const confirmMsg =
                'Tìm thấy ' +
                toProcess.length +
                ' dòng. Ghi vào hệ thống?\n\n' +
                '• Cột «id» (nếu có): cập nhật đúng bản ghi.\n' +
                '• Không có id: tìm bản ghi pháp trị theo tiểu kết — so khớp 100%% phần trước ngoặc () với tieuket mô hình bệnh; cập nhật đúng dòng có id_benh_dong_y tương ứng; không khớp bệnh nào thì tạo mới.\n' +
                '• «Thế bệnh» / «Chứng trạng» / «Tiểu kết»: gán id_benh_dong_y khi trùng tieuket; không khớp hoặc trùng nhiều bệnh không rõ → null. Mỗi bệnh tối đa một pháp trị.\n' +
                '• «Triệu chứng điển hình» / «Triệu chứng»: khớp tên trong bảng trieu_chung. «Bài thuốc tiêu biểu» / «Bài thuốc»: khớp bảng bai_thuoc.';
            const confirmed = await ptPhapTriShowDialog({ type: 'confirm', variant: 'info', message: confirmMsg });
            if (!confirmed) return;

            ndlNhomImportSetLoading(true, 'Đang đồng bộ dữ liệu pháp trị từ máy chủ…');
            await loadAllThuocData();

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
                if (payload.id_benh_dong_y != null) {
                    const occ = ptPhapTriBenhLinkedByOther(payload.id_benh_dong_y, targetId);
                    if (occ != null) {
                        rowWarn.push('Bệnh Đông y này đã liên kết pháp trị #' + occ + ' — bỏ qua id_benh_dong_y');
                        delete payload.id_benh_dong_y;
                    }
                }
                if (rowWarn.length) {
                    allWarn.push('Dòng ~' + idx + ': ' + rowWarn.join('; '));
                }
                if (extraWarn) {
                    allWarn.push('Dòng ~' + idx + ': ' + extraWarn);
                }
                try {
                    if (targetId != null) {
                        const updateBody = ptPayloadOmitEmptyForPhapTriUpdate(payload);
                        const res = await apiUpdatePhapTri(targetId, updateBody);
                        if (!res.success) {
                            errors.push(
                                'Dòng ' +
                                    idx +
                                    (via === 'id'
                                        ? ' (id ' + targetId + ')'
                                        : via === 'tieuket_exact'
                                          ? ' (tiểu kết → id ' + targetId + ')'
                                          : ' (→ id ' + targetId + ')') +
                                    ': ' +
                                    (res.error || 'Lỗi'),
                            );
                            continue;
                        }
                        updated++;
                        const list = _thuocData.phapTriList || [];
                        const local = list.find(x => Number(x.id) === Number(targetId));
                        if (local) {
                            if (Object.prototype.hasOwnProperty.call(updateBody, 'id_benh_dong_y')) {
                                local.id_benh_dong_y = updateBody.id_benh_dong_y;
                            }
                            if (updateBody.chung_trang !== undefined) local.chung_trang = updateBody.chung_trang;
                        }
                    } else {
                        const res = await apiCreatePhapTri(payload);
                        if (!res.success) {
                            errors.push('Dòng ' + idx + ': ' + (res.error || 'Lỗi'));
                            continue;
                        }
                        created++;
                        if (res.id != null) {
                            existingIds.add(res.id);
                            _thuocData.phapTriList = _thuocData.phapTriList || [];
                            const stub = {
                                id: res.id,
                                chung_trang: payload.chung_trang,
                            };
                            if (payload.id_benh_dong_y != null) stub.id_benh_dong_y = payload.id_benh_dong_y;
                            _thuocData.phapTriList.push(stub);
                        }
                    }
                } catch (err) {
                    errors.push('Dòng ' + idx + ': ' + (err && err.message ? err.message : String(err)));
                }
            }
            ndlNhomImportSetLoading(false, '');
            await loadAllThuocData();
            renderThuocSection();
            ptShowPhapTriImportToast({
                created,
                updated,
                errors,
                warns: allWarn,
            });
        } catch (err) {
            ndlNhomImportSetLoading(false, '');
            console.error(err);
            await ptPhapTriShowDialog({
                type: 'alert',
                variant: 'error',
                title: 'Lỗi đọc Excel',
                message: 'Lỗi đọc Excel: ' + (err && err.message ? err.message : String(err)),
            });
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
