// thuoc-yhct-analysis.js — Load LAST trong index.html
// Ghi đè openViThuocForm, saveViThuoc, renderViThuocTab, renderBaiThuocTab
// Schema vị thuốc: nhóm dược lý (nhóm nhỏ) gán ở tab «Nhóm dược lý», không lưu trên vi_thuoc.
// _vtCurrentQuyKinh, _vtCurrentVi, _VT_VI_OPTIONS khai báo trong thuoc-management.js

const YHCT_KINH_ORDER = [
    'Tâm','Can','Tỳ','Phế','Thận','Tâm Bào',
    'Đại Trường','Tiểu Trường','Bàng Quang','Đởm','Vị','Tam Tiêu'
];
const YHCT_KINH_ALIAS = {
    'tam':'Tâm','tâm':'Tâm','can':'Can','ty':'Tỳ','tỳ':'Tỳ','phe':'Phế','phế':'Phế',
    'than':'Thận','thận':'Thận','tambao':'Tâm Bào','tâm bào':'Tâm Bào','tam bao':'Tâm Bào',
    'daitrang':'Đại Trường','đại trường':'Đại Trường','dai truong':'Đại Trường',
    'tieutruong':'Tiểu Trường','tiểu trường':'Tiểu Trường','tieu truong':'Tiểu Trường',
    'bangquang':'Bàng Quang','bàng quang':'Bàng Quang','bang quang':'Bàng Quang',
    'dam':'Đởm','đởm':'Đởm','vi':'Vị','vị':'Vị',
    'tamtieu':'Tam Tiêu','tam tiêu':'Tam Tiêu',
};
function normalizeKinh(raw) {
    const s = (raw||'').trim();
    return YHCT_KINH_ALIAS[s.toLowerCase()] || s;
}

/** Tên các nhóm nhỏ (sub) gán cho vị thuốc — dùng phân tích Tác dụng YHCT. */
function yhctNhomSubNamesFromVt(vt) {
    const links = vt?.nhomLinks || [];
    return [...new Set(links.map(l => (l.nhomNho?.ten_nhom_nho || '').trim()).filter(Boolean))];
}

/** Chuỗi ghép tên nhóm lớn (để heuristic Thăng/Giáng...). */
function yhctNhomLonTextFromVt(vt) {
    const links = vt?.nhomLinks || [];
    const lons = new Set();
    for (const l of links) {
        const t = l.nhomNho?.nhomLon?.ten_nhom_lon;
        if (t) lons.add(t);
    }
    return [...lons].join(' ').toLowerCase();
}

/** Tên nhóm lớn (mỗi liên kết có thể có 0 hoặc 1 nhóm lớn — vị độc lập nhóm nhỏ thì không có). */
function yhctNhomLonNamesFromVt(vt) {
    const links = vt?.nhomLinks || [];
    const lons = new Set();
    for (const l of links) {
        const t = (l.nhomNho?.nhomLon?.ten_nhom_lon || '').trim();
        if (t) lons.add(t);
    }
    return [...lons];
}

/** Nhãn nhóm nhỏ cho bảng / xuất Excel (ưu tiên `vtNhomSubLabels` từ thuoc-management.js). */
function yhctVtNhomSubDisplay(vt) {
    if (typeof vtNhomSubLabels === 'function') return vtNhomSubLabels(vt);
    const names = yhctNhomSubNamesFromVt(vt);
    return names.length ? names.join(', ') : '—';
}

