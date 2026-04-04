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

/** Khối «công dụng» phân tích bài thuốc: chủ trị + kiêng kỵ gộp từ mọi vị, đã loại trùng. */
function yhctCongDungBaiThuocHtml(r) {
    const ct = r.chuTriBaiThuoc || [];
    const kk = r.kiengKyBaiThuoc || [];
    const kkChip = 'cursor:default;font-size:0.8rem;font-weight:600;padding:2px 10px;border-radius:4px;border:1px solid #E8A598;background:#FDF5F3;color:#7A2E23;';
    const ctChips = ct.map(t => `<span class="chip" style="${yhctTacdungChipStyle('nho')}">${escHtml(t)}</span>`).join('');
    const kkChips = kk.map(t => `<span class="chip" style="${kkChip}">${escHtml(t)}</span>`).join('');
    const ctBlock = ct.length
        ? `<div class="yhct-cd-section" data-expanded="0">
                <div class="yhct-cd-inner"><div style="display:flex;flex-wrap:wrap;gap:6px;">${ctChips}</div></div>
                <button type="button" class="btn btn-sm btn-outline yhct-cd-toggle" style="margin-top:6px;display:none;padding:3px 12px;font-size:0.72rem;" onclick="yhctToggleCdExpand(this)">Xem thêm</button>
            </div>`
        : '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa có chủ trị nào được gán cho các vị thuốc trong bài.</div>';
    const kkBlock = kk.length
        ? `<div class="yhct-cd-section" data-expanded="0">
                <div class="yhct-cd-inner"><div style="display:flex;flex-wrap:wrap;gap:6px;">${kkChips}</div></div>
                <button type="button" class="btn btn-sm btn-outline yhct-cd-toggle" style="margin-top:6px;display:none;padding:3px 12px;font-size:0.72rem;" onclick="yhctToggleCdExpand(this)">Xem thêm</button>
            </div>`
        : '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa có kiêng kỵ nào được gán cho các vị thuốc trong bài.</div>';
    return `
            <div style="margin-top:16px;padding-top:14px;border-top:1px dashed #E5E7EB;">
                <div style="font-weight:700;color:#5B3A1A;font-size:0.82rem;margin-bottom:10px;">Công dụng tổng hợp <span style="font-weight:400;color:#9CA3AF;font-size:0.72rem;">(chủ trị và kiêng kỵ từ các vị thuốc, không lặp)</span></div>
                <div style="margin-bottom:10px;">
                    <div style="font-size:0.76rem;font-weight:600;color:#6B7280;margin-bottom:4px;">Chủ trị</div>
                    ${ctBlock}
                </div>
                <div>
                    <div style="font-size:0.76rem;font-weight:600;color:#6B7280;margin-bottom:4px;">Kiêng kỵ</div>
                    ${kkBlock}
                </div>
            </div>`;
}

function yhctToggleCdExpand(btn) {
    const section = btn && btn.closest && btn.closest('.yhct-cd-section');
    if (!section) return;
    const inner = section.querySelector('.yhct-cd-inner');
    if (!inner) return;
    const expanded = section.getAttribute('data-expanded') === '1';
    if (expanded) {
        inner.classList.add('yhct-cd-collapsed');
        section.setAttribute('data-expanded', '0');
        btn.textContent = 'Xem thêm';
    } else {
        inner.classList.remove('yhct-cd-collapsed');
        section.setAttribute('data-expanded', '1');
        btn.textContent = 'Thu gọn';
    }
}

