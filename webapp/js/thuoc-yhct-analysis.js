// thuoc-yhct-analysis.js — Load LAST trong index.html
// Ghi đè openViThuocForm, saveViThuoc, renderViThuocTab, renderBaiThuocTab

let _yhctChartNguVi   = null;
let _yhctChartQuyKinh = null;
let _yhctChartTGPT    = null;

const CHART_COLORS = ['#A32D2D','#2D6A4F','#B8860B','#6B4E71','#2C3E50','#800000'];

// Khai báo global state cho Vị Thuốc Form
let _vtCurrentQuyKinh = [];
let _vtCurrentCongDung = [];
let _vtCurrentChuTri = [];
let _vtCurrentKiengKy = [];

const YHCT_KINH_ORDER = [
    'Tâm','Can','Tỳ','Phế','Thận','Tâm Bào',
    'Đại Trường','Tiểu Trường','Bàng Quang','Đởm','Vị','Tam Tiêu'
];
const YHCT_KINH_ALIAS = {
    'tam':'Tâm','tâm':'Tâm','can':'Can','ty':'Tỳ','tỳ':'Tỳ','phe':'Phế','phế':'Phế',
    'than':'Thận','thận':'Thận','tambao':'Tâm Bào','tâm bào':'Tâm Bào','tam bao':'Tâm Bào',
    'daitrang':'Đại Trường','đại trường':'Đại Trường','dai truong':'Đại Trường',
    'tieutruong':'Tiểu Trường','tiểu trường':'Tiểu Trường','tieu truong':'Tiểu Trường',
    'bangquang':'Bàng Quang','bàng quang':'Bàng Quang','bang quang':'Bàng Quang',
    'dam':'Đởm','đởm':'Đởm','vi':'Vị','vị':'Vị',
    'tamtieu':'Tam Tiêu','tam tiêu':'Tam Tiêu',
};
function normalizeKinh(raw) {
    const s = (raw||'').trim();
    return YHCT_KINH_ALIAS[s.toLowerCase()] || s;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERRIDE: openViThuocForm — form clean, dùng theme màu #8B1A1A của app
// ═══════════════════════════════════════════════════════════════════════════
function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;
    const tuKhiVal = item?.tu_khi    ?? 0;
    const huongVal = item?.huong_tgpt ?? 3;

    const ACC  = '#8B1A1A';  // accent duy nhất
    const SEC  = 'border:1px solid #E2D4B8;border-radius:8px;padding:12px 14px;background:#FAFAF8;margin-bottom:10px;';
    const LBL  = 'font-size:0.8rem;font-weight:600;color:#5B3A1A;margin-bottom:6px;display:block;';
    const HINT = 'font-size:0.7rem;color:#A09580;margin-bottom:6px;';

    const INP = `border:1px solid #D4C5A0;border-radius:6px;padding:5px 8px;font-size:0.9rem;font-weight:700;color:#5B3A1A;background:#fff;outline:none;width:80px;text-align:center;`;
    const nguViFields = [
        { key:'vi_toan', label:'Chua (Toan)' },
        { key:'vi_khu',  label:'Đắng (Khổ)'  },
        { key:'vi_cam',  label:'Ngọt (Cam)'  },
        { key:'vi_tan',  label:'Cay (Tân)'   },
        { key:'vi_ham',  label:'Mặn (Hàm)'   },
    ];

    const nguViHtml = `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">`
        + nguViFields.map(f => {
            const v = item?.[f.key] ?? 0;
            return `<div style="text-align:center;">
                <div style="font-size:0.72rem;color:#8B7355;margin-bottom:4px;">${f.label}</div>
                <input id="vt-nv-${f.key}" type="number" min="0" max="5" step="0.5" value="${v}"
                    style="${INP}width:100%;"
                    onfocus="this.style.borderColor='${ACC}'" onblur="this.style.borderColor='#D4C5A0'">
            </div>`;
        }).join('') + `</div>`;

    showTayyModal('Vị thuốc', `
        <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tên vị thuốc *<br>
                <input id="vt-inp-ten" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.ten_vi_thuoc):''}" placeholder="VD: Sơn Tra"></label>
            <label class="tayy-form-label">Tên gọi khác<br>
                <input id="vt-inp-alias" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.ten_goi_khac||''):''}" placeholder="VD: Sơn lý hồng..."></label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Nhóm dược lý<br>
                <div style="position:relative;">
                    <input id="vt-inp-nhomduocly" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.nhom_duoc_ly||''):''}"
                        oninput="yhctNhomInput(this.value)" onfocus="yhctNhomInput(this.value)"
                        placeholder="Tiêu thực, Bổ khí...">
                    <div id="vt-nhom-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
            <label class="tayy-form-label">Tác dụng chính<br>
                <input id="vt-inp-tacdungchinh" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.tac_dung_chinh||''):''}"
                    placeholder="VD: Tiêu thịt mỡ, Hoạt huyết"></label>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;align-items:end;">
            <label class="tayy-form-label">Tứ Khí (Tính)<br>
                <select id="vt-inp-tukhi" class="tayy-form-input">
                    <option value="-2" ${tuKhiVal === -2 ? 'selected' : ''}>Đại Hàn (-2)</option>
                    <option value="-1" ${tuKhiVal === -1 ? 'selected' : ''}>Hàn (-1)</option>
                    <option value="0" ${tuKhiVal === 0 ? 'selected' : ''}>Bình (0)</option>
                    <option value="1" ${tuKhiVal === 1 ? 'selected' : ''}>Ôn (1)</option>
                    <option value="2" ${tuKhiVal === 2 ? 'selected' : ''}>Nhiệt (2)</option>
                </select>
            </label>
            <label class="tayy-form-label">Hướng Thăng–Giáng<br>
                <select id="vt-inp-huong" class="tayy-form-input">
                    <option value="1" ${huongVal === 1 ? 'selected' : ''}>Giáng mạnh (Trầm - 1)</option>
                    <option value="2" ${huongVal === 2 ? 'selected' : ''}>Giáng nhẹ (Giáng - 2)</option>
                    <option value="3" ${huongVal === 3 ? 'selected' : ''}>Bình (Hoà - 3)</option>
                    <option value="4" ${huongVal === 4 ? 'selected' : ''}>Thăng nhẹ (Phù - 4)</option>
                    <option value="5" ${huongVal === 5 ? 'selected' : ''}>Thăng mạnh (Thăng - 5)</option>
                </select>
            </label>
        </div>

        <div style="${SEC}">
            <span style="${LBL}">Ngũ Vị <span style="font-weight:400;color:#A09580;font-size:0.74rem;">(0 = không có · 5 = rất mạnh)</span></span>
            ${nguViHtml}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tính (nhập tự do)<br>
                <div style="position:relative;">
                    <input id="vt-inp-tinh" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.tinh||''):''}"
                        oninput="vtOnTinhSearchInput(this.value)" onfocus="vtOnTinhSearchInput(this.value)"
                        placeholder="Hàn, Nhiệt, Ôn, Bình...">
                    <div id="vt-tinh-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
            <label class="tayy-form-label">Vị (nhập tự do)<br>
                <div style="position:relative;">
                    <input id="vt-inp-vi" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.vi||''):''}"
                        oninput="vtOnViSearchInput(this.value)" onfocus="vtOnViSearchInput(this.value)"
                        placeholder="Chua, Đắng, Ngọt...">
                    <div id="vt-vi-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
        </div>
        <label class="tayy-form-label">Quy kinh (chọn nhiều)<br>
            <div style="position:relative;">
                <div id="vt-quykinh-chips" class="chips-container" onclick="document.getElementById('vt-inp-quykinh').focus()">
                    <input id="vt-inp-quykinh" type="text" class="chip-input" placeholder="Thêm kinh mạch..."
                        oninput="vtOnQuyKinhSearchInput(this.value)"
                        onkeydown="if(event.key==='Enter'&&this.value){vtSelectQuyKinh(this.value);event.preventDefault();}if(event.key==='Backspace'&&!this.value)vtRemoveLastQuyKinhChip()">
                </div>
                <div id="vt-quykinh-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                    background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                    box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:200px;overflow-y:auto;z-index:2500;display:none;"></div>
            </div></label>
        <label class="tayy-form-label">Công dụng (mỗi dòng một công dụng)<br>
            <div id="vt-congdung-list" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="vtAddCongDungInput()">+ Thêm công dụng</button>
        </label>
        <label class="tayy-form-label">Chủ trị (mỗi dòng một chủ trị)<br>
            <div id="vt-chutri-list" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="vtAddChuTriInput()">+ Thêm chủ trị</button>
        </label>
        <label class="tayy-form-label">Kiêng kỵ (mỗi dòng một kiêng kỵ)<br>
            <div id="vt-kiengky-list" style="display:flex;flex-direction:column;gap:8px;"></div>
            <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="vtAddKiengKyInput()">+ Thêm kiêng kỵ</button>
        </label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id||0})">Lưu</button>
        </div>
    `, 'wide');

    _vtCurrentQuyKinh  = (item?.quy_kinh||'').split(',').map(s=>s.trim()).filter(Boolean);
    // Parse công dụng, chủ trị, kiêng kỵ dạng "text||note" sang [{text, note}]
    const parseList = (str) => {
        const raw = (str||'').split('; ').filter(Boolean);
        return raw.length > 0
            ? raw.map(e => { const p = e.split('||'); return { text: (p[0]||'').trim(), note: (p[1]||'').trim() }; })
            : [{ text: '', note: '' }];
    };
    
    _vtCurrentCongDung = parseList(item?.cong_dung);
    _vtCurrentChuTri = parseList(item?.chu_tri);
    _vtCurrentKiengKy = parseList(item?.kieng_ky);

    vtRenderQuyKinhChips();
    vtRenderCongDungList();
    vtRenderChuTriList();
    vtRenderKiengKyList();
}