/** Chip `.chip` (style.css) — chỉ hiển thị, không nút xóa. */
function yhctInlineChipsFromStrings(arr) {
    const list = [...new Set((arr || []).map(s => String(s).trim()).filter(Boolean))];
    if (!list.length) {
        return '<span style="color:#D1D5DB;font-size:0.74rem;">—</span>';
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${
        list.map(t => `<span class="chip" style="cursor:default;font-size:0.72rem;">${escHtml(t)}</span>`).join('')
    }</div>`;
}

/** Cùng cỡ chữ; chỉ khác màu nền/viền/chữ giữa nhóm nhỏ / nhóm lớn / pháp trị. */
const YHCT_TACDUNG_CHIP = {
    fs: '0.8rem',
    pad: '2px 10px',
    nho: 'border:1px solid #D4C5A0;background:#F5F0E8;color:#5B3A1A;',
    lon: 'border:1px solid #C49A6C;background:#FAEBD8;color:#5B3A1A;',
    phap: 'border:1px solid #7A9B8E;background:#E8F2EE;color:#2D4A3E;',
};

function yhctTacdungChipStyle(kind) {
    const colors = YHCT_TACDUNG_CHIP[kind] || YHCT_TACDUNG_CHIP.nho;
    return `cursor:default;font-size:${YHCT_TACDUNG_CHIP.fs};font-weight:600;padding:${YHCT_TACDUNG_CHIP.pad};border-radius:4px;${colors}`;
}

/** Chip nhóm lớn — cùng cỡ với nhóm nhỏ, khác màu. */
function yhctNhomLonChipsHtml(arr) {
    const list = [...new Set((arr || []).map(s => String(s).trim()).filter(Boolean))];
    if (!list.length) {
        return '<span style="color:#9CA3AF;font-size:0.8rem;">Không có nhóm lớn (chỉ nhóm nhỏ độc lập hoặc chưa gán).</span>';
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">${
        list.map(t => `<span class="chip" style="${yhctTacdungChipStyle('lon')}">${escHtml(t)}</span>`).join('')
    }</div>`;
}

/** Pháp trị bài thuốc — tách theo dấu phẩy/chấm phẩy thành chip. */
function yhctPhapTriChipsHtml(raw) {
    const s = (raw || '').trim();
    if (!s) {
        return '<span style="color:#9CA3AF;font-size:0.8rem;">Chưa gán pháp trị.</span>';
    }
    const parts = s.split(/[,，;]/g).map(x => x.trim()).filter(Boolean);
    if (!parts.length) {
        return `<span class="chip" style="${yhctTacdungChipStyle('phap')}">${escHtml(s)}</span>`;
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">${
        parts.map(t => `<span class="chip" style="${yhctTacdungChipStyle('phap')}">${escHtml(t)}</span>`).join('')
    }</div>`;
}

/** Tính vị thuốc — chỉ các giá trị mặc định (dropdown). */
const _VT_TINH_OPTIONS = ['Bình', 'Đại Hàn', 'Hàn', 'Hơi Hàn', 'Hơi Ôn', 'Lương', 'Nóng', 'Ôn'];

function yhctCanonicalTinh(raw) {
    const t = (raw || '').trim();
    if (!t) return '';
    const hit = _VT_TINH_OPTIONS.find(o => o.toLowerCase() === t.toLowerCase());
    return hit || '';
}

function yhctSanitizeVtTinh(v) {
    const t = (v || '').trim();
    if (!t) return '';
    return _VT_TINH_OPTIONS.includes(t) ? t : '';
}

function yhctVtTinhSelectOptionsHtml(currentRaw) {
    const canon = yhctCanonicalTinh(currentRaw);
    const raw = (currentRaw || '').trim();
    const legacy = !canon && !!raw && !_VT_TINH_OPTIONS.includes(raw);
    const selected = canon || (legacy ? raw : '');

    let html = `<option value=""${selected === '' && !legacy ? ' selected' : ''}>— Chọn tính —</option>`;
    for (const o of _VT_TINH_OPTIONS) {
        html += `<option value="${escHtml(o)}"${selected === o ? ' selected' : ''}>${escHtml(o)}</option>`;
    }
    if (legacy) {
        html += `<option value="${escHtml(raw)}" selected>${escHtml(raw)} (cần đổi)</option>`;
    }
    return html;
}

const VT_VI_MAX = 5;

function yhctCanonicalViToken(token) {
    const t = (token || '').trim();
    if (!t) return '';
    const opts = typeof _VT_VI_OPTIONS !== 'undefined' ? _VT_VI_OPTIONS : ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'];
    return opts.find(o => o.toLowerCase() === t.toLowerCase()) || '';
}

/** Chuỗi lưu DB: tối đa 5 vị, ngăn cách dấu phẩy; bỏ trùng; chỉ giữ 5 giá trị mặc định. */
function yhctNormalizeViString(raw) {
    const parts = String(raw || '').split(/[,，;]/).map(s => s.trim()).filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const p of parts) {
        const c = yhctCanonicalViToken(p);
        if (!c || seen.has(c)) continue;
        seen.add(c);
        out.push(c);
        if (out.length >= VT_VI_MAX) break;
    }
    return out.join(', ');
}

function yhctParseViToList(raw) {
    const s = yhctNormalizeViString(raw);
    if (!s) return [];
    return s.split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);
}

// ── Vị thuốc ↔ danh mục (công dụng / chủ trị / kiêng kỵ) + tên gọi khác ─────
var _vtLinkCong = [];
var _vtLinkChuTri = [];
var _vtLinkKiengKy = [];
var _vtTenGoiKhacTexts = [];

function yhctVtTenGoiKhacFromItem(item) {
    const list = item?.tenGoiKhacList;
    if (Array.isArray(list) && list.length) {
        return list.map(r => (r.ten_goi_khac || '').trim()).filter(Boolean);
    }
    const leg = item?.ten_goi_khac;
    if (leg && String(leg).trim()) {
        return String(leg).split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function yhctVtInitLinkRowsFromItem(item) {
    _vtLinkCong = (item?.congDungLinks || []).map(l => ({
        id_cong_dung: String(l.id_cong_dung != null ? l.id_cong_dung : ''),
        ghi_chu: l.ghi_chu || '',
    }));
    if (!_vtLinkCong.length) _vtLinkCong = [{ id_cong_dung: '', ghi_chu: '' }];

    _vtLinkChuTri = (item?.chuTriLinks || []).map(l => ({
        id_chu_tri: String(l.id_chu_tri != null ? l.id_chu_tri : ''),
        ghi_chu: l.ghi_chu || '',
    }));
    if (!_vtLinkChuTri.length) _vtLinkChuTri = [{ id_chu_tri: '', ghi_chu: '' }];

    _vtLinkKiengKy = (item?.kiengKyLinks || []).map(l => ({
        id_kieng_ky: String(l.id_kieng_ky != null ? l.id_kieng_ky : ''),
        ghi_chu: l.ghi_chu || '',
    }));
    if (!_vtLinkKiengKy.length) _vtLinkKiengKy = [{ id_kieng_ky: '', ghi_chu: '' }];

    _vtTenGoiKhacTexts = yhctVtTenGoiKhacFromItem(item);
    if (!_vtTenGoiKhacTexts.length) _vtTenGoiKhacTexts = [''];
}

function yhctVtCatSelectOptions(catalog, labelKey, selectedVal) {
    let h = `<option value="">— Chọn —</option>`;
    for (const c of catalog || []) {
        const id = c.id;
        const sel = String(selectedVal) === String(id) ? ' selected' : '';
        h += `<option value="${id}"${sel}>${escHtml((c[labelKey] || '') + '')}</option>`;
    }
    return h;
}

function yhctVtLinkSummaryLines(links, namePicker) {
    const rows = links || [];
    if (!rows.length) return '';
    return rows.map(l => {
        const n = namePicker(l) || '';
        const g = (l.ghi_chu || '').trim();
        return g ? `${n} (${g})` : n;
    }).filter(Boolean).join('; ');
}

function yhctVtCongDungSummary(item) {
    return yhctVtLinkSummaryLines(item?.congDungLinks, l => l.congDung?.ten_cong_dung || '');
}

function yhctVtChuTriSummary(item) {
    return yhctVtLinkSummaryLines(item?.chuTriLinks, l => l.chuTri?.ten_chu_tri || '');
}

function yhctVtKiengKySummary(item) {
    return yhctVtLinkSummaryLines(item?.kiengKyLinks, l => l.kiengKy?.ten_kieng_ky || '');
}

function yhctVtAliasDisplay(item) {
    const list = item?.tenGoiKhacList;
    if (Array.isArray(list) && list.length) {
        return list.map(r => (r.ten_goi_khac || '').trim()).filter(Boolean).join(', ');
    }
    return (item?.ten_goi_khac || '').trim();
}

function vtRenderVtCongRows() {
    const el = document.getElementById('vt-rows-cong');
    if (!el) return;
    el.innerHTML = _vtLinkCong.map((row, idx) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <select class="tayy-form-input" style="flex:2;margin-top:0;"
                onchange="_vtLinkCong[${idx}].id_cong_dung = this.value">
                ${yhctVtCatSelectOptions(_thuocData.congDung, 'ten_cong_dung', row.id_cong_dung)}
            </select>
            <input type="text" class="tayy-form-input" style="flex:1;margin-top:0;font-style:italic;color:#6B5A3A;"
                placeholder="Ghi chú…"
                value="${escHtml(row.ghi_chu || '')}"
                oninput="_vtLinkCong[${idx}].ghi_chu = this.value">
            <button type="button" class="btn btn-sm" style="flex-shrink:0;background:#FDECEA;color:#B03A2E;"
                onclick="vtRemoveVtCongRow(${idx})">×</button>
        </div>`).join('');
}
function vtAddVtCongRow() {
    _vtLinkCong.push({ id_cong_dung: '', ghi_chu: '' });
    vtRenderVtCongRows();
}
function vtRemoveVtCongRow(i) {
    if (_vtLinkCong.length <= 1) _vtLinkCong[0] = { id_cong_dung: '', ghi_chu: '' };
    else _vtLinkCong.splice(i, 1);
    vtRenderVtCongRows();
}

function vtRenderVtChuTriRows() {
    const el = document.getElementById('vt-rows-chutri');
    if (!el) return;
    el.innerHTML = _vtLinkChuTri.map((row, idx) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <select class="tayy-form-input" style="flex:2;margin-top:0;"
                onchange="_vtLinkChuTri[${idx}].id_chu_tri = this.value">
                ${yhctVtCatSelectOptions(_thuocData.chuTri, 'ten_chu_tri', row.id_chu_tri)}
            </select>
            <input type="text" class="tayy-form-input" style="flex:1;margin-top:0;font-style:italic;color:#6B5A3A;"
                placeholder="Ghi chú…"
                value="${escHtml(row.ghi_chu || '')}"
                oninput="_vtLinkChuTri[${idx}].ghi_chu = this.value">
            <button type="button" class="btn btn-sm" style="flex-shrink:0;background:#FDECEA;color:#B03A2E;"
                onclick="vtRemoveVtChuTriRow(${idx})">×</button>
        </div>`).join('');
}
function vtAddVtChuTriRow() {
    _vtLinkChuTri.push({ id_chu_tri: '', ghi_chu: '' });
    vtRenderVtChuTriRows();
}
function vtRemoveVtChuTriRow(i) {
    if (_vtLinkChuTri.length <= 1) _vtLinkChuTri[0] = { id_chu_tri: '', ghi_chu: '' };
    else _vtLinkChuTri.splice(i, 1);
    vtRenderVtChuTriRows();
}

function vtRenderVtKiengKyRows() {
    const el = document.getElementById('vt-rows-kiengky');
    if (!el) return;
    el.innerHTML = _vtLinkKiengKy.map((row, idx) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <select class="tayy-form-input" style="flex:2;margin-top:0;"
                onchange="_vtLinkKiengKy[${idx}].id_kieng_ky = this.value">
                ${yhctVtCatSelectOptions(_thuocData.kiengKy, 'ten_kieng_ky', row.id_kieng_ky)}
            </select>
            <input type="text" class="tayy-form-input" style="flex:1;margin-top:0;font-style:italic;color:#6B5A3A;"
                placeholder="Ghi chú…"
                value="${escHtml(row.ghi_chu || '')}"
                oninput="_vtLinkKiengKy[${idx}].ghi_chu = this.value">
            <button type="button" class="btn btn-sm" style="flex-shrink:0;background:#FDECEA;color:#B03A2E;"
                onclick="vtRemoveVtKiengKyRow(${idx})">×</button>
        </div>`).join('');
}
function vtAddVtKiengKyRow() {
    _vtLinkKiengKy.push({ id_kieng_ky: '', ghi_chu: '' });
    vtRenderVtKiengKyRows();
}
function vtRemoveVtKiengKyRow(i) {
    if (_vtLinkKiengKy.length <= 1) _vtLinkKiengKy[0] = { id_kieng_ky: '', ghi_chu: '' };
    else _vtLinkKiengKy.splice(i, 1);
    vtRenderVtKiengKyRows();
}

