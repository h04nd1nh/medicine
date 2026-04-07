// =========================================================
// APP.JS - Kinh Lạc Health Care | Gia Minh
// =========================================================

let patientData  = [];
let recordData   = [];
let diseaseModels = [];
let provinceList = [];
let activeAnalysisRecord = null;
let _selectedPatientIdForNewRecord = null;
let _editingRecordId = null;
let _editingPatientId = null;
let _newRecTimer = null;
let _newRecWeatherTimer = null;

// Thứ tự hiển thị kinh mạch (giữ nguyên thứ tự Excel)
const meridianNames = [
    // Chi trên (Tay)
    { id: 'tieutruong', n: 'Tiểu Trường', d: 'Thiếu trạch (ngoài ngón út)',    t: 'Dương', group: 'tren' },
    { id: 'tam',        n: 'Tâm',         d: 'Thiếu xung (trong ngón út)',     t: 'Âm',    group: 'tren' },
    { id: 'tamtieu',    n: 'Tam Tiêu',    d: 'Quan xung (ngoài ngón nhẫn)',   t: 'Dương', group: 'tren' },
    { id: 'tambao',     n: 'Tâm Bào',     d: 'Trung xung (ngoài ngón giữa)',  t: 'Âm',    group: 'tren' },
    { id: 'daitrang',   n: 'Đại Trường',  d: 'Thương dương (ngoài ngón trỏ)', t: 'Dương', group: 'tren' },
    { id: 'phe',        n: 'Phế',         d: 'Thiếu thương (ngoài ngón cái)', t: 'Âm',    group: 'tren' },
    // Chi dưới (Chân)
    { id: 'bangquang',  n: 'Bàng Quang',  d: 'Chí âm (ngoài ngón út)',        t: 'Dương', group: 'duoi' },
    { id: 'than',       n: 'Thận',        d: 'Nội chí âm (trong ngón út)',     t: 'Âm',    group: 'duoi' },
    { id: 'dam',        n: 'Đởm',         d: 'Khiếu âm (ngoài ngón thứ 4)',   t: 'Dương', group: 'duoi' },
    { id: 'vi',         n: 'Vị',          d: 'Lệ đoài (ngoài ngón thứ 2)',     t: 'Dương', group: 'duoi' },
    { id: 'can',        n: 'Can',         d: 'Đại đôn (ngoài ngón cái)',       t: 'Âm',    group: 'duoi' },
    { id: 'ty',         n: 'Tỳ',          d: 'Ẩn bạch (trong ngón cái)',       t: 'Âm',    group: 'duoi' },
];

// ---- Bắt lỗi toàn cục ----
window.onerror = function(msg, url, line) {
    console.error('GLOBAL ERROR:', msg, url, line);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    _checkAuthAndInit();
    document.getElementById('login-password')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
    });
    document.getElementById('login-username')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('login-password')?.focus();
    });
});

async function _checkAuthAndInit() {
    const overlay = document.getElementById('login-overlay');
    if (!isLoggedIn()) {
        if (overlay) overlay.style.display = 'flex';
        return;
    }
    if (overlay) overlay.style.display = 'none';
    _updateUserDisplay();
    await _startApp();
}

async function _startApp() {
    await loadData();
    _initMeasureGuideEditor();
    
    // Xử lý routing ban đầu từ URL hash
    const initHash = window.location.hash.replace('#', '');
    if (initHash && initHash !== '/' && initHash !== '/dashboard') {
        const parts = initHash.split('/').filter(Boolean);
        if (parts[0] === 'analysis' && parts[1]) {
            viewAnalysis(null, parseInt(parts[1]));
        } else if (parts[0] === 'patient' && parts[1]) {
            viewPatient(parseInt(parts[1]));
        } else if (parts[0] === 'patients') {
            showSection('patients');
        } else if (parts[0] === 'phaptri') {
            showSection('phaptri');
        } else if (parts[0] === 'models') {
            showSection('dashboard');
        } else {
            showSection('dashboard');
        }
    } else {
        showSection('dashboard');
    }

    document.getElementById('patient-search')?.addEventListener('input', e => filterPatients(e.target.value));
    document.getElementById('model-search')?.addEventListener('input', () => filterModels());
}

function _updateUserDisplay() {
    const user = _getUser();
    const logged = isLoggedIn();
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = user?.username || 'Admin';
    const sidebarUser = document.getElementById('sidebar-user');
    const sidebarName = document.getElementById('sidebar-username');
    if (sidebarUser) sidebarUser.style.display = logged ? 'block' : 'none';
    if (sidebarName) sidebarName.textContent = 'Bác sĩ: ' + (user?.username || 'Admin');
}

async function doLogin() {
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('btn-login');
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value;

    if (!username || !password) {
        if (errEl) errEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng nhập...'; }
    if (errEl) errEl.textContent = '';

    try {
        const res = await apiLogin(username, password);
        if (!res.success) {
            if (errEl) errEl.textContent = res.error || 'Đăng nhập thất bại.';
            return;
        }
        _checkAuthAndInit();
    } catch (e) {
        if (errEl) errEl.textContent = 'Lỗi kết nối: ' + (e.message || e);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Đăng nhập'; }
    }
}

function doLogout() {
    if (!confirm('Bạn muốn đăng xuất?')) return;
    apiLogout();
    window.location.reload();
}

// Danh sách 12 kinh cho màn Khám mới
const newRecordMeridians = [
    { id: 'phe', n: 'Phế' }, { id: 'daitrang', n: 'Đại Trường' },
    { id: 'tam', n: 'Tâm' }, { id: 'tieutruong', n: 'Tiểu Trường' },
    { id: 'tambao', n: 'Tâm Bào' }, { id: 'tamtieu', n: 'Tam Tiêu' },
    { id: 'ty', n: 'Tỳ' }, { id: 'vi', n: 'Vị' },
    { id: 'can', n: 'Can' }, { id: 'dam', n: 'Đởm' },
    { id: 'than', n: 'Thận' }, { id: 'bangquang', n: 'Bàng Quang' }
];

// =========================================================
// GỢI Ý VỊ TRÍ ĐO (2B) - panel cạnh nhập liệu
// Tọa độ tính theo % trong khung diagram
// =========================================================
const MEASURE_GUIDE = {
    // Hand (tay)
    phe:        { part: 'hand', x: 18, y: 62 },
    daitrang:   { part: 'hand', x: 34, y: 26 },
    tambao:     { part: 'hand', x: 50, y: 22 },
    tamtieu:    { part: 'hand', x: 65, y: 24 },
    tam:        { part: 'hand', x: 77, y: 30 },
    tieutruong: { part: 'hand', x: 82, y: 30 },
    // Foot (chân)
    ty:         { part: 'foot', x: 22, y: 20 },
    can:        { part: 'foot', x: 28, y: 22 },
    vi:         { part: 'foot', x: 40, y: 18 },
    dam:        { part: 'foot', x: 66, y: 20 },
    than:       { part: 'foot', x: 78, y: 26 },
    bangquang:  { part: 'foot', x: 83, y: 26 },
};

// Cho phép người dùng tự căn lại tọa độ marker (lưu localStorage)
let _mgOverrides = null; // { [meridianId]: {x:number,y:number} }
let _mgEditing = false;
let _mgActive = { meridianId: null, side: 'L' };
let _mgDraft = null;

function _loadMeasureGuideOverrides() {
    if (_mgOverrides) return _mgOverrides;
    try {
        const raw = localStorage.getItem('kinhlac_measure_guide_v1');
        _mgOverrides = raw ? JSON.parse(raw) : {};
    } catch (e) {
        _mgOverrides = {};
    }
    return _mgOverrides;
}

function _getGuideFor(meridianId) {
    const base = MEASURE_GUIDE[meridianId];
    if (!base) return null;
    const ov = _loadMeasureGuideOverrides()[meridianId];
    if (ov && typeof ov.x === 'number' && typeof ov.y === 'number') {
        return { ...base, x: ov.x, y: ov.y };
    }
    return base;
}

function updateMeasureGuide(meridianId, side /* 'L' | 'R' */) {
    const g = _getGuideFor(meridianId);
    const box = document.getElementById('measure-guide');
    if (!box || !g) return;
    _mgActive = { meridianId, side };
    const hand = document.getElementById('mg-hand');
    const foot = document.getElementById('mg-foot');
    const marker = document.getElementById('mg-marker');
    const kEl = document.getElementById('mg-k');
    const dEl = document.getElementById('mg-d');
    const sub = document.getElementById('mg-sub');
    const sideEl = document.getElementById('mg-side');
    const limbEl = document.getElementById('mg-limb');
    const capNoteEl = document.getElementById('mg-cap-note');

    if (hand && foot) {
        hand.style.display = g.part === 'hand' ? '' : 'none';
        foot.style.display = g.part === 'foot' ? '' : 'none';
    }

    const m = meridianNames.find(x => x.id === meridianId);
    const sideTxt = side === 'L' ? 'TRÁI' : 'PHẢI';
    const sideShort = side === 'L' ? 'T' : 'P';
    const limbTxt = (g.part === 'hand' ? 'TAY' : 'CHÂN') + ' ' + sideTxt;
    if (sub) sub.textContent = `Đang nhập: ${limbTxt}`;
    if (kEl) kEl.textContent = m ? (`Kinh ${m.n}`) : (`Kinh ${meridianId}`);
    const mainDesc = m?.d ? `${m.d}` : '';
    if (dEl) dEl.textContent = (mainDesc || 'Vị trí đo theo ngón tương ứng.');
    if (limbEl) limbEl.textContent = limbTxt;
    if (capNoteEl) capNoteEl.textContent = (g.part === 'hand') ? 'Sơ đồ bàn tay' : 'Sơ đồ bàn chân';

    // Với sơ đồ bàn chân, lật gương khi chọn chân trái để đúng trực quan.
    // Lật theo nhóm SVG (`mg-foot-g`) để ổn định hơn trên các trình duyệt.
    const activeSvg = g.part === 'hand' ? hand : foot;
    const isFootLeft = g.part === 'foot' && side === 'L';
    const isHandLeft = g.part === 'hand' && side === 'L';
    const footG = document.getElementById('mg-foot-g');
    const handG = document.getElementById('mg-hand-g');
    if (hand) hand.style.transform = 'none';
    if (foot) foot.style.transform = 'none';
    if (footG) {
        // viewBox width = 300 => flip theo trục X: translate(300,0) scale(-1,1)
        footG.setAttribute('transform', isFootLeft ? 'translate(300 0) scale(-1 1)' : 'none');
        if (!isFootLeft) footG.removeAttribute('transform');
    }
    if (handG) {
        handG.setAttribute('transform', isHandLeft ? 'translate(300 0) scale(-1 1)' : 'none');
        if (!isHandLeft) handG.removeAttribute('transform');
    }
    // (mg-flip trong CSS đã được vô hiệu để tránh lật kép)
    if (activeSvg) activeSvg.classList.toggle('mg-flip', false);

    // Marker: mirror theo cùng logic lật gương của bàn chân.
    if (marker) {
        marker.style.display = '';
        const x = (isFootLeft || isHandLeft) ? (100 - g.x) : g.x;
        marker.style.left = x + '%';
        marker.style.top = g.y + '%';
    }
    if (sideEl) sideEl.textContent = sideShort;
}

function _bindMeasureGuideHandlers(gridEl) {
    if (!gridEl || gridEl._mgBound) return;
    gridEl._mgBound = true;

    const handle = (e) => {
        const t = e.target;
        if (!t || !t.id) return;
        const m = /^in\-([a-z0-9_]+)\-(L|R)$/i.exec(t.id);
        if (!m) return;
        updateMeasureGuide(m[1].toLowerCase(), m[2]);
    };
    gridEl.addEventListener('focusin', handle);
    gridEl.addEventListener('click', handle);
}

function toggleMeasureGuideEdit() {
    const box = document.getElementById('measure-guide');
    if (!box) return;
    _mgEditing = !_mgEditing;
    box.classList.toggle('is-edit', _mgEditing);
    const eb = document.getElementById('mg-edit-btn');
    const sb = document.getElementById('mg-save-btn');
    const cb = document.getElementById('mg-cancel-btn');
    const hint = document.getElementById('mg-edit-hint');
    if (eb) eb.textContent = _mgEditing ? 'Đang chỉnh...' : 'Chỉnh vị trí';
    if (sb) sb.style.display = _mgEditing ? '' : 'none';
    if (cb) cb.style.display = _mgEditing ? '' : 'none';
    if (hint) hint.style.display = _mgEditing ? 'block' : 'none';

    if (_mgEditing && _mgActive.meridianId) {
        const g = _getGuideFor(_mgActive.meridianId);
        _mgDraft = g ? { x: g.x, y: g.y } : null;
    } else {
        _mgDraft = null;
    }
}

function cancelMeasureGuideEdits() {
    if (!_mgEditing) return;
    _mgEditing = false;
    const box = document.getElementById('measure-guide');
    if (box) box.classList.remove('is-edit');
    const eb = document.getElementById('mg-edit-btn');
    const sb = document.getElementById('mg-save-btn');
    const cb = document.getElementById('mg-cancel-btn');
    const hint = document.getElementById('mg-edit-hint');
    if (eb) eb.textContent = 'Chỉnh vị trí';
    if (sb) sb.style.display = 'none';
    if (cb) cb.style.display = 'none';
    if (hint) hint.style.display = 'none';
    _mgDraft = null;
    if (_mgActive.meridianId) updateMeasureGuide(_mgActive.meridianId, _mgActive.side);
}

function saveMeasureGuideEdits() {
    if (!_mgEditing || !_mgActive.meridianId || !_mgDraft) return;
    const all = _loadMeasureGuideOverrides();
    all[_mgActive.meridianId] = { x: _mgDraft.x, y: _mgDraft.y };
    try { localStorage.setItem('kinhlac_measure_guide_v1', JSON.stringify(all)); } catch (e) {}
    _mgOverrides = all;
    cancelMeasureGuideEdits();
}

function _mgSetFromPointer(clientX, clientY) {
    if (!_mgEditing || !_mgActive.meridianId) return;
    const diagram = document.getElementById('mg-diagram');
    const marker = document.getElementById('mg-marker');
    if (!diagram || !marker) return;
    const rect = diagram.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let xDisp = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    xDisp = Math.max(0, Math.min(100, xDisp));
    y = Math.max(0, Math.min(100, y));

    const g = _getGuideFor(_mgActive.meridianId);
    const flip = !!(g && (_mgActive.side === 'L') && (g.part === 'foot' || g.part === 'hand'));
    const xBase = flip ? (100 - xDisp) : xDisp; // lưu theo hệ tọa độ gốc (không lật)
    _mgDraft = { x: xBase, y };

    // update UI ngay lập tức
    marker.style.left = xDisp + '%';
    marker.style.top = y + '%';
}

function _initMeasureGuideEditor() {
    const marker = document.getElementById('mg-marker');
    const diagram = document.getElementById('mg-diagram');
    if (!marker || !diagram) return;
    if (diagram._mgEditorBound) return;
    diagram._mgEditorBound = true;

    let dragging = false;
    const onDown = (e) => {
        if (!_mgEditing) return;
        dragging = true;
        try { marker.setPointerCapture(e.pointerId); } catch (err) {}
        _mgSetFromPointer(e.clientX, e.clientY);
        e.preventDefault();
    };
    const onMove = (e) => {
        if (!_mgEditing || !dragging) return;
        _mgSetFromPointer(e.clientX, e.clientY);
        e.preventDefault();
    };
    const onUp = (e) => {
        if (!dragging) return;
        dragging = false;
        try { marker.releasePointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
    };

    // Kéo chấm hoặc click vào diagram để đặt nhanh
    marker.addEventListener('pointerdown', onDown);
    diagram.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
}

// =========================================================
// TẢI DỮ LIỆU
// =========================================================
async function loadData() {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = '<div class="spinner"></div><p id="loader-status">Đang kết nối máy chủ...</p>';
    document.body.appendChild(loader);
    const status = document.getElementById('loader-status');

    try {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const pre = isLocal ? '/data/' : 'data/';
        const ts  = () => '?v=' + Date.now();

        status.innerText = 'Đang tải danh sách bệnh nhân...';
        patientData = await apiGetPatients();

        status.innerText = 'Đang tải phiếu khám...';
        recordData = await apiGetRecords();

        status.innerText = 'Đang tải mô hình bệnh lý...';
        try {
            diseaseModels = await apiGetModels();
        } catch (e) {
            // fallback về JSON cũ
            const mRes = await fetch(pre + 'kl_bchung_luantri.json' + ts());
            if (mRes.ok) {
                const raw = await mRes.json();
                diseaseModels = raw.map(r => ({
                    modelId: r._id,
                    ten: r.tieuket || '',
                    nhomChinh: r.nhomid || '',
                    trieuchung: r.trieuchung || '',
                    phaptri: r.phepchua || '',
                    phuonghuyet: r.phuyet_chamcuu || '',
                    tieutruong: r.tieutruong ?? 0,
                    tam: r.tam ?? 0,
                    tamtieu: r.tamtieu ?? 0,
                    tambao: r.tambao ?? 0,
                    daitrang: r.daitrang ?? 0,
                    phe: r.phe ?? 0,
                    bangquang: r.bangquang ?? 0,
                    than: r.than ?? 0,
                    dam: r.dam ?? 0,
                    vi: r.vi ?? 0,
                    can: r.can ?? 0,
                    ty: r.ty ?? 0,
                }));
            }
        }
        // populate model filters
        try {
            const sel = document.getElementById('model-filter-group');
            if (sel) {
                const groups = Array.from(new Set((diseaseModels || []).map(m => (m.nhomChinh || '').trim()).filter(Boolean)))
                    .sort((a,b) => a.localeCompare(b, 'vi'));
                // keep first option
                sel.innerHTML = `<option value="">-- Nhóm --</option>` + groups.map(g => `<option value="${g}">${g}</option>`).join('');
            }
        } catch (e) {}

        status.innerText = 'Đang tải danh mục tỉnh/thành...';
        try {
            const tRes = await fetch(pre + 'kl_tinhthanh.json' + ts());
            if (tRes.ok) {
                provinceList = await tRes.json();
            }
        } catch (e) {
            console.warn('Không tải được kl_tinhthanh.json', e);
        }

        updateDashboardStats();
        renderRecentPatients();
        renderFullPatients();
        renderDiseaseModels();
        loader.remove();
    } catch (err) {
        console.error(err);
        loader.innerHTML = `<div style="color:red;text-align:center;padding:20px;"><h3>LỖI TẢI DỮ LIỆU</h3><p>${err.message}</p></div>`;
    }
}

// =========================================================
// DASHBOARD
// =========================================================
function updateDashboardStats() {
    const cp = document.getElementById('count-patients');
    const cr = document.getElementById('count-records');
    if (cp) cp.innerText = patientData.length.toLocaleString('vi-VN');
    if (cr) cr.innerText = recordData.length.toLocaleString('vi-VN');
}

function renderRecentPatients() {
    const list = document.getElementById('recent-patients-list');
    if (!list) return;
    const recent = [...patientData].sort((a, b) => b.benhnhanId - a.benhnhanId).slice(0, 5);
    list.innerHTML = recent.map(p => `
        <tr>
            <td>#${p.benhnhanId}</td>
            <td style="font-weight:600;">${p.hoten || 'N/A'}</td>
            <td>${p.gioitinh || 'N/A'}</td>
            <td>${p.diachi || 'N/A'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewPatient(${p.benhnhanId})">Chi tiết</button>
                <button class="btn btn-sm" style="border:1px solid #E6B0AA;background:#FDECEA;color:#B03A2E;margin-left:6px;" onclick="deletePatient(event, ${p.benhnhanId})">Xóa</button>
            </td>
        </tr>`).join('');
}

// =========================================================
// BỆNH NHÂN
// =========================================================
function renderFullPatients(data = patientData) {
    const list = document.getElementById('full-patients-list');
    if (!list) return;
    list.innerHTML = data.slice(0, 100).map(p => `
        <tr>
            <td>#${p.benhnhanId}</td>
            <td style="font-weight:600;">${p.hoten || 'N/A'}</td>
            <td>${formatDate(p.ngaysinh)}</td>
            <td>${p.dienthoai || 'N/A'}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewAnalysis(${p.benhnhanId})">Kinh Lạc</button>
                <button class="btn btn-sm" style="border:1px solid #D4C5A0;margin-left:4px;" onclick="viewPatient(${p.benhnhanId})">Hồ sơ</button>
                <button class="btn btn-sm" style="border:1px solid #E6B0AA;background:#FDECEA;color:#B03A2E;margin-left:4px;" onclick="deletePatient(event, ${p.benhnhanId})">Xóa</button>
            </td>
        </tr>`).join('');
}

function filterPatients(query) {
    const q = query.toLowerCase();
    const filtered = patientData.filter(p =>
        (p.hoten && p.hoten.toLowerCase().includes(q)) ||
        (p.benhnhanId && p.benhnhanId.toString().includes(q))
    );
    renderFullPatients(filtered);
}

// =========================================================
// BREADCRUMB + HASH ROUTING
// =========================================================
const _sections = {
    dashboard:      { title: 'Trang chủ',      parent: null },
    patients:       { title: 'Bệnh nhân',       parent: 'dashboard' },
    'patient-profile': { title: 'Hồ sơ',        parent: 'patients' },
    'new-record':   { title: 'Khám bệnh mới',   parent: 'patient-profile' },
    analysis:       { title: 'Phân tích',        parent: 'patient-profile' },
    reports:        { title: 'Báo cáo',          parent: 'dashboard' },
    tayy:           { title: 'Bệnh Tây Y',       parent: 'dashboard' },
    dongy:          { title: 'Bệnh Kinh Lạc',     parent: 'dashboard' },
    thuoc:          { title: 'Quản lý Thuốc',     parent: 'dashboard' },
    trieuchung:     { title: 'Quản lý Triệu chứng', parent: 'dashboard' },
    phaptri:        { title: 'Quản lý Pháp trị',  parent: 'dashboard' },
    appointments:   { title: 'Quản lý Lịch Khám', parent: 'dashboard' },
};

function _sectionLabel(id) {
    if (id === 'patient-profile' && _selectedPatientIdForNewRecord) {
        const pt = patientData.find(x => x.benhnhanId == _selectedPatientIdForNewRecord);
        return pt ? pt.hoten : ('Bệnh nhân #' + _selectedPatientIdForNewRecord);
    }
    if (id === 'new-record') {
        return _editingRecordId != null ? `Sửa phiếu #${_editingRecordId}` : 'Khám bệnh mới';
    }
    if (id === 'analysis' && activeAnalysisRecord) {
        return `Phân tích phiếu #${activeAnalysisRecord.phieukhamId}`;
    }
    return _sections[id]?.title || id;
}

function _updateBreadcrumb(currentId) {
    const bar = document.getElementById('breadcrumb-content');
    if (!bar) return;

    // Xây chuỗi đường dẫn
    const chain = [];
    let cur = currentId;
    while (cur) {
        chain.unshift(cur);
        cur = _sections[cur]?.parent || null;
    }

    const parts = chain.map((id, i) => {
        if (i === chain.length - 1) {
            return `<span class="bc-current">${_sectionLabel(id)}</span>`;
        }
        const fn = id === 'patient-profile'
            ? `viewPatient(${_selectedPatientIdForNewRecord})`
            : `showSection('${id}')`;
        return `<a class="bc-link" onclick="${fn}">${_sectionLabel(id)}</a>`;
    });

    // Nút Quay lại
    const parentId = _sections[currentId]?.parent;
    let backBtn = '';
    if (parentId) {
        const backFn = parentId === 'patient-profile'
            ? `viewPatient(${_selectedPatientIdForNewRecord})`
            : `showSection('${parentId}')`;
        backBtn = `<a class="bc-back-btn" onclick="${backFn}">← Quay lại</a>`;
    }

    bar.innerHTML = backBtn + parts.join('<span class="bc-sep">›</span>');

    // Cập nhật URL hash
    const hashMap = {
        dashboard: '/',
        patients: '/patients',
        'patient-profile': `/patient/${_selectedPatientIdForNewRecord || ''}`,
        'new-record': `/new-record`,
        analysis: `/analysis/${activeAnalysisRecord?.phieukhamId || ''}`,
        reports: '/reports',
        tayy: '/tayy',
        dongy: '/dongy',
        thuoc: '/thuoc',
        trieuchung: '/trieuchung',
        phaptri: '/phaptri',
        appointments: '/appointments',
    };
    const hash = hashMap[currentId] || '/' + currentId;
    if (window.location.hash.replace('#', '') !== hash) {
        history.pushState({ section: currentId }, '', '#' + hash);
    }
}

// Xử lý nút Back/Forward của trình duyệt
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
        _showSectionInternal(e.state.section);
        _updateBreadcrumb(e.state.section);
    }
});