// Radio style helper — dùng 1 màu accent duy nhất
function yhctRadioStyle(radioName, dataAttr) {
    const val = document.querySelector(`input[name="${radioName}"]:checked`)?.value;
    if (val === undefined) return;
    document.querySelectorAll(`.yhct-rb[data-${dataAttr}]`).forEach(el => {
        const isActive = parseFloat(el.getAttribute(`data-${dataAttr}`)) === parseFloat(val);
        const color = el.getAttribute('data-color') || '#8B1A1A';
        el.style.background  = isActive ? color : 'transparent';
        el.style.color       = isActive ? '#fff' : '#5B3A1A';
        el.style.borderColor = isActive ? color : '#D4C5A0';
    });
}

// Nhóm dược lý autocomplete
const _NHOM_LIST = ['Tiêu thực','Bổ khí','Bổ huyết','Bổ âm','Bổ dương','Thanh nhiệt',
    'Giải biểu','Lý khí','Hoạt huyết','Trừ thấp','Tả hạ','Ôn lý','Bình can tức phong',
    'An thần','Hóa đàm','Chỉ ho bình suyễn','Thu sáp','Lợi thủy thẩm thấp','Điều hòa'];
function yhctNhomInput(val) {
    const el = document.getElementById('vt-nhom-suggest');
    if (!el) return;
    const q = (val||'').trim().toLowerCase();
    const existing = [...new Set((_thuocData.viThuoc||[]).map(v=>v.nhom_duoc_ly).filter(Boolean))];
    const all = [...new Set([..._NHOM_LIST,...existing])];
    const filtered = all.filter(x=>x.toLowerCase().includes(q)).slice(0,10);
    const hasExact = all.some(x=>x.toLowerCase()===q);
    let html = filtered.map(m=>`
        <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #F0E8D8;"
            onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background=''"
            onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(m)}';document.getElementById('vt-nhom-suggest').style.display='none';">
            <div style="font-weight:600;color:#5B3A1A;font-size:0.82rem;">${escHtml(m)}</div>
        </div>`).join('');
    if (!hasExact&&q) html+=`
        <div style="padding:8px 12px;cursor:pointer;background:#FAF6EE;border-top:1px dashed #D4C5A0;"
            onmouseover="this.style.background='#EFE8D8'" onmouseout="this.style.background='#FAF6EE'"
            onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(val.trim())}';document.getElementById('vt-nhom-suggest').style.display='none';">
            <div style="font-weight:700;color:#CA6222;font-size:0.82rem;">+ Thêm "${escHtml(val.trim())}"</div>
        </div>`;
    el.style.display = html ? 'block' : 'none';
    el.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERRIDE: saveViThuoc
// ═══════════════════════════════════════════════════════════════════════════
async function saveViThuoc(id) {
    const gf = elId => { const e = document.getElementById(elId); return e ? parseFloat(e.value)||0 : 0; };
    const renderListToString = (list) => list.filter(e => (e?.text || '').trim()).map(e => {
        const t = (e.text||'').trim();
        const n = (e.note||'').trim();
        return n ? `${t}||${n}` : t;
    }).join('; ');

    const payload = {
        ten_vi_thuoc:   (document.getElementById('vt-inp-ten')?.value||'').trim(),
        ten_goi_khac:   (document.getElementById('vt-inp-alias')?.value||'').trim(),
        tinh:           (document.getElementById('vt-inp-tinh')?.value||'').trim(),
        vi:             (document.getElementById('vt-inp-vi')?.value||'').trim(),
        quy_kinh:       _vtCurrentQuyKinh.join(', '),
        nhom_duoc_ly:   (document.getElementById('vt-inp-nhomduocly')?.value||'').trim(),
        tac_dung_chinh: (document.getElementById('vt-inp-tacdungchinh')?.value||'').trim(),
        tu_khi:    (() => { const e = document.getElementById('vt-inp-tukhi');  return e ? parseFloat(e.value)||0 : 0; })(),
        huong_tgpt: (() => { const e = document.getElementById('vt-inp-huong'); return e ? parseFloat(e.value)||3 : 3; })(),
        vi_toan: gf('vt-nv-vi_toan'),
        vi_khu:  gf('vt-nv-vi_khu'),
        vi_cam:  gf('vt-nv-vi_cam'),
        vi_tan:  gf('vt-nv-vi_tan'),
        vi_ham:  gf('vt-nv-vi_ham'),
        // Serialize {text, note} → "text||note" hoặc "text" nếu không có note
        cong_dung: renderListToString(_vtCurrentCongDung),
        chu_tri: renderListToString(_vtCurrentChuTri),
        kieng_ky: renderListToString(_vtCurrentKiengKy),
    };
    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc!');
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

// ═══════════════════════════════════════════════════════════════════════════
// PHÂN TÍCH BÀI THUỐC
// ═══════════════════════════════════════════════════════════════════════════
async function openBaiThuocAnalysis(baiThuocId) {
    const bt = _thuocData.baiThuoc.find(x => x.id == baiThuocId);
    if (!bt) return alert('Không tìm thấy bài thuốc.');
    const result = yhctAnalyzeLocal(bt);
    showTayyModal(`🔬 Phân tích: ${escHtml(bt.ten_bai_thuoc)}`, yhctBuildHtml(result), 'wide');
    setTimeout(() => yhctDrawAllCharts(result), 100);
}

function yhctAnalyzeLocal(bt) {
    const details = bt.chiTietViThuoc || [];
    const parseLieu = (s) => {
        if (!s) return 9;
        s = (s+'').trim().toLowerCase();
        if (s==='*') return 2.25;
        if (s==='#') return 22.5;
        let m;
        m=s.match(/^([\d.]+)\s*tiền?/); if(m) return parseFloat(m[1])*3;
        m=s.match(/^([\d.]+)\s*lư?ợng/); if(m) return parseFloat(m[1])*30;
        m=s.match(/^([\d.]+)/); if(m) return parseFloat(m[1]);
        return 9;
    };
    const items = details.map(d => {
        const vt = d.viThuoc || (_thuocData.viThuoc||[]).find(v=>v.id===d.idViThuoc) || {};
        return { d, vt, gram: parseLieu(d.lieu_luong) };
    }).filter(x=>x.vt&&x.vt.id);

    if (!items.length) return { empty:true, ten:bt.ten_bai_thuoc };

    const W = items.reduce((s,x)=>s+x.gram,0)||1;
    const wa = fn => items.reduce((s,x)=>s+fn(x.vt)*x.gram,0)/W;

    const tuKhiScore = wa(v=>v.tu_khi??0);
    const huongScore = wa(v=>v.huong_tgpt??3);

    const nvRaw = {
        'Toan (酸)': wa(v=>v.vi_toan??0),
        'Tân (辛)':  wa(v=>v.vi_tan??0),
        'Hàm (咸)':  wa(v=>v.vi_ham??0),
        'Khổ (苦)':  wa(v=>v.vi_khu??0),
        'Cam (甘)':  wa(v=>v.vi_cam??0),
        'Phương hương (芳香)': 0,
    };
    const nvMax = Math.max(...Object.values(nvRaw), 0.01);
    const nguViNorm = {};
    Object.entries(nvRaw).forEach(([k,v])=>{ nguViNorm[k] = Math.round((v/nvMax)*10)/10; });

    const qkRaw = {};
    YHCT_KINH_ORDER.forEach(k=>{ qkRaw[k]=0; });
    for (const {d,vt,gram} of items) {
        const qkStr = vt.quy_kinh || d.quy_kinh || '';
        qkStr.split(/[,;，、]/).map(k=>k.trim()).filter(Boolean).forEach(k=>{
            const norm = normalizeKinh(k);
            if (norm in qkRaw) qkRaw[norm] += gram;
            else {
                const found = YHCT_KINH_ORDER.find(ref=>norm.includes(ref)||ref.includes(norm));
                if (found) qkRaw[found] += gram;
            }
        });
    }
    const qkMax = Math.max(...Object.values(qkRaw),0.01);
    const quyKinhNorm = {};
    YHCT_KINH_ORDER.forEach(k=>{ quyKinhNorm[k] = Math.round((qkRaw[k]/qkMax)*10)/10; });

    const tgptDist = Math.abs(huongScore-3)/2*2;
    const tgpt = {
        'Thăng (升)': huongScore>3 ? tgptDist : 0,
        'Phù (浮)':   huongScore>3 ? tgptDist*0.75 : 0,
        'Giáng (降)': huongScore<3 ? tgptDist : 0,
        'Trầm (沉)':  huongScore<3 ? tgptDist*0.75 : 0,
    };

    const sorted = [...items].sort((a,b)=>b.gram-a.gram);
    const quanQK = (sorted[0]?.vt?.quy_kinh||'').split(/[,;，、]/).map(k=>normalizeKinh(k.trim()));
    const roleMap = {}, roleColors = {Quân:'#DC2626',Thần:'#F97316',Tá:'#16A34A',Sứ:'#2563EB'};
    sorted.forEach((x,i)=>{
        const ten=(x.vt.ten_vi_thuoc||'').toLowerCase();
        const pct=x.gram/W;
        const vtQK=(x.vt.quy_kinh||'').split(/[,;，、]/).map(k=>normalizeKinh(k.trim()));
        if(i===0) roleMap[x.vt.id]='Quân';
        else if((ten.includes('cam thảo')||ten.includes('đại táo'))&&pct<0.1) roleMap[x.vt.id]='Sứ';
        else if(pct>=0.15&&vtQK.some(k=>quanQK.includes(k))) roleMap[x.vt.id]='Thần';
        else roleMap[x.vt.id]='Tá';
    });

    const viThuocList = items.map(({d,vt,gram})=>({
        ten: vt.ten_vi_thuoc||'—', gram,
        pct: Math.round(gram/W*100),
        vai_tro: roleMap[vt.id]||'Tá',
        color: roleColors[roleMap[vt.id]||'Tá'],
        nhom: vt.nhom_duoc_ly||'',
        tac_dung: vt.tac_dung_chinh||'',
        quy_kinh: vt.quy_kinh||'',
    }));

    return { ten:bt.ten_bai_thuoc, W, tuKhiScore, huongScore, nguViNorm, quyKinhNorm, tgpt, viThuocList };
}

function yhctBuildHtml(r) {
    if (r.empty) return `<div style="text-align:center;padding:40px;color:#A09580;font-style:italic;">
        Bài thuốc chưa có vị thuốc hoặc chưa nhập dữ liệu YHCT.<br>
        Vào từng vị thuốc → Sửa để điền Tứ Khí / Ngũ Vị / Hướng.</div>`;

    const tkPct = ((r.tuKhiScore+2)/4*100).toFixed(1);
    const tkLabel = r.tuKhiScore>=1.5?'Đại Nhiệt (大热)'
        :r.tuKhiScore>=0.5?'Ôn (温)':r.tuKhiScore<=-1.5?'Đại Hàn (大寒)'
        :r.tuKhiScore<=-0.5?'Hàn (寒)':'Bình (平)';

    const roleOrder = {Quân:0,Thần:1,Tá:2,Sứ:3};
    const sortedVt = [...r.viThuocList].sort((a,b)=>(roleOrder[a.vai_tro]||3)-(roleOrder[b.vai_tro]||3)||b.gram-a.gram);
    const vtRows = sortedVt.map(v=>`
        <tr>
            <td style="padding:5px 8px;font-weight:600;">${escHtml(v.ten)}</td>
            <td style="padding:5px 8px;text-align:center;">${v.gram}g</td>
            <td style="padding:5px 8px;text-align:center;">${v.pct}%</td>
            <td style="padding:5px 8px;text-align:center;">
                <span style="background:${v.color};color:#fff;border-radius:10px;padding:2px 9px;font-size:0.75rem;font-weight:700;">${v.vai_tro}</span>
            </td>
            <td style="padding:5px 8px;font-size:0.76rem;color:#5B3A1A;">${escHtml(v.nhom||v.tac_dung||'—')}</td>
            <td style="padding:5px 8px;font-size:0.72rem;color:#8B7355;">${escHtml(v.quy_kinh||'—')}</td>
        </tr>`).join('');

    const nhomCount = {};
    r.viThuocList.forEach(v=>{ if(v.nhom){ nhomCount[v.nhom]=(nhomCount[v.nhom]||0)+1; } });
    const nhomItems = Object.entries(nhomCount).sort((a,b)=>b[1]-a[1]).map(([k,n])=>
        `<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#F5F0E8;border-radius:6px;font-size:0.78rem;margin-bottom:4px;">
            <span style="color:#5B3A1A;">${escHtml(k)}</span>
            <span style="font-weight:700;color:#8B1A1A;">${n} vị</span>
        </div>`).join('');

    return `
    <!-- TỨ KHÍ -->
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#374151;font-size:0.9rem;margin-bottom:10px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#DBEAFE;border-radius:50%;font-size:0.7rem;margin-right:6px;color:#1D4ED8;font-weight:800;">1</span>
            Phân tích Tứ khí
        </div>
        <div style="position:relative;height:26px;border-radius:13px;overflow:hidden;margin-bottom:5px;
            background:linear-gradient(to right,#1E40AF 0%,#2563EB 12%,#38BDF8 25%,#34D399 38%,#A3E635 50%,#FCD34D 62%,#F97316 75%,#EF4444 88%,#991B1B 100%);">
            <div style="position:absolute;left:${tkPct}%;top:-2px;transform:translateX(-50%);font-size:17px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">▼</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#9CA3AF;padding:0 2px;">
            <span>Đại Hàn (大寒)</span><span>Hàn (寒)</span><span>Lương (凉)</span><span>Bình (平)</span><span>Ôn (温)</span><span>Nhiệt (热)</span><span>Đại Nhiệt (大热)</span>
        </div>
        <div style="text-align:center;margin-top:5px;font-size:0.78rem;color:#6B7280;">
            Kết quả: <strong>${tkLabel}</strong> &nbsp;(${r.tuKhiScore.toFixed(2)})
        </div>
    </div>

    <!-- NGŨ VỊ + QUY KINH -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;">
            <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:4px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#FEF9C3;border-radius:50%;font-size:0.75rem;margin-right:6px;">📊</span>
                Phân tích Ngũ vị
            </div>
            <div style="font-size:0.7rem;color:#9CA3AF;margin-bottom:8px; display:flex;align-items:center;gap:5px;">
                <span style="display:inline-block;width:14px;height:3px;background:#EF4444;border-radius:2px;"></span>Tổng hợp ngũ vị &amp; mùi
            </div>
            <canvas id="yhct-chart-nguvi" style="max-height:260px;"></canvas>
        </div>
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;">
            <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:4px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#FEF9C3;border-radius:50%;font-size:0.75rem;margin-right:6px;">📍</span>
                Phân tích Quy kinh
            </div>
            <div style="font-size:0.7rem;color:#9CA3AF;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                <span style="display:inline-block;width:14px;height:3px;background:#F59E0B;border-radius:2px;"></span>Tổng hợp quy kinh
            </div>
            <canvas id="yhct-chart-quykinh" style="max-height:260px;"></canvas>
        </div>
    </div>

    <!-- TGPT + TÁC DỤNG -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;">
            <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:4px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#DCFCE7;border-radius:50%;font-size:0.75rem;margin-right:6px;">⊙</span>
                Phân tích Thăng – Giáng – Phù – Trầm
            </div>
            <div style="font-size:0.7rem;color:#9CA3AF;text-align:center;margin-bottom:4px;">Biểu đồ Radar: Thăng – Giáng – Phù – Trầm</div>
            <canvas id="yhct-chart-tgpt" style="max-height:260px;"></canvas>
        </div>
        <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;">
            <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:10px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#DCFCE7;border-radius:50%;font-size:0.75rem;margin-right:6px;">🌿</span>
                Phân tích Tác dụng YHCT
            </div>
            ${nhomItems||'<div style="color:#9CA3AF;font-style:italic;font-size:0.8rem;">Chưa có dữ liệu nhóm dược lý</div>'}
            <div style="margin-top:10px;padding-top:8px;border-top:1px dashed #E5E7EB;">
                <div style="font-size:0.76rem;color:#6B7280;margin-bottom:4px;font-weight:600;">Hướng vận động:</div>
                <div style="font-size:0.84rem;font-weight:700;color:${r.huongScore>3?'#DC2626':r.huongScore<3?'#2563EB':'#6B7280'};">
                    ${r.huongScore>=4.5?'↑↑ Thăng mạnh':r.huongScore>=3.5?'↑ Thăng nhẹ':r.huongScore<=1.5?'↓↓ Giáng mạnh':r.huongScore<=2.5?'↓ Giáng nhẹ':'↔ Bình hòa'}
                    <span style="font-weight:400;font-size:0.73rem;color:#9CA3AF;"> (${r.huongScore.toFixed(2)}/5)</span>
                </div>
            </div>
        </div>
    </div>

    <!-- BẢNG QTTS -->
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#5B3A1A;font-size:0.88rem;margin-bottom:10px;">
            ⚖️ Phân loại Quân–Thần–Tá–Sứ
            <span style="font-weight:400;font-size:0.74rem;color:#9CA3AF;margin-left:8px;">Tổng = ${r.W.toFixed(1)}g</span>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead><tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB;">
                    <th style="padding:7px 8px;text-align:left;color:#374151;">Vị thuốc</th>
                    <th style="padding:7px 8px;text-align:center;color:#374151;">Gram</th>
                    <th style="padding:7px 8px;text-align:center;color:#374151;">%</th>
                    <th style="padding:7px 8px;text-align:center;color:#374151;">Vai trò</th>
                    <th style="padding:7px 8px;text-align:left;color:#374151;">Nhóm dược lý</th>
                    <th style="padding:7px 8px;text-align:left;color:#374151;">Quy kinh</th>
                </tr></thead>
                <tbody>${vtRows}</tbody>
            </table>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;">
        <button class="btn" onclick="closeTayyModal()">Đóng</button>
    </div>`;
}

function yhctDrawAllCharts(r) {
    if (r.empty || typeof Chart === 'undefined') return;
    if (_yhctChartNguVi)   { _yhctChartNguVi.destroy();   _yhctChartNguVi=null; }
    if (_yhctChartQuyKinh) { _yhctChartQuyKinh.destroy(); _yhctChartQuyKinh=null; }
    if (_yhctChartTGPT)    { _yhctChartTGPT.destroy();    _yhctChartTGPT=null; }

    const radarOpts = (max, step) => ({
        scales: { r: {
            min:0, max,
            ticks: { stepSize:step, font:{size:9}, color:'#9CA3AF', backdropColor:'transparent' },
            grid: { color:'#E5E7EB' },
            pointLabels: { font:{size:10}, color:'#374151' },
        }},
        plugins: { legend:{display:false} },
        animation: { duration:500 },
    });

    const nvLabels = Object.keys(r.nguViNorm);
    const nvData   = Object.values(r.nguViNorm);
    _yhctChartNguVi = new Chart(document.getElementById('yhct-chart-nguvi').getContext('2d'), {
        type:'radar',
        data:{ labels:nvLabels, datasets:[{ data:nvData, fill:true,
            backgroundColor:'rgba(239,68,68,0.12)', borderColor:'#EF4444',
            pointBackgroundColor:'#EF4444', pointRadius:3 }]},
        options: radarOpts(1.0, 0.1),
    });

    const qkLabels = Object.keys(r.quyKinhNorm);
    const qkData   = Object.values(r.quyKinhNorm);
    _yhctChartQuyKinh = new Chart(document.getElementById('yhct-chart-quykinh').getContext('2d'), {
        type:'radar',
        data:{ labels:qkLabels, datasets:[{ data:qkData, fill:true,
            backgroundColor:'rgba(245,158,11,0.12)', borderColor:'#F59E0B',
            pointBackgroundColor:'#F59E0B', pointRadius:3 }]},
        options: radarOpts(1.0, 0.1),
    });

    const tgptLabels = Object.keys(r.tgpt);
    const tgptData   = Object.values(r.tgpt);
    _yhctChartTGPT = new Chart(document.getElementById('yhct-chart-tgpt').getContext('2d'), {
        type:'radar',
        data:{ labels:tgptLabels, datasets:[{ data:tgptData, fill:true,
            backgroundColor:'rgba(249,115,22,0.12)', borderColor:'#F97316',
            pointBackgroundColor:'#F97316', pointRadius:5 }]},
        options: radarOpts(2, 1),
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERRIDE: renderViThuocTab — thêm cột Tứ Khí + Ngũ Vị
// ═══════════════════════════════════════════════════════════════════════════
function renderViThuocTab(el) {
    const tkColor = s => s>=1.5?'#DC2626':s>=0.5?'#F97316':s<=-1.5?'#1D4ED8':s<=-0.5?'#38BDF8':'#6B7280';
    const tkLabel = s => s>=1.5?'Nhiệt':s>=0.5?'Ôn':s<=-1.5?'Đại Hàn':s<=-0.5?'Hàn':'Bình';

    const rows = _thuocData.viThuoc.map(item => {
        const alias = item.ten_goi_khac ? `<div style="font-size:0.72rem;color:#9CA3AF;font-style:italic;">(${escHtml(item.ten_goi_khac)})</div>` : '';
        const nhom  = item.nhom_duoc_ly ? `<div style="font-size:0.68rem;color:#15803D;margin-top:2px;">${escHtml(item.nhom_duoc_ly)}</div>` : '';
        // Công dụng hiển thị tên + ghi chú nếu có
        const parseHtmlList = (str) => {
            return (str||'').split('; ').filter(Boolean).map(entry => {
                const p = entry.split('||');
                const t = escHtml((p[0]||'').trim());
                const n = (p[1]||'').trim();
                return n ? `• ${t} <span style="color:#A09580;font-style:italic;">— ${escHtml(n)}</span>` : `• ${t}`;
            }).join('<br>');
        };

        const cd = parseHtmlList(item.cong_dung);
        const ct = parseHtmlList(item.chu_tri);
        const kk = parseHtmlList(item.kieng_ky);

        const tk = item.tu_khi ?? null;
        const tkText = tk !== null
            ? `<span style="font-size:0.82rem;color:#5B3A1A;font-weight:600;">${tk > 0 ? '+' + tk : tk}</span>`
            : '<span style="color:#D1D5DB;">—</span>';
        
        // Quy kinh: ưu tiên tên viết tắt từ bảng KinhMach
        const qkRaw = item.quy_kinh || '';
        const kinhMachList = (typeof _dongyData !== 'undefined' && _dongyData.kinhMach) ? _dongyData.kinhMach : [];
        const qkDisplay = qkRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean).map(s => {
            const found = kinhMachList.find(k =>
                (k.ten_kinh_mach||'').toLowerCase() === s.toLowerCase() ||
                (k.ten_viet_tat||'').toLowerCase() === s.toLowerCase()
            );
            return found ? (found.ten_viet_tat || found.ten_kinh_mach || s) : s;
        }).join(', ') || '—';
        
        const nv = [
            item.vi_toan>0?`Chua:${item.vi_toan}`:'',
            item.vi_khu >0?`Đắng:${item.vi_khu}`:'',
            item.vi_cam >0?`Ngọt:${item.vi_cam}`:'',
            item.vi_tan >0?`Cay:${item.vi_tan}`:'',
            item.vi_ham >0?`Mặn:${item.vi_ham}`:'',
        ].filter(Boolean).join(' · ') || '—';

        return `<tr>
            <td><div style="font-weight:700;color:#5B3A1A;">${escHtml(item.ten_vi_thuoc)}</div>${alias}${nhom}</td>
            <td style="text-align:center;">${tkText}</td>
            <td style="font-size:0.74rem;color:#5B3A1A;">${nv}</td>
            <td style="font-size:0.74rem;color:#6B7280;">${qkDisplay}</td>
            <td style="font-size:0.76rem;line-height:1.4;">${cd||'—'}</td>
            <td style="font-size:0.76rem;line-height:1.4;color:#B8860B;">${ct||'—'}</td>
            <td style="font-size:0.76rem;line-height:1.4;color:#A32D2D;">${kk||'—'}</td>
            <td style="text-align:center;width:120px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline" onclick="yhctExportViThuocXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('yhct-import-vt').click()">📤 Nhập Excel</button>
                <input type="file" id="yhct-import-vt" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportViThuocXlsx(event)">
            </div>
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th>
                    <th style="text-align:center;">Tứ Khí</th>
                    <th>Ngũ Vị (điểm)</th>
                    <th>Quy kinh</th>
                    <th>Công dụng</th>
                    <th>Chủ trị</th>
                    <th>Kiêng kỵ</th>
                    <th style="width:120px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERRIDE: renderBaiThuocTab — thêm nút 🔬 Radar
// ═══════════════════════════════════════════════════════════════════════════
function renderBaiThuocTab(el) {
    const rows = _thuocData.baiThuoc.map(item => {
        const ings = (item.chiTietViThuoc||[]).map(d=>{
            const ten = d?.viThuoc?.ten_vi_thuoc||'';
            const lieuText = btGetGramPreviewText((d?.lieu_luong||'').trim());
            return ten+(lieuText?` (${lieuText})`:'');
        }).filter(Boolean).join(', ');
        return `<tr>
            <td><strong>${escHtml(item.ten_bai_thuoc)}</strong></td>
            <td>${escHtml(item.nguon_goc||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.bien_chung||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.trieu_chung||'—')}</td>
            <td style="font-size:0.78rem;">${escHtml(item.phap_tri||'—')}</td>
            <td style="font-size:0.75rem;color:#6B5A3A;">${escHtml(ings||'Chưa có vị thuốc')}</td>
            <td style="text-align:center;width:180px;">
                <div class="table-actions" style="justify-content:center;flex-wrap:wrap;gap:4px;">
                    <button class="btn btn-sm" style="background:#F5F0E8;color:#5B3A1A;border:1px solid #D4C5A0;"
                        onclick="openBaiThuocAnalysis(${item.id})">🔬 Radar</button>
                    <button class="btn btn-sm btn-outline" onclick="openBaiThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBaiThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;">
                <button class="btn btn-outline" onclick="yhctExportBaiThuocXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('yhct-import-bt').click()">📤 Nhập Excel</button>
                <input type="file" id="yhct-import-bt" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportBaiThuocXlsx(event)">
            </div>
            <button class="btn btn-primary" onclick="openBaiThuocForm()">+ Thêm bài thuốc</button>
        </div>
        <div class="data-table-container">
            <table>
                <thead><tr>
                    <th>Tên bài thuốc</th><th>Nguồn gốc</th><th>Biện chứng</th>
                    <th>Triệu chứng</th><th>Pháp trị</th><th>Thành phần</th>
                    <th style="width:180px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT / IMPORT (SheetJS)
// ═══════════════════════════════════════════════════════════════════════════
function yhctExportViThuocXlsx() {
   if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
   const data = _thuocData.viThuoc.map(v => ({
       'Tên vị thuốc': v.ten_vi_thuoc,
       'Tên gọi khác': v.ten_goi_khac,
       'Nhóm dược lý': v.nhom_duoc_ly,
       'Tác dụng chính': v.tac_dung_chinh,
       'Quy kinh': v.quy_kinh,
       'Công dụng': v.cong_dung,
       'Chủ trị': v.chu_tri,
       'Kiêng kỵ': v.kieng_ky,
       'Tính': v.tinh,
       'Vị': v.vi,
       'Tứ khí': v.tu_khi,
       'Hướng (Thăng/Giáng)': v.huong_tgpt,
       'Vị chua': v.vi_toan,
       'Vị đắng': v.vi_khu,
       'Vị ngọt': v.vi_cam,
       'Vị cay': v.vi_tan,
       'Vị mặn': v.vi_ham
   }));
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "ViThuoc");
   XLSX.writeFile(wb, "Danh_Muc_Vi_Thuoc.xlsx");
}

function yhctExportBaiThuocXlsx() {
   if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
   const data = _thuocData.baiThuoc.map(b => {
       const tp = (b.chiTietViThuoc||[]).map(d => `${d?.viThuoc?.ten_vi_thuoc||''} (${(d?.lieu_luong||'').trim()})`).join(', ');
       return {
           'Tên bài thuốc': b.ten_bai_thuoc,
           'Nguồn gốc': b.nguon_goc,
           'Biện chứng': b.bien_chung,
           'Triệu chứng': b.trieu_chung,
           'Pháp trị': b.phap_tri,
           'Cách dùng': b.cach_dung,
           'Ghi chú': b.ghi_chu,
           'Thành phần': tp
       };
   });
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "BaiThuoc");
   XLSX.writeFile(wb, "Danh_Muc_Bai_Thuoc.xlsx");
}

function yhctImportViThuocXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if(!confirm(`Tìm thấy ${rows.length} vị thuốc trong Excel. Tiến hành đẩy vào hệ thống?`)) return e.target.value = '';
        
        for (const r of rows) {
            const ten = r['Tên vị thuốc'];
            if (!ten) continue;
            // check exists by name
            if (_thuocData.viThuoc.some(v => v.ten_vi_thuoc === ten)) continue;
            
            const payload = {
                ten_vi_thuoc: ten,
                ten_goi_khac: r['Tên gọi khác']||'',
                nhom_duoc_ly: r['Nhóm dược lý']||'',
                tac_dung_chinh: r['Tác dụng chính']||'',
                quy_kinh: r['Quy kinh']||'',
                cong_dung: r['Công dụng']||'',
                chu_tri: r['Chủ trị']||'',
                kieng_ky: r['Kiêng kỵ']||'',
                tinh: r['Tính']||'',
                vi: r['Vị']||'',
                tu_khi: parseFloat(r['Tứ khí']) || 0,
                huong_tgpt: parseFloat(r['Hướng (Thăng/Giáng)']) || 3,
                vi_toan: parseFloat(r['Vị chua']) || 0,
                vi_khu: parseFloat(r['Vị đắng']) || 0,
                vi_cam: parseFloat(r['Vị ngọt']) || 0,
                vi_tan: parseFloat(r['Vị cay']) || 0,
                vi_ham: parseFloat(r['Vị mặn']) || 0,
            };
            await apiCreateViThuoc(payload);
        }
        alert('Nhập danh mục Vị Thuốc thành công!');
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = ''; // reset file input
    };
    reader.readAsArrayBuffer(file);
}

function yhctImportBaiThuocXlsx(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if(!confirm(`Tìm thấy ${rows.length} bài thuốc. Khuyến khích không Import quá 100 dòng/lần.\nTiếp tục phân tích?`)) return e.target.value = '';
        
        // --- BƯỚC 1: QUÉT TRƯỚC (Dry Run) TÌM LỖI CHÍNH TẢ ---
        const missingHerbsSet = new Set();
        for (const r of rows) {
            const tpText = r['Thành phần']||'';
            const tpArray = tpText.split(',').map(s=>s.trim()).filter(Boolean);
            for (const text of tpArray) {
                let m = text.match(/^(.*?)\s*\((.*?)\)$/);
                let vten = m ? m[1].trim() : text;
                if (!vten) continue;
                
                // Kiểm tra xem tên này đã có trong DB chưa (không phân biệt hoa thường)
                const exists = _thuocData.viThuoc.some(x => x.ten_vi_thuoc.toLowerCase() === vten.toLowerCase());
                if (!exists) {
                    missingHerbsSet.add(vten);
                }
            }
        }

        // Nếu có tên lạ, bật cảnh báo cho User
        if (missingHerbsSet.size > 0) {
            const missingList = Array.from(missingHerbsSet).join(', ');
            const t = confirm(`⚠️ CẢNH BÁO TÊN THUỐC LẠ / GÕ SAI ⚠️\n\nHệ thống phát hiện ${missingHerbsSet.size} vị thuốc sau đây CHƯA CÓ trong danh mục:\n[ ${missingList} ]\n\n- Nếu do bạn NGHĨ SAI TÊN (sai chính tả), hãy ấn [Cancel], sửa lại file Excel rồi Import lại để tránh rác hệ thống.\n- Nếu đây thực sự là thuốc MỚI, ấn [OK] để hệ thống tự động tạo mới chúng.\n\nTiếp tục nhập và tạo mới?`);
            if (!t) {
                e.target.value = '';
                return;
            }
        }
        
        // --- BƯỚC 2: IMPORT THẬT SỰ ---
        for (const r of rows) {
            const ten = r['Tên bài thuốc'];
            if (!ten) continue;
            if (_thuocData.baiThuoc.some(b => b.ten_bai_thuoc === ten)) continue;
            
            // Parse thành phần: "Phục Linh (5 tiền), Liên Kiều (5 tiền)"
            // -> [ { ten: 'Phục Linh', lieu: '5 tiền'} ]
            const tpText = r['Thành phần']||'';
            const tpArray = tpText.split(',').map(s=>s.trim()).filter(Boolean);
            const refDetails = [];
            
            for (const text of tpArray) {
                let m = text.match(/^(.*?)\s*\((.*?)\)$/);
                let vten = '', lieu = '';
                if (m) {
                    vten = m[1].trim();
                    lieu = m[2].trim();
                } else {
                    vten = text;
                }
                
                // Lookup or create ViThuoc
                let v = _thuocData.viThuoc.find(x => x.ten_vi_thuoc.toLowerCase() === vten.toLowerCase());
                if (!v && vten) {
                    const res = await apiCreateViThuoc({ ten_vi_thuoc: vten });
                    if (res.success) {
                        v = res.data;
                        _thuocData.viThuoc.push(v);
                    }
                }
                
                if (v && v.id) {
                    refDetails.push({ idViThuoc: v.id, lieu_luong: lieu });
                }
            }

            const payload = {
                ten_bai_thuoc: ten,
                nguon_goc: r['Nguồn gốc']||'',
                bien_chung: r['Biện chứng']||'',
                trieu_chung: r['Triệu chứng']||'',
                phap_tri: r['Pháp trị']||'',
                cach_dung: r['Cách dùng']||'',
                ghi_chu: r['Ghi chú']||'',
                chiTiet: refDetails
            };
            await apiCreateBaiThuoc(payload);
        }
        alert('Nhập danh mục Bài Thuốc thành công!');
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = ''; // clear input
    };
    reader.readAsArrayBuffer(file);
}