function vtRenderTenGoiKhacRows() {
    const el = document.getElementById('vt-rows-alias');
    if (!el) return;
    el.innerHTML = _vtTenGoiKhacTexts.map((t, idx) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <input type="text" class="tayy-form-input" style="flex:1;margin-top:0;"
                value="${escHtml(t)}"
                oninput="_vtTenGoiKhacTexts[${idx}] = this.value"
                placeholder="Tên gọi khác">
            <button type="button" class="btn btn-sm" style="flex-shrink:0;background:#FDECEA;color:#B03A2E;"
                onclick="vtRemoveAliasRow(${idx})">×</button>
        </div>`).join('');
}
function vtAddAliasRow() {
    _vtTenGoiKhacTexts.push('');
    vtRenderTenGoiKhacRows();
}
function vtRemoveAliasRow(i) {
    if (_vtTenGoiKhacTexts.length <= 1) _vtTenGoiKhacTexts[0] = '';
    else _vtTenGoiKhacTexts.splice(i, 1);
    vtRenderTenGoiKhacRows();
}

/** Tách nhiều mục trong một ô Excel: dấu phẩy (thường / tiếng Trung), chấm phẩy, xuống dòng — giống mẫu «Công dụng, Chủ trị…». */
function yhctSplitExcelCatalogParts(raw) {
    return String(raw || '')
        .split(/[,，;；\n\r]+/)
        .map(s => s.trim())
        .filter(Boolean);
}

async function yhctEnsureCongDungId(name) {
    const n = String(name || '').trim();
    if (!n) return null;
    const list = _thuocData.congDung || [];
    const hit = list.find(x => (x.ten_cong_dung || '').trim().toLowerCase() === n.toLowerCase());
    if (hit) return hit.id;
    const res = await apiCreateCongDung({ ten_cong_dung: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_cong_dung: n, ghi_chu: '' };
    list.push(row);
    list.sort((a, b) => (a.ten_cong_dung || '').localeCompare(b.ten_cong_dung || '', 'vi'));
    return res.id;
}

async function yhctEnsureChuTriId(name) {
    const n = String(name || '').trim();
    if (!n) return null;
    const list = _thuocData.chuTri || [];
    const hit = list.find(x => (x.ten_chu_tri || '').trim().toLowerCase() === n.toLowerCase());
    if (hit) return hit.id;
    const res = await apiCreateChuTri({ ten_chu_tri: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_chu_tri: n, ghi_chu: '' };
    list.push(row);
    list.sort((a, b) => (a.ten_chu_tri || '').localeCompare(b.ten_chu_tri || '', 'vi'));
    return res.id;
}

async function yhctEnsureKiengKyId(name) {
    const n = String(name || '').trim();
    if (!n) return null;
    const list = _thuocData.kiengKy || [];
    const hit = list.find(x => (x.ten_kieng_ky || '').trim().toLowerCase() === n.toLowerCase());
    if (hit) return hit.id;
    const res = await apiCreateKiengKy({ ten_kieng_ky: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_kieng_ky: n, ghi_chu: '' };
    list.push(row);
    list.sort((a, b) => (a.ten_kieng_ky || '').localeCompare(b.ten_kieng_ky || '', 'vi'));
    return res.id;
}

async function yhctCatalogLinksFromExcelStrings(congText, chuText, kiengText) {
    const cong_dung_links = [];
    for (const part of yhctSplitExcelCatalogParts(congText)) {
        const id = await yhctEnsureCongDungId(part);
        if (id != null) cong_dung_links.push({ id_cong_dung: id, ghi_chu: '' });
    }
    const chu_tri_links = [];
    for (const part of yhctSplitExcelCatalogParts(chuText)) {
        const id = await yhctEnsureChuTriId(part);
        if (id != null) chu_tri_links.push({ id_chu_tri: id, ghi_chu: '' });
    }
    const kieng_ky_links = [];
    for (const part of yhctSplitExcelCatalogParts(kiengText)) {
        const id = await yhctEnsureKiengKyId(part);
        if (id != null) kieng_ky_links.push({ id_kieng_ky: id, ghi_chu: '' });
    }
    return { cong_dung_links, chu_tri_links, kieng_ky_links };
}

function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;

    showTayyModal('Vị thuốc', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tên vị thuốc *<br>
                <input id="vt-inp-ten" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.ten_vi_thuoc):''}" placeholder="VD: Ma hoàng"></label>
            <label class="tayy-form-label">Tên gọi khác <span style="font-weight:400;color:#A09580;font-size:0.68rem;">(nhiều dòng)</span>
                <div id="vt-rows-alias" style="margin-top:4px;"></div>
                <button type="button" class="btn btn-sm btn-outline" style="margin-top:6px;" onclick="vtAddAliasRow()">+ Thêm tên</button>
            </label>
        </div>
        <p style="margin:0 0 10px 0;font-size:0.78rem;color:#8B7355;background:#FAF6EE;border:1px dashed #D4C5A0;border-radius:8px;padding:8px 10px;">
            Gán vị thuốc vào <strong>nhóm nhỏ</strong> tại tab «Nhóm dược lý» (nút «Vị thuốc» trên từng nhóm nhỏ).
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tính<br>
                <select id="vt-inp-tinh" class="tayy-form-input">${yhctVtTinhSelectOptionsHtml(item ? item.tinh : '')}</select></label>
            <label class="tayy-form-label">Vị <span style="font-weight:400;color:#A09580;font-size:0.68rem;">(tối đa 5: Chua, Đắng, Ngọt, Cay, Mặn)</span><br>
                <div style="position:relative;">
                    <div id="vt-vi-chips" class="chips-container" onclick="document.getElementById('vt-inp-vi').focus()">
                        <input id="vt-inp-vi" type="text" class="chip-input" placeholder="Chọn vị…"
                            oninput="vtOnViSearchInput(this.value)" onfocus="vtOnViSearchInput(this.value)"
                            onkeydown="if(event.key==='Enter'&&this.value){vtSelectViByInput(this.value);event.preventDefault();}if(event.key==='Backspace'&&!this.value)vtRemoveLastViChip()">
                    </div>
                    <div id="vt-vi-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
        </div>
        <label class="tayy-form-label">Liều dùng<br>
            <input id="vt-inp-lieudung" type="text" class="tayy-form-input"
                value="${item?escHtml(item.lieu_dung||''):''}" placeholder="VD: 2-9g"></label>
        <label class="tayy-form-label">Quy kinh (chọn nhiều)<br>
            <div style="position:relative;">
                <div id="vt-quykinh-chips" class="chips-container" onclick="document.getElementById('vt-inp-quykinh').focus()">
                    <input id="vt-inp-quykinh" type="text" class="chip-input" placeholder="Thêm kinh mạch..."
                        oninput="vtOnQuyKinhSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter'&&this.value){vtSelectQuyKinh(this.value);event.preventDefault();}if(event.key==='Backspace'&&!this.value)vtRemoveLastQuyKinhChip()">
                </div>
                <div id="vt-quykinh-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                    background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                    box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:200px;overflow-y:auto;z-index:2500;display:none;"></div>
            </div></label>
        <label class="tayy-form-label">Công dụng <span style="font-weight:400;color:#A09580;font-size:0.68rem;">(danh mục «Công dụng» + ghi chú riêng)</span>
            <div id="vt-rows-cong" style="margin-top:4px;"></div>
            <button type="button" class="btn btn-sm btn-outline" style="margin-top:6px;" onclick="vtAddVtCongRow()">+ Thêm công dụng</button>
        </label>
        <label class="tayy-form-label">Chủ trị <span style="font-weight:400;color:#A09580;font-size:0.68rem;">(danh mục «Chủ trị»)</span>
            <div id="vt-rows-chutri" style="margin-top:4px;"></div>
            <button type="button" class="btn btn-sm btn-outline" style="margin-top:6px;" onclick="vtAddVtChuTriRow()">+ Thêm chủ trị</button>
        </label>
        <label class="tayy-form-label">Kiêng kỵ <span style="font-weight:400;color:#A09580;font-size:0.68rem;">(danh mục «Kiêng kỵ»)</span>
            <div id="vt-rows-kiengky" style="margin-top:4px;"></div>
            <button type="button" class="btn btn-sm btn-outline" style="margin-top:6px;" onclick="vtAddVtKiengKyRow()">+ Thêm kiêng kỵ</button>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id||0})">Lưu</button>
        </div>
    `, 'wide');

    _vtCurrentQuyKinh = (item?.quy_kinh||'').split(',').map(s=>s.trim()).filter(Boolean);
    vtRenderQuyKinhChips();
    _vtCurrentVi = yhctParseViToList(item?.vi || '');
    vtRenderViChips();
    yhctVtInitLinkRowsFromItem(item);
    vtRenderTenGoiKhacRows();
    vtRenderVtCongRows();
    vtRenderVtChuTriRows();
    vtRenderVtKiengKyRows();
}

