// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

let _thuocData = {
    viThuoc: [],
    baiThuoc: [],
    activeTab: 'vi-thuoc',
};

// Draft de chi_tiet (thành phần vị thuốc) đang được chỉnh trong modal bài thuốc
// Mục tiêu: UI nhập bằng chips, khi lưu sẽ gửi đúng `chi_tiet` lên backend.
let _btDraftChiTiet = [];

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
        const ingredients = (item.chiTietViThuoc || []).map(d => {
            const ten = d?.viThuoc?.ten_vi_thuoc || '';
            const lieu = (d?.lieu_luong || '').trim();
            return lieu ? `${ten} (${lieu})` : ten;
        }).filter(Boolean).join(', ');
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

    // Chuẩn hóa dữ liệu chi tiết hiện có -> state chips
    _btDraftChiTiet = (item?.chiTietViThuoc || []).map(d => {
        const idViThuoc = d?.idViThuoc ?? d?.id_vi_thuoc;
        return {
            idViThuoc,
            lieu_luong: d?.lieu_luong ?? '',
            vai_tro: d?.vai_tro ?? '',
            ghi_chu: d?.ghi_chu ?? '',
        };
    }).filter(x => Number.isFinite(x.idViThuoc));

    const rowsHtml = btRenderBaiThuocChiTietRowsHtml();
    showTayyModal('Bài thuốc', `
        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item?escHtml(item.ten_bai_thuoc):''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item?escHtml(item.nguon_goc):''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item?escHtml(item.cach_dung):''}</textarea></label>

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
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:26%;">Tên vị thuốc</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:18%;">Liều lượng</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:18%;">Vai trò</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:19%;">Ngũ vị</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:19%;">Quy kinh</th>
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
            <button class="btn btn-primary" onclick="saveBaiThuoc(${id||0})">Lưu</button>
        </div>
    `, 'wide');

    // Khởi tạo UI suggestion cho modal mới
    setTimeout(() => {
        btOnViThuocSearchInput('');
    }, 0);
}

async function saveBaiThuoc(id) {
    // Luôn gửi chi_tiet để backend có thể xóa/thêm lại theo state chips.
    const chi_tiet = (_btDraftChiTiet || []).map(d => {
        const idViThuoc = d?.idViThuoc;
        const obj = {
            // gửi cả 2 key để tránh lệch mapping (idViThuoc vs id_vi_thuoc)
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
        chi_tiet
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

function btGetViThuocById(idViThuoc) {
    return _thuocData.viThuoc.find(v => (v.id === idViThuoc)) || null;
}

function btRenderBaiThuocChiTietRowsHtml() {
    if (!_btDraftChiTiet || _btDraftChiTiet.length === 0) {
        return `<tr><td colspan="5" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa thêm vị thuốc</td></tr>`;
    }

    return _btDraftChiTiet.map(d => {
        const vt = btGetViThuocById(d.idViThuoc);
        const ten = vt?.ten_vi_thuoc || d?.ten_vi_thuoc || 'Vị thuốc';
        const lieu = d?.lieu_luong || '';
        const vaiTro = d?.vai_tro || '';
        const ngu_vi = vt?.tinh_vi || '';
        const quy_kinh = vt?.quy_kinh || '';

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
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="liều..."
                        value="${escHtml(lieu)}"
                        oninput="btUpdateBaiThuocChipLieu(${d.idViThuoc}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="ví dụ: Quân, Thần, Tá, Sứ..."
                        value="${escHtml(vaiTro)}"
                        oninput="btUpdateBaiThuocChipVaiTro(${d.idViThuoc}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; color:#5B3A1A; font-size:0.85rem;">
                    ${escHtml(ngu_vi || '—')}
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; color:#5B3A1A; font-size:0.85rem;">
                    ${escHtml(quy_kinh || '—')}
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
    const inpVal = (query || '').trim().toLowerCase();
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

    if (matches.length === 0) {
        suggestEl.style.display = 'block';
        suggestEl.innerHTML = `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy</div>`;
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = matches.map(v => `
        <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'"
             onmouseout="this.style.background='transparent'"
             onclick="btAddViThuocChip(${v.id})">
            <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(v.ten_vi_thuoc || '')}</div>
        </div>
    `).join('');
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

function btUpdateBaiThuocChipVaiTro(viThuocId, vaiValue) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;
    target.vai_tro = vaiValue ?? '';
}