// =========================================================
// ĐIỀU HƯỚNG
// =========================================================
function showSection(id) {
    _showSectionInternal(id);
    _updateBreadcrumb(id);
}

function _showSectionInternal(id) {
    document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
    const t = document.getElementById(id + '-section');
    if (t) t.style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('onclick')?.includes(`'${id}'`));
    });

    switch (id) {
        case 'tayy':
            if (typeof initTayyManagement === 'function') initTayyManagement();
            break;
        case 'dongy':
            if (typeof initDongyManagement === 'function') initDongyManagement();
            break;
        case 'thuoc':
            if (typeof initThuocManagement === 'function') initThuocManagement();
            break;
        case 'trieuchung':
            if (typeof initTrieuchungManagement === 'function') initTrieuchungManagement();
            break;
        case 'phaptri':
            if (typeof initPhapTriManagement === 'function') initPhapTriManagement();
            break;
        case 'appointments':
            if (typeof initAppointmentsManagement === 'function') initAppointmentsManagement();
            break;
        case 'settings':
            if (typeof renderSettings === 'function') renderSettings();
            break;
    }

    if (id === 'new-record') {
        // Cập nhật tiêu đề màn hình
        const nrTitle = document.getElementById('new-record-title');
        if (nrTitle) nrTitle.textContent = _editingRecordId != null ? `Sửa phiếu #${_editingRecordId}` : 'Khám bệnh mới';

        const pt = patientData.find(x => x.benhnhanId == _selectedPatientIdForNewRecord);
        const setText = (elId, val) => {
            const el = document.getElementById(elId);
            if (el) el.textContent = (val == null || val === '') ? '—' : String(val);
        };
        setText('nr-pt-id', _selectedPatientIdForNewRecord != null ? ('#' + _selectedPatientIdForNewRecord) : '—');
        setText('nr-pt-name', pt ? pt.hoten : ('Bệnh nhân #' + _selectedPatientIdForNewRecord));
        setText('nr-pt-gender', pt ? (pt.gioitinh || '—') : '—');
        // hiển thị năm sinh từ /Date(...)/
        let birthYear = '—';
        if (pt && pt.ngaysinh) {
            const m = /\/Date\((\-?\d+)\)\//.exec(pt.ngaysinh);
            if (m) {
                const d = new Date(parseInt(m[1], 10));
                if (!isNaN(d.getTime())) birthYear = d.getFullYear();
            }
        }
        setText('nr-pt-birth', birthYear);
        setText('nr-pt-address', pt ? (pt.diachi || '—') : '—');
        setText('nr-pt-phone', pt ? (pt.dienthoai || '—') : '—');
        setText('nr-pt-cmnd', pt ? (pt.cmnd || '—') : '—');
        setText('nr-pt-notes', pt ? (pt.ghichu || '—') : '—');

        // info phiếu khám (dự kiến hoặc đang sửa)
        const maxRec = recordData.reduce((m, r) => Math.max(m, r.phieukhamId || 0), 0);
        if (_editingRecordId != null) {
            setText('nr-rec-no', '#' + _editingRecordId);
        } else {
            setText('nr-rec-no', '#' + (maxRec + 1));
        }
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        setText('nr-rec-date', `${dd}/${mm}/${yyyy}`);
        setText('nr-rec-time', `${hh}:${mi}`);

        const grid = document.getElementById('input-meridians-grid');
        if (grid) {
            // Bố cục giống form WinForms cũ:
            // - Chi trên trái / phải
            // - Chi dưới trái / phải
            const handOrderOld = ['tieutruong','tam','tamtieu','tambao','daitrang','phe'];
            const footOrderOld = ['bangquang','than','dam','vi','can','ty'];

            const buildMini = (title, sideLabel, ids, side) => {
                let html = `<div class="newrec-mini"><h5>${title} ${sideLabel}</h5>`;
                html += `<table><thead><tr><th>Kinh</th><th>Nhiệt độ</th></tr></thead><tbody>`;
                ids.forEach(idVal => {
                    const m = meridianNames.find(x => x.id === idVal);
                    const label = m ? m.n : idVal;
                    const inputId = `in-${idVal}-${side}`;
                    html += `<tr>
                        <td style="text-align:left;padding-left:6px;">${label}</td>
                        <td><input type="number" id="${inputId}" class="newrec-input" step="0.1" placeholder="${side === 'L' ? 'Trái' : 'Phải'}"></td>
                    </tr>`;
                });
                html += `</tbody></table></div>`;
                return html;
            };

            grid.innerHTML = `
                <div class="newrec-two" style="margin-bottom:10px;">
                    ${buildMini('Chi trên', '(trái)', handOrderOld, 'L')}
                    ${buildMini('Chi trên', '(phải)', handOrderOld, 'R')}
                </div>
                <div class="newrec-two">
                    ${buildMini('Chi dưới', '(trái)', footOrderOld, 'L')}
                    ${buildMini('Chi dưới', '(phải)', footOrderOld, 'R')}
                </div>
            `;

            // Gắn handler để panel “Vị trí đo” cập nhật theo ô đang nhập
            _bindMeasureGuideHandlers(grid);

            // Normalize giá trị nhiệt độ kinh lạc khi người dùng nhập theo dạng "x10/x100"
            // Ví dụ: 354 -> 35.4 (chia 10), 3544 -> 35.44 (chia 100)
            const _toDotNumber = (v) => {
                if (v == null) return NaN;
                const s = String(v).trim().replace(',', '.');
                return Number.parseFloat(s);
            };
            const normalizeMeridianTempInputEl = (inputEl) => {
                if (!inputEl) return;
                const raw = _toDotNumber(inputEl.value);
                if (!Number.isFinite(raw) || raw === 0) return;
                if (raw >= 20 && raw <= 40) return;
                if (raw > 40) {
                    const maxPow = 4;
                    for (let pow = 1; pow <= maxPow; pow++) {
                        const cand = raw / Math.pow(10, pow);
                        if (cand >= 20 && cand <= 40) {
                            const rounded2 = Math.round(cand * 100) / 100;
                            inputEl.value = (pow === 1) ? (Math.round(cand * 10) / 10).toFixed(1) : rounded2.toFixed(2);
                            return;
                        }
                    }
                }
            };

            grid.addEventListener('blur', (e) => {
                const t = e.target;
                if (!t || !t.id) return;
                if (!/^in-[a-z0-9_]+-(L|R)$/i.test(t.id)) return;
                normalizeMeridianTempInputEl(t);
            }, true);

            // Default highlight: ô đầu tiên (nếu có)
            setTimeout(() => {
                const first = grid.querySelector('input[id^="in-"]');
                if (first && first.id) {
                    const m = /^in\-([a-z0-9_]+)\-(L|R)$/i.exec(first.id);
                    if (m) updateMeasureGuide(m[1].toLowerCase(), m[2]);
                }
            }, 0);
        }
        const err = document.getElementById('new-rec-error');
        if (err) err.textContent = '';
        const env = document.getElementById('input-env-temp');
        if (env) {
            if (_editingRecordId != null && activeAnalysisRecord && typeof activeAnalysisRecord.nhietdoMoitruong !== 'undefined') {
                env.value = activeAnalysisRecord.nhietdoMoitruong;
            } else {
                env.value = '';
            }
        }

        // reset các ô giống form cũ (tuỳ chọn)
        const resetVal = (elId) => { const el = document.getElementById(elId); if (el) el.value = ''; };
        resetVal('nr-trieuchung');
        resetVal('nr-xn');
        resetVal('nr-takhi');
        const s1 = document.getElementById('nr-phanloai-chungbenh'); if (s1) s1.value = '';
        const s2 = document.getElementById('nr-phanloai-canbang'); if (s2) s2.value = '';

        // 4 ô KPI (để giống layout cũ; hiện để placeholder)
        const setKpi = (kid, v) => { const el = document.getElementById(kid); if (el) el.textContent = v; };
        setKpi('nr-kpi-1', '—');
        setKpi('nr-kpi-2', '—');
        setKpi('nr-kpi-3', '—');
        setKpi('nr-kpi-4', '—');

        // Cập nhật breadcrumb sau khi đã có đủ context
        _updateBreadcrumb('new-record');

        // Auto-update theo internet: ngày/giờ đo realtime + nhiệt độ MT theo vị trí
        startNewRecordAutoUpdates();
    } else {
        stopNewRecordAutoUpdates();
    }
}

function stopNewRecordAutoUpdates() {
    if (_newRecTimer) {
        clearInterval(_newRecTimer);
        _newRecTimer = null;
    }
    if (_newRecWeatherTimer) {
        clearInterval(_newRecWeatherTimer);
        _newRecWeatherTimer = null;
    }
}

function startNewRecordAutoUpdates() {
    stopNewRecordAutoUpdates();

    const setText = (elId, val) => {
        const el = document.getElementById(elId);
        if (el) el.textContent = (val == null || val === '') ? '—' : String(val);
    };

    const tick = () => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        setText('nr-rec-date', `${dd}/${mm}/${yyyy}`);
        setText('nr-rec-time', `${hh}:${mi}`);
    };

    tick();
    _newRecTimer = setInterval(tick, 1000);

    const envEl = document.getElementById('input-env-temp');
    const errEl = document.getElementById('new-rec-error');

    const setErr = (msg) => {
        if (!errEl) return;
        // Chỉ hiện hướng dẫn nếu chưa lấy được nhiệt độ tự động
        if (envEl && envEl.value) return;
        errEl.textContent = msg || '';
    };

    const fetchWeatherByCoords = async (lat, lon) => {
        // Open-Meteo: không cần API key
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Không lấy được thời tiết');
        const data = await res.json();
        const t = data && data.current_weather && typeof data.current_weather.temperature === 'number'
            ? data.current_weather.temperature
            : null;
        if (t == null) throw new Error('Thiếu nhiệt độ hiện tại');
        return t;
    };

    const resolveCoords = async () => {
        // 1) Geolocation (xin quyền) — chính xác nhất
        if (navigator.geolocation) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 6000,
                        maximumAge: 10 * 60 * 1000
                    });
                });
                if (pos && pos.coords) return { lat: pos.coords.latitude, lon: pos.coords.longitude };
            } catch (e) {
                // fallback sang IP
            }
        }
        // 2) IP-based (không xin quyền)
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            if (ipRes.ok) {
                const j = await ipRes.json();
                if (j && typeof j.latitude === 'number' && typeof j.longitude === 'number') {
                    return { lat: j.latitude, lon: j.longitude };
                }
            }
        } catch (e) {}
        return null;
    };

    const updateWeather = async () => {
        if (!envEl) return;
        try {
            setErr('Đang tự lấy nhiệt độ môi trường theo vị trí...');
            const coords = await resolveCoords();
            if (!coords) {
                setErr('Không lấy được vị trí để tự cập nhật nhiệt độ MT. Bạn có thể nhập thủ công.');
                return;
            }
            const temp = await fetchWeatherByCoords(coords.lat, coords.lon);
            // Chỉ set nếu user chưa nhập
            if (!envEl.value) envEl.value = Number(temp).toFixed(1);
            setErr('');
        } catch (e) {
            setErr('Không tự lấy được nhiệt độ MT từ internet. Bạn có thể nhập thủ công.');
        }
    };

    // cập nhật ngay + refresh mỗi 15 phút
    updateWeather();
    _newRecWeatherTimer = setInterval(updateWeather, 15 * 60 * 1000);
}

function openAnalysisTab() {
    showSection('analysis');
}

async function deletePatient(ev, benhnhanId) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const recCount = recordData.filter(r => r.benhnhanId == benhnhanId).length;
    const msg = recCount
        ? `Bạn có chắc muốn xóa bệnh nhân #${benhnhanId} không?\nPhiếu khám liên quan sẽ bị xóa: ${recCount}`
        : `Bạn có chắc muốn xóa bệnh nhân #${benhnhanId} không?`;
    if (!confirm(msg)) return;
    try {
        const data = await apiDeletePatient(benhnhanId);
        if (!data || !data.success) {
            alert('Xóa bệnh nhân thất bại: ' + (data && data.error ? data.error : 'không rõ'));
            return;
        }
        // Cập nhật dữ liệu frontend
        patientData = patientData.filter(p => p.benhnhanId != benhnhanId);
        recordData = recordData.filter(r => r.benhnhanId != benhnhanId);
        renderFullPatients(patientData);
        renderRecentPatients();
        updateDashboardStats();
        // Nếu đang đứng ở hồ sơ/analysis của bệnh nhân vừa xóa
        if (_selectedPatientIdForNewRecord == benhnhanId) {
            _selectedPatientIdForNewRecord = null;
            activeAnalysisRecord = null;
            showSection('patients');
        }
    } catch (e) {
        alert('Lỗi kết nối khi xóa bệnh nhân: ' + e.message);
    }
}

async function deleteRecord(ev, patientId, phieukhamId) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa phiếu khám #' + phieukhamId + ' không?')) return;
    try {
        const data = await apiDeleteRecord(phieukhamId);
        if (!data.success) {
            alert('Xóa phiếu thất bại: ' + (data.error || 'không rõ'));
            return;
        }
        // Cập nhật dữ liệu trên frontend
        recordData = recordData.filter(r => r.phieukhamId != phieukhamId);
        renderHistory(patientId);
        // Nếu đang xem phiếu vừa bị xóa thì quay lại hồ sơ
        if (activeAnalysisRecord && activeAnalysisRecord.phieukhamId == phieukhamId) {
            activeAnalysisRecord = null;
            viewPatient(patientId);
        }
    } catch (e) {
        alert('Lỗi kết nối khi xóa phiếu: ' + e.message);
    }
}