async function saveViThuoc(id) {
    const ten_goi_khac_list = (_vtTenGoiKhacTexts || []).map(s => String(s || '').trim()).filter(Boolean);
    const cong_dung_links = (_vtLinkCong || [])
        .filter(r => r.id_cong_dung)
        .map(r => ({ id_cong_dung: Number(r.id_cong_dung), ghi_chu: (r.ghi_chu || '').trim() }));
    const chu_tri_links = (_vtLinkChuTri || [])
        .filter(r => r.id_chu_tri)
        .map(r => ({ id_chu_tri: Number(r.id_chu_tri), ghi_chu: (r.ghi_chu || '').trim() }));
    const kieng_ky_links = (_vtLinkKiengKy || [])
        .filter(r => r.id_kieng_ky)
        .map(r => ({ id_kieng_ky: Number(r.id_kieng_ky), ghi_chu: (r.ghi_chu || '').trim() }));

    const payload = {
        ten_vi_thuoc:   (document.getElementById('vt-inp-ten')?.value||'').trim(),
        tinh:           yhctSanitizeVtTinh(document.getElementById('vt-inp-tinh')?.value),
        vi:             yhctNormalizeViString((typeof _vtCurrentVi !== 'undefined' && _vtCurrentVi.length) ? _vtCurrentVi.join(',') : ''),
        lieu_dung:      (document.getElementById('vt-inp-lieudung')?.value||'').trim(),
        quy_kinh:       _vtCurrentQuyKinh.join(', '),
        ten_goi_khac_list,
        cong_dung_links,
        chu_tri_links,
        kieng_ky_links,
    };
    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc!');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function openBaiThuocAnalysis(baiThuocId) {
    const bt = _thuocData.baiThuoc.find(x => x.id == baiThuocId);
    if (!bt) return alert('Không tìm thấy bài thuốc.');
    const result = yhctAnalyzeLocalSimple(bt);
    showTayyModal(`Phân tích: ${escHtml(bt.ten_bai_thuoc)}`, yhctBuildAnalysisHtml(result), 'wide');
    setTimeout(() => yhctInitAnalysisCharts(result), 0);
}

let _yhctAnalysisCharts = [];
function yhctDestroyAnalysisCharts() {
    (_yhctAnalysisCharts || []).forEach(c => { try { c.destroy(); } catch (_) {} });
    _yhctAnalysisCharts = [];
}

