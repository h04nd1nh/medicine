// api.js - Lớp mỏng tách UI khỏi NestJS backend
function _base() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3001' : (window.location.origin + '/api');
}

// ---- AUTH ----

const _TOKEN_KEY = 'kinhlac_token';
const _USER_KEY = 'kinhlac_user';

function _getToken() { return localStorage.getItem(_TOKEN_KEY); }
function _setToken(t) { localStorage.setItem(_TOKEN_KEY, t); }
function _clearToken() { localStorage.removeItem(_TOKEN_KEY); localStorage.removeItem(_USER_KEY); }
function _getUser() { try { return JSON.parse(localStorage.getItem(_USER_KEY)); } catch { return null; } }
function _setUser(u) { localStorage.setItem(_USER_KEY, JSON.stringify(u)); }
function isLoggedIn() { return !!_getToken(); }

function _authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const t = _getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
}

async function apiLogin(username, password) {
    const res = await fetch(_base() + '/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        const msg = await _safeText(res, 'Sai tên đăng nhập hoặc mật khẩu');
        return { success: false, error: msg };
    }
    const data = await res.json();
    _setToken(data.access_token);
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    _setUser({ username: payload.username, id: payload.sub });
    return { success: true };
}

function apiLogout() {
    _clearToken();
}

function _toLegacyTicks(dateInput) {
    if (!dateInput) return null;
    const ms = new Date(dateInput).getTime();
    if (Number.isNaN(ms)) return null;
    return `/Date(${ms})/`;
}

