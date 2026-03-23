// tayy-management.js — Quản lý Bệnh Tây Y (CRUD Frontend)
// Bao gồm: Chủng bệnh, Bệnh tây y, Phương thuốc, Triệu chứng

let _tayyData = {
    chungBenh: [],
    benhTayY: [],
    phuongThuoc: [],
    trieuChung: [],
    activeTab: 'chung-benh',
};

// ─── Khởi tạo ─────────────────────────────────────────────
async function initTayyManagement() {
    await loadAllTayyData();
    renderTayySection();
}

async function loadAllTayyData() {
    try {
        const [cb, bty, pt, tc] = await Promise.all([
            apiGetChungBenh(),
            apiGetBenhTayY(),
            apiGetPhuongThuoc(),
            apiGetTrieuChung(),
        ]);
        _tayyData.chungBenh = cb || [];
        _tayyData.benhTayY = bty || [];
        _tayyData.phuongThuoc = pt || [];
        _tayyData.trieuChung = tc || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Tây y:', e);
    }
}

// ─── Render section chính ─────────────────────────────────
function renderTayySection() {
    const container = document.getElementById('tayy-section');
    if (!container) return;

    const tab = _tayyData.activeTab;
    container.innerHTML = `
        <div class="section">
            <div class="section-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                <h2 style="color: var(--secondary); margin:0;">Quản lý Bệnh Tây Y</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border);">
                <button class="tayy-tab ${tab === 'chung-benh' ? 'active' : ''}" onclick="switchTayyTab('chung-benh')">Chủng bệnh</button>
                <button class="tayy-tab ${tab === 'benh-tay-y' ? 'active' : ''}" onclick="switchTayyTab('benh-tay-y')">Bệnh tây y</button>
                <button class="tayy-tab ${tab === 'phuong-thuoc' ? 'active' : ''}" onclick="switchTayyTab('phuong-thuoc')">Phương thuốc</button>
                <button class="tayy-tab ${tab === 'trieu-chung' ? 'active' : ''}" onclick="switchTayyTab('trieu-chung')">Triệu chứng</button>
            </div>

            <div id="tayy-tab-content"></div>
        </div>
    `;

    renderTayyTabContent();
}

function switchTayyTab(tab) {
    _tayyData.activeTab = tab;
    renderTayySection();
}