function yhctAnalyzeLocalSimple(bt) {
    const details = bt.chiTietViThuoc || [];
    const parseLieu = (s) => {
        if (!s) return 9;
        s = (s+'').trim().toLowerCase();
        if (s==='*') return 2.25;
        if (s==='#') return 22.5;
        let m;
        m=s.match(/^([\d.]+)\s*tiền?/); if(m) return parseFloat(m[1])*3;
        m=s.match(/^([\d.]+)\s*lư?ợng/); if(m) return parseFloat(m[1])*30;
        m=s.match(/^([\d.]+)/); if(m) return parseFloat(m[1]);
        return 9;
    };
    const items = details.map(d => {
        const vt = d.viThuoc || (_thuocData.viThuoc||[]).find(v=>v.id===d.idViThuoc) || {};
        return { d, vt, gram: parseLieu(d.lieu_luong) };
    }).filter(x=>x.vt&&x.vt.id);

    if (!items.length) return { empty:true, ten:bt.ten_bai_thuoc };

    const W = items.reduce((s,x)=>s+x.gram,0)||1;

    const qkRaw = {};
    YHCT_KINH_ORDER.forEach(k=>{ qkRaw[k]=0; });
    for (const {d,vt,gram} of items) {
        const qkStr = vt.quy_kinh || d.quy_kinh || '';
        qkStr.split(/[,;，、]/).map(k=>k.trim()).filter(Boolean).forEach(k=>{
            const norm = normalizeKinh(k);
            if (norm in qkRaw) qkRaw[norm] += gram;
            else {
                const found = YHCT_KINH_ORDER.find(ref=>norm.includes(ref)||ref.includes(norm));
                if (found) qkRaw[found] += gram;
            }
        });
    }
    const qkMax = Math.max(...Object.values(qkRaw),0.01);
    const quyKinhNorm = {};
    YHCT_KINH_ORDER.forEach(k=>{ quyKinhNorm[k] = Math.round((qkRaw[k]/qkMax)*10)/10; });

    const sorted = [...items].sort((a,b)=>b.gram-a.gram);
    const quanQK = (sorted[0]?.vt?.quy_kinh||'').split(/[,;，、]/).map(k=>normalizeKinh(k.trim()));
    const roleMap = {}, roleColors = {Quân:'#DC2626',Thần:'#F97316',Tá:'#16A34A',Sứ:'#2563EB'};
    sorted.forEach((x,i)=>{
        const ten=(x.vt.ten_vi_thuoc||'').toLowerCase();
        const pct=x.gram/W;
        const vtQK=(x.vt.quy_kinh||'').split(/[,;，、]/).map(k=>normalizeKinh(k.trim()));
        if(i===0) roleMap[x.vt.id]='Quân';
        else if((ten.includes('cam thảo')||ten.includes('đại táo'))&&pct<0.1) roleMap[x.vt.id]='Sứ';
        else if(pct>=0.15&&vtQK.some(k=>quanQK.includes(k))) roleMap[x.vt.id]='Thần';
        else roleMap[x.vt.id]='Tá';
    });

    const viThuocList = items.map(({d,vt,gram}) => {
        const nhomSubs = yhctNhomSubNamesFromVt(vt);
        return {
            id: vt.id,
            ten: vt.ten_vi_thuoc || '—', gram,
            pct: Math.round(gram / W * 100),
            vai_tro: roleMap[vt.id] || 'Tá',
            color: roleColors[roleMap[vt.id] || 'Tá'],
            tinh: vt.tinh || '',
            vi: vt.vi || '',
            quy_kinh: vt.quy_kinh || '',
            nhomSubs,
            nhomSubDisplay: nhomSubs.length ? nhomSubs.join(', ') : '—',
            _nhomLonText: yhctNhomLonTextFromVt(vt),
        };
    });

    const tuKhi = { daiHan:0, han:0, luong:0, binh:0, on:0, nhiet:0, daiNhiet:0 };
    const nguVi = { chua:0, dang:0, ngot:0, cay:0, man:0 };
    const tgpt = { thang:0, giang:0, phu:0, tram:0 };

    /** Tên nhóm nhỏ xuất hiện trong bài (mỗi tên một lần, thứ tự theo locale vi). */
    const seenTacDung = new Set();
    const tacDungYhctNhomNho = [];
    for (const v of viThuocList) {
        for (const raw of v.nhomSubs || []) {
            const n = (raw || '').trim();
            if (!n || seenTacDung.has(n)) continue;
            seenTacDung.add(n);
            tacDungYhctNhomNho.push(n);
        }
    }
    tacDungYhctNhomNho.sort((a, b) => a.localeCompare(b, 'vi'));

    const seenLonTac = new Set();
    const tacDungYhctNhomLon = [];
    for (const { vt } of items) {
        for (const raw of yhctNhomLonNamesFromVt(vt)) {
            const t = (raw || '').trim();
            if (!t || seenLonTac.has(t)) continue;
            seenLonTac.add(t);
            tacDungYhctNhomLon.push(t);
        }
    }
    tacDungYhctNhomLon.sort((a, b) => a.localeCompare(b, 'vi'));

    const addTuKhi = (tinhRaw, wPct) => {
        const t = (tinhRaw || '').trim().toLowerCase();
        if (!t) return;
        if (t.includes('đại hàn') || t.includes('dai han')) { tuKhi.daiHan += wPct; return; }
        if (t.includes('hơi hàn') || t.includes('hoi han')) { tuKhi.han += wPct * 0.7; tuKhi.luong += wPct * 0.3; return; }
        if (t.includes('hàn') || t.includes('han')) { tuKhi.han += wPct; return; }
        if (t.includes('lương') || t.includes('luong')) { tuKhi.luong += wPct; return; }
        if (t.includes('bình') || t.includes('binh')) { tuKhi.binh += wPct; return; }
        if (t.includes('đại nhiệt') || t.includes('dai nhiet')) { tuKhi.daiNhiet += wPct; return; }
        if (t.includes('nhiệt') || t.includes('nhiet') || t.includes('nóng') || t.includes('nong')) { tuKhi.nhiet += wPct; return; }
        if (t.includes('hơi ôn') || t.includes('hoi on')) { tuKhi.on += wPct * 0.7; tuKhi.binh += wPct * 0.3; return; }
        if (t.includes('ôn') || t.includes('on')) { tuKhi.on += wPct; return; }
        tuKhi.binh += wPct;
    };
    const addNguVi = (viRaw, wPct) => {
        const parts = String(viRaw || '').split(/[,;，、]/).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (!parts.length) return;
        const uniq = [...new Set(parts)];
        const each = wPct / uniq.length;
        uniq.forEach(v => {
            if (v.includes('chua')) nguVi.chua += each;
            else if (v.includes('đắng') || v.includes('dang')) nguVi.dang += each;
            else if (v.includes('ngọt') || v.includes('ngot')) nguVi.ngot += each;
            else if (v.includes('cay')) nguVi.cay += each;
            else if (v.includes('mặn') || v.includes('man')) nguVi.man += each;
        });
    };
    const addTgpt = (item, wPct) => {
        const tinh = (item.tinh || '').toLowerCase();
        const nhom = (item._nhomLonText || '').toLowerCase();
        const qk = (item.quy_kinh || '').toLowerCase();
        if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { tgpt.thang += wPct * 0.35; tgpt.phu += wPct * 0.35; }
        if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { tgpt.giang += wPct * 0.35; tgpt.tram += wPct * 0.35; }
        if (nhom.includes('giải biểu') || nhom.includes('thăng')) tgpt.phu += wPct * 0.35;
        if (nhom.includes('tả hạ') || nhom.includes('giáng')) tgpt.giang += wPct * 0.35;
        if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) tgpt.thang += wPct * 0.15;
        if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) tgpt.tram += wPct * 0.15;
        const base = wPct * 0.15;
        tgpt.thang += base; tgpt.giang += base; tgpt.phu += base; tgpt.tram += base;
    };
    viThuocList.forEach(v => {
        const wPct = v.gram / W;
        addTuKhi(v.tinh, wPct);
        addNguVi(v.vi, wPct);
        addTgpt(v, wPct);
    });

    return {
        ten: bt.ten_bai_thuoc,
        W,
        quyKinhNorm,
        viThuocList,
        tuKhi,
        nguVi,
        tgpt,
        tacDungYhctNhomNho,
        tacDungYhctNhomLon,
        phapTriBaiThuoc: (bt.phap_tri || '').trim(),
    };
}