function _toLegacyTime(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function _safeText(res, fallbackMsg) {
    return res.text().then(t => t || fallbackMsg).catch(() => fallbackMsg);
}

function _mapNestPatientToLegacy(p) {
    return {
        benhnhanId: p.id,
        hoten: p.fullName || '',
        gioitinh: p.gender || '',
        ngaysinh: _toLegacyTicks(p.dateOfBirth),
        giosinh: p.timeOfBirth || null,
        diachi: p.address || null,
        tinhthanhId: null,
        dienthoai: p.phone || null,
        benhsu: p.medicalHistory || null,
        ghichu: p.notes || null,
        cmnd: null
    };
}

function _mapLegacyPatientToNest(payload) {
    return {
        fullName: payload.hoten || '',
        gender: payload.gioitinh || '',
        dateOfBirth: payload.ngaysinh || undefined,
        address: payload.diachi || undefined,
        phone: payload.dienthoai || undefined,
        notes: payload.ghichu || undefined
    };
}

function _mapNestExamToLegacy(exam) {
    if (!exam) return null;

    // Tìm trường chứa dữ liệu đo (inputData), chấp nhận mọi kiểu viết hoa/thường
    let rawInput = {};
    const inputField = Object.keys(exam).find(k => k.toLowerCase() === 'inputdata');
    if (inputField) {
        rawInput = exam[inputField] || {};
    } else {
        // Có thể backend trả về dạng phẳng (flattened)
        rawInput = exam; 
    }
    
    // Nếu là chuỗi JSON
    if (typeof rawInput === 'string') {
        try {
            rawInput = JSON.parse(rawInput);
        } catch (e) {
            rawInput = {};
        }
    }

    // Chuẩn hóa key của các chỉ số đo về lowercase
    const input = {};
    for (const key in rawInput) {
        input[key.toLowerCase()] = rawInput[key];
    }

    // Lấy ID phiếu và ID bệnh nhân (chấp nhận cả id/patientId/patientid)
    const phieukhamId = exam.id || exam.phieukhamId || exam.phieukham_id;
    const benhnhanId = exam.patientId || exam.patientid || exam.benhnhanId;

    return {
        phieukhamId: phieukhamId,
        benhnhanId: benhnhanId,
        ngaykham: _toLegacyTicks(exam.createdAt || exam.createdat) || (exam.createdAt || exam.createdat),
        giokham: _toLegacyTime(exam.createdAt || exam.createdat),
        nhietdoMoitruong: Number(input.nhietdomoitruong ?? 0),
        tieutruongTrai: Number(input.tieutruongtrai ?? 0),
        tieutruongPhai: Number(input.tieutruongphai ?? 0),
        tamTrai: Number(input.tamtrai ?? 0),
        tamPhai: Number(input.tamphai ?? 0),
        tamtieuTrai: Number(input.tamtieutrai ?? 0),
        tamtieuPhai: Number(input.tamtieuphai ?? 0),
        tambaoTrai: Number(input.tambaotrai ?? 0),
        tambaoPhai: Number(input.tambaophai ?? 0),
        daitrangTrai: Number(input.daitrangtrai ?? 0),
        daitrangPhai: Number(input.daitrangphai ?? 0),
        pheTrai: Number(input.phetrai ?? 0),
        phePhai: Number(input.phephai ?? 0),
        bangquangTrai: Number(input.bangquangtrai ?? 0),
        bangquangPhai: Number(input.bangquangphai ?? 0),
        thanTrai: Number(input.thantrai ?? 0),
        thanPhai: Number(input.thanphai ?? 0),
        damTrai: Number(input.damtrai ?? 0),
        damPhai: Number(input.damphai ?? 0),
        viTrai: Number(input.vitrai ?? 0),
        viPhai: Number(input.viphai ?? 0),
        canTrai: Number(input.cantrai ?? 0),
        canPhai: Number(input.canphai ?? 0),
        tyTrai: Number(input.tytrai ?? 0),
        tyPhai: Number(input.typhai ?? 0),
        _backendSyndromes: exam.syndromes || [],
        _backendAmDuong: exam.amDuong || null,
        _backendKhi: exam.khi || null,
        _backendHuyet: exam.huyet || null,
        _backendFlags: exam.flags || [],
    };
}

function _mapLegacyExamToNest(payload) {
    const n = (v) => {
        const x = Number(v);
        return Number.isFinite(x) ? x : 0;
    };

    return {
        patientId: Number(payload.benhnhanId),
        tieutruongtrai: n(payload.tieutruongTrai),
        tieutruongphai: n(payload.tieutruongPhai),
        tamtrai: n(payload.tamTrai),
        tamphai: n(payload.tamPhai),
        tamtieutrai: n(payload.tamtieuTrai),
        tamtieuphai: n(payload.tamtieuPhai),
        tambaotrai: n(payload.tambaoTrai),
        tambaophai: n(payload.tambaoPhai),
        daitrangtrai: n(payload.daitrangTrai),
        daitrangphai: n(payload.daitrangPhai),
        phetrai: n(payload.pheTrai),
        phephai: n(payload.phePhai),
        bangquangtrai: n(payload.bangquangTrai),
        bangquangphai: n(payload.bangquangPhai),
        thantrai: n(payload.thanTrai),
        thanphai: n(payload.thanPhai),
        damtrai: n(payload.damTrai),
        damphai: n(payload.damPhai),
        vitrai: n(payload.viTrai),
        viphai: n(payload.viPhai),
        cantrai: n(payload.canTrai),
        canphai: n(payload.canPhai),
        tytrai: n(payload.tyTrai),
        typhai: n(payload.tyPhai),
        notes: payload.ghichu || undefined
    };
}

// ---- BỆNH NHÂN ----

async function apiGetPatients() {
    const res = await fetch(_base() + '/patients');
    if (!res.ok) throw new Error('Không tải được danh sách bệnh nhân từ Nest backend');
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(_mapNestPatientToLegacy) : [];
}

async function apiAddPatient(payload) {
    const res = await fetch(_base() + '/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyPatientToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo bệnh nhân thất bại') };
    const data = await res.json();
    return { success: true, id: data.id };
}

async function apiUpdatePatient(payload) {
    const id = payload.benhnhanId;
    const res = await fetch(_base() + '/patients/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyPatientToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật bệnh nhân thất bại') };
    const data = await res.json();
    return { success: true, id: data.id };
}

