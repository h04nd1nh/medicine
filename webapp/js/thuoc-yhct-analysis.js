// thuoc-yhct-analysis.js — Load LAST trong index.html
// Ghi đè openViThuocForm, saveViThuoc, renderViThuocTab, renderBaiThuocTab
// Schema vị thuốc khớp mẫu Excel (11 cột nghiệp vụ).
// _vtCurrentQuyKinh khai báo trong thuoc-management.js

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

/** Chuẩn hóa chuỗi so khớp danh mục (không đổi schema DB — phương án 1). */
function yhctNormKey(s) {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Nếu (nhom_lon + nhom_duoc_ly) trùng một dòng trong nhomDuocLy → gán đúng chữ trong danh mục.
 * Nếu chỉ khớp duy nhất theo "nhóm nhỏ" hoặc duy nhất theo "nhóm lớn" → điền/ chuẩn hóa phần còn lại.
 */
function yhctNormalizeNhomFromCatalog(payload) {
    const list = _thuocData.nhomDuocLy || [];
    if (!list.length || !payload) return payload;

    const lon = (payload.nhom_lon || '').trim();
    const nho = (payload.nhom_duoc_ly || '').trim();
    const out = { ...payload };

    const rowNho = (item) => (item.nhom_nho || item.ten_nhom || '').trim();
    const rowLon = (item) => (item.nhom_lon || '').trim();

    if (lon && nho) {
        for (const item of list) {
            const cl = rowLon(item);
            const cn = rowNho(item);
            if (!cn) continue;
            if (yhctNormKey(lon) === yhctNormKey(cl) && yhctNormKey(nho) === yhctNormKey(cn)) {
                out.nhom_lon = cl;
                out.nhom_duoc_ly = cn;
                return out;
            }
        }
    }

    if (nho) {
        const hits = list.filter(item => {
            const cn = rowNho(item);
            return cn && yhctNormKey(nho) === yhctNormKey(cn);
        });
        if (hits.length === 1) {
            const item = hits[0];
            out.nhom_duoc_ly = rowNho(item);
            const cl = rowLon(item);
            if (cl) out.nhom_lon = cl;
            return out;
        }
    }

    if (lon && !nho) {
        const hits = list.filter(item => {
            const cl = rowLon(item);
            return cl && yhctNormKey(lon) === yhctNormKey(cl);
        });
        if (hits.length === 1) {
            const item = hits[0];
            out.nhom_lon = rowLon(item);
            const cn = rowNho(item);
            if (cn) out.nhom_duoc_ly = cn;
            return out;
        }
    }

    return out;
}

function openViThuocForm(id) {
    const item = id ? _thuocData.viThuoc.find(x => x.id == id) : null;

    showTayyModal('Vị thuốc', `
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tên vị thuốc *<br>
                <input id="vt-inp-ten" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.ten_vi_thuoc):''}" placeholder="VD: Ma hoàng"></label>
            <label class="tayy-form-label">Tên gọi khác<br>
                <input id="vt-inp-alias" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.ten_goi_khac||''):''}" placeholder="Cách nhau bởi dấu phẩy"></label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Nhóm lớn<br>
                <input id="vt-inp-nhomlon" type="text" class="tayy-form-input"
                    value="${item?escHtml(item.nhom_lon||''):''}" placeholder="VD: Giải biểu"></label>
            <label class="tayy-form-label">Nhóm dược lý<br>
                <div style="position:relative;">
                    <input id="vt-inp-nhomduocly" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.nhom_duoc_ly||''):''}"
                        oninput="yhctNhomInput(this.value)" onfocus="yhctNhomInput(this.value)"
                        placeholder="VD: Tân ôn giải biểu">
                    <div id="vt-nhom-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <label class="tayy-form-label">Tính<br>
                <div style="position:relative;">
                    <input id="vt-inp-tinh" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.tinh||''):''}"
                        oninput="vtOnTinhSearchInput(this.value)" onfocus="vtOnTinhSearchInput(this.value)"
                        placeholder="VD: Ôn">
                    <div id="vt-tinh-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
            <label class="tayy-form-label">Vị<br>
                <div style="position:relative;">
                    <input id="vt-inp-vi" type="text" class="tayy-form-input"
                        value="${item?escHtml(item.vi||''):''}"
                        oninput="vtOnViSearchInput(this.value)" onfocus="vtOnViSearchInput(this.value)"
                        placeholder="VD: Cay, Đắng">
                    <div id="vt-vi-suggest" style="position:absolute;left:0;right:0;top:calc(100% + 4px);
                        background:#FFFDF7;border:1px solid #D4C5A0;border-radius:8px;
                        box-shadow:0 8px 24px rgba(0,0,0,0.1);max-height:160px;overflow-y:auto;z-index:2500;display:none;"></div>
                </div></label>
        </div>
        <label class="tayy-form-label">Liều dùng<br>
            <input id="vt-inp-lieudung" type="text" class="tayy-form-input"
                value="${item?escHtml(item.lieu_dung||''):''}" placeholder="VD: 2-9g"></label>
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
        <label class="tayy-form-label">Công dụng<br>
            <textarea id="vt-ta-congdung" class="tayy-form-input" rows="3" placeholder="Theo mẫu Excel">${item?escHtml(item.cong_dung||''):''}</textarea></label>
        <label class="tayy-form-label">Chủ trị<br>
            <textarea id="vt-ta-chutri" class="tayy-form-input" rows="2">${item?escHtml(item.chu_tri||''):''}</textarea></label>
        <label class="tayy-form-label">Kiêng kỵ<br>
            <textarea id="vt-ta-kiengky" class="tayy-form-input" rows="2">${item?escHtml(item.kieng_ky||''):''}</textarea></label>
        <div class="tayy-form-actions">
            <button class="btn" onclick="closeTayyModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveViThuoc(${id||0})">Lưu</button>
        </div>
    `, 'wide');

    _vtCurrentQuyKinh = (item?.quy_kinh||'').split(',').map(s=>s.trim()).filter(Boolean);
    vtRenderQuyKinhChips();
}

const _NHOM_LIST = ['Tiêu thực','Bổ khí','Bổ huyết','Bổ âm','Bổ dương','Thanh nhiệt',
    'Giải biểu','Lý khí','Hoạt huyết','Trừ thấp','Tả hạ','Ôn lý','Bình can tức phong',
    'An thần','Hóa đàm','Chỉ ho bình suyễn','Thu sáp','Lợi thủy thẩm thấp','Điều hòa'];

function yhctNhomInput(val) {
    const el = document.getElementById('vt-nhom-suggest');
    if (!el) return;
    const q = (val||'').trim().toLowerCase();
    const existing = [...new Set((_thuocData.viThuoc||[]).map(v=>v.nhom_duoc_ly).filter(Boolean))];
    const fromNhomDanhMuc = [...new Set((_thuocData.nhomDuocLy||[]).map(x => x.nhom_nho || x.ten_nhom).filter(Boolean))];
    const all = [...new Set([..._NHOM_LIST, ...fromNhomDanhMuc, ...existing])];
    const filtered = all.filter(x=>x.toLowerCase().includes(q)).slice(0,10);
    const hasExact = all.some(x=>x.toLowerCase()===q);

    const catalog = (_thuocData.nhomDuocLy||[]).filter(item => {
        const lon = (item.nhom_lon||'').trim();
        const nho = (item.nhom_nho || item.ten_nhom || '').trim();
        if (!nho) return false;
        return lon.toLowerCase().includes(q) || nho.toLowerCase().includes(q);
    }).slice(0, 12);

    let html = catalog.map(item => {
        const lon = (item.nhom_lon||'').trim();
        const nho = (item.nhom_nho || item.ten_nhom || '').trim();
        const label = lon ? `${lon} → ${nho}` : nho;
        const clickJs = `yhctApplyNhomCatalogPair(${JSON.stringify(lon)}, ${JSON.stringify(nho)})`;
        const clickAttr = clickJs.replace(/"/g, '&quot;');
        return `
        <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #F0E8D8;"
            onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background=''"
            onclick="${clickAttr}">
            <div style="font-weight:600;color:#5B3A1A;font-size:0.82rem;">${escHtml(label)}</div>
            <div style="font-size:0.7rem;color:#8B7355;">Danh mục nhóm dược lý</div>
        </div>`;
    }).join('');

    html += filtered.map(m=>`
        <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #F0E8D8;"
            onmouseover="this.style.background='#F5F0E8'" onmouseout="this.style.background=''"
            onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(m)}';document.getElementById('vt-nhom-suggest').style.display='none';">
            <div style="font-weight:600;color:#5B3A1A;font-size:0.82rem;">${escHtml(m)}</div>
        </div>`).join('');

    if (!hasExact && q) html += `
        <div style="padding:8px 12px;cursor:pointer;background:#FAF6EE;border-top:1px dashed #D4C5A0;"
            onmouseover="this.style.background='#EFE8D8'" onmouseout="this.style.background='#FAF6EE'"
            onclick="document.getElementById('vt-inp-nhomduocly').value='${escHtml(val.trim())}';document.getElementById('vt-nhom-suggest').style.display='none';">
            <div style="font-weight:700;color:#CA6222;font-size:0.82rem;">+ Nhập tự do "${escHtml(val.trim())}"</div>
        </div>`;
    el.style.display = html ? 'block' : 'none';
    el.innerHTML = html;
}

function yhctApplyNhomCatalogPair(lon, nho) {
    const a = document.getElementById('vt-inp-nhomlon');
    const b = document.getElementById('vt-inp-nhomduocly');
    const s = document.getElementById('vt-nhom-suggest');
    if (a) a.value = lon || '';
    if (b) b.value = nho || '';
    if (s) s.style.display = 'none';
}

async function saveViThuoc(id) {
    let payload = {
        ten_vi_thuoc:   (document.getElementById('vt-inp-ten')?.value||'').trim(),
        ten_goi_khac:   (document.getElementById('vt-inp-alias')?.value||'').trim(),
        nhom_lon:       (document.getElementById('vt-inp-nhomlon')?.value||'').trim(),
        nhom_duoc_ly:   (document.getElementById('vt-inp-nhomduocly')?.value||'').trim(),
        tinh:           (document.getElementById('vt-inp-tinh')?.value||'').trim(),
        vi:             (document.getElementById('vt-inp-vi')?.value||'').trim(),
        lieu_dung:      (document.getElementById('vt-inp-lieudung')?.value||'').trim(),
        quy_kinh:       _vtCurrentQuyKinh.join(', '),
        cong_dung:      (document.getElementById('vt-ta-congdung')?.value||'').trim(),
        chu_tri:        (document.getElementById('vt-ta-chutri')?.value||'').trim(),
        kieng_ky:       (document.getElementById('vt-ta-kiengky')?.value||'').trim(),
    };
    if (!payload.ten_vi_thuoc) return alert('Thiếu tên vị thuốc!');
    payload = yhctNormalizeNhomFromCatalog(payload);
    const a = document.getElementById('vt-inp-nhomlon');
    const b = document.getElementById('vt-inp-nhomduocly');
    if (a) a.value = payload.nhom_lon || '';
    if (b) b.value = payload.nhom_duoc_ly || '';
    const res = id ? await apiUpdateViThuoc(id, payload) : await apiCreateViThuoc(payload);
    if (!res.success) return alert('Lỗi: ' + res.error);
    closeTayyModal();
    await loadAllThuocData();
    renderThuocSection();
}

async function openBaiThuocAnalysis(baiThuocId) {
    const bt = _thuocData.baiThuoc.find(x => x.id == baiThuocId);
    if (!bt) return alert('Không tìm thấy bài thuốc.');
    const result = yhctAnalyzeLocalSimple(bt);
    showTayyModal(`Phân tích: ${escHtml(bt.ten_bai_thuoc)}`, yhctBuildAnalysisHtml(result), 'wide');
}

function yhctAnalyzeLocalSimple(bt) {
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
        nhom_lon: vt.nhom_lon||'',
        nhom_duoc_ly: vt.nhom_duoc_ly||'',
        quy_kinh: vt.quy_kinh||'',
    }));

    return { ten:bt.ten_bai_thuoc, W, quyKinhNorm, viThuocList };
}

