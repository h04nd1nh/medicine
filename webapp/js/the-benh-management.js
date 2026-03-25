// the-benh-management.js — Quản lý Thể bệnh & Phương huyệt theo thể
// Được gọi từ màn hình chi tiết bệnh đông y (openBenhDongYForm)

// ─── State ────────────────────────────────────────────────
// _tbState lưu dữ liệu thể bệnh cho bệnh đang mở
let _tbState = {
    benhId: null,           // ID bệnh đang xem
    theBenh: [],            // flat list từ API
    draftHuyet: {},         // { [theBenhId]: [{ idHuyet, phuong_phap, ghi_chu, thu_tu }] }
    expandedIds: new Set(), // IDs đang mở rộng (accordion)
};

// ─── Khởi tạo cho 1 bệnh ─────────────────────────────────
async function tbLoadForBenh(benhId) {
    _tbState.benhId = benhId;
    _tbState.theBenh = [];
    _tbState.draftHuyet = {};
    _tbState.expandedIds = new Set();

    if (!benhId) return;
    try {
        const list = await apiGetTheBenh(benhId);
        _tbState.theBenh = list || [];
        // Load phương huyệt cho từng thể
        await Promise.all(_tbState.theBenh.map(async (tb) => {
            const ph = await apiGetTheBenhPhuongHuyet(tb.id);
            _tbState.draftHuyet[tb.id] = (ph || []).map(p => ({
                id: p.id,
                idHuyet: p.idHuyet ?? p.id_huyet,
                ten_huyet: p.huyetVi?.ten_huyet || '',
                phuong_phap: p.phuong_phap || '',
                vai_tro: p.vai_tro || '',
                ghi_chu: p.ghi_chu || '',
                thu_tu: p.thu_tu ?? 0,
            }));
        }));
    } catch (e) {
        console.error('Lỗi tải thể bệnh:', e);
    }
}

// ─── Build tree từ flat list ──────────────────────────────
function tbBuildTree(flatList) {
    const roots = [];
    const map = {};
    flatList.forEach(tb => { map[tb.id] = { ...tb, _children: [] }; });
    flatList.forEach(tb => {
        if (tb.parentId) {
            if (map[tb.parentId]) map[tb.parentId]._children.push(map[tb.id]);
        } else {
            roots.push(map[tb.id]);
        }
    });
    return roots;
}

// ─── Render toàn bộ section "Thể bệnh" ──────────────────
function tbRenderSection(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const tree = tbBuildTree(_tbState.theBenh);

    el.innerHTML = `
        <div style="margin-top:18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <div style="font-weight:800; color:#5B3A1A; font-size:0.95rem;">📋 Thể bệnh & Phương huyệt</div>
                <button class="btn btn-primary btn-sm" onclick="tbOpenAddTheBenhModal(null)">+ Thêm thể bệnh</button>
            </div>
            <div id="tb-tree-container">
                ${tree.length === 0
                    ? `<div style="color:#A09580; font-style:italic; font-size:0.85rem; padding:10px;">Chưa có thể bệnh nào. Nhấn "+ Thêm thể bệnh" để bắt đầu.</div>`
                    : tree.map(node => tbRenderNode(node, 0)).join('')
                }
            </div>
        </div>
    `;
}