function editCurrentRecord() {
    if (!activeAnalysisRecord) { alert('Chưa chọn phiếu khám để sửa.'); return; }
    _editingRecordId = activeAnalysisRecord.phieukhamId;
    // Update tiêu đề màn hình khám
    const title = document.getElementById('new-record-title');
    if (title) title.textContent = `Sửa phiếu #${_editingRecordId}`;
    showSection('new-record');
}

function startNewExamForCurrentPatient() {
    if (!_selectedPatientIdForNewRecord) { alert('Chưa chọn bệnh nhân.'); return; }
    _editingRecordId = null;
    const title = document.getElementById('new-record-title');
    if (title) title.textContent = 'Khám bệnh mới';
    showSection('new-record');
}

// =========================================================
// HỒ SƠ BỆNH NHÂN
// =========================================================
function viewPatient(id) {
    const p = patientData.find(x => x.benhnhanId == id);
    if (!p) return;
    _selectedPatientIdForNewRecord = id;
    _showSectionInternal('patient-profile');
    _updateBreadcrumb('patient-profile');
    const name = document.getElementById('profile-name');
    if (name) name.innerText = p.hoten;
    const info = document.getElementById('profile-info');
    if (info) info.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr;gap:10px;">
            <div><strong>Giới tính:</strong> ${p.gioitinh || 'N/A'}</div>
            <div><strong>Ngày sinh:</strong> ${formatDate(p.ngaysinh)}</div>
            <div><strong>Địa chỉ:</strong> ${p.diachi || 'N/A'}</div>
            <div><strong>Điện thoại:</strong> ${p.dienthoai || 'N/A'}</div>
        </div>`;
    renderHistory(id);
}

function renderHistory(patientId) {
    const list = document.getElementById('history-list');
    if (!list) return;
    const recs = recordData.filter(r => r.benhnhanId == patientId);
    if (!recs.length) { list.innerHTML = '<p style="color:#A09580;">Chưa có phiếu khám.</p>'; return; }
    list.innerHTML = recs
        .sort((a, b) => b.phieukhamId - a.phieukhamId)
        .map(r => `
        <div class="history-item"
             onclick="viewAnalysis(${patientId}, ${r.phieukhamId})"
             style="padding:10px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:space-between;"
             onmouseenter="this.style.background='#F5F0E8'" onmouseleave="this.style.background=''">
            <div>
                <strong>Phiếu khám #${r.phieukhamId}</strong> — ${formatDate(r.ngaykham)}
                <span style="font-size:0.8rem;color:#A09580;margin-left:8px;">${r.giokham || ''}</span>
            </div>
            <button class="btn"
                    style="padding:2px 8px;font-size:0.75rem;background:#FDECEA;color:#B03A2E;border:1px solid #E6B0AA;border-radius:4px;"
                    onclick="deleteRecord(event, ${patientId}, ${r.phieukhamId})">
                Xóa
            </button>
        </div>`).join('');
}

// =========================================================
// PHÂN TÍCH KINH LẠC
// =========================================================
async function viewAnalysis(patientId, phieukhamId = null) {
    if (!phieukhamId && !patientId) return;

    // Luôn fetch data mới nhất từ server cho phiếu này
    let target = null;
    if (phieukhamId) {
        target = await apiGetRecord(phieukhamId);
        if (target) patientId = target.benhnhanId;
    }

    if (!target && patientId) {
        // Nếu không có phieukhamId, lấy phiếu mới nhất của bệnh nhân từ recordData cục bộ
        const recs = recordData.filter(r => r.benhnhanId == patientId);
        if (recs.length) {
            target = recs.sort((a, b) => b.phieukhamId - a.phieukhamId)[0];
        }
    }

    if (!target) {
        if (phieukhamId) {
            alert(`Không tìm thấy dữ liệu cho phiếu khám #${phieukhamId}.`);
        } else {
            alert('Chưa có dữ liệu đo kinh lạc cho bệnh nhân này.');
        }
        return;
    }
    activeAnalysisRecord = target;
    _editingRecordId = null;
    _selectedRecordModels = {};
    _showSectionInternal('analysis');
    _updateBreadcrumb('analysis');
    renderBodyChart(target);
    // Tải mô hình đã chọn cho phiếu
    const pid = target?.phieukhamId || target?.phieukham_id;
    if (pid) {
        renderSelectedModelsPanel(pid);
    }
}

// =========================================================
// RENDER BÁO CÁO KINH LẠC (13 CỘT)
// =========================================================
function renderBodyChart(record, selectedModel = null) {
    if (!record) return;

    const diag = DiagnosisLogic.performFullDiagnosis(record);
    const pt   = patientData.find(p => p.benhnhanId === record.benhnhanId) || {};

    // -- Thông tin bệnh nhân --
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('report-pt-name',   pt.hoten  || 'N/A');
    set('report-pt-birth',  pt.ngaysinh ? formatDate(pt.ngaysinh) : 'N/A');
    set('report-pt-gender', pt.gioitinh || 'N/A');
    set('report-pt-bp',     record.huyetap || 'N/A');
    set('report-pt-bmi',    record.bmi   || 'N/A');
    set('report-pt-date',   record.ngaykham ? formatDate(record.ngaykham) : 'N/A');

    // -- Bảng hệ số chuẩn --
    renderBaselineStats(diag.baselines, diag.meridianStats);

    // -- Bảng 13 cột --
    const handBody = document.querySelector('#hand-meridian-table tbody');
    const footBody = document.querySelector('#foot-meridian-table tbody');
    if (handBody) handBody.innerHTML = '';
    if (footBody) footBody.innerHTML = '';

    const showComp = !!selectedModel;
    // Hiện/ẩn cột lý thuyết
    document.querySelectorAll('.comp-col').forEach(el => {
        el.style.display = showComp ? '' : 'none';
    });

    meridianNames.filter(m => m.group === 'tren').forEach(m => renderRow(m, diag, selectedModel, handBody));
    meridianNames.filter(m => m.group === 'duoi').forEach(m => renderRow(m, diag, selectedModel, footBody));

    // -- Kết luận Bát Cương --
    renderBatCuongConclusion(diag, record);

    // -- Gợi ý mô hình bệnh --
    const modelSection = document.getElementById('model-section');
    if (modelSection) {
        if (!selectedModel) {
            modelSection.style.display = 'block';
            suggestRelatedModels(record, diag);
        } else {
            renderSelectedModelDetail(selectedModel);
        }
    }
}