function yhctBuildAnalysisHtml(r) {
    if (r.empty) return `<div style="text-align:center;padding:40px;color:#A09580;font-style:italic;">
        Bài thuốc chưa có vị thuốc.</div>`;

    const roleOrder = {Quân:0,Thần:1,Tá:2,Sứ:3};
    const sortedVt = [...r.viThuocList].sort((a,b)=>(roleOrder[a.vai_tro]||3)-(roleOrder[b.vai_tro]||3)||b.gram-a.gram);
    const vtRows = sortedVt.map(v=>`
        <tr>
            <td style="padding:5px 8px;font-weight:600;">${escHtml(v.ten)}</td>
            <td style="padding:5px 8px;text-align:center;">${v.gram.toFixed ? v.gram.toFixed(1) : v.gram}g</td>
            <td style="padding:5px 8px;text-align:center;">${v.pct}%</td>
            <td style="padding:5px 8px;text-align:center;">
                <span style="background:${v.color};color:#fff;border-radius:10px;padding:2px 9px;font-size:0.75rem;font-weight:700;">${escHtml(v.vai_tro)}</span>
            </td>
            <td style="padding:5px 8px;font-size:0.76rem;color:#5B3A1A;">${escHtml(v.nhom_lon||v.nhom_duoc_ly||'—')}</td>
            <td style="padding:5px 8px;font-size:0.72rem;color:#8B7355;">${escHtml(v.quy_kinh||'—')}</td>
        </tr>`).join('');

    const qkRows = Object.entries(r.quyKinhNorm).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])
        .map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#F5F0E8;border-radius:6px;font-size:0.78rem;margin-bottom:4px;">
            <span>${escHtml(k)}</span><strong>${v}</strong></div>`).join('') || '<div style="color:#9CA3AF;font-size:0.8rem;">Chưa gán quy kinh</div>';

    return `
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#374151;font-size:0.88rem;margin-bottom:8px;">Tổng hợp quy kinh (ước lượng theo liều)</div>
        ${qkRows}
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;background:#fff;margin-bottom:14px;">
        <div style="font-weight:700;color:#5B3A1A;font-size:0.88rem;margin-bottom:10px;">
            Quân–Thần–Tá–Sứ <span style="font-weight:400;font-size:0.74rem;color:#9CA3AF;">Tổng ≈ ${r.W.toFixed(1)}g</span>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead><tr style="background:#F9FAFB;border-bottom:2px solid #E5E7EB;">
                    <th style="padding:7px 8px;text-align:left;">Vị thuốc</th>
                    <th style="padding:7px 8px;text-align:center;">Gram</th>
                    <th style="padding:7px 8px;text-align:center;">%</th>
                    <th style="padding:7px 8px;text-align:center;">Vai trò</th>
                    <th style="padding:7px 8px;text-align:left;">Nhóm</th>
                    <th style="padding:7px 8px;text-align:left;">Quy kinh</th>
                </tr></thead>
                <tbody>${vtRows}</tbody>
            </table>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;">
        <button class="btn" onclick="closeTayyModal()">Đóng</button>
    </div>`;
}

function renderViThuocTab(el) {
    const trunc = (s, n) => {
        const t = (s || '').trim();
        if (!t) return '—';
        if (t.length <= n) return escHtml(t);
        return escHtml(t.slice(0, n)) + '…';
    };
    const rows = _thuocData.viThuoc.map(item => {
        const alias = item.ten_goi_khac ? `<div style="font-size:0.7rem;color:#9CA3AF;font-style:italic;">${escHtml(item.ten_goi_khac)}</div>` : '';
        return `<tr>
            <td><div style="font-weight:700;color:#5B3A1A;">${escHtml(item.ten_vi_thuoc)}</div>${alias}</td>
            <td style="font-size:0.74rem;">${escHtml(item.nhom_lon || '—')}</td>
            <td style="font-size:0.74rem;">${escHtml(item.nhom_duoc_ly || '—')}</td>
            <td style="font-size:0.74rem;">${escHtml(item.tinh || '—')}</td>
            <td style="font-size:0.74rem;">${escHtml(item.vi || '—')}</td>
            <td style="font-size:0.72rem;color:#6B7280;">${trunc(item.quy_kinh, 40)}</td>
            <td style="font-size:0.74rem;">${escHtml(item.lieu_dung || '—')}</td>
            <td style="font-size:0.72rem;line-height:1.35;">${trunc(item.cong_dung, 80)}</td>
            <td style="font-size:0.72rem;line-height:1.35;color:#B8860B;">${trunc(item.chu_tri, 60)}</td>
            <td style="font-size:0.72rem;line-height:1.35;color:#A32D2D;">${trunc(item.kieng_ky, 60)}</td>
            <td style="text-align:center;width:110px;">
                <div class="table-actions" style="justify-content:center;">
                    <button class="btn btn-sm btn-outline" onclick="openViThuocForm(${item.id})">✏ Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViThuoc(${item.id})">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <button class="btn btn-outline" onclick="yhctExportViThuocXlsx()">📥 Xuất Excel</button>
                <button class="btn btn-outline" onclick="document.getElementById('yhct-import-vt').click()">📤 Nhập Excel</button>
                <input type="file" id="yhct-import-vt" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportViThuocXlsx(event)">
                <button type="button" class="btn btn-outline" style="border-style:dashed;opacity:0.92;"
                    title="Import/cập nhật theo đúng 11 cột mẫu Excel."
                    onclick="document.getElementById('yhct-import-vt-dev').click()">📤 Nhập Excel (dev)</button>
                <input type="file" id="yhct-import-vt-dev" accept=".xlsx, .xls, .csv" style="display:none;" onchange="yhctImportViThuocXlsxDev(event)">
            </div>
            <button class="btn btn-primary" onclick="openViThuocForm()">+ Thêm vị thuốc</button>
        </div>
        <div class="data-table-container" style="overflow-x:auto;">
            <table>
                <thead><tr>
                    <th>Tên vị thuốc</th>
                    <th>Nhóm lớn</th>
                    <th>Nhóm dược lý</th>
                    <th>Tính</th>
                    <th>Vị</th>
                    <th>Quy kinh</th>
                    <th>Liều dùng</th>
                    <th>Công dụng</th>
                    <th>Chủ trị</th>
                    <th>Kiêng kỵ</th>
                    <th style="width:110px;text-align:center;">Thao tác</th>
                </tr></thead>
                <tbody>${rows||'<tr><td colspan="11" style="text-align:center;color:#9CA3AF;padding:20px;">Chưa có dữ liệu</td></tr>'}</tbody>
            </table>
        </div>`;
}

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
                        onclick="openBaiThuocAnalysis(${item.id})">Phân tích</button>
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

function yhctViThuocPayloadFromRow(r) {
    const nhomLon = yhctDevPick(r, ['Nhóm lớn', 'Nhom lon']);
    const nhomDL = yhctDevPick(r, ['Nhóm dược lý', 'Nhom duoc ly', 'Nhóm dược ly']);
    const raw = {
        ten_vi_thuoc: yhctDevPick(r, ['Tên vị thuốc', 'Ten vi thuoc']),
        ten_goi_khac: yhctDevPick(r, ['Tên gọi khác', 'Ten goi khac']),
        nhom_lon: nhomLon,
        nhom_duoc_ly: nhomDL,
        tinh: yhctDevPick(r, ['Tính', 'Tinh']),
        vi: yhctDevPick(r, ['Vị', 'Vi']),
        quy_kinh: yhctDevPick(r, ['Quy kinh', 'Quy Kinh']),
        lieu_dung: yhctDevPick(r, ['Liều dùng', 'Lieu dung', 'Liều lượng']),
        cong_dung: yhctDevPick(r, ['Công dụng', 'Cong dung']),
        chu_tri: yhctDevPick(r, ['Chủ trị', 'Chu tri']),
        kieng_ky: yhctDevPick(r, ['Kiêng kỵ', 'Kieng ky']),
    };
    return yhctNormalizeNhomFromCatalog(raw);
}

function yhctNormalizeExcelRowKeys(row) {
    const o = {};
    if (!row || typeof row !== 'object') return o;
    for (const [k, v] of Object.entries(row)) {
        o[String(k).trim()] = v;
    }
    return o;
}

function yhctDevPick(r, keys) {
    for (const k of keys) {
        const v = r[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function yhctExportViThuocXlsx() {
   if (typeof XLSX === 'undefined') return alert('Thư viện Excel đang tải, vui lòng thử lại sau.');
   const data = _thuocData.viThuoc.map(v => ({
       'Tên vị thuốc': v.ten_vi_thuoc,
       'Tên gọi khác': v.ten_goi_khac,
       'Nhóm lớn': v.nhom_lon,
       'Nhóm dược lý': v.nhom_duoc_ly,
       'Tính': v.tinh,
       'Vị': v.vi,
       'Quy kinh': v.quy_kinh,
       'Liều dùng': v.lieu_dung,
       'Công dụng': v.cong_dung,
       'Chủ trị': v.chu_tri,
       'Kiêng kỵ': v.kieng_ky,
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
        const rawRows = XLSX.utils.sheet_to_json(sheet);
        const rows = rawRows.map(yhctNormalizeExcelRowKeys);
        if (!confirm(`Tìm thấy ${rows.length} dòng. Chỉ thêm vị thuốc chưa có tên (bỏ qua trùng)?`)) { e.target.value = ''; return; }

        let created = 0, skipped = 0;
        for (const r of rows) {
            const payload = yhctViThuocPayloadFromRow(r);
            if (!payload.ten_vi_thuoc) { skipped++; continue; }
            if (_thuocData.viThuoc.some(v => (v.ten_vi_thuoc || '').trim().toLowerCase() === payload.ten_vi_thuoc.toLowerCase())) {
                skipped++;
                continue;
            }
            const res = await apiCreateViThuoc(payload);
            if (res.success) created++;
            else skipped++;
        }
        alert(`Nhập xong: thêm ${created}, bỏ qua ${skipped}.`);
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function yhctImportViThuocXlsxDev(e) {
    if (typeof XLSX === 'undefined') return alert('Chưa tải xong thư viện');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet);
        const rows = rawRows.map(yhctNormalizeExcelRowKeys);
        if (!rows.length) {
            alert('File không có dòng dữ liệu.');
            e.target.value = '';
            return;
        }
        if (!confirm(`[dev] ${rows.length} dòng. Import/cập nhật theo 11 cột mẫu Excel?`)) {
            e.target.value = '';
            return;
        }

        let created = 0, updated = 0, skipped = 0;
        for (const r of rows) {
            const payload = yhctViThuocPayloadFromRow(r);
            if (!payload.ten_vi_thuoc) { skipped++; continue; }

            const existing = (_thuocData.viThuoc || []).find(
                v => (v.ten_vi_thuoc || '').trim().toLowerCase() === payload.ten_vi_thuoc.toLowerCase()
            );

            if (existing?.id) {
                const res = await apiUpdateViThuoc(existing.id, payload);
                if (res.success) updated++;
                else skipped++;
            } else {
                const res = await apiCreateViThuoc(payload);
                if (res.success) created++;
                else skipped++;
            }
        }

        alert(`[dev] Thêm ${created}, cập nhật ${updated}, bỏ qua/lỗi ${skipped}.`);
        await loadAllThuocData();
        renderThuocSection();
        e.target.value = '';
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

        const missingHerbsSet = new Set();
        for (const r of rows) {
            const tpText = r['Thành phần']||'';
            const tpArray = tpText.split(',').map(s=>s.trim()).filter(Boolean);
            for (const text of tpArray) {
                let m = text.match(/^(.*?)\s*\((.*?)\)$/);
                let vten = m ? m[1].trim() : text;
                if (!vten) continue;
                const exists = _thuocData.viThuoc.some(x => x.ten_vi_thuoc.toLowerCase() === vten.toLowerCase());
                if (!exists) missingHerbsSet.add(vten);
            }
        }

        if (missingHerbsSet.size > 0) {
            const missingList = Array.from(missingHerbsSet).join(', ');
            const t = confirm(`⚠️ CẢNH BÁO: ${missingHerbsSet.size} vị thuốc chưa có trong danh mục:\n[ ${missingList} ]\n\nTiếp tục và tạo mới?`);
            if (!t) { e.target.value = ''; return; }
        }

        for (const r of rows) {
            const ten = r['Tên bài thuốc'];
            if (!ten) continue;
            if (_thuocData.baiThuoc.some(b => b.ten_bai_thuoc === ten)) continue;

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
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}