function tbRenderNode(node, depth) {
    const isExpanded = _tbState.expandedIds.has(node.id);
    const huyetList = _tbState.draftHuyet[node.id] || [];
    const hasChildren = node._children && node._children.length > 0;
    const indent = depth * 20;

    const phuongHuyetRows = huyetList.length === 0
        ? `<tr><td colspan="4" style="text-align:center; color:#A09580; font-size:0.8rem; padding:8px;">Chưa có huyệt</td></tr>`
        : huyetList.map((h, idx) => `
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #EEE5D0; font-size:0.82rem;">${idx + 1}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #EEE5D0; font-weight:600; color:#5B3A1A; font-size:0.85rem;">
                    ${h.idHuyet ? escHtml(h.ten_huyet || '?') : '<em style="color:#A09580;">— Ghi chú —</em>'}
                </td>
                <td style="padding:6px 8px; border-bottom:1px solid #EEE5D0; font-size:0.82rem;">
                    <span style="background:${h.phuong_phap === 'Bổ' ? '#E8F5E9' : h.phuong_phap === 'Tả' ? '#FFEBEE' : '#FFF3E0'};
                        color:${h.phuong_phap === 'Bổ' ? '#2E7D32' : h.phuong_phap === 'Tả' ? '#C62828' : '#E65100'};
                        padding:2px 8px; border-radius:12px; font-weight:700; font-size:0.78rem;">
                        ${escHtml(h.phuong_phap || '—')}
                    </span>
                </td>
                <td style="padding:6px 8px; border-bottom:1px solid #EEE5D0; font-size:0.8rem; color:#8B7355;">
                    ${escHtml(h.ghi_chu || '')}
                </td>
            </tr>
        `).join('');

    return `
        <div style="margin-left:${indent}px; margin-bottom:6px; border:1px solid #E2D4B8; border-radius:10px; overflow:hidden; background:${depth === 0 ? '#FFFDF7' : '#FBF8F1'};">
            <!-- Header thể bệnh -->
            <div style="display:flex; align-items:center; gap:8px; padding:10px 12px; cursor:pointer; background:${depth === 0 ? '#F5F0E8' : '#F0EAD8'};"
                 onclick="tbToggleExpand(${node.id})">
                <span style="font-size:0.85rem; color:#8B7355; min-width:16px;">${isExpanded ? '▼' : '▶'}</span>
                <span style="font-weight:800; color:#5B3A1A; flex:1; font-size:${depth === 0 ? '0.92rem' : '0.85rem'};">
                    ${depth > 0 ? '<span style="color:#A09580; margin-right:4px;">↳</span>' : ''}
                    ${escHtml(node.ten_the_benh)}
                </span>
                ${node.mo_ta ? `<span style="font-size:0.75rem; color:#A09580; font-style:italic; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escHtml(node.mo_ta)}">${escHtml(node.mo_ta)}</span>` : ''}
                <div style="display:flex; gap:6px; flex-shrink:0;" onclick="event.stopPropagation()">
                    <button class="btn btn-sm" style="padding:2px 8px; font-size:0.72rem;"
                        onclick="tbOpenAddTheBenhModal(${node.id})">+ Điều kiện phụ</button>
                    <button class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.72rem;"
                        onclick="tbOpenEditTheBenhModal(${node.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" style="padding:2px 8px; font-size:0.72rem;"
                        onclick="tbDeleteTheBenh(${node.id})">🗑</button>
                </div>
            </div>

            <!-- Nội dung (khi mở rộng) -->
            ${isExpanded ? `
            <div style="padding:10px 12px;">
                <!-- Bảng phương huyệt -->
                <div style="margin-bottom:10px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                        <span style="font-size:0.8rem; font-weight:700; color:#8B7355;">Phương huyệt (${huyetList.length} huyệt)</span>
                        <button class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.72rem;"
                            onclick="tbOpenEditPhuongHuyetModal(${node.id})">✏ Sửa phương huyệt</button>
                    </div>
                    <table style="width:100%; border-collapse:collapse; font-size:0.82rem; background:#FBF8EE; border-radius:8px; overflow:hidden;">
                        <thead>
                            <tr style="background:#EDE5D0;">
                                <th style="padding:6px 8px; text-align:left; color:#5B3A1A; font-size:0.78rem; width:30px;">#</th>
                                <th style="padding:6px 8px; text-align:left; color:#5B3A1A; font-size:0.78rem;">Huyệt</th>
                                <th style="padding:6px 8px; text-align:left; color:#5B3A1A; font-size:0.78rem; width:80px;">Phương pháp</th>
                                <th style="padding:6px 8px; text-align:left; color:#5B3A1A; font-size:0.78rem;">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>${phuongHuyetRows}</tbody>
                    </table>
                </div>

                <!-- Điều kiện phụ con -->
                ${node._children.length > 0 ? `
                <div style="margin-top:8px;">
                    ${node._children.map(child => tbRenderNode(child, depth + 1)).join('')}
                </div>` : ''}
            </div>` : ''}
        </div>
    `;
}

