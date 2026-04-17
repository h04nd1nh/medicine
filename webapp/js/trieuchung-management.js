// trieuchung-management.js — Quản lý Triệu chứng tập trung
// Dùng chung cho cả Tây y và Đông y

let _trieuchungData = {
    trieuChung: [],
    baiThuoc: [],
    phapTri: [],
    benhKinhLac: [],
    benhTayY: [],
};

const _tcPagination = {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
};

async function initTrieuchungManagement() {
    await loadAllTrieuchungData();
    renderTrieuchungSection();
}

async function loadAllTrieuchungData() {
    try {
        const [tc, bt, pt, bkl, bty] = await Promise.all([
            apiGetTrieuChung(_tcPagination.page, _tcPagination.pageSize),
            apiGetBaiThuoc(),
            apiGetPhapTri(),
            apiGetModels(),
            apiGetBenhTayY(),
        ]);
        _trieuchungData.trieuChung = tc?.data || [];
        _tcPagination.totalItems = Number(tc?.total) || 0;
        _tcPagination.totalPages = Number(tc?.totalPages) || 1;
        _tcPagination.page = Number(tc?.page) || _tcPagination.page;
        _trieuchungData.baiThuoc = bt || [];
        _trieuchungData.phapTri = pt || [];
        _trieuchungData.benhKinhLac = bkl || [];
        _trieuchungData.benhTayY = bty || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Triệu chứng:', e);
    }
}

function tcNorm(v) {
    return String(v || '').trim().toLowerCase();
}

function tcCsvToSet(v) {
    return new Set(
        String(v || '')
            .split(/[,;\n\r]+/)
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => x.toLowerCase()),
    );
}

function tcJoinNames(arr, max = 3) {
    const list = Array.from(new Set((arr || []).map((x) => String(x || '').trim()).filter(Boolean)));
    if (!list.length) return '—';
    if (list.length <= max) return list.join(', ');
    return list.slice(0, max).join(', ') + ` (+${list.length - max})`;
}

function tcBuildRelated(item) {
    const name = String(item?.ten_trieu_chung || '').trim();
    const key = tcNorm(name);
    if (!key) return { baiThuoc: [], benhDongY: [], benhKinhLac: [], benhTayY: [] };

    const baiThuoc = (_trieuchungData.baiThuoc || [])
        .filter((b) => tcCsvToSet(b.trieu_chung).has(key))
        .map((b) => b.ten_bai_thuoc || b.tenBaiThuoc || `#${b.id}`);

    const benhKinhLac = (_trieuchungData.benhKinhLac || [])
        .filter((m) => tcCsvToSet(m.trieuchung).has(key))
        .map((m) => m.tieuket || m.ten || `#${m.id}`);

    const benhDongY = (_trieuchungData.phapTri || [])
        .flatMap((p) => {
            const trieuChungList = p.trieu_chung_list || p.trieuChungList || [];
            const hasInList = Array.isArray(trieuChungList)
                ? trieuChungList.some((t) => tcNorm(t?.ten_trieu_chung) === key)
                : false;
            const hasInText = tcCsvToSet(p.trieu_chung_mo_ta).has(key);
            if (!hasInList && !hasInText) return [];
            const benhDongYList = p.benh_dong_y_list || p.benhDongYList || [];
            if (Array.isArray(benhDongYList) && benhDongYList.length) {
                return benhDongYList
                    .map((b) => b?.tieuket || b?.ten)
                    .filter(Boolean);
            }
            const benh = p.benh_dong_y || p.benhDongY;
            const benhName = benh?.tieuket || benh?.ten;
            return benhName ? [benhName] : [];
        });

    const benhTayY = (_trieuchungData.benhTayY || [])
        .filter((b) => {
            const list = b.trieuChungList || b.trieu_chung_list || [];
            return Array.isArray(list) && list.some((t) => tcNorm(t?.ten_trieu_chung) === key);
        })
        .map((b) => b.ten_benh || b.tenBenh || b.name || `#${b.id}`);

    return { baiThuoc, benhDongY, benhKinhLac, benhTayY };
}

