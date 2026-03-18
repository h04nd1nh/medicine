// api.js - Lớp mỏng tách UI khỏi NestJS backend
const BASE_NEST = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : '';

function _base() {
    return BASE_NEST;
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
    const input = exam.inputData || {};
    return {
        phieukhamId: exam.id,
        benhnhanId: exam.patientId,
        ngaykham: _toLegacyTicks(exam.createdAt) || exam.createdAt,
        giokham: _toLegacyTime(exam.createdAt),
        nhietdoMoitruong: null,
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
    const data = await res.json();
    return { success: true, id: data.id };
}

async function apiUpdateModel(modelId, payload) {
    const res = await fetch(_base() + '/models/' + modelId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_mapLegacyModelToNest(payload))
    });
    if (!res.ok) return { success: false, error: await _safeText(res, 'Cập nhật mô hình thất bại') };
    const data = await res.json();
    return { success: true, id: data.id };
}

async function apiDeleteModel(modelId) {
    const res = await fetch(_base() + '/models/' + modelId, { method: 'DELETE' });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: false, error: text }; }
}

// Lấy mô hình đã chọn cho một phiếu khám
async function apiGetRecordModels(phieukhamId) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models');
    if (!res.ok) throw new Error('Không tải được mô hình đã chọn');
    return res.json();
}

// Thêm / cập nhật mô hình được chọn cho phiếu khám
async function apiSaveRecordModel(phieukhamId, payload) {
    const res = await fetch(_base() + '/records/' + phieukhamId + '/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.json();
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