// ---- Bảng Hệ số chuẩn 13 cột ----
function renderBaselineStats(b, meridianStats) {
    const c = document.getElementById('stats-summary-container');
    if (!c) return;

    // Đếm số kinh Thực / Hư theo từng chi để hiển thị ngay dưới thang chuẩn
    let thucTren = 0, thucDuoi = 0, huTren = 0, huDuoi = 0;
    if (meridianStats) {
        meridianNames.forEach(m => {
            const s = meridianStats[m.id];
            if (!s) return;
            const thuc = s.leftStatus === '+' || s.rightStatus === '+';
            const hu   = s.leftStatus === '-' || s.rightStatus === '-';
            if (m.group === 'tren') {
                if (thuc) thucTren++;
                if (hu)   huTren++;
            } else if (m.group === 'duoi') {
                if (thuc) thucDuoi++;
                if (hu)   huDuoi++;
            }
        });
    }
    const delta = (b.avg_tren - b.avg_duoi).toFixed(2);
    const absDelta = Math.abs(b.avg_tren - b.avg_duoi).toFixed(2);
    const ketLuan = b.avg_tren > b.avg_duoi + 1 ? 'DƯƠNG THỊNH' :
                    b.avg_duoi > b.avg_tren + 1 ? 'ÂM THỊNH' : 'CÂN BẰNG';
    const klColor = ketLuan === 'DƯƠNG THỊNH' ? '#8B1A1A' :
                    ketLuan === 'ÂM THỊNH' ? '#2C4A6E' : '#5B4A3A';

    const totalThuc = thucTren + thucDuoi;
    const totalHu = huTren + huDuoi;
    const htKetLuan = totalThuc > totalHu ? 'THỰC' : (totalHu > totalThuc ? 'HƯ' : 'CÂN BẰNG');
    const htColor = htKetLuan === 'THỰC' ? '#8B4513' :
                    htKetLuan === 'HƯ' ? '#2D5A27' : '#5B4A3A';

    let nhietTren = 0, nhietDuoi = 0, hanTren = 0, hanDuoi = 0;
    if (meridianStats) {
        meridianNames.forEach(m => {
            const s = meridianStats[m.id];
            if (!s || !s.batCuong) return;
            const isNhiet = s.batCuong.includes('Nhiệt');
            const isHan   = s.batCuong.includes('Hàn');
            if (m.group === 'tren') {
                if (isNhiet) nhietTren++;
                if (isHan)   hanTren++;
            } else {
                if (isNhiet) nhietDuoi++;
                if (isHan)   hanDuoi++;
            }
        });
    }
    const totalNhiet = nhietTren + nhietDuoi;
    const totalHan   = hanTren + hanDuoi;
    const hnKetLuan = totalNhiet > totalHan ? 'NHIỆT' : (totalHan > totalNhiet ? 'HÀN' : 'CÂN BẰNG');
    const hnColor = hnKetLuan === 'NHIỆT' ? '#A62B2B' :
                    hnKetLuan === 'HÀN' ? '#1A5276' : '#5B4A3A';

    let bieuTren = 0, bieuDuoi = 0, lyTren = 0, lyDuoi = 0;
    if (meridianStats) {
        meridianNames.forEach(m => {
            const s = meridianStats[m.id];
            if (!s || !s.batCuong) return;
            const isBieu = s.batCuong.includes('Biểu');
            const isLy   = s.batCuong.includes('Lý');
            if (m.group === 'tren') {
                if (isBieu) bieuTren++;
                if (isLy)   lyTren++;
            } else {
                if (isBieu) bieuDuoi++;
                if (isLy)   lyDuoi++;
            }
        });
    }
    const totalBieu = bieuTren + bieuDuoi;
    const totalLy   = lyTren + lyDuoi;
    const blKetLuan = totalBieu > totalLy ? 'BIỂU' : (totalLy > totalBieu ? 'LÝ' : 'CÂN BẰNG');
    const blColor   = blKetLuan === 'BIỂU' ? '#A0632C' :
                      blKetLuan === 'LÝ' ? '#7A1B3D' : '#5B4A3A';

    c.innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:8px;">
        <div id="baseline-box-tren" data-thuc="${thucTren}" data-hu="${huTren}" data-nhiet="${nhietTren}" data-han="${hanTren}" data-bieu="${bieuTren}" data-ly="${lyTren}" style="flex:1;transition:box-shadow 0.3s,opacity 0.3s;">
            ${renderOneBaseline('CHI TRÊN TAY (THỦ)', b.max_tren, b.min_tren, b.range_tren, b.avg_tren, b.step_tren, b.up_tren, b.low_tren, thucTren, huTren, nhietTren, hanTren, bieuTren, lyTren)}
        </div>
        <div id="baseline-box-duoi" data-thuc="${thucDuoi}" data-hu="${huDuoi}" data-nhiet="${nhietDuoi}" data-han="${hanDuoi}" data-bieu="${bieuDuoi}" data-ly="${lyDuoi}" style="flex:1;transition:box-shadow 0.3s,opacity 0.3s;">
            ${renderOneBaseline('CHI DƯỚI CHÂN (TÚC)', b.max_duoi, b.min_duoi, b.range_duoi, b.avg_duoi, b.step_duoi, b.up_duoi, b.low_duoi, thucDuoi, huDuoi, nhietDuoi, hanDuoi, bieuDuoi, lyDuoi)}
        </div>
    </div>
    <div id="baseline-comparison" style="display:none;padding:8px 12px;background:#FBF8F1;border:1px solid #D4C5A0;border-radius:5px;margin-bottom:12px;font-family:'Times New Roman',serif;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
            <div style="text-align:center;min-width:90px;">
                <div style="font-size:0.55rem;color:#A09580;">Trung Vị các kinh THỦ (+) DƯƠNG (Tay)</div>
                <div id="comp-avg-tren" style="font-size:1.05rem;font-weight:bold;color:#8B1A1A;">${b.avg_tren.toFixed(2)}</div>
            </div>
            <div style="text-align:center;font-size:1.1rem;font-weight:bold;color:${klColor};padding:0 4px;">
                ${b.avg_tren > b.avg_duoi ? '>' : (b.avg_tren < b.avg_duoi ? '<' : '=')}
            </div>
            <div style="text-align:center;min-width:90px;">
                <div style="font-size:0.55rem;color:#A09580;">Trung Vị các kinh TÚC (−) ÂM (Chân)</div>
                <div id="comp-avg-duoi" style="font-size:1.05rem;font-weight:bold;color:#2C4A6E;">${b.avg_duoi.toFixed(2)}</div>
            </div>
            <div style="text-align:center;padding:0 6px;color:#A09580;font-size:0.7rem;">
                ⇒ Chênh: <span style="font-weight:bold;color:${klColor};">${delta > 0 ? '+' : ''}${delta}</span>
                ${Math.abs(b.avg_tren - b.avg_duoi) > 1
                    ? ' <span style="font-size:0.6rem;color:#A09580;">(> 1 → bất thường)</span>'
                    : ' <span style="font-size:0.6rem;color:#A09580;">(≤ 1 → bình thường)</span>'}
            </div>
            <div style="text-align:center;padding-left:8px;border-left:1px solid #D4C5A0;">
                <div style="font-size:0.52rem;color:#A09580;">Kết luận</div>
                <div style="font-size:0.9rem;font-weight:bold;color:${klColor};">${ketLuan}</div>
            </div>
        </div>
    </div>
    <div id="baseline-compare-hu-thuc" style="display:none;padding:8px 12px;background:#FBF8F1;border:1px solid #D4C5A0;border-radius:5px;margin-bottom:12px;font-family:'Times New Roman',serif;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Thực (+)</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#8B4513;">${thucTren + thucDuoi}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${thucTren} · TÚC: ${thucDuoi}</div>
            </div>
            <div style="text-align:center;font-size:1.1rem;font-weight:bold;color:${htColor};padding:0 4px;">
                ${(thucTren+thucDuoi) > (huTren+huDuoi) ? '>' : ((thucTren+thucDuoi) < (huTren+huDuoi) ? '<' : '=')}
            </div>
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Hư (−)</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#2D5A27;">${huTren + huDuoi}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${huTren} · TÚC: ${huDuoi}</div>
            </div>
            <div style="text-align:center;padding:0 6px;color:#A09580;font-size:0.65rem;max-width:140px;">
                Thực (+) = TB kinh > Trung vị + Khoảng<br>
                Hư (−) = TB kinh < Trung vị − Khoảng
            </div>
            <div style="text-align:center;padding-left:8px;border-left:1px solid #D4C5A0;">
                <div style="font-size:0.52rem;color:#A09580;">Kết luận</div>
                <div style="font-size:0.9rem;font-weight:bold;color:${htColor};">${htKetLuan}</div>
            </div>
        </div>
    </div>
    <div id="baseline-compare-han-nhiet" style="display:none;padding:8px 12px;background:#FBF8F1;border:1px solid #D4C5A0;border-radius:5px;margin-bottom:12px;font-family:'Times New Roman',serif;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Nhiệt</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#A62B2B;">${totalNhiet}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${nhietTren} · TÚC: ${nhietDuoi}</div>
            </div>
            <div style="text-align:center;font-size:1.1rem;font-weight:bold;color:${hnColor};padding:0 4px;">
                ${totalNhiet > totalHan ? '>' : (totalNhiet < totalHan ? '<' : '=')}
            </div>
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Hàn</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#1A5276;">${totalHan}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${hanTren} · TÚC: ${hanDuoi}</div>
            </div>
            <div style="text-align:center;padding:0 6px;color:#A09580;font-size:0.65rem;max-width:160px;">
                Nhiệt = 1/3 trên biên độ<br>
                Hàn = 1/3 dưới biên độ
            </div>
            <div style="text-align:center;padding-left:8px;border-left:1px solid #D4C5A0;">
                <div style="font-size:0.52rem;color:#A09580;">Kết luận</div>
                <div style="font-size:0.9rem;font-weight:bold;color:${hnColor};">${hnKetLuan}</div>
            </div>
        </div>
    </div>
    <div id="baseline-compare-bieu-ly" style="display:none;padding:8px 12px;background:#FBF8F1;border:1px solid #D4C5A0;border-radius:5px;margin-bottom:12px;font-family:'Times New Roman',serif;transition:all 0.3s;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Biểu</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#A0632C;">${totalBieu}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${bieuTren} · TÚC: ${bieuDuoi}</div>
            </div>
            <div style="text-align:center;font-size:1.1rem;font-weight:bold;color:${blColor};padding:0 4px;">
                ${totalBieu > totalLy ? '>' : (totalBieu < totalLy ? '<' : '=')}
            </div>
            <div style="text-align:center;min-width:80px;">
                <div style="font-size:0.55rem;color:#A09580;">Số kinh Lý</div>
                <div style="font-size:1.05rem;font-weight:bold;color:#7A1B3D;">${totalLy}</div>
                <div style="font-size:0.5rem;color:#A09580;">THỦ: ${lyTren} · TÚC: ${lyDuoi}</div>
            </div>
            <div style="text-align:center;padding:0 6px;color:#A09580;font-size:0.6rem;max-width:200px;">
                Lý: cả hai bên cùng vùng (cùng &gt; ngưỡng trên hoặc cùng &lt; ngưỡng dưới).<br>
                Biểu: một bên ngoài vùng bình thường.
            </div>
            <div style="text-align:center;padding-left:8px;border-left:1px solid #D4C5A0;">
                <div style="font-size:0.52rem;color:#A09580;">Kết luận</div>
                <div style="font-size:0.9rem;font-weight:bold;color:${blColor};">${blKetLuan}</div>
            </div>
        </div>
    </div>`;
}

function renderOneBaseline(label, max, min, range, avg, step, up, low, thucCount, huCount, nhietCount, hanCount, bieuCount, lyCount) {
    const f = v => (v || 0).toFixed(2);
    const nN = nhietCount != null ? nhietCount : 0;
    const nH = hanCount != null ? hanCount : 0;
    const nB = bieuCount != null ? bieuCount : 0;
    const nL = lyCount != null ? lyCount : 0;
    return `
    <div>
        <div style="font-size:0.7rem;font-weight:bold;margin-bottom:5px;color:#5B3A1A;font-family:'Times New Roman',serif;">HỆ SỐ CHUẨN ${label}</div>
        <div style="display:flex;gap:4px;align-items:stretch;height:126px;font-family:'Times New Roman',serif;">
            <div style="display:flex;flex-direction:column;justify-content:space-between;text-align:right;font-size:0.68rem;min-width:38px;padding:1px 0;">
                <span class="baseline-other" style="color:#A09580;transition:all 0.3s;">${f(max)}</span>
                <span class="baseline-up" style="color:#8B1A1A;font-weight:bold;transition:all 0.3s;">${f(up)}</span>
                <span class="baseline-avg" style="color:#5B3A1A;font-weight:bold;transition:all 0.3s;">${f(avg)}</span>
                <span class="baseline-low" style="color:#1A5276;font-weight:bold;transition:all 0.3s;">${f(low)}</span>
                <span class="baseline-other" style="color:#A09580;transition:all 0.3s;">${f(min)}</span>
            </div>
            <div class="zone-bar-col" style="width:16px;display:flex;flex-direction:column;border-radius:4px;overflow:hidden;border:1px solid #C4B598;transition:all 0.3s;">
                <div class="zone-nhiet" style="flex:1;background:linear-gradient(180deg,#8B1A1A55,#8B1A1A22);transition:all 0.3s;"></div>
                <div class="zone-binh" style="flex:1;background:#F5EDD8;border-top:2px solid #8B1A1A;border-bottom:2px solid #1A5276;position:relative;transition:all 0.3s;">
                    <div style="position:absolute;top:50%;left:0;right:0;border-top:1px dashed #8B7355;"></div>
                </div>
                <div class="zone-han" style="flex:1;background:linear-gradient(180deg,#1A527622,#1A527655);transition:all 0.3s;"></div>
            </div>
            <div style="display:flex;flex-direction:column;font-size:0.62rem;min-width:70px;">
                <div class="zone-label-nhiet" style="flex:1;display:flex;align-items:center;color:#8B1A1A;font-weight:bold;transition:all 0.3s;">NHIỆT (${nN})</div>
                <div class="zone-label-binh" style="flex:1;display:flex;align-items:center;color:#5B4A3A;font-size:0.56rem;line-height:1.3;transition:all 0.3s;">Bình thường<br>(sinh lý)</div>
                <div class="zone-label-han" style="flex:1;display:flex;align-items:center;color:#1A5276;font-weight:bold;transition:all 0.3s;">HÀN (${nH})</div>
            </div>
        </div>
        <div style="font-size:0.55rem;color:#A09580;margin-top:4px;text-align:center;transition:opacity 0.3s;font-family:'Times New Roman',serif;">
            <div class="baseline-other">Biên độ: ${f(range)} · Khoảng: ±${f(step)}</div>
            <div id="baseline-hu-thuc-summary" class="baseline-hu-thuc" style="margin-top:2px;display:none;">
                Hư / Thực: <strong>${thucCount || 0}</strong> kinh Thực (+),
                <strong>${huCount || 0}</strong> kinh Hư (−).
            </div>
        </div>
    </div>`;
}

// ---- Render từng hàng 13 cột ----
function renderRow(m, diag, selectedModel, container) {
    if (!container) return;
    const s   = diag.meridianStats[m.id];
    if (!s) return;
    const L = s.leftValue, R = s.rightValue;
    const diffStr = s.diff !== 0 ? s.diff.toFixed(2) : '';
    const diffColor = s.diff > 0 ? '#8B1A1A' : (s.diff < 0 ? '#1A5276' : '#A09580');

    // Cột lý thuyết (13)
    let compHTML = '';
    const showComp = !!selectedModel;
    if (showComp) {
        const tv  = selectedModel[m.id] == 1 ? '+' : (selectedModel[m.id] == -1 ? '-' : '');
        const match = tv && (tv === s.leftStatus || tv === s.rightStatus);
        const col = match ? '#2D5A27' : '#8B1A1A';
        compHTML = `<td class="comp-col" style="background:${col}11;text-align:center;color:${col};font-weight:bold;">${tv}${match ? ' ✓' : ''}</td>`;
    } else {
        compHTML = `<td class="comp-col" style="display:none;"></td>`;
    }

    // Màu Bát Cương
    const bcColor = s.batCuong.includes('Nhiệt') ? '#8B1A1A' : (s.batCuong.includes('Hàn') ? '#1A5276' : '#2D2D2D');
    const bcBg    = s.batCuong.includes('Lý')    ? '#FDF0E8' : (s.batCuong !== '' ? '#F0EBE0' : 'transparent');

    const tr = document.createElement('tr');
    tr.setAttribute('data-meridian-id', m.id);
    tr.setAttribute('data-bat-cuong', s.batCuong);
    tr.setAttribute('data-group', m.group);
    tr.setAttribute('data-is-thuc', (s.leftStatus === '+' || s.rightStatus === '+') ? '1' : '0');
    tr.setAttribute('data-is-hu', (s.leftStatus === '-' || s.rightStatus === '-') ? '1' : '0');
    tr.setAttribute('data-left-st', s.leftStatus);
    tr.setAttribute('data-right-st', s.rightStatus);
    tr.style.transition = 'background 0.2s, box-shadow 0.2s, opacity 0.2s';
    tr.innerHTML = `
        <td style="text-align:left;padding:3px 5px;min-width:100px;">
            <div style="font-weight:bold;font-size:0.8rem;">${m.n}</div>
            <div style="font-size:0.6rem;color:#A09580;">${m.d}</div>
        </td>
        <td class="cell-st-lp" style="color:#8B1A1A;font-weight:bold;text-align:center;transition:all 0.2s;">${s.leftStatus === '+' ? '+' : ''}</td>
        <td class="cell-st-lm" style="color:#1A5276;font-weight:bold;text-align:center;transition:all 0.2s;">${s.leftStatus === '-' ? '-' : ''}</td>
        <td class="cell-val-l" style="text-align:center;transition:all 0.2s;">${L ? L.toFixed(1) : '-'}</td>
        <td style="text-align:center;background:#FBF8F1;">${s.avg.toFixed(2)}</td>
        <td class="cell-diff" style="text-align:center;color:${diffColor};font-weight:${s.diff!==0?'bold':'normal'};transition:all 0.2s;">${diffStr}</td>
        <td class="cell-val-r" style="text-align:center;transition:all 0.2s;">${R ? R.toFixed(1) : '-'}</td>
        <td class="cell-st-rp" style="color:#8B1A1A;font-weight:bold;text-align:center;transition:all 0.2s;">${s.rightStatus === '+' ? '+' : ''}</td>
        <td class="cell-st-rm" style="color:#1A5276;font-weight:bold;text-align:center;transition:all 0.2s;">${s.rightStatus === '-' ? '-' : ''}</td>
        <td style="text-align:center;font-weight:bold;">${s.absDelta.toFixed(2)}</td>
        <td class="bc-col" style="display:none;text-align:center;font-size:0.7rem;font-weight:bold;color:${bcColor};background:${bcBg};">${s.batCuong || '—'}</td>
        ${compHTML}
    `;
    container.appendChild(tr);
}

// ---- Kết luận Bát Cương (hover → highlight bảng) ----
function renderBatCuongConclusion(diag, record) {
    const box = document.getElementById('analysis-conclusion-box');
    if (!box) return;
    const bt  = diag.batCuongTong;
    const cats = diag.categories;

    // Map tên kinh → id (để highlight bảng)
    const nameToId = {};
    meridianNames.forEach(m => { nameToId[m.n] = m.id; });

    const getIds = (names) => names.map(n => nameToId[n]).filter(Boolean);

    _currentBatCuongTong = bt;
    _currentBaselines    = diag.baselines;
    _activeBadgeType = null;
    _activeBadgeEl   = null;
    _activeBadgeCol  = null;
    // Ẩn cột Bát Cương khi re-render (reset trạng thái)
    document.querySelectorAll('.bc-col').forEach(el => { el.style.display = 'none'; });

    // Tính số kinh mạch cho từng label
    const mStats = diag.meridianStats;
    let cntDuong = 0, cntAm = 0, cntThuc = 0, cntHu = 0;
    meridianNames.forEach(m => {
        const s = mStats[m.id];
        if (!s) return;
        const thuc = s.leftStatus === '+' || s.rightStatus === '+';
        const hu   = s.leftStatus === '-' || s.rightStatus === '-';
        if (thuc) { cntThuc++; if (m.group === 'tren') cntDuong++; else cntAm++; }
        if (hu)   cntHu++;
    });
    const cntBieu  = cats.bieuNhiet.length + cats.bieuHan.length;
    const cntLy    = cats.lyNhiet.length   + cats.lyHan.length;
    const cntNhiet = cats.lyNhiet.length   + cats.bieuNhiet.length;
    const cntHan   = cats.lyHan.length     + cats.bieuHan.length;

    const label = (name, subText, color, type, isActive) => {
        const bg     = isActive ? color + '12' : '#F5F0E8';
        const txtCol = isActive ? color : '#A09580';
        const brd    = isActive ? color : '#D4C5A0';
        const fw     = isActive ? 'bold' : 'normal';
        const subHtml = subText
            ? `<div style="font-size:0.52rem;color:${isActive ? color : '#C4B598'};margin-top:1px;">${subText}</div>`
            : `<div style="font-size:0.52rem;color:#D4C5A0;margin-top:1px;">—</div>`;
        return `<div
            class="bat-cuong-badge"
            data-badge-type="${type}"
            style="text-align:center;padding:6px 2px;background:${bg};
                   border:1px solid ${brd};border-radius:4px;
                   cursor:pointer;transition:all 0.15s;user-select:none;
                   font-family:'Times New Roman',serif;"
            onclick="toggleBatCuongBadge('${type}', this, '${color}')">
            <div style="font-size:0.8rem;font-weight:${fw};color:${txtCol};line-height:1.2;">${name}</div>
            ${subHtml}
        </div>`;
    };

    // Hàng nhóm kinh — hover để highlight bảng
    const catRow = (name, ids, bgColor, textColor) => {
        if (!ids.length) return '';
        const idsJson = JSON.stringify(ids);
        return `<div
            style="display:flex;align-items:baseline;gap:6px;padding:5px 8px;border-radius:5px;
                   cursor:default;transition:background 0.15s;margin-bottom:3px;"
            onmouseenter="this.style.background='${bgColor}22';highlightMeridianRows(${idsJson}, '${bgColor}')"
            onmouseleave="this.style.background='';clearMeridianHighlight()">
            <span style="font-size:0.76rem;font-weight:bold;color:${textColor};white-space:nowrap;
                         padding:1px 6px;background:${textColor}18;border-radius:3px;">${name}</span>
            <span style="font-size:0.78rem;color:#444;line-height:1.5;">${ids.map(id => {
                const m = meridianNames.find(x => x.id === id); return m ? m.n : id;
            }).join(', ')}</span>
        </div>`;
    };

    box.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px 6px;margin-bottom:10px;">
            <div style="font-size:0.48rem;color:#A09580;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Âm · Dương</div>
            <div style="font-size:0.48rem;color:#A09580;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Biểu · Lý</div>
            <div style="font-size:0.48rem;color:#A09580;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Hàn · Nhiệt</div>
            <div style="font-size:0.48rem;color:#A09580;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Hư · Thực</div>

            ${label('ÂM',    'Avg: ' + diag.baselines.avg_duoi.toFixed(2), '#2C4A6E', 'am',    bt.amDuong === 'ÂM THỊNH')}
            ${label('BIỂU',  cntBieu > 0 ? cntBieu + ' kinh' : null, '#A0632C', 'bieu',  bt.bieuLy  === 'BIỂU')}
            ${label('HÀN',   cntHan > 0  ? cntHan  + ' kinh' : null, '#1A5276', 'han',   bt.hanNhiet === 'HÀN')}
            ${label('HƯ',    cntHu > 0   ? cntHu   + ' kinh' : null, '#2D5A27', 'hu',    bt.huThuc  === 'HƯ')}

            ${label('DƯƠNG', 'Avg: ' + diag.baselines.avg_tren.toFixed(2), '#8B1A1A', 'duong', bt.amDuong === 'DƯƠNG THỊNH')}
            ${label('LÝ',    cntLy > 0    ? cntLy    + ' kinh' : null, '#7A1B3D', 'ly',    bt.bieuLy  === 'LÝ')}
            ${label('NHIỆT', cntNhiet > 0 ? cntNhiet + ' kinh' : null, '#A62B2B', 'nhiet', bt.hanNhiet === 'NHIỆT')}
            ${label('THỰC',  cntThuc > 0  ? cntThuc  + ' kinh' : null, '#8B4513', 'thuc',  bt.huThuc  === 'THỰC')}
        </div>

        <div style="padding:8px 10px;background:#FBF8F1;border-radius:4px;border:1px solid #D4C5A0;margin-bottom:10px;text-align:center;font-family:'Times New Roman',serif;">
            <span style="font-size:0.65rem;color:#A09580;margin-right:4px;">Kết luận:</span>
            <span style="font-weight:bold;font-size:0.85rem;color:${bt.amDuong==='DƯƠNG THỊNH'?'#8B1A1A':'#2C4A6E'};">${bt.amDuong}</span>
            <span style="color:#D4C5A0;margin:0 5px;">•</span>
            <span style="font-weight:bold;font-size:0.85rem;color:${bt.bieuLy==='LÝ'?'#7A1B3D':'#A0632C'};">${bt.bieuLy}</span>
            <span style="color:#D4C5A0;margin:0 5px;">•</span>
            <span style="font-weight:bold;font-size:0.85rem;color:${bt.hanNhiet==='NHIỆT'?'#A62B2B':'#1A5276'};">${bt.hanNhiet}</span>
            <span style="color:#D4C5A0;margin:0 5px;">•</span>
            <span style="font-weight:bold;font-size:0.85rem;color:${bt.huThuc==='THỰC'?'#8B4513':'#2D5A27'};">${bt.huThuc}</span>
        </div>
        <div style="padding:6px 10px;background:#F5F0E8;border-radius:4px;border:1px solid #D4C5A0;margin-bottom:10px;text-align:center;font-family:'Times New Roman',serif;">
            <span style="font-size:0.65rem;color:#A09580;margin-right:4px;">KHÍ / HUYẾT:</span>
            <span style="font-weight:bold;font-size:0.82rem;color:#5B4A3A;">${diag.khihuyetConclusion || '—'}</span>
        </div>

        <div style="margin-bottom:10px;">
            ${catRow('Lý Nhiệt',   getIds(cats.lyNhiet),   '#A62B2B', '#8B1A1A')}
            ${catRow('Biểu Nhiệt', getIds(cats.bieuNhiet), '#A0632C', '#7A4A1A')}
            ${catRow('Lý Hàn',     getIds(cats.lyHan),     '#1A5276', '#1A3A5C')}
            ${catRow('Biểu Hàn',   getIds(cats.bieuHan),   '#2C4A6E', '#1A3A5C')}
            ${!cats.lyNhiet.length && !cats.bieuNhiet.length && !cats.lyHan.length && !cats.bieuHan.length
                ? '<div style="color:#A09580;font-size:0.82rem;padding:4px;font-style:italic;">Không phát hiện bất thường đáng kể.</div>' : ''}
        </div>

        <div id="conclusion-detail" style="font-size:0.76rem;color:#5B4A3A;line-height:1.7;border-top:1px solid #D4C5A0;padding-top:8px;font-family:'Times New Roman',serif;">
            <span class="conc-part" data-conc-for="duong am" style="font-weight:bold;color:${bt.amDuong==='DƯƠNG THỊNH'?'#8B1A1A':'#2C4A6E'};transition:opacity 0.2s;">[${bt.amDuong}]</span>
            <span class="conc-sep" style="color:#D4C5A0;transition:opacity 0.2s;"> — </span>
            <span class="conc-part" data-conc-for="bieu ly" style="font-weight:bold;color:${bt.bieuLy==='LÝ'?'#7A1B3D':'#A0632C'};transition:opacity 0.2s;">[${bt.bieuLy}]</span>
            <span class="conc-sep" style="color:#D4C5A0;transition:opacity 0.2s;"> — </span>
            <span class="conc-part" data-conc-for="han nhiet" style="font-weight:bold;color:${bt.hanNhiet==='NHIỆT'?'#A62B2B':'#1A5276'};transition:opacity 0.2s;">[${bt.hanNhiet}]</span>
            <span class="conc-sep" style="color:#D4C5A0;transition:opacity 0.2s;"> — </span>
            <span class="conc-part" data-conc-for="hu thuc" style="font-weight:bold;color:${bt.huThuc==='THỰC'?'#8B4513':'#2D5A27'};transition:opacity 0.2s;">[${bt.huThuc}]</span>
            <br>
            <span class="conc-part" data-conc-for="hu thuc" style="display:none;transition:opacity 0.2s;">Ghi nhận ${cntThuc} kinh Thực (+), ${cntHu} kinh Hư (-).</span>
            ${diag.baselines.avg_tren > diag.baselines.avg_duoi + 1
                ? '<span class="conc-part" data-conc-for="duong am" style="display:none;transition:opacity 0.2s;"> Thượng nhiệt Hạ hàn.</span>'
                : (diag.baselines.avg_duoi > diag.baselines.avg_tren + 1
                    ? '<span class="conc-part" data-conc-for="duong am" style="display:none;transition:opacity 0.2s;"> Thượng hàn Hạ nhiệt.</span>'
                    : '')}
            ${cats.lyNhiet.length > 0   ? '<span class="conc-part" data-conc-for="ly nhiet thuc" style="display:none;transition:opacity 0.2s;"> Lý Nhiệt: ' + cats.lyNhiet.join(', ') + '.</span>' : ''}
            ${cats.lyHan.length > 0     ? '<span class="conc-part" data-conc-for="ly han hu" style="display:none;transition:opacity 0.2s;"> Lý Hàn: ' + cats.lyHan.join(', ') + '.</span>' : ''}
            ${cats.bieuNhiet.length > 0 ? '<span class="conc-part" data-conc-for="bieu nhiet thuc" style="display:none;transition:opacity 0.2s;"> Biểu Nhiệt: ' + cats.bieuNhiet.join(', ') + '.</span>' : ''}
            ${cats.bieuHan.length > 0   ? '<span class="conc-part" data-conc-for="bieu han hu" style="display:none;transition:opacity 0.2s;"> Biểu Hàn: ' + cats.bieuHan.join(', ') + '.</span>' : ''}
            <div id="conc-compare-han-nhiet" style="display:none;margin-top:6px;padding:6px 8px;border-radius:4px;background:#FBF8F1;border:1px dashed #D4C5A0;font-size:0.7rem;">
                <div>Hàn / Nhiệt: <strong>${cntNhiet}</strong> kinh nằm vùng <span style="color:#A62B2B;font-weight:bold;">Nhiệt (1/3 trên)</span>,
                <strong>${cntHan}</strong> kinh nằm vùng <span style="color:#1A5276;font-weight:bold;">Hàn (1/3 dưới)</span>.</div>
                <div>⇒ ${cntNhiet} ${cntNhiet >= cntHan ? '≥' : '<'} ${cntHan} → Kết luận: <strong>${bt.hanNhiet}</strong>.</div>
            </div>
        </div>
        <div style="margin-top:6px;font-size:0.65rem;color:#C4B598;font-style:italic;">
            ⊙ Ấn vào từng mục để xem kinh mạch tương ứng trong bảng
        </div>
    `;
}