function yhctBuildAnalysisHtml(r) {
    if (r.empty) return `<div style="text-align:center;padding:40px;color:#A09580;font-style:italic;">
        Bài thuốc chưa có vị thuốc.</div>`;

    const roleOrder = {Quân:0,Thần:1,Tá:2,Sứ:3};
    const sortedVt = [...r.viThuocList].sort((a,b)=>(roleOrder[a.vai_tro]||3)-(roleOrder[b.vai_tro]||3)||b.gram-a.gram);
    const vtRows = sortedVt.map(v=>`
        <tr>
            <td style="padding:5px 8px;font-weight:600;">${escHtml(v.ten)}</td>
            <td style="padding:5px 8px;text-align:center;">${v.gram.toFixed ? v.gram.toFixed(1) : v.gram}g</td>
            <td style="padding:5px 8px;text-align:center;">${v.pct}%</td>
            <td style="padding:5px 8px;text-align:center;">
                <span style="background:${v.color};color:#fff;border-radius:10px;padding:2px 9px;font-size:0.75rem;font-weight:700;">${escHtml(v.vai_tro)}</span>
            </td>
            <td style="padding:5px 8px;vertical-align:top;max-width:280px;">${yhctInlineChipsFromStrings(v.nhomSubs || [])}</td>
            <td style="padding:5px 8px;font-size:0.72rem;color:#8B7355;">${escHtml(v.quy_kinh||'—')}</td>
        </tr>`).join('');

    const qkRows = Object.entries(r.quyKinhNorm).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])
        .map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#F5F0E8;border-radius:6px;font-size:0.78rem;margin-bottom:4px;">
            <span>${escHtml(k)}</span><strong>${v}</strong></div>`).join('') || '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa gán quy kinh</div>';

    const tk = r.tuKhi || {};
    const tuKhiSegs = [
        { key: 'daiHan', vn: 'Đại Hàn', zh: '大寒', c: '#1565C0' },
        { key: 'han', vn: 'Hàn', zh: '寒', c: '#29B6F6' },
        { key: 'luong', vn: 'Lương', zh: '凉', c: '#26A69A' },
        { key: 'binh', vn: 'Bình', zh: '平', c: '#E6E38A' },
        { key: 'on', vn: 'Ôn', zh: '温', c: '#FFB74D' },
        { key: 'nhiet', vn: 'Nhiệt', zh: '热', c: '#FF7043' },
        { key: 'daiNhiet', vn: 'Đại Nhiệt', zh: '大热', c: '#C62828' },
    ];
    const tuKhiVals = tuKhiSegs.map(s => Number(tk[s.key]) || 0);
    let tuKhiTipIdx = 3;
    let tuKhiMax = -1;
    tuKhiVals.forEach((v, i) => {
        if (v > tuKhiMax) { tuKhiMax = v; tuKhiTipIdx = i; }
    });
    if (tuKhiMax <= 0) tuKhiTipIdx = 3;

    const tuKhiArrows = tuKhiSegs.map((_, i) => `
        <div style="flex:1;min-width:0;display:flex;justify-content:center;align-items:flex-end;padding-bottom:2px;">
            ${i === tuKhiTipIdx ? '<span style="font-size:0.95rem;line-height:1;color:#111;">▼</span>' : '<span style="visibility:hidden;font-size:0.95rem;">▼</span>'}
        </div>`).join('');
    const tuKhiColors = tuKhiSegs.map(s => `
        <div style="flex:1;min-width:0;height:26px;background:${s.c};"></div>`).join('');
    const tuKhiLabels = tuKhiSegs.map(s => `
        <div style="flex:1;min-width:0;border-top:1px solid #E5E7EB;padding:6px 2px;text-align:center;font-size:0.68rem;line-height:1.25;color:#374151;">
            <div style="font-weight:600;color:#5B3A1A;">${escHtml(s.vn)}</div>
            <div style="color:#6B7280;">(${escHtml(s.zh)})</div>
        </div>`).join('');

    return `
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px;background:#fff;margin-bottom:12px;">
        <div style="font-weight:700;color:#374151;font-size:0.9rem;margin-bottom:10px;">1) Phân tích Tứ khí</div>
        <div style="border:1px solid #D1D5DB;border-radius:8px;overflow:hidden;background:#fff;">
            <div style="display:flex;min-height:26px;">${tuKhiArrows}</div>
            <div style="display:flex;">${tuKhiColors}</div>
            <div style="display:flex;background:#FAFAF8;">${tuKhiLabels}</div>
        </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:10px;background:#fff;">
            <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;margin-bottom:6px;">2) Phân tích Ngũ vị</div>
            <div style="height:220px;position:relative;width:100%;box-sizing:border-box;overflow:hidden;">
                <canvas id="yhct-radar-nguvi" style="display:block;"></canvas>
            </div>
        </div>
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:10px;background:#fff;">
            <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;margin-bottom:6px;">3) Phân tích Quy kinh</div>
            <div style="height:220px;position:relative;width:100%;box-sizing:border-box;overflow:hidden;">
                <canvas id="yhct-radar-quykinh" style="display:block;"></canvas>
            </div>
        </div>
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:10px;background:#fff;">
            <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;margin-bottom:6px;">4) Phân tích Thăng – Giáng – Phù – Trầm</div>
            <div style="height:220px;position:relative;width:100%;box-sizing:border-box;overflow:hidden;">
                <canvas id="yhct-radar-tgpt" style="display:block;"></canvas>
            </div>
        </div>
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:10px;background:#fff;">
            <div style="margin-bottom:10px;line-height:1.35;">
                <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;">5) Phân tích Tác dụng YHCT</div>
                <div style="margin-top:6px;font-weight:800;font-size:1.12rem;color:#1F1410;letter-spacing:-0.02em;">${escHtml(r.ten || '—')}</div>
            </div>
            ${(r.tacDungYhctNhomNho && r.tacDungYhctNhomNho.length)
                ? `<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;padding:2px 0;">${
                    r.tacDungYhctNhomNho.map(n => `<span class="chip" style="${yhctTacdungChipStyle('nho')}">${escHtml(n)}</span>`).join('')
                }</div>`
                : '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa có nhóm nhỏ nào được gán. Gán vị thuốc trong tab «Nhóm dược lý».</div>'}
            <div style="margin-top:14px;">${yhctNhomLonChipsHtml(r.tacDungYhctNhomLon || [])}</div>
            <div style="margin-top:14px;">${yhctPhapTriChipsHtml(r.phapTriBaiThuoc)}</div>
        </div>
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:8px;">Tổng hợp quy kinh (ước lượng theo liều)</div>
        ${qkRows}
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#5B3A1A;font-size:0.88rem;margin-bottom:10px;">
            Quân–Thần–Tá–Sứ <span style="font-weight:400;font-size:0.74rem;color:#9CA3AF;">Tổng ≈ ${r.W.toFixed(1)}g</span>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead><tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB;">
                    <th style="padding:7px 8px;text-align:left;">Vị thuốc</th>
                    <th style="padding:7px 8px;text-align:center;">Gram</th>
                    <th style="padding:7px 8px;text-align:center;">%</th>
                    <th style="padding:7px 8px;text-align:center;">Vai trò</th>
                    <th style="padding:7px 8px;text-align:left;">Nhóm nhỏ (dược lý)</th>
                    <th style="padding:7px 8px;text-align:left;">Quy kinh</th>
                </tr></thead>
                <tbody>${vtRows}</tbody>
            </table>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;">
        <button class="btn" onclick="closeTayyModal()">Đóng</button>
    </div>`;
}

function yhctInitAnalysisCharts(r) {
    if (typeof Chart === 'undefined') return;
    yhctDestroyAnalysisCharts();

    const baseRadarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            r: {
                beginAtZero: true,
                suggestedMax: 1,
                ticks: { stepSize: 0.2, backdropColor: 'transparent' },
                grid: { color: '#E8E2D6' },
                pointLabels: { color: '#6B7280', font: { size: 10 } },
                angleLines: { color: '#ECE7DC' },
            }
        }
    };
    const mkRadar = (id, labels, data, color) => {
        const el = document.getElementById(id);
        if (!el) return;
        const chart = new Chart(el.getContext('2d'), {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: color,
                    backgroundColor: color.replace('1)', '0.12)'),
                    borderWidth: 2,
                    pointRadius: 2,
                }]
            },
            options: baseRadarOptions,
        });
        _yhctAnalysisCharts.push(chart);
    };

    const nguVi = r.nguVi || {};
    mkRadar('yhct-radar-nguvi',
        ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'],
        [nguVi.chua||0, nguVi.dang||0, nguVi.ngot||0, nguVi.cay||0, nguVi.man||0],
        'rgba(239, 68, 68, 1)'
    );

    mkRadar('yhct-radar-quykinh',
        YHCT_KINH_ORDER,
        YHCT_KINH_ORDER.map(k => r.quyKinhNorm?.[k] || 0),
        'rgba(234, 179, 8, 1)'
    );

    const tgpt = r.tgpt || {};
    mkRadar('yhct-radar-tgpt',
        ['Thăng', 'Phù', 'Giáng', 'Trầm'],
        [tgpt.thang||0, tgpt.phu||0, tgpt.giang||0, tgpt.tram||0],
        'rgba(59, 130, 246, 1)'
    );

}

function renderViThuocTab(el) {
    const trunc = (s, n) => {
        const t = (s || '').trim();
        if (!t) return '—';
        if (t.length <= n) return escHtml(t);
        return escHtml(t.slice(0, n)) + '…';
    };
    const rows = _thuocData.viThuoc.map(item => {
        const aliasStr = yhctVtAliasDisplay(item);
        const alias = aliasStr ? `<div style="font-size:0.7rem;color:#9CA3AF;font-style:italic;">${escHtml(aliasStr)}</div>` : '';
        const cd = yhctVtCongDungSummary(item);
        const ct = yhctVtChuTriSummary(item);
        const kk = yhctVtKiengKySummary(item);
        return `<tr>
            <td><div style="font-weight:700;color:#5B3A1A;">${escHtml(item.ten_vi_thuoc)}</div>${alias}</td>
            <td style="font-size:0.74rem;vertical-align:top;max-width:220px;">${yhctInlineChipsFromStrings(yhctNhomSubNamesFromVt(item))}</td>
            <td style="font-size:0.74rem;">${escHtml(item.tinh || '—')}</td>
            <td style="font-size:0.74rem;vertical-align:top;">${yhctInlineChipsFromStrings(yhctParseViToList(item.vi || ''))}</td>
            <td style="font-size:0.72rem;color:#6B7280;">${trunc(item.quy_kinh, 40)}</td>
            <td style="font-size:0.74rem;">${escHtml(item.lieu_dung || '—')}</td>
            <td style="font-size:0.72rem;line-height:1.35;">${trunc(cd, 80)}</td>
            <td style="font-size:0.72rem;line-height:1.35;color:#B8860B;">${trunc(ct, 60)}</td>
            <td style="font-size:0.72rem;line-height:1.35;color:#A32D2D;">${trunc(kk, 60)}</td>
            <td style="text-align:center;width:110px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <button class="btn btn-outline" onclick="yhctExportViThuocXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('yhct-import-vt').click()">📤 Nhập Excel</button>
                <input type="file" id="yhct-import-vt" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportViThuocXlsx(event)">
                <button type="button" class="btn btn-outline" style="border-style:dashed;opacity:0.92;"
                    title="Import/cập nhật theo các cột mẫu (không gán nhóm dược lý qua file)."
                    onclick="document.getElementById('yhct-import-vt-dev').click()">📤 Nhập Excel (dev)</button>
                <input type="file" id="yhct-import-vt-dev" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportViThuocXlsxDev(event)">
            </div>
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container" style="overflow-x:auto;">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th>
                    <th>Nhóm nhỏ (dược lý)</th>
                    <th>Tính</th>
                    <th>Vị</th>
                    <th>Quy kinh</th>
                    <th>Liều dùng</th>
                    <th>Công dụng</th>
                    <th>Chủ trị</th>
                    <th>Kiêng kỵ</th>
                    <th style="width:110px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="10" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ings = (item.chiTietViThuoc||[]).map(d=>{
            const ten = d?.viThuoc?.ten_vi_thuoc||'';
            const lieuText = btGetGramPreviewText((d?.lieu_luong||'').trim());
            return ten+(lieuText?` (${lieuText})`:'');
        }).filter(Boolean).join(', ');
        return `<tr>
            <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
            <td>${escHtml(item.nguon_goc||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.bien_chung||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.trieu_chung||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.phap_tri||'—')}</td>
            <td style="font-size:0.75rem;color:#6B5A3A;">${escHtml(ings||'Chưa có vị thuốc')}</td>
            <td style="text-align:center;width:180px;">
                <div class="table-actions" style="justify-content:center;flex-wrap:wrap;gap:4px;">
                    <button class="btn btn-sm" style="background:#F5F0E8;color:#5B3A1A;border:1px solid #D4C5A0;"
                        onclick="openBaiThuocAnalysis(${item.id})">Phân tích</button>
                    <button class="btn btn-sm btn-outline" onclick="openBaiThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBaiThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline" onclick="yhctExportBaiThuocXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('yhct-import-bt').click()">📤 Nhập Excel</button>
                <input type="file" id="yhct-import-bt" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportBaiThuocXlsx(event)">
            </div>
            <button class="btn btn-primary" onclick="openBaiThuocForm()">+ Thêm bài thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Biện chứng</th>
                    <th>Triệu chứng</th><th>Pháp trị</th><th>Thành phần</th>
                    <th style="width:180px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

/** Overlay loading khi nhập Excel vị thuốc (cùng phong cách spinner tab Nhóm dược lý). */
function yhctViThuocImportSetLoading(show, message) {
    let el = document.getElementById('yhct-vt-import-loading');
    if (!el) {
        el = document.createElement('div');
        el.id = 'yhct-vt-import-loading';
        el.style.cssText = [
            'display:none', 'position:fixed', 'inset:0', 'z-index:99999',
            'background:rgba(245,240,232,.88)', 'backdrop-filter:blur(3px)',
            'align-items:center', 'justify-content:center', 'flex-direction:column', 'gap:14px',
        ].join(';');
        el.innerHTML = `
            <div style="width:46px;height:46px;border:4px solid #E2D4B8;border-top-color:#5B3A1A;border-radius:50%;
                animation:yhctVtImportSpin .8s linear infinite;"></div>
            <div id="yhct-vt-import-loading-msg" style="font-weight:700;color:#5B3A1A;font-size:0.95rem;text-align:center;max-width:min(420px,92vw);line-height:1.45;"></div>`;
        document.body.appendChild(el);
        if (!document.getElementById('yhct-vt-import-spin-style')) {
            const st = document.createElement('style');
            st.id = 'yhct-vt-import-spin-style';
            st.textContent = '@keyframes yhctVtImportSpin{to{transform:rotate(360deg)}}';
            document.head.appendChild(st);
        }
    }
    const msgEl = document.getElementById('yhct-vt-import-loading-msg');
    if (msgEl) msgEl.textContent = message || '';
    el.style.display = show ? 'flex' : 'none';
}

/** Ghép chỉ tên mục (không ghi chú) — đúng định dạng xuất Excel. */
function yhctVtCongDungExcelCell(vt) {
    const links = vt?.congDungLinks || [];
    return links.map(l => (l.congDung?.ten_cong_dung || '').trim()).filter(Boolean).join(', ');
}
function yhctVtChuTriExcelCell(vt) {
    const links = vt?.chuTriLinks || [];
    return links.map(l => (l.chuTri?.ten_chu_tri || '').trim()).filter(Boolean).join(', ');
}
function yhctVtKiengKyExcelCell(vt) {
    const links = vt?.kiengKyLinks || [];
    return links.map(l => (l.kiengKy?.ten_kieng_ky || '').trim()).filter(Boolean).join(', ');
}

/** Cột Excel / CSV — công dụng & chủ trị & kiêng kỵ: nhiều mục, tách bởi dấu phẩy / ; / xuống dòng (chưa có trong danh mục thì tạo mới). */
function yhctViThuocPayloadFromRow(r) {
    return {
        ten_vi_thuoc: yhctDevPick(r, ['Tên vị thuốc', 'Ten vi thuoc']),
        _excel_ten_goi_khac: yhctDevPick(r, ['Tên gọi khác', 'Ten goi khac']),
        tinh: yhctCanonicalTinh(yhctDevPick(r, ['Tính', 'Tinh'])),
        vi: yhctNormalizeViString(yhctDevPick(r, ['Vị', 'Vi'])),
        quy_kinh: yhctDevPick(r, ['Quy kinh', 'Quy Kinh']),
        lieu_dung: yhctDevPick(r, ['Liều dùng', 'Lieu dung', 'Liều lượng']),
        _excel_cong_dung: yhctDevPick(r, ['Công dụng', 'Cong dung']),
        _excel_chu_tri: yhctDevPick(r, ['Chủ trị', 'Chu tri']),
        _excel_kieng_ky: yhctDevPick(r, ['Kiêng kỵ', 'Kieng ky']),
    };
}

async function yhctViThuocPayloadFromRowResolved(r) {
    const p = yhctViThuocPayloadFromRow(r);
    const ten_goi_khac_list = String(p._excel_ten_goi_khac || '')
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean);
    const { cong_dung_links, chu_tri_links, kieng_ky_links } = await yhctCatalogLinksFromExcelStrings(
        p._excel_cong_dung,
        p._excel_chu_tri,
        p._excel_kieng_ky,
    );
    return {
        ten_vi_thuoc: p.ten_vi_thuoc,
        tinh: p.tinh,
        vi: p.vi,
        quy_kinh: p.quy_kinh,
        lieu_dung: p.lieu_dung,
        ten_goi_khac_list,
        cong_dung_links,
        chu_tri_links,
        kieng_ky_links,
    };
}

function yhctNormalizeExcelRowKeys(row) {
    const o = {};
    if (!row || typeof row !== 'object') return o;
    for (const [k, v] of Object.entries(row)) {
        o[String(k).trim()] = v;
    }
    return o;
}

function yhctDevPick(r, keys) {
    for (const k of keys) {
        const v = r[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function yhctExportViThuocXlsx() {
   if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
   const data = _thuocData.viThuoc.map(v => {
       const nhomLon = yhctNhomLonNamesFromVt(v).join(', ');
       const nhomDuocLy = yhctNhomSubNamesFromVt(v).join(', ');
       return {
           'Tên vị thuốc': v.ten_vi_thuoc,
           'Tên gọi khác': yhctVtAliasDisplay(v),
           'Nhóm lớn': nhomLon,
           'Nhóm dược lý': nhomDuocLy,
           'Tính': v.tinh,
           'Vị': v.vi,
           'Quy kinh': v.quy_kinh,
           'Liều dùng': v.lieu_dung,
           'Công dụng': yhctVtCongDungExcelCell(v),
           'Chủ trị': yhctVtChuTriExcelCell(v),
           'Kiêng kỵ': yhctVtKiengKyExcelCell(v),
       };
   });
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "ViThuoc");
   XLSX.writeFile(wb, "Danh_Muc_Vi_Thuoc.xlsx");
}

function yhctExportBaiThuocXlsx() {
   if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
   const data = _thuocData.baiThuoc.map(b => {
       const tp = (b.chiTietViThuoc||[]).map(d => `${d?.viThuoc?.ten_vi_thuoc||''} (${(d?.lieu_luong||'').trim()})`).join(', ');
       return {
           'Tên bài thuốc': b.ten_bai_thuoc,
           'Nguồn gốc': b.nguon_goc,
           'Biện chứng': b.bien_chung,
           'Triệu chứng': b.trieu_chung,
           'Pháp trị': b.phap_tri,
           'Cách dùng': b.cach_dung,
           'Ghi chú': b.ghi_chu,
           'Thành phần': tp
       };
   });
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "BaiThuoc");
   XLSX.writeFile(wb, "Danh_Muc_Bai_Thuoc.xlsx");
}

function yhctImportViThuocXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        let rows = [];
        try {
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            rows = rawRows.map(yhctNormalizeExcelRowKeys);
            if (!confirm(`Tìm thấy ${rows.length} dòng. Tiến hành import (trùng tên sẽ cập nhật)?`)) { e.target.value = ''; return; }

            yhctViThuocImportSetLoading(true, `Đang nhập… 0 / ${rows.length}`);
            let created = 0, updated = 0, skipped = 0;
            let i = 0;
            for (const r of rows) {
                i++;
                yhctViThuocImportSetLoading(true, `Đang nhập… ${i} / ${rows.length}${file?.name ? '\n' + file.name : ''}`);
                const payload = await yhctViThuocPayloadFromRowResolved(r);
                if (!payload.ten_vi_thuoc) { skipped++; continue; }
                const existing = (_thuocData.viThuoc || []).find(
                    v => (v.ten_vi_thuoc || '').trim().toLowerCase() === payload.ten_vi_thuoc.toLowerCase()
                );

                if (existing?.id) {
                    const res = await apiUpdateViThuoc(existing.id, payload);
                    if (res.success) updated++;
                    else skipped++;
                } else {
                    const res = await apiCreateViThuoc(payload);
                    if (res.success) created++;
                    else skipped++;
                }
            }
            yhctViThuocImportSetLoading(false, '');
            alert(`Nhập xong: thêm ${created}, cập nhật ${updated}, bỏ qua/lỗi ${skipped}. Gán nhóm dược lý tại tab «Nhóm dược lý» (nếu file có cột Nhóm lớn / Nhóm dược lý thì chưa tự gán — cần gán tay).`);
            await loadAllThuocData();
            renderThuocSection();
        } catch (err) {
            console.error(err);
            alert('Lỗi khi nhập file: ' + (err && err.message ? err.message : err));
        } finally {
            yhctViThuocImportSetLoading(false, '');
            e.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

function yhctImportViThuocXlsxDev(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            const rows = rawRows.map(yhctNormalizeExcelRowKeys);
            if (!rows.length) {
                alert('File không có dòng dữ liệu.');
                e.target.value = '';
                return;
            }
            if (!confirm(`[dev] ${rows.length} dòng. Import/cập nhật theo cột mẫu (không gán nhóm qua file)?`)) {
                e.target.value = '';
                return;
            }

            yhctViThuocImportSetLoading(true, `[dev] Đang nhập… 0 / ${rows.length}`);
            let created = 0, updated = 0, skipped = 0;
            let i = 0;
            for (const r of rows) {
                i++;
                yhctViThuocImportSetLoading(true, `[dev] Đang nhập… ${i} / ${rows.length}`);
                const payload = await yhctViThuocPayloadFromRowResolved(r);
                if (!payload.ten_vi_thuoc) { skipped++; continue; }

                const existing = (_thuocData.viThuoc || []).find(
                    v => (v.ten_vi_thuoc || '').trim().toLowerCase() === payload.ten_vi_thuoc.toLowerCase()
                );

                if (existing?.id) {
                    const res = await apiUpdateViThuoc(existing.id, payload);
                    if (res.success) updated++;
                    else skipped++;
                } else {
                    const res = await apiCreateViThuoc(payload);
                    if (res.success) created++;
                    else skipped++;
                }
            }

            yhctViThuocImportSetLoading(false, '');
            alert(`[dev] Thêm ${created}, cập nhật ${updated}, bỏ qua/lỗi ${skipped}.`);
            await loadAllThuocData();
            renderThuocSection();
        } catch (err) {
            console.error(err);
            alert('Lỗi: ' + (err && err.message ? err.message : err));
        } finally {
            yhctViThuocImportSetLoading(false, '');
            e.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

function yhctImportBaiThuocXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if(!confirm(`Tìm thấy ${rows.length} bài thuốc. Khuyến khích không Import quá 100 dòng/lần.\nTiếp tục phân tích?`)) return e.target.value = '';

        const missingHerbsSet = new Set();
        for (const r of rows) {
            const tpText = r['Thành phần']||'';
            const tpArray = tpText.split(',').map(s=>s.trim()).filter(Boolean);
            for (const text of tpArray) {
                let m = text.match(/^(.*?)\s*\((.*?)\)$/);
                let vten = m ? m[1].trim() : text;
                if (!vten) continue;
                const exists = _thuocData.viThuoc.some(x => x.ten_vi_thuoc.toLowerCase() === vten.toLowerCase());
                if (!exists) missingHerbsSet.add(vten);
            }
        }

        if (missingHerbsSet.size > 0) {
            const missingList = Array.from(missingHerbsSet).join(', ');
            const t = confirm(`⚠️ CẢNH BÁO: ${missingHerbsSet.size} vị thuốc chưa có trong danh mục:\n[ ${missingList} ]\n\nTiếp tục và tạo mới?`);
            if (!t) { e.target.value = ''; return; }
        }

        for (const r of rows) {
            const ten = r['Tên bài thuốc'];
            if (!ten) continue;
            if (_thuocData.baiThuoc.some(b => b.ten_bai_thuoc === ten)) continue;

            const tpText = r['Thành phần']||'';
            const tpArray = tpText.split(',').map(s=>s.trim()).filter(Boolean);
            const refDetails = [];

            for (const text of tpArray) {
                let m = text.match(/^(.*?)\s*\((.*?)\)$/);
                let vten = '', lieu = '';
                if (m) {
                    vten = m[1].trim();
                    lieu = m[2].trim();
                } else {
                    vten = text;
                }

                let v = _thuocData.viThuoc.find(x => x.ten_vi_thuoc.toLowerCase() === vten.toLowerCase());
                if (!v && vten) {
                    const res = await apiCreateViThuoc({ ten_vi_thuoc: vten });
                    if (res.success) {
                        v = res.data;
                        _thuocData.viThuoc.push(v);
                    }
                }

                if (v && v.id) {
                    refDetails.push({ idViThuoc: v.id, lieu_luong: lieu });
                }
            }

            const payload = {
                ten_bai_thuoc: ten,
                nguon_goc: r['Nguồn gốc']||'',
                bien_chung: r['Biện chứng']||'',
                trieu_chung: r['Triệu chứng']||'',
                phap_tri: r['Pháp trị']||'',
                cach_dung: r['Cách dùng']||'',
                ghi_chu: r['Ghi chú']||'',
                chiTiet: refDetails
            };
            await apiCreateBaiThuoc(payload);
        }
        alert('Nhập danh mục Bài Thuốc thành công!');
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}
