// thuoc-management.js — Quản lý Thuốc tập trung (Vị thuốc, Bài thuốc)
// Dùng chung cho cả Tây y và Đông y

let _thuocData = {
    viThuoc: [],
    baiThuoc: [],
    kinhMach: [],
    huyetVi: [],
    bienChung: [],
    phapTri: [],
    trieuChung: [],
    activeTab: 'vi-thuoc',
};

// Draft de chi_tiet (thành phần vị thuốc) đang được chỉnh trong modal bài thuốc
let _btDraftChiTiet = [];
// Draft chips cho biện chứng, triệu chứng, pháp trị
let _btDraftBienChung = [];
let _btDraftTrieuChung = [];
let _btDraftPhapTri = [];

// ─── Khởi tạo ─────────────────────────────────────────────
async function initThuocManagement() {
    await loadAllThuocData();
    renderThuocSection();
}

async function loadAllThuocData() {
    try {
        const [vt, bt, km, hv, bc, pt, tc] = await Promise.all([
            apiGetViThuoc(),
            apiGetBaiThuoc(),
            apiGetKinhMach(),
            apiGetHuyetVi(),
            apiGetBienChung(),
            apiGetPhapTri(),
            apiGetTrieuChung(),
        ]);
        _thuocData.viThuoc = vt || [];
        _thuocData.baiThuoc = bt || [];
        _thuocData.kinhMach = km || [];
        _thuocData.huyetVi = hv || [];
        _thuocData.bienChung = bc || [];
        _thuocData.phapTri = pt || [];
        _thuocData.trieuChung = tc || [];
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
                <div style="position:relative;">
                    <input id="vt-inp-tinh" type="text" class="tayy-form-input" 
                        value="${item ? escHtml(item.tinh || '') : ''}" 
                        placeholder="Chọn hoặc nhập tính..."
                        onfocus="vtOnTinhSearchInput(this.value)"
                        oninput="vtOnTinhSearchInput(this.value)">
                    <div id="vt-tinh-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                        background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.12);
                        max-height:160px; overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
            </label>
            <label class="tayy-form-label">Vị (ngũ vị)<br>
                <div style="position:relative;">
                    <input id="vt-inp-vi" type="text" class="tayy-form-input" 
                        value="${item ? escHtml(item.vi || '') : ''}" 
                        placeholder="Chọn hoặc nhập vị..."
                        onfocus="vtOnViSearchInput(this.value)"
                        oninput="vtOnViSearchInput(this.value)">
                    <div id="vt-vi-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                        background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.12);
                        max-height:160px; overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
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

    // Đóng gợi ý khi click ra ngoài
    const closeModalSuggestions = (e) => {
        if (!e.target.closest('.tayy-form-label')) {
            ['vt-tinh-suggest', 'vt-vi-suggest', 'vt-quykinh-suggest'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        }
    };
    document.addEventListener('click', closeModalSuggestions, { once: true });
}

// gợi ý Tính/Vị
const _TINH_DEFAULTS = ['Hàn', 'Nhiệt', 'Ôn', 'Lương', 'Bình'];
const _VI_DEFAULTS = ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn', 'Nhạt'];

function vtOnTinhSearchInput(val) {
    const suggestEl = document.getElementById('vt-tinh-suggest');
    const query = val.trim().toLowerCase();
    
    // Tổng hợp từ mặc định + dữ liệu đang có
    const existingValues = [...new Set(_thuocData.viThuoc.map(v => v.tinh).filter(Boolean))];
    const all = [...new Set([..._TINH_DEFAULTS, ...existingValues])];
    
    const matches = all.filter(x => x.toLowerCase().includes(query));
    if (matches.length === 0 && !val) {
        suggestEl.style.display = 'none';
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = matches.map(m => `
        <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'"
             onmouseout="this.style.background='transparent'"
             onclick="vtSelectTinh('${escHtml(m)}')">
            ${escHtml(m)}
        </div>
    `).join('') || `<div style="padding:8px 10px; color:#A09580; font-size:0.82rem;">Bấm Enter hoặc tiếp tục nhập để tạo mới</div>`;
}

function vtSelectTinh(val) {
    const inp = document.getElementById('vt-inp-tinh');
    if (inp) inp.value = val;
    document.getElementById('vt-tinh-suggest').style.display = 'none';
}

function vtOnViSearchInput(val) {
    const suggestEl = document.getElementById('vt-vi-suggest');
    const query = val.trim().toLowerCase();
    
    const existingValues = [...new Set(_thuocData.viThuoc.map(v => v.vi).filter(Boolean))];
    const all = [...new Set([..._VI_DEFAULTS, ...existingValues])];
    
    const matches = all.filter(x => x.toLowerCase().includes(query));
    if (matches.length === 0 && !val) {
        suggestEl.style.display = 'none';
        return;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = matches.map(m => `
        <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'"
             onmouseout="this.style.background='transparent'"
             onclick="vtSelectVi('${escHtml(m)}')">
            ${escHtml(m)}
        </div>
    `).join('') || `<div style="padding:8px 10px; color:#A09580; font-size:0.82rem;">Bấm Enter hoặc tiếp tục nhập để tạo mới</div>`;
}

function vtSelectVi(val) {
    const inp = document.getElementById('vt-inp-vi');
    if (inp) inp.value = val;
    document.getElementById('vt-vi-suggest').style.display = 'none';
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
    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteViThuoc(id) {
    if (confirm('Xóa vị thuốc này?')) {
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
            let displayLieu = lieu;
            if (lieu === '*') displayLieu = 'Dùng lượng tương đối nhỏ từ 1.5g - 3g ( xấp xỉ 1 tiền )';
            else if (lieu === '#') displayLieu = 'Dùng lượng tương đối lớn từ 15g - 30g ( tương đương 5 tiền đến 1 lượng )';
            else if (!lieu) displayLieu = 'Dùng lượng từ 4.5g - 9g ( tương đương 1.5 ~ 3 tiền )';
            return `${ten} (${displayLieu})`;
        }).filter(Boolean).join(', ');
        const bienChungStr = escHtml(item.bien_chung || '—');
        const trieuChungStr = escHtml(item.trieu_chung || '—');
        const phapTriStr = escHtml(item.phap_tri || '—');
        return `
            <tr>
                <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
                <td>${escHtml(item.nguon_goc || '—')}</td>
                <td style="font-size:0.8rem;">${bienChungStr}</td>
                <td style="font-size:0.8rem;">${trieuChungStr}</td>
                <td style="font-size:0.8rem;">${phapTriStr}</td>
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
                <thead><tr><th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Biện chứng</th><th>Triệu chứng</th><th>Pháp trị</th><th>Thành phần</th><th style="width:130px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;">Chưa có dữ liệu</td></tr>'}</tbody>
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

    // Khởi tạo draft chips cho biện chứng, triệu chứng, pháp trị
    _btDraftBienChung = (item?.bien_chung || '').split(',').map(s => s.trim()).filter(Boolean);
    _btDraftTrieuChung = (item?.trieu_chung || '').split(',').map(s => s.trim()).filter(Boolean);
    _btDraftPhapTri = (item?.phap_tri || '').split(',').map(s => s.trim()).filter(Boolean);

    const rowsHtml = btRenderBaiThuocChiTietRowsHtml();
    showTayyModal('Bài thuốc', `
        <datalist id="bt-lieu-datalist">
            <option value="*"></option>
            <option value="#"></option>
        </datalist>

        <label class="tayy-form-label">Tên bài thuốc<br><input id="bt-inp-ten" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_bai_thuoc) : ''}"></label>
        <label class="tayy-form-label">Nguồn gốc/Cổ phương<br><input id="bt-inp-source" type="text" class="tayy-form-input" value="${item ? escHtml(item.nguon_goc) : ''}"></label>
        <label class="tayy-form-label">Cách dùng<br><textarea id="bt-inp-usage" class="tayy-form-input" rows="3">${item ? escHtml(item.cach_dung) : ''}</textarea></label>

        <!-- Biện chứng -->
        <label class="tayy-form-label">
            Biện chứng
            <div style="position:relative; margin-top:6px;">
                <div id="bt-bienchung-chips" class="chips-container" onclick="document.getElementById('bt-inp-bienchung').focus()">
                    <input id="bt-inp-bienchung" type="text" class="chip-input"
                        placeholder="Thêm biện chứng..."
                        oninput="btOnBienChungSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectBienChung(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-bienchung-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <!-- Triệu chứng -->
        <label class="tayy-form-label">
            Triệu chứng
            <div style="position:relative; margin-top:6px;">
                <div id="bt-trieuchung-chips" class="chips-container" onclick="document.getElementById('bt-inp-trieuchung').focus()">
                    <input id="bt-inp-trieuchung" type="text" class="chip-input"
                        placeholder="Thêm triệu chứng..."
                        oninput="btOnTrieuChungSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectTrieuChung(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-trieuchung-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <!-- Pháp trị -->
        <label class="tayy-form-label">
            Pháp trị
            <div style="position:relative; margin-top:6px;">
                <div id="bt-phaptri-chips" class="chips-container" onclick="document.getElementById('bt-inp-phaptri').focus()">
                    <input id="bt-inp-phaptri" type="text" class="chip-input"
                        placeholder="Thêm pháp trị..."
                        oninput="btOnPhapTriSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){btSelectPhapTri(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="bt-phaptri-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                    background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                    box-shadow:0 10px 30px rgba(0,0,0,0.12);
                    max-height:200px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

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
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:22%;">Tên vị thuốc</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:18%;">Liều lượng</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:20%;">Vai trò</th>
                            <th style="text-align:left; background:#F5F0E8; color:#5B3A1A; border:1px solid #E2D4B8; padding:8px; width:40%;">Tính / Vị / Quy kinh</th>
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
            <button class="btn btn-primary" onclick="saveBaiThuoc(${id || 0})">Lưu</button>
        </div>
    `, 'wide');

    // Khởi tạo UI chips và suggestion cho modal mới
    setTimeout(() => {
        btRenderBienChungChips();
        btRenderTrieuChungChips();
        btRenderPhapTriChips();
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

        return obj;
    }).filter(d => Number.isFinite(d.id_vi_thuoc));

    const payload = {
        ten_bai_thuoc: document.getElementById('bt-inp-ten').value.trim(),
        nguon_goc: document.getElementById('bt-inp-source').value.trim(),
        cach_dung: document.getElementById('bt-inp-usage').value.trim(),
        bien_chung: _btDraftBienChung.join(', '),
        trieu_chung: _btDraftTrieuChung.join(', '),
        phap_tri: _btDraftPhapTri.join(', '),
        chi_tiet
    };
    if (!payload.ten_bai_thuoc) return alert('Thiếu tên bài thuốc');
    const res = id ? await apiUpdateBaiThuoc(id, payload) : await apiCreateBaiThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal(); await loadAllThuocData(); renderThuocSection();
}

async function deleteBaiThuoc(id) {
    if (confirm('Xóa bài thuốc này?')) {
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
        const vaiTro = d?.vai_tro || '';
        const tinh = vt?.tinh || '-';
        const vi = vt?.vi || '-';
        const vtQuyKinh = vt?.quy_kinh || '-';

        // Extract value and unit naturally for the 2 inputs
        const rawLieu = d?.lieu_luong || '';
        let val = rawLieu;
        let unit = '';
        if (rawLieu.trim().endsWith(' tiền')) {
            val = rawLieu.replace('tiền', '').trim();
            unit = 'tiền';
        } else if (rawLieu.trim().endsWith(' lượng')) {
            val = rawLieu.replace('lượng', '').trim();
            unit = 'lượng';
        }

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
                    <div style="display:flex; gap:4px; max-width:140px;">
                        <input type="text"
                            style="flex:1; width:50%; padding:6px 6px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                            placeholder="Số, *, #"
                            list="bt-lieu-datalist"
                            value="${escHtml(val)}"
                            oninput="btUpdateBaiThuocChipLieuCompound(${d.idViThuoc}, this.value, this.nextElementSibling.value)">
                        <select
                            style="flex:1; width:50%; padding:6px 2px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.8rem;"
                            onchange="btUpdateBaiThuocChipLieuCompound(${d.idViThuoc}, this.previousElementSibling.value, this.value)">
                            <option value="" ${unit === '' ? 'selected' : ''}>-</option>
                            <option value="tiền" ${unit === 'tiền' ? 'selected' : ''}>tiền</option>
                            <option value="lượng" ${unit === 'lượng' ? 'selected' : ''}>lượng</option>
                        </select>
                    </div>
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px;">
                    <input type="text"
                        style="width:100%; padding:6px 8px; border:1px solid #D4C5A0; border-radius:6px; background:#FBF8F1; font-size:0.85rem;"
                        placeholder="Quân, Thần..."
                        value="${escHtml(vaiTro)}"
                        oninput="btUpdateBaiThuocChipVaiTro(${d.idViThuoc}, this.value)">
                </td>
                <td style="border:1px solid #E2D4B8; padding:8px; font-size:0.8rem; line-height:1.4; color:#5B3A1A;">
                    <div><strong>Tính:</strong> ${escHtml(tinh)} <span style="margin:0 4px;color:#D4C5A0;">|</span> <strong>Vị:</strong> ${escHtml(vi)}</div>
                    <div style="margin-top:2px;"><strong>Quy kinh:</strong> ${escHtml(vtQuyKinh)}</div>
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
    const exactVal = (query || '').trim();
    const inpVal = exactVal.toLowerCase();
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

    const hasExactMatch = matches.some(v => (v?.ten_vi_thuoc || '').toLowerCase() === inpVal);

    let html = '';

    if (matches.length > 0) {
        html += matches.map(v => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btAddViThuocChip(${v.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(v.ten_vi_thuoc || '')}</div>
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy vị thuốc có sẵn</div>`;
    }

    // UX: Cho phép thêm mới (soft-create) luôn nếu chưa có match chính xác
    if (!hasExactMatch && exactVal) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateViThuoc('${escHtml(exactVal)}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm vị thuốc "${escHtml(exactVal)}"
                </div>
            </div>
        `;
    }

    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateViThuoc(name) {
    if (!name) return;

    // UI Feedback đang thêm...
    const inp = document.getElementById('bt-inp-vi-search');
    const suggestEl = document.getElementById('bt-vi-suggest');
    const oldVal = inp ? inp.value : '';

    if (inp) {
        inp.disabled = true;
        inp.value = 'Đang thêm...';
    }
    if (suggestEl) suggestEl.style.display = 'none';

    // Gọi API lưu tức thời (soft-create)
    const payload = { ten_vi_thuoc: name, tinh: '', vi: '', quy_kinh: '', cong_dung: '' };
    const res = await apiCreateViThuoc(payload);

    if (inp) {
        inp.disabled = false;
        inp.value = ''; // Xóa input khi cập nhật xong
        inp.focus();
    }

    if (!res.success) {
        alert('Lỗi khi thêm vị thuốc mới: ' + (res.error || 'Vui lòng thử lại sau.'));
        if (inp) inp.value = oldVal;
        return;
    }

    // Cập nhật State danh sách vị thuốc dùng chung
    const newItem = { id: res.id, ...payload, ...(res.data || {}) };
    _thuocData.viThuoc.push(newItem);

    // Kích hoạt thêm vào bài thuốc theo ID vừa có được
    btAddViThuocChip(res.id);
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

function btUpdateBaiThuocChipVaiTro(viThuocId, vaiTro) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc == viThuocId);
    if (target) {
        target.vai_tro = vaiTro;
    }
}

function btUpdateBaiThuocChipLieuCompound(viThuocId, val, unit) {
    const target = (_btDraftChiTiet || []).find(d => d.idViThuoc == viThuocId);
    if (target) {
        const v = (val || '').trim();
        const u = (unit || '').trim();
        if (!v) {
            target.lieu_luong = '';
        } else if (v === '*' || v === '#') {
            target.lieu_luong = v;
        } else {
            target.lieu_luong = u ? `${v} ${u}` : v;
        }
    }
}

function btUpdateBaiThuocChipVi(viThuocId, viValue) {
    // No-op - Tình/Vị removed from UI
}

// ═══════════════════════════════════════════════════════════
// BIỆN CHỨNG — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderBienChungChips() {
    const container = document.getElementById('bt-bienchung-chips');
    const input = document.getElementById('bt-inp-bienchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftBienChung.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemoveBienChungChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemoveBienChungChip(name) {
    _btDraftBienChung = _btDraftBienChung.filter(x => x !== name);
    btRenderBienChungChips();
}

function btSelectBienChung(name) {
    if (!name || _btDraftBienChung.includes(name)) return;
    _btDraftBienChung.push(name);
    const inp = document.getElementById('bt-inp-bienchung');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderBienChungChips();
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnBienChungSearchInput(val) {
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.bienChung || []).map(b => b.ten_bien_chung);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftBienChung.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectBienChung('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy biện chứng có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateBienChung('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm biện chứng "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateBienChung(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-bienchung');
    const suggestEl = document.getElementById('bt-bienchung-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateBienChung({ ten_bien_chung: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm biện chứng: ' + (res.error || '')); return; }

    _thuocData.bienChung.push({ id: res.id, ten_bien_chung: name, ...(res.data || {}) });
    btSelectBienChung(name);
}

// ═══════════════════════════════════════════════════════════
// TRIỆU CHỨNG — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderTrieuChungChips() {
    const container = document.getElementById('bt-trieuchung-chips');
    const input = document.getElementById('bt-inp-trieuchung');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftTrieuChung.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemoveTrieuChungChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemoveTrieuChungChip(name) {
    _btDraftTrieuChung = _btDraftTrieuChung.filter(x => x !== name);
    btRenderTrieuChungChips();
}

function btSelectTrieuChung(name) {
    if (!name || _btDraftTrieuChung.includes(name)) return;
    _btDraftTrieuChung.push(name);
    const inp = document.getElementById('bt-inp-trieuchung');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderTrieuChungChips();
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnTrieuChungSearchInput(val) {
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.trieuChung || []).map(t => t.ten_trieu_chung);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftTrieuChung.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectTrieuChung('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy triệu chứng có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreateTrieuChung('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm triệu chứng "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreateTrieuChung(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-trieuchung');
    const suggestEl = document.getElementById('bt-trieuchung-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateTrieuChung({ ten_trieu_chung: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm triệu chứng: ' + (res.error || '')); return; }

    _thuocData.trieuChung.push({ id: res.id, ten_trieu_chung: name, ...(res.data || {}) });
    btSelectTrieuChung(name);
}

// ═══════════════════════════════════════════════════════════
// PHÁP TRỊ — chips + soft create
// ═══════════════════════════════════════════════════════════
function btRenderPhapTriChips() {
    const container = document.getElementById('bt-phaptri-chips');
    const input = document.getElementById('bt-inp-phaptri');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _btDraftPhapTri.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `${escHtml(name)} <span class="chip-remove" onclick="btRemovePhapTriChip('${escHtml(name)}'); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function btRemovePhapTriChip(name) {
    _btDraftPhapTri = _btDraftPhapTri.filter(x => x !== name);
    btRenderPhapTriChips();
}

function btSelectPhapTri(name) {
    if (!name || _btDraftPhapTri.includes(name)) return;
    _btDraftPhapTri.push(name);
    const inp = document.getElementById('bt-inp-phaptri');
    if (inp) { inp.value = ''; inp.focus(); }
    btRenderPhapTriChips();
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}

function btOnPhapTriSearchInput(val) {
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const allNames = (_thuocData.phapTri || []).map(p => p.ten_phap_tri);
    const filtered = allNames.filter(n => n.toLowerCase().includes(query) && !_btDraftPhapTri.includes(n)).slice(0, 10);
    const hasExact = allNames.some(n => n.toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html += filtered.map(m => `
            <div style="padding:8px 10px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="btSelectPhapTri('${escHtml(m)}')">
                ${escHtml(m)}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy pháp trị có sẵn</div>`;
    }
    if (!hasExact && val.trim()) {
        html += `
            <div style="padding:8px 10px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="btSoftCreatePhapTri('${escHtml(val.trim())}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm pháp trị "${escHtml(val.trim())}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function btSoftCreatePhapTri(name) {
    if (!name) return;
    const inp = document.getElementById('bt-inp-phaptri');
    const suggestEl = document.getElementById('bt-phaptri-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreatePhapTri({ ten_phap_tri: name });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) { alert('Lỗi khi thêm pháp trị: ' + (res.error || '')); return; }

    _thuocData.phapTri.push({ id: res.id, ten_phap_tri: name, ...(res.data || {}) });
    btSelectPhapTri(name);
}