function tbToggleExpand(id) {
    if (_tbState.expandedIds.has(id)) {
        _tbState.expandedIds.delete(id);
    } else {
        _tbState.expandedIds.add(id);
    }
    tbRerenderTree();
}

function tbRerenderTree() {
    const el = document.getElementById('tb-tree-container');
    if (!el) return;
    const tree = tbBuildTree(_tbState.theBenh);
    el.innerHTML = tree.length === 0
        ? `<div style="color:#A09580; font-style:italic; font-size:0.85rem; padding:10px;">Chưa có thể bệnh nào.</div>`
        : tree.map(node => tbRenderNode(node, 0)).join('');
}

// ─── Modal thêm/sửa thể bệnh ─────────────────────────────
function tbOpenAddTheBenhModal(parentId) {
    const parentName = parentId
        ? (_tbState.theBenh.find(x => x.id === parentId)?.ten_the_benh || '')
        : null;

    showTayyModal(
        parentId ? `Thêm điều kiện phụ cho "${escHtml(parentName)}"` : 'Thêm thể bệnh',
        `
        <label class="tayy-form-label">Tên thể bệnh / Điều kiện<br>
            <input id="tb-inp-ten" type="text" class="tayy-form-input"
                placeholder="VD: Tâm khí hư, Hư thoát / Cấp cứu...">
        </label>
        <label class="tayy-form-label">Mô tả / Điều kiện áp dụng<br>
            <textarea id="tb-inp-mota" class="tayy-form-input" rows="3"
                placeholder="VD: Nếu hư thoát, cần cấp cứu như chứng choáng ngất..."></textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="tbSaveNewTheBenh(${_tbState.benhId}, ${parentId || 'null'})">Lưu</button>
        </div>
        `
    );
}

async function tbSaveNewTheBenh(benhId, parentId) {
    const ten = document.getElementById('tb-inp-ten')?.value.trim();
    const mota = document.getElementById('tb-inp-mota')?.value.trim();
    if (!ten) return alert('Thiếu tên thể bệnh!');

    const payload = {
        id_benh: benhId,
        parent_id: parentId || null,
        ten_the_benh: ten,
        mo_ta: mota || null,
        thu_tu: _tbState.theBenh.filter(x => x.idBenh == benhId && !x.parentId).length,
    };

    const res = await apiCreateTheBenh(payload);
    if (!res.success && res.error) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await tbLoadForBenh(benhId);
    tbRerenderTree();
}

function tbOpenEditTheBenhModal(theBenhId) {
    const tb = _tbState.theBenh.find(x => x.id === theBenhId);
    if (!tb) return;

    showTayyModal('Sửa thể bệnh', `
        <label class="tayy-form-label">Tên thể bệnh / Điều kiện<br>
            <input id="tb-edit-ten" type="text" class="tayy-form-input"
                value="${escHtml(tb.ten_the_benh)}">
        </label>
        <label class="tayy-form-label">Mô tả / Điều kiện áp dụng<br>
            <textarea id="tb-edit-mota" class="tayy-form-input" rows="3">${escHtml(tb.mo_ta || '')}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="tbSaveEditTheBenh(${theBenhId})">Lưu</button>
        </div>
    `);
}

async function tbSaveEditTheBenh(theBenhId) {
    const ten = document.getElementById('tb-edit-ten')?.value.trim();
    const mota = document.getElementById('tb-edit-mota')?.value.trim();
    if (!ten) return alert('Thiếu tên thể bệnh!');

    const res = await apiUpdateTheBenh(theBenhId, { ten_the_benh: ten, mo_ta: mota || null });
    if (res.success === false) return alert('Lỗi: ' + (res.error || ''));
    closeTayyModal();

    // Cập nhật local state
    const idx = _tbState.theBenh.findIndex(x => x.id === theBenhId);
    if (idx >= 0) { _tbState.theBenh[idx].ten_the_benh = ten; _tbState.theBenh[idx].mo_ta = mota; }
    tbRerenderTree();
}

