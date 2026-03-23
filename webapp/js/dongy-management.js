// dongy-management.js — Quản lý Danh mục Đông Y đa tầng
// Bao gồm: Bệnh, Kinh mạch, Huyệt vị, Vị thuốc, Bài thuốc, Phác đồ

let _dongyData = {
    benhDongY: [],
    kinhMach: [],
    huyetVi: [],
    phacDo: [],
    activeTab: 'benh-dong-y',
};

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
                <button class="tayy-tab ${tab === 'phac-do' ? 'active' : ''}" onclick="switchDongyTab('phac-do')">Phác đồ châm cứu</button>
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
// TAB: DANH MỤC BỆNH (BENH DONG Y) (Giữ nguyên logic cũ đã fix)
// ═══════════════════════════════════════════════════════════
function renderBenhDongYTab(el) {
    if (!_dongyData.benhDongY || _dongyData.benhDongY.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:20px;">Chưa có dữ liệu Bệnh đông y <button class="btn btn-primary btn-sm" onclick="openBenhDongYForm()">+ Thêm mới</button></div>';
        return;
    }

    const rows = _dongyData.benhDongY.map(item => {
        const getV = (obj, ...keys) => {
            const lowerKeys = keys.map(k => k.toLowerCase());
            for (let k in obj) { if (lowerKeys.includes(k.toLowerCase())) return obj[k]; }
            return '';
        };
        const id = getV(item, 'id', 'id_benh', 'modelId');
        const ten = getV(item, 'ten', 'tieuket', 'ten_benh', 'name');
        const nhom = getV(item, 'nhomid', 'nhomChinh', 'nhom_benh');
        const tc = getV(item, 'trieuchung', 'trieu_chung_chinh');

        return `
            <tr>
                <td style="font-weight:700; color:#5B3A1A;">
                    ${escHtml(ten)}
                    ${nhom ? `<br><small style="color:#A09580;">ID Nhóm: ${nhom}</small>` : ''}
                </td>
                <td style="font-size:0.82rem; line-height:1.45; text-align:left;">
                    <div style="max-height:100px; overflow-y:auto; padding-right:6px;">${tc || '—'}</div>
                </td>
                <td style="text-align:center;width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openBenhDongYForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBenhDongY(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBenhDongYForm()">+ Thêm bệnh</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th>Tên bệnh</th><th>Triệu chứng</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function openBenhDongYForm(givenId) {
    const item = givenId ? _dongyData.benhDongY.find(x => (x.id == givenId || x.id_benh == givenId)) : null;
    const realId = item ? (item.id || item.id_benh) : null;
    
    // Nạp danh sách bài thuốc dùng chung (từ _thuocData trong thuoc-management.js)
    const allBT = (typeof _thuocData !== 'undefined') ? _thuocData.baiThuoc : [];
    const btChecks = allBT.map(bt => {
        const checked = item && (item.baiThuocList || []).some(x => x.id === bt.id) ? 'checked' : '';
        return `<label class="tayy-check-label"><input type="checkbox" name="dy-bt-ids" value="${bt.id}" ${checked}> ${escHtml(bt.ten_bai_thuoc)}</label>`;
    }).join('');

    showTayyModal(item ? 'Sửa bệnh đông y' : 'Thêm bệnh đông y', `
        <label class="tayy-form-label">Tên bệnh (Tiêu kết)<br><input id="dy-inp-tieuket" type="text" class="tayy-form-input" value="${item ? escHtml(item.tieuket) : ''}"></label>
        <label class="tayy-form-label">ID Nhóm<br><input id="dy-inp-nhom" type="number" class="tayy-form-input" value="${item ? (item.nhomid || 0) : ''}"></label>
        <label class="tayy-form-label">Triệu chứng chính<br><textarea id="dy-inp-tc" class="tayy-form-input" rows="3">${item ? escHtml(item.trieuchung) : ''}</textarea></label>
        
        <div class="tayy-form-label">Bài thuốc liên quan
            <div class="tayy-check-grid" style="max-height:150px; overflow-y:auto; border:1px solid #D4C5A0; padding:10px; border-radius:8px;">
                ${btChecks || '<span style="color:#A09580;">Chưa có bài thuốc nào trong danh mục chung</span>'}
            </div>
        </div>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhDongY(${realId || 0})">Lưu</button>
        </div>
    `, 'wide');
}

async function saveBenhDongY(id) {
    const btIds = Array.from(document.querySelectorAll('input[name="dy-bt-ids"]:checked')).map(c => parseInt(c.value));
    const payload = {
        tieuket: document.getElementById('dy-inp-tieuket').value.trim(),
        nhomid: parseInt(document.getElementById('dy-inp-nhom').value) || 0,
        trieuchung: document.getElementById('dy-inp-tc').value.trim(),
        bai_thuoc_ids: btIds
    };
    if (!payload.tieuket) return alert('Thiếu tên bệnh');
    const res = id ? await apiUpdateModel(id, payload) : await apiCreateModel(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllDongyData(); renderDongySection();
}

async function deleteBenhDongY(id) {
    if (confirm('Xóa?')) { await apiDeleteModel(id); await loadAllDongyData(); renderDongySection(); }
}

// ═══════════════════════════════════════════════════════════
// TAB: KINH MẠCH (Tách riêng)
// ═══════════════════════════════════════════════════════════
function renderKinhMachTab(el) {
    const rows = _dongyData.kinhMach.map(item => {
        const id = item.idKinhMach || item.id;
        return `
            <tr>
                <td><strong>${escHtml(item.ten_kinh_mach)}</strong></td>
                <td style="text-align:center;">${escHtml(item.ky_hieu_quoc_te)}</td>
                <td style="text-align:center;">${escHtml(item.ngu_hanh)}</td>
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
                    <th style="text-align:center;">Ký hiệu</th>
                    <th style="text-align:center;">Ngũ hành</th>
                    <th style="text-align:center;">Số huyệt</th>
                    <th style="width:130px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

function openKinhMachForm(id) {
    const item = id ? _dongyData.kinhMach.find(x => (x.idKinhMach == id || x.id == id)) : null;
    showTayyModal(item ? 'Sửa kinh mạch' : 'Thêm kinh mạch', `
        <label class="tayy-form-label">Tên kinh mạch<br><input id="km-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_kinh_mach) : ''}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Ký hiệu<br><input id="km-inp-code" type="text" class="tayy-form-input" value="${item ? escHtml(item.ky_hieu_quoc_te) : ''}"></label>
            <label class="tayy-form-label">Ngũ hành<br><input id="km-inp-element" type="text" class="tayy-form-input" value="${item ? escHtml(item.ngu_hanh) : ''}"></label>
        </div>
        <div class="tayy-form-actions"><button class="btn" onclick="closeTayyModal()">Hủy</button>
        <button class="btn btn-primary" onclick="saveKinhMach(${id || 0})">Lưu</button></div>
    `);
}
async function saveKinhMach(id) {
    const payload = {
        ten_kinh_mach: document.getElementById('km-inp-ten').value.trim(),
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
// TAB: PHÁC ĐỒ CHÂM CỨU
// ═══════════════════════════════════════════════════════════
function renderPhacDoTab(el) {
    const rows = _dongyData.phacDo.map(item => `
        <tr>
            <td style="text-align:center;">${item.idPhacDo || item.id}</td>
            <td><strong>${item.benh ? escHtml(item.benh.tieuket) : '—'}</strong></td>
            <td>${item.huyetVi ? escHtml(item.huyetVi.ten_huyet) : '—'}</td>
            <td>${escHtml(item.vai_tro_huyet)}</td>
            <td style="text-align:center;width:130px;">
                <button class="btn btn-sm btn-outline" onclick="openPhacDoForm(${item.idPhacDo || item.id})">✏</button>
                <button class="btn btn-sm btn-danger" onclick="deletePhacDo(${item.idPhacDo || item.id})">🗑</button>
            </td>
        </tr>
    `).join('');
    el.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;"><button class="btn btn-primary" onclick="openPhacDoForm()">+ Thêm phác đồ</button></div>
    <div class="data-table-container"><table><thead><tr><th>ID</th><th>Bệnh</th><th>Huyệt</th><th>Vai trò</th><th>Thao tác</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody></table></div>`;
}

function openPhacDoForm(id) {
    const item = id ? _dongyData.phacDo.find(x => (x.idPhacDo == id || x.id == id)) : null;
    const benhOpts = _dongyData.benhDongY.map(b => `<option value="${b.id || b.id_benh}" ${item && (item.idBenh == b.id || item.id_benh == b.id_benh) ? 'selected' : ''}>${escHtml(b.tieuket)}</option>`).join('');
    const hvOpts = _dongyData.huyetVi.map(h => `<option value="${h.idHuyet || h.id}" ${item && (item.idHuyet == h.idHuyet || item.id == h.id) ? 'selected' : ''}>${escHtml(h.ten_huyet)}</option>`).join('');
    showTayyModal('Phác đồ', `
        <label class="tayy-form-label">Bệnh đông y<br><select id="pd-inp-benh" class="tayy-form-input">${benhOpts}</select></label>
        <label class="tayy-form-label">Huyệt vị<br><select id="pd-inp-hv" class="tayy-form-input">${hvOpts}</select></label>
        <label class="tayy-form-label">Vai trò<br><input id="pd-inp-role" type="text" class="tayy-form-input" value="${item?escHtml(item.vai_tro_huyet):''}"></label>
        <div class="tayy-form-actions"><button class="btn" onclick="closeTayyModal()">Hủy</button><button class="btn btn-primary" onclick="savePhacDo(${id||0})">Lưu</button></div>
    `);
}
async function savePhacDo(id) {
    const payload = { id_benh: parseInt(document.getElementById('pd-inp-benh').value), id_huyet: parseInt(document.getElementById('pd-inp-hv').value), vai_tro_huyet: document.getElementById('pd-inp-role').value };
    await (id ? apiUpdatePhacDo(id, payload) : apiCreatePhacDo(payload));
    closeTayyModal(); await loadAllDongyData(); renderDongySection();
}
async function deletePhacDo(id) { if(confirm('Xóa?')) { await apiDeletePhacDo(id); await loadAllDongyData(); renderDongySection(); } }

// ═══════════════════════════════════════════════════════════
// SHARED MODAL HELPERS
// ═══════════════════════════════════════════════════════════
function showTayyModal(title, bodyHtml, widthClass) {
    let modal = document.getElementById('tayy-modal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'tayy-modal'; document.body.appendChild(modal); }
    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;align-items:center;justify-content:center;';
    const maxW = widthClass === 'wide' ? '800px' : '480px';
    modal.innerHTML = `<div style="background:#FFFDF7;width:95%;max-width:${maxW};padding:25px;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;border:1px solid #D4C5A0;">
        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #5B3A1A;padding-bottom:10px;margin-bottom:15px;"><span style="font-weight:900;color:#5B3A1A;font-size:1.1rem;">${title}</span><button class="btn" onclick="closeTayyModal()" style="padding:0 8px;">✕</button></div>
        ${bodyHtml}</div>`;
}
function closeTayyModal() { const m = document.getElementById('tayy-modal'); if (m) m.style.display = 'none'; }
function escHtml(s) { if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