// ---- Trạng thái badge bát cương đang active ----
let _activeBadgeType = null;
let _activeBadgeEl   = null;
let _activeBadgeCol  = null;
let _currentBatCuongTong = null;
let _currentBaselines    = null;

// Toggle highlight khi ấn vào label Bát Cương
function toggleBatCuongBadge(type, el, color) {
    const wasActive = _activeBadgeType === type;

    // Reset tất cả badge về trạng thái mặc định
    document.querySelectorAll('.bat-cuong-badge').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.boxShadow   = '';
    });
    _clearAllRowHighlights();

    if (wasActive) {
        _activeBadgeType = null;
        _activeBadgeEl   = null;
        _activeBadgeCol  = null;
        _toggleBcCol(false);
        _updateConclusionDisplay(null);
        return;
    }

    _activeBadgeType = type;
    _activeBadgeEl   = el;
    _activeBadgeCol  = color;

    el.style.borderColor = color;
    el.style.boxShadow   = `0 0 12px ${color}55`;

    const isAmDuong = (type === 'duong' || type === 'am');
    _toggleBcCol(!isAmDuong);
    _applyBadgeHighlight(type);
    _updateConclusionDisplay(type);
}

// Hiện / ẩn cột Bát Cương trong bảng
function _toggleBcCol(show) {
    document.querySelectorAll('.bc-col').forEach(el => {
        el.style.display = show ? '' : 'none';
    });
}

function _getBcColor(tr) {
    const bc = tr.getAttribute('data-bat-cuong') || '';
    if (bc === 'Lý Nhiệt')   return '#8B1A1A';
    if (bc === 'Biểu Nhiệt') return '#C0652A';
    if (bc === 'Lý Hàn')     return '#1A3A5C';
    if (bc === 'Biểu Hàn')   return '#2C8A9A';
    return '#8B7355';
}

function _applyBadgeHighlight(type) {
    const rows = document.querySelectorAll('[data-meridian-id]');
    const highlighted = new Set();

    const matchAttr  = (tr, attr, val) => tr.getAttribute(attr) === val;
    const matchBcKw  = (tr, kw) => (tr.getAttribute('data-bat-cuong') || '').includes(kw);

    _clearBaselineHighlight();

    const isAmDuong = (type === 'duong' || type === 'am');

    rows.forEach(tr => {
        let match = false;
        switch (type) {
            case 'duong': match = matchAttr(tr, 'data-group', 'tren'); break;
            case 'am':    match = matchAttr(tr, 'data-group', 'duoi'); break;
            case 'bieu':  match = matchBcKw(tr, 'Biểu');  break;
            case 'ly':    match = matchBcKw(tr, 'Lý');    break;
            case 'han':   match = matchBcKw(tr, 'Hàn');   break;
            case 'nhiet': match = matchBcKw(tr, 'Nhiệt'); break;
            case 'hu':    match = matchAttr(tr, 'data-is-hu',   '1'); break;
            case 'thuc':  match = matchAttr(tr, 'data-is-thuc', '1'); break;
        }
        if (match) {
            highlighted.add(tr);
            if (isAmDuong) {
                const bc = tr.getAttribute('data-bat-cuong') || '';
                if (bc) {
                    _setRowHighlight(tr, _getBcColor(tr));
                } else {
                    tr.style.background = '#F5F0E8';
                    tr.style.boxShadow  = 'inset 4px 0 0 0 #C4B598';
                    tr.style.opacity    = '1';
                }
            } else {
                _setRowHighlight(tr, _getBcColor(tr));
            }
        }
    });

    rows.forEach(tr => {
        if (!highlighted.has(tr)) _setRowDimmed(tr);
    });

    if (isAmDuong || type === 'thuc' || type === 'hu' || type === 'nhiet' || type === 'han' || type === 'bieu' || type === 'ly') {
        _highlightBaselineBoxes(type);
    }
}

function _highlightBaselineBoxes(type) {
    const boxTren = document.getElementById('baseline-box-tren');
    const boxDuoi = document.getElementById('baseline-box-duoi');
    if (!boxTren || !boxDuoi) return;
    const boxes = [boxTren, boxDuoi];

    const comp = document.getElementById('baseline-comparison');

    if (type === 'duong' || type === 'am') {
        const color = type === 'duong' ? '#8B1A1A' : '#2C4A6E';

        // Khi xét Âm / Dương: thang chia 3 phần mang ý nghĩa DƯƠNG / Bình thường / ÂM
        boxes.forEach(box => {
            const lNhiet = box.querySelector('.zone-label-nhiet');
            const lBinh  = box.querySelector('.zone-label-binh');
            const lHan   = box.querySelector('.zone-label-han');
            if (lNhiet) lNhiet.textContent = 'DƯƠNG';
            if (lBinh)  lBinh.innerHTML    = 'Bình thường<br>(sinh lý)';
            if (lHan)   lHan.textContent   = 'ÂM';
        });

        boxes.forEach(box => {
            box.style.opacity      = '1';
            box.style.boxShadow    = `0 0 0 2px ${color}44, 0 2px 6px ${color}22`;
            box.style.borderRadius = '6px';

            const avg = box.querySelector('.baseline-avg');
            if (avg) {
                avg.style.background   = color + '20';
                avg.style.boxShadow    = `0 0 0 2px ${color}`;
                avg.style.color        = color;
                avg.style.fontSize     = '0.82rem';
                avg.style.borderRadius = '3px';
                avg.style.padding      = '1px 4px';
            }
            box.querySelectorAll('.baseline-other').forEach(el => { el.style.opacity = '0.3'; });
            const upEl = box.querySelector('.baseline-up');
            const lowEl = box.querySelector('.baseline-low');
            if (upEl)  upEl.style.opacity  = '0.3';
            if (lowEl) lowEl.style.opacity = '0.3';
            box.querySelectorAll('.zone-nhiet,.zone-han').forEach(el => { el.style.opacity = '0.25'; });
            box.querySelectorAll('.zone-label-nhiet,.zone-label-han').forEach(el => { el.style.opacity = '0.25'; });
            const midLabel = box.querySelector('.zone-label-binh');
            if (midLabel) midLabel.style.opacity = '0.4';
        });

        if (comp) {
            comp.style.display = 'block';
            comp.style.borderColor = color;
            const compTren = document.getElementById('comp-avg-tren');
            const compDuoi = document.getElementById('comp-avg-duoi');
            if (compTren) compTren.style.color = type === 'duong' ? color : '#5B4A3A';
            if (compDuoi) compDuoi.style.color = type === 'am'    ? color : '#5B4A3A';
        }

    } else if (type === 'nhiet' || type === 'han') {
        const isNhiet = type === 'nhiet';
        const color   = isNhiet ? '#A62B2B' : '#1A5276';
        const zoneSel = isNhiet ? '.zone-nhiet' : '.zone-han';
        const lblSel  = isNhiet ? '.zone-label-nhiet' : '.zone-label-han';
        const dimZone = isNhiet ? '.zone-han' : '.zone-nhiet';
        const dimLbl  = isNhiet ? '.zone-label-han' : '.zone-label-nhiet';

        boxes.forEach(box => {
            box.style.opacity      = '1';
            box.style.boxShadow    = `0 0 0 2px ${color}55, 0 2px 8px ${color}22`;
            box.style.borderRadius = '6px';

            const avgEl = box.querySelector('.baseline-avg');
            if (avgEl) avgEl.style.opacity = '0.45';
            box.querySelectorAll('.baseline-other,.baseline-up,.baseline-low').forEach(el => { el.style.opacity = '0.4'; });

            const z = box.querySelector(zoneSel);
            if (z) {
                z.style.opacity  = '1';
                z.style.boxShadow = `inset 0 0 0 2px ${color}`;
            }
            const dz = box.querySelector(dimZone);
            if (dz) dz.style.opacity = '0.25';
            const midZ = box.querySelector('.zone-binh');
            if (midZ) midZ.style.opacity = '0.5';

            const lbl = box.querySelector(lblSel);
            if (lbl) {
                lbl.style.opacity  = '1';
                lbl.style.fontSize = '0.7rem';
            }
            const dl = box.querySelector(dimLbl);
            if (dl) dl.style.opacity = '0.35';
            const ml = box.querySelector('.zone-label-binh');
            if (ml) ml.style.opacity = '0.5';
        });

        const compHN = document.getElementById('baseline-compare-han-nhiet');
        if (compHN) {
            compHN.style.display = 'block';
            compHN.style.borderColor = color;
        }

    } else if (type === 'thuc' || type === 'hu') {
        const isThuc = type === 'thuc';
        const color  = isThuc ? '#8B4513' : '#2D5A27';
        const zoneSel = isThuc ? '.zone-nhiet' : '.zone-han';
        const dimZone = isThuc ? '.zone-han' : '.zone-nhiet';

        // Khi xét Hư / Thực: thang chia 3 phần mang ý nghĩa THỰC / Bình thường / HƯ
        boxes.forEach(box => {
            box.style.opacity      = '1';
            box.style.boxShadow    = `0 0 0 2px ${color}55, 0 2px 8px ${color}22`;
            box.style.borderRadius = '6px';

            const lNhiet = box.querySelector('.zone-label-nhiet');
            const lBinh  = box.querySelector('.zone-label-binh');
            const lHan   = box.querySelector('.zone-label-han');
            const thucCount = box.getAttribute('data-thuc') || '0';
            const huCount   = box.getAttribute('data-hu')   || '0';
            if (lNhiet) lNhiet.textContent = `THỰC (${thucCount})`;
            if (lBinh)  lBinh.innerHTML    = 'Bình thường<br>(sinh lý)';
            if (lHan)   lHan.textContent   = `HƯ (${huCount})`;

            const avgEl = box.querySelector('.baseline-avg');
            if (avgEl) avgEl.style.opacity = '0.5';
            box.querySelectorAll('.baseline-other,.baseline-up,.baseline-low').forEach(el => { el.style.opacity = '0.4'; });

            const z = box.querySelector(zoneSel);
            if (z) {
                z.style.opacity   = '1';
                z.style.boxShadow = `inset 0 0 0 1.5px ${color}`;
            }
            const dz = box.querySelector(dimZone);
            if (dz) dz.style.opacity = '0.25';
            const midZ = box.querySelector('.zone-binh');
            if (midZ) midZ.style.opacity = '0.45';
        });

        const compHT = document.getElementById('baseline-compare-hu-thuc');
        if (compHT) {
            compHT.style.display = 'block';
            compHT.style.borderColor = color;
        }
    } else if (type === 'bieu' || type === 'ly') {
        const color = type === 'bieu' ? '#A0632C' : '#7A1B3D';

        boxes.forEach(box => {
            box.style.opacity      = '1';
            box.style.boxShadow    = `0 0 0 2px ${color}44, 0 2px 6px ${color}22`;
            box.style.borderRadius = '6px';

            const barCol = box.querySelector('.zone-bar-col');
            const zNhiet = box.querySelector('.zone-nhiet');
            const zBinh  = box.querySelector('.zone-binh');
            const zHan   = box.querySelector('.zone-han');

            if (type === 'bieu') {
                // BIỂU: nổi bật vùng GIỮA (Bình thường) — vì Biểu là 1 bên vẫn còn ở vùng này
                if (zNhiet) zNhiet.style.opacity = '0.25';
                if (zHan)   zHan.style.opacity   = '0.25';
                if (zBinh) {
                    zBinh.style.opacity   = '1';
                    zBinh.style.boxShadow = `inset 0 0 0 2px ${color}`;
                    zBinh.style.background = `#F5EDD8`;
                }
                if (barCol) barCol.style.border = `2px solid ${color}88`;

                // Nhãn
                const lNhiet = box.querySelector('.zone-label-nhiet');
                const lBinh  = box.querySelector('.zone-label-binh');
                const lHan   = box.querySelector('.zone-label-han');
                const nB = box.getAttribute('data-bieu') || '0';
                if (lNhiet) { lNhiet.style.opacity = '0.3'; }
                if (lHan)   { lHan.style.opacity   = '0.3'; }
                if (lBinh)  {
                    lBinh.style.opacity   = '1';
                    lBinh.style.color     = color;
                    lBinh.style.fontWeight = 'bold';
                    lBinh.innerHTML = `BIỂU (${nB})<br><span style="font-size:0.5rem;color:#A09580;font-weight:normal;">1 bên lệch</span>`;
                }
            } else {
                // LÝ: nổi bật hai vùng NGOÀI (NHIỆT + HÀN) — vì Lý là cả 2 bên cùng ngoài vùng sinh lý
                if (zBinh) {
                    zBinh.style.opacity   = '0.25';
                    zBinh.style.boxShadow = '';
                }
                if (zNhiet) {
                    zNhiet.style.opacity   = '1';
                    zNhiet.style.boxShadow = `inset 0 0 0 2px ${color}`;
                }
                if (zHan) {
                    zHan.style.opacity   = '1';
                    zHan.style.boxShadow = `inset 0 0 0 2px ${color}`;
                }
                if (barCol) barCol.style.border = `2px solid ${color}88`;

                // Nhãn
                const lNhiet = box.querySelector('.zone-label-nhiet');
                const lBinh  = box.querySelector('.zone-label-binh');
                const lHan   = box.querySelector('.zone-label-han');
                const nL = box.getAttribute('data-ly') || '0';
                if (lBinh)  { lBinh.style.opacity = '0.3'; }
                if (lNhiet) {
                    lNhiet.style.opacity   = '1';
                    lNhiet.style.color     = color;
                }
                if (lHan) {
                    lHan.style.opacity   = '1';
                    lHan.style.color     = color;
                }
                // Hiển thị số Lý ở nhãn giữa
                if (lBinh) {
                    lBinh.style.opacity = '0.3';
                }
                if (lNhiet) lNhiet.innerHTML = `LÝ NHIỆT<br><span style="font-size:0.5rem;color:#A09580;font-weight:normal;">cả 2 bên &gt; Trên</span>`;
                if (lHan)   lHan.innerHTML   = `LÝ HÀN<br><span style="font-size:0.5rem;color:#A09580;font-weight:normal;">cả 2 bên &lt; Dưới</span>`;
            }

            // Mờ nhẹ các số
            box.querySelectorAll('.baseline-avg,.baseline-other,.baseline-up,.baseline-low').forEach(el => {
                el.style.opacity = '0.45';
            });
        });
    }
}

// ---- Thêm bệnh nhân mới ----
function openNewPatientForm() {
    const modal = document.getElementById('new-patient-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    ['new-pt-name','new-pt-phone','new-pt-address-detail','new-pt-notes','new-pt-idcard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const g = document.getElementById('new-pt-gender');
    if (g) g.value = '';
    const prov = document.getElementById('new-pt-province');
    const ward = document.getElementById('new-pt-ward');
    if (prov) {
        prov.innerHTML = '<option value=\"\">-- Chọn Tỉnh / TP --</option>';
        provinceList.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.tinhthanhId;
            opt.textContent = p.tentinh;
            prov.appendChild(opt);
        });
        prov.value = '';
    }
    if (ward) {
        ward.innerHTML = '<option value=\"\">-- Chọn Xã / Phường --</option>';
    }
    const daySel = document.getElementById('new-pt-birth-day');
    const monthSel = document.getElementById('new-pt-birth-month');
    const yearSel = document.getElementById('new-pt-birth-year');
    if (daySel) {
        daySel.innerHTML = '<option value=\"\">Ngày</option>';
        for (let d = 1; d <= 31; d++) {
            const opt = document.createElement('option');
            opt.value = String(d).padStart(2,'0');
            opt.textContent = String(d);
            daySel.appendChild(opt);
        }
    }
    if (monthSel) {
        monthSel.innerHTML = '<option value=\"\">Tháng</option>';
        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = String(m).padStart(2,'0');
            opt.textContent = String(m);
            monthSel.appendChild(opt);
        }
    }
    if (yearSel) {
        yearSel.innerHTML = '<option value=\"\">Năm</option>';
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y >= 1900; y--) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            yearSel.appendChild(opt);
        }
    }
    const codeEl = document.getElementById('new-pt-code');
    if (codeEl) {
        const maxId = patientData.reduce((m, p) => Math.max(m, p.benhnhanId || 0), 0);
        const nextId = maxId + 1;
        codeEl.textContent = '#' + nextId;
    }
    const err = document.getElementById('new-pt-error');
    if (err) err.innerText = '';
}

function closeNewPatientForm() {
    const modal = document.getElementById('new-patient-modal');
    if (modal) modal.style.display = 'none';
    _editingPatientId = null;
    const h = document.getElementById('new-patient-modal-title');
    if (h) h.textContent = 'Thêm bệnh nhân mới';
}

function openEditPatientForm() {
    if (!_selectedPatientIdForNewRecord) return;
    const p = patientData.find(x => x.benhnhanId == _selectedPatientIdForNewRecord);
    if (!p) return;
    openNewPatientForm(); // điền form mặc định trước
    _editingPatientId = _selectedPatientIdForNewRecord;
    // Thay tiêu đề modal
    const h = document.getElementById('new-patient-modal-title');
    if (h) h.textContent = 'Sửa thông tin bệnh nhân';
    // Điền dữ liệu hiện có
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('new-pt-name', p.hoten);
    set('new-pt-phone', p.dienthoai);
    set('new-pt-idcard', p.cmnd);
    // Địa chỉ chi tiết: tạm thời đưa toàn bộ vào ô text, người dùng có thể chỉnh lại
    set('new-pt-address-detail', p.diachi);
    set('new-pt-notes', p.ghichu);
    // Giới tính
    const g = document.getElementById('new-pt-gender');
    if (g) g.value = p.gioitinh || '';
    // Ngày / tháng / năm sinh
    if (p.ngaysinh) {
        const m = /\/Date\((\-?\d+)\)\//.exec(p.ngaysinh);
        if (m) {
            const dt = new Date(parseInt(m[1], 10));
            const d = String(dt.getDate()).padStart(2,'0');
            const mo = String(dt.getMonth()+1).padStart(2,'0');
            const y = dt.getFullYear();
            const dEl = document.getElementById('new-pt-birth-day');
            const mEl = document.getElementById('new-pt-birth-month');
            const yEl = document.getElementById('new-pt-birth-year');
            if (dEl) dEl.value = d;
            if (mEl) mEl.value = mo;
            if (yEl) yEl.value = String(y);
        }
    }
    // Province
    if (p.tinhthanhId) {
        const prov = document.getElementById('new-pt-province');
        if (prov) prov.value = String(p.tinhthanhId);
    }
    // Cập nhật nút lưu
    const saveBtn = document.getElementById('new-pt-save-btn');
    if (saveBtn) saveBtn.textContent = 'Cập nhật';
}

