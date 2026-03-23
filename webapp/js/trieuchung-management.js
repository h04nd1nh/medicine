// trieuchung-management.js — Quản lý Triệu chứng tập trung
// Dùng chung cho cả Tây y và Đông y

let _trieuchungData = {
    trieuChung: [],
};

async function initTrieuchungManagement() {
    await loadAllTrieuchungData();
    renderTrieuchungSection();
}

async function loadAllTrieuchungData() {
    try {
        const tc = await apiGetTrieuChung();
        _trieuchungData.trieuChung = tc || [];
    } catch (e) {
        console.error('Lỗi tải dữ liệu Triệu chứng:', e);
    }
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

    const rows = _trieuchungData.trieuChung.map(item => `
        <tr>
            <td><strong>${escHtml(item.ten_trieu_chung)}</strong></td>
            <td style="text-align:center;width:160px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openTrieuChungForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTrieuChung(${item.id})">🗑 Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');

    el.innerHTML = `
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên triệu chứng</th>
                    <th style="text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="2" style="text-align:center;color:#A09580;">Chưa có dữ liệu triệu chứng</td></tr>'}</tbody>
            </table>
        </div>
    `;
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
    renderTrieuchungSection();
}