function renderTayyTabContent() {
    const el = document.getElementById('tayy-tab-content');
    if (!el) return;

    switch (_tayyData.activeTab) {
        case 'chung-benh': renderChungBenhTab(el); break;
        case 'benh-tay-y': renderBenhTayYTab(el); break;
        case 'phuong-thuoc': renderPhuongThuocTab(el); break;
        case 'trieu-chung': renderTrieuChungTab(el); break;
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: CHỦNG BỆNH
// ═══════════════════════════════════════════════════════════
function renderChungBenhTab(el) {
    const rows = _tayyData.chungBenh.map(item => `
        <tr>
            <td style="text-align:center;width:60px;">${item.id}</td>
            <td>${escHtml(item.ten_chung_benh)}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editChungBenh(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteChungBenh(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openChungBenhForm()">+ Thêm chủng bệnh</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th style="width:60px;">ID</th><th>Tên chủng bệnh</th><th style="width:160px;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openChungBenhForm(id) {
    const item = id ? _tayyData.chungBenh.find(x => x.id === id) : null;
    const title = item ? 'Sửa chủng bệnh' : 'Thêm chủng bệnh mới';
    showTayyModal(title, `
        <label class="tayy-form-label">Tên chủng bệnh<br>
            <input id="tayy-inp-chungbenh" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_chung_benh) : ''}" placeholder="Nhập tên chủng bệnh...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveChungBenh(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('tayy-inp-chungbenh')?.focus(), 100);
}

function editChungBenh(id) { openChungBenhForm(id); }

async function saveChungBenh(id) {
    const val = document.getElementById('tayy-inp-chungbenh')?.value.trim();
    if (!val) return alert('Vui lòng nhập tên chủng bệnh');

    let result;
    if (id) {
        result = await apiUpdateChungBenh(id, { ten_chung_benh: val });
    } else {
        result = await apiCreateChungBenh({ ten_chung_benh: val });
    }

    if (result.success === false) return alert(result.error || 'Thao tác thất bại');
    closeTayyModal();
    await loadAllTayyData();
    renderTayySection();
}

async function deleteChungBenh(id) {
    if (!confirm('Bạn có chắc muốn xóa chủng bệnh này? Tất cả bệnh tây y thuộc chủng này cũng sẽ bị xóa.')) return;
    const result = await apiDeleteChungBenh(id);
    if (result.success === false) return alert(result.error || 'Xóa thất bại');
    await loadAllTayyData();
    renderTayySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: BỆNH TÂY Y
// ═══════════════════════════════════════════════════════════
function renderBenhTayYTab(el) {
    const rows = _tayyData.benhTayY.map(item => {
        const chungBenhName = item.chungBenh ? escHtml(item.chungBenh.ten_chung_benh) : '—';
        const ptNames = (item.phuongThuocList || []).map(p => escHtml(p.ten_phuong_thuoc)).join(', ') || '—';
        const tcNames = (item.trieuChungList || []).map(t => escHtml(t.ten_trieu_chung)).join(', ') || '—';
        return `
            <tr>
                <td style="text-align:center;width:50px;">${item.id}</td>
                <td><strong>${escHtml(item.ten_benh)}</strong></td>
                <td><span style="color:#8B7355;">${chungBenhName}</span></td>
                <td style="font-size:0.82rem;">${ptNames}</td>
                <td style="font-size:0.82rem;">${tcNames}</td>
                <td style="text-align:center;width:160px;">
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="editBenhTayY(${item.id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBenhTayY(${item.id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBenhTayYForm()">+ Thêm bệnh tây y</button>
        </div>
        <div class="data-table-container" style="overflow-x:auto;">
            <table>
                <thead><tr>
                    <th style="width:50px;">ID</th>
                    <th>Tên bệnh</th>
                    <th>Chủng bệnh</th>
                    <th>Phương thuốc</th>
                    <th>Triệu chứng</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openBenhTayYForm(id) {
    const item = id ? _tayyData.benhTayY.find(x => x.id === id) : null;
    const title = item ? 'Sửa bệnh tây y' : 'Thêm bệnh tây y mới';

    const cbOptions = _tayyData.chungBenh.map(c => `<option value="${c.id}" ${item && item.idChungBenh === c.id ? 'selected' : ''}>${escHtml(c.ten_chung_benh)}</option>`).join('');

    const ptChecks = _tayyData.phuongThuoc.map(p => {
        const checked = item && (item.phuongThuocList || []).some(x => x.id === p.id) ? 'checked' : '';
        return `<label class="tayy-check-label"><input type="checkbox" value="${p.id}" ${checked}> ${escHtml(p.ten_phuong_thuoc)}</label>`;
    }).join('');

    const tcChecks = _tayyData.trieuChung.map(t => {
        const checked = item && (item.trieuChungList || []).some(x => x.id === t.id) ? 'checked' : '';
        return `<label class="tayy-check-label"><input type="checkbox" value="${t.id}" ${checked}> ${escHtml(t.ten_trieu_chung)}</label>`;
    }).join('');

    showTayyModal(title, `
        <label class="tayy-form-label">Tên bệnh<br>
            <input id="tayy-inp-tenbenh" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_benh) : ''}" placeholder="Nhập tên bệnh...">
        </label>
        <label class="tayy-form-label">Chủng bệnh<br>
            <select id="tayy-inp-chungbenh-select" class="tayy-form-input">
                <option value="">-- Chọn chủng bệnh --</option>
                ${cbOptions}
            </select>
        </label>
        <div class="tayy-form-label">Phương thuốc
            <div id="tayy-pt-checks" class="tayy-check-grid">${ptChecks || '<span style="color:#A09580;font-size:0.82rem;">Chưa có phương thuốc nào</span>'}</div>
        </div>
        <div class="tayy-form-label">Triệu chứng
            <div id="tayy-tc-checks" class="tayy-check-grid">${tcChecks || '<span style="color:#A09580;font-size:0.82rem;">Chưa có triệu chứng nào</span>'}</div>
        </div>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhTayY(${id || 0})">Lưu</button>
        </div>
    `, 'wide');
    setTimeout(() => document.getElementById('tayy-inp-tenbenh')?.focus(), 100);
}

function editBenhTayY(id) { openBenhTayYForm(id); }

async function saveBenhTayY(id) {
    const tenBenh = document.getElementById('tayy-inp-tenbenh')?.value.trim();
    const cbSelect = document.getElementById('tayy-inp-chungbenh-select');
    const idChungBenh = cbSelect ? parseInt(cbSelect.value) : 0;

    if (!tenBenh) return alert('Vui lòng nhập tên bệnh');
    if (!idChungBenh) return alert('Vui lòng chọn chủng bệnh');

    const ptIds = Array.from(document.querySelectorAll('#tayy-pt-checks input:checked')).map(c => parseInt(c.value));
    const tcIds = Array.from(document.querySelectorAll('#tayy-tc-checks input:checked')).map(c => parseInt(c.value));

    const payload = {
        ten_benh: tenBenh,
        id_chung_benh: idChungBenh,
        phuong_thuoc_ids: ptIds,
        trieu_chung_ids: tcIds,
    };

    let result;
    if (id) {
        result = await apiUpdateBenhTayY(id, payload);
    } else {
        result = await apiCreateBenhTayY(payload);
    }

    if (result.success === false) return alert(result.error || 'Thao tác thất bại');
    closeTayyModal();
    await loadAllTayyData();
    renderTayySection();
}

async function deleteBenhTayY(id) {
    if (!confirm('Bạn có chắc muốn xóa bệnh tây y này?')) return;
    const result = await apiDeleteBenhTayY(id);
    if (result.success === false) return alert(result.error || 'Xóa thất bại');
    await loadAllTayyData();
    renderTayySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: PHƯƠNG THUỐC
// ═══════════════════════════════════════════════════════════
function renderPhuongThuocTab(el) {
    const rows = _tayyData.phuongThuoc.map(item => `
        <tr>
            <td style="text-align:center;width:60px;">${item.id}</td>
            <td>${escHtml(item.ten_phuong_thuoc)}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editPhuongThuoc(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePhuongThuoc(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openPhuongThuocForm()">+ Thêm phương thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th style="width:60px;">ID</th><th>Tên phương thuốc</th><th style="width:160px;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openPhuongThuocForm(id) {
    const item = id ? _tayyData.phuongThuoc.find(x => x.id === id) : null;
    const title = item ? 'Sửa phương thuốc' : 'Thêm phương thuốc mới';
    showTayyModal(title, `
        <label class="tayy-form-label">Tên phương thuốc<br>
            <input id="tayy-inp-pt" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_phuong_thuoc) : ''}" placeholder="Nhập tên phương thuốc...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhuongThuoc(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('tayy-inp-pt')?.focus(), 100);
}

function editPhuongThuoc(id) { openPhuongThuocForm(id); }

async function savePhuongThuoc(id) {
    const val = document.getElementById('tayy-inp-pt')?.value.trim();
    if (!val) return alert('Vui lòng nhập tên phương thuốc');

    let result;
    if (id) {
        result = await apiUpdatePhuongThuoc(id, { ten_phuong_thuoc: val });
    } else {
        result = await apiCreatePhuongThuoc({ ten_phuong_thuoc: val });
    }

    if (result.success === false) return alert(result.error || 'Thao tác thất bại');
    closeTayyModal();
    await loadAllTayyData();
    renderTayySection();
}

async function deletePhuongThuoc(id) {
    if (!confirm('Bạn có chắc muốn xóa phương thuốc này?')) return;
    const result = await apiDeletePhuongThuoc(id);
    if (result.success === false) return alert(result.error || 'Xóa thất bại');
    await loadAllTayyData();
    renderTayySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: TRIỆU CHỨNG
// ═══════════════════════════════════════════════════════════
function renderTrieuChungTab(el) {
    const rows = _tayyData.trieuChung.map(item => `
        <tr>
            <td style="text-align:center;width:60px;">${item.id}</td>
            <td>${escHtml(item.ten_trieu_chung)}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editTrieuChung(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrieuChung(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openTrieuChungForm()">+ Thêm triệu chứng</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th style="width:60px;">ID</th><th>Tên triệu chứng</th><th style="width:160px;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openTrieuChungForm(id) {
    const item = id ? _tayyData.trieuChung.find(x => x.id === id) : null;
    const title = item ? 'Sửa triệu chứng' : 'Thêm triệu chứng mới';
    showTayyModal(title, `
        <label class="tayy-form-label">Tên triệu chứng<br>
            <input id="tayy-inp-tc" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_trieu_chung) : ''}" placeholder="Nhập tên triệu chứng...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveTrieuChung(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('tayy-inp-tc')?.focus(), 100);
}

function editTrieuChung(id) { openTrieuChungForm(id); }

async function saveTrieuChung(id) {
    const val = document.getElementById('tayy-inp-tc')?.value.trim();
    if (!val) return alert('Vui lòng nhập tên triệu chứng');

    let result;
    if (id) {
        result = await apiUpdateTrieuChung(id, { ten_trieu_chung: val });
    } else {
        result = await apiCreateTrieuChung({ ten_trieu_chung: val });
    }

    if (result.success === false) return alert(result.error || 'Thao tác thất bại');
    closeTayyModal();
    await loadAllTayyData();
    renderTayySection();
}

async function deleteTrieuChung(id) {
    if (!confirm('Bạn có chắc muốn xóa triệu chứng này?')) return;
    const result = await apiDeleteTrieuChung(id);
    if (result.success === false) return alert(result.error || 'Xóa thất bại');
    await loadAllTayyData();
    renderTayySection();
}

// ═══════════════════════════════════════════════════════════
// MODAL CHUNG
// ═══════════════════════════════════════════════════════════
function showTayyModal(title, bodyHtml, widthClass) {
    let modal = document.getElementById('tayy-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'tayy-modal';
        document.body.appendChild(modal);
    }
    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1400;align-items:center;justify-content:center;';
    const maxW = widthClass === 'wide' ? '780px' : '480px';
    modal.innerHTML = `
        <div style="background:#FFFDF7;width:90%;max-width:${maxW};padding:20px 24px;border-radius:12px;border:1px solid #D4C5A0;box-shadow:0 8px 28px rgba(0,0,0,0.25);max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #5B3A1A;padding-bottom:8px;margin-bottom:14px;">
                <div style="font-weight:900;color:#5B3A1A;font-size:1rem;">${title}</div>
                <button class="btn" onclick="closeTayyModal()" style="padding:2px 10px;">✕</button>
            </div>
            ${bodyHtml}
        </div>
    `;
}

function closeTayyModal() {
    const modal = document.getElementById('tayy-modal');
    if (modal) modal.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
