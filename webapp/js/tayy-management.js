// tayy-management.js — Quản lý Bệnh Tây Y (CRUD Frontend)
// Bao gồm: Chủng bệnh, Bệnh tây y

let _tayyData = {
    chungBenh: [],
    benhTayY: [],
    baiThuoc: [], // local copy for bài thuốc lookup
    thietChan: [],
    machChan: [],
    activeTab: 'chung-benh',
};

// Draft chips cho bài thuốc đang được chọn trong form bệnh tây y
let _tyDraftBaiThuoc = []; // array of { id, ten_bai_thuoc }
let _tyDraftThietChan = [];
let _tyDraftMachChan = [];
let _tyDraftChungBenhId = null; 

// ─── Khởi tạo ─────────────────────────────────────────────
async function initTayyManagement() {
    await loadAllTayyData();
    renderTayySection();
}

async function loadAllTayyData() {
    try {
        const [cb, bty, bt, thiet, mach] = await Promise.all([
            apiGetChungBenh(),
            apiGetBenhTayY(),
            apiGetBaiThuoc(),
            apiGetThietChan(),
            apiGetMachChan()
        ]);
        _tayyData.chungBenh = cb || [];
        _tayyData.benhTayY = bty || [];
        _tayyData.baiThuoc = bt || [];
        _tayyData.thietChan = thiet || [];
        _tayyData.machChan = mach || [];
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
    }
}