async function tbDeleteTheBenh(theBenhId) {
    if (!confirm('Xóa thể bệnh này và toàn bộ điều kiện phụ, phương huyệt con?')) return;
    const res = await apiDeleteTheBenh(theBenhId);
    if (res.success === false) return alert('Lỗi: ' + (res.error || ''));
    // Xóa khỏi local state (xóa cả con)
    _tbState.theBenh = _tbState.theBenh.filter(x => x.id !== theBenhId && x.parentId !== theBenhId);
    delete _tbState.draftHuyet[theBenhId];
    tbRerenderTree();
}

// ─── Modal sửa Phương Huyệt của 1 thể bệnh ──────────────
// Draft phương huyệt đang chỉnh (dùng trong modal)
let _tbPhDraft = [];
let _tbPhTheBenhId = null;

function tbOpenEditPhuongHuyetModal(theBenhId) {
    _tbPhTheBenhId = theBenhId;
    const tb = _tbState.theBenh.find(x => x.id === theBenhId);
    const tbName = tb?.ten_the_benh || '';

    // Clone draft từ state hiện tại
    _tbPhDraft = (_tbState.draftHuyet[theBenhId] || []).map(h => ({ ...h }));

    showTayyModal(`Phương huyệt: "${escHtml(tbName)}"`, `
        <div style="position:relative; margin-bottom:10px;">
            <input id="tb-ph-search" type="text" class="tayy-form-input"
                placeholder="Gõ tên huyệt để thêm..."
                oninput="tbPhOnSearchInput(this.value)">
            <div id="tb-ph-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                box-shadow:0 8px 24px rgba(0,0,0,0.12); max-height:200px; overflow-y:auto; z-index:2500; display:none;">
            </div>
        </div>

        <!-- Nút thêm ghi chú thuần văn bản -->
        <div style="margin-bottom:10px;">
            <button class="btn btn-sm btn-outline" onclick="tbPhAddGhiChu()">+ Thêm dòng ghi chú</button>
            <span style="font-size:0.78rem; color:#A09580; margin-left:6px;">Dùng cho nội dung "Sau đó dùng... / Nếu..."</span>
        </div>

        <div id="tb-ph-rows-wrapper">
            ${tbPhRenderRows()}
        </div>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="tbPhSave()">Lưu phương huyệt</button>
        </div>
    `, 'wide');
}

function tbPhRenderRows() {
    if (_tbPhDraft.length === 0) {
        return `<div id="tb-ph-rows" style="color:#A09580; font-style:italic; font-size:0.85rem; padding:8px;">Chưa có huyệt nào. Tìm kiếm huyệt phía trên để thêm.</div>`;
    }

    const rows = _tbPhDraft.map((h, idx) => {
        const phuongPhapOpts = ['', 'Bổ', 'Tả', 'Cứu bổ', 'Châm tả', 'Không châm'].map(v =>
            `<option value="${v}" ${h.phuong_phap === v ? 'selected' : ''}>${v || '-- Chọn --'}</option>`
        ).join('');

        return `
            <div style="display:flex; align-items:flex-start; gap:8px; padding:8px; border:1px solid #E2D4B8; border-radius:8px; margin-bottom:6px; background:#FBF8F1;">
                <span style="min-width:24px; text-align:center; font-size:0.78rem; color:#A09580; padding-top:8px;">${idx + 1}</span>
                <div style="flex:2;">
                    ${h.idHuyet
                        ? `<div style="font-weight:700; color:#5B3A1A; font-size:0.85rem; padding:6px 0;">${escHtml(h.ten_huyet)}</div>`
                        : `<input type="text" class="tayy-form-input" style="font-size:0.82rem;"
                            placeholder="Nội dung ghi chú..."
                            value="${escHtml(h.ghi_chu || '')}"
                            oninput="_tbPhDraft[${idx}].ghi_chu = this.value">`
                    }
                </div>
                ${h.idHuyet ? `
                <div style="flex:1;">
                    <select class="tayy-form-input" style="font-size:0.82rem; padding:6px 8px;"
                        onchange="_tbPhDraft[${idx}].phuong_phap = this.value">
                        ${phuongPhapOpts}
                    </select>
                </div>
                <div style="flex:1.5;">
                    <input type="text" class="tayy-form-input" style="font-size:0.82rem;"
                        placeholder="Ghi chú kỹ thuật..."
                        value="${escHtml(h.ghi_chu || '')}"
                        oninput="_tbPhDraft[${idx}].ghi_chu = this.value">
                </div>` : ''}
                <button class="btn btn-sm btn-danger" style="padding:4px 8px; flex-shrink:0;"
                    onclick="_tbPhDraft.splice(${idx}, 1); tbPhRerenderRows()">✕</button>
            </div>
        `;
    }).join('');

    return `<div id="tb-ph-rows">${rows}</div>`;
}

