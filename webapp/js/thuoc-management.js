// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

let _thuocData = {
    viThuoc: [],
    baiThuoc: [],
    kinhMach: [],
    huyetVi: [], // Thêm Huyệt vị
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
        const [vt, bt, km, hv] = await Promise.all([
            apiGetViThuoc(),
            apiGetBaiThuoc(),
            apiGetKinhMach(),
            apiGetHuyetVi(),
        ]);
        _thuocData.viThuoc = vt || [];
        _thuocData.baiThuoc = bt || [];
        _thuocData.kinhMach = km || [];
        _thuocData.huyetVi = hv || [];
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
            <td style="text-align:center;">${escHtml(item.tinh || '')}</td>
            <td style="text-align:center;">${escHtml(item.vi || '')}</td>
            <td style="text-align:center;">${escHtml(item.quy_kinh || '')}</td>
            <td style="font-size:0.8rem;">${escHtml(item.cong_dung || '')}</td>
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
                <thead><tr><th>Tên vị thuốc</th><th style="text-align:center;">Tính</th><th style="text-align:center;">Vị</th><th style="text-align:center;">Quy kinh</th><th>Công dụng</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;
    showTayyModal('Vị thuốc', `
        <label class="tayy-form-label">Tên vị thuốc<br><input id="vt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_vi_thuoc) : ''}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Tính (khí)<br>
                <select id="vt-inp-tinh" class="tayy-form-input">
                    <option value="">-- Chọn --</option>
                    <option value="Hàn" ${item && item.tinh === 'Hàn' ? 'selected' : ''}>Hàn</option>
                    <option value="Nhiệt" ${item && item.tinh === 'Nhiệt' ? 'selected' : ''}>Nhiệt</option>
                    <option value="Ôn" ${item && item.tinh === 'Ôn' ? 'selected' : ''}>Ôn</option>
                    <option value="Lương" ${item && item.tinh === 'Lương' ? 'selected' : ''}>Lương</option>
                    <option value="Bình" ${item && item.tinh === 'Bình' ? 'selected' : ''}>Bình</option>
                </select>
            </label>
            <label class="tayy-form-label">Vị (ngũ vị)<br>
                <select id="vt-inp-vi" class="tayy-form-input">
                    <option value="">-- Chọn --</option>
                    <option value="Chua" ${item && item.vi === 'Chua' ? 'selected' : ''}>Chua</option>
                    <option value="Đắng" ${item && item.vi === 'Đắng' ? 'selected' : ''}>Đắng</option>
                    <option value="Ngọt" ${item && item.vi === 'Ngọt' ? 'selected' : ''}>Ngọt</option>
                    <option value="Cay" ${item && item.vi === 'Cay' ? 'selected' : ''}>Cay</option>
                    <option value="Mặn" ${item && item.vi === 'Mặn' ? 'selected' : ''}>Mặn</option>
                    <option value="Nhạt" ${item && item.vi === 'Nhạt' ? 'selected' : ''}>Nhạt</option>
                </select>
            </label>
        </div>
        <label class="tayy-form-label">Quy kinh (chọn nhiều)<br>
            <div style="position:relative;">
                <div id="vt-quykinh-chips" class="chips-container" onclick="document.getElementById('vt-inp-quykinh').focus()">
                    <!-- Chips will be rendered here -->
                    <input id="vt-inp-quykinh" type="text" class="chip-input" 
                        placeholder="Thêm kinh mạch..." 
                        oninput="vtOnQuyKinhSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value){vtSelectQuyKinh(this.value); event.preventDefault();} if(event.key==='Backspace' && !this.value) vtRemoveLastQuyKinhChip()">
                </div>
                <div id="vt-quykinh-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <label class="tayy-form-label">Công dụng<br><textarea id="vt-inp-congdung" class="tayy-form-input" rows="3">${item ? escHtml(item.cong_dung) : ''}</textarea></label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id || 0})">Lưu</button>
        </div>
    `);

    // Khởi tạo chips
    _vtCurrentQuyKinh = (item?.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    vtRenderQuyKinhChips();
}

let _vtCurrentQuyKinh = [];

function vtRenderQuyKinhChips() {
    const container = document.getElementById('vt-quykinh-chips');
    const input = document.getElementById('vt-inp-quykinh');
    if (!container || !input) return;

    // Remove old chips
    container.querySelectorAll('.chip').forEach(c => c.remove());

    _vtCurrentQuyKinh.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="vtRemoveQuyKinhChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
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

    const lastPart = val.trim().toLowerCase();

    if (!lastPart) {
        suggestEl.style.display = 'none';
        return;
    }

    const matchesKM = (_thuocData.kinhMach || []).filter(k => (k.ten_kinh_mach || '').toLowerCase().includes(lastPart));
    const matchesHV = (_thuocData.huyetVi || []).filter(h => (h.ten_huyet || '').toLowerCase().includes(lastPart));
    const allMatches = [...matchesKM.map(k => k.ten_kinh_mach), ...matchesHV.map(h => h.ten_huyet)].slice(0, 10);

    // Lọc bỏ những cái đã chọn
    const filteredMatches = allMatches.filter(m => !_vtCurrentQuyKinh.includes(m));

    if (filteredMatches.length === 0) {
        suggestEl.style.display = 'none';
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = filteredMatches.map(m => `
        <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'"
             onmouseout="this.style.background='transparent'"
             onclick="vtSelectQuyKinh('${escHtml(m)}')">
            ${escHtml(m)}
        </div>
    `).join('');
}

function vtSelectQuyKinh(name) {
    if (!_vtCurrentQuyKinh.includes(name)) {
        _vtCurrentQuyKinh.push(name);
    }
    const inp = document.getElementById('vt-inp-quykinh');
    if (inp) {
        inp.value = '';
        inp.focus();
    }
    vtRenderQuyKinhChips();
    document.getElementById('vt-quykinh-suggest').style.display = 'none';
}

async function saveViThuoc(id) {
    const payload = { 
        ten_vi_thuoc: document.getElementById('vt-inp-ten').value.trim(), 
        tinh: document.getElementById('vt-inp-tinh').value.trim(),
        vi: document.getElementById('vt-inp-vi').value.trim(),
        quy_kinh: _vtCurrentQuyKinh.join(', '), 
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
            quy_kinh: d?.quy_kinh ?? d?.viThuoc?.quy_kinh ?? '',
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
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:25%;">Tên vị thuốc</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:20%;">Liều lượng</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:20%;">Vai trò</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:35%;">Quy kinh</th>
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

        const quyKinh = (d?.quy_kinh || '').trim();
        if (quyKinh) obj.quy_kinh = quyKinh.replace(/,$/, '');

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
        return `<tr><td colspan="4" style="text-align:center; color:#A09580; padding:12px; border:1px solid #E2D4B8;">Chưa thêm vị thuốc</td></tr>`;
    }

    return _btDraftChiTiet.map(d => {
        const vt = btGetViThuocById(d.idViThuoc);
        const ten = vt?.ten_vi_thuoc || d?.ten_vi_thuoc || 'Vị thuốc';
        const lieu = d?.lieu_luong || '';
        const vaiTro = d?.vai_tro || '';
        const quy_kinh = (d?.quy_kinh || vt?.quy_kinh || '');

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
                        placeholder="Quân, Thần..."
                        value="${escHtml(vaiTro)}"
                        oninput="btUpdateBaiThuocChipVaiTro(${d.idViThuoc}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; position:relative;">
                    <div id="bt-quykinh-chips-${d.idViThuoc}" class="chips-container" 
                        style="min-height:34px; padding:2px 6px;"
                        onclick="document.getElementById('bt-quykinh-inp-${d.idViThuoc}').focus()">
                        <!-- Chips will be rendered here -->
                        <input id="bt-quykinh-inp-${d.idViThuoc}" type="text" class="chip-input" 
                            style="min-width:40px; font-size:0.75rem;"
                            placeholder="..."
                            oninput="btOnQuyKinhTableSearchInput(${d.idViThuoc}, this.value)"
                            onkeydown="if(event.key==='Enter' && this.value){btSelectQuyKinhTable(${d.idViThuoc}, this.value); event.preventDefault();} if(event.key==='Backspace' && !this.value) btRemoveLastQuyKinhTableChip(${d.idViThuoc})">
                    </div>
                    <div id="bt-quykinh-suggest-${d.idViThuoc}" style="position:absolute; left:8px; right:8px; top:calc(100% + 2px);
                        background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                        box-shadow:0 5px 15px rgba(0,0,0,0.1);
                        max-height:150px; overflow-y:auto; z-index:3000; display:none;"></div>
                </td>
            </tr>
        `;
    }).join('');
}

function btOnQuyKinhTableSearchInput(viThuocId, val) {
    const suggestEl = document.getElementById(`bt-quykinh-suggest-${viThuocId}`);
    if (!suggestEl) return;

    const lastPart = val.trim().toLowerCase();

    if (!lastPart) {
        suggestEl.style.display = 'none';
        return;
    }

    const matchesKM = (_thuocData.kinhMach || []).filter(k => (k.ten_kinh_mach || '').toLowerCase().includes(lastPart));
    const matchesHV = (_thuocData.huyetVi || []).filter(h => (h.ten_huyet || '').toLowerCase().includes(lastPart));
    const allMatches = [...matchesKM.map(k => k.ten_kinh_mach), ...matchesHV.map(h => h.ten_huyet)].slice(0, 10);

    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    const selected = (target?.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    const filteredMatches = allMatches.filter(m => !selected.includes(m));

    if (filteredMatches.length === 0) {
        suggestEl.style.display = 'none';
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = filteredMatches.map(m => `
        <div style="padding:6px 8px; cursor:pointer; border-bottom:1px solid #F0E8D8; font-size:0.82rem;"
             onmouseover="this.style.background='#F5F0E8'"
             onmouseout="this.style.background='transparent'"
             onclick="btSelectQuyKinhTable(${viThuocId}, '${escHtml(m)}')">
            ${escHtml(m)}
        </div>
    `).join('');
}

function btSelectQuyKinhTable(viThuocId, name) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;

    let selected = (target.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!selected.includes(name)) {
        selected.push(name);
        target.quy_kinh = selected.join(', ');
    }

    const inp = document.getElementById(`bt-quykinh-inp-${viThuocId}`);
    if (inp) {
        inp.value = '';
        inp.focus();
    }
    btRenderQuyKinhTableChips(viThuocId);
    document.getElementById(`bt-quykinh-suggest-${viThuocId}`).style.display = 'none';
}

function btRenderQuyKinhTableChips(viThuocId) {
    const container = document.getElementById(`bt-quykinh-chips-${viThuocId}`);
    const input = document.getElementById(`bt-quykinh-inp-${viThuocId}`);
    if (!container || !input) return;

    // Clear old chips
    container.querySelectorAll('.chip').forEach(c => c.remove());

    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    const selected = (target?.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);

    selected.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.padding = '2px 8px';
        chip.style.fontSize = '0.72rem';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" style="width:14px; height:14px; font-size:0.8rem;" onclick="btRemoveQuyKinhTableChip(${viThuocId}, '${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemoveQuyKinhTableChip(viThuocId, name) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;

    let selected = (target.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    selected = selected.filter(x => x !== name);
    target.quy_kinh = selected.join(', ');
    btRenderQuyKinhTableChips(viThuocId);
}

function btRemoveLastQuyKinhTableChip(viThuocId) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;

    let selected = (target.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    if (selected.length > 0) {
        selected.pop();
        target.quy_kinh = selected.join(', ');
        btRenderQuyKinhTableChips(viThuocId);
    }
}

function btRerenderBaiThuocChiTietRows() {
    const el = document.getElementById('bt-ingredient-tbody');
    if (!el) return;
    el.innerHTML = btRenderBaiThuocChiTietRowsHtml();

    // Render chips for each row
    (_btDraftChiTiet || []).forEach(d => {
        btRenderQuyKinhTableChips(d.idViThuoc);
    });
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

function btUpdateBaiThuocChipVaiTro(viThuocId, vaiValue) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;
    target.vai_tro = vaiValue ?? '';
}

function btUpdateBaiThuocChipVi(viThuocId, viValue) {
    // No-op - Tình/Vị removed from UI
}

function btUpdateBaiThuocChipQuyKinh(viThuocId, quyValue) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc === viThuocId);
    if (!target) return;
    target.quy_kinh = quyValue ?? '';
}