async function apiDeletePatient(benhnhanId) {
    const res = await fetch(_base() + '/patients/' + benhnhanId, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa bệnh nhân thất bại') };
    return { success: true };
}

// ---- PHIẾU KHÁM ----

async function apiGetRecords() {
    const res = await fetch(_base() + '/examinations');
    if (!res.ok) throw new Error('Không tải được danh sách phiếu khám từ Nest backend');
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(_mapNestExamToLegacy) : [];
}

async function apiGetRecord(id) {
    const res = await fetch(_base() + '/examinations/' + id);
    if (!res.ok) return null;
    const row = await res.json();
    return _mapNestExamToLegacy(row);
}

async function apiSaveRecord(payload, isEditing) {
    const id = payload.phieukhamId;
    const url = isEditing ? (_base() + '/examinations/' + id) : (_base() + '/examinations');
    const method = isEditing ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyExamToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Lưu phiếu khám thất bại') };
    const data = await res.json();
    return { success: true, phieukhamId: data.id ?? id };
}

async function apiDeleteRecord(phieukhamId) {
    const res = await fetch(_base() + '/examinations/' + phieukhamId, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa phiếu khám thất bại') };
    return { success: true };
}

// ---- MÔ HÌNH BỆNH ----

const _MERID_KEYS = [
    'tieutruong','tam','tamtieu','tambao','daitrang','phe',
    'bangquang','than','dam','vi','can','ty'
];

function _mapNestModelToLegacy(m) {
    const obj = {
        modelId: m.id,
        ten: m.tieuket || '',
        nhomChinh: m.nhomid != null ? String(m.nhomid) : '',
        trieuchung: m.trieuchung || '',
        phaptri: m.benhly || '',
        phuonghuyet: m.phuyet_chamcuu || '',
        giainghia_phuyet: m.giainghia_phuyet || '',
    };
    _MERID_KEYS.forEach(k => {
        obj[k] = m[k] ?? 0;
        obj[k + '_c8'] = m[k + '_c8'] ?? 0;
        obj[k + '_c11'] = m[k + '_c11'] ?? 0;
    });
    return obj;
}

function _mapLegacyModelToNest(payload) {
    const dto = {
        tieuket: payload.ten || '',
        nhomid: payload.nhom_chinh ? parseInt(payload.nhom_chinh) || null : null,
        trieuchung: payload.trieuchung || '',
        benhly: payload.phaptri || '',
        phuyet_chamcuu: payload.phuonghuyet || '',
    };
    if (payload.kich_hoat_tu_kinh) {
        try {
            const kh = JSON.parse(payload.kich_hoat_tu_kinh);
            _MERID_KEYS.forEach(k => {
                if (kh[k] !== undefined) dto[k] = parseInt(kh[k]) || 0;
            });
        } catch {}
    }
    return dto;
}

async function apiGetModels() {
    const res = await fetch(_base() + '/models');
    if (!res.ok) throw new Error('Không tải được danh sách mô hình bệnh');
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(_mapNestModelToLegacy) : [];
}

async function apiCreateModel(payload) {
    const res = await fetch(_base() + '/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyModelToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo mô hình thất bại') };
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        return { success: true, id: data.id };
    } catch {
        return { success: false, error: text || 'Phản hồi không phải JSON hợp lệ khi tạo mô hình' };
    }
}

async function apiUpdateModel(modelId, payload) {
    const res = await fetch(_base() + '/models/' + modelId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyModelToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật mô hình thất bại') };
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        return { success: true, id: data.id };
    } catch {
        return { success: false, error: text || 'Phản hồi không phải JSON hợp lệ khi cập nhật mô hình' };
    }
}

async function apiDeleteModel(modelId) {
    const res = await fetch(_base() + '/models/' + modelId, { method: 'DELETE' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text }; }
}

// Lấy mô hình đã chọn cho một phiếu khám
async function apiGetRecordModels(phieukhamId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models');
    if (!res.ok) {
        const msg = await _safeText(res, 'Không tải được mô hình đã chọn');
        throw new Error(msg);
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error('Không tải được mô hình đã chọn (phản hồi không hợp lệ)'); }
}

// Thêm / cập nhật mô hình được chọn cho phiếu khám
async function apiSaveRecordModel(phieukhamId, payload) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const msg = await _safeText(res, 'Lưu mô hình thất bại');
        return { success: false, error: msg };
    }
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: 'Phản hồi từ server không hợp lệ' }; }
}

