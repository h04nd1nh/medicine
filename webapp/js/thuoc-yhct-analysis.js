// thuoc-yhct-analysis.js
// Ghi đè các hàm trong thuoc-management.js để thêm chức năng YHCT nâng cao
// Load SAU thuoc-management.js trong index.html

// ═══════════════════════════════════════════════════════════════════════════════
// OVERRIDE: openViThuocForm — Form nhập liệu Vị thuốc đầy đủ YHCT
// ═══════════════════════════════════════════════════════════════════════════════
function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;

    const tuKhiVal  = item?.tu_khi    ?? 0;
    const huongVal  = item?.huong_tgpt ?? 3;

    const tuKhiOptions = [
        { val: -2, label: 'Đại Hàn',  sub: '-2', color: '#2E86C1' },
        { val: -1, label: 'Hàn',      sub: '-1', color: '#5DADE2' },
        { val:  0, label: 'Bình',     sub:  '0', color: '#7D8E80' },
        { val:  1, label: 'Ôn',       sub: '+1', color: '#E59866' },
        { val:  2, label: 'Nhiệt',    sub: '+2', color: '#C0392B' },
    ];
    const huongOptions = [
        { val: 1, label: 'Giáng\nMạnh', color: '#1A6B4A' },
        { val: 2, label: 'Giáng\nNhẹ',  color: '#52BE80' },
        { val: 3, label: 'Bình\nHòa',   color: '#8B7355' },
        { val: 4, label: 'Thăng\nNhẹ',  color: '#E67E22' },
        { val: 5, label: 'Thăng\nMạnh', color: '#8B1A1A' },
    ];
    const NGU_VI_FIELDS = [
        { key: 'vi_toan', label: '🍋 Chua (Toan)', color: '#E8A54A' },
        { key: 'vi_khu',  label: '🌿 Đắng (Khổ)',  color: '#5D7A8A' },
        { key: 'vi_cam',  label: '🍯 Ngọt (Cam)',  color: '#52A354' },
        { key: 'vi_tan',  label: '🌶 Cay (Tân)',   color: '#C0392B' },
        { key: 'vi_ham',  label: '🌊 Mặn (Hàm)',   color: '#2471A3' },
    ];

    const buildRadioGroup = (name, options, selectedVal, dataAttr) => {
        return `<div style="display:flex; gap:5px; margin-top:6px;">` +
            options.map(opt => {
                const checked = (parseFloat(selectedVal) === opt.val) ? 'checked' : '';
                const isActive = (parseFloat(selectedVal) === opt.val);
                const bg = isActive ? opt.color : 'transparent';
                const fg = isActive ? '#fff' : '#5B3A1A';
                const border = isActive ? opt.color : '#D4C5A0';
                return `<label style="flex:1; text-align:center; cursor:pointer;">
                    <input type="radio" name="${name}" value="${opt.val}" ${checked}
                        style="display:none;" onchange="yhctUpdateRadioStyle('${name}', '${dataAttr}')">
                    <div class="yhct-radio-btn" data-${dataAttr}="${opt.val}"
                        style="border:2px solid ${border}; border-radius:8px; padding:6px 3px;
                               background:${bg}; color:${fg}; font-size:0.72rem;
                               line-height:1.3; transition:all 0.15s; white-space:pre-line;
                               data-color="${opt.color}"">
                        <div style="font-weight:800; font-size:0.85rem;">${opt.sub !== undefined ? opt.sub : opt.val}</div>
                        <div style="font-size:0.68rem; opacity:0.9;">${opt.label}</div>
                    </div>
                </label>`;
            }).join('') + `</div>`;
    };

    const nguViHtml = NGU_VI_FIELDS.map(f => {
        const val = item?.[f.key] ?? 0;
        return `<div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                <span style="font-size:0.82rem; font-weight:600; color:#3A3A3A;">${f.label}</span>
                <span id="vt-nv-${f.key}-val"
                    style="font-size:0.95rem; font-weight:800; color:${f.color}; min-width:26px; text-align:right;">${val}</span>
            </div>
            <div style="position:relative;">
                <input type="range" id="vt-nv-${f.key}" min="0" max="5" step="0.5" value="${val}"
                    style="width:100%; accent-color:${f.color}; cursor:pointer;"
                    oninput="document.getElementById('vt-nv-${f.key}-val').textContent = parseFloat(this.value) % 1 === 0 ? parseInt(this.value) : parseFloat(this.value).toFixed(1)">
                <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#B0A090; margin-top:1px;">
                    <span>0 Không</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5 Rất mạnh</span>
                </div>
            </div>
        </div>`;
    }).join('');

    const tuKhiHtml  = buildRadioGroup('vt-tu-khi',  tuKhiOptions,  tuKhiVal, 'tukhi');
    const huongHtml  = buildRadioGroup('vt-huong',   huongOptions,  huongVal, 'huong');

    showTayyModal('📋 Vị thuốc — Nhập liệu YHCT', `
        <div style="display:grid; grid-template-columns:1.3fr 1fr; gap:10px; margin-bottom:10px;">
            <label class="tayy-form-label">Tên vị thuốc *<br>
                <input id="vt-inp-ten" type="text" class="tayy-form-input"
                    value="${item ? escHtml(item.ten_vi_thuoc) : ''}" placeholder="VD: Sơn Tra">
            </label>
            <label class="tayy-form-label">Tên gọi khác<br>
                <input id="vt-inp-alias" type="text" class="tayy-form-input"
                    value="${item ? escHtml(item.ten_goi_khac || '') : ''}" placeholder="VD: Sơn lý hồng...">
            </label>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
            <label class="tayy-form-label">Nhóm dược lý<br>
                <div style="position:relative;">
                    <input id="vt-inp-nhomduocly" type="text" class="tayy-form-input"
                        value="${item ? escHtml(item.nhom_duoc_ly || '') : ''}"
                        oninput="yhctNhomDuocLyInput(this.value)"
                        onfocus="yhctNhomDuocLyInput(this.value)"
                        placeholder="Tiêu thực, Bổ khí...">
                    <div id="vt-nhomduocly-suggest"
                        style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                               background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                               box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:160px;
                               overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
            </label>
            <label class="tayy-form-label">Tác dụng chính<br>
                <input id="vt-inp-tacdungchinh" type="text" class="tayy-form-input"
                    value="${item ? escHtml(item.tac_dung_chinh || '') : ''}"
                    placeholder="VD: Tiêu thịt mỡ, Hoạt huyết">
            </label>
        </div>

        <!-- TỨ KHÍ -->
        <div style="border:2px solid #AECDE8; border-radius:10px; padding:12px; background:linear-gradient(135deg,#EBF4FA,#F8FCFF); margin-bottom:10px;">
            <div style="font-size:0.88rem; font-weight:700; color:#1A4D8B; margin-bottom:4px;">
                🌡️ Tứ Khí — Tính chất nhiệt (chọn 1)
            </div>
            <div style="font-size:0.72rem; color:#6B8BAA; margin-bottom:6px;">
                ← Lạnh (Hàn)&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Bình&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;Nóng (Nhiệt) →
            </div>
            ${tuKhiHtml}
        </div>

        <!-- NGŨ VỊ -->
        <div style="border:2px solid #D4C5A0; border-radius:10px; padding:12px; background:#FFFCF5; margin-bottom:10px;">
            <div style="font-size:0.88rem; font-weight:700; color:#5B3A1A; margin-bottom:10px;">
                🌿 Ngũ Vị — Cường độ vị khẩu (kéo thanh 0–5)
            </div>
            ${nguViHtml}
        </div>

        <!-- HƯỚNG TGPT -->
        <div style="border:2px solid #C8E6C9; border-radius:10px; padding:12px; background:linear-gradient(135deg,#F1F8F1,#FFFFF8); margin-bottom:10px;">
            <div style="font-size:0.88rem; font-weight:700; color:#1A6B4A; margin-bottom:4px;">
                ↕️ Hướng vận động (Thăng–Giáng) — chọn 1
            </div>
            <div style="font-size:0.72rem; color:#6BAA7A; margin-bottom:6px;">
                1 = Giáng mạnh (tẩy xổ) · 3 = Bình · 5 = Thăng mạnh (ra mồ hôi)
            </div>
            ${huongHtml}
        </div>

        <!-- TÍNH / VỊ / QUY KINH -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
            <label class="tayy-form-label">Tính (nhập tự do)<br>
                <div style="position:relative;">
                    <input id="vt-inp-tinh" type="text" class="tayy-form-input"
                        value="${item ? escHtml(item.tinh || '') : ''}"
                        oninput="vtOnTinhSearchInput(this.value)"
                        onfocus="vtOnTinhSearchInput(this.value)"
                        placeholder="Hàn, Nhiệt, Ôn, Bình...">
                    <div id="vt-tinh-suggest"
                        style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                               background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                               box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:160px;
                               overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
            </label>
            <label class="tayy-form-label">Vị (nhập tự do)<br>
                <div style="position:relative;">
                    <input id="vt-inp-vi" type="text" class="tayy-form-input"
                        value="${item ? escHtml(item.vi || '') : ''}"
                        oninput="vtOnViSearchInput(this.value)"
                        onfocus="vtOnViSearchInput(this.value)"
                        placeholder="Chua, Đắng, Ngọt...">
                    <div id="vt-vi-suggest"
                        style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                               background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                               box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:160px;
                               overflow-y:auto; z-index:2500; display:none;"></div>
                </div>
            </label>
        </div>

        <label class="tayy-form-label">Quy kinh (chọn nhiều)<br>
            <div style="position:relative;">
                <div id="vt-quykinh-chips" class="chips-container"
                    onclick="document.getElementById('vt-inp-quykinh').focus()">
                    <input id="vt-inp-quykinh" type="text" class="chip-input"
                        placeholder="Thêm kinh mạch..."
                        oninput="vtOnQuyKinhSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter'&&this.value){vtSelectQuyKinh(this.value);event.preventDefault();}if(event.key==='Backspace'&&!this.value)vtRemoveLastQuyKinhChip()">
                </div>
                <div id="vt-quykinh-suggest"
                    style="position:absolute; left:0; right:0; top:calc(100% + 4px);
                           background:#FFFDF7; border:1px solid #D4C5A0; border-radius:8px;
                           box-shadow:0 10px 30px rgba(0,0,0,0.12); max-height:200px;
                           overflow-y:auto; z-index:2500; display:none;"></div>
            </div>
        </label>

        <label class="tayy-form-label">Công dụng (mỗi dòng một công dụng)<br>
            <div id="vt-congdung-list" style="display:flex; flex-direction:column; gap:8px;"></div>
            <button class="btn btn-sm btn-outline" style="margin-top:8px;"
                onclick="vtAddCongDungInput()">+ Thêm công dụng</button>
        </label>

        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id || 0})">💾 Lưu vị thuốc</button>
        </div>
    `, 'wide');

    // Khởi tạo chips & lists
    _vtCurrentQuyKinh  = (item?.quy_kinh || '').split(',').map(s => s.trim()).filter(Boolean);
    _vtCurrentCongDung = (item?.cong_dung || '').split('; ').map(s => s.trim()).filter(Boolean);
    if (_vtCurrentCongDung.length === 0) _vtCurrentCongDung = [''];
    vtRenderQuyKinhChips();
    vtRenderCongDungList();
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Style updater cho radio buttons YHCT
// ═══════════════════════════════════════════════════════════════════════════════
function yhctUpdateRadioStyle(radioName, dataAttr) {
    const selectedVal = document.querySelector(`input[name="${radioName}"]:checked`)?.value;
    if (selectedVal === undefined) return;

    // Màu theo từng option
    const colorMapTuKhi  = { '-2':'#2E86C1', '-1':'#5DADE2', '0':'#7D8E80', '1':'#E59866', '2':'#C0392B' };
    const colorMapHuong  = { '1':'#1A6B4A', '2':'#52BE80', '3':'#8B7355', '4':'#E67E22', '5':'#8B1A1A' };
    const colorMap = dataAttr === 'tukhi' ? colorMapTuKhi : colorMapHuong;

    document.querySelectorAll(`.yhct-radio-btn[data-${dataAttr}]`).forEach(el => {
        const elVal = el.getAttribute(`data-${dataAttr}`);
        const isActive = (parseFloat(elVal) === parseFloat(selectedVal));
        const color = colorMap[elVal] || '#8B1A1A';
        el.style.background    = isActive ? color : 'transparent';
        el.style.color         = isActive ? '#fff' : '#5B3A1A';
        el.style.borderColor   = isActive ? color : '#D4C5A0';
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Nhóm dược lý suggestions
// ═══════════════════════════════════════════════════════════════════════════════
const _NHOM_DUOC_LY_LIST = [
    'Tiêu thực', 'Bổ khí', 'Bổ huyết', 'Bổ âm', 'Bổ dương',
    'Thanh nhiệt', 'Giải biểu', 'Lý khí', 'Hoạt huyết',
    'Trừ thấp', 'Tả hạ', 'Ôn lý', 'Bình can tức phong',
    'An thần', 'Hóa đàm', 'Chỉ ho bình suyễn', 'Thu sáp',
    'Khu phong thấp', 'Lợi thủy thẩm thấp', 'Điều hòa'
];
function yhctNhomDuocLyInput(val) {
    const suggestEl = document.getElementById('vt-nhomduocly-suggest');
    if (!suggestEl) return;
    const q = (val || '').trim().toLowerCase();
    const existing = [...new Set((_thuocData.viThuoc || []).map(v => v.nhom_duoc_ly).filter(Boolean))];
    const all = [...new Set([..._NHOM_DUOC_LY_LIST, ...existing])];
    const filtered = all.filter(x => x.toLowerCase().includes(q)).slice(0, 10);
    const hasExact = all.some(x => x.toLowerCase() === q);
    let html = filtered.map(m => `
        <div style="padding:8px 12px; cursor:pointer; border-bottom:1px solid #F0E8D8;"
             onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background=''"
             onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(m)}'; document.getElementById('vt-nhomduocly-suggest').style.display='none';">
            <div style="font-weight:600; color:#5B3A1A; font-size:0.82rem;">${escHtml(m)}</div>
        </div>`).join('');
    if (!hasExact && q) html += `
        <div style="padding:8px 12px; cursor:pointer; background:#FAF6EE; border-top:1px dashed #D4C5A0;"
             onmouseover="this.style.background='#EFE8D8'" onmouseout="this.style.background='#FAF6EE'"
             onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(val.trim())}'; document.getElementById('vt-nhomduocly-suggest').style.display='none';">
            <div style="font-weight:700; color:#CA6222; font-size:0.82rem; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.2rem;">+</span> Thêm "${escHtml(val.trim())}"
            </div>
        </div>`;
    suggestEl.style.display = html ? 'block' : 'none';
    suggestEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERRIDE: saveViThuoc — Lưu đầy đủ các trường YHCT mới
// ═══════════════════════════════════════════════════════════════════════════════
async function saveViThuoc(id) {
    const tuKhiRaw = document.querySelector('input[name="vt-tu-khi"]:checked')?.value;
    const huongRaw = document.querySelector('input[name="vt-huong"]:checked')?.value;
    const getFloat = elId => { const el = document.getElementById(elId); return el ? parseFloat(el.value) || 0 : 0; };

    const payload = {
        ten_vi_thuoc:   (document.getElementById('vt-inp-ten')?.value || '').trim(),
        ten_goi_khac:   (document.getElementById('vt-inp-alias')?.value || '').trim(),
        tinh:           (document.getElementById('vt-inp-tinh')?.value || '').trim(),
        vi:             (document.getElementById('vt-inp-vi')?.value || '').trim(),
        quy_kinh:       _vtCurrentQuyKinh.join(', '),
        cong_dung:      _vtCurrentCongDung.map(s => s.trim()).filter(Boolean).join('; '),
        nhom_duoc_ly:   (document.getElementById('vt-inp-nhomduocly')?.value || '').trim(),
        tac_dung_chinh: (document.getElementById('vt-inp-tacdungchinh')?.value || '').trim(),
        tu_khi:    tuKhiRaw !== undefined ? parseFloat(tuKhiRaw) : 0,
        huong_tgpt: huongRaw !== undefined ? parseFloat(huongRaw) : 3,
        vi_toan: getFloat('vt-nv-vi_toan'),
        vi_khu:  getFloat('vt-nv-vi_khu'),
        vi_cam:  getFloat('vt-nv-vi_cam'),
        vi_tan:  getFloat('vt-nv-vi_tan'),
        vi_ham:  getFloat('vt-nv-vi_ham'),
    };

    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc!');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYSIS PANEL — Hiển thị Radar Chart cho Bài thuốc đã lưu
// ═══════════════════════════════════════════════════════════════════════════════

// Lưu trữ Chart.js instances để destroy trước khi re-render
let _yhctChartNguVi   = null;
let _yhctChartQuyKinh = null;

async function openBaiThuocAnalysis(baiThuocId) {
    const bt = _thuocData.baiThuoc.find(x => x.id == baiThuocId);
    if (!bt) return alert('Không tìm thấy bài thuốc.');

    // Tính local nếu có đủ dữ liệu, đồng thời gọi backend
    const analysisResult = yhctAnalyzeLocal(bt);

    // Hiển thị modal phân tích
    showTayyModal(`🔬 Phân tích: ${escHtml(bt.ten_bai_thuoc)}`, yhctBuildAnalysisHtml(analysisResult), 'wide');

    // Đợi DOM render xong rồi vẽ charts
    setTimeout(() => yhctDrawCharts(analysisResult), 80);
}

// ─── Tính toán local (không cần gọi backend) ──────────────────────────────────
function yhctAnalyzeLocal(baiThuoc) {
    const details = baiThuoc.chiTietViThuoc || [];

    const parseLieu = (lieu) => {
        if (!lieu) return 9;
        const s = (lieu || '').trim().toLowerCase();
        if (s === '*') return 2.25;
        if (s === '#') return 22.5;
        let m;
        m = s.match(/^([\d.]+)\s*tiền?$/); if (m) return parseFloat(m[1]) * 3;
        m = s.match(/^([\d.]+)\s*lư?ợng?$/); if (m) return parseFloat(m[1]) * 30;
        m = s.match(/^([\d.]+)/); if (m) return parseFloat(m[1]);
        return 9;
    };

    const items = details.map(d => {
        const vt = d.viThuoc || _thuocData.viThuoc.find(v => v.id === d.idViThuoc) || {};
        const gram = parseLieu(d.lieu_luong);
        return { d, vt, gram };
    }).filter(x => x.vt && x.vt.id);

    if (items.length === 0) return { empty: true, ten_bai_thuoc: baiThuoc.ten_bai_thuoc };

    const totalWeight = items.reduce((s, x) => s + x.gram, 0) || 1;

    const wAvg = (fn) => items.reduce((s, x) => s + fn(x.vt) * x.gram, 0) / totalWeight;

    const tuKhiScore = wAvg(v => v.tu_khi ?? 0);
    const huongScore = wAvg(v => v.huong_tgpt ?? 3);
    const nguViRadar = {
        'Chua (Toan)': wAvg(v => v.vi_toan ?? 0),
        'Đắng (Khổ)':  wAvg(v => v.vi_khu  ?? 0),
        'Ngọt (Cam)':  wAvg(v => v.vi_cam  ?? 0),
        'Cay (Tân)':   wAvg(v => v.vi_tan  ?? 0),
        'Mặn (Hàm)':   wAvg(v => v.vi_ham  ?? 0),
    };

    // Quy kinh tích lũy
    const quyKinhRaw = {};
    for (const { d, vt, gram } of items) {
        const qkStr = vt.quy_kinh || d.quy_kinh || '';
        qkStr.split(/[,;，、]/).map(k => k.trim()).filter(Boolean).forEach(k => {
            quyKinhRaw[k] = (quyKinhRaw[k] || 0) + gram;
        });
    }
    const maxQK = Math.max(...Object.values(quyKinhRaw), 1);
    const quyKinhNorm = {};
    Object.entries(quyKinhRaw).sort((a,b) => b[1]-a[1]).slice(0, 12).forEach(([k, v]) => {
        quyKinhNorm[k] = Math.round((v / maxQK) * 100);
    });

    // Quân Thần Tá Sứ
    const sorted = [...items].sort((a, b) => b.gram - a.gram);
    const quanQK = (sorted[0]?.vt?.quy_kinh || '').split(/[,;，、]/).map(k => k.trim());
    const roleMap = {};
    sorted.forEach((x, i) => {
        const ten = (x.vt.ten_vi_thuoc || '').toLowerCase();
        const pct = x.gram / totalWeight;
        const vtQK = (x.vt.quy_kinh || '').split(/[,;，、]/).map(k => k.trim());
        if (i === 0) roleMap[x.vt.id] = 'Quân';
        else if ((ten.includes('cam thảo') || ten.includes('đại táo')) && pct < 0.1) roleMap[x.vt.id] = 'Sứ';
        else if (pct >= 0.15 && vtQK.some(k => quanQK.includes(k))) roleMap[x.vt.id] = 'Thần';
        else roleMap[x.vt.id] = 'Tá';
    });

    const roleColors = { Quân: '#C0392B', Thần: '#E67E22', Tá: '#27AE60', Sứ: '#2E86C1' };
    const viThuocList = items.map(({ d, vt, gram }) => ({
        ten: vt.ten_vi_thuoc || '—',
        gram,
        pct: Math.round((gram / totalWeight) * 100),
        vai_tro: roleMap[vt.id] || 'Tá',
        color: roleColors[roleMap[vt.id] || 'Tá'],
        tac_dung: vt.tac_dung_chinh || '',
        nhom: vt.nhom_duoc_ly || '',
        quy_kinh: vt.quy_kinh || '',
    }));

    // Labels
    const tuKhiLabel = tuKhiScore >= 1.5 ? 'Đại Nhiệt 🔥🔥' :
                       tuKhiScore >= 0.5  ? 'Ôn / Nhiệt 🔥' :
                       tuKhiScore <= -1.5 ? 'Đại Hàn ❄️❄️' :
                       tuKhiScore <= -0.5 ? 'Hàn / Lương ❄️' : 'Bình ⚖️';
    const huongLabel = huongScore >= 4.5 ? 'Thăng mạnh ↑↑' :
                       huongScore >= 3.5 ? 'Thăng nhẹ ↑' :
                       huongScore <= 1.5 ? 'Giáng mạnh ↓↓' :
                       huongScore <= 2.5 ? 'Giáng nhẹ ↓' : 'Bình hòa ↔';

    return {
        ten_bai_thuoc: baiThuoc.ten_bai_thuoc,
        totalWeight,
        tuKhiScore, tuKhiLabel,
        huongScore, huongLabel,
        nguViRadar, quyKinhNorm,
        viThuocList,
    };
}

// ─── Build HTML cho modal phân tích ───────────────────────────────────────────
function yhctBuildAnalysisHtml(result) {
    if (result.empty) {
        return `<div style="text-align:center; padding:40px; color:#A09580; font-style:italic;">
            Bài thuốc chưa có vị thuốc hoặc chưa nhập dữ liệu YHCT.
            <br>Hãy thêm vị thuốc và điền các chỉ số Tứ Khí / Ngũ Vị / Hướng.
        </div>`;
    }

    const tuKhiPct = ((result.tuKhiScore + 2) / 4 * 100).toFixed(0); // -2..+2 → 0..100%
    const tuKhiColor = result.tuKhiScore >= 0.5 ? '#C0392B' : result.tuKhiScore <= -0.5 ? '#2E86C1' : '#7D8E80';

    const huongPct = ((result.huongScore - 1) / 4 * 100).toFixed(0); // 1..5 → 0..100%
    const huongColor = result.huongScore > 3 ? '#8B1A1A' : result.huongScore < 3 ? '#1A6B4A' : '#7D8E80';

    const roleOrder = { Quân: 0, Thần: 1, Tá: 2, Sứ: 3 };
    const sortedVt = [...result.viThuocList].sort((a,b) => (roleOrder[a.vai_tro]||3) - (roleOrder[b.vai_tro]||3) || b.gram - a.gram);

    const vtRows = sortedVt.map(v => `
        <tr>
            <td style="padding:6px 8px; font-weight:700; color:#3A2A10;">${escHtml(v.ten)}</td>
            <td style="padding:6px 8px; text-align:center;">${v.gram}g</td>
            <td style="padding:6px 8px; text-align:center;">${v.pct}%</td>
            <td style="padding:6px 8px; text-align:center;">
                <span style="background:${v.color}; color:#fff; border-radius:12px; padding:2px 10px; font-size:0.78rem; font-weight:700;">${v.vai_tro}</span>
            </td>
            <td style="padding:6px 8px; font-size:0.78rem; color:#5B3A1A;">${escHtml(v.nhom || v.tac_dung || '—')}</td>
            <td style="padding:6px 8px; font-size:0.75rem; color:#8B7355;">${escHtml(v.quy_kinh || '—')}</td>
        </tr>`).join('');

    return `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">

        <!-- TỨ KHÍ GAUGE -->
        <div style="background:#FFFBF5; border:1px solid #E8DCC8; border-radius:10px; padding:14px;">
            <div style="font-weight:700; color:#5B3A1A; font-size:0.88rem; margin-bottom:10px;">🌡️ Tứ Khí tổng bài</div>
            <div style="font-size:1.3rem; font-weight:800; color:${tuKhiColor}; text-align:center; margin-bottom:8px;">
                ${result.tuKhiLabel}
            </div>
            <div style="font-size:0.78rem; color:#8B7355; text-align:center; margin-bottom:10px;">
                Điểm: <strong>${result.tuKhiScore.toFixed(2)}</strong> / thang (-2 → +2)
            </div>
            <div style="background:#E8F0F8; border-radius:20px; height:14px; overflow:hidden; position:relative;">
                <div style="position:absolute; left:50%; top:0; width:2px; height:100%; background:#999; z-index:1;"></div>
                <div style="height:100%; width:${tuKhiPct}%; background:linear-gradient(90deg,#5DADE2,${tuKhiColor}); border-radius:20px; transition:width 0.6s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#A09580; margin-top:3px;">
                <span>Đại Hàn (-2)</span><span>Bình (0)</span><span>Đại Nhiệt (+2)</span>
            </div>
        </div>

        <!-- HƯỚNG TGPT GAUGE -->
        <div style="background:#F5FAF5; border:1px solid #C8E6C9; border-radius:10px; padding:14px;">
            <div style="font-weight:700; color:#1A6B4A; font-size:0.88rem; margin-bottom:10px;">↕️ Hướng TGPT tổng bài</div>
            <div style="font-size:1.3rem; font-weight:800; color:${huongColor}; text-align:center; margin-bottom:8px;">
                ${result.huongLabel}
            </div>
            <div style="font-size:0.78rem; color:#6BAA7A; text-align:center; margin-bottom:10px;">
                Điểm: <strong>${result.huongScore.toFixed(2)}</strong> / thang (1 → 5)
            </div>
            <div style="background:#E0F0E0; border-radius:20px; height:14px; overflow:hidden; position:relative;">
                <div style="position:absolute; left:50%; top:0; width:2px; height:100%; background:#999; z-index:1;"></div>
                <div style="height:100%; width:${huongPct}%; background:linear-gradient(90deg,#1A6B4A,${huongColor}); border-radius:20px; transition:width 0.6s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#A09580; margin-top:3px;">
                <span>Giáng mạnh (1)</span><span>Bình (3)</span><span>Thăng mạnh (5)</span>
            </div>
        </div>
    </div>

    <!-- RADAR CHARTS -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div style="background:#FFFDF7; border:1px solid #E8DCC8; border-radius:10px; padding:14px;">
            <div style="font-weight:700; color:#5B3A1A; font-size:0.88rem; margin-bottom:6px; text-align:center;">🌿 Ngũ Vị Radar</div>
            <canvas id="yhct-chart-nguvi" style="max-height:220px;"></canvas>
        </div>
        <div style="background:#FFFDF7; border:1px solid #E8DCC8; border-radius:10px; padding:14px;">
            <div style="font-weight:700; color:#5B3A1A; font-size:0.88rem; margin-bottom:6px; text-align:center;">📍 Quy Kinh Radar</div>
            <canvas id="yhct-chart-quykinh" style="max-height:220px;"></canvas>
        </div>
    </div>

    <!-- BẢNG PHÂN LOẠI -->
    <div style="background:#FFFDF7; border:1px solid #E8DCC8; border-radius:10px; padding:14px; margin-bottom:14px;">
        <div style="font-weight:700; color:#5B3A1A; font-size:0.88rem; margin-bottom:10px;">
            ⚖️ Phân loại Quân–Thần–Tá–Sứ
            <span style="font-weight:400; font-size:0.78rem; color:#8B7355; margin-left:8px;">
                (Tổng liều = ${result.totalWeight.toFixed(1)}g)
            </span>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                <thead>
                    <tr style="background:#F5F0E8;">
                        <th style="padding:7px 8px; text-align:left; color:#5B3A1A; border:1px solid #E2D4B8;">Tên vị thuốc</th>
                        <th style="padding:7px 8px; text-align:center; color:#5B3A1A; border:1px solid #E2D4B8;">Gram</th>
                        <th style="padding:7px 8px; text-align:center; color:#5B3A1A; border:1px solid #E2D4B8;">%</th>
                        <th style="padding:7px 8px; text-align:center; color:#5B3A1A; border:1px solid #E2D4B8;">Vai trò</th>
                        <th style="padding:7px 8px; text-align:left; color:#5B3A1A; border:1px solid #E2D4B8;">Nhóm / Tác dụng</th>
                        <th style="padding:7px 8px; text-align:left; color:#5B3A1A; border:1px solid #E2D4B8;">Quy kinh</th>
                    </tr>
                </thead>
                <tbody style="background:#FBF8F1;">${vtRows}</tbody>
            </table>
        </div>
    </div>

    <div style="display:flex; justify-content:flex-end;">
        <button class="btn" onclick="closeTayyModal()">Đóng</button>
    </div>`;
}

// ─── Vẽ Chart.js Radar Charts ─────────────────────────────────────────────────
function yhctDrawCharts(result) {
    if (result.empty) return;

    // Destroy old instances
    if (_yhctChartNguVi)   { _yhctChartNguVi.destroy();   _yhctChartNguVi   = null; }
    if (_yhctChartQuyKinh) { _yhctChartQuyKinh.destroy(); _yhctChartQuyKinh = null; }

    const canvasNV = document.getElementById('yhct-chart-nguvi');
    const canvasQK = document.getElementById('yhct-chart-quykinh');
    if (!canvasNV || !canvasQK || typeof Chart === 'undefined') return;

    // Ngũ Vị radar
    const nvLabels = Object.keys(result.nguViRadar);
    const nvData   = Object.values(result.nguViRadar).map(v => Math.round(v * 10) / 10);
    _yhctChartNguVi = new Chart(canvasNV.getContext('2d'), {
        type: 'radar',
        data: {
            labels: nvLabels,
            datasets: [{
                label: 'Ngũ Vị',
                data: nvData,
                fill: true,
                backgroundColor: 'rgba(139, 100, 20, 0.18)',
                borderColor: '#8B6414',
                pointBackgroundColor: '#8B6414',
                pointRadius: 4,
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#E8DCC8' } } },
            plugins: { legend: { display: false } },
            animation: { duration: 600 },
        }
    });

    // Quy Kinh radar
    const qkLabels = Object.keys(result.quyKinhNorm);
    const qkData   = Object.values(result.quyKinhNorm);
    _yhctChartQuyKinh = new Chart(canvasQK.getContext('2d'), {
        type: 'radar',
        data: {
            labels: qkLabels,
            datasets: [{
                label: 'Quy Kinh',
                data: qkData,
                fill: true,
                backgroundColor: 'rgba(26, 77, 139, 0.18)',
                borderColor: '#1A4D8B',
                pointBackgroundColor: '#1A4D8B',
                pointRadius: 4,
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 9 } }, grid: { color: '#DCE9F5' } } },
            plugins: { legend: { display: false } },
            animation: { duration: 600 },
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERRIDE: renderBaiThuocTab — Thêm nút "Phân tích" vào mỗi row
// ═══════════════════════════════════════════════════════════════════════════════
function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ingredients = (item.chiTietViThuoc || []).map(d => {
            const ten = d?.viThuoc?.ten_vi_thuoc || '';
            const lieu = (d?.lieu_luong || '').trim();
            return `${ten}${lieu ? ' (' + lieu + ')' : ''}`;
        }).filter(Boolean).join(', ');

        const bienChungStr = escHtml(item.bien_chung || '—');
        const trieuChungStr = escHtml(item.trieu_chung || '—');
        const phapTriStr = escHtml(item.phap_tri || '—');
        const soVi = (item.chiTietViThuoc || []).length;

        return `
            <tr>
                <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
                <td>${escHtml(item.nguon_goc || '—')}</td>
                <td style="font-size:0.8rem;">${bienChungStr}</td>
                <td style="font-size:0.8rem;">${trieuChungStr}</td>
                <td style="font-size:0.8rem;">${phapTriStr}</td>
                <td style="font-size:0.78rem; color:#6B5A3A;">${escHtml(ingredients || 'Chưa có vị thuốc')}</td>
                <td style="text-align:center; width:180px;">
                    <div class="table-actions" style="justify-content:center; flex-wrap:wrap; gap:4px;">
                        <button class="btn btn-sm" style="background:#E8F4E8; color:#1A6B4A; border:1px solid #A8D8A8;"
                            onclick="openBaiThuocAnalysis(${item.id})" title="Phân tích YHCT">🔬 Radar</button>
                        <button class="btn btn-sm btn-outline" onclick="openBaiThuocForm(${item.id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBaiThuoc(${item.id})">🗑</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openBaiThuocForm()">+ Thêm bài thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên bài thuốc</th>
                    <th>Nguồn gốc</th>
                    <th>Biện chứng</th>
                    <th>Triệu chứng</th>
                    <th>Pháp trị</th>
                    <th>Thành phần</th>
                    <th style="width:180px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="7" style="text-align:center; color:#A09580; padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERRIDE: renderViThuocTab — Hiển thị thêm cột Nhóm dược lý + badge Tứ Khí
// ═══════════════════════════════════════════════════════════════════════════════
function renderViThuocTab(el) {
    const tuKhiColor = (score) => {
        if (score >= 1.5) return '#C0392B';
        if (score >= 0.5) return '#E59866';
        if (score <= -1.5) return '#2E86C1';
        if (score <= -0.5) return '#5DADE2';
        return '#7D8E80';
    };
    const tuKhiLabel = (score) => {
        if (score >= 1.5) return 'Nhiệt';
        if (score >= 0.5) return 'Ôn';
        if (score <= -1.5) return 'Đại Hàn';
        if (score <= -0.5) return 'Hàn';
        return 'Bình';
    };

    const rows = _thuocData.viThuoc.map(item => {
        const aliasStr = item.ten_goi_khac ? `<div style="font-size:0.73rem; color:#A09580; font-style:italic;">(${escHtml(item.ten_goi_khac)})</div>` : '';
        const congDungHtml = (item.cong_dung || '').split('; ').filter(Boolean).map(cd => `• ${escHtml(cd)}`).join('<br>');

        const tk = item.tu_khi ?? null;
        const tkBadge = tk !== null
            ? `<span style="background:${tuKhiColor(tk)}; color:#fff; border-radius:10px; padding:1px 8px; font-size:0.72rem; font-weight:700; white-space:nowrap;">${tuKhiLabel(tk)} (${tk > 0?'+':''}${tk})</span>`
            : '<span style="color:#CCC; font-size:0.72rem;">—</span>';

        const nguViStr = [
            item.vi_toan > 0 ? `Chua:${item.vi_toan}` : '',
            item.vi_khu  > 0 ? `Đắng:${item.vi_khu}` : '',
            item.vi_cam  > 0 ? `Ngọt:${item.vi_cam}` : '',
            item.vi_tan  > 0 ? `Cay:${item.vi_tan}` : '',
            item.vi_ham  > 0 ? `Mặn:${item.vi_ham}` : '',
        ].filter(Boolean).join(' · ') || '—';

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:#5B3A1A;">${escHtml(item.ten_vi_thuoc)}</div>
                    ${aliasStr}
                    ${item.nhom_duoc_ly ? `<div style="font-size:0.7rem; color:#1A6B4A; margin-top:2px;">📦 ${escHtml(item.nhom_duoc_ly)}</div>` : ''}
                </td>
                <td style="text-align:center;">${tkBadge}</td>
                <td style="font-size:0.75rem; color:#5B3A1A;">${nguViStr}</td>
                <td style="text-align:center; font-size:0.75rem;">${escHtml(item.quy_kinh || '—')}</td>
                <td style="font-size:0.78rem; line-height:1.4;">${congDungHtml || '—'}</td>
                <td style="text-align:center; width:130px;">
                    <div class="table-actions" style="justify-content:center;">
                        <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th>
                    <th style="text-align:center;">Tứ Khí</th>
                    <th style="text-align:center;">Ngũ Vị (điểm)</th>
                    <th style="text-align:center;">Quy kinh</th>
                    <th>Công dụng</th>
                    <th style="width:130px; text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center; color:#A09580; padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}