function tbPhRerenderRows() {
    const el = document.getElementById('tb-ph-rows-wrapper');
    if (el) el.innerHTML = tbPhRenderRows();
}

function tbPhAddGhiChu() {
    _tbPhDraft.push({ idHuyet: null, ten_huyet: '', phuong_phap: '', ghi_chu: '', thu_tu: _tbPhDraft.length });
    tbPhRerenderRows();
}

function tbPhOnSearchInput(query) {
    const inpVal = (query || '').trim().toLowerCase();
    const suggestEl = document.getElementById('tb-ph-suggest');
    if (!suggestEl) return;

    if (!inpVal) { suggestEl.style.display = 'none'; suggestEl.innerHTML = ''; return; }

    // Lấy huyệt từ _dongyData nếu có, hoặc từ _tbAllHuyet
    const allHuyet = (typeof _dongyData !== 'undefined' ? _dongyData.huyetVi : []) || [];
    const usedIds = new Set(_tbPhDraft.filter(h => h.idHuyet).map(h => h.idHuyet));
    const matches = allHuyet
        .filter(h => (h.ten_huyet || '').toLowerCase().includes(inpVal))
        .filter(h => !usedIds.has(h.idHuyet ?? h.id))
        .slice(0, 12);

    if (matches.length === 0) {
        suggestEl.style.display = 'block';
        suggestEl.innerHTML = `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy</div>`;
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = matches.map(h => `
        <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
            onmouseover="this.style.background='#F5F0E8'"
            onmouseout="this.style.background='transparent'"
            onclick="tbPhAddHuyet(${h.idHuyet ?? h.id}, '${escHtml((h.ten_huyet || '').replace(/'/g, ''))}')">
            <span style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(h.ten_huyet)}</span>
            ${h.kinhMach ? `<span style="color:#A09580; font-size:0.75rem; margin-left:6px;">${escHtml(h.kinhMach.ten_kinh_mach || '')}</span>` : ''}
        </div>
    `).join('');
}

function tbPhAddHuyet(idHuyet, tenHuyet) {
    _tbPhDraft.push({ idHuyet, ten_huyet: tenHuyet, phuong_phap: 'Bổ', ghi_chu: '', thu_tu: _tbPhDraft.length });
    tbPhRerenderRows();
    const inp = document.getElementById('tb-ph-search');
    const sug = document.getElementById('tb-ph-suggest');
    if (inp) inp.value = '';
    if (sug) { sug.style.display = 'none'; sug.innerHTML = ''; }
}

async function tbPhSave() {
    const theBenhId = _tbPhTheBenhId;
    if (!theBenhId) return;

    // Sync: gửi toàn bộ phuong_huyet để backend xóa cũ thêm mới
    const payload = {
        phuong_huyet: _tbPhDraft.map((h, idx) => ({
            id_huyet: h.idHuyet || null,
            phuong_phap: h.phuong_phap || null,
            vai_tro: h.vai_tro || null,
            ghi_chu: h.ghi_chu || null,
            thu_tu: idx,
        }))
    };

    const res = await apiUpdateTheBenh(theBenhId, payload);
    if (res.success === false) return alert('Lỗi: ' + (res.error || ''));

    // Cập nhật local state
    _tbState.draftHuyet[theBenhId] = _tbPhDraft.map((h, idx) => ({ ...h, thu_tu: idx }));
    closeTayyModal();
    tbRerenderTree();
}
