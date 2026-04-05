// dongy-management.js — Quản lý Danh mục Đông Y đa tầng
// Bao gồm: Bệnh, Kinh mạch, Huyệt vị, Vị thuốc, Bài thuốc, Phác đồ

let _dongyData = {
    benhDongY: [],
    kinhMach: [],
    huyetVi: [],
    phacDo: [],
    activeTab: 'benh-dong-y',
};

// Draft danh sách "phương huyệt" đang được chỉnh trong modal edit bệnh đông y
// Mỗi dòng = 1 huyệt (tương tự cách bạn muốn ở danh mục vị thuốc)
let _dhDraftPhuongHuyet = [];

// Draft danh sách "phương huyệt" đang được chỉnh trong modal tab "Phương huyệt"
// Mỗi dòng = 1 huyệt
let _pdDraftPhuongHuyet = [];

// ─── Khởi tạo ─────────────────────────────────────────────
async function initDongyManagement() {
    await loadAllDongyData();
    renderDongySection();
}

async function loadAllDongyData() {
    try {
        const [bdy, km, hv, pd] = await Promise.all([
            apiGetModels(),      // benh_dong_y
            apiGetKinhMach(),
            apiGetHuyetVi(),
            apiGetPhacDo(),
        ]);
        _dongyData.benhDongY = bdy || [];
        _dongyData.kinhMach = km || [];
        _dongyData.huyetVi = hv || [];
        _dongyData.phacDo = pd || [];
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
                <h2 style="color: var(--secondary); margin:0;">Hệ Thống Quản Lý Đông Y</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border); overflow-x:auto; white-space:nowrap;">
                <button class="tayy-tab ${tab === 'benh-dong-y' ? 'active' : ''}" onclick="switchDongyTab('benh-dong-y')">Danh mục bệnh</button>
                <button class="tayy-tab ${tab === 'kinh-mach' ? 'active' : ''}" onclick="switchDongyTab('kinh-mach')">Kinh mạch</button>
                <button class="tayy-tab ${tab === 'huyet-vi' ? 'active' : ''}" onclick="switchDongyTab('huyet-vi')">Huyệt vị</button>
                <button class="tayy-tab ${tab === 'phac-do' ? 'active' : ''}" onclick="switchDongyTab('phac-do')" style="display:none;">Phương huyệt</button>
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
        case 'phac-do': renderPhacDoTab(el); break;
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
        return { tieuket: '', trieuchung: '', benhly: '', phuyet_chamcuu: '', giainghia_phuyet: '' };
    }
    return {
        tieuket: String(item.tieuket || item.ten || '').trim(),
        trieuchung: String(item.trieuchung || '').trim(),
        benhly: String(item.benhly ?? item.phaptri ?? '').trim(),
        phuyet_chamcuu: String(item.phuyet_chamcuu ?? item.phuonghuyet ?? '').trim(),
        giainghia_phuyet: String(item.giainghia_phuyet ?? '').trim(),
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
                <td>${dyCellLongText(f.trieuchung)}</td>
                <td>${dyCellLongText(f.benhly)}</td>
                <td>${dyCellLongText(f.phuyet_chamcuu)}</td>
                <td>${dyCellLongText(f.giainghia_phuyet)}</td>
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

    showTayyModal(item ? 'Sửa bệnh đông y' : 'Thêm bệnh đông y', `
        <label class="tayy-form-label">Tiểu kết (tieuket)<br><input id="dy-inp-tieuket" type="text" class="tayy-form-input" value="${escHtml(f.tieuket)}"></label>
        <label class="tayy-form-label">Triệu chứng<br><textarea id="dy-inp-trieuchung" class="tayy-form-input" rows="4">${escHtml(f.trieuchung)}</textarea></label>
        <label class="tayy-form-label">Bệnh lý<br><textarea id="dy-inp-benhly" class="tayy-form-input" rows="4">${escHtml(f.benhly)}</textarea></label>
        <label class="tayy-form-label">Phụyết châm cứu<br><textarea id="dy-inp-phuyet-chamcuu" class="tayy-form-input" rows="4">${escHtml(f.phuyet_chamcuu)}</textarea></label>
        <label class="tayy-form-label">Giải nghĩa phương huyệt <span style="font-weight:400;color:#A09580;">(giainghia_phuyet)</span><br><textarea id="dy-inp-giainghia-phuyet" class="tayy-form-input" rows="4">${escHtml(f.giainghia_phuyet)}</textarea></label>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhDongY(${realId || 0})">Lưu</button>
        </div>
    `, 'wide');
}

