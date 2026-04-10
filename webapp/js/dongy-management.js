// dongy-management.js — Quản lý Danh mục Đông Y đa tầng
// Bao gồm: Bệnh, Kinh mạch, Huyệt vị, Vị thuốc, Bài thuốc, Phác đồ

let _dongyData = {
    benhDongY: [],
    kinhMach: [],
    huyetVi: [],
    phacDo: [],
    phacDoChuan: [],
    activeTab: 'benh-dong-y',
};

// Draft danh sách "phương huyệt" đang được chỉnh trong modal edit bệnh đông y
// Mỗi dòng = 1 huyệt (tương tự cách bạn muốn ở danh mục vị thuốc)
let _dhDraftPhuongHuyet = [];

// Draft phương huyệt riêng trong modal tab Phác đồ điều trị (phac_do_chuan)
let _pdcDraftPhuongHuyet = [];

/** Triệu chứng dạng chip trong form danh mục bệnh Đông y (đồng bộ cách tách với backend sync → phap_tri) */
let _dyTrieuChungChips = [];
/** Bài thuốc dạng chip trong form danh mục bệnh Đông y */
let _dyBaiThuocChips = [];

function dyTrieuChungTextToChips(raw) {
    if (raw == null) return [];
    const s = String(raw).trim();
    if (!s) return [];
    const parts = s
        .split(/[\n\r,;，、]+/)
        .map((t) => t.replace(/^\s*[-•*·]\s+/, '').trim())
        .filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const p of parts) {
        if (seen.has(p)) continue;
        seen.add(p);
        out.push(p);
    }
    return out;
}

function dyTrieuChungChipsToString() {
    return (_dyTrieuChungChips || []).map((x) => String(x).trim()).filter(Boolean).join(', ');
}

function dyRemoveTrieuChungChip(term) {
    _dyTrieuChungChips = (_dyTrieuChungChips || []).filter((x) => x !== term);
    dyRenderTrieuChungChips();
}

function dyOnTrieuChungChipKeydown(ev) {
    if (ev.key === 'Enter' && ev.target.value.trim()) {
        ev.preventDefault();
        const inp = document.getElementById('dy-inp-trieuchung');
        if (!inp) return;
        const v = inp.value.trim();
        if (!v) return;
        if (!_dyTrieuChungChips.includes(v)) _dyTrieuChungChips.push(v);
        inp.value = '';
        dyRenderTrieuChungChips();
    }
}

function dyRenderTrieuChungChips() {
    const container = document.getElementById('dy-chips-trieuchung');
    const input = document.getElementById('dy-inp-trieuchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach((c) => c.remove());
    (_dyTrieuChungChips || []).forEach((term) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(term + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = (e) => {
            e.stopPropagation();
            dyRemoveTrieuChungChip(term);
        };
        chip.appendChild(x);
        container.insertBefore(chip, input);
    });
}

function dyTrieuChungTablePreview(raw) {
    const parts = dyTrieuChungTextToChips(raw);
    if (!parts.length) return '<span style="color:#D1D5DB">—</span>';
    return `<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:320px;align-items:flex-start;">${parts
        .map((p) => `<span class="chip" style="cursor:default;font-size:0.68rem;">${escHtml(p)}</span>`)
        .join('')}</div>`;
}

function dyBaiThuocTextToChips(raw) {
    if (raw == null) return [];
    const s = String(raw).trim();
    if (!s) return [];
    const parts = s
        .split(/[\n\r,;，、]+/)
        .map((t) => t.replace(/^\s*[-•*·]\s+/, '').trim())
        .filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const p of parts) {
        if (seen.has(p)) continue;
        seen.add(p);
        out.push(p);
    }
    return out;
}

function dyBaiThuocChipsToString() {
    return (_dyBaiThuocChips || []).map((x) => String(x).trim()).filter(Boolean).join(', ');
}

function dyRemoveBaiThuocChip(term) {
    _dyBaiThuocChips = (_dyBaiThuocChips || []).filter((x) => x !== term);
    dyRenderBaiThuocChips();
}

function dyOnBaiThuocChipKeydown(ev) {
    if (ev.key === 'Enter' && ev.target.value.trim()) {
        ev.preventDefault();
        const inp = document.getElementById('dy-inp-baithuoc');
        if (!inp) return;
        const v = inp.value.trim();
        if (!v) return;
        if (!_dyBaiThuocChips.includes(v)) _dyBaiThuocChips.push(v);
        inp.value = '';
        dyRenderBaiThuocChips();
    }
}

function dyRenderBaiThuocChips() {
    const container = document.getElementById('dy-chips-baithuoc');
    const input = document.getElementById('dy-inp-baithuoc');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach((c) => c.remove());
    (_dyBaiThuocChips || []).forEach((term) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.appendChild(document.createTextNode(term + ' '));
        const x = document.createElement('span');
        x.className = 'chip-remove';
        x.textContent = '×';
        x.onclick = (e) => {
            e.stopPropagation();
            dyRemoveBaiThuocChip(term);
        };
        chip.appendChild(x);
        container.insertBefore(chip, input);
    });
}

function dyBaiThuocTablePreview(raw) {
    const parts = dyBaiThuocTextToChips(raw);
    if (!parts.length) return '<span style="color:#D1D5DB">—</span>';
    return `<div style="display:flex;flex-wrap:wrap;gap:4px;max-width:320px;align-items:flex-start;">${parts
        .map((p) => `<span class="chip" style="cursor:default;font-size:0.68rem;">${escHtml(p)}</span>`)
        .join('')}</div>`;
}

// ─── Khởi tạo ─────────────────────────────────────────────
async function initDongyManagement() {
    await loadAllDongyData();
    renderDongySection();
}

async function loadAllDongyData() {
    try {
        const [bdy, km, hv, pd, pdc] = await Promise.all([
            apiGetModels(),      // benh_dong_y
            apiGetKinhMach(),
            apiGetHuyetVi(),
            apiGetPhacDo(),
            apiGetPhacDoChuan(),
        ]);
        _dongyData.benhDongY = bdy || [];
        _dongyData.kinhMach = km || [];
        _dongyData.huyetVi = hv || [];
        _dongyData.phacDo = pd || [];
        _dongyData.phacDoChuan = pdc || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Đông y:', e);
    }
}