// ═══════════════════════════════════════════════════════════
// TAB: CHỦNG BỆNH
// ═══════════════════════════════════════════════════════════
function renderChungBenhTab(el) {
    const rows = _tayyData.chungBenh.map(item => {
        const id = item.id || item.id_chung_benh || item.ID || '';
        const ten = item.ten_chung_benh || item.name || '';
        return `
            <tr>
                <td><strong>${escHtml(ten)}</strong></td>
                <td style="text-align:center;width:160px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openChungBenhForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteChungBenh(${id})">🗑 Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openChungBenhForm()">+ Thêm chủng bệnh</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr><th>Tên chủng bệnh</th><th style="width:160px; text-align:center;">Thao tác</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="2" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
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

// Lấy triệu chứng từ bài thuốc (dựa trên bài thuốc đã chọn)
function _tyGetTrieuChungFromBaiThuoc(baiThuocList) {
    if (!baiThuocList || baiThuocList.length === 0) return '—';
    const allTC = [];
    for (const bt of baiThuocList) {
        const tc = bt.trieu_chung || '';
        if (tc) {
            tc.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!allTC.includes(s)) allTC.push(s);
            });
        }
    }
    return allTC.length > 0 ? allTC.join(', ') : '—';
}

function renderBenhTayYTab(el) {
    const rows = _tayyData.benhTayY.map(item => {
        const id = item.id || item.id_benh || '';
        const ten = item.ten_benh || item.name || '';
        const chungBenhName = item.chungBenh ? (item.chungBenh.ten_chung_benh || item.chungBenh.name) : '—';
        const btNames = (item.baiThuocList || []).map(p => escHtml(p.ten_bai_thuoc || p.name)).join(', ') || '—';
        const tcFromBT = _tyGetTrieuChungFromBaiThuoc(item.baiThuocList || []);
        const thietChanStr = (item.thietChanList || []).map(x => escHtml(x.ten_thiet_chan || x.name)).join(', ') || '—';
        const machChanStr = (item.machChanList || []).map(x => escHtml(x.ten_mach_chan || x.name)).join(', ') || '—';
        return `
            <tr>
                <td><strong>${escHtml(ten)}</strong></td>
                <td><span style="color:#8B7355;">${escHtml(chungBenhName)}</span></td>
                <td style="font-size:0.82rem; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${btNames}</td>
                <td style="font-size:0.82rem; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${escHtml(tcFromBT)}</td>
                <td style="font-size:0.82rem;">${thietChanStr}</td>
                <td style="font-size:0.82rem;">${machChanStr}</td>
                <td style="text-align:center;width:160px;">
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="openBenhTayYForm(${id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBenhTayY(${id})">🗑 Xóa</button>
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
                    <th>Tên bệnh</th>
                    <th>Chủng bệnh</th>
                    <th>Bài thuốc</th>
                    <th>Triệu chứng (từ bài thuốc)</th>
                    <th>Thiệt chẩn</th>
                    <th>Mạch chẩn</th>
                    <th style="width:160px;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#A09580;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function openBenhTayYForm(id) {
    const item = id ? _tayyData.benhTayY.find(x => x.id === id) : null;
    const title = item ? 'Sửa bệnh tây y' : 'Thêm bệnh tây y mới';

    // Khởi tạo draft bài thuốc từ dữ liệu hiện có
    _tyDraftBaiThuoc = (item?.baiThuocList || []).map(bt => ({
        id: bt.id,
        ten_bai_thuoc: bt.ten_bai_thuoc || bt.name || '',
    }));

    showTayyModal(title, `
        <label class="tayy-form-label">Tên bệnh<br>
            <input id="tayy-inp-tenbenh" type="text" class="tayy-form-input" value="${item ? escHtml(item.ten_benh) : ''}" placeholder="Nhập tên bệnh...">
        </label>

        <label class="tayy-form-label">Chủng bệnh
            <div style="position:relative; margin-top:6px;">
                <div id="tayy-cb-chips" class="chips-container" onclick="document.getElementById('tayy-inp-cb-search').focus()">
                    <!-- Selected Chủng bệnh Chip -->
                    <input id="tayy-inp-cb-search" type="text" class="chip-input" 
                        placeholder="Tìm chủng bệnh..." 
                        onfocus="tyOnChungBenhSearchInput(this.value)"
                        oninput="tyOnChungBenhSearchInput(this.value)">
                </div>
                <div id="tayy-cb-suggest" class="tayy-suggest-box"></div>
            </div>
        </label>

        <!-- Bài thuốc liên quan — chip-based with soft create -->
        <label class="tayy-form-label">
            Bài thuốc liên quan
            <div style="position:relative; margin-top:6px;">
                <div id="tayy-bt-chips" class="chips-container" onclick="document.getElementById('tayy-inp-bt-search').focus()">
                    <input id="tayy-inp-bt-search" type="text" class="chip-input"
                        placeholder="Gõ tên bài thuốc để thêm..."
                        onfocus="tyOnBaiThuocSearchInput(this.value)"
                        oninput="tyOnBaiThuocSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){tySelectBaiThuocByName(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="tayy-bt-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px); background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:220px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <label class="tayy-form-label" style="margin-top:10px;">Thiệt chẩn
            <div style="position:relative; margin-top:6px;">
                <div id="tayy-thietchan-chips" class="chips-container" onclick="document.getElementById('tayy-inp-thietchan-search').focus()">
                    <input id="tayy-inp-thietchan-search" type="text" class="chip-input"
                        placeholder="Gõ tên thiệt chẩn để thêm..."
                        onfocus="tyOnThietChanSearchInput(this.value)"
                        oninput="tyOnThietChanSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){tySelectThietChanByName(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="tayy-thietchan-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px); background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:220px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <label class="tayy-form-label" style="margin-top:10px;">Mạch chẩn
            <div style="position:relative; margin-top:6px;">
                <div id="tayy-machchan-chips" class="chips-container" onclick="document.getElementById('tayy-inp-machchan-search').focus()">
                    <input id="tayy-inp-machchan-search" type="text" class="chip-input"
                        placeholder="Gõ tên mạch chẩn để thêm..."
                        onfocus="tyOnMachChanSearchInput(this.value)"
                        oninput="tyOnMachChanSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter' && this.value.trim()){tySelectMachChanByName(this.value.trim()); event.preventDefault();}">
                </div>
                <div id="tayy-machchan-suggest" style="position:absolute; left:0; right:0; top:calc(100% + 4px); background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:220px; overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <!-- Triệu chứng (read-only, từ bài thuốc đã chọn) -->
        <div class="tayy-form-label">Triệu chứng <span style="font-weight:400; color:#A09580; font-size:0.82rem;">(tự động lấy từ bài thuốc)</span>
            <div id="tayy-trieuchung-preview" style="min-height:36px; border:1px solid #D4C5A0; padding:10px; border-radius:8px; background:#F5F0E8; color:#5B3A1A; font-size:0.85rem; line-height:1.5;">
                ${escHtml(_tyGetTrieuChungFromDraft())}
            </div>
        </div>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveBenhTayY(${id || 0})">Lưu</button>
        </div>
    `, 'wide');

    _tyDraftThietChan = (item?.thietChanList || []).map(x => ({ id: x.id, name: x.ten_thiet_chan || x.name }));
    _tyDraftMachChan = (item?.machChanList || []).map(x => ({ id: x.id, name: x.ten_mach_chan || x.name }));

    // Render chips sau khi modal đã mở
    _tyDraftChungBenhId = item ? (item.idChungBenh || item.chungBenh?.id) : null;

    setTimeout(() => {
        tyRenderChungBenhChip();
        tyRenderBaiThuocChips();
        tyRenderThietChanChips();
        tyRenderMachChanChips();
        tyUpdateTrieuChungPreview();
        document.getElementById('tayy-inp-tenbenh')?.focus();
    }, 100);
}

function editBenhTayY(id) { openBenhTayYForm(id); }

async function saveBenhTayY(id) {
    const tenBenh = document.getElementById('tayy-inp-tenbenh')?.value.trim();
    const idChungBenh = _tyDraftChungBenhId;

    if (!tenBenh) return alert('Vui lòng nhập tên bệnh');
    if (!idChungBenh) return alert('Vui lòng chọn chủng bệnh');

    const btIds = _tyDraftBaiThuoc.map(bt => bt.id);

    const payload = {
        ten_benh: tenBenh,
        id_chung_benh: idChungBenh,
        bai_thuoc_ids: btIds,
        trieu_chung_ids: [], // Triệu chứng giờ lấy từ bài thuốc, không lưu riêng
        thiet_chan_ids: _tyDraftThietChan.map(x => x.id),
        mach_chan_ids: _tyDraftMachChan.map(x => x.id)
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
// CHỦNG BỆNH CHIPS (Single select mode)
// ═══════════════════════════════════════════════════════════
function tyRenderChungBenhChip() {
    const container = document.getElementById('tayy-cb-chips');
    const input = document.getElementById('tayy-inp-cb-search');
    if (!container || !input) return;

    container.querySelectorAll('.chip').forEach(c => c.remove());
    
    if (_tyDraftChungBenhId) {
        const cb = _tayyData.chungBenh.find(x => x.id == _tyDraftChungBenhId);
        if (cb) {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:#F5F0E8; color:#5B3A1A; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:600; border:1px solid #D4C5A0; transition:all 0.2s; user-select:none; box-shadow:0 1px 2px rgba(0,0,0,0.02); margin:2px;';
            chip.innerHTML = `${escHtml(cb.ten_chung_benh || cb.name)} <span class="chip-remove" style="cursor:pointer; font-size:1rem; line-height:1; color:#A64444; display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; transition:all 0.2s; margin-right:-2px;" onclick="tyRemoveChungBenh(); event.stopPropagation();">×</span>`;
            container.insertBefore(chip, input);
            input.placeholder = "";
        }
    } else {
        input.placeholder = "Tìm chủng bệnh...";
    }
}

function tyRemoveChungBenh() {
    _tyDraftChungBenhId = null;
    tyRenderChungBenhChip();
}

function tyOnChungBenhSearchInput(val) {
    const suggestEl = document.getElementById('tayy-cb-suggest');
    const query = (val || '').trim().toLowerCase();
    if (!suggestEl) return;

    if (_tyDraftChungBenhId && !query && val !== '') {
        suggestEl.style.display = 'none';
        return;
    }

    const matches = (_tayyData.chungBenh || [])
        .filter(cb => (cb.ten_chung_benh || cb.name || '').toLowerCase().includes(query))
        .slice(0, 15);

    let html = '';
    if (matches.length > 0) {
        html = matches.map(cb => `
            <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8; transition:background 0.2s;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="tySelectChungBenh(${cb.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(cb.ten_chung_benh || cb.name)}</div>
            </div>
        `).join('');
    } else if (query) {
        html = `<div style="padding:10px; color:#A09580; font-size:0.85rem;">Không tìm thấy chủng bệnh</div>`;
    }

    // Nếu query rỗng và không có matches, thử hiện toàn bộ danh sách (dropdown behavior)
    if (!html && !query) {
        const all = (_tayyData.chungBenh || []).slice(0, 20);
        if (all.length > 0) {
            html = all.map(cb => `
                <div class="tayy-suggest-item" 
                     onmouseover="this.style.background='#F5F0E8'"
                     onmouseout="this.style.background='transparent'"
                     onclick="tySelectChungBenh(${cb.id})">
                    <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(cb.ten_chung_benh || cb.name)}</div>
                </div>
            `).join('');
        }
    }

    suggestEl.style.display = html ? 'block' : 'none';
    suggestEl.innerHTML = html;
}

function tySelectChungBenh(id) {
    if (!id) return;
    _tyDraftChungBenhId = id;
    tyRenderChungBenhChip();
    const suggestEl = document.getElementById('tayy-cb-suggest');
    const inp = document.getElementById('tayy-inp-cb-search');
    if (suggestEl) suggestEl.style.display = 'none';
    if (inp) { inp.value = ''; inp.focus(); }
}

// ═══════════════════════════════════════════════════════════
// BÀI THUỐC CHIPS — search, select, soft create, remove
// ═══════════════════════════════════════════════════════════
function tyRenderBaiThuocChips() {
    const container = document.getElementById('tayy-bt-chips');
    const input = document.getElementById('tayy-inp-bt-search');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _tyDraftBaiThuoc.forEach(bt => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:#F5F0E8; color:#5B3A1A; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:600; border:1px solid #D4C5A0; transition:all 0.2s; user-select:none; box-shadow:0 1px 2px rgba(0,0,0,0.02); margin:2px;';
        chip.innerHTML = `${escHtml(bt.ten_bai_thuoc)} <span class="chip-remove" style="cursor:pointer; font-size:1rem; line-height:1; color:#A64444; display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; transition:all 0.2s; margin-right:-2px;" onclick="tyRemoveBaiThuocChip(${bt.id}); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}

function tyRemoveBaiThuocChip(btId) {
    _tyDraftBaiThuoc = _tyDraftBaiThuoc.filter(x => x.id !== btId);
    tyRenderBaiThuocChips();
    tyUpdateTrieuChungPreview();
    const inp = document.getElementById('tayy-inp-bt-search');
    if (inp && inp.value) tyOnBaiThuocSearchInput(inp.value);
}

function tySelectBaiThuoc(btId) {
    if (!btId || _tyDraftBaiThuoc.some(x => x.id === btId)) return;
    const bt = _tayyData.baiThuoc.find(x => x.id === btId);
    if (!bt) return;
    _tyDraftBaiThuoc.push({ id: bt.id, ten_bai_thuoc: bt.ten_bai_thuoc || bt.name });
    const inp = document.getElementById('tayy-inp-bt-search');
    if (inp) { inp.value = ''; inp.focus(); }
    tyRenderBaiThuocChips();
    tyUpdateTrieuChungPreview();
    const suggestEl = document.getElementById('tayy-bt-suggest');
    if (suggestEl) { suggestEl.style.display = 'none'; suggestEl.innerHTML = ''; }
}

function tySelectBaiThuocByName(name) {
    if (!name) return;
    const bt = _tayyData.baiThuoc.find(x => (x.ten_bai_thuoc || x.name || '').toLowerCase() === name.toLowerCase());
    if (bt) {
        tySelectBaiThuoc(bt.id);
    } else {
        tySoftCreateBaiThuoc(name);
    }
}

function tyOnBaiThuocSearchInput(val) {
    const suggestEl = document.getElementById('tayy-bt-suggest');
    if (!suggestEl) return;
    const query = (val || '').trim().toLowerCase();
    if (!query) { suggestEl.style.display = 'none'; return; }

    const selectedIds = new Set(_tyDraftBaiThuoc.map(bt => bt.id));
    const matches = (_tayyData.baiThuoc || [])
        .filter(bt => (bt.ten_bai_thuoc || bt.name || '').toLowerCase().includes(query))
        .filter(bt => !selectedIds.has(bt.id))
        .slice(0, 10);

    const hasExactMatch = (_tayyData.baiThuoc || []).some(bt => (bt.ten_bai_thuoc || bt.name || '').toLowerCase() === query);

    let html = '';
    if (matches.length > 0) {
        html += matches.map(bt => `
            <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8; transition:background 0.2s;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="tySelectBaiThuoc(${bt.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(bt.ten_bai_thuoc || bt.name)}</div>
                ${(bt.trieu_chung || bt.trieuchung) ? `<div style="font-size:0.75rem; color:#A09580; margin-top:2px;">TC: ${escHtml(bt.trieu_chung || bt.trieuchung)}</div>` : ''}
            </div>
        `).join('');
    } else {
        html += `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy bài thuốc</div>`;
    }

    if (!hasExactMatch && query) {
        html += `
            <div style="padding:8px 12px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px; transition:background 0.2s;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="tySoftCreateBaiThuoc('${escHtml(query)}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm bài thuốc "${escHtml(query)}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

async function tySoftCreateBaiThuoc(name) {
    if (!name) return;
    const inp = document.getElementById('tayy-inp-bt-search');
    const suggestEl = document.getElementById('tayy-bt-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const payload = { ten_bai_thuoc: name };
    const res = await apiCreateBaiThuoc(payload);

    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
    if (!res.success) {
        alert('Lỗi khi thêm bài thuốc mới: ' + (res.error || ''));
        return;
    }

    const newBT = { id: res.id, ten_bai_thuoc: name, ...(res.data || {}) };
    _tayyData.baiThuoc.push(newBT);
    // Cập nhật cả _thuocData nếu tồn tại
    if (typeof _thuocData !== 'undefined') {
        _thuocData.baiThuoc.push(newBT);
    }
    tySelectBaiThuoc(res.id);
}

// Lấy triệu chứng meta từ draft bài thuốc
function _tyGetTrieuChungFromDraft() {
    if (!_tyDraftBaiThuoc || _tyDraftBaiThuoc.length === 0) return '(Chưa chọn bài thuốc)';
    const allTC = [];
    for (const draft of _tyDraftBaiThuoc) {
        // Tìm bài thuốc đầy đủ từ _tayyData
        const bt = _tayyData.baiThuoc.find(x => x.id === draft.id);
        const tc = bt?.trieu_chung || '';
        if (tc) {
            tc.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!allTC.includes(s)) allTC.push(s);
            });
        }
    }
    return allTC.length > 0 ? allTC.join(', ') : '(Bài thuốc chưa có triệu chứng)';
}

function tyUpdateTrieuChungPreview() {
    const el = document.getElementById('tayy-trieuchung-preview');
    if (el) el.textContent = _tyGetTrieuChungFromDraft();
}

// ═══════════════════════════════════════════════════════════
// THIỆT CHẨN CHIPS
// ═══════════════════════════════════════════════════════════
function tyRenderThietChanChips() {
    const container = document.getElementById('tayy-thietchan-chips');
    const input = document.getElementById('tayy-inp-thietchan-search');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _tyDraftThietChan.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:#F5F0E8; color:#5B3A1A; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:600; border:1px solid #D4C5A0; transition:all 0.2s; user-select:none; box-shadow:0 1px 2px rgba(0,0,0,0.02); margin:2px;';
        chip.innerHTML = `${escHtml(item.name)} <span class="chip-remove" style="cursor:pointer; font-size:1rem; line-height:1; color:#A64444; display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; transition:all 0.2s; margin-right:-2px;" onclick="tyRemoveThietChanChip(${item.id}); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}
function tyRemoveThietChanChip(id) {
    _tyDraftThietChan = _tyDraftThietChan.filter(x => x.id !== id);
    tyRenderThietChanChips();
}
function tySelectThietChan(id) {
    if (!id || _tyDraftThietChan.some(x => x.id === id)) return;
    const item = (_tayyData.thietChan || []).find(x => x.id === id);
    if (!item) return;
    _tyDraftThietChan.push({ id: item.id, name: item.ten_thiet_chan || item.name });
    const inp = document.getElementById('tayy-inp-thietchan-search');
    if (inp) { inp.value = ''; inp.focus(); }
    tyRenderThietChanChips();
    const suggestEl = document.getElementById('tayy-thietchan-suggest');
    if (suggestEl) { suggestEl.style.display = 'none'; suggestEl.innerHTML = ''; }
}

function tySelectThietChanByName(name) {
    if (!name) return;
    const item = (_tayyData.thietChan || []).find(x => (x.ten_thiet_chan || x.name || '').toLowerCase() === name.toLowerCase());
    if (item) {
        tySelectThietChan(item.id);
    } else {
        tySoftCreateThietChan(name);
    }
}

function tyOnThietChanSearchInput(val) {
    const suggestEl = document.getElementById('tayy-thietchan-suggest');
    const query = (val || '').trim().toLowerCase();
    if (!suggestEl) return;
    if (!query) { suggestEl.style.display = 'none'; return; }

    const all = (_tayyData.thietChan || []);
    const filtered = all.filter(x => (x.ten_thiet_chan || x.name || '').toLowerCase().includes(query) && !_tyDraftThietChan.some(d => d.id === x.id)).slice(0, 10);
    const hasExact = all.some(x => (x.ten_thiet_chan || x.name || '').toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html = filtered.map(m => `
            <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8; transition:background 0.2s;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="tySelectThietChan(${m.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(m.ten_thiet_chan || m.name)}</div>
            </div>
        `).join('');
    } else {
        html = `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy kết quả</div>`;
    }

    if (!hasExact && query) {
        html += `
            <div style="padding:8px 12px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px; transition:background 0.2s;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="tySoftCreateThietChan('${escHtml(query)}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm "${escHtml(query)}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// MẠCH CHẨN CHIPS
// ═══════════════════════════════════════════════════════════
function tyRenderMachChanChips() {
    const container = document.getElementById('tayy-machchan-chips');
    const input = document.getElementById('tayy-inp-machchan-search');
    if (!container || !input) return;
    container.querySelectorAll('.chip').forEach(c => c.remove());
    _tyDraftMachChan.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.style.cssText = 'display:inline-flex; align-items:center; gap:4px; background:#F5F0E8; color:#5B3A1A; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:600; border:1px solid #D4C5A0; transition:all 0.2s; user-select:none; box-shadow:0 1px 2px rgba(0,0,0,0.02); margin:2px;';
        chip.innerHTML = `${escHtml(item.name)} <span class="chip-remove" style="cursor:pointer; font-size:1rem; line-height:1; color:#A64444; display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; transition:all 0.2s; margin-right:-2px;" onclick="tyRemoveMachChanChip(${item.id}); event.stopPropagation();">×</span>`;
        container.insertBefore(chip, input);
    });
}
function tyRemoveMachChanChip(id) {
    _tyDraftMachChan = _tyDraftMachChan.filter(x => x.id !== id);
    tyRenderMachChanChips();
}
function tySelectMachChan(id) {
    if (!id || _tyDraftMachChan.some(x => x.id === id)) return;
    const item = (_tayyData.machChan || []).find(x => x.id === id);
    if (!item) return;
    _tyDraftMachChan.push({ id: item.id, name: item.ten_mach_chan || item.name });
    const inp = document.getElementById('tayy-inp-machchan-search');
    if (inp) { inp.value = ''; inp.focus(); }
    tyRenderMachChanChips();
    const suggestEl = document.getElementById('tayy-machchan-suggest');
    if (suggestEl) suggestEl.style.display = 'none';
}
function tySelectMachChanByName(name) {
    if (!name) return;
    const item = (_tayyData.machChan || []).find(x => (x.ten_mach_chan || x.name || '').toLowerCase() === name.toLowerCase());
    if (item) {
        tySelectMachChan(item.id);
    } else {
        tySoftCreateMachChan(name);
    }
}
function tyOnMachChanSearchInput(val) {
    const suggestEl = document.getElementById('tayy-machchan-suggest');
    const query = (val || '').trim().toLowerCase();
    if (!suggestEl) return;
    if (!query) { suggestEl.style.display = 'none'; return; }

    const all = (_tayyData.machChan || []);
    const filtered = all.filter(x => (x.ten_mach_chan || x.name || '').toLowerCase().includes(query) && !_tyDraftMachChan.some(d => d.id === x.id)).slice(0, 10);
    const hasExact = all.some(x => (x.ten_mach_chan || x.name || '').toLowerCase() === query);

    let html = '';
    if (filtered.length > 0) {
        html = filtered.map(m => `
            <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8; transition:background 0.2s;"
                 onmouseover="this.style.background='#F5F0E8'"
                 onmouseout="this.style.background='transparent'"
                 onclick="tySelectMachChan(${m.id})">
                <div style="font-weight:700; color:#5B3A1A; font-size:0.82rem;">${escHtml(m.ten_mach_chan || m.name)}</div>
            </div>
        `).join('');
    } else {
        html = `<div style="padding:10px; color:#A09580; font-size:0.82rem;">Không tìm thấy kết quả</div>`;
    }

    if (!hasExact && query) {
        html += `
            <div style="padding:8px 12px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0; margin-top:4px; transition:background 0.2s;"
                 onmouseover="this.style.background='#EFE8D8'"
                 onmouseout="this.style.background='#FAF6EE'"
                 onclick="tySoftCreateMachChan('${escHtml(query)}')">
                <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:1.2rem; line-height:1;">+</span> Thêm "${escHtml(query)}"
                </div>
            </div>
        `;
    }
    suggestEl.style.display = 'block';
    suggestEl.innerHTML = html;
}
async function tySoftCreateThietChan(ten) {
    if (!ten) return;
    const inp = document.getElementById('tayy-inp-thietchan-search');
    const suggestEl = document.getElementById('tayy-thietchan-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateThietChan({ ten_thiet_chan: ten });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }

    if (res.success) {
        const newItem = { id: res.id, name: ten, ...(res.data || {}) };
        _tayyData.thietChan.push(newItem);
        tySelectThietChan(res.id);
    } else alert('Lỗi: ' + res.error);
}

async function tySoftCreateMachChan(ten) {
    if (!ten) return;
    const inp = document.getElementById('tayy-inp-machchan-search');
    const suggestEl = document.getElementById('tayy-machchan-suggest');
    if (inp) { inp.disabled = true; inp.value = 'Đang thêm...'; }
    if (suggestEl) suggestEl.style.display = 'none';

    const res = await apiCreateMachChan({ ten_mach_chan: ten });
    if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }

    if (res.success) {
        const newItem = { id: res.id, name: ten, ...(res.data || {}) };
        _tayyData.machChan.push(newItem);
        tySelectMachChan(res.id);
    } else alert('Lỗi: ' + res.error);
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
    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1400;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;';
    let innerBox;
    if (widthClass === 'analysis') {
        innerBox = 'background:#FFFDF7;width:min(96vw,1520px);max-width:96vw;padding:16px 20px;border-radius:12px;border:1px solid #D4C5A0;box-shadow:0 8px 28px rgba(0,0,0,0.25);max-height:94vh;overflow-y:auto;overflow-x:hidden;position:relative;box-sizing:border-box;';
    } else {
        const isPhapTri = widthClass === 'phap-tri';
        const vwCap = isPhapTri ? '95vw' : '92vw';
        const maxW = isPhapTri ? 'min(98vw, 1080px)' : widthClass === 'wide' ? '780px' : '480px';
        innerBox = `background:#FFFDF7;width:min(${vwCap},${maxW});max-width:100%;padding:16px clamp(12px,3vw,22px) 18px;border-radius:12px;border:1px solid #D4C5A0;box-shadow:0 8px 28px rgba(0,0,0,0.25);max-height:90vh;overflow-y:auto;overflow-x:hidden;position:relative;box-sizing:border-box;`;
    }
    modal.innerHTML = `
        <div style="${innerBox}" onclick="tyCloseAllSuggests(event)" onscroll="document.querySelectorAll('div[id$=-suggest]').forEach(el => el.style.display = 'none')">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #5B3A1A;padding-bottom:8px;margin-bottom:14px;">
                <div style="font-weight:900;color:#5B3A1A;font-size:1rem;">${title}</div>
                <button class="btn" onclick="closeTayyModal()" style="padding:2px 10px;">✕</button>
            </div>
            ${bodyHtml}
        </div>
    `;

    // Khởi tạo phím thoát và click outside
    document.addEventListener('click', tyGlobalSuggestCloser);
}

function tyGlobalSuggestCloser(e) {
    if (!e.target.closest('.chips-container') && !e.target.closest('.tayy-suggest-box') && !e.target.closest('.tayy-suggest-item')) {
        document.querySelectorAll('.tayy-suggest-box').forEach(el => el.style.display = 'none');
    }
}

function tyCloseAllSuggests(e) {
    if (!e.target.closest('.chips-container') && !e.target.closest('.tayy-suggest-box') && !e.target.closest('.tayy-suggest-item')) {
        document.querySelectorAll('.tayy-suggest-box').forEach(el => el.style.display = 'none');
    }
}

function closeTayyModal() {
    if (typeof yhctDestroyAnalysisCharts === 'function') yhctDestroyAnalysisCharts();
    const modal = document.getElementById('tayy-modal');
    if (modal) modal.style.display = 'none';
    document.removeEventListener('click', tyGlobalSuggestCloser);
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