async function saveBenhDongY(id) {
    const tieuket = document.getElementById('dy-inp-tieuket').value.trim();
    if (!tieuket) return alert('Thiếu tiểu kết (tieuket)');

    const payload = {
        ten: tieuket,
        trieuchung: document.getElementById('dy-inp-trieuchung').value.trim(),
        phaptri: document.getElementById('dy-inp-benhly').value.trim(),
        phuonghuyet: document.getElementById('dy-inp-phuyet-chamcuu').value.trim(),
        giainghia_phuyet: document.getElementById('dy-inp-giainghia-phuyet').value.trim(),
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
// TAB: PHƯƠNG HUYỆT
// ═══════════════════════════════════════════════════════════
function renderPhacDoTab(el) {
    const rows = _dongyData.phacDo.map(item => {
        const id = item.idPhacDo || item.id;
        const benhName = item.benh ? (item.benh.tieuket || item.benh.ten || '—') : '—';
        const hvName = item.huyetVi ? (item.huyetVi.ten_huyet || item.huyetVi.name || '—') : '—';
        return `
            <tr>
                <td><strong>${escHtml(benhName)}</strong></td>
                <td><span style="color:#8B7355; font-weight:600;">${escHtml(hvName)}</span></td>
                <td>${escHtml(item.vai_tro_huyet || '—')}</td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openPhacDoForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePhacDo(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openPhacDoForm()">+ Thêm phương huyệt</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th>Bệnh</th><th>Huyệt</th><th>Vai trò</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openPhacDoForm(id) {
    const item = id ? _dongyData.phacDo.find(x => (x.idPhacDo == id || x.id == id)) : null;
    const initialBenhId = item ? (item.idBenh ?? item.id_benh) : null;

    _pdDraftPhuongHuyet = [];
    if (Number.isFinite(initialBenhId)) {
        _pdDraftPhuongHuyet = (_dongyData.phacDo || [])
            .filter(p => (p.idBenh ?? p.id_benh) == initialBenhId)
            .map(p => ({
                idHuyet: p.idHuyet ?? p.id_huyet,
                phuong_phap_tac_dong: p.phuong_phap_tac_dong || '',
                vai_tro_huyet: p.vai_tro_huyet || '',
                ghi_chu_ky_thuat: p.ghi_chu_ky_thuat || '',
            }))
            .filter(d => Number.isFinite(d.idHuyet));
    }

    const benhOpts = (_dongyData.benhDongY || []).map(b => {
        const bid = b.modelId || b.id || b.id_benh;
        const bname = b.ten || b.tieuket || 'Bệnh không tên';
        const selected = Number.isFinite(initialBenhId) && (initialBenhId == bid) ? 'selected' : '';
        return `<option value="${bid}" ${selected}>${escHtml(bname)}</option>`;
    }).join('');

    showTayyModal('Phương huyệt', `
        <label class="tayy-form-label">Bệnh đông y<br>
            <select id="pd-inp-benh" class="tayy-form-input" onchange="pdOnBenhChanged()">${benhOpts}</select>
        </label>

        <div style="margin-top:12px;">
            <label class="tayy-form-label" style="margin:0 0 8px 0;">
                Thêm huyệt (mỗi huyệt 1 dòng)
                <div style="position:relative; margin-top:6px;">
                    <input id="pd-ph-hv-search" type="text" class="tayy-form-input"
                        placeholder="Gõ tên huyệt để thêm..."
                        oninput="pdOnHuyetViSearchInput(this.value)">
                    <div id="pd-ph-hv-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 6px);
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
                <tbody id="pd-phuong-huyet-tbody" style="background:#FBF8F1;">
                    ${pdRenderPhuongHuyetRowsHtml()}
                </tbody>
            </table>
        </div>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhacDo()">Lưu</button>
        </div>
    `, 'wide');
}

function pdGetHuyetViById(idHuyet) {
    return (_dongyData.huyetVi || []).find(h => (h.idHuyet ?? h.id) == idHuyet) || null;
}

function pdRenderPhuongHuyetRowsHtml() {
    if (!_pdDraftPhuongHuyet || _pdDraftPhuongHuyet.length === 0) {
        return `<tr><td colspan="4" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa thêm huyệt</td></tr>`;
    }

    return (_pdDraftPhuongHuyet || []).map(d => {
        const hv = pdGetHuyetViById(d.idHuyet);
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
                        placeholder="ví dụ: bổ, tả, cứu..."
                        value="${escHtml(phuongPhap)}"
                        oninput="pdUpdatePhuongPhap(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="ví dụ: Quân, Thần, Tá, Sứ..."
                        value="${escHtml(vaiTro)}"
                        oninput="pdUpdateVaiTro(${d.idHuyet}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; text-align:center;">
                    <button class="btn btn-sm btn-danger"
                        style="padding:2px 7px; font-size:0.72rem; height:24px;"
                        type="button"
                        onclick="pdRemovePhuongHuyet(${d.idHuyet})">✕</button>
                </td>
            </tr>
        `;
    }).join('');
}

function pdRerenderPhuongHuyetRows() {
    const tbody = document.getElementById('pd-phuong-huyet-tbody');
    if (!tbody) return;
    tbody.innerHTML = pdRenderPhuongHuyetRowsHtml();
}

function pdOnHuyetViSearchInput(query) {
    const exactVal = (query || '').trim();
    const inpVal = exactVal.toLowerCase();
    const suggestEl = document.getElementById('pd-ph-hv-suggest');
    if (!suggestEl) return;

    if (!inpVal) {
        suggestEl.style.display = 'none';
        suggestEl.innerHTML = '';
        return;
    }

    const selectedIds = new Set((_pdDraftPhuongHuyet || []).map(d => d.idHuyet));
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
                onclick="pdAddPhuongHuyet(${h.idHuyet ?? h.id})">
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
                 onclick="softCreateHuyetVi('${escHtml(exactVal)}', 'pd')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm huyệt "${escHtml(exactVal)}"
                </div>
            </div>
        `;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function softCreateHuyetVi(name, context) {
    if (!name) return;

    const inpId = context === 'dh' ? 'dy-ph-hv-search' : 'pd-ph-hv-search';
    const suggestId = context === 'dh' ? 'dy-ph-hv-suggest' : 'pd-ph-hv-suggest';
    
    const inp = document.getElementById(inpId);
    const suggestEl = document.getElementById(suggestId);
    const oldVal = inp ? inp.value : '';
    
    if (inp) {
        inp.disabled = true;
        inp.value = 'Đang thêm...';
    }
    if (suggestEl) suggestEl.style.display = 'none';

    // Tạo payload trống những trường không cần thiết
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
        pdAddPhuongHuyet(newId);
    }
}

function pdAddPhuongHuyet(idHuyet) {
    if (!Number.isFinite(idHuyet)) return;
    const selected = (_pdDraftPhuongHuyet || []).some(d => d.idHuyet == idHuyet);
    if (selected) return;

    _pdDraftPhuongHuyet.push({
        idHuyet,
        phuong_phap_tac_dong: '',
        vai_tro_huyet: '',
        ghi_chu_ky_thuat: ''
    });
    pdRerenderPhuongHuyetRows();
}

function pdRemovePhuongHuyet(idHuyet) {
    _pdDraftPhuongHuyet = (_pdDraftPhuongHuyet || []).filter(d => d.idHuyet != idHuyet);
    pdRerenderPhuongHuyetRows();
}

function pdUpdatePhuongPhap(idHuyet, value) {
    const target = (_pdDraftPhuongHuyet || []).find(d => d.idHuyet == idHuyet);
    if (!target) return;
    target.phuong_phap_tac_dong = value ?? '';
}

function pdUpdateVaiTro(idHuyet, value) {
    const target = (_pdDraftPhuongHuyet || []).find(d => d.idHuyet == idHuyet);
    if (!target) return;
    target.vai_tro_huyet = value ?? '';
}

function pdOnBenhChanged() {
    const benhId = parseInt(document.getElementById('pd-inp-benh')?.value);
    if (!Number.isFinite(benhId)) return;

    _pdDraftPhuongHuyet = (_dongyData.phacDo || [])
        .filter(p => (p.idBenh ?? p.id_benh) == benhId)
        .map(p => ({
            idHuyet: p.idHuyet ?? p.id_huyet,
            phuong_phap_tac_dong: p.phuong_phap_tac_dong || '',
            vai_tro_huyet: p.vai_tro_huyet || '',
            ghi_chu_ky_thuat: p.ghi_chu_ky_thuat || '',
        }))
        .filter(d => Number.isFinite(d.idHuyet));

    pdRerenderPhuongHuyetRows();
    const suggestEl = document.getElementById('pd-ph-hv-suggest');
    if (suggestEl) { suggestEl.style.display = 'none'; suggestEl.innerHTML = ''; }
}

async function savePhacDo() {
    const benhId = parseInt(document.getElementById('pd-inp-benh')?.value);
    if (!Number.isFinite(benhId)) return alert('Thiếu bệnh đông y');

    const existing = (_dongyData.phacDo || []).filter(p => (p.idBenh ?? p.id_benh) == benhId);
    for (const p of existing) {
        const pid = p.idPhacDo ?? p.id;
        if (Number.isFinite(pid)) await apiDeletePhacDo(pid);
    }

    for (const d of _pdDraftPhuongHuyet || []) {
        if (!Number.isFinite(d.idHuyet)) continue;
        const payload = {
            id_benh: benhId,
            id_huyet: d.idHuyet,
            phuong_phap_tac_dong: (d.phuong_phap_tac_dong || '').trim() || undefined,
            vai_tro_huyet: (d.vai_tro_huyet || '').trim() || undefined,
            ghi_chu_ky_thuat: (d.ghi_chu_ky_thuat || '').trim() || undefined,
        };
        await apiCreatePhacDo(payload);
    }

    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}
async function deletePhacDo(id) { if(confirm('Xóa?')) { await apiDeletePhacDo(id); await loadAllDongyData(); renderDongySection(); } }

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