async function saveNewPatient() {
    const nameEl = document.getElementById('new-pt-name');
    const birthDayEl = document.getElementById('new-pt-birth-day');
    const birthMonthEl = document.getElementById('new-pt-birth-month');
    const birthYearEl = document.getElementById('new-pt-birth-year');
    const genderEl = document.getElementById('new-pt-gender');
    const phoneEl = document.getElementById('new-pt-phone');
    const idcardEl = document.getElementById('new-pt-idcard');
    const addrDetailEl = document.getElementById('new-pt-address-detail');
    const provEl = document.getElementById('new-pt-province');
    const notesEl = document.getElementById('new-pt-notes');
    const err = document.getElementById('new-pt-error');
    if (!nameEl || !err) return;

    const hoten = nameEl.value.trim();
    if (!hoten) {
        err.innerText = 'Vui lòng nhập Họ và tên.';
        return;
    }

    const xaSelect = document.getElementById('new-pt-ward');
    const xaLabel = xaSelect && xaSelect.value ? xaSelect.options[xaSelect.selectedIndex]?.text || '' : '';
    const detailText = (addrDetailEl && addrDetailEl.value.trim()) || '';
    let diachi = detailText;
    let tinhthanhId = null;
    if (provEl && provEl.value) {
        const tid = parseInt(provEl.value, 10);
        if (!isNaN(tid)) tinhthanhId = tid;
        const provName = provEl.options[provEl.selectedIndex]?.text || '';
        const parts = [];
        if (detailText) parts.push(detailText);
        if (xaLabel) parts.push(xaLabel);
        if (provName) parts.push(provName);
        diachi = parts.join(', ');
    }

    // Ngày sinh dạng yyyy-MM-dd nếu đủ 3 phần
    let ngaysinhStr = '';
    const dVal = birthDayEl && birthDayEl.value;
    const mVal = birthMonthEl && birthMonthEl.value;
    const yVal = birthYearEl && birthYearEl.value;
    if (dVal && mVal && yVal) {
        ngaysinhStr = `${yVal}-${mVal}-${dVal}`;
    }

    const payload = {
        hoten,
        ngaysinh: ngaysinhStr,
        gioitinh: (genderEl && genderEl.value) || '',
        dienthoai: (phoneEl && phoneEl.value.trim()) || '',
        cmnd: (idcardEl && idcardEl.value.trim()) || '',
        diachi,
        tinhthanhId,
        ghichu: (notesEl && notesEl.value.trim()) || ''
    };

    try {
        err.innerText = 'Đang lưu...';
        const isEditing = _editingPatientId != null;
        if (isEditing) payload.benhnhanId = _editingPatientId;
        const data = isEditing
            ? await apiUpdatePatient(payload)
            : await apiAddPatient(payload);
        if (!data.success) {
            err.innerText = (isEditing ? 'Lỗi cập nhật: ' : 'Lỗi lưu bệnh nhân: ') + (data.error || 'không rõ');
            return;
        }

        const birthStr = payload.ngaysinh;
        let dobTicks = null;
        if (birthStr) {
            const y = parseInt(birthStr, 10);
            if (!isNaN(y)) {
                const d = new Date(y, 0, 1);
                dobTicks = `/Date(${d.getTime()})/`;
            }
        }

        if (isEditing) {
            const editedId = _editingPatientId;
            // Cập nhật local data
            const idx = patientData.findIndex(x => x.benhnhanId == editedId);
            if (idx >= 0) {
                patientData[idx] = { ...patientData[idx], hoten: payload.hoten, gioitinh: payload.gioitinh, ngaysinh: dobTicks, dienthoai: payload.dienthoai, cmnd: payload.cmnd, diachi: payload.diachi, tinhthanhId: payload.tinhthanhId, ghichu: payload.ghichu };
            }
            renderFullPatients(patientData);
            renderRecentPatients();
            closeNewPatientForm();
            viewPatient(editedId);
        } else {
            const newId = data.id;
            const newPt = {
                benhsu: null, hoten: payload.hoten, giosinh: null,
                cmnd: payload.cmnd || null, diachi: payload.diachi || null,
                tinhthanhId: payload.tinhthanhId || null, ngaysinh: dobTicks,
                dienthoai: payload.dienthoai || null, benhnhanId: newId,
                gioitinh: payload.gioitinh || null, ghichu: payload.ghichu || null
            };
            patientData.push(newPt);
            renderFullPatients(patientData);
            renderRecentPatients();
            updateDashboardStats();
            _selectedPatientIdForNewRecord = newId;
            closeNewPatientForm();
            showSection('new-record');
        }
    } catch (e) {
        if (err) err.innerText = 'Lỗi kết nối server: ' + e.message;
    }
}

async function saveNewRecord() {
    const err = document.getElementById('new-rec-error');
    const envEl = document.getElementById('input-env-temp');
    if (!envEl || _selectedPatientIdForNewRecord == null) {
        if (err) err.innerText = 'Không xác định được bệnh nhân. Hãy vào “Hồ sơ” bệnh nhân và bấm “Khám mới”.';
        return;
    }
    const _toDotNumber = (v) => {
        if (v == null) return NaN;
        const s = String(v).trim().replace(',', '.');
        return Number.parseFloat(s);
    };
    const env = _toDotNumber(envEl.value);
    if (isNaN(env)) {
        if (err) err.innerText = 'Vui lòng nhập nhiệt độ môi trường (hoặc chờ hệ thống tự lấy theo vị trí).';
        return;
    }

    const payload = { benhnhanId: _selectedPatientIdForNewRecord, nhietdoMoitruong: env };
    let sumAbs = 0;
    newRecordMeridians.forEach(m => {
        const lVal = _toDotNumber(document.getElementById(`in-${m.id}-L`)?.value);
        const rVal = _toDotNumber(document.getElementById(`in-${m.id}-R`)?.value);
        const l = isNaN(lVal) ? 0 : lVal;
        const r = isNaN(rVal) ? 0 : rVal;
        payload[m.id + 'Trai'] = l;
        payload[m.id + 'Phai'] = r;
        sumAbs += Math.abs(l) + Math.abs(r);
    });

    if (!sumAbs) {
        if (err) err.innerText = 'Vui lòng nhập nhiệt độ cho ít nhất 1 kinh mạch trước khi lưu.';
        return;
    }

    try {
        if (err) err.innerText = 'Đang lưu phiếu khám...';
        if (_editingRecordId != null) {
            payload.phieukhamId = _editingRecordId;
        }
        const data = await apiSaveRecord(payload, _editingRecordId != null);
        if (!data.success) {
            if (err) err.innerText = 'Lỗi lưu phiếu khám: ' + (data.error || 'không rõ');
            return;
        }

        const newRecId = data.phieukhamId || (_editingRecordId || null);

        // Tạo bản ghi mới ngay trên frontend để xem phân tích tức thì, không phụ thuộc JSON
        const now = new Date();
        const recObj = {
            phieukhamId: newRecId,
            benhnhanId: _selectedPatientIdForNewRecord,
            ngaykham: `/Date(${now.getTime()})/`,
            giokham: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
            nhietdoMoitruong: env
        };
        newRecordMeridians.forEach(m => {
            recObj[m.id + 'Trai'] = payload[m.id + 'Trai'];
            recObj[m.id + 'Phai'] = payload[m.id + 'Phai'];
        });
        // Cập nhật local recordData và UI lịch sử
        if (newRecId != null) {
            const idx = recordData.findIndex(r => r.phieukhamId == newRecId);
            if (idx >= 0) {
                recordData[idx] = recObj;
            } else {
                recordData.push(recObj);
            }
        }
        renderHistory(_selectedPatientIdForNewRecord);
        updateDashboardStats();

        // Mở luôn màn phân tích cho phiếu vừa lưu
        activeAnalysisRecord = recObj;
        _editingRecordId = null;
        _showSectionInternal('analysis');
        _updateBreadcrumb('analysis');
        renderBodyChart(recObj);
    } catch (e) {
        if (err) err.innerText = 'Lỗi kết nối server: ' + e.message;
    }
}

function _clearBaselineHighlight() {
    ['baseline-box-tren', 'baseline-box-duoi'].forEach(id => {
        const box = document.getElementById(id);
        if (!box) return;
        box.style.opacity      = '';
        box.style.boxShadow    = '';
        box.style.borderRadius = '';

        const avg = box.querySelector('.baseline-avg');
        if (avg) {
            avg.style.background   = '';
            avg.style.boxShadow    = '';
            avg.style.color        = '#5B3A1A';
            avg.style.fontSize     = '';
            avg.style.borderRadius = '';
            avg.style.padding      = '';
            avg.style.opacity      = '';
        }
        box.querySelectorAll('.baseline-other').forEach(el => { el.style.opacity = ''; });

        const upEl = box.querySelector('.baseline-up');
        if (upEl) {
            upEl.style.background   = '';
            upEl.style.color        = '#8B1A1A';
            upEl.style.fontSize     = '';
            upEl.style.borderRadius = '';
            upEl.style.boxShadow    = '';
            upEl.style.padding      = '';
            upEl.style.opacity      = '';
        }
        const lowEl = box.querySelector('.baseline-low');
        if (lowEl) {
            lowEl.style.background   = '';
            lowEl.style.color        = '#1A5276';
            lowEl.style.fontSize     = '';
            lowEl.style.borderRadius = '';
            lowEl.style.boxShadow    = '';
            lowEl.style.padding      = '';
            lowEl.style.opacity      = '';
        }

        box.querySelectorAll('.zone-nhiet,.zone-binh,.zone-han').forEach(el => {
            el.style.opacity    = '';
            el.style.boxShadow  = '';
            el.style.background = '';
        });
        const barCol = box.querySelector('.zone-bar-col');
        if (barCol) barCol.style.border = '1px solid #C4B598';

        box.querySelectorAll('.zone-label-nhiet,.zone-label-binh,.zone-label-han').forEach(el => {
            el.style.opacity    = '';
            el.style.fontSize   = '';
            el.style.color      = '';
            el.style.fontWeight = '';
        });
        const lNhiet = box.querySelector('.zone-label-nhiet');
        const lBinh  = box.querySelector('.zone-label-binh');
        const lHan   = box.querySelector('.zone-label-han');
        const nN = box.getAttribute('data-nhiet') || '0';
        const nH = box.getAttribute('data-han') || '0';
        if (lNhiet) lNhiet.textContent = 'NHIỆT (' + nN + ')';
        if (lBinh)  lBinh.innerHTML    = 'Bình thường<br>(sinh lý)';
        if (lHan)   lHan.textContent   = 'HÀN (' + nH + ')';
    });

    const comp = document.getElementById('baseline-comparison');
    if (comp) comp.style.display = 'none';
    const compHT = document.getElementById('baseline-compare-hu-thuc');
    if (compHT) compHT.style.display = 'none';
    const compHN = document.getElementById('baseline-compare-han-nhiet');
    if (compHN) compHN.style.display = 'none';
    const compBL = document.getElementById('baseline-compare-bieu-ly');
    if (compBL) compBL.style.display = 'none';
}

function _updateConclusionDisplay(type) {
    const box = document.getElementById('conclusion-detail');
    if (!box) return;

    const parts = box.querySelectorAll('.conc-part');
    const seps  = box.querySelectorAll('.conc-sep');
    const cmpHanNhiet = document.getElementById('conc-compare-han-nhiet');
    const baseHuThuc  = document.getElementById('baseline-hu-thuc-summary');

    if (!type) {
        parts.forEach(el => {
            const forAttr = el.getAttribute('data-conc-for') || '';
            const isSummary = !forAttr.includes('thuc') || forAttr.split(' ').length <= 2
                ? ['duong am','bieu ly','han nhiet','hu thuc'].includes(forAttr)
                : false;
            if (['duong am','bieu ly','han nhiet','hu thuc'].includes(forAttr)) {
                el.style.display = '';
                el.style.opacity = '1';
            } else {
                el.style.display = 'none';
            }
        });
        seps.forEach(el => { el.style.opacity = '1'; });
        if (cmpHanNhiet) cmpHanNhiet.style.display = 'none';
        if (baseHuThuc)  baseHuThuc.style.display  = 'none';
        return;
    }

    parts.forEach(el => {
        const forAttr = (el.getAttribute('data-conc-for') || '').split(' ');
        const isSummaryItem = ['duong am','bieu ly','han nhiet','hu thuc']
            .includes(el.getAttribute('data-conc-for'));

        if (forAttr.includes(type)) {
            el.style.display = '';
            el.style.opacity = '1';
            if (!isSummaryItem) {
                el.style.fontWeight  = 'bold';
                el.style.padding     = '2px 6px';
                el.style.borderRadius = '3px';
                el.style.background  = el.style.color
                    ? el.style.color.replace(')', ',0.08)').replace('rgb', 'rgba')
                    : '#5B4A3A12';
            }
        } else if (isSummaryItem) {
            el.style.display = '';
            el.style.opacity = '0.3';
        } else {
            el.style.display = 'none';
        }
    });
    seps.forEach(el => { el.style.opacity = '0.3'; });

    if (cmpHanNhiet) {
        cmpHanNhiet.style.display = (type === 'han' || type === 'nhiet') ? 'block' : 'none';
    }
    if (baseHuThuc) {
        baseHuThuc.style.display = (type === 'hu' || type === 'thuc') ? 'block' : 'none';
    }
}

function _setRowHighlight(tr, color) {
    tr.style.background = color + '18';
    tr.style.boxShadow  = `inset 4px 0 0 0 ${color}`;
    tr.style.opacity     = '1';
}

function _setRowDimmed(tr) {
    tr.style.background = '#ffffff';
    tr.style.boxShadow  = '';
    tr.style.opacity     = '0.3';
}

// Highlight các hàng bảng có data-meridian-id thuộc danh sách ids (dùng cho catRow hover)
function highlightMeridianRows(ids, color) {
    _clearAllRowHighlights();
    const c = color || '#ff9800';
    ids.forEach(id => {
        document.querySelectorAll(`[data-meridian-id="${id}"]`).forEach(tr => {
            _setRowHighlight(tr, c);
        });
    });
    // Làm mờ các dòng không nằm trong danh sách
    document.querySelectorAll('[data-meridian-id]').forEach(tr => {
        if (!ids.includes(tr.getAttribute('data-meridian-id'))) {
            _setRowDimmed(tr);
        }
    });
}

// Giữ tương thích — gọi từ catRow hover
function highlightByBatCuong(keywords, colors) {
    _clearAllRowHighlights();
    const rows = document.querySelectorAll('[data-meridian-id]');
    const highlighted = new Set();
    keywords.forEach((kw, i) => {
        const c = colors[i] || '#ff9800';
        rows.forEach(tr => {
            const bc = tr.getAttribute('data-bat-cuong') || '';
            if (bc.includes(kw)) {
                highlighted.add(tr);
                _setRowHighlight(tr, c);
            }
        });
    });
    rows.forEach(tr => {
        if (!highlighted.has(tr)) _setRowDimmed(tr);
    });
}

// Xóa highlight và dim — khôi phục trạng thái bình thường
function _clearAllRowHighlights() {
    document.querySelectorAll('[data-meridian-id]').forEach(tr => {
        tr.style.background = '';
        tr.style.boxShadow  = '';
        tr.style.outline    = '';
        tr.style.opacity    = '';
        tr.querySelectorAll('.cell-val-l,.cell-val-r,.cell-st-lp,.cell-st-lm,.cell-st-rp,.cell-st-rm,.cell-diff').forEach(td => {
            td.style.background  = '';
            td.style.color       = '';
            td.style.fontWeight  = '';
            td.style.fontSize    = '';
            td.style.borderRadius = '';
            td.style.boxShadow   = '';
        });
    });
    _clearBaselineHighlight();
}

// Highlight bảng theo mô hình bệnh lý — hàng khớp nổi bật, hàng không khớp nhấn nhẹ, hàng không liên quan mờ
function _applyModelHighlight(model) {
    if (!model) return;
    const mmap = _modelMeridianMap(model);
    const rows = document.querySelectorAll('[data-meridian-id]');
    const highlighted = new Set();

    rows.forEach(tr => {
        const mId = tr.getAttribute('data-meridian-id');
        const mv  = mmap[mId];
        if (mv === undefined) return;

        const isThuc = tr.getAttribute('data-is-thuc') === '1';
        const isHu   = tr.getAttribute('data-is-hu')   === '1';
        const matches = (mv === 1 && isThuc) || (mv === -1 && isHu);

        highlighted.add(tr);
        _setRowHighlight(tr, matches ? '#2D5A27' : '#8B1A1A');
    });

    rows.forEach(tr => {
        if (!highlighted.has(tr)) _setRowDimmed(tr);
    });
}

// Xóa highlight — khôi phục theo trạng thái đang active (badge hoặc model)
function clearMeridianHighlight() {
    _clearAllRowHighlights();
    if (_activeBadgeType) {
        _applyBadgeHighlight(_activeBadgeType);
    } else if (_activeModelId) {
        const m = diseaseModels.find(x => _modelId(x) == _activeModelId);
        if (m) _applyModelHighlight(m);
    }
}

// =========================================================
// MÔ HÌNH BỆNH LÝ
// =========================================================

// Trả về map kinh → giá trị kỳ vọng (1/−1) từ model (hỗ trợ cả format cũ lẫn mới)
function _modelMeridianMap(m) {
    const map = {};
    // Format mới: kichHoatTuKinh là JSON string chứa {tieutruong: 1, ...}
    if (m.kichHoatTuKinh) {
        try {
            const kh = typeof m.kichHoatTuKinh === 'string' ? JSON.parse(m.kichHoatTuKinh) : m.kichHoatTuKinh;
            meridianNames.forEach(n => {
                const v = parseInt(kh[n.id]);
                if (!isNaN(v) && v !== 0) map[n.id] = v;
            });
        } catch (e) { /* ignore */ }
    }
    // Format cũ: trường trực tiếp trên object (kl_bchung_luantri.json)
    if (Object.keys(map).length === 0) {
        meridianNames.forEach(n => {
            const v = parseInt(m[n.id]);
            if (!isNaN(v) && v !== 0) map[n.id] = v;
        });
    }
    return map;
}

// Tên hiển thị của model (hỗ trợ cả 2 format)
function _modelName(m) { return m.ten || m.tieuket || ''; }
function _modelId(m)   { return m.modelId || m._id || m.id; }

function suggestRelatedModels(record, diag) {
    const backendSyns = record._backendSyndromes || [];

    if (!diseaseModels.length && backendSyns.length) {
        _renderSuggestedCards(backendSyns);
        return;
    }
    if (!diseaseModels.length) return;

    const mStats = diag.meridianStats;

    const matches = diseaseModels.map(m => {
        const meridMap = _modelMeridianMap(m);
        let score = 0, total = Object.keys(meridMap).length;
        Object.entries(meridMap).forEach(([meridId, mv]) => {
            const actual = (mStats[meridId]?.leftStatus === '+' || mStats[meridId]?.rightStatus === '+') ? 1
                         : (mStats[meridId]?.leftStatus === '-' || mStats[meridId]?.rightStatus === '-') ? -1 : 0;
            if (mv === actual) score++;
        });
        return { ...m, rate: total > 0 ? score / total : 0, matchScore: score, totalInModel: total };
    }).filter(m => m.rate > 0.4).sort((a, b) => b.rate - a.rate);

    _renderSuggestedCards(matches);
}

