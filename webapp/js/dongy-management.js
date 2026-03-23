// dongy-management.js — Quản lý Bệnh Đông Y, Kinh Mạch, Huyệt Vị, Phác Đồ

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
            apiGetModels(),      // benh_dong_y (renamed table)
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
            <div class="section-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                <h2 style="color: var(--secondary); margin:0;">Quản lý Danh Mục Đông Y</h2>
            </div>

            <div class="tayy-tabs" style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--border);">
                <button class="tayy-tab ${tab === 'benh-dong-y' ? 'active' : ''}" onclick="switchDongyTab('benh-dong-y')">Danh mục bệnh</button>
                <button class="tayy-tab ${tab === 'kinh-mach' ? 'active' : ''}" onclick="switchDongyTab('kinh-mach')">Kinh mạch</button>
                <button class="tayy-tab ${tab === 'huyet-vi' ? 'active' : ''}" onclick="switchDongyTab('huyet-vi')">Huyệt vị</button>
                <button class="tayy-tab ${tab === 'phac-do' ? 'active' : ''}" onclick="switchDongyTab('phac-do')">Phác đồ điều trị</button>
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
// TAB: DANH MỤC BỆNH (BENH DONG Y)
// ═══════════════════════════════════════════════════════════
function renderBenhDongYTab(el) {
    if (!_dongyData.benhDongY || _dongyData.benhDongY.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:#A09580;">Chưa có dữ liệu Bệnh đông y</div>';
        return;
    }

    const rows = _dongyData.benhDongY.map(item => {
        // Hàm lấy giá trị không phân biệt hoa thường
        const getV = (obj, ...keys) => {
            const lowerKeys = keys.map(k => k.toLowerCase());
            for (let k in obj) {
                if (lowerKeys.includes(k.toLowerCase())) return obj[k];
            }
            return '';
        };

        const id = getV(item, 'id', 'id_benh');
        const ten = getV(item, 'tieuket', 'ten_benh', 'name');
        const nhom = getV(item, 'nhomid', 'nhomChinh', 'nhom_benh');
        const tc = getV(item, 'trieuchung', 'trieu_chung_chinh');

        return `
            <tr>
                <td style="text-align:center;width:60px;">${id || '—'}</td>
                <td style="font-weight:700; color:#5B3A1A;">${escHtml(ten)}</td>
                <td style="text-align:center;">${escHtml(nhom)}</td>
                <td style="font-size:0.75rem; max-height: 100px; overflow-y: auto; display:block; border:none;">
                    ${tc || ''}
                </td>
                <td style="text-align:center;width:140px;">
                    <div class="table-actions" style="border:none;">
                        <button class="btn btn-sm btn-outline" onclick="openBenhDongYForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBenhDongY(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBenhDongYForm()">+ Thêm bệnh đông y</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th style="width:60px;">ID</th>
                    <th>Tên bệnh</th>
                    <th>Nhóm</th>
                    <th>Triệu chứng</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openBenhDongYForm(givenId) {
    // Tìm kiếm ID linh hoạt
    const item = givenId ? _dongyData.benhDongY.find(x => (x.id == givenId || x.id_benh == givenId || x.ID_benh == givenId)) : null;
    const realId = item ? (item.id || item.id_benh || item.ID_benh) : null;
    
    const title = item ? 'Sửa bệnh đông y' : 'Thêm bệnh đông y mới';
    showTayyModal(title, `
        <label class="tayy-form-label">Tên bệnh (Tiêu kết)<br>
            <input id="dy-inp-tieuket" type="text" class="tayy-form-input" value="${item ? escHtml(item.tieuket) : ''}" placeholder="Nhập tên bệnh...">
        </label>
        <label class="tayy-form-label">Nhóm bệnh (ID nhóm)<br>
            <input id="dy-inp-nhom" type="number" class="tayy-form-input" value="${item ? (item.nhomid || item.nhomChinh || '') : ''}" placeholder="Nhập ID nhóm...">
        </label>
        <label class="tayy-form-label">Triệu chứng chính<br>
            <textarea id="dy-inp-tc" class="tayy-form-input" rows="5">${item ? escHtml(item.trieuchung) : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhDongY(${realId || 0})">Lưu</button>
        </div>
    `, 'wide');
}

async function saveBenhDongY(id) {
    const tieuket = document.getElementById('dy-inp-tieuket')?.value.trim();
    if (!tieuket) return alert('Vui lòng nhập tên bệnh');
    const payload = {
        tieuket,
        nhomid: parseInt(document.getElementById('dy-inp-nhom')?.value.trim()) || 0,
        trieuchung: document.getElementById('dy-inp-tc')?.value.trim(),
    };
    let res;
    if (id) res = await apiUpdateModel(id, payload);
    else res = await apiCreateModel(payload);

    if (res.success === false) return alert(res.error || 'Thất bại');
    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}

async function deleteBenhDongY(id) {
    if (!confirm('Xóa bệnh đông y này?')) return;
    const res = await apiDeleteModel(id);
    if (res.success === false) return alert(res.error || 'Thất bại');
    await loadAllDongyData();
    renderDongySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: KINH MẠCH
// ═══════════════════════════════════════════════════════════
function renderKinhMachTab(el) {
    const rows = _dongyData.kinhMach.map(item => `
        <tr>
            <td style="text-align:center;width:60px;">${item.idKinhMach}</td>
            <td><strong>${escHtml(item.ten_kinh_mach)}</strong></td>
            <td>${escHtml(item.ky_hieu_quoc_te)}</td>
            <td>${escHtml(item.ngu_hanh)}</td>
            <td style="text-align:center;">${item.tong_so_huyet || 0}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editKinhMach(${item.idKinhMach})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKinhMach(${item.idKinhMach})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openKinhMachForm()">+ Thêm kinh mạch</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th style="width:60px;">ID</th>
                    <th>Tên kinh mạch</th>
                    <th>Ký hiệu</th>
                    <th>Ngũ hành</th>
                    <th>Số huyệt</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openKinhMachForm(id) {
    const item = id ? _dongyData.kinhMach.find(x => x.idKinhMach === id) : null;
    showTayyModal(id ? 'Sửa kinh mạch' : 'Thêm kinh mạch', `
        <label class="tayy-form-label">Tên kinh mạch<br>
            <input id="km-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_kinh_mach) : ''}">
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Ký hiệu quốc tế<br>
                <input id="km-inp-kyhieu" type="text" class="tayy-form-input" value="${item ? escHtml(item.ky_hieu_quoc_te) : ''}">
            </label>
            <label class="tayy-form-label">Ngũ hành<br>
                <input id="km-inp-nguhanh" type="text" class="tayy-form-input" value="${item ? escHtml(item.ngu_hanh) : ''}">
            </label>
        </div>
        <label class="tayy-form-label">Tổng số huyệt<br>
            <input id="km-inp-tong" type="number" class="tayy-form-input" value="${item ? item.tong_so_huyet : ''}">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveKinhMach(${id || 0})">Lưu</button>
        </div>
    `);
}

async function saveKinhMach(id) {
    const ten = document.getElementById('km-inp-ten')?.value.trim();
    if (!ten) return alert('Nhập tên kinh mạch');
    const payload = {
        ten_kinh_mach: ten,
        ky_hieu_quoc_te: document.getElementById('km-inp-kyhieu').value,
        ngu_hanh: document.getElementById('km-inp-nguhanh').value,
        tong_so_huyet: parseInt(document.getElementById('km-inp-tong').value) || 0,
    };
    let res = id ? await apiUpdateKinhMach(id, payload) : await apiCreateKinhMach(payload);
    if (!res.success) return alert(res.error || 'Lỗi');
    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}

async function deleteKinhMach(id) {
    if (!confirm('Xóa kinh mạch này sẽ xóa toàn bộ huyệt vị liên quan?')) return;
    const res = await apiDeleteKinhMach(id);
    if (!res.success) return alert(res.error);
    await loadAllDongyData();
    renderDongySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: HUYỆT VỊ
// ═══════════════════════════════════════════════════════════
function renderHuyetViTab(el) {
    const rows = _dongyData.huyetVi.map(item => `
        <tr>
            <td style="text-align:center;">${item.idHuyet}</td>
            <td><strong>${escHtml(item.ten_huyet)}</strong></td>
            <td>${escHtml(item.ma_huyet)}</td>
            <td><span style="color:#8B7355;">${item.kinhMach ? escHtml(item.kinhMach.ten_kinh_mach) : '—'}</span></td>
            <td style="font-size:0.8rem;">${escHtml(item.loai_huyet)}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editHuyetVi(${item.idHuyet})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHuyetVi(${item.idHuyet})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openHuyetViForm()">+ Thêm huyệt vị</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th style="width:60px;">ID</th>
                    <th>Tên huyệt</th>
                    <th>Mã số</th>
                    <th>Kinh mạch</th>
                    <th>Loại</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openHuyetViForm(id) {
    const item = id ? _dongyData.huyetVi.find(x => x.idHuyet === id) : null;
    const kmOptions = _dongyData.kinhMach.map(k => `<option value="${k.idKinhMach}" ${item && item.idKinhMach === k.idKinhMach ? 'selected' : ''}>${escHtml(k.ten_kinh_mach)}</option>`).join('');

    showTayyModal(id ? 'Sửa huyệt vị' : 'Thêm huyệt vị', `
        <label class="tayy-form-label">Tên huyệt<br>
            <input id="hv-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_huyet) : ''}">
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label class="tayy-form-label">Mã huyệt<br>
                <input id="hv-inp-ma" type="text" class="tayy-form-input" value="${item ? escHtml(item.ma_huyet) : ''}">
            </label>
            <label class="tayy-form-label">Kinh mạch<br>
                <select id="hv-inp-km" class="tayy-form-input">${kmOptions}</select>
            </label>
        </div>
        <label class="tayy-form-label">Loại huyệt<br>
            <input id="hv-inp-loai" type="text" class="tayy-form-input" value="${item ? escHtml(item.loai_huyet) : ''}">
        </label>
        <label class="tayy-form-label">Vị trí giải phẫu<br>
            <textarea id="hv-inp-vitri" class="tayy-form-input" rows="2">${item ? escHtml(item.vi_tri_giai_phau) : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveHuyetVi(${id || 0})">Lưu</button>
        </div>
    `);
}

async function saveHuyetVi(id) {
    const ten = document.getElementById('hv-inp-ten').value.trim();
    const kmId = parseInt(document.getElementById('hv-inp-km').value);
    if (!ten || !kmId) return alert('Vui lòng nhập đủ thông tin');
    const payload = {
        ten_huyet: ten,
        id_kinh_mach: kmId,
        ma_huyet: document.getElementById('hv-inp-ma').value,
        loai_huyet: document.getElementById('hv-inp-loai').value,
        vi_tri_giai_phau: document.getElementById('hv-inp-vitri').value,
    };
    let res = id ? await apiUpdateHuyetVi(id, payload) : await apiCreateHuyetVi(payload);
    if (!res.success) return alert(res.error);
    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}

async function deleteHuyetVi(id) {
    if (!confirm('Xóa huyệt vị này?')) return;
    const res = await apiDeleteHuyetVi(id);
    if (!res.success) return alert(res.error);
    await loadAllDongyData();
    renderDongySection();
}

// ═══════════════════════════════════════════════════════════
// TAB: PHÁC ĐỒ ĐIỀU TRỊ
// ═══════════════════════════════════════════════════════════
function renderPhacDoTab(el) {
    const rows = _dongyData.phacDo.map(item => `
        <tr>
            <td style="text-align:center;">${item.idPhacDo}</td>
            <td><strong>${item.benh ? escHtml(item.benh.tieuket) : '—'}</strong></td>
            <td>${item.huyetVi ? escHtml(item.huyetVi.ten_huyet) : '—'}</td>
            <td>${escHtml(item.vai_tro_huyet)}</td>
            <td style="font-size:0.8rem;">${escHtml(item.phuong_phap_tac_dong)}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="editPhacDo(${item.idPhacDo})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePhacDo(${item.idPhacDo})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openPhacDoForm()">+ Thêm phác đồ</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th style="width:60px;">ID</th>
                    <th>Bệnh đông y</th>
                    <th>Huyệt vị</th>
                    <th>Vai trò</th>
                    <th>Phương pháp</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openPhacDoForm(id) {
    const item = id ? _dongyData.phacDo.find(x => x.idPhacDo === id) : null;
    const benhOptions = _dongyData.benhDongY.map(b => `<option value="${b.id}" ${item && item.idBenh === b.id ? 'selected' : ''}>${escHtml(b.tieuket)}</option>`).join('');
    const huyetOptions = _dongyData.huyetVi.map(h => `<option value="${h.idHuyet}" ${item && item.idHuyet === h.idHuyet ? 'selected' : ''}>${escHtml(h.ten_huyet)} (${h.kinhMach ? h.kinhMach.ten_kinh_mach : ''})</option>`).join('');

    showTayyModal(id ? 'Sửa phác đồ' : 'Thêm phác đồ', `
        <label class="tayy-form-label">Bệnh đông y<br>
            <select id="pd-inp-benh" class="tayy-form-input">${benhOptions}</select>
        </label>
        <label class="tayy-form-label">Huyệt vị<br>
            <select id="pd-inp-huyet" class="tayy-form-input">${huyetOptions}</select>
        </label>
        <label class="tayy-form-label">Vai trò huyệt<br>
            <input id="pd-inp-vaitro" type="text" class="tayy-form-input" value="${item ? escHtml(item.vai_tro_huyet) : ''}">
        </label>
        <label class="tayy-form-label">Phương pháp tác động<br>
            <input id="pd-inp-pp" type="text" class="tayy-form-input" value="${item ? escHtml(item.phuong_phap_tac_dong) : ''}">
        </label>
        <label class="tayy-form-label">Ghi chú kỹ thuật<br>
            <textarea id="pd-inp-ghichu" class="tayy-form-input" rows="2">${item ? escHtml(item.ghi_chu_ky_thuat) : ''}</textarea>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="savePhacDo(${id || 0})">Lưu</button>
        </div>
    `);
}

async function savePhacDo(id) {
    const benhId = parseInt(document.getElementById('pd-inp-benh').value);
    const hvId = parseInt(document.getElementById('pd-inp-huyet').value);
    if (!benhId || !hvId) return alert('Nhập đủ thông tin');
    const payload = {
        id_benh: benhId,
        id_huyet: hvId,
        vai_tro_huyet: document.getElementById('pd-inp-vaitro').value,
        phuong_phap_tac_dong: document.getElementById('pd-inp-pp').value,
        ghi_chu_ky_thuat: document.getElementById('pd-inp-ghichu').value,
    };
    let res = id ? await apiUpdatePhacDo(id, payload) : await apiCreatePhacDo(payload);
    if (!res.success) return alert(res.error);
    closeTayyModal();
    await loadAllDongyData();
    renderDongySection();
}

async function deletePhacDo(id) {
    if (!confirm('Xóa phác đồ này?')) return;
    const res = await apiDeletePhacDo(id);
    if (!res.success) return alert(res.error);
    await loadAllDongyData();
    renderDongySection();
}

// ═══════════════════════════════════════════════════════════
// HELPERS (Shared with other management JS if needed)
// ═══════════════════════════════════════════════════════════
if (typeof escHtml !== 'function') {
    function escHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
}