// ─── Render section chính ─────────────────────────────────
function renderDongySection() {
    const container = document.getElementById('dongy-section');
    if (!container) return;

    const tab = _dongyData.activeTab;
    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin:0;">Hệ Thống Quản Lý Bệnh Kinh Lạc</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border); overflow-x:auto; white-space:nowrap;">
                <button class="tayy-tab ${tab === 'benh-dong-y' ? 'active' : ''}" onclick="switchDongyTab('benh-dong-y')">Danh mục bệnh</button>
                <button class="tayy-tab ${tab === 'kinh-mach' ? 'active' : ''}" onclick="switchDongyTab('kinh-mach')">Kinh mạch</button>
                <button class="tayy-tab ${tab === 'huyet-vi' ? 'active' : ''}" onclick="switchDongyTab('huyet-vi')">Huyệt vị</button>
                <button class="tayy-tab ${tab === 'phac-do-chuan' ? 'active' : ''}" onclick="switchDongyTab('phac-do-chuan')">Phác đồ điều trị</button>
            </div>

            <div id="dongy-tab-content"></div>
        </div>
    `;

    renderDongyTabContent();
}

function switchDongyTab(tab) {
    _dongyData.activeTab = tab;
    renderDongySection();
}

function renderDongyTabContent() {
    const el = document.getElementById('dongy-tab-content');
    if (!el) return;

    switch (_dongyData.activeTab) {
        case 'benh-dong-y': renderBenhDongYTab(el); break;
        case 'kinh-mach': renderKinhMachTab(el); break;
        case 'huyet-vi': renderHuyetViTab(el); break;
        case 'phac-do-chuan': renderPhacDoChuanTab(el); break;
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: DANH MỤC BỆNH (BENH DONG Y) — tieuket, trieuchung, benhly, phụyết, giải nghĩa phương huyệt
// ═══════════════════════════════════════════════════════════

function dyCellLongText(v) {
    const s = v == null ? '' : String(v);
    if (!s.trim()) return '<span style="color:#D1D5DB">—</span>';
    return `<div style="max-height:100px;min-width:120px;max-width:320px;overflow-y:auto;font-size:0.78rem;line-height:1.4;padding-right:6px;white-space:pre-wrap;">${escHtml(s)}</div>`;
}

function dyCellShortText(v) {
    const s = v == null ? '' : String(v);
    if (!s.trim()) return '<span style="color:#D1D5DB">—</span>';
    return `<span style="font-size:0.82rem;">${escHtml(s)}</span>`;
}

/** Chuẩn hóa 5 trường từ bản ghi (apiGetModels đã map legacy: ten, phaptri, phuonghuyet…). */
function dyBenhDisplayFields(item) {
    if (!item) {
        return { tieuket: '', trieuchung: '', benhly: '', phuyet_chamcuu: '', giainghia_phuyet: '', bai_thuoc: '', chung_trang: '' };
    }
    return {
        tieuket: String(item.tieuket || item.ten || '').trim(),
        trieuchung: String(item.trieuchung || '').trim(),
        benhly: String(item.benhly ?? item.phaptri ?? '').trim(),
        phuyet_chamcuu: String(item.phuyet_chamcuu ?? item.phuonghuyet ?? '').trim(),
        giainghia_phuyet: String(item.giainghia_phuyet ?? '').trim(),
        bai_thuoc: String(item.bai_thuoc ?? '').trim(),
        chung_trang: String(item.chung_trang ?? '').trim(),
    };
}

function renderBenhDongYTab(el) {
    if (!_dongyData.benhDongY || _dongyData.benhDongY.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:20px;">Chưa có dữ liệu Bệnh đông y <button class="btn btn-primary btn-sm" onclick="openBenhDongYForm()">+ Thêm mới</button></div>';
        return;
    }

    const getV = (obj, ...keys) => {
        if (!obj) return '';
        const lowerKeys = keys.map(k => k.toLowerCase());
        for (const k in obj) {
            if (lowerKeys.includes(k.toLowerCase())) return obj[k];
        }
        return '';
    };

    const rows = _dongyData.benhDongY.map(item => {
        const id = getV(item, 'id', 'id_benh', 'modelId');
        const f = dyBenhDisplayFields(item);
        return `
            <tr>
                <td style="text-align:center;font-size:0.72rem;color:#78716c;white-space:nowrap;">${dyCellShortText(id)}</td>
                <td style="min-width:140px;white-space:normal;">${dyCellShortText(f.tieuket)}</td>
                <td>${dyTrieuChungTablePreview(f.trieuchung)}</td>
                <td>${dyCellLongText(f.benhly)}</td>
                <td>${dyCellLongText(f.phuyet_chamcuu)}</td>
                <td>${dyCellLongText(f.giainghia_phuyet)}</td>
                <td>${dyCellLongText(f.chung_trang)}</td>
                <td>${dyBaiThuocTablePreview(f.bai_thuoc)}</td>
                <td style="text-align:center;width:130px;white-space:nowrap;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openBenhDongYForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBenhDongY(${id})">🗑</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBenhDongYForm()">+ Thêm bệnh</button>
        </div>
        <div class="data-table-container" style="overflow-x:auto;">
            <table style="min-width:960px;">
                <thead><tr>
                    <th style="width:44px;text-align:center;">id</th>
                    <th style="min-width:140px;">Tiểu kết (tieuket)</th>
                    <th style="min-width:160px;">Triệu chứng</th>
                    <th style="min-width:160px;">Bệnh lý</th>
                    <th style="min-width:160px;">Phụyết châm cứu</th>
                    <th style="min-width:160px;">Giải nghĩa phương huyệt</th>
                    <th style="min-width:160px;">Chứng trạng</th>
                    <th style="min-width:170px;">Bài thuốc</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function openBenhDongYForm(givenId) {
    const item = givenId ? _dongyData.benhDongY.find(x => (x.id == givenId || x.id_benh == givenId || x.modelId == givenId)) : null;
    const realId = item ? (item.id || item.id_benh || item.modelId) : null;
    const f = dyBenhDisplayFields(item);
    _dyTrieuChungChips = dyTrieuChungTextToChips(f.trieuchung);
    _dyBaiThuocChips = dyBaiThuocTextToChips(f.bai_thuoc);

    showTayyModal(item ? 'Sửa bệnh đông y' : 'Thêm bệnh đông y', `
        <label class="tayy-form-label">Tiểu kết (tieuket)<br><input id="dy-inp-tieuket" type="text" class="tayy-form-input" value="${escHtml(f.tieuket)}"></label>
        <label class="tayy-form-label">Triệu chứng <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(chip — Enter để thêm)</span>
            <div style="position:relative;margin-top:6px;">
                <div id="dy-chips-trieuchung" class="chips-container" onclick="document.getElementById('dy-inp-trieuchung').focus()">
                    <input id="dy-inp-trieuchung" type="text" class="chip-input"
                        placeholder="Gõ triệu chứng, Enter để thêm chip..."
                        onkeydown="dyOnTrieuChungChipKeydown(event)">
                </div>
            </div>
        </label>
        <label class="tayy-form-label">Bệnh lý<br><textarea id="dy-inp-benhly" class="tayy-form-input" rows="4">${escHtml(f.benhly)}</textarea></label>
        <label class="tayy-form-label">Phụyết châm cứu<br><textarea id="dy-inp-phuyet-chamcuu" class="tayy-form-input" rows="4">${escHtml(f.phuyet_chamcuu)}</textarea></label>
        <label class="tayy-form-label">Giải nghĩa phương huyệt <span style="font-weight:400;color:#A09580;">(giainghia_phuyet)</span><br><textarea id="dy-inp-giainghia-phuyet" class="tayy-form-input" rows="4">${escHtml(f.giainghia_phuyet)}</textarea></label>
        <label class="tayy-form-label">Chứng trạng <span style="font-weight:400;color:#A09580;">(text)</span><br><textarea id="dy-inp-chungtrang" class="tayy-form-input" rows="3">${escHtml(f.chung_trang)}</textarea></label>
        <label class="tayy-form-label">Bài thuốc <span style="font-weight:400;color:#A09580;font-size:0.82rem;">(chip — Enter để thêm)</span>
            <div style="position:relative;margin-top:6px;">
                <div id="dy-chips-baithuoc" class="chips-container" onclick="document.getElementById('dy-inp-baithuoc').focus()">
                    <input id="dy-inp-baithuoc" type="text" class="chip-input"
                        placeholder="Gõ bài thuốc, Enter để thêm chip..."
                        onkeydown="dyOnBaiThuocChipKeydown(event)">
                </div>
            </div>
        </label>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhDongY(${realId || 0})">Lưu</button>
        </div>
    `, 'wide');
    dyRenderTrieuChungChips();
    dyRenderBaiThuocChips();
}

async function saveBenhDongY(id) {
    const tieuket = document.getElementById('dy-inp-tieuket').value.trim();
    if (!tieuket) return alert('Thiếu tiểu kết (tieuket)');

    const payload = {
        ten: tieuket,
        trieuchung: dyTrieuChungChipsToString(),
        phaptri: document.getElementById('dy-inp-benhly').value.trim(),
        phuonghuyet: document.getElementById('dy-inp-phuyet-chamcuu').value.trim(),
        giainghia_phuyet: document.getElementById('dy-inp-giainghia-phuyet').value.trim(),
        chung_trang: document.getElementById('dy-inp-chungtrang').value.trim(),
        bai_thuoc: dyBaiThuocChipsToString(),
    };
    const res = id ? await apiUpdateModel(id, payload) : await apiCreateModel(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);

    closeTayyModal(); await loadAllDongyData(); renderDongySection();
}

async function deleteBenhDongY(id) {
    if (confirm('Xóa?')) { await apiDeleteModel(id); await loadAllDongyData(); renderDongySection(); }
}

// ═══════════════════════════════════════════════════════════
// PHƯƠNG HUYỆT (dùng trong modal edit bệnh đông y)
// ═══════════════════════════════════════════════════════════
function dhGetHuyetViById(idHuyet) {
    return (_dongyData.huyetVi || []).find(h => (h.idHuyet ?? h.id) == idHuyet) || null;
}

function dhRenderPhuongHuyetRowsHtml() {
    if (!_dhDraftPhuongHuyet || _dhDraftPhuongHuyet.length === 0) {
        return `<tr><td colspan="4" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa có phương huyệt</td></tr>`;
    }

    return (_dhDraftPhuongHuyet || []).map(d => {
        const hv = dhGetHuyetViById(d.idHuyet);
        const ten = hv?.ten_huyet || hv?.name || d?.ten_huyet || 'Huyệt';
        const phuongPhap = d?.phuong_phap_tac_dong || '';
        const vaiTro = d?.vai_tro_huyet || '';

        return `
            <tr>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <span style="font-weight:700; color:#5B3A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:280px;">
                            ${escHtml(ten)}
                        </span>
                    </div>
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="ví dụ: bổ, tả, cứu..."
                        value="${escHtml(phuongPhap)}"
                        oninput="dhUpdatePhuongHuyetPhuongPhap(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="ví dụ: Quân, Thần, Tá, Sứ..."
                        value="${escHtml(vaiTro)}"
                        oninput="dhUpdatePhuongHuyetVaiTro(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; text-align:center;">
                    <button class="btn btn-sm btn-danger"
                        style="padding:2px 7px; font-size:0.72rem; height:24px;"
                        type="button"
                        onclick="dhRemovePhuongHuyet(${d.idHuyet})">✕</button>
                </td>
            </tr>
        `;
    }).join('');
}

function dhRerenderPhuongHuyetRows() {
    const tbody = document.getElementById('dy-phuong-huyet-tbody');
    if (!tbody) return;
    tbody.innerHTML = dhRenderPhuongHuyetRowsHtml();
}

function dhOnHuyetViSearchInput(query) {
    const exactVal = (query || '').trim();
    const inpVal = exactVal.toLowerCase();
    const suggestEl = document.getElementById('dy-ph-hv-suggest');
    if (!suggestEl) return;

    if (!inpVal) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
        return;
    }

    const selectedIds = new Set((_dhDraftPhuongHuyet || []).map(d => d.idHuyet));
    const matches = (_dongyData.huyetVi || [])
        .filter(h => (h?.ten_huyet || h?.name || '').toLowerCase().includes(inpVal))
        .filter(h => !selectedIds.has(h.idHuyet ?? h.id))
        .slice(0, 10);

    const hasExactMatch = matches.some(h => (h?.ten_huyet || h?.name || '').toLowerCase() === inpVal);

    let html = '';

    if (matches.length > 0) {
        html += matches.map(h => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                onmouseover="this.style.background='#F5F0E8'"
                onmouseout="this.style.background='transparent'"
                onclick="dhAddPhuongHuyet(${h.idHuyet ?? h.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(h.ten_huyet || h.name || '')}</div>
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy huyệt vị có sẵn</div>`;
    }

    if (!hasExactMatch && exactVal) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="softCreateHuyetVi('${escHtml(exactVal)}', 'dh')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm huyệt "${escHtml(exactVal)}"
                </div>
            </div>
        `;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

function dhAddPhuongHuyet(idHuyet) {
    if (!Number.isFinite(idHuyet)) return;

    const exists = (_dhDraftPhuongHuyet || []).some(d => d.idHuyet == idHuyet);
    if (exists) return;

    _dhDraftPhuongHuyet.push({
        idHuyet,
        phuong_phap_tac_dong: '',
        vai_tro_huyet: '',
        ghi_chu_ky_thuat: ''
    });

    dhRerenderPhuongHuyetRows();
    dhOnHuyetViSearchInput(document.getElementById('dy-ph-hv-search')?.value || '');
}

function dhRemovePhuongHuyet(idHuyet) {
    _dhDraftPhuongHuyet = (_dhDraftPhuongHuyet || []).filter(d => d.idHuyet != idHuyet);
    dhRerenderPhuongHuyetRows();
    dhOnHuyetViSearchInput(document.getElementById('dy-ph-hv-search')?.value || '');
}

function dhUpdatePhuongHuyetPhuongPhap(idHuyet, value) {
    const target = (_dhDraftPhuongHuyet || []).find(d => d.idHuyet == idHuyet);
    if (!target) return;
    target.phuong_phap_tac_dong = value ?? '';
}

function dhUpdatePhuongHuyetVaiTro(idHuyet, value) {
    const target = (_dhDraftPhuongHuyet || []).find(d => d.idHuyet == idHuyet);
    if (!target) return;
    target.vai_tro_huyet = value ?? '';
}

async function dhSyncPhuongHuyetForBenh(benhId) {
    const existing = (_dongyData.phacDo || []).filter(p => (p.idBenh ?? p.id_benh) == benhId);

    // Xóa cũ rồi tạo mới để đồng bộ theo UI (đơn giản & ít rủi ro lệch)
    for (const p of existing) {
        const pid = p.idPhacDo ?? p.id;
        if (Number.isFinite(pid)) {
            await apiDeletePhacDo(pid);
        }
    }

    for (const d of _dhDraftPhuongHuyet || []) {
        const payload = {
            id_benh: benhId,
            id_huyet: d.idHuyet,
            phuong_phap_tac_dong: (d.phuong_phap_tac_dong || '').trim() || undefined,
            vai_tro_huyet: (d.vai_tro_huyet || '').trim() || undefined,
            ghi_chu_ky_thuat: (d.ghi_chu_ky_thuat || '').trim() || undefined,
        };
        if (Number.isFinite(payload.id_benh) && Number.isFinite(payload.id_huyet)) {
            await apiCreatePhacDo(payload);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: KINH MẠCH (Tách riêng)
// ═══════════════════════════════════════════════════════════
function renderKinhMachTab(el) {
    const rows = _dongyData.kinhMach.map(item => {
        const id = item.idKinhMach || item.id;
        return `
            <tr>
                <td><strong>${escHtml(item.ten_kinh_mach)}</strong>
                    ${item.ten_viet_tat ? `<span style="font-size:0.75rem;color:#8B7355;margin-left:6px;">(${escHtml(item.ten_viet_tat)})</span>` : ''}
                </td>
                <td style="text-align:center;">${escHtml(item.ten_viet_tat||'—')}</td>
                <td style="text-align:center;">${escHtml(item.ky_hieu_quoc_te||'—')}</td>
                <td style="text-align:center;">${escHtml(item.ngu_hanh||'—')}</td>
                <td style="text-align:center;">${item.tong_so_huyet || 0}</td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openKinhMachForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteKinhMach(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openKinhMachForm()">+ Thêm kinh mạch</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên kinh mạch</th>
                    <th style="text-align:center;">Viết tắt</th>
                    <th style="text-align:center;">Ký hiệu</th>
                    <th style="text-align:center;">Ngũ hành</th>
                    <th style="text-align:center;">Số huyệt</th>
                    <th style="width:130px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openKinhMachForm(id) {
    const item = id ? _dongyData.kinhMach.find(x => (x.idKinhMach == id || x.id == id)) : null;
    showTayyModal(item ? 'Sửa kinh mạch' : 'Thêm kinh mạch', `
        <label class="tayy-form-label">Tên kinh mạch<br><input id="km-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_kinh_mach) : ''}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Tên viết tắt<br><input id="km-inp-viettat" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_viet_tat||'') : ''}" placeholder="VD: Tâm, Can..."></label>
            <label class="tayy-form-label">Ký hiệu<br><input id="km-inp-code" type="text" class="tayy-form-input" value="${item ? escHtml(item.ky_hieu_quoc_te||'') : ''}"></label>
            <label class="tayy-form-label">Ngũ hành<br><input id="km-inp-element" type="text" class="tayy-form-input" value="${item ? escHtml(item.ngu_hanh||'') : ''}"></label>
        </div>
        <div class="tayy-form-actions"><button class="btn" onclick="closeTayyModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveKinhMach(${id || 0})">Lưu</button></div>
    `);
}
async function saveKinhMach(id) {
    const payload = {
        ten_kinh_mach: document.getElementById('km-inp-ten').value.trim(),
        ten_viet_tat: document.getElementById('km-inp-viettat').value.trim(),
        ky_hieu_quoc_te: document.getElementById('km-inp-code').value.trim(),
        ngu_hanh: document.getElementById('km-inp-element').value.trim(),
    };
    const res = id ? await apiUpdateKinhMach(id, payload) : await apiCreateKinhMach(payload);
    closeTayyModal(); await loadAllDongyData(); renderDongySection();
}
async function deleteKinhMach(id) { if(confirm('Xóa?')) { await apiDeleteKinhMach(id); await loadAllDongyData(); renderDongySection(); } }

// ═══════════════════════════════════════════════════════════
// TAB: HUYỆT VỊ (Tách riêng)
// ═══════════════════════════════════════════════════════════
function renderHuyetViTab(el) {
    const rows = _dongyData.huyetVi.map(item => {
        const id = item.idHuyet || item.id;
        return `
            <tr>
                <td><strong>${escHtml(item.ten_huyet)}</strong></td>
                <td style="text-align:center;">${escHtml(item.ma_huyet)}</td>
                <td>${item.kinhMach ? escHtml(item.kinhMach.ten_kinh_mach) : '—'}</td>
                <td style="font-size:0.8rem; color:#8B7355;">${escHtml(item.loai_huyet || '—')}</td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openHuyetViForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHuyetVi(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openHuyetViForm()">+ Thêm huyệt vị</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên huyệt</th>
                    <th style="text-align:center;">Mã số</th>
                    <th>Kinh mạch</th>
                    <th>Loại</th>
                    <th style="width:130px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openHuyetViForm(id) {
    const item = id ? _dongyData.huyetVi.find(x => (x.idHuyet == id || x.id == id)) : null;
    const kmOpts = _dongyData.kinhMach.map(k => `<option value="${k.idKinhMach || k.id}" ${item && (item.idKinhMach == k.idKinhMach || item.idKinhMach == k.id) ? 'selected' : ''}>${k.ten_kinh_mach}</option>`).join('');
    showTayyModal('Huyệt vị', `
        <label class="tayy-form-label">Tên huyệt<br><input id="hv-inp-ten" type="text" class="tayy-form-input" value="${item?escHtml(item.ten_huyet):''}"></label>
        <label class="tayy-form-label">Kinh mạch<br><select id="hv-inp-km" class="tayy-form-input">${kmOpts}</select></label>
        <label class="tayy-form-label">Mã số<br><input id="hv-inp-ma" type="text" class="tayy-form-input" value="${item?escHtml(item.ma_huyet):''}"></label>
        <div class="tayy-form-actions"><button class="btn" onclick="closeTayyModal()">Hủy</button><button class="btn btn-primary" onclick="saveHuyetVi(${id||0})">Lưu</button></div>
    `);
}
async function saveHuyetVi(id) {
    const payload = { ten_huyet: document.getElementById('hv-inp-ten').value, id_kinh_mach: parseInt(document.getElementById('hv-inp-km').value), ma_huyet: document.getElementById('hv-inp-ma').value };
    await (id ? apiUpdateHuyetVi(id, payload) : apiCreateHuyetVi(payload));
    closeTayyModal(); await loadAllDongyData(); renderDongySection();
}
async function deleteHuyetVi(id) { if(confirm('Xóa?')) { await apiDeleteHuyetVi(id); await loadAllDongyData(); renderDongySection(); } }



// ═══════════════════════════════════════════════════════════
// TAB: PHÁC ĐỒ ĐIỀU TRỊ (phac_do_chuan — kế thừa + phương huyệt riêng)
// ═══════════════════════════════════════════════════════════

let _pdcEditingId = null;

function pdcGetHuyetViById(idHuyet) {
    return (_dongyData.huyetVi || []).find(h => (h.idHuyet ?? h.id) == idHuyet) || null;
}

/** Từ gốc kế thừa → lá (id), mảng các bản ghi phác đồ đầy đủ trong all */
function pdcChainRootToLeaf(leafId, all) {
    const up = [];
    const seen = new Set();
    let cur = (all || []).find(x => x.id == leafId);
    let g = 0;
    while (cur && g++ < 48) {
        if (seen.has(cur.id)) break;
        seen.add(cur.id);
        up.push(cur);
        const pid = cur.idKeThua ?? cur.id_ke_thua;
        if (pid == null) break;
        cur = (all || []).find(x => x.id == pid);
    }
    return up.reverse();
}

function pdcMergeChainNodes(chainNodes) {
    if (!chainNodes.length) return [];
    const leafId = chainNodes[chainNodes.length - 1].id;
    const orderedIds = [];
    const labels = [];
    for (const node of chainNodes) {
        const lines = (node.huyetDong || node.huyet_dong || [])
            .slice()
            .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0));
        for (const ln of lines) {
            const hid = ln.idHuyet ?? ln.id_huyet;
            if (!Number.isFinite(Number(hid))) continue;
            const idx = orderedIds.indexOf(hid);
            if (idx >= 0) {
                orderedIds.splice(idx, 1);
                labels.splice(idx, 1);
            }
            orderedIds.push(hid);
            const hv = ln.huyetVi || ln.huyet_vi || pdcGetHuyetViById(hid);
            const ten = hv?.ten_huyet || hv?.name || ('#' + hid);
            labels.push({ ten, tu_ke_thua: node.id !== leafId });
        }
    }
    return labels;
}

function pdcPreviewLabelsFromForm() {
    return (_pdcDraftPhuongHuyet || []).map((d) => {
        const hv = pdcGetHuyetViById(d.idHuyet);
        return {
            ten: hv?.ten_huyet || hv?.name || ('#' + d.idHuyet),
            tu_ke_thua: false,
        };
    });
}

function pdcRefreshPreview() {
    const el = document.getElementById('pdc-preview-hieu-luc');
    if (!el) return;
    const labels = pdcPreviewLabelsFromForm();
    if (!labels.length) {
        el.innerHTML = '<span style="color:#A09580;">—</span>';
        return;
    }
    el.innerHTML = labels
        .map((x) => {
            return `<span style="display:inline-flex;align-items:baseline;margin:2px 8px 2px 0;flex-wrap:wrap;"><strong style="color:#5B3A1A;">${escHtml(x.ten)}</strong></span>`;
        })
        .join('');
}

function pdcHieuLucShortForRow(item, max = 10) {
    const all = _dongyData.phacDoChuan || [];
    const chain = pdcChainRootToLeaf(item.id, all);
    const labs = pdcMergeChainNodes(chain);
    const names = labs.map((x) => x.ten);
    if (names.length <= max) return names.join(', ') || '—';
    return names.slice(0, max).join(', ') + ` (+${names.length - max})`;
}

function pdcNormText(v) {
    return String(v || '').trim().toLowerCase();
}

function pdcFindBenhByTieuket(tieuket) {
    const want = pdcNormText(tieuket);
    if (!want) return null;
    return (_dongyData.benhDongY || []).find((b) => {
        const name = b.tieuket || b.ten || '';
        return pdcNormText(name) === want;
    }) || null;
}

function pdcFindPhacDoByTen(ten) {
    const want = pdcNormText(ten);
    if (!want) return null;
    return (_dongyData.phacDoChuan || []).find((p) => pdcNormText(p.ten) === want) || null;
}

function pdcFindHuyetByToken(token) {
    const raw = String(token || '').trim();
    if (!raw) return null;
    const asNum = parseInt(raw, 10);
    if (Number.isFinite(asNum)) {
        const byId = (_dongyData.huyetVi || []).find((h) => (h.idHuyet ?? h.id) == asNum);
        if (byId) return byId;
    }
    const want = pdcNormText(raw);
    return (_dongyData.huyetVi || []).find((h) => pdcNormText(h.ten_huyet || h.name) === want) || null;
}

async function pdcFindOrCreateHuyetByName(name, collector) {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const found = pdcFindHuyetByToken(clean);
    if (found) return found;
    const kmDefault = (_dongyData.kinhMach || [])[0];
    const rawKinhMachId = kmDefault ? (kmDefault.idKinhMach ?? kmDefault.id) : null;
    const idKinhMach = Number(rawKinhMachId);
    if (!Number.isFinite(idKinhMach) || idKinhMach <= 0) {
        if (collector?.errors) collector.errors.push(`Không thể tạo huyệt "${clean}" vì chưa có dữ liệu kinh mạch.`);
        return null;
    }
    const res = await apiCreateHuyetVi({
        ten_huyet: clean,
        id_kinh_mach: idKinhMach,
        idKinhMach: idKinhMach,
    });
    if (!res?.success) {
        if (collector?.errors) collector.errors.push(`Tạo huyệt "${clean}" thất bại: ${res?.error || 'Lỗi không xác định'}`);
        return null;
    }
    const data = res.data || {};
    const newId = data.idHuyet || data.id;
    if (!newId) return null;
    const item = { id: newId, idHuyet: newId, ten_huyet: clean, ...data };
    _dongyData.huyetVi = _dongyData.huyetVi || [];
    _dongyData.huyetVi.push(item);
    if (collector?.created) collector.created.push(clean);
    return item;
}

function pdcSetImportLoading(isLoading, message) {
    const id = 'pdc-import-loading';
    const old = document.getElementById(id);
    if (!isLoading) {
        if (old) old.remove();
        return;
    }
    if (old) {
        const msgEl = old.querySelector('[data-pdc-loading-msg]');
        if (msgEl) msgEl.textContent = message || 'Đang xử lý...';
        return;
    }
    const root = document.createElement('div');
    root.id = id;
    root.style.cssText =
        'position:fixed;inset:0;z-index:12000;background:rgba(15,23,42,0.28);' +
        'display:flex;align-items:center;justify-content:center;padding:16px;';
    root.innerHTML = `
        <div style="min-width:320px;max-width:520px;background:#FFFDF7;border:1px solid #D4C5A0;border-radius:12px;padding:16px 18px;box-shadow:0 18px 42px rgba(0,0,0,0.25);">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:16px;height:16px;border:2px solid #D4C5A0;border-top-color:#8B1A1A;border-radius:50%;animation:pdcSpin 0.8s linear infinite;"></div>
                <strong style="font-size:0.92rem;color:#5B3A1A;">Đang nhập Excel phác đồ</strong>
            </div>
            <div data-pdc-loading-msg style="margin-top:10px;color:#6B5A45;font-size:0.84rem;line-height:1.45;">
                ${escHtml(message || 'Đang xử lý...')}
            </div>
        </div>
    `;
    if (!document.getElementById('pdc-spin-style')) {
        const st = document.createElement('style');
        st.id = 'pdc-spin-style';
        st.textContent = '@keyframes pdcSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(st);
    }
    document.body.appendChild(root);
}

function pdcExportExcel() {
    if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
    const rows = (_dongyData.phacDoChuan || []).map((item) => {
        const benh = item.benhDongY || item.benh_dong_y;
        const keThua = item.keThua || item.ke_thua;
        const huyet = (item.huyetDong || item.huyet_dong || [])
            .slice()
            .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0))
            .map((ln) => ({
                id_huyet: ln.idHuyet ?? ln.id_huyet,
                ten_huyet: ln?.huyetVi?.ten_huyet || ln?.huyet_vi?.ten_huyet || '',
                phuong_phap_tac_dong: ln.phuong_phap_tac_dong || '',
                vai_tro_huyet: ln.vai_tro_huyet || '',
                ghi_chu_ky_thuat: ln.ghi_chu_ky_thuat || '',
            }));
        return {
            ten: item.ten || '',
            tieuket_benh_dong_y: benh?.tieuket || benh?.ten || '',
            ten_ke_thua: keThua?.ten || '',
            ghi_chu: item.ghi_chu || '',
            thu_tu_hien_thi: item.thuTuHienThi ?? item.thu_tu_hien_thi ?? 0,
            huyet_rieng: huyet.map((x) => x.ten_huyet).filter(Boolean).join(', '),
        };
    });
    const emptyRow = {
        ten: '',
        tieuket_benh_dong_y: '',
        ten_ke_thua: '',
        ghi_chu: '',
        thu_tu_hien_thi: 0,
        huyet_rieng: '',
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [emptyRow]), 'PhacDoDieuTri');
    XLSX.writeFile(wb, 'Phac_Do_Dieu_Tri_Dong_Y.xlsx');
}

async function pdcExtractHuyetLinesFromRow(row, collector) {
    const out = [];
    const pushLine = (idHuyet, pp, vt, gc) => {
        const hid = Number(idHuyet);
        if (!Number.isFinite(hid)) return;
        if (out.some((x) => x.id_huyet === hid)) return;
        out.push({
            id_huyet: hid,
            thu_tu: out.length,
            phuong_phap_tac_dong: pp || undefined,
            vai_tro_huyet: vt || undefined,
            ghi_chu_ky_thuat: gc || undefined,
        });
    };

    const rawText = row.huyet_rieng ?? row['huyet_rieng'] ?? row['Huyệt riêng'] ?? '';
    const parts = String(rawText || '').split(/[,;\n\r]+/).map((x) => x.trim()).filter(Boolean);
    for (const p of parts) {
        const hv = await pdcFindOrCreateHuyetByName(p, collector);
        if (!hv) continue;
        pushLine(hv.idHuyet ?? hv.id, '', '', '');
    }

    return out;
}

async function importPhacDoChuanXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện Excel.');
    const file = e.target.files?.[0];
    const inputEl = e.target;
    if (!file) return;
    try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const validRows = (rows || []).filter((r) => String(r?.ten || '').trim());
        if (!validRows.length) {
            alert('File không có dòng hợp lệ (cần cột "ten").');
            return;
        }
        if (!confirm(`Tìm thấy ${validRows.length} dòng. Tiếp tục nhập/cập nhật?`)) return;

        pdcSetImportLoading(true, 'Đang đồng bộ dữ liệu hiện tại...');
        await loadAllDongyData();
        let created = 0;
        let updated = 0;
        const errors = [];
        const autoCreatedHuyet = [];

        for (let i = 0; i < validRows.length; i++) {
            pdcSetImportLoading(true, `Đang xử lý dòng ${i + 1}/${validRows.length}...`);
            const row = validRows[i];
            const ten = String(row.ten || '').trim();
            if (!ten) {
                errors.push(`Dòng ${i + 2}: thiếu "ten".`);
                continue;
            }

            const target = pdcFindPhacDoByTen(ten);

            let idBenh = null;
            const benhIdRaw = parseInt(row.id_benh_dong_y, 10);
            if (Number.isFinite(benhIdRaw)) idBenh = benhIdRaw;
            else if (String(row.tieuket_benh_dong_y || '').trim()) {
                const benh = pdcFindBenhByTieuket(row.tieuket_benh_dong_y);
                if (benh) idBenh = benh.modelId || benh.id || benh.id_benh || null;
            }

            let idKeThua = null;
            if (String(row.ten_ke_thua || '').trim()) {
                const ke = pdcFindPhacDoByTen(row.ten_ke_thua);
                if (ke) idKeThua = ke.id;
            }

            const thuTu = parseInt(row.thu_tu_hien_thi, 10);
            const body = {
                ten,
                id_ke_thua: Number.isFinite(idKeThua) ? idKeThua : null,
                id_benh_dong_y: Number.isFinite(idBenh) ? idBenh : null,
                ghi_chu: String(row.ghi_chu || '').trim() || null,
                thu_tu_hien_thi: Number.isFinite(thuTu) ? thuTu : 0,
                huyet: await pdcExtractHuyetLinesFromRow(row, { created: autoCreatedHuyet, errors }),
            };
            if (target && target.id === body.id_ke_thua) body.id_ke_thua = null;

            const res = target
                ? await apiUpdatePhacDoChuan(target.id, body)
                : await apiCreatePhacDoChuan(body);
            if (!res.success) {
                errors.push(`Dòng ${i + 2}: ${res.error || 'Lỗi không xác định'}`);
                continue;
            }
            if (target) updated += 1;
            else created += 1;
            pdcSetImportLoading(true, `Đang làm mới dữ liệu... (${i + 1}/${validRows.length})`);
            await loadAllDongyData();
        }

        renderDongySection();
        const msg = [`Nhập Excel xong. Tạo mới: ${created}, Cập nhật: ${updated}.`];
        if (autoCreatedHuyet.length) {
            msg.push(`Đã tự tạo ${autoCreatedHuyet.length} huyệt mới:\n- ${Array.from(new Set(autoCreatedHuyet)).join('\n- ')}`);
        }
        if (errors.length) msg.push(`Lỗi (${errors.length}):\n- ${errors.join('\n- ')}`);
        alert(msg.join('\n\n'));
    } catch (err) {
        console.error(err);
        alert('Lỗi đọc file Excel: ' + (err?.message || err));
    } finally {
        pdcSetImportLoading(false);
        if (inputEl) inputEl.value = '';
    }
}

function renderPhacDoChuanTab(el) {
    const list = _dongyData.phacDoChuan || [];
    const rows = list.map((item) => {
        const id = item.id;
        const benh = item.benhDongY || item.benh_dong_y;
        const benhName = benh ? (benh.tieuket || benh.ten || '—') : '—';
        const kt = item.keThua || item.ke_thua;
        const ktTen = kt?.ten || '—';
        const nRieng = (item.huyetDong || item.huyet_dong || []).length;
        const hieuLuc = pdcHieuLucShortForRow(item);
        return `
            <tr>
                <td><strong>${escHtml(item.ten || '—')}</strong></td>
                <td style="font-size:0.82rem;">${escHtml(benhName)}</td>
                <td style="font-size:0.82rem;">${escHtml(ktTen)}</td>
                <td style="text-align:center;">${nRieng}</td>
                <td style="font-size:0.78rem;color:#444;max-width:280px;">${escHtml(hieuLuc)}</td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openPhacDoChuanForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePhacDoChuan(${id})">🗑</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    el.innerHTML = `
        <p style="margin:0 0 12px 0;font-size:0.85rem;color:#78716c;max-width:920px;">
            Mỗi phác đồ có <strong>tên</strong>, tùy chọn <strong>kế thừa</strong> từ phác đồ khác (B = A + huyệt thêm),
            và danh sách <strong>huyệt riêng</strong> của dòng này. Cột «Huyệt hiệu lực» = gộp từ gốc kế thừa + riêng (trùng huyệt thì lấy bản sau).
        </p>
        <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            <button class="btn btn-outline" onclick="pdcExportExcel()">⬇ Xuất Excel</button>
            <button class="btn btn-outline" onclick="document.getElementById('pdc-import-xlsx').click()">⬆ Nhập Excel</button>
            <input type="file" id="pdc-import-xlsx" accept=".xlsx,.xls,.csv" style="display:none;" onchange="importPhacDoChuanXlsx(event)">
            <button class="btn btn-primary" onclick="openPhacDoChuanForm()">+ Thêm phác đồ</button>
        </div>
        <div class="data-table-container" style="overflow-x:auto;">
            <table style="min-width:880px;">
                <thead><tr>
                    <th>Tên phác đồ</th>
                    <th style="min-width:100px;">Bệnh Đông y</th>
                    <th style="min-width:120px;">Kế thừa từ</th>
                    <th style="width:56px;text-align:center;">Huyệt riêng</th>
                    <th style="min-width:200px;">Huyệt hiệu lực (xem nhanh)</th>
                    <th style="width:130px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openPhacDoChuanForm(givenId) {
    const item = givenId ? (_dongyData.phacDoChuan || []).find((x) => x.id == givenId) : null;
    _pdcEditingId = item ? item.id : null;

    _pdcDraftPhuongHuyet = [];
    if (item && (item.huyetDong || item.huyet_dong)) {
        const lines = (item.huyetDong || item.huyet_dong).slice()
            .sort((a, b) => (a.thuTu ?? a.thu_tu ?? 0) - (b.thuTu ?? b.thu_tu ?? 0));
        for (const ln of lines) {
            const hid = ln.idHuyet ?? ln.id_huyet;
            if (!Number.isFinite(Number(hid))) continue;
            _pdcDraftPhuongHuyet.push({
                idHuyet: hid,
                phuong_phap_tac_dong: ln.phuong_phap_tac_dong || '',
                vai_tro_huyet: ln.vai_tro_huyet || '',
                ghi_chu_ky_thuat: ln.ghi_chu_ky_thuat || '',
            });
        }
    }

    const benhSel = item?.idBenhDongY ?? item?.id_benh_dong_y;
    const keSel = item?.idKeThua ?? item?.id_ke_thua;

    const benhOpts =
        '<option value="">— Không gắn danh mục bệnh —</option>' +
        (_dongyData.benhDongY || [])
            .map((b) => {
                const bid = b.modelId || b.id || b.id_benh;
                const bname = b.ten || b.tieuket || 'Bệnh';
                const selected = Number.isFinite(benhSel) && benhSel == bid ? 'selected' : '';
                return `<option value="${bid}" ${selected}>${escHtml(bname)}</option>`;
            })
            .join('');

    const kethuaOpts =
        '<option value="">— Không kế thừa (phác đồ gốc) —</option>' +
        (_dongyData.phacDoChuan || [])
            .filter((p) => p.id != _pdcEditingId)
            .slice()
            .sort((a, b) => String(a.ten || '').localeCompare(String(b.ten || ''), 'vi'))
            .map((p) => {
                const selected = Number.isFinite(keSel) && keSel == p.id ? 'selected' : '';
                return `<option value="${p.id}" ${selected}>${escHtml(p.ten || '#' + p.id)}</option>`;
            })
            .join('');

    showTayyModal(_pdcEditingId ? 'Sửa phác đồ điều trị' : 'Thêm phác đồ điều trị', `
        <label class="tayy-form-label">Tên phác đồ / trường hợp<br>
            <input id="pdc-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten || '') : ''}" placeholder="VD: Tâm khí hư, Tâm dương hư…"></label>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;">
            <label class="tayy-form-label">Bệnh Đông y (tuỳ chọn)<br>
                <select id="pdc-sel-benh" class="tayy-form-input">${benhOpts}</select></label>
            <label class="tayy-form-label">Kế thừa từ phác đồ<br>
                <select id="pdc-sel-kethua" class="tayy-form-input" onchange="pdcRefreshPreview()">${kethuaOpts}</select></label>
        </div>

        <label class="tayy-form-label" style="margin-top:10px;">Ghi chú<br>
            <textarea id="pdc-inp-ghichu" class="tayy-form-input" rows="2" placeholder="VD: Như Tâm khí hư + bổ Đảm du, Dương cương">${item ? escHtml(item.ghi_chu || '') : ''}</textarea></label>

        <label class="tayy-form-label">Thứ tự hiển thị trong danh sách<br>
            <input id="pdc-inp-thutu" type="number" class="tayy-form-input" value="${item != null ? (item.thuTuHienThi ?? item.thu_tu_hien_thi ?? 0) : 0}"></label>

        <div style="margin-top:14px;padding:10px 12px;background:#F5F0E8;border:1px solid #E2D4B8;border-radius:8px;">
            <div style="font-weight:800;color:#5B3A1A;font-size:0.82rem;margin-bottom:6px;">Xem trước huyệt riêng (huyệt cộng thêm)</div>
            <div id="pdc-preview-hieu-luc" style="font-size:0.82rem;line-height:1.45;"></div>
        </div>

        <div style="margin-top:12px;">
            <label class="tayy-form-label" style="margin:0 0 8px 0;">
                Huyệt <strong>riêng</strong> của phác đồ này (thêm trên nền phác đồ kế thừa)
                <div style="position:relative; margin-top:6px;">
                    <input id="pdc-ph-hv-search" type="text" class="tayy-form-input"
                        placeholder="Gõ tên huyệt để thêm..."
                        oninput="pdcOnHuyetViSearchInput(this.value)">
                    <div id="pdc-ph-hv-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 6px);
                        background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.12);
                        max-height:220px; overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
            </label>

            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr>
                        <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:30%;">Tên huyệt</th>
                        <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:35%;">Phương pháp tác động</th>
                        <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:25%;">Vai trò</th>
                        <th style="text-align:center; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:10%;">Xóa</th>
                    </tr>
                </thead>
                <tbody id="pdc-phuong-huyet-tbody" style="background:#FBF8F1;">
                    ${pdcRenderPhuongHuyetRowsHtml()}
                </tbody>
            </table>
        </div>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhacDoChuan()">Lưu</button>
        </div>
    `, 'wide');
    pdcRefreshPreview();
}

function pdcRenderPhuongHuyetRowsHtml() {
    if (!_pdcDraftPhuongHuyet || _pdcDraftPhuongHuyet.length === 0) {
        return `<tr><td colspan="4" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa thêm huyệt riêng</td></tr>`;
    }
    return (_pdcDraftPhuongHuyet || []).map((d) => {
        const hv = pdcGetHuyetViById(d.idHuyet);
        const ten = hv?.ten_huyet || hv?.name || d?.ten_huyet || 'Huyệt';
        const phuongPhap = d?.phuong_phap_tac_dong || '';
        const vaiTro = d?.vai_tro_huyet || '';
        return `
            <tr>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <div style="font-weight:700; color:#5B3A1A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px;">
                        ${escHtml(ten)}
                    </div>
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="bổ, tả, cứu…"
                        value="${escHtml(phuongPhap)}"
                        oninput="pdcUpdatePhuongPhap(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="Quân, Thần…"
                        value="${escHtml(vaiTro)}"
                        oninput="pdcUpdateVaiTro(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; text-align:center;">
                    <button class="btn btn-sm btn-danger" style="padding:2px 7px; font-size:0.72rem; height:24px;" type="button"
                        onclick="pdcRemovePhuongHuyet(${d.idHuyet})">✕</button>
                </td>
            </tr>`;
    }).join('');
}

function pdcRerenderPhuongHuyetRows() {
    const tbody = document.getElementById('pdc-phuong-huyet-tbody');
    if (!tbody) return;
    tbody.innerHTML = pdcRenderPhuongHuyetRowsHtml();
    pdcRefreshPreview();
}

function pdcOnHuyetViSearchInput(query) {
    const exactVal = (query || '').trim();
    const inpVal = exactVal.toLowerCase();
    const suggestEl = document.getElementById('pdc-ph-hv-suggest');
    if (!suggestEl) return;
    if (!inpVal) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
        return;
    }
    const selectedIds = new Set((_pdcDraftPhuongHuyet || []).map((d) => d.idHuyet));
    const matches = (_dongyData.huyetVi || [])
        .filter((h) => (h?.ten_huyet || h?.name || '').toLowerCase().includes(inpVal))
        .filter((h) => !selectedIds.has(h.idHuyet ?? h.id))
        .slice(0, 10);
    const hasExactMatch = matches.some((h) => (h?.ten_huyet || h?.name || '').toLowerCase() === inpVal);
    let html = '';
    if (matches.length > 0) {
        html += matches.map((h) => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                onmouseover="this.style.background='#F5F0E8'"
                onmouseout="this.style.background='transparent'"
                onclick="pdcAddPhuongHuyet(${h.idHuyet ?? h.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(h.ten_huyet || h.name || '')}</div>
            </div>`).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy huyệt vị có sẵn</div>`;
    }
    if (!hasExactMatch && exactVal) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="softCreateHuyetVi('${escHtml(exactVal)}', 'pdc')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm huyệt "${escHtml(exactVal)}"
                </div>
            </div>`;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

function pdcAddPhuongHuyet(idHuyet) {
    if (!Number.isFinite(idHuyet)) return;
    if ((_pdcDraftPhuongHuyet || []).some((d) => d.idHuyet == idHuyet)) return;
    _pdcDraftPhuongHuyet.push({
        idHuyet,
        phuong_phap_tac_dong: '',
        vai_tro_huyet: '',
        ghi_chu_ky_thuat: '',
    });
    pdcRerenderPhuongHuyetRows();
    const s = document.getElementById('pdc-ph-hv-suggest');
    if (s) {
        s.style.display = 'none';
        s.innerHTML = '';
    }
    const inp = document.getElementById('pdc-ph-hv-search');
    if (inp) inp.value = '';
}

function pdcRemovePhuongHuyet(idHuyet) {
    _pdcDraftPhuongHuyet = (_pdcDraftPhuongHuyet || []).filter((d) => d.idHuyet != idHuyet);
    pdcRerenderPhuongHuyetRows();
}

function pdcUpdatePhuongPhap(idHuyet, value) {
    const t = (_pdcDraftPhuongHuyet || []).find((d) => d.idHuyet == idHuyet);
    if (!t) return;
    t.phuong_phap_tac_dong = value ?? '';
}

function pdcUpdateVaiTro(idHuyet, value) {
    const t = (_pdcDraftPhuongHuyet || []).find((d) => d.idHuyet == idHuyet);
    if (!t) return;
    t.vai_tro_huyet = value ?? '';
}

async function savePhacDoChuan() {
    const ten = document.getElementById('pdc-inp-ten')?.value.trim();
    if (!ten) return alert('Thiếu tên phác đồ');

    const benhRaw = document.getElementById('pdc-sel-benh')?.value;
    const keRaw = document.getElementById('pdc-sel-kethua')?.value;
    const idBenh = benhRaw ? parseInt(benhRaw, 10) : null;
    const idKe = keRaw ? parseInt(keRaw, 10) : null;
    const ghiChu = document.getElementById('pdc-inp-ghichu')?.value.trim() || null;
    const thuTu = parseInt(document.getElementById('pdc-inp-thutu')?.value, 10);
    const huyet = (_pdcDraftPhuongHuyet || []).map((d, i) => ({
        id_huyet: d.idHuyet,
        thu_tu: i,
        phuong_phap_tac_dong: (d.phuong_phap_tac_dong || '').trim() || undefined,
        vai_tro_huyet: (d.vai_tro_huyet || '').trim() || undefined,
        ghi_chu_ky_thuat: (d.ghi_chu_ky_thuat || '').trim() || undefined,
    }));

    const body = {
        ten,
        id_ke_thua: Number.isFinite(idKe) ? idKe : null,
        id_benh_dong_y: Number.isFinite(idBenh) ? idBenh : null,
        ghi_chu: ghiChu,
        thu_tu_hien_thi: Number.isFinite(thuTu) ? thuTu : 0,
        huyet,
    };

    let res;
    if (_pdcEditingId != null) {
        res = await apiUpdatePhacDoChuan(_pdcEditingId, body);
    } else {
        res = await apiCreatePhacDoChuan(body);
    }
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}

async function deletePhacDoChuan(id) {
    if (!confirm('Xóa phác đồ này? Các phác đồ con sẽ mất liên kết kế thừa (SET NULL).')) return;
    const res = await apiDeletePhacDoChuan(id);
    if (!res.success) return alert('Lỗi: ' + res.error);
    await loadAllDongyData();
    renderDongySection();
}

async function softCreateHuyetVi(name, context) {
    if (!name) return;

    const inpId = context === 'dh' ? 'dy-ph-hv-search' : 'pdc-ph-hv-search';
    const suggestId = context === 'dh' ? 'dy-ph-hv-suggest' : 'pdc-ph-hv-suggest';

    const inp = document.getElementById(inpId);
    const suggestEl = document.getElementById(suggestId);
    const oldVal = inp ? inp.value : '';

    if (inp) {
        inp.disabled = true;
        inp.value = 'Đang thêm...';
    }
    if (suggestEl) suggestEl.style.display = 'none';

    const payload = { ten_huyet: name };
    const res = await apiCreateHuyetVi(payload);

    if (inp) {
        inp.disabled = false;
        inp.value = '';
        inp.focus();
    }

    if (!res.success) {
        alert('Lỗi khi thêm huyệt mới: ' + (res.error || 'Vui lòng thử lại sau.'));
        if (inp) inp.value = oldVal;
        return;
    }

    const resData = res.data || {};
    const newId = resData.idHuyet || resData.id;
    if (!newId) return;

    const newItem = { id: newId, idHuyet: newId, ...payload, ...resData };
    _dongyData.huyetVi.push(newItem);

    if (context === 'dh') {
        dhAddPhuongHuyet(newId);
    } else {
        pdcAddPhuongHuyet(newId);
    }
}

// ═══════════════════════════════════════════════════════════
// SHARED MODAL HELPERS
// ═══════════════════════════════════════════════════════════
function showTayyModal(title, bodyHtml, widthClass) {
    let modal = document.getElementById('tayy-modal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'tayy-modal'; document.body.appendChild(modal); }
    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;';
    let innerStyle;
    if (widthClass === 'analysis') {
        innerStyle = 'background:#FFFDF7;width:min(96vw,1520px);max-width:96vw;padding:16px 20px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-height:94vh;overflow-y:auto;overflow-x:hidden;border:1px solid #D4C5A0;position:relative;box-sizing:border-box;';
    } else {
        const maxW = widthClass === 'wide' ? '800px' : '480px';
        innerStyle = `background:#FFFDF7;width:95%;max-width:${maxW};padding:25px;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;border:1px solid #D4C5A0;`;
    }
    modal.innerHTML = `<div style="${innerStyle}">
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #5B3A1A;padding-bottom:10px;margin-bottom:15px;"><span style="font-weight:900;color:#5B3A1A;font-size:1.1rem;">${title}</span><button class="btn" onclick="closeTayyModal()" style="padding:0 8px;">✕</button></div>
        ${bodyHtml}</div>`;
}
function closeTayyModal() {
    if (typeof yhctDestroyAnalysisCharts === 'function') yhctDestroyAnalysisCharts();
    const m = document.getElementById('tayy-modal');
    if (m) m.style.display = 'none';
}
function escHtml(s) { if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