function _renderSuggestedCards(matches) {
    const grid = document.getElementById('suggested-models');
    const summaryEl = document.getElementById('model-summary');
    if (!grid) return;

    if (summaryEl) {
        const matchedCount = matches.length;
        const totalInfo = diseaseModels.length ? ` trên tổng ${diseaseModels.length} mô hình` : '';
        if (matchedCount > 0) {
            summaryEl.textContent = `Tìm thấy ${matchedCount} mô hình phù hợp (hiển thị tối đa 12)${totalInfo}.`;
        } else {
            summaryEl.textContent = 'Chưa tìm được mô hình bệnh lý nào thực sự phù hợp với số liệu hiện tại.';
        }
    }

    grid.innerHTML = matches.slice(0, 12).map(m => {
        const pct = Math.round((m.rate || 0) * 100);
        const mid = _modelId(m);
        const barColor = pct >= 90 ? '#2D5A27' : pct >= 70 ? '#8B4513' : '#8B7355';
        const isSelected = !!_selectedRecordModels[mid];
        return `
        <div class="model-card"
            data-id="${mid}"
            style="padding:8px 12px;border:1px solid #D4C5A0;border-radius:4px;cursor:pointer;
                   transition:all 0.18s;background:#FFFDF7;display:flex;align-items:center;gap:10px;"
            onmouseenter="previewModelHover(${mid}, this)"
            onmouseleave="hideModelHover()"
            onclick="toggleModelHighlightOnly(${mid}, this)">
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;font-size:0.82rem;color:#5B3A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${_modelName(m)}
                </div>
                <div style="height:4px;background:#E8DCC8;border-radius:2px;margin-top:4px;">
                    <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <button
                    onclick="event.stopPropagation(); selectModelForRecord(${mid});"
                    style="font-size:0.72rem;padding:2px 8px;border-radius:10px;cursor:pointer;font-weight:600;
                           background:${isSelected ? '#D4EDDA' : '#2D5A27'};
                           color:${isSelected ? '#155724' : 'white'};
                           border:1px solid ${isSelected ? '#C3E6CB' : '#1E4020'};">
                    ${isSelected ? '✓ Đã chọn' : '+ Chọn'}
                </button>
                <div style="font-size:0.78rem;font-weight:bold;color:${barColor};white-space:nowrap;">${pct}%</div>
            </div>
        </div>`;
    }).join('');
}

// Biến theo dõi card đang active
let _activeModelId = null;
// Cache các model đã chọn cho phiếu đang xem: Map<modelId, rowObject>
let _selectedRecordModels = {};

// Click vào model card — chỉ toggle highlight (không hiển thị cứng)
function toggleModelHighlightOnly(id, cardEl) {
    if (_activeModelId === id) {
        _activeModelId = null;
        document.querySelectorAll('.model-card').forEach(c => {
            c.style.background = '#FFFDF7';
            c.style.borderColor = '#D4C5A0';
            c.style.boxShadow = '';
        });
        renderBodyChart(activeAnalysisRecord, null);
        return;
    }
    _activeModelId = id;
    // highlight card
    document.querySelectorAll('.model-card').forEach(c => {
        c.style.background = '#FFFDF7';
        c.style.borderColor = '#D4C5A0';
        c.style.boxShadow = '';
    });
    if (cardEl) {
        cardEl.style.background = '#F5F0E8';
        cardEl.style.borderColor = '#8B1A1A';
        cardEl.style.boxShadow = '0 2px 8px rgba(139,26,26,0.2)';
    }
    const m = diseaseModels.find(x => _modelId(x) == id);
    if (!m) return;
    renderBodyChart(activeAnalysisRecord, m);
    _applyModelHighlight(m);
}

// Hover tooltip
let _hoverTipTimer = null;
function previewModelHover(id, el) {
    const m = diseaseModels.find(x => _modelId(x) == id);
    if (!m) return;
    const tip = document.getElementById('model-hover-tip');
    if (!tip) return;
    if (_hoverTipTimer) { clearTimeout(_hoverTipTimer); _hoverTipTimer = null; }

    const name = _modelName(m);
    const toPlain = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.innerText || '').replace(/\u00A0/g, ' ').trim();
    };
    const tc = toPlain(m.trieuchung || '');
    const pt = toPlain(m.phaptri || m.phepchua || '');
    const hh = toPlain(m.phuonghuyet || m.phuyet_chamcuu || '');
    const cut = (s, n) => (s.length > n ? s.substring(0, n).trim() + '…' : s);

    tip.innerHTML = `
        <div style="font-weight:900;color:#5B3A1A;margin-bottom:8px;line-height:1.25;">${name}</div>
        ${tc ? `<div style="margin-bottom:7px;padding:6px 8px;border-radius:8px;background:#FFFDF7;border:1px solid #E8DCC8;">
            <div style="font-weight:800;color:#8B1A1A;font-size:0.78rem;margin-bottom:2px;">Triệu chứng</div>
            <div style="color:#2D2D2D;">${cut(tc, 260)}</div>
        </div>` : ''}
        ${pt ? `<div style="margin-bottom:7px;padding:6px 8px;border-radius:8px;background:#FFFDF7;border:1px solid #E8DCC8;">
            <div style="font-weight:800;color:#1A5276;font-size:0.78rem;margin-bottom:2px;">Pháp trị</div>
            <div style="color:#2D2D2D;">${cut(pt, 260)}</div>
        </div>` : ''}
        ${hh ? `<div style="padding:6px 8px;border-radius:8px;background:#FFFDF7;border:1px solid #E8DCC8;">
            <div style="font-weight:800;color:#2D5A27;font-size:0.78rem;margin-bottom:2px;">Phương huyệt</div>
            <div style="color:#2D2D2D;">${cut(hh, 260)}</div>
        </div>` : ''}
        <div style="margin-top:8px;color:#A09580;font-size:0.75rem;">Hover để xem nhanh • Click để tô màu bảng</div>
    `;
    tip.style.display = 'block';
    tip.style.pointerEvents = 'none';
    tip.style.maxWidth = '460px';

    // Đặt tooltip đẹp: ưu tiên sát card, tự chọn trái/phải + trên/dưới để không tràn màn hình
    const r = el.getBoundingClientRect();
    // cần đo kích thước sau khi render
    const tipRect = tip.getBoundingClientRect();
    const pad = 10;

    // candidate positions
    let left = r.right + 10;
    let top = r.top;

    // nếu tràn phải → đặt sang trái
    if (left + tipRect.width + pad > window.innerWidth) {
        left = r.left - tipRect.width - 10;
    }
    // clamp ngang
    left = Math.max(pad, Math.min(left, window.innerWidth - tipRect.width - pad));

    // nếu tràn dưới → đẩy lên (ưu tiên bám theo card)
    if (top + tipRect.height + pad > window.innerHeight) {
        top = window.innerHeight - tipRect.height - pad;
    }
    // nếu quá sát trên → đẩy xuống
    top = Math.max(pad, top);

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
}

function hideModelHover() {
    const tip = document.getElementById('model-hover-tip');
    if (!tip) return;
    if (_hoverTipTimer) clearTimeout(_hoverTipTimer);
    _hoverTipTimer = setTimeout(() => {
        tip.style.display = 'none';
    }, 120);
}

// Chọn / bỏ chọn mô hình cho phiếu đang xem
async function selectModelForRecord(modelId) {
    if (!activeAnalysisRecord) {
        alert('Chưa chọn phiếu khám nào!');
        return;
    }
    const phieukhamId = activeAnalysisRecord.phieukhamId || activeAnalysisRecord.phieukham_id;
    const mid = parseInt(modelId);
    const isAlready = !!_selectedRecordModels[mid];

    const btn = document.getElementById('btn-select-model-' + mid);
    const originalText = btn ? btn.textContent : '';

    if (isAlready) {
        // Bỏ chọn
        if (!confirm('Bỏ chọn mô hình này khỏi phiếu khám?')) return;
        try {
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Đang bỏ chọn...';
            }
            await apiRemoveRecordModel(phieukhamId, mid);
            delete _selectedRecordModels[mid];
            if (btn) {
                btn.textContent = '+ Chọn mô hình này cho phiếu';
                btn.style.background = '#2D5A27'; btn.style.color = 'white';
                btn.style.border = '1px solid #1E4020';
                btn.disabled = false;
            }
            renderSelectedModelsPanel(phieukhamId);
        } catch (e) {
            alert('Lỗi: ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                if (!isAlready) btn.textContent = originalText || btn.textContent;
            }
        }
    } else {
        // Chọn mô hình
        const m = diseaseModels.find(x => _modelId(x) == mid);
        const payload = { modelId: mid, duocChon: true, doPhuHop: 0 };
        try {
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Đang lưu...';
            }
            const result = await apiSaveRecordModel(phieukhamId, payload);
            if (result && result.success === false) {
                alert('Lỗi khi lưu: ' + (result.error || 'Không rõ lỗi'));
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = originalText || '+ Chọn mô hình này cho phiếu';
                }
                return;
            }
            _selectedRecordModels[mid] = { modelId: mid, ten: _modelName(m), phaptri: m?.phaptri || m?.phepchua || '', phuonghuyet: m?.phuonghuyet || m?.phuyet_chamcuu || '', trieuchung: m?.trieuchung || '' };
            if (btn) {
                btn.textContent = '✓ Đã chọn cho phiếu này';
                btn.style.background = '#D4EDDA'; btn.style.color = '#155724';
                btn.style.border = '1px solid #C3E6CB';
                btn.disabled = false;
            }
            renderSelectedModelsPanel(phieukhamId);
        } catch (e) {
            alert('Lỗi khi lưu: ' + e.message);
        } finally {
            if (btn && btn.disabled) {
                btn.disabled = false;
                // nếu vì lý do nào đó text chưa được set ở các nhánh trên, trả lại text cũ
                if (!isAlready && btn.textContent === 'Đang lưu...') {
                    btn.textContent = originalText || '+ Chọn mô hình này cho phiếu';
                }
            }
        }
    }
}