// Bỏ chọn mô hình khỏi phiếu khám
async function apiRemoveRecordModel(phieukhamId, modelId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models/' + modelId, { method: 'DELETE' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text }; }
}

// ---- CHECKLIST GIA GIẢM ----

async function apiGetRecordChecklist(phieukhamId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/checklist');
    if (!res.ok) throw new Error('Không tải được checklist của phiếu');
    return res.json();
}

async function apiPutRecordChecklist(phieukhamId, items) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text || res.status }; }
}

async function apiSeedRecordChecklist(phieukhamId, force = false) {
    const url = _base() + '/records/' + phieukhamId + '/checklist/seed' + (force ? '?force=true' : '');
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text || res.status }; }
}

async function apiGetPatientChecklistDefault(benhnhanId) {
    const res = await fetch(_base() + '/patients/' + benhnhanId + '/checklist-default');
    if (!res.ok) throw new Error('Không tải được checklist mặc định của bệnh nhân');
    return res.json();
}

async function apiPutPatientChecklistDefault(benhnhanId, items) {
    const res = await fetch(_base() + '/patients/' + benhnhanId + '/checklist-default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text || res.status }; }
}

async function apiNormalizeRecordChecklist(phieukhamId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/checklist/normalize', { method: 'POST' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text || res.status }; }
}

async function apiSummarizeSelectedModels(phieukhamId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models/summary', { method: 'POST' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text || res.status }; }
}

// ---- CHỦNG BỆNH ----

async function apiGetChungBenh() {
    const res = await fetch(_base() + '/chung-benh');
    if (!res.ok) throw new Error('Không tải được danh sách chủng bệnh');
    return res.json();
}

async function apiGetChungBenhById(id) {
    const res = await fetch(_base() + '/chung-benh/' + id);
    if (!res.ok) throw new Error('Không tìm thấy chủng bệnh');
    return res.json();
}

async function apiCreateChungBenh(payload) {
    const res = await fetch(_base() + '/chung-benh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo chủng bệnh thất bại') };
    const data = await res.json();
    return { success: true, id: data.id, data };
}

async function apiUpdateChungBenh(id, payload) {
    const res = await fetch(_base() + '/chung-benh/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật chủng bệnh thất bại') };
    const data = await res.json();
    return { success: true, data };
}

async function apiDeleteChungBenh(id) {
    const res = await fetch(_base() + '/chung-benh/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa chủng bệnh thất bại') };
    return { success: true };
}

// ---- BỆNH TÂY Y ----

async function apiGetBenhTayY() {
    const res = await fetch(_base() + '/benh-tay-y');
    if (!res.ok) throw new Error('Không tải được danh sách bệnh tây y');
    return res.json();
}

async function apiGetBenhTayYById(id) {
    const res = await fetch(_base() + '/benh-tay-y/' + id);
    if (!res.ok) throw new Error('Không tìm thấy bệnh tây y');
    return res.json();
}

async function apiCreateBenhTayY(payload) {
    const res = await fetch(_base() + '/benh-tay-y', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo bệnh tây y thất bại') };
    const data = await res.json();
    return { success: true, id: data.id, data };
}

async function apiUpdateBenhTayY(id, payload) {
    const res = await fetch(_base() + '/benh-tay-y/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật bệnh tây y thất bại') };
    const data = await res.json();
    return { success: true, data };
}

async function apiDeleteBenhTayY(id) {
    const res = await fetch(_base() + '/benh-tay-y/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa bệnh tây y thất bại') };
    return { success: true };
}

// ---- TRIỆU CHỨNG ----

async function apiGetTrieuChung() {
    const res = await fetch(_base() + '/trieu-chung');
    if (!res.ok) throw new Error('Không tải được danh sách triệu chứng');
    return res.json();
}

async function apiCreateTrieuChung(payload) {
    const res = await fetch(_base() + '/trieu-chung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo triệu chứng thất bại') };
    const data = await res.json();
    return { success: true, id: data.id, data };
}

async function apiUpdateTrieuChung(id, payload) {
    const res = await fetch(_base() + '/trieu-chung/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật triệu chứng thất bại') };
    const data = await res.json();
    return { success: true, data };
}

