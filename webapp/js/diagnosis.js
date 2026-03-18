/**
 * DiagnosisLogic - Tính toán Bát Cương theo công thức chuẩn Excel Kinh Lạc Gia Minh
 * 
 * Công thức:
 *   Max = MAX(12 giá trị nhóm, 37)
 *   Min = MIN(12 giá trị nhóm, 35)
 *   Range = Max - Min
 *   Avg = (Max + Min) / 2
 *   Step = Range / 6
 *   UpLimit = Avg + Step
 *   LowLimit = Avg - Step
 *   
 * Phân loại:
 *   (+) = Thực/Nhiệt  nếu giá trị > UpLimit
 *   (-) = Hư/Hàn      nếu giá trị < LowLimit
 *   Bình thường        nếu ở giữa
 *
 * Bát Cương mỗi kinh:
 *   Cả Trái & Phải (+) => Lý Nhiệt
 *   Cả Trái & Phải (-) => Lý Hàn
 *   Chỉ một phía (+)   => Biểu Nhiệt
 *   Chỉ một phía (-)   => Biểu Hàn
 *   Không có gì        => Bình thường
 *
 * Kết luận tổng thể (Toàn thân):
 *   Dựa trên tổng số kinh Hư vs Thực so sánh với nhau.
 */

const DiagnosisLogic = {

    round2: (v) => Math.round(v * 100) / 100,

    /**
     * Tính baseline statistics cho một nhóm kinh (Tay hoặc Chân)
     * @param {number[]} values - mảng giá trị thực đo (đã lọc > 0)
     */
    calcBaseline(values) {
        if (!values || values.length === 0) {
            return { max: 37, min: 35, range: 2, avg: 36, step: 2/6, up: 36 + 2/6, low: 36 - 2/6 };
        }
        // Theo Excel: luôn so sánh thêm với ngưỡng cứng 37 (max) và 35 (min)
        const max  = Math.max(...values, 37);
        const min  = Math.min(...values, 35);
        const range = this.round2(max - min);
        const avg   = this.round2((max + min) / 2);
        const step  = this.round2(range / 6);
        const up    = this.round2(avg + step);
        const low   = this.round2(avg - step);
        return { max, min, range, avg, step, up, low };
    },

    /**
     * Phân loại trạng thái một giá trị đo
     */
    getStatus(val, up, low) {
        if (val === null || val === undefined || val === 0) return '';
        if (val > up)  return '+';
        if (val < low) return '-';
        return '';
    },

    /**
     * Lấy nhãn Bát Cương cho một cặp (L, R)
     */
    getBatCuong(leftStatus, rightStatus) {
        if (leftStatus === '+' && rightStatus === '+') return 'Lý Nhiệt';
        if (leftStatus === '-' && rightStatus === '-') return 'Lý Hàn';
        if (leftStatus === '+' || rightStatus === '+') return 'Biểu Nhiệt';
        if (leftStatus === '-' || rightStatus === '-') return 'Biểu Hàn';
        return '';
    },

    /**
     * Hàm chính: tính toán đầy đủ cho một phiếu khám
     * @param {object} data - bản ghi phiếu khám từ JSON
     */
    performFullDiagnosis(data) {
        // ---- Nhóm Tay (Chi trên / Tren) ----
        const trenValues = [
            data.pheTrai,       data.phePhai,
            data.daitrangTrai,  data.daitrangPhai,
            data.tamTrai,       data.tamPhai,
            data.tieutruongTrai,data.tieutruongPhai,
            data.tambaoTrai,    data.tambaoPhai,
            data.tamtieuTrai,   data.tamtieuPhai,
        ].map(v => parseFloat(v) || 0).filter(v => v > 0);

        // ---- Nhóm Chân (Chi dưới / Duoi) ----
        const duoiValues = [
            data.viTrai,        data.viPhai,
            data.tyTrai,        data.tyPhai,
            data.bangquangTrai, data.bangquangPhai,
            data.thanTrai,      data.thanPhai,
            data.damTrai,       data.damPhai,
            data.canTrai,       data.canPhai,
        ].map(v => parseFloat(v) || 0).filter(v => v > 0);

        const bTren = this.calcBaseline(trenValues);
        const bDuoi = this.calcBaseline(duoiValues);

        // ---- Danh sách 12 kinh ----
        const meridianDefs = [
            { id: 'phe',        name: 'Phế',         group: 'tren' },
            { id: 'daitrang',   name: 'Đại Trường',  group: 'tren' },
            { id: 'tam',        name: 'Tâm',         group: 'tren' },
            { id: 'tieutruong', name: 'Tiểu Trường', group: 'tren' },
            { id: 'tambao',     name: 'Tâm Bào',     group: 'tren' },
            { id: 'tamtieu',    name: 'Tam Tiêu',    group: 'tren' },
            { id: 'vi',         name: 'Vị',          group: 'duoi' },
            { id: 'ty',         name: 'Tỳ',          group: 'duoi' },
            { id: 'bangquang',  name: 'Bàng Quang',  group: 'duoi' },
            { id: 'than',       name: 'Thận',        group: 'duoi' },
            { id: 'dam',        name: 'Đởm',         group: 'duoi' },
            { id: 'can',        name: 'Can',         group: 'duoi' },
        ];

        const meridianStats  = {};
        const categories = { lyNhiet: [], lyHan: [], bieuNhiet: [], bieuHan: [] };

        meridianDefs.forEach(m => {
            const b   = m.group === 'tren' ? bTren : bDuoi;
            const L   = parseFloat(data[m.id + 'Trai']) || 0;
            const R   = parseFloat(data[m.id + 'Phai']) || 0;
            const avg = this.round2((L + R) / 2);
            // Độ chênh: lấy theo bên bất thường (L ưu tiên)
            const leftSt  = this.getStatus(L, b.up, b.low);
            const rightSt = this.getStatus(R, b.up, b.low);
            const bat   = this.getBatCuong(leftSt, rightSt);
            // Giá trị chênh lệch so với ngưỡng
            let diff = 0;
            if (leftSt === '+')      diff = this.round2(L - b.up);
            else if (leftSt === '-') diff = this.round2(L - b.low);
            else if (rightSt === '+') diff = this.round2(R - b.up);
            else if (rightSt === '-') diff = this.round2(R - b.low);

            meridianStats[m.id] = {
                name: m.name, group: m.group,
                leftValue: L, rightValue: R,
                avg,
                absDelta: this.round2(Math.abs(L - R)),
                diff,
                baseline: b.avg, upLimit: b.up, lowLimit: b.low,
                leftStatus: leftSt, rightStatus: rightSt,
                batCuong: bat
            };

            // Phân loại Bát Cương tổng
            if (bat === 'Lý Nhiệt')   categories.lyNhiet.push(m.name);
            else if (bat === 'Lý Hàn')    categories.lyHan.push(m.name);
            else if (bat === 'Biểu Nhiệt') categories.bieuNhiet.push(m.name);
            else if (bat === 'Biểu Hàn')   categories.bieuHan.push(m.name);
        });

        // ---- Tính Bát Cương tổng thể toàn thân ----
        const totalThuc = Object.values(meridianStats).filter(s => s.leftStatus === '+' || s.rightStatus === '+').length;
        const totalHu   = Object.values(meridianStats).filter(s => s.leftStatus === '-' || s.rightStatus === '-').length;

        // Âm/Dương tổng (theo chênh lệch Tay vs Chân)
        const amDuong = bTren.avg > bDuoi.avg + 1 ? 'DƯƠNG THỊNH' :
                        bDuoi.avg > bTren.avg + 1 ? 'ÂM THỊNH'    : 'CÂN BẰNG';

        // Biểu/Lý: nếu ≥ 4 kinh "Lý" → Lý, ngược lại Biểu
        const totalLy = categories.lyNhiet.length + categories.lyHan.length;
        const bieuLy  = totalLy >= 4 ? 'LÝ' : 'BIỂU';

        // Hàn/Nhiệt: so sánh tổng số Hàn vs Nhiệt
        const totalNhiet = categories.lyNhiet.length + categories.bieuNhiet.length;
        const totalHan2  = categories.lyHan.length   + categories.bieuHan.length;
        const hanNhiet   = totalNhiet >= totalHan2 ? 'NHIỆT' : 'HÀN';

        // Hư/Thực: so tổng kinh Thực vs Hư
        const huThuc = totalThuc >= totalHu ? 'THỰC' : 'HƯ';

        // Khí huyết thịnh suy (theo GIA MINH: Âm/Dương + Khí từ chi trên, Huyết từ chi dưới)
        let thucTren = 0, huTren = 0, thucDuoi = 0, huDuoi = 0;
        meridianDefs.forEach(m => {
            const s = meridianStats[m.id];
            if (!s) return;
            const thuc = s.leftStatus === '+' || s.rightStatus === '+';
            const hu   = s.leftStatus === '-' || s.rightStatus === '-';
            if (m.group === 'tren') {
                if (thuc) thucTren++;
                if (hu)   huTren++;
            } else {
                if (thuc) thucDuoi++;
                if (hu)   huDuoi++;
            }
        });
        const amDuongPart = amDuong === 'DƯƠNG THỊNH' ? 'Âm hư' : (amDuong === 'ÂM THỊNH' ? 'Dương hư' : '');
        const khiPart    = thucTren > huTren ? 'Khí thịnh' : (thucTren < huTren ? 'Khí hư' : '');
        const huyetPart  = thucDuoi > huDuoi ? 'Huyết thịnh' : (thucDuoi < huDuoi ? 'Huyết hư' : '');
        const khihuyetParts = [amDuongPart, khiPart, huyetPart].filter(Boolean);
        const khihuyetConclusion = khihuyetParts.length ? khihuyetParts.join(' - ') : '';

        // ---- Kết luận văn bản ----
        let conclusion = `[${amDuong}] - [${bieuLy}] - [${hanNhiet}] - [${huThuc}]. `;
        conclusion += `Ghi nhận ${totalThuc} kinh Thực (+), ${totalHu} kinh Hư (-).`;
        if (bTren.avg > bDuoi.avg + 1) conclusion += ' Thượng nhiệt Hạ hàn.';
        else if (bDuoi.avg > bTren.avg + 1) conclusion += ' Thượng hàn Hạ nhiệt.';
        if (categories.lyNhiet.length > 0) conclusion += ` Lý Nhiệt: ${categories.lyNhiet.join(', ')}.`;
        if (categories.lyHan.length > 0)   conclusion += ` Lý Hàn: ${categories.lyHan.join(', ')}.`;
        if (categories.bieuNhiet.length > 0) conclusion += ` Biểu Nhiệt: ${categories.bieuNhiet.join(', ')}.`;
        if (categories.bieuHan.length > 0)   conclusion += ` Biểu Hàn: ${categories.bieuHan.join(', ')}.`;

        return {
            meridianStats,
            categories,
            batCuongTong: { amDuong, bieuLy, hanNhiet, huThuc },
            khihuyetConclusion,
            conclusion,
            baselines: {
                // Tay
                max_tren: bTren.max, min_tren: bTren.min, range_tren: bTren.range,
                avg_tren: bTren.avg, step_tren: bTren.step, up_tren: bTren.up, low_tren: bTren.low,
                // Chân
                max_duoi: bDuoi.max, min_duoi: bDuoi.min, range_duoi: bDuoi.range,
                avg_duoi: bDuoi.avg, step_duoi: bDuoi.step, up_duoi: bDuoi.up, low_duoi: bDuoi.low,
            }
        };
    }
};

window.DiagnosisLogic = DiagnosisLogic;