function renderTrieuchungSection() {
    const container = document.getElementById('trieuchung-section');
    if (!container) return;

    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <h2 style="color: var(--secondary); margin:0;">Quản Lý Triệu Chứng Hệ Thống</h2>
            </div>
            
            <div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
                <button class="btn btn-primary" onclick="openTrieuChungForm()">+ Thêm triệu chứng mới</button>
            </div>

            <div id="trieuchung-table-container"></div>
        </div>
    `;

    renderTrieuchungTable();
}

function renderTrieuchungTable() {
    const el = document.getElementById('trieuchung-table-container');
    if (!el) return;

    const totalItems = _tcPagination.totalItems;
    const totalPages = Math.max(1, _tcPagination.totalPages);
    const start = (_tcPagination.page - 1) * _tcPagination.pageSize;
    const from = totalItems ? start + 1 : 0;
    const to = Math.min(start + _trieuchungData.trieuChung.length, totalItems);

    const rows = _trieuchungData.trieuChung.map(item => {
        const related = tcBuildRelated(item);
        return `
        <tr>
            <td><strong>${escHtml(item.ten_trieu_chung)}</strong></td>
            <td style="font-size:0.82rem;">${escHtml(tcJoinNames(related.baiThuoc))}</td>
            <td style="font-size:0.82rem;">${escHtml(tcJoinNames(related.benhDongY))}</td>
            <td style="font-size:0.82rem;">${escHtml(tcJoinNames(related.benhKinhLac))}</td>
            <td style="font-size:0.82rem;">${escHtml(tcJoinNames(related.benhTayY))}</td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openTrieuChungForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrieuChung(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    el.innerHTML = `
        <div class="data-table-container">
            <table style="min-width:1180px;">
                <thead><tr>
                    <th>Tên triệu chứng</th>
                    <th>Bài thuốc liên quan</th>
                    <th>Bệnh Đông y liên quan</th>
                    <th>Bệnh Kinh Lạc liên quan</th>
                    <th>Bệnh Tây y liên quan</th>
                    <th style="text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#A09580;">Chưa có dữ liệu triệu chứng</td></tr>'}</tbody>
            </table>
        </div>
        ${renderTrieuchungPagination(totalItems, totalPages, from, to)}
    `;
}

function renderTrieuchungPagination(totalItems, totalPages, from, to) {
    const disablePrev = _tcPagination.page <= 1 ? 'disabled' : '';
    const disableNext = _tcPagination.page >= totalPages ? 'disabled' : '';

    return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;flex-wrap:wrap;">
            <div style="font-size:0.9rem;color:#666;">
                Hiển thị ${from}-${to} / ${totalItems} triệu chứng
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn btn-sm btn-outline" ${disablePrev} onclick="setTrieuchungPage(${_tcPagination.page - 1})">← Trước</button>
                <span style="font-size:0.9rem;color:#444;">Trang ${_tcPagination.page}/${totalPages}</span>
                <button class="btn btn-sm btn-outline" ${disableNext} onclick="setTrieuchungPage(${_tcPagination.page + 1})">Sau →</button>
            </div>
        </div>
    `;
}

async function setTrieuchungPage(page) {
    const totalPages = Math.max(1, _tcPagination.totalPages);
    const nextPage = Math.max(1, Math.min(page, totalPages));
    if (nextPage === _tcPagination.page) return;
    _tcPagination.page = nextPage;
    await loadAllTrieuchungData();
    renderTrieuchungTable();
}

function openTrieuChungForm(id) {
    const item = id ? _trieuchungData.trieuChung.find(x => x.id === id) : null;
    const title = item ? 'Sửa triệu chứng' : 'Thêm triệu chứng tập trung';

    showTayyModal(title, `
        <label class="tayy-form-label">Tên triệu chứng<br>
            <input id="shared-inp-tc" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_trieu_chung) : ''}" placeholder="Nhập tên triệu chứng...">
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveSharedTrieuChung(${id || 0})">Lưu</button>
        </div>
    `);
    setTimeout(() => document.getElementById('shared-inp-tc')?.focus(), 100);
}

async function saveSharedTrieuChung(id) {
    const val = document.getElementById('shared-inp-tc')?.value.trim();
    if (!val) return alert('Vui lòng nhập tên triệu chứng');

    let result;
    if (id) {
        result = await apiUpdateTrieuChung(id, { ten_trieu_chung: val });
    } else {
        result = await apiCreateTrieuChung({ ten_trieu_chung: val });
    }

    if (!result.success && result.success !== undefined) return alert(result.error || 'Thao tác thất bại');
    
    closeTayyModal();
    await loadAllTrieuchungData();
    renderTrieuchungSection();
}

async function deleteTrieuChung(id) {
    if (!confirm('Bạn có chắc muốn xóa triệu chứng này khỏi hệ thống?')) return;
    const result = await apiDeleteTrieuChung(id);
    if (!result.success && result.success !== undefined) return alert(result.error || 'Xóa thất bại');
    await loadAllTrieuchungData();
    if (!_trieuchungData.trieuChung.length && _tcPagination.page > 1) {
        _tcPagination.page -= 1;
        await loadAllTrieuchungData();
    }
    renderTrieuchungSection();
}