// Tải và render danh sách mô hình đã chọn cho phiếu
async function renderSelectedModelsPanel(phieukhamId) {
    const panel = document.getElementById('selected-models-panel');
    if (!panel) return;

    let items = [];
    try {
        items = await apiGetRecordModels(phieukhamId);
        // Cập nhật cache local
        _selectedRecordModels = {};
        items.forEach(it => { _selectedRecordModels[it.modelId] = it; });
    } catch (e) {
        panel.innerHTML = '';
        return;
    }

    if (!items.length) {
        panel.innerHTML = '<div style="color:#A09580;font-size:0.78rem;padding:6px 0;">Chưa chọn mô hình nào cho phiếu này.</div>';
        return;
    }

    // Hiển thị theo từng mô hình, phân biệt màu sắc (không gộp lẫn nội dung)
    const palette = ['#8B1A1A', '#1A5276', '#2D5A27', '#8B4513', '#6A1B9A', '#0E6655', '#7D6608', '#922B21'];
    const colorOf = (idx) => palette[idx % palette.length];
    const asHtml = (html) => {
        const safe = _sanitizeModelHtml(html || '');
        return safe ? `<div class="model-html">${safe}</div>` : '';
    };

    panel.innerHTML = `
        <div style="font-weight:bold;color:#5B3A1A;font-size:0.85rem;margin-bottom:6px;border-bottom:1px solid #D4C5A0;padding-bottom:4px;">
            Mô hình đã chọn cho phiếu này (${items.length})
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
            ${items.map((i, idx) => `
                <span style="background:#FFFDF7;border:1px solid #D4C5A0;border-left:6px solid ${colorOf(idx)};border-radius:12px;padding:2px 10px;font-size:0.75rem;color:#5B3A1A;display:inline-flex;align-items:center;gap:6px;">
                    <span style="font-weight:700;color:${colorOf(idx)};">■</span>
                    ${i.ten}
                    <span onclick="selectModelForRecord(${i.modelId})" style="cursor:pointer;color:#8B1A1A;font-weight:bold;margin-left:2px;" title="Bỏ chọn">×</span>
                </span>`).join('')}
        </div>
        <div style="display:flex;gap:6px;justify-content:flex-end;margin:6px 0 10px 0;">
            <button class="btn btn-sm" style="background:#E8F0FE;color:#1A5276;border:1px solid #BFD3F2;padding:4px 10px;border-radius:6px;cursor:pointer;"
                onclick="openAiSummaryModal(${phieukhamId})">AI tổng hợp (văn bản)</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${items.map((i, idx) => `
                <div id="sum-model-${i.modelId}" style="border:1px solid #E8DCC8;border-radius:8px;background:#FBF8F1;padding:8px 10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                        <div style="font-weight:800;color:${colorOf(idx)};display:flex;align-items:center;gap:8px;">
                            <span style="width:10px;height:10px;border-radius:2px;background:${colorOf(idx)};display:inline-block;"></span>
                            ${i.ten}
                        </div>
                        <button class="btn btn-sm" style="background:#FFFDF7;color:#5B3A1A;border:1px solid #D4C5A0;padding:3px 10px;border-radius:6px;cursor:pointer;"
                            onclick="focusModelAndHighlight(${i.modelId})">Xem & tô màu</button>
                    </div>
                    ${i.trieuchung ? `<div style="font-size:0.75rem;line-height:1.5;margin-bottom:6px;"><strong>Triệu chứng:</strong>${asHtml(i.trieuchung)}</div>` : ''}
                    ${i.phaptri ? `<div style="font-size:0.75rem;line-height:1.5;margin-bottom:6px;"><strong>Pháp trị:</strong>${asHtml(i.phaptri)}</div>` : ''}
                    ${i.phuonghuyet ? `<div style="font-size:0.75rem;line-height:1.5;"><strong>Phương huyệt:</strong>${asHtml(i.phuonghuyet)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function focusModelAndHighlight(modelId) {
    const card = document.querySelector(`.model-card[data-id="${modelId}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    toggleModelHighlightOnly(modelId, card || null);

    // làm nổi block tổng hợp tương ứng để người dùng thấy ý nghĩa
    document.querySelectorAll('[id^="sum-model-"]').forEach(el => {
        el.style.boxShadow = '';
        el.style.borderColor = '#E8DCC8';
    });
    const box = document.getElementById('sum-model-' + modelId);
    if (box) {
        box.style.borderColor = '#8B1A1A';
        box.style.boxShadow = '0 0 0 3px rgba(139,26,26,0.15)';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Reset (dùng khi cần xóa từ bên ngoài)
function resetModelDetail() {
    _activeModelId = null;
    document.querySelectorAll('.model-card').forEach(c => {
        c.style.background = '#FFFDF7';
        c.style.borderColor = '#D4C5A0';
        c.style.boxShadow = '';
    });
    const box = document.getElementById('model-detail-box');
    if (box) box.innerHTML = '<div style="color:#A09580;text-align:center;padding:10px;">⬆ Di chuột vào mô hình để xem chi tiết...</div>';
    if (activeAnalysisRecord) renderBodyChart(activeAnalysisRecord, null);
}

function renderSelectedModelDetail(m) {
    const box = document.getElementById('model-detail-box');
    if (!box) return;
    box.innerHTML = `
        <div style="font-weight:bold;color:#8B1A1A;font-size:0.88rem;margin-bottom:6px;font-family:'Times New Roman',serif;">${_modelName(m)}</div>
        <div style="font-size:0.8rem;color:#2D2D2D;margin-bottom:6px;line-height:1.5;">
            <strong>Triệu chứng chính:</strong>
            <div style="margin-top:2px;">${m.trieuchung || 'N/A'}</div>
        </div>
        <div style="font-size:0.8rem;color:#2D2D2D;margin-bottom:6px;line-height:1.5;">
            <strong>Pháp trị:</strong>
            <div style="margin-top:2px;">${m.phaptri || m.phepchua || 'N/A'}</div>
        </div>
        <div style="font-size:0.8rem;color:#2D2D2D;line-height:1.5;">
            <strong>Phương huyệt (gợi ý):</strong>
            <div style="margin-top:2px;">${m.phuonghuyet || m.phuyet_chamcuu || 'N/A'}</div>
        </div>`;
}

function renderDiseaseModels(data = diseaseModels) {
    const list = document.getElementById('models-list');
    if (!list) return;
    const toPlain = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.innerText || '').replace(/\u00A0/g, ' ').trim();
    };
    list.innerHTML = data.slice(0, 100).map(m => `
        <tr>
            <td style="font-weight:600;">${_modelName(m) || 'N/A'}</td>
            <td style="font-size:0.8rem;color:#5B4A3A;">${(toPlain(m.trieuchung || '')).substring(0, 100)}...</td>
            <td style="text-align:center;">
                <span class="table-actions">
                    <button class="btn btn-sm btn-outline" onclick="showModelDetail(${_modelId(m)})">Chi tiết</button>
                    <button class="btn btn-sm btn-primary" onclick="openModelEditor(${_modelId(m)})">Sửa</button>
                </span>
            </td>
        </tr>`).join('');
}

function filterModels() {
    const q = (document.getElementById('model-search')?.value || '').toLowerCase();
    const g = (document.getElementById('model-filter-group')?.value || '').toLowerCase();
    const tag = (document.getElementById('model-filter-tag')?.value || '');
    let list = diseaseModels.filter(m => _modelName(m).toLowerCase().includes(q));
    if (g) list = list.filter(m => (m.nhomChinh || '').toLowerCase() === g);
    if (tag) {
        const [k, v] = tag.split(':');
        list = list.filter(m => ((m[k] || '') + '').toLowerCase().includes((v || '').toLowerCase()));
    }
    renderDiseaseModels(list);
}

function showModelDetail(id) {
    const m = diseaseModels.find(x => _modelId(x) == id);
    if (!m) return;
    const modal = document.getElementById('model-detail-modal');
    if (!modal) return;
    document.getElementById('modal-model-title').innerText = _modelName(m);
    const safeTC = _sanitizeModelHtml(m.trieuchung || '');
    const safePT = _sanitizeModelHtml(m.phaptri || m.phepchua || '');
    const safeHH = _sanitizeModelHtml(m.phuonghuyet || m.phuyet_chamcuu || '');
    document.getElementById('modal-model-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr;gap:15px;">
            <div><strong>Triệu chứng:</strong><div style="margin-top:6px;">${safeTC || 'N/A'}</div></div>
            <div><strong>Pháp trị:</strong><div style="margin-top:6px;">${safePT || 'N/A'}</div></div>
            <div><strong>Phương huyệt:</strong><div style="margin-top:6px;">${safeHH || 'N/A'}</div></div>
        </div>`;
    modal.style.display = 'block';
}

// =========================================================
// AI/Template summary for selected models
// =========================================================
function openAiSummaryModal(phieukhamId) {
    const modal = document.getElementById('ai-summary-modal');
    if (!modal) return;
    modal.style.display = 'block';
    const status = document.getElementById('ai-summary-status');
    const ta = document.getElementById('ai-summary-text');
    if (status) { status.style.display = 'block'; status.textContent = 'Đang tổng hợp...'; }
    if (ta) ta.value = '';

    apiSummarizeSelectedModels(phieukhamId).then(res => {
        if (status) status.style.display = 'none';
        if (!res || res.success === false) {
            if (status) { status.style.display = 'block'; status.textContent = 'Lỗi tổng hợp: ' + (res?.error || 'N/A'); }
            return;
        }
        if (ta) ta.value = res.text || '';
        const sub = document.getElementById('ai-summary-subtitle');
        if (sub) sub.textContent = res.usedAi ? 'Đã tổng hợp bằng AI (tham khảo).' : 'Đã tổng hợp theo template (tham khảo).';
    }).catch(err => {
        if (status) { status.style.display = 'block'; status.textContent = 'Lỗi tổng hợp: ' + (err?.message || err); }
    });
}

function closeAiSummaryModal() {
    const modal = document.getElementById('ai-summary-modal');
    if (modal) modal.style.display = 'none';
}

function copyAiSummaryText() {
    const ta = document.getElementById('ai-summary-text');
    if (!ta) return;
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
}

function printAiSummaryText() {
    const ta = document.getElementById('ai-summary-text');
    if (!ta) return;
    const text = ta.value || '';
    const w = window.open('', '_blank');
    if (!w) return;
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    w.document.write(`
        <html>
        <head>
            <title>In báo cáo</title>
            <meta charset="utf-8"/>
            <style>
                body { font-family: "Times New Roman", serif; margin: 24px; }
                pre { white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
            </style>
        </head>
        <body>
            <pre>${escaped}</pre>
            <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>
    `);
    w.document.close();
}

// (ĐÃ TẮT) Checklist gia giảm theo yêu cầu UX mới: bác sĩ tự kê đơn/huyệt, hệ thống chỉ tổng hợp theo mô hình.

function closeModelModal() {
    const modal = document.getElementById('model-detail-modal');
    if (modal) modal.style.display = 'none';
}

// =========================================================
// CRUD mô hình bệnh
// =========================================================
let _editingModelId = null;
let _quillTrieuchung = null;
let _quillPhaptri = null;
let _quillPhuonghuyet = null;
let _quillConfigVersion = 0;

function _sanitizeModelHtml(html) {
    // classic editor: cho phép tiêu đề/đoạn/bullet, không cho ảnh/video
    if (window.DOMPurify) {
        return DOMPurify.sanitize(html || '', {
            ALLOWED_TAGS: ['p','br','strong','b','em','i','u','s','blockquote','ul','ol','li','h1','h2','h3','h4','pre','code','span'],
            ALLOWED_ATTR: ['class'],
        });
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.innerText || '').replace(/\u00A0/g, ' ');
}

function _destroyQuillInstance(editorId) {
    const el = document.getElementById(editorId);
    if (!el) return;
    const q = el._quillInstance;
    if (!q) return;
    // Quill không có destroy chính thức.
    // Dọn toolbar cũ do Quill tự chèn (nếu có) để tránh "mọc" nhiều toolbar.
    try {
        const prev = el.previousElementSibling;
        if (prev && prev.classList && prev.classList.contains('ql-toolbar')) {
            prev.remove();
        }
    } catch (e) { /* ignore */ }
    // Nếu dùng toolbar container riêng, clear nó luôn.
    try {
        const toolbarId =
            editorId === 'me-trieuchung-editor' ? 'me-trieuchung-toolbar' :
            editorId === 'me-phaptri-editor' ? 'me-phaptri-toolbar' :
            editorId === 'me-phuonghuyet-editor' ? 'me-phuonghuyet-toolbar' :
            null;
        if (toolbarId) {
            const tb = document.getElementById(toolbarId);
            if (tb) tb.innerHTML = '';
        }
    } catch (e) { /* ignore */ }

    // Cách an toàn: thay toàn bộ node editor
    try {
        const parent = el.parentNode;
        if (!parent) return;
        const clone = el.cloneNode(false);
        clone._quillInstance = null;
        parent.replaceChild(clone, el);
    } catch (e) {
        // ignore
    }
}

function _ensureQuillEditors(forceReinit = false) {
    if (!window.Quill) return;
    const toolbarOptions = [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['clean'],
    ];

    const mk = (editorId) => {
        const el = document.getElementById(editorId);
        if (!el) return null;
        if (forceReinit && el._quillInstance) {
            _destroyQuillInstance(editorId);
        }
        const el2 = document.getElementById(editorId);
        if (!el2) return null;
        if (el2._quillInstance) return el2._quillInstance;

        const toolbarId =
            editorId === 'me-trieuchung-editor' ? 'me-trieuchung-toolbar' :
            editorId === 'me-phaptri-editor' ? 'me-phaptri-toolbar' :
            editorId === 'me-phuonghuyet-editor' ? 'me-phuonghuyet-toolbar' :
            null;
        let toolbarContainer = null;
        if (toolbarId) {
            toolbarContainer = document.getElementById(toolbarId);
            if (toolbarContainer) {
                // đảm bảo không nhân toolbar khi init lại
                toolbarContainer.innerHTML = '';
                toolbarContainer.style.display = 'block';
            }
        }

        const q = new Quill(el2, {
            theme: 'snow',
            modules: {
                toolbar: toolbarContainer || toolbarOptions,
                keyboard: {
                    bindings: {
                        // Tab/Shift+Tab để tăng/giảm cấp trong list
                        indent_list: {
                            key: 9,
                            format: ['list'],
                            handler: function(range, context) {
                                this.quill.format('indent', (context.format.indent || 0) + 1);
                                return false;
                            }
                        },
                        outdent_list: {
                            key: 9,
                            shiftKey: true,
                            format: ['list'],
                            handler: function(range, context) {
                                this.quill.format('indent', Math.max((context.format.indent || 0) - 1, 0));
                                return false;
                            }
                        }
                    }
                }
            }
        });
        el2._quillInstance = q;
        q.enable(true);
        el2.addEventListener('click', () => { try { q.focus(); } catch (e) {} });
        return q;
    };

    _quillTrieuchung = mk('me-trieuchung-editor');
    _quillPhaptri = mk('me-phaptri-editor');
    _quillPhuonghuyet = mk('me-phuonghuyet-editor');
}

function _getEditorText(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    if (typeof el.value === 'string') return el.value || '';
    return (el.innerText || '').replace(/\u00A0/g, ' ');
}

function _setEditorText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof el.value === 'string') { el.value = text || ''; return; }
    el.innerText = text || '';
}

function _attachPlainPaste(id) {
    const el = document.getElementById(id);
    if (!el || typeof el.addEventListener !== 'function') return;
    if (el._plainPasteAttached) return;
    el._plainPasteAttached = true;
    el.addEventListener('paste', (e) => {
        e.preventDefault();
        const txt = (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
        document.execCommand('insertText', false, txt);
    });
}

function openModelEditor(modelId = null) {
    const modal = document.getElementById('model-editor-modal');
    if (!modal) return;
    _editingModelId = modelId ? parseInt(modelId) : null;

    const title = document.getElementById('model-editor-title');
    const status = document.getElementById('model-editor-status');
    const delBtn = document.getElementById('me-delete-btn');
    if (status) { status.style.display = 'none'; status.textContent = ''; }

    // Hiện modal trước rồi init editor để tránh lỗi focus/kích thước (Quill init khi phần tử đang ẩn)
    modal.style.display = 'block';
    // Force re-init để toolbar/binding mới áp vào cả 3 ô (đặc biệt Pháp trị)
    _ensureQuillEditors(true);
    if (!_quillTrieuchung || !_quillPhaptri || !_quillPhuonghuyet) {
        try { console.warn('Quill init missing', { _quillTrieuchung, _quillPhaptri, _quillPhuonghuyet }); } catch (e) {}
        // Báo nhẹ để người dùng biết đang có lỗi init/cached JS
        _meStatus('Lưu ý: trình soạn thảo chưa khởi tạo đủ (đặc biệt Pháp trị). Hãy Ctrl+F5 và mở lại modal.', true);
    }
    const setVal = (id, v) => _setEditorText(id, v || '');

    if (_editingModelId) {
        const m = diseaseModels.find(x => _modelId(x) == _editingModelId);
        if (title) title.textContent = 'Sửa mô hình bệnh';
        if (delBtn) delBtn.style.display = '';
        setVal('me-ten', _modelName(m));
        setVal('me-nhom', m?.nhomChinh || '');
        if (_quillTrieuchung) _quillTrieuchung.root.innerHTML = _sanitizeModelHtml(m?.trieuchung || '');
        if (_quillPhaptri) _quillPhaptri.root.innerHTML = _sanitizeModelHtml(m?.phaptri || m?.phepchua || '');
        if (_quillPhuonghuyet) _quillPhuonghuyet.root.innerHTML = _sanitizeModelHtml(m?.phuonghuyet || m?.phuyet_chamcuu || '');
        const khObj = {};
        ['tieutruong','tam','tamtieu','tambao','daitrang','phe','bangquang','than','dam','vi','can','ty']
            .forEach(k => { if (m?.[k] && m[k] !== 0) khObj[k] = m[k]; });
        setVal('me-kichhoat', Object.keys(khObj).length ? JSON.stringify(khObj) : (m?.kichHoatTuKinh || ''));
    } else {
        if (title) title.textContent = 'Thêm mô hình bệnh';
        if (delBtn) delBtn.style.display = 'none';
        ['me-ten','me-nhom','me-kichhoat'].forEach(id => setVal(id, ''));
        if (_quillTrieuchung) _quillTrieuchung.setText('');
        if (_quillPhaptri) _quillPhaptri.setText('');
        if (_quillPhuonghuyet) _quillPhuonghuyet.setText('');
    }
    // focus vào editor đầu tiên
    try { _quillTrieuchung?.focus(); } catch (e) {}
}

function closeModelEditor() {
    const modal = document.getElementById('model-editor-modal');
    if (modal) modal.style.display = 'none';
    _editingModelId = null;
}

function _meStatus(msg, isErr=false) {
    const el = document.getElementById('model-editor-status');
    if (!el) return;
    el.style.display = msg ? 'block' : 'none';
    el.style.color = isErr ? '#B03A2E' : '#A09580';
    el.textContent = msg || '';
}

function _cleanTextForModel(s) {
    // loại rác word/copy-paste cơ bản ở frontend luôn
    return (s || '')
        .replace(/MicrosoftInternetExplorer4/gi, '')
        .replace(/\/\*\s*Style Definitions\s*\*\//gi, '')
        .replace(/table\.MsoNormalTable[\s\S]*/gi, '')
        .replace(/\bmso\-[a-z0-9\-]+\b/gi, '')
        .trim();
}

function _stripHtmlToText(s) {
    const html = (s || '').toString();
    if (!html.includes('<')) return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.innerText || '').replace(/\u00A0/g, ' ');
}

function _sanitizeTextPreserveLines(s) {
    let t = _stripHtmlToText((s || '').toString());
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    t = _cleanTextForModel(t);

    const badLine = /(MicrosoftInternetExplorer4|\/\*\s*Style Definitions\s*\*\/|table\.MsoNormalTable|mso\-|st1\\:\*\\\{behavior:url\(#ieooui\)\s*\}|Normal\s+0\s+false\s+false\s+false)/i;
    const lines = t.split('\n').map(line => {
        const leading = (line.match(/^(\s*[-•·]\s+|\s+)/) || [''])[0];
        let core = line.slice(leading.length);
        core = core.replace(/\s+/g, ' ').trim();
        return (leading ? leading.replace(/[·]/g, '•') : '') + core;
    }).filter(line => {
        if (!line.trim()) return false;
        if (badLine.test(line)) return false;
        return true;
    });
    return lines.join('\n').trim();
}

async function saveModelEditor() {
    const ten = _getEditorText('me-ten')?.trim();
    if (!ten) { _meStatus('Vui lòng nhập tên mô hình.', true); return; }

    _ensureQuillEditors();
    const payload = {
        ten,
        nhom_chinh: _getEditorText('me-nhom')?.trim() || '',
        trieuchung: _sanitizeModelHtml(_quillTrieuchung ? _quillTrieuchung.root.innerHTML : ''),
        phaptri: _sanitizeModelHtml(_quillPhaptri ? _quillPhaptri.root.innerHTML : ''),
        phuonghuyet: _sanitizeModelHtml(_quillPhuonghuyet ? _quillPhuonghuyet.root.innerHTML : ''),
        kich_hoat_tu_kinh: (_getEditorText('me-kichhoat') || '').trim(),
        tag_am_duong: '',
        tag_hu_thuc: '',
        tag_han_nhiet: '',
        tag_bieu_ly: '',
        muc_do: '',
    };

    // validate JSON if provided
    if (payload.kich_hoat_tu_kinh) {
        try { JSON.parse(payload.kich_hoat_tu_kinh); }
        catch { _meStatus('Kích hoạt từ kinh phải là JSON hợp lệ.', true); return; }
    }

    _meStatus('Đang lưu...', false);
    try {
        let res;
        if (_editingModelId) {
            res = await apiUpdateModel(_editingModelId, payload);
        } else {
            res = await apiCreateModel(payload);
        }
        if (!res || res.success === false) {
            _meStatus('Lưu thất bại: ' + (res?.error || 'N/A'), true);
            return;
        }
        // reload models from API
        diseaseModels = await apiGetModels();
        renderDiseaseModels();
        closeModelEditor();
    } catch (e) {
        _meStatus('Lỗi lưu: ' + (e.message || e), true);
    }
}

async function deleteCurrentModel() {
    if (!_editingModelId) return;
    if (!confirm('Bạn chắc chắn muốn xóa mô hình này?')) return;
    _meStatus('Đang xóa...', false);
    try {
        const res = await apiDeleteModel(_editingModelId);
        if (!res || res.success === false) {
            _meStatus('Xóa thất bại: ' + (res?.error || 'N/A'), true);
            return;
        }
        diseaseModels = await apiGetModels();
        renderDiseaseModels();
        closeModelEditor();
    } catch (e) {
        _meStatus('Lỗi xóa: ' + (e.message || e), true);
    }
}

function _bulletizeTextWithStats(s) {
    const before = _stripHtmlToText((s || '').toString());
    const t = _sanitizeTextPreserveLines(before);
    if (!t) return { text: '', beforeLines: 0, afterLines: 0, changed: before.trim().length > 0 };
    const parts = t
        .replace(/\r/g, '\n')
        .replace(/[•·]/g, '\n')
        .replace(/;/g, '\n')
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean)
        .map(x => x.replace(/^\-+\s*/, '').trim());
    // bỏ trùng
    const seen = new Set();
    const uniq = [];
    parts.forEach(p => {
        const k = p.toLowerCase();
        if (!seen.has(k)) { seen.add(k); uniq.push(p); }
    });
    const out = uniq.map(p => `- ${p}`).join('\n');
    const beforeLines = before.split('\n').filter(x => x.trim()).length;
    const afterLines = out.split('\n').filter(x => x.trim()).length;
    return { text: out, beforeLines, afterLines, changed: out.trim() !== before.trim() };
}

function cleanModelEditorContent() {
    _ensureQuillEditors();
    const beforeTc = _quillTrieuchung ? _quillTrieuchung.root.innerHTML : '';
    const beforePt = _quillPhaptri ? _quillPhaptri.root.innerHTML : '';
    const beforeHh = _quillPhuonghuyet ? _quillPhuonghuyet.root.innerHTML : '';
    const afterTc = _sanitizeModelHtml(beforeTc);
    const afterPt = _sanitizeModelHtml(beforePt);
    const afterHh = _sanitizeModelHtml(beforeHh);
    if (_quillTrieuchung) _quillTrieuchung.root.innerHTML = afterTc;
    if (_quillPhaptri) _quillPhaptri.root.innerHTML = afterPt;
    if (_quillPhuonghuyet) _quillPhuonghuyet.root.innerHTML = afterHh;
    const changedAny = beforeTc !== afterTc || beforePt !== afterPt || beforeHh !== afterHh;
    _meStatus(changedAny ? 'Đã làm sạch định dạng (giữ tiêu đề/đoạn/bullet).' : 'Không có gì cần làm sạch (dữ liệu đã sạch).', false);
    setTimeout(() => _meStatus('', false), 900);
}

function previewModelReport() {
    const ten = _getEditorText('me-ten')?.trim() || '(Chưa đặt tên)';
    _ensureQuillEditors();
    const tc = _bulletizeTextWithStats((_quillTrieuchung ? _quillTrieuchung.getText() : '')).text;
    const pt = _bulletizeTextWithStats((_quillPhaptri ? _quillPhaptri.getText() : '')).text;
    const hh = _bulletizeTextWithStats((_quillPhuonghuyet ? _quillPhuonghuyet.getText() : '')).text;

    const lines = [];
    lines.push('BÁO CÁO TÓM TẮT (tham khảo từ mô hình)');
    lines.push('');
    lines.push('I. MÔ HÌNH GỢI Ý');
    lines.push(`1. ${ten}`);
    lines.push('');
    lines.push('II. NỘI DUNG TÓM TẮT');
    if (tc) { lines.push('• Triệu chứng:'); lines.push(tc.replace(/^\-\s/gm, '  • ')); lines.push(''); }
    if (pt) { lines.push('• Hướng xử trí / pháp trị:'); lines.push(pt.replace(/^\-\s/gm, '  • ')); lines.push(''); }
    if (hh) { lines.push('• Phương huyệt gợi ý:'); lines.push(hh.replace(/^\-\s/gm, '  • ')); lines.push(''); }
    lines.push('III. LƯU Ý');
    lines.push('• Nội dung trên mang tính tham khảo. Bác sĩ sẽ là người quyết định đơn thuốc và huyệt châm phù hợp.');

    const modal = document.getElementById('model-preview-modal');
    const ta = document.getElementById('model-preview-text');
    if (ta) ta.value = lines.join('\n').trim();
    if (modal) modal.style.display = 'block';
}

function closeModelPreview() {
    const modal = document.getElementById('model-preview-modal');
    if (modal) modal.style.display = 'none';
}

function copyModelPreviewText() {
    const ta = document.getElementById('model-preview-text');
    if (!ta) return;
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
}

function printModelPreviewText() {
    const ta = document.getElementById('model-preview-text');
    if (!ta) return;
    const text = ta.value || '';
    const w = window.open('', '_blank');
    if (!w) return;
    const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    w.document.write(`
      <html><head><meta charset="utf-8"/><title>In preview</title>
      <style>body{font-family:"Times New Roman",serif;margin:24px;} pre{white-space:pre-wrap;font-size:14px;line-height:1.5;}</style>
      </head><body><pre>${escaped}</pre><script>window.onload=()=>window.print();</script></body></html>
    `);
    w.document.close();
}

// =========================================================
// TIỆN ÍCH
// =========================================================
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
            const ms = parseInt(dateStr.match(/\/Date\((-?\d+)\)\//)[1]);
            return new Date(ms).toLocaleDateString('vi-VN');
        }
        return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch(e) { return dateStr; }
}