async function apiDeleteTrieuChung(id) {
    const res = await fetch(_base() + '/trieu-chung/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa triệu chứng thất bại') };
    return { success: true };
}

// ---- KINH MẠCH ----

async function apiGetKinhMach() {
    const res = await fetch(_base() + '/kinh-mach');
    if (!res.ok) throw new Error('Không tải được danh sách kinh mạch');
    return res.json();
}

async function apiCreateKinhMach(payload) {
    const res = await fetch(_base() + '/kinh-mach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo kinh mạch thất bại') };
    return { success: true, data: await res.json() };
}

async function apiUpdateKinhMach(id, payload) {
    const res = await fetch(_base() + '/kinh-mach/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật kinh mạch thất bại') };
    return { success: true, data: await res.json() };
}

async function apiDeleteKinhMach(id) {
    const res = await fetch(_base() + '/kinh-mach/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa kinh mạch thất bại') };
    return { success: true };
}

// ---- HUYỆT VỊ ----

async function apiGetHuyetVi(kinhMachId = null) {
    let url = _base() + '/huyet-vi';
    if (kinhMachId) url += '?kinh_mach=' + kinhMachId;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không tải được danh sách huyệt vị');
    return res.json();
}

async function apiCreateHuyetVi(payload) {
    const res = await fetch(_base() + '/huyet-vi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo huyệt vị thất bại') };
    return { success: true, data: await res.json() };
}

async function apiUpdateHuyetVi(id, payload) {
    const res = await fetch(_base() + '/huyet-vi/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật huyệt vị thất bại') };
    return { success: true, data: await res.json() };
}

async function apiDeleteHuyetVi(id) {
    const res = await fetch(_base() + '/huyet-vi/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa huyệt vị thất bại') };
    return { success: true };
}

// ---- PHÁC ĐỒ ĐIỀU TRỊ ----

async function apiGetPhacDo(benhId = null) {
    let url = _base() + '/phac-do-dieu-tri';
    if (benhId) url += '?benh=' + benhId;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không tải được phác đồ điều trị');
    return res.json();
}

async function apiCreatePhacDo(payload) {
    const res = await fetch(_base() + '/phac-do-dieu-tri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Tạo phác đồ thất bại') };
    return { success: true, data: await res.json() };
}

async function apiUpdatePhacDo(id, payload) {
    const res = await fetch(_base() + '/phac-do-dieu-tri/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật phác đồ thất bại') };
    return { success: true, data: await res.json() };
}

async function apiDeletePhacDo(id) {
    const res = await fetch(_base() + '/phac-do-dieu-tri/' + id, { method: 'DELETE' });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Xóa phác đồ thất bại') };
    return { success: true };
}

// ---- VI THUOC ----
async function apiGetViThuoc() {
    const res = await fetch(_base() + '/vi-thuoc');
    return res.json();
}
async function apiCreateViThuoc(payload) {
    const res = await fetch(_base() + '/vi-thuoc', {
        method: 'POST',
        headers: _authHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}
async function apiUpdateViThuoc(id, payload) {
    const res = await fetch(_base() + '/vi-thuoc/' + id, {
        method: 'PUT',
        headers: _authHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}
async function apiDeleteViThuoc(id) {
    const res = await fetch(_base() + '/vi-thuoc/' + id, { method: 'DELETE', headers: _authHeaders() });
    return res.json();
}

// ---- BAI THUOC ----
async function apiGetBaiThuoc() {
    const res = await fetch(_base() + '/bai-thuoc');
    return res.json();
}
async function apiCreateBaiThuoc(payload) {
    const res = await fetch(_base() + '/bai-thuoc', {
        method: 'POST',
        headers: _authHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}
async function apiUpdateBaiThuoc(id, payload) {
    const res = await fetch(_base() + '/bai-thuoc/' + id, {
        method: 'PUT',
        headers: _authHeaders(),
        body: JSON.stringify(payload)
    });
    return res.json();
}
async function apiDeleteBaiThuoc(id) {
    const res = await fetch(_base() + '/bai-thuoc/' + id, { method: 'DELETE', headers: _authHeaders() });
    return res.json();
}