function yhctInitCongDungCollapse() {
    document.querySelectorAll('.yhct-cd-section').forEach(section => {
        const inner = section.querySelector('.yhct-cd-inner');
        const btn = section.querySelector('.yhct-cd-toggle');
        if (!inner || !btn) return;
        section.setAttribute('data-expanded', '0');
        inner.classList.add('yhct-cd-collapsed');
        const overflow = inner.scrollHeight > inner.clientHeight + 1;
        if (overflow) {
            btn.style.display = 'inline-block';
        } else {
            inner.classList.remove('yhct-cd-collapsed');
            btn.style.display = 'none';
        }
    });
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

/** Gộp chủ trị / kiêng kỵ từ mọi vị trong bài, bỏ trùng (so khóa chuẩn hóa chữ thường + khoảng trắng). */
function yhctBaiThuocUniqueChuTriKiengKy(items) {
    const normKey = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const addLinks = (links, namePicker, seen, acc) => {
        for (const l of links || []) {
            const n = (namePicker(l) || '').trim();
            if (!n) continue;
            const g = (l.ghi_chu || '').trim();
            const display = g ? `${n} (${g})` : n;
            const k = normKey(display);
            if (seen.has(k)) continue;
            seen.add(k);
            acc.push(display);
        }
    };
    const seenCt = new Set();
    const seenKk = new Set();
    const chuTriBaiThuoc = [];
    const kiengKyBaiThuoc = [];
    for (const { vt } of items) {
        addLinks(vt.chuTriLinks, l => l.chuTri?.ten_chu_tri || '', seenCt, chuTriBaiThuoc);
        addLinks(vt.kiengKyLinks, l => l.kiengKy?.ten_kieng_ky || '', seenKk, kiengKyBaiThuoc);
    }
    chuTriBaiThuoc.sort((a, b) => a.localeCompare(b, 'vi'));
    kiengKyBaiThuoc.sort((a, b) => a.localeCompare(b, 'vi'));
    return { chuTriBaiThuoc, kiengKyBaiThuoc };
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

/** Giống backend: trim + gộp khoảng trắng; so khớp trùng không phân biệt hoa thường. */
function yhctNormalizeCatalogLabel(s) {
    return String(s ?? '').trim().replace(/\s+/g, ' ');
}
function yhctCatalogKey(s) {
    return yhctNormalizeCatalogLabel(s).toLowerCase();
}

/** Tách ô Excel; mỗi mục chuẩn hóa và bỏ trùng trong cùng ô (vd. «A,  a , A» → một mục). */
function yhctSplitExcelCatalogParts(raw) {
    const seen = new Set();
    const out = [];
    for (const seg of String(raw || '').split(/[,，;；\n\r]+/)) {
        const n = yhctNormalizeCatalogLabel(seg);
        if (!n) continue;
        const k = yhctCatalogKey(n);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(n);
    }
    return out;
}

async function yhctEnsureCongDungId(name) {
    const n = yhctNormalizeCatalogLabel(name);
    if (!n) return null;
    const k = yhctCatalogKey(n);
    const list = _thuocData.congDung || [];
    const hit = list.find(x => yhctCatalogKey(x.ten_cong_dung) === k);
    if (hit) return hit.id;
    const res = await apiCreateCongDung({ ten_cong_dung: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_cong_dung: n, ghi_chu: '' };
    if (!list.some(x => x.id === row.id)) list.push(row);
    list.sort((a, b) => (a.ten_cong_dung || '').localeCompare(b.ten_cong_dung || '', 'vi'));
    return res.id;
}

async function yhctEnsureChuTriId(name) {
    const n = yhctNormalizeCatalogLabel(name);
    if (!n) return null;
    const k = yhctCatalogKey(n);
    const list = _thuocData.chuTri || [];
    const hit = list.find(x => yhctCatalogKey(x.ten_chu_tri) === k);
    if (hit) return hit.id;
    const res = await apiCreateChuTri({ ten_chu_tri: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_chu_tri: n, ghi_chu: '' };
    if (!list.some(x => x.id === row.id)) list.push(row);
    list.sort((a, b) => (a.ten_chu_tri || '').localeCompare(b.ten_chu_tri || '', 'vi'));
    return res.id;
}

async function yhctEnsureKiengKyId(name) {
    const n = yhctNormalizeCatalogLabel(name);
    if (!n) return null;
    const k = yhctCatalogKey(n);
    const list = _thuocData.kiengKy || [];
    const hit = list.find(x => yhctCatalogKey(x.ten_kieng_ky) === k);
    if (hit) return hit.id;
    const res = await apiCreateKiengKy({ ten_kieng_ky: n, ghi_chu: '' });
    if (!res.success) return null;
    const row = res.data || { id: res.id, ten_kieng_ky: n, ghi_chu: '' };
    if (!list.some(x => x.id === row.id)) list.push(row);
    list.sort((a, b) => (a.ten_kieng_ky || '').localeCompare(b.ten_kieng_ky || '', 'vi'));
    return res.id;
}

async function yhctCatalogLinksFromExcelStrings(congText, chuText, kiengText) {
    const cong_dung_links = [];
    const seenCd = new Set();
    for (const part of yhctSplitExcelCatalogParts(congText)) {
        const id = await yhctEnsureCongDungId(part);
        if (id != null && !seenCd.has(id)) {
            seenCd.add(id);
            cong_dung_links.push({ id_cong_dung: id, ghi_chu: '' });
        }
    }
    const chu_tri_links = [];
    const seenCt = new Set();
    for (const part of yhctSplitExcelCatalogParts(chuText)) {
        const id = await yhctEnsureChuTriId(part);
        if (id != null && !seenCt.has(id)) {
            seenCt.add(id);
            chu_tri_links.push({ id_chu_tri: id, ghi_chu: '' });
        }
    }
    const kieng_ky_links = [];
    const seenKk = new Set();
    for (const part of yhctSplitExcelCatalogParts(kiengText)) {
        const id = await yhctEnsureKiengKyId(part);
        if (id != null && !seenKk.has(id)) {
            seenKk.add(id);
            kieng_ky_links.push({ id_kieng_ky: id, ghi_chu: '' });
        }
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
    showTayyModal(`Phân tích: ${escHtml(bt.ten_bai_thuoc)}`, yhctBuildAnalysisHtml(result), 'analysis');
    setTimeout(() => yhctInitAnalysisCharts(result), 0);
}

let _yhctAnalysisCharts = [];
/** Kết quả phân tích bài thuốc đang mở (modal) — dùng cho input gram + radar. */
let _yhctCurrentBaiThuocAnalysis = null;
function yhctDestroyAnalysisCharts() {
    (_yhctAnalysisCharts || []).forEach(c => {
        if (c._yhctDragCleanup) {
            try { c._yhctDragCleanup(); } catch (_) {}
            c._yhctDragCleanup = null;
        }
        try { c.destroy(); } catch (_) {}
    });
    _yhctAnalysisCharts = [];
    _yhctCurrentBaiThuocAnalysis = null;
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
        const row = {
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
        row.nguViVec = yhctNguViVecFromViString(row.vi);
        row.tgptVec = yhctTgptVecFromItem(row);
        row.simGram = gram;
        return row;
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

    const { chuTriBaiThuoc, kiengKyBaiThuoc } = yhctBaiThuocUniqueChuTriKiengKy(items);

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
        chuTriBaiThuoc,
        kiengKyBaiThuoc,
    };
}

/** Vector 5 vị (Chua,Đắng,Ngọt,Cay,Mặn) — trọng số tương đối, không nhân liều. */
function yhctNguViVecFromViString(viRaw) {
    const parts = String(viRaw || '').split(/[,;，、]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return [0, 0, 0, 0, 0];
    const uniq = [...new Set(parts)];
    const each = 1 / uniq.length;
    const o = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 };
    uniq.forEach(v => {
        if (v.includes('chua')) o.chua += each;
        else if (v.includes('đắng') || v.includes('dang')) o.dang += each;
        else if (v.includes('ngọt') || v.includes('ngot')) o.ngot += each;
        else if (v.includes('cay')) o.cay += each;
        else if (v.includes('mặn') || v.includes('man')) o.man += each;
    });
    return [o.chua, o.dang, o.ngot, o.cay, o.man];
}

function yhctTgptVecFromItem(item) {
    const tinh = (item.tinh || '').toLowerCase();
    const nhom = (item._nhomLonText || '').toLowerCase();
    const qk = (item.quy_kinh || '').toLowerCase();
    let th = 0, ph = 0, gi = 0, tr = 0;
    if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { th += 0.35; ph += 0.35; }
    if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { gi += 0.35; tr += 0.35; }
    if (nhom.includes('giải biểu') || nhom.includes('thăng')) ph += 0.35;
    if (nhom.includes('tả hạ') || nhom.includes('giáng')) gi += 0.35;
    if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) th += 0.15;
    if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) tr += 0.15;
    const base = 0.15;
    th += base; gi += base; ph += base; tr += base;
    return [th, ph, gi, tr];
}

function yhctAddNguViToBucket(bucket, viRaw, wPct) {
    const parts = String(viRaw || '').split(/[,;，、]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    const uniq = [...new Set(parts)];
    const each = wPct / uniq.length;
    uniq.forEach(v => {
        if (v.includes('chua')) bucket.chua += each;
        else if (v.includes('đắng') || v.includes('dang')) bucket.dang += each;
        else if (v.includes('ngọt') || v.includes('ngot')) bucket.ngot += each;
        else if (v.includes('cay')) bucket.cay += each;
        else if (v.includes('mặn') || v.includes('man')) bucket.man += each;
    });
}

function yhctAddTgptToBucket(bucket, item, wPct) {
    const tinh = (item.tinh || '').toLowerCase();
    const nhom = (item._nhomLonText || '').toLowerCase();
    const qk = (item.quy_kinh || '').toLowerCase();
    if (tinh.includes('ôn') || tinh.includes('on') || tinh.includes('nóng') || tinh.includes('nong')) { bucket.thang += wPct * 0.35; bucket.phu += wPct * 0.35; }
    if (tinh.includes('hàn') || tinh.includes('han') || tinh.includes('lương') || tinh.includes('luong')) { bucket.giang += wPct * 0.35; bucket.tram += wPct * 0.35; }
    if (nhom.includes('giải biểu') || nhom.includes('thăng')) bucket.phu += wPct * 0.35;
    if (nhom.includes('tả hạ') || nhom.includes('giáng')) bucket.giang += wPct * 0.35;
    if (qk.includes('phế') || qk.includes('phe') || qk.includes('tâm')) bucket.thang += wPct * 0.15;
    if (qk.includes('thận') || qk.includes('than') || qk.includes('bàng quang') || qk.includes('bang quang')) bucket.tram += wPct * 0.15;
    const base = wPct * 0.15;
    bucket.thang += base; bucket.giang += base; bucket.phu += base; bucket.tram += base;
}

function yhctAggregateNguViFromSimGram(list) {
    const o = { chua: 0, dang: 0, ngot: 0, cay: 0, man: 0 };
    const W = list.reduce((s, v) => s + (v.simGram != null ? v.simGram : v.gram), 0) || 1;
    for (const v of list) {
        const g = v.simGram != null ? v.simGram : v.gram;
        yhctAddNguViToBucket(o, v.vi, g / W);
    }
    return o;
}

function yhctAggregateTgptFromSimGram(list) {
    const o = { thang: 0, phu: 0, giang: 0, tram: 0 };
    const W = list.reduce((s, v) => s + (v.simGram != null ? v.simGram : v.gram), 0) || 1;
    for (const v of list) {
        const g = v.simGram != null ? v.simGram : v.gram;
        yhctAddTgptToBucket(o, v, g / W);
    }
    return o;
}

function yhctNguViToRadar5(o) {
    return [o.chua || 0, o.dang || 0, o.ngot || 0, o.cay || 0, o.man || 0];
}

function yhctTgptToRadar4(o) {
    return [o.thang || 0, o.phu || 0, o.giang || 0, o.tram || 0];
}

function yhctRedistributeGramsByRadarTarget(r, kind, targetArr) {
    const list = r.viThuocList;
    const W = list.reduce((s, v) => s + (v.simGram != null ? v.simGram : v.gram), 0) || 1;
    const eps = 0.06;
    const scores = list.map(v => {
        const vec = kind === 'nguVi' ? v.nguViVec : v.tgptVec;
        let d = 0;
        for (let j = 0; j < targetArr.length; j++) d += (vec[j] || 0) * targetArr[j];
        const g = v.simGram != null ? v.simGram : v.gram;
        return d + eps * (g / W);
    });
    let sumS = scores.reduce((a, b) => a + b, 0);
    if (sumS < 1e-9) return;
    list.forEach((v, i) => { v.simGram = W * scores[i] / sumS; });
}

function yhctAnalysisSumSimGrams(r) {
    const s = (r.viThuocList || []).reduce((acc, v) => acc + (v.simGram != null ? v.simGram : v.gram), 0);
    return s > 0 ? s : (r.W || 1);
}

function yhctAnalysisUpdateDosageTable(r) {
    const W = yhctAnalysisSumSimGrams(r);
    (r.viThuocList || []).forEach(v => {
        const tr = document.querySelector(`tr[data-yhct-vt-id="${v.id}"]`);
        if (!tr) return;
        const g = v.simGram != null ? v.simGram : v.gram;
        const gramEl = tr.querySelector('.yhct-analysis-gram');
        const pctEl = tr.querySelector('.yhct-analysis-pct');
        if (gramEl) {
            if (gramEl.tagName === 'INPUT') {
                if (document.activeElement !== gramEl) gramEl.value = String(Math.round(g * 10) / 10);
            } else {
                gramEl.textContent = `${g.toFixed(1)}g`;
            }
        }
        if (pctEl) pctEl.textContent = W > 0 ? `${Math.round(g / W * 100)}%` : '—';
    });
    const tot = document.getElementById('yhct-analysis-total-g');
    if (tot) tot.textContent = `Tổng ≈ ${W.toFixed(1)}g`;
}

/** Gõ gram trong bảng phân tích — đồng bộ %, tổng và radar nét đứt. */
function yhctAnalysisGramInput(ev) {
    const inp = ev && ev.target;
    const r = _yhctCurrentBaiThuocAnalysis;
    if (!inp || !r) return;
    const id = Number(inp.dataset.vtId);
    const v = (r.viThuocList || []).find(x => x.id === id);
    if (!v) return;
    const raw = parseFloat(String(inp.value).replace(',', '.'));
    v.simGram = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    yhctAnalysisUpdateDosageTable(r);
    yhctRefreshInteractiveRadarOverlays(r);
}

function yhctSimGramsDirty(r) {
    return (r.viThuocList || []).some(v => Math.abs((v.simGram != null ? v.simGram : v.gram) - v.gram) > 0.02);
}

function yhctRefreshInteractiveRadarOverlays(analysisResult) {
    const dirty = yhctSimGramsDirty(analysisResult);
    for (const c of _yhctAnalysisCharts) {
        if (!c._yhctRadarKind || !c.data.datasets[1]) continue;
        const agg = c._yhctRadarKind === 'nguVi'
            ? yhctAggregateNguViFromSimGram(analysisResult.viThuocList)
            : yhctAggregateTgptFromSimGram(analysisResult.viThuocList);
        const arr = c._yhctRadarKind === 'nguVi' ? yhctNguViToRadar5(agg) : yhctTgptToRadar4(agg);
        c.data.datasets[1].data = arr.map(x => Number(x) || 0);
        c.data.datasets[1].hidden = !dirty;
        c.update('none');
    }
}

function yhctRadarValueFromPointer(chart, datasetIndex, index, pos) {
    const scale = chart.scales.r;
    const meta = chart.getDatasetMeta(datasetIndex);
    const el = meta.data[index];
    if (!el || el.skip) return null;
    const center = scale.getCenterPoint();
    const vx = el.x - center.x;
    const vy = el.y - center.y;
    const vlen = Math.hypot(vx, vy);
    if (vlen < 1e-6) return scale.min;
    const ux = vx / vlen, uy = vy / vlen;
    const relx = pos.x - center.x, rely = pos.y - center.y;
    let distAlong = relx * ux + rely * uy;
    distAlong = Math.max(0, distAlong);
    let val;
    if (typeof scale.getValueForDistanceFromCenter === 'function') {
        val = scale.getValueForDistanceFromCenter(distAlong);
    } else {
        const d0 = scale.getDistanceFromCenterForValue(scale.min);
        const d1 = scale.getDistanceFromCenterForValue(scale.max);
        const t = Math.abs(d1 - d0) < 1e-9 ? 0 : (distAlong - d0) / (d1 - d0);
        val = scale.min + t * (scale.max - scale.min);
    }
    return Math.max(scale.min, Math.min(scale.max, val));
}

function yhctBuildAnalysisHtml(r) {
    if (r.empty) return `<div style="text-align:center;padding:40px;color:#A09580;font-style:italic;">
        Bài thuốc chưa có vị thuốc.</div>`;

    const roleOrder = {Quân:0,Thần:1,Tá:2,Sứ:3};
    const sortedVt = [...r.viThuocList].sort((a,b)=>(roleOrder[a.vai_tro]||3)-(roleOrder[b.vai_tro]||3)||b.gram-a.gram);
    const W = r.W || 1;
    const vtRows = sortedVt.map(v=>`
        <tr data-yhct-vt-id="${v.id}">
            <td style="padding:5px 8px;font-weight:600;">${escHtml(v.ten)}</td>
            <td style="padding:4px 6px;text-align:center;">
                <input type="number" class="yhct-analysis-gram yhct-analysis-gram-input" data-vt-id="${v.id}"
                    value="${(v.simGram != null ? v.simGram : v.gram).toFixed(1)}" min="0" step="0.1"
                    title="Giả lập liều lượng (gram)"
                    style="width:72px;max-width:100%;box-sizing:border-box;text-align:center;padding:5px 6px;border:1px solid #D4C5A0;border-radius:6px;font-size:0.8rem;background:#FFFCF7;color:#1F1410;"
                    oninput="yhctAnalysisGramInput(event)" />
            </td>
            <td class="yhct-analysis-pct" style="padding:5px 8px;text-align:center;">${Math.round((v.simGram != null ? v.simGram : v.gram) / W * 100)}%</td>
            <td style="padding:5px 8px;text-align:center;">
                <span style="background:${v.color};color:#fff;border-radius:10px;padding:2px 9px;font-size:0.75rem;font-weight:700;">${escHtml(v.vai_tro)}</span>
            </td>
            <td style="padding:5px 8px;vertical-align:top;max-width:280px;">${yhctInlineChipsFromStrings(v.nhomSubs || [])}</td>
            <td style="padding:5px 8px;font-size:0.72rem;color:#8B7355;">${escHtml(v.quy_kinh||'—')}</td>
        </tr>`).join('');

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
    <style>
    @media (max-width: 900px) {
        .yhct-analysis-layout { grid-template-columns: 1fr !important; }
        .yhct-analysis-dosage { position: relative !important; top: auto !important; max-height: none !important; }
    }
    .yhct-cd-collapsed {
        max-height: 4.35rem;
        overflow: hidden;
        position: relative;
    }
    .yhct-cd-collapsed::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1.1rem;
        background: linear-gradient(to bottom, rgba(255,255,255,0), #ffffff);
        pointer-events: none;
    }
    </style>
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px;background:#fff;margin-bottom:12px;">
        <div style="font-weight:700;color:#374151;font-size:0.9rem;margin-bottom:10px;">1) Phân tích Tứ khí</div>
        <div style="border:1px solid #D1D5DB;border-radius:8px;overflow:hidden;background:#fff;">
            <div style="display:flex;min-height:26px;">${tuKhiArrows}</div>
            <div style="display:flex;">${tuKhiColors}</div>
            <div style="display:flex;background:#FAFAF8;">${tuKhiLabels}</div>
        </div>
    </div>
    <div class="yhct-analysis-layout" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,38%);gap:16px;align-items:start;margin-bottom:14px;">
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0;">
            <div style="display:grid;grid-template-columns:minmax(120px,20%) minmax(0,1fr);gap:12px;align-items:center;border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;background:#fff;">
                <div style="min-width:0;">
                    <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;">2) Ngũ vị</div>
                    <div style="font-size:0.62rem;color:#9CA3AF;margin-top:4px;line-height:1.3;">Liền nét = gốc · Nét đứt = kéo giả lập.</div>
                </div>
                <div style="height:200px;min-height:160px;position:relative;width:100%;box-sizing:border-box;">
                    <canvas id="yhct-radar-nguvi" style="display:block;width:100%;height:100%;"></canvas>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:minmax(120px,20%) minmax(0,1fr);gap:12px;align-items:center;border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;background:#fff;">
                <div style="min-width:0;font-weight:700;color:#5B3A1A;font-size:0.85rem;">3) Quy kinh</div>
                <div style="height:200px;min-height:160px;position:relative;width:100%;box-sizing:border-box;">
                    <canvas id="yhct-radar-quykinh" style="display:block;width:100%;height:100%;"></canvas>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:minmax(120px,20%) minmax(0,1fr);gap:12px;align-items:center;border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;background:#fff;">
                <div style="min-width:0;">
                    <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;">4) Thăng – Giáng – Phù – Trầm</div>
                    <div style="font-size:0.62rem;color:#9CA3AF;margin-top:4px;line-height:1.3;">Liền nét = gốc · Nét đứt = kéo giả lập.</div>
                </div>
                <div style="height:200px;min-height:160px;position:relative;width:100%;box-sizing:border-box;">
                    <canvas id="yhct-radar-tgpt" style="display:block;width:100%;height:100%;"></canvas>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:minmax(120px,20%) minmax(0,1fr);gap:12px;align-items:start;border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;background:#fff;">
                <div style="min-width:0;line-height:1.35;">
                    <div style="font-weight:700;color:#5B3A1A;font-size:0.85rem;">5) Tác dụng YHCT</div>
                    <div style="margin-top:6px;font-weight:800;font-size:1.02rem;color:#1F1410;letter-spacing:-0.02em;">${escHtml(r.ten || '—')}</div>
                </div>
                <div style="min-width:0;max-height:min(52vh,420px);overflow-y:auto;padding-right:4px;">
                    ${(r.tacDungYhctNhomNho && r.tacDungYhctNhomNho.length)
                        ? `<div style="display:flex;flex-wrap:wrap;gap:6px;padding:2px 0;">${
                            r.tacDungYhctNhomNho.map(n => `<span class="chip" style="${yhctTacdungChipStyle('nho')}">${escHtml(n)}</span>`).join('')
                        }</div>`
                        : '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa có nhóm nhỏ nào được gán. Gán vị thuốc trong tab «Nhóm dược lý».</div>'}
                    <div style="margin-top:12px;">${yhctNhomLonChipsHtml(r.tacDungYhctNhomLon || [])}</div>
                    <div style="margin-top:12px;">${yhctPhapTriChipsHtml(r.phapTriBaiThuoc)}</div>
                    ${yhctCongDungBaiThuocHtml(r)}
                </div>
            </div>
        </div>
        <div class="yhct-analysis-dosage" style="position:sticky;top:0;align-self:start;border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px;background:#fff;max-height:min(88vh, calc(94vh - 100px));overflow:auto;min-width:0;box-sizing:border-box;">
            <div style="font-weight:700;color:#5B3A1A;font-size:0.88rem;margin-bottom:6px;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;">
                <span>Quân–Thần–Tá–Sứ</span>
                <span id="yhct-analysis-total-g" style="font-weight:400;font-size:0.74rem;color:#9CA3AF;">Tổng ≈ ${r.W.toFixed(1)}g</span>
                <span style="font-weight:500;font-size:0.72rem;color:#8B6914;font-style:italic;">Gia giảm tùy chỉnh</span>
            </div>
            <div style="font-size:0.68rem;color:#9CA3AF;margin-bottom:10px;line-height:1.35;">Sửa Gram để giả lập; % và radar nét đứt đồng bộ.</div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
                    <thead><tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB;">
                        <th style="padding:6px 6px;text-align:left;">Vị thuốc</th>
                        <th style="padding:6px 6px;text-align:center;">Gram</th>
                        <th style="padding:6px 6px;text-align:center;">%</th>
                        <th style="padding:6px 6px;text-align:center;">Vai trò</th>
                        <th style="padding:6px 6px;text-align:left;">Nhóm nhỏ</th>
                        <th style="padding:6px 6px;text-align:left;">Quy kinh</th>
                    </tr></thead>
                    <tbody>${vtRows}</tbody>
                </table>
            </div>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:4px;">
        <button class="btn" onclick="closeTayyModal()">Đóng</button>
    </div>`;
}

function yhctInitAnalysisCharts(r) {
    if (typeof Chart === 'undefined') return;
    yhctDestroyAnalysisCharts();
    _yhctCurrentBaiThuocAnalysis = r;

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

    /** Tọa độ theo pixel buffer canvas (trùng với meta.data[].x/y) — tránh lệch DPR / CSS. */
    const eventToCanvasPixels = (chart, e) => {
        const cvs = chart.canvas;
        const rect = cvs.getBoundingClientRect();
        const cx = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const cy = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const sx = cvs.width / Math.max(rect.width, 1);
        const sy = cvs.height / Math.max(rect.height, 1);
        return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
    };

    const mkInteractiveRadar = (canvasId, labels, baseArr, color, analysisResult, kind) => {
        const el = document.getElementById(canvasId);
        if (!el) return;
        const baseData = baseArr.map(x => Number(x) || 0);
        const simData = baseData.slice();
        const chart = new Chart(el.getContext('2d'), {
            type: 'radar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'calc',
                        data: baseData,
                        borderColor: color,
                        backgroundColor: color.replace('1)', '0.12)'),
                        borderWidth: 2,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointHitRadius: 24,
                    },
                    {
                        label: 'sim',
                        data: simData,
                        borderColor: color.replace('1)', '0.85)'),
                        backgroundColor: color.replace('1)', '0.06)'),
                        borderWidth: 2.5,
                        borderDash: [5, 4],
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointHitRadius: 24,
                        hidden: true,
                    },
                ],
            },
            options: {
                ...baseRadarOptions,
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
            },
        });
        _yhctAnalysisCharts.push(chart);

        let dragIdx = -1;
        let activePointerId = null;

        /** Chọn trục theo góc; không dùng dMax cố định (trước đây làm mọi click bị từ chối). */
        const nearestPointIndex = (pos) => {
            const dsIdx = chart.data.datasets[1].hidden ? 0 : 1;
            const meta = chart.getDatasetMeta(dsIdx);
            const scale = chart.scales.r;
            const center = scale.getCenterPoint();
            const dx = pos.x - center.x;
            const dy = pos.y - center.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 12) return -1;
            let maxR = 0;
            for (let i = 0; i < meta.data.length; i++) {
                const pt = meta.data[i];
                if (!pt || pt.skip) continue;
                maxR = Math.max(maxR, Math.hypot(pt.x - center.x, pt.y - center.y));
            }
            if (maxR > 0 && dist > maxR + 72) return -1;
            const clickAng = Math.atan2(dy, dx);
            let bestIdx = -1;
            let bestDiff = Infinity;
            for (let i = 0; i < meta.data.length; i++) {
                const pt = meta.data[i];
                if (!pt || pt.skip) continue;
                const a = Math.atan2(pt.y - center.y, pt.x - center.x);
                let diff = Math.abs(clickAng - a);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;
                if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
            }
            return bestIdx;
        };

        const applyDragAtIndex = (idx, pos) => {
            const dsIdx = chart.data.datasets[1].hidden ? 0 : 1;
            const agg = kind === 'nguVi'
                ? yhctAggregateNguViFromSimGram(analysisResult.viThuocList)
                : yhctAggregateTgptFromSimGram(analysisResult.viThuocList);
            const target = (kind === 'nguVi' ? yhctNguViToRadar5(agg) : yhctTgptToRadar4(agg)).slice();
            const v = yhctRadarValueFromPointer(chart, dsIdx, idx, pos);
            if (v == null) return;
            target[idx] = v;
            yhctRedistributeGramsByRadarTarget(analysisResult, kind, target);
            yhctAnalysisUpdateDosageTable(analysisResult);
            yhctRefreshInteractiveRadarOverlays(analysisResult);
        };

        const canvas = chart.canvas;
        chart._yhctRadarKind = kind;
        chart._yhctAnalysisResult = analysisResult;
        canvas.style.cursor = 'grab';
        canvas.style.touchAction = 'none';

        const endDrag = () => {
            dragIdx = -1;
            activePointerId = null;
        };

        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            const pos = eventToCanvasPixels(chart, e);
            const idx = nearestPointIndex(pos);
            if (idx < 0) return;
            dragIdx = idx;
            activePointerId = e.pointerId;
            try {
                if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);
            } catch (_) {}
            applyDragAtIndex(idx, pos);
        };

        const onPointerMove = (e) => {
            if (dragIdx < 0) return;
            if (activePointerId != null && e.pointerId !== activePointerId) return;
            if (e.cancelable) e.preventDefault();
            applyDragAtIndex(dragIdx, eventToCanvasPixels(chart, e));
        };

        const onPointerUp = (e) => {
            if (activePointerId != null && e.pointerId === activePointerId) {
                try {
                    if (typeof canvas.releasePointerCapture === 'function') canvas.releasePointerCapture(e.pointerId);
                } catch (_) {}
            }
            endDrag();
        };

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);
        canvas.addEventListener('lostpointercapture', onPointerUp);

        chart._yhctDragCleanup = () => {
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
            canvas.removeEventListener('lostpointercapture', onPointerUp);
            delete chart._yhctRadarKind;
            delete chart._yhctAnalysisResult;
        };
    };

    const nguVi = r.nguVi || {};
    mkInteractiveRadar(
        'yhct-radar-nguvi',
        ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn'],
        [nguVi.chua || 0, nguVi.dang || 0, nguVi.ngot || 0, nguVi.cay || 0, nguVi.man || 0],
        'rgba(239, 68, 68, 1)',
        r,
        'nguVi'
    );

    mkRadar('yhct-radar-quykinh',
        YHCT_KINH_ORDER,
        YHCT_KINH_ORDER.map(k => r.quyKinhNorm?.[k] || 0),
        'rgba(234, 179, 8, 1)'
    );

    const tgpt = r.tgpt || {};
    mkInteractiveRadar(
        'yhct-radar-tgpt',
        ['Thăng', 'Phù', 'Giáng', 'Trầm'],
        [tgpt.thang || 0, tgpt.phu || 0, tgpt.giang || 0, tgpt.tram || 0],
        'rgba(59, 130, 246, 1)',
        r,
        'tgpt'
    );

    requestAnimationFrame(() => {
        (_yhctAnalysisCharts || []).forEach(ch => { try { ch.resize(); } catch (_) {} });
        requestAnimationFrame(() => { yhctInitCongDungCollapse(); });
    });
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
            <td style="font-size:0.78rem;">${escHtml(item.cach_dung||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.ghi_chu||'—')}</td>
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
                    <th>Triệu chứng</th><th>Pháp trị</th><th>Cách dùng</th><th>Ghi chú</th><th>Thành phần</th>
                    <th style="width:180px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="9" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
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

/** Overlay loading khi nhập Excel bài thuốc (cùng spinner với import vị thuốc). */
function yhctBaiThuocImportSetLoading(show, message) {
    let el = document.getElementById('yhct-bt-import-loading');
    if (!el) {
        el = document.createElement('div');
        el.id = 'yhct-bt-import-loading';
        el.style.cssText = [
            'display:none', 'position:fixed', 'inset:0', 'z-index:99999',
            'background:rgba(245,240,232,.88)', 'backdrop-filter:blur(3px)',
            'align-items:center', 'justify-content:center', 'flex-direction:column', 'gap:14px',
        ].join(';');
        el.innerHTML = `
            <div style="width:46px;height:46px;border:4px solid #E2D4B8;border-top-color:#5B3A1A;border-radius:50%;
                animation:yhctVtImportSpin .8s linear infinite;"></div>
            <div id="yhct-bt-import-loading-msg" style="font-weight:700;color:#5B3A1A;font-size:0.95rem;text-align:center;max-width:min(420px,92vw);line-height:1.45;"></div>`;
        document.body.appendChild(el);
        if (!document.getElementById('yhct-vt-import-spin-style')) {
            const st = document.createElement('style');
            st.id = 'yhct-vt-import-spin-style';
            st.textContent = '@keyframes yhctVtImportSpin{to{transform:rotate(360deg)}}';
            document.head.appendChild(st);
        }
    }
    const msgEl = document.getElementById('yhct-bt-import-loading-msg');
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

/** Liều trong ngoặc: *, #, X tiền, X lượng, X g (còn lại coi là ghi chú — bỏ qua). */
function yhctExcelIsLieuToken(raw) {
    const t = String(raw || '').trim();
    if (!t) return false;
    const s = t.replace(/\u00a0/g, ' ').replace(/＊/g, '*').replace(/＃/g, '#').trim();
    const low = s.toLowerCase();
    if (s === '*' || s === '#') return true;
    if (/^[\d.,]+\s*(tiền|tien)$/.test(low)) return true;
    if (/^[\d.,]+\s*(lượng|luong)$/.test(low)) return true;
    if (/^[\d.,]+\s*g$/.test(low)) return true;
    return false;
}

/** Tách ô «Thành phần»: dấu phẩy / chấm phẩy / xuống dòng (kể cả dấu toàn bộ Unicode). */
function yhctSplitThanhPhanExcel(tpText) {
    const s = String(tpText || '').trim();
    if (!s) return [];
    return s.split(/[,，;；\r\n]+/).map(x => x.trim()).filter(Boolean);
}

/**
 * Một mục thành phần: «Tên (ghi chú)… (liều)» — tên = phần ngoài mọi ngoặc;
 * liều = cụm trong ngoặc đúng mẫu liều, ưu tiên cụm liều ngoặc ngoài cùng bên phải.
 */
function yhctParseThanhPhanSegment(segment) {
    const s = String(segment || '').trim();
    if (!s) return null;
    const parenRegex = /\(([^)]*)\)/g;
    const groups = [];
    let m;
    while ((m = parenRegex.exec(s)) !== null) {
        groups.push(String(m[1]).trim());
    }
    const tenViThuoc = s.replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, ' ');
    if (!tenViThuoc) return null;
    let lieu_luong = '';
    for (let i = groups.length - 1; i >= 0; i--) {
        if (yhctExcelIsLieuToken(groups[i])) {
            lieu_luong = groups[i].replace(/\u00a0/g, ' ').replace(/＊/g, '*').replace(/＃/g, '#').trim();
            break;
        }
    }
    return { tenViThuoc, lieu_luong };
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
            if (!confirm(`Tìm thấy ${rows.length} dòng. Form mẫu: Tên bài thuốc, Nguồn gốc, …, Thành phần (tách bởi dấu phẩy/chấm phẩy; trong ngoặc: ghi chú bỏ qua, liều dạng *, #, X tiền…).\nBài đã có (trùng tên) sẽ được cập nhật theo file.\nKhuyến khích không import quá 100 dòng/lần.\nTiếp tục?`)) {
                e.target.value = '';
                return;
            }

            const missingHerbsSet = new Set();
            for (const r of rows) {
                const tpText = yhctDevPick(r, ['Thành phần', 'Thanh phan', 'Thành phan vi thuoc']);
                for (const seg of yhctSplitThanhPhanExcel(tpText)) {
                    const parsed = yhctParseThanhPhanSegment(seg);
                    if (!parsed?.tenViThuoc) continue;
                    const vten = parsed.tenViThuoc;
                    const exists = (_thuocData.viThuoc || []).some(
                        x => (x.ten_vi_thuoc || '').trim().toLowerCase() === vten.toLowerCase()
                    );
                    if (!exists) missingHerbsSet.add(vten);
                }
            }

            if (missingHerbsSet.size > 0) {
                const missingList = Array.from(missingHerbsSet).join(', ');
                const t = confirm(
                    `⚠️ ${missingHerbsSet.size} vị thuốc chưa có trong danh mục:\n[ ${missingList} ]\n\nTiếp tục và tạo mới các vị này?`
                );
                if (!t) {
                    e.target.value = '';
                    return;
                }
            }

            const totalRows = rows.length;
            const fileHint = file?.name ? `\n${file.name}` : '';
            yhctBaiThuocImportSetLoading(true, `Đang nhập bài thuốc… 0 / ${totalRows}${fileHint}`);

            let created = 0, updated = 0, skippedErr = 0, skippedEmpty = 0;

            for (let idx = 0; idx < rows.length; idx++) {
                const r = rows[idx];
                yhctBaiThuocImportSetLoading(
                    true,
                    `Đang nhập bài thuốc… ${idx + 1} / ${totalRows}${fileHint}`
                );
                const ten = yhctDevPick(r, ['Tên bài thuốc', 'Ten bai thuoc', 'Ten bài thuốc']);
                if (!ten) {
                    skippedEmpty++;
                    continue;
                }
                const tenNorm = ten.trim();

                const tpText = yhctDevPick(r, ['Thành phần', 'Thanh phan', 'Thành phan vi thuoc']);
                const chi_tiet = [];

                for (const seg of yhctSplitThanhPhanExcel(tpText)) {
                    const parsed = yhctParseThanhPhanSegment(seg);
                    if (!parsed?.tenViThuoc) continue;
                    const vten = parsed.tenViThuoc;
                    const lieu_luong = parsed.lieu_luong || '';

                    let v = (_thuocData.viThuoc || []).find(
                        x => (x.ten_vi_thuoc || '').trim().toLowerCase() === vten.toLowerCase()
                    );
                    if (!v) {
                        const res = await apiCreateViThuoc({ ten_vi_thuoc: vten });
                        if (res.success && res.data) {
                            v = res.data;
                            _thuocData.viThuoc.push(v);
                        }
                    }

                    if (v && v.id) {
                        const row = { id_vi_thuoc: v.id, idViThuoc: v.id };
                        if (lieu_luong) row.lieu_luong = lieu_luong;
                        chi_tiet.push(row);
                    }
                }

                const payload = {
                    ten_bai_thuoc: tenNorm,
                    nguon_goc: yhctDevPick(r, ['Nguồn gốc', 'Nguon goc']) || '',
                    bien_chung: yhctDevPick(r, ['Biện chứng', 'Bien chung']) || '',
                    trieu_chung: yhctDevPick(r, ['Triệu chứng', 'Trieu chung']) || '',
                    phap_tri: yhctDevPick(r, ['Pháp trị', 'Phap tri']) || '',
                    cach_dung: yhctDevPick(r, ['Cách dùng', 'Cach dung']) || '',
                    ghi_chu: yhctDevPick(r, ['Ghi chú', 'Ghi chu']) || '',
                    chi_tiet,
                };

                const existingBt = (_thuocData.baiThuoc || []).find(
                    b => (b.ten_bai_thuoc || '').trim().toLowerCase() === tenNorm.toLowerCase()
                );

                if (existingBt?.id) {
                    const res = await apiUpdateBaiThuoc(existingBt.id, payload);
                    if (res.success) {
                        updated++;
                        if (res.data) {
                            const i = _thuocData.baiThuoc.findIndex(b => b.id === existingBt.id);
                            if (i >= 0) _thuocData.baiThuoc[i] = res.data;
                        }
                    } else skippedErr++;
                } else {
                    const res = await apiCreateBaiThuoc(payload);
                    if (res.success) {
                        created++;
                        if (res.data) _thuocData.baiThuoc.push(res.data);
                    } else skippedErr++;
                }
            }

            yhctBaiThuocImportSetLoading(true, 'Đang tải lại danh mục…');
            await loadAllThuocData();
            renderThuocSection();
            yhctBaiThuocImportSetLoading(false, '');

            alert(
                `Nhập xong bài thuốc: thêm ${created} bài, cập nhật ${updated} bài.` +
                    (skippedEmpty ? ` Dòng thiếu tên: ${skippedEmpty}.` : '') +
                    (skippedErr ? ` Lỗi API: ${skippedErr}.` : '')
            );
        } catch (err) {
            console.error(err);
            alert('Lỗi khi nhập file: ' + (err && err.message ? err.message : err));
        } finally {
            yhctBaiThuocImportSetLoading(false, '');
            e.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}
