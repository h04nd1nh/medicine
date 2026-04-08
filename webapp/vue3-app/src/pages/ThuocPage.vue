<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { thuocService } from '../services/thuocService'
import type { BaiThuoc, BaiThuocChiTiet, ChuTri, CongDung, KiengKy, KinhMach, NhomDuocLyLon, PhapTri, ViThuoc } from '../types/thuoc'

type ThuocTab = 'vi-thuoc' | 'bai-thuoc' | 'cong-dung' | 'chu-tri' | 'kieng-ky' | 'nhom-duoc-ly'

const activeTab = ref<ThuocTab>('vi-thuoc')
const isLoading = ref(false)
const errorMessage = ref('')

const viThuoc = ref<ViThuoc[]>([])
const kinhMach = ref<KinhMach[]>([])
const baiThuoc = ref<BaiThuoc[]>([])
const phapTri = ref<PhapTri[]>([])
const congDung = ref<CongDung[]>([])
const chuTri = ref<ChuTri[]>([])
const kiengKy = ref<KiengKy[]>([])
const nhomDuocLy = ref<NhomDuocLyLon[]>([])

const formText = ref('')
const formNote = ref('')
const editingId = ref<number | null>(null)
const vtTinh = ref('')
const vtViInput = ref('')
const vtQuyKinhInput = ref('')
const vtViChips = ref<string[]>([])
const vtQuyKinhChips = ref<string[]>([])
const vtLieuDung = ref('')
const vtAliasRows = ref<Array<{ text: string }>>([{ text: '' }])
const vtLinkCongRows = ref<Array<{ id_cong_dung: string; ghi_chu: string }>>([{ id_cong_dung: '', ghi_chu: '' }])
const vtLinkChuTriRows = ref<Array<{ id_chu_tri: string; ghi_chu: string }>>([{ id_chu_tri: '', ghi_chu: '' }])
const vtLinkKiengKyRows = ref<Array<{ id_kieng_ky: string; ghi_chu: string }>>([{ id_kieng_ky: '', ghi_chu: '' }])

const btDraftChiTiet = ref<Array<{ idViThuoc: number; lieu_luong: string; vai_tro: string; ghi_chu: string }>>([])
const btNewIdViThuoc = ref('')
const btNewLieuLuong = ref('')
const btNewVaiTro = ref('')
const btNewGhiChu = ref('')
const btCachDung = ref('')
const btChungTrang = ref('')
const btPhapTriIdsCsv = ref('')

const nhomLonTen = ref('')
const nhomLonEditingId = ref<number | null>(null)
const nhomNhoParentId = ref<number | null>(null)
const nhomNhoTen = ref('')
const nhomNhoMoTa = ref('')
const nhomNhoEditingId = ref<number | null>(null)

const isModalOpen = ref(false)
const modalKind = ref<'simple' | 'nhom-lon' | 'nhom-nho'>('simple')

const tabLabels: Record<ThuocTab, string> = {
  'vi-thuoc': 'Vị thuốc',
  'bai-thuoc': 'Bài thuốc',
  'cong-dung': 'Công dụng',
  'chu-tri': 'Chủ trị',
  'kieng-ky': 'Kiêng kỵ',
  'nhom-duoc-ly': 'Nhóm dược lý',
}
const VT_TINH_OPTIONS = ['Bình', 'Đại Hàn', 'Hàn', 'Hơi Hàn', 'Hơi Ôn', 'Lương', 'Nóng', 'Ôn']

const VI_OPTIONS = ['Chua', 'Đắng', 'Ngọt', 'Cay', 'Mặn']
const filteredViOptions = computed(() => {
  const q = vtViInput.value.trim().toLowerCase()
  return VI_OPTIONS.filter((x) => !vtViChips.value.includes(x)).filter((x) => x.toLowerCase().includes(q))
})
const filteredKinhMachOptions = computed(() => {
  const q = vtQuyKinhInput.value.trim().toLowerCase()
  return (kinhMach.value || [])
    .filter((k) => !vtQuyKinhChips.value.includes(k.ten_kinh_mach))
    .filter((k) => {
      const full = String(k.ten_kinh_mach || '').toLowerCase()
      const short = String(k.ten_viet_tat || '').toLowerCase()
      return full.includes(q) || short.includes(q)
    })
    .slice(0, 10)
})

const currentRows = computed(() => {
  if (activeTab.value === 'vi-thuoc') return viThuoc.value
  if (activeTab.value === 'bai-thuoc') return baiThuoc.value
  if (activeTab.value === 'cong-dung') return congDung.value
  if (activeTab.value === 'chu-tri') return chuTri.value
  if (activeTab.value === 'kieng-ky') return kiengKy.value
  return []
})

const nhomFlatRows = computed(() => {
  return nhomDuocLy.value.flatMap((lon) => {
    const nhoList = Array.isArray(lon.nhomNho) ? lon.nhomNho : []
    if (!nhoList.length) {
      return [{ lonId: lon.id, lonTen: lon.ten_nhom_lon, nhoId: null as number | null, nhoTen: '', nhoMoTa: '' }]
    }
    return nhoList.map((nho) => ({
      lonId: lon.id,
      lonTen: lon.ten_nhom_lon,
      nhoId: nho.id,
      nhoTen: nho.ten_nhom_nho || '',
      nhoMoTa: nho.mo_ta || '',
    }))
  })
})

function getRowLabel(row: any): string {
  if (activeTab.value === 'vi-thuoc') return row.ten_vi_thuoc || ''
  if (activeTab.value === 'bai-thuoc') return row.ten_bai_thuoc || ''
  if (activeTab.value === 'cong-dung') return row.ten_cong_dung || ''
  if (activeTab.value === 'chu-tri') return row.ten_chu_tri || ''
  if (activeTab.value === 'kieng-ky') return row.ten_kieng_ky || ''
  return ''
}

function getRowNote(row: any): string {
  if (activeTab.value === 'bai-thuoc') return row.nguon_goc || ''
  return row.ghi_chu || ''
}

function getViField(row: unknown, key: string): string {
  const obj = row as Record<string, any>
  const value = obj?.[key]
  if (value == null) return ''
  return String(value)
}

function getNestedTextList(row: unknown, key: string, nestedName: string): string {
  const obj = row as Record<string, any>
  const raw = obj?.[key]
  if (!Array.isArray(raw) || raw.length === 0) return ''
  return raw
    .map((x: any) => String(x?.[nestedName] || '').trim())
    .filter(Boolean)
    .join('; ')
}

function getViNhomNho(row: unknown): string {
  const obj = row as Record<string, any>
  const direct = String(obj?.nhom_nho || '').trim()
  if (direct) return direct
  const nested = String(obj?.nhomNho?.ten_nhom_nho || '').trim()
  if (nested) return nested
  const links = Array.isArray(obj?.nhomLinks) ? obj.nhomLinks : []
  const names = [
    ...new Set(
      links
        .map((l: any) => String(l?.nhomNho?.ten_nhom_nho || '').trim())
        .filter(Boolean),
    ),
  ]
  return names.join(', ')
}

function linkSummaryWithNote(rawLinks: unknown, nestedObjKey: string, nestedNameKey: string): string {
  const links = Array.isArray(rawLinks) ? rawLinks : []
  if (!links.length) return ''
  return links
    .map((l: any) => {
      const name = String(l?.[nestedObjKey]?.[nestedNameKey] || '').trim()
      if (!name) return ''
      const note = String(l?.ghi_chu || '').trim()
      return note ? `${name} (${note})` : name
    })
    .filter(Boolean)
    .join('; ')
}

function getViCongDung(row: unknown): string {
  const direct = getViField(row, 'cong_dung')
  if (direct.trim()) return direct
  const obj = row as Record<string, any>
  const linkText = linkSummaryWithNote(obj?.congDungLinks, 'congDung', 'ten_cong_dung')
  if (linkText) return linkText
  return getNestedTextList(row, 'cong_dung_links', 'ten_cong_dung')
}

function getViChuTri(row: unknown): string {
  const direct = getViField(row, 'chu_tri')
  if (direct.trim()) return direct
  const obj = row as Record<string, any>
  const linkText = linkSummaryWithNote(obj?.chuTriLinks, 'chuTri', 'ten_chu_tri')
  if (linkText) return linkText
  return getNestedTextList(row, 'chu_tri_links', 'ten_chu_tri')
}

function getViKiengKy(row: unknown): string {
  const direct = getViField(row, 'kieng_ky')
  if (direct.trim()) return direct
  const obj = row as Record<string, any>
  const linkText = linkSummaryWithNote(obj?.kiengKyLinks, 'kiengKy', 'ten_kieng_ky')
  if (linkText) return linkText
  return getNestedTextList(row, 'kieng_ky_links', 'ten_kieng_ky')
}

function resetSimpleForm() {
  formText.value = ''
  formNote.value = ''
  editingId.value = null
  btDraftChiTiet.value = []
  btNewIdViThuoc.value = ''
  btNewLieuLuong.value = ''
  btNewVaiTro.value = ''
  btNewGhiChu.value = ''
  btCachDung.value = ''
  btChungTrang.value = ''
  btPhapTriIdsCsv.value = ''
  vtTinh.value = ''
  vtViInput.value = ''
  vtQuyKinhInput.value = ''
  vtViChips.value = []
  vtQuyKinhChips.value = []
  vtLieuDung.value = ''
  vtAliasRows.value = [{ text: '' }]
  vtLinkCongRows.value = [{ id_cong_dung: '', ghi_chu: '' }]
  vtLinkChuTriRows.value = [{ id_chu_tri: '', ghi_chu: '' }]
  vtLinkKiengKyRows.value = [{ id_kieng_ky: '', ghi_chu: '' }]
}

function closeModal() {
  isModalOpen.value = false
  resetSimpleForm()
  nhomLonTen.value = ''
  nhomLonEditingId.value = null
  nhomNhoParentId.value = null
  nhomNhoTen.value = ''
  nhomNhoMoTa.value = ''
  nhomNhoEditingId.value = null
}

async function loadThuocData() {
  isLoading.value = true
  errorMessage.value = ''
  const [vt, bt, pt, cd, ct, kk, ndl, km] = await Promise.all([
    thuocService.getViThuoc(),
    thuocService.getBaiThuoc(),
    thuocService.getPhapTri(),
    thuocService.getCongDung(),
    thuocService.getChuTri(),
    thuocService.getKiengKy(),
    thuocService.getNhomDuocLy(),
    thuocService.getKinhMach(),
  ])
  isLoading.value = false

  const firstError = [vt, bt, pt, cd, ct, kk, ndl, km].find((r) => !r.success)
  if (firstError && firstError.error) errorMessage.value = firstError.error.message

  viThuoc.value = vt.success && vt.data ? vt.data : []
  baiThuoc.value = bt.success && bt.data ? bt.data : []
  phapTri.value = pt.success && pt.data ? pt.data : []
  congDung.value = cd.success && cd.data ? cd.data : []
  chuTri.value = ct.success && ct.data ? ct.data : []
  kiengKy.value = kk.success && kk.data ? kk.data : []
  nhomDuocLy.value = ndl.success && ndl.data ? ndl.data : []
  kinhMach.value = km.success && km.data ? km.data : []
}

function openCreateSimpleModal() {
  resetSimpleForm()
  modalKind.value = 'simple'
  isModalOpen.value = true
}

function startEditSimple(row: any) {
  editingId.value = row.id
  formText.value = getRowLabel(row)
  formNote.value = getRowNote(row)
  if (activeTab.value === 'vi-thuoc') {
    vtTinh.value = String(row.tinh || '')
    vtViChips.value = String(row.vi || '')
      .split(/[,，]/g)
      .map((x: string) => x.trim())
      .filter(Boolean)
    vtQuyKinhChips.value = String(row.quy_kinh || '')
      .split(/[,，]/g)
      .map((x: string) => x.trim())
      .filter(Boolean)
    vtLieuDung.value = String(row.lieu_dung || '')

    const aliasList = Array.isArray(row?.tenGoiKhacList)
      ? row.tenGoiKhacList.map((x: any) => ({ text: String(x?.ten_goi_khac || '').trim() })).filter((x: any) => x.text)
      : []
    vtAliasRows.value = aliasList.length ? aliasList : [{ text: '' }]

    const congRows = Array.isArray(row?.congDungLinks)
      ? row.congDungLinks.map((x: any) => ({ id_cong_dung: String(x?.id_cong_dung ?? ''), ghi_chu: String(x?.ghi_chu || '') }))
      : []
    vtLinkCongRows.value = congRows.length ? congRows : [{ id_cong_dung: '', ghi_chu: '' }]

    const chuRows = Array.isArray(row?.chuTriLinks)
      ? row.chuTriLinks.map((x: any) => ({ id_chu_tri: String(x?.id_chu_tri ?? ''), ghi_chu: String(x?.ghi_chu || '') }))
      : []
    vtLinkChuTriRows.value = chuRows.length ? chuRows : [{ id_chu_tri: '', ghi_chu: '' }]

    const kkRows = Array.isArray(row?.kiengKyLinks)
      ? row.kiengKyLinks.map((x: any) => ({ id_kieng_ky: String(x?.id_kieng_ky ?? ''), ghi_chu: String(x?.ghi_chu || '') }))
      : []
    vtLinkKiengKyRows.value = kkRows.length ? kkRows : [{ id_kieng_ky: '', ghi_chu: '' }]
  }
  if (activeTab.value === 'bai-thuoc') {
    const chiTiet = (row as BaiThuoc).chi_tiet || []
    btCachDung.value = String((row as BaiThuoc).cach_dung || '')
    btChungTrang.value = String((row as BaiThuoc).chung_trang || '')
    const ptIds = Array.isArray((row as BaiThuoc).phap_tri_ids) ? (row as BaiThuoc).phap_tri_ids || [] : []
    btPhapTriIdsCsv.value = ptIds.join(', ')
    btDraftChiTiet.value = (Array.isArray(chiTiet) ? chiTiet : [])
      .map((d: BaiThuocChiTiet) => {
        const idViThuoc = Number(d.id_vi_thuoc ?? d.idViThuoc ?? 0)
        if (!Number.isFinite(idViThuoc) || idViThuoc <= 0) return null
        return {
          idViThuoc,
          lieu_luong: String(d.lieu_luong || ''),
          vai_tro: String(d.vai_tro || ''),
          ghi_chu: String(d.ghi_chu || ''),
        }
      })
      .filter((x): x is { idViThuoc: number; lieu_luong: string; vai_tro: string; ghi_chu: string } => Boolean(x))
  }
  modalKind.value = 'simple'
  isModalOpen.value = true
}

function addChiTietRow() {
  const idViThuoc = Number(btNewIdViThuoc.value)
  if (!Number.isFinite(idViThuoc) || idViThuoc <= 0) {
    errorMessage.value = 'Vui long chon vi thuoc hop le'
    return
  }
  btDraftChiTiet.value.push({
    idViThuoc,
    lieu_luong: btNewLieuLuong.value.trim(),
    vai_tro: btNewVaiTro.value.trim(),
    ghi_chu: btNewGhiChu.value.trim(),
  })
  btNewIdViThuoc.value = ''
  btNewLieuLuong.value = ''
  btNewVaiTro.value = ''
  btNewGhiChu.value = ''
}

function removeChiTietRow(index: number) {
  btDraftChiTiet.value.splice(index, 1)
}

function getViThuocNameById(id: number): string {
  const hit = viThuoc.value.find((v) => v.id === id)
  return hit?.ten_vi_thuoc || `#${id}`
}

function parseIdsFromCsv(raw: string): number[] {
  return String(raw || '')
    .split(/[,\s]+/g)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

async function saveSimple() {
  const ten = formText.value.trim()
  if (!ten) {
    errorMessage.value = 'Vui long nhap ten'
    return
  }

  const id = editingId.value
  let result
  if (activeTab.value === 'vi-thuoc') {
    const ten_goi_khac_list = vtAliasRows.value.map((x) => x.text.trim()).filter(Boolean)
    const cong_dung_links = vtLinkCongRows.value
      .filter((x) => x.id_cong_dung)
      .map((x) => ({ id_cong_dung: Number(x.id_cong_dung), ghi_chu: x.ghi_chu.trim() }))
    const chu_tri_links = vtLinkChuTriRows.value
      .filter((x) => x.id_chu_tri)
      .map((x) => ({ id_chu_tri: Number(x.id_chu_tri), ghi_chu: x.ghi_chu.trim() }))
    const kieng_ky_links = vtLinkKiengKyRows.value
      .filter((x) => x.id_kieng_ky)
      .map((x) => ({ id_kieng_ky: Number(x.id_kieng_ky), ghi_chu: x.ghi_chu.trim() }))

    const payload = {
      ten_vi_thuoc: ten,
      tinh: vtTinh.value.trim() || null,
      vi: vtViChips.value.join(', ') || null,
      quy_kinh: vtQuyKinhChips.value.join(', ') || null,
      lieu_dung: vtLieuDung.value.trim() || null,
      ten_goi_khac_list,
      cong_dung_links,
      chu_tri_links,
      kieng_ky_links,
    }
    result = id ? await thuocService.updateViThuoc(id, payload) : await thuocService.createViThuoc(payload)
  } else if (activeTab.value === 'bai-thuoc') {
    const chi_tiet = btDraftChiTiet.value
      .map((d) => {
        const item: Record<string, unknown> = { id_vi_thuoc: d.idViThuoc, idViThuoc: d.idViThuoc }
        if (d.lieu_luong) item.lieu_luong = d.lieu_luong
        if (d.vai_tro) item.vai_tro = d.vai_tro
        if (d.ghi_chu) item.ghi_chu = d.ghi_chu
        return item
      })
      .filter((d) => Number.isFinite(Number(d.id_vi_thuoc)))

    const payload = {
      ten_bai_thuoc: ten,
      nguon_goc: formNote.value.trim() || null,
      cach_dung: btCachDung.value.trim() || null,
      chung_trang: btChungTrang.value.trim() || null,
      phap_tri_ids: parseIdsFromCsv(btPhapTriIdsCsv.value),
      chi_tiet,
    }
    result = id ? await thuocService.updateBaiThuoc(id, payload) : await thuocService.createBaiThuoc(payload)
  } else if (activeTab.value === 'cong-dung') {
    const payload = { ten_cong_dung: ten, ghi_chu: formNote.value.trim() || null }
    result = id ? await thuocService.updateCongDung(id, payload) : await thuocService.createCongDung(payload)
  } else if (activeTab.value === 'chu-tri') {
    const payload = { ten_chu_tri: ten, ghi_chu: formNote.value.trim() || null }
    result = id ? await thuocService.updateChuTri(id, payload) : await thuocService.createChuTri(payload)
  } else {
    const payload = { ten_kieng_ky: ten, ghi_chu: formNote.value.trim() || null }
    result = id ? await thuocService.updateKiengKy(id, payload) : await thuocService.createKiengKy(payload)
  }

  if (!result.success) {
    errorMessage.value = result.error?.message || 'Luu that bai'
    return
  }

  closeModal()
  await loadThuocData()
}

function addViChip(value: string) {
  const v = String(value || '').trim()
  if (!v) return
  if (vtViChips.value.includes(v)) return
  if (vtViChips.value.length >= 5) return
  vtViChips.value.push(v)
  vtViInput.value = ''
}

function removeViChip(value: string) {
  vtViChips.value = vtViChips.value.filter((x) => x !== value)
}
function removeLastViChip() {
  if (vtViChips.value.length) vtViChips.value.pop()
}
function addViFromInput() {
  const q = vtViInput.value.trim()
  if (!q) return
  const hit = VI_OPTIONS.find((x) => x.toLowerCase() === q.toLowerCase())
  addViChip(hit || q)
}

function addKinhChip(value: string) {
  const v = String(value || '').trim()
  if (!v) return
  if (vtQuyKinhChips.value.includes(v)) return
  vtQuyKinhChips.value.push(v)
  vtQuyKinhInput.value = ''
}

function removeKinhChip(value: string) {
  vtQuyKinhChips.value = vtQuyKinhChips.value.filter((x) => x !== value)
}
function removeLastKinhChip() {
  if (vtQuyKinhChips.value.length) vtQuyKinhChips.value.pop()
}
function addKinhFromInput() {
  const q = vtQuyKinhInput.value.trim()
  if (!q) return
  const hit = (kinhMach.value || []).find((k) => {
    const full = String(k.ten_kinh_mach || '').toLowerCase()
    const short = String(k.ten_viet_tat || '').toLowerCase()
    return full === q.toLowerCase() || short === q.toLowerCase()
  })
  addKinhChip(hit?.ten_kinh_mach || q)
}

function addAliasRow() {
  vtAliasRows.value.push({ text: '' })
}
function removeAliasRow(idx: number) {
  if (vtAliasRows.value.length <= 1) {
    vtAliasRows.value[0].text = ''
    return
  }
  vtAliasRows.value.splice(idx, 1)
}

function addCongRow() {
  vtLinkCongRows.value.push({ id_cong_dung: '', ghi_chu: '' })
}
function removeCongRow(idx: number) {
  if (vtLinkCongRows.value.length <= 1) {
    vtLinkCongRows.value[0] = { id_cong_dung: '', ghi_chu: '' }
    return
  }
  vtLinkCongRows.value.splice(idx, 1)
}

function addChuTriRow() {
  vtLinkChuTriRows.value.push({ id_chu_tri: '', ghi_chu: '' })
}
function removeChuTriRow(idx: number) {
  if (vtLinkChuTriRows.value.length <= 1) {
    vtLinkChuTriRows.value[0] = { id_chu_tri: '', ghi_chu: '' }
    return
  }
  vtLinkChuTriRows.value.splice(idx, 1)
}

function addKiengKyRow() {
  vtLinkKiengKyRows.value.push({ id_kieng_ky: '', ghi_chu: '' })
}
function removeKiengKyRow(idx: number) {
  if (vtLinkKiengKyRows.value.length <= 1) {
    vtLinkKiengKyRows.value[0] = { id_kieng_ky: '', ghi_chu: '' }
    return
  }
  vtLinkKiengKyRows.value.splice(idx, 1)
}

async function deleteSimple(id: number) {
  if (!window.confirm(`Xoa ban ghi #${id}?`)) return
  let result
  if (activeTab.value === 'vi-thuoc') result = await thuocService.deleteViThuoc(id)
  else if (activeTab.value === 'bai-thuoc') result = await thuocService.deleteBaiThuoc(id)
  else if (activeTab.value === 'cong-dung') result = await thuocService.deleteCongDung(id)
  else if (activeTab.value === 'chu-tri') result = await thuocService.deleteChuTri(id)
  else result = await thuocService.deleteKiengKy(id)

  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa that bai'
    return
  }
  await loadThuocData()
}

function openCreateNhomLonModal() {
  nhomLonEditingId.value = null
  nhomLonTen.value = ''
  modalKind.value = 'nhom-lon'
  isModalOpen.value = true
}

function startEditNhomLon(row: { id: number; ten_nhom_lon: string }) {
  nhomLonEditingId.value = row.id
  nhomLonTen.value = row.ten_nhom_lon || ''
  modalKind.value = 'nhom-lon'
  isModalOpen.value = true
}

async function saveNhomLon() {
  const ten = nhomLonTen.value.trim()
  if (!ten) return
  const id = nhomLonEditingId.value
  const result = id ? await thuocService.updateNhomLon(id, ten) : await thuocService.createNhomLon(ten)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Luu nhom lon that bai'
    return
  }
  closeModal()
  await loadThuocData()
}

async function deleteNhomLon(id: number) {
  if (!window.confirm(`Xoa nhom lon #${id}?`)) return
  const result = await thuocService.deleteNhomLon(id)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa nhom lon that bai'
    return
  }
  await loadThuocData()
}

function startCreateNhomNho(parentId: number) {
  nhomNhoParentId.value = parentId
  nhomNhoEditingId.value = null
  nhomNhoTen.value = ''
  nhomNhoMoTa.value = ''
  modalKind.value = 'nhom-nho'
  isModalOpen.value = true
}

function startEditNhomNho(parentId: number, row: { id: number; ten_nhom_nho: string; mo_ta?: string }) {
  nhomNhoParentId.value = parentId
  nhomNhoEditingId.value = row.id
  nhomNhoTen.value = row.ten_nhom_nho || ''
  nhomNhoMoTa.value = row.mo_ta || ''
  modalKind.value = 'nhom-nho'
  isModalOpen.value = true
}

async function saveNhomNho() {
  const ten = nhomNhoTen.value.trim()
  if (!ten || !nhomNhoParentId.value) return

  const payload = {
    id_nhom_lon: nhomNhoParentId.value,
    ten_nhom_nho: ten,
    mo_ta: nhomNhoMoTa.value.trim() || null,
  }
  const result = nhomNhoEditingId.value
    ? await thuocService.updateNhomNho(nhomNhoEditingId.value, payload)
    : await thuocService.createNhomNho(payload)

  if (!result.success) {
    errorMessage.value = result.error?.message || 'Luu nhom nho that bai'
    return
  }
  closeModal()
  await loadThuocData()
}

async function deleteNhomNho(id: number) {
  if (!window.confirm(`Xoa nhom nho #${id}?`)) return
  const result = await thuocService.deleteNhomNho(id)
  if (!result.success) {
    errorMessage.value = result.error?.message || 'Xoa nhom nho that bai'
    return
  }
  await loadThuocData()
}

function setTab(tab: ThuocTab) {
  activeTab.value = tab
  closeModal()
  errorMessage.value = ''
}

onMounted(loadThuocData)
</script>

<template>
  <section class="page-card">
    <h2>Quản lý Thuốc</h2>
    <div class="thuoc-tabs">
      <button
        v-for="(label, key) in tabLabels"
        :key="key"
        class="ghost-btn"
        :class="{ 'tab-active': activeTab === key }"
        type="button"
        @click="setTab(key as ThuocTab)"
      >
        {{ label }}
      </button>
    </div>

    <p v-if="isLoading">Dang tai du lieu thuoc...</p>
    <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <template v-else>
      <template v-if="activeTab !== 'nhom-duoc-ly'">
        <div class="toolbar-row" style="margin-bottom: 10px">
          <p>Tong so: {{ currentRows.length }}</p>
          <button class="primary-btn" type="button" @click="openCreateSimpleModal">Them moi</button>
        </div>
        <template v-if="activeTab === 'vi-thuoc'">
          <div class="table-wrap">
            <table class="legacy-table">
              <thead>
                <tr>
                  <th style="width: 18%">Tên vị thuốc</th>
                  <th style="width: 10%">Nhóm nhỏ</th>
                  <th style="width: 7%">Tính</th>
                  <th style="width: 7%">Vị</th>
                  <th style="width: 10%">Quy kinh</th>
                  <th style="width: 8%">Liều dùng</th>
                  <th style="width: 14%">Công dụng</th>
                  <th style="width: 12%">Chủ trị</th>
                  <th style="width: 10%">Kiêng kỵ</th>
                  <th style="width: 110px">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in currentRows" :key="row.id">
                  <td><strong>{{ getViField(row, 'ten_vi_thuoc') || '-' }}</strong></td>
                  <td>{{ getViNhomNho(row) || '-' }}</td>
                  <td>{{ getViField(row, 'tinh') || '-' }}</td>
                  <td>{{ getViField(row, 'vi') || '-' }}</td>
                  <td>{{ getViField(row, 'quy_kinh') || '-' }}</td>
                  <td>{{ getViField(row, 'lieu_dung') || '-' }}</td>
                  <td>{{ getViCongDung(row) || '-' }}</td>
                  <td>{{ getViChuTri(row) || '-' }}</td>
                  <td>{{ getViKiengKy(row) || '-' }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="ghost-btn" type="button" @click="startEditSimple(row)">Sua</button>
                      <button class="danger-btn" type="button" @click="deleteSimple(row.id)">Xoa</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="currentRows.length === 0">
                  <td colspan="10">Khong co du lieu.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <template v-else>
          <div class="table-wrap">
            <table class="legacy-table">
              <thead>
                <tr>
                  <th style="width: 80px">ID</th>
                  <th>Tên</th>
                  <th style="width: 35%">Ghi chú</th>
                  <th style="width: 180px">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in currentRows" :key="row.id">
                  <td>#{{ row.id }}</td>
                  <td>{{ getRowLabel(row) }}</td>
                  <td>{{ getRowNote(row) }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="ghost-btn" type="button" @click="startEditSimple(row)">Sua</button>
                      <button class="danger-btn" type="button" @click="deleteSimple(row.id)">Xoa</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="currentRows.length === 0">
                  <td colspan="4">Khong co du lieu.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>

      <template v-else>
        <div class="toolbar-row" style="margin-bottom: 10px">
          <p>Tong so dong: {{ nhomFlatRows.length }}</p>
          <button class="primary-btn" type="button" @click="openCreateNhomLonModal">Them nhom lon</button>
        </div>

        <div class="table-wrap">
          <table class="legacy-table">
            <thead>
              <tr>
                <th style="width: 30%">Nhóm lớn</th>
                <th style="width: 30%">Nhóm nhỏ</th>
                <th>Mô tả</th>
                <th style="width: 260px">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in nhomFlatRows" :key="`${row.lonId}-${row.nhoId ?? 'none'}`">
                <td>#{{ row.lonId }} - {{ row.lonTen }}</td>
                <td>{{ row.nhoId ? `#${row.nhoId} - ${row.nhoTen}` : '-' }}</td>
                <td>{{ row.nhoMoTa || '-' }}</td>
                <td>
                  <div class="row-actions">
                    <button class="ghost-btn" type="button" @click="startCreateNhomNho(row.lonId)">Them nho</button>
                    <button class="ghost-btn" type="button" @click="startEditNhomLon({ id: row.lonId, ten_nhom_lon: row.lonTen })">Sua lon</button>
                    <button v-if="row.nhoId" class="ghost-btn" type="button" @click="startEditNhomNho(row.lonId, { id: row.nhoId, ten_nhom_nho: row.nhoTen, mo_ta: row.nhoMoTa })">Sua nho</button>
                    <button v-if="row.nhoId" class="danger-btn" type="button" @click="deleteNhomNho(row.nhoId)">Xoa nho</button>
                    <button v-else class="danger-btn" type="button" @click="deleteNhomLon(row.lonId)">Xoa lon</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <h3 v-if="modalKind === 'simple'">{{ editingId ? 'Cap nhat' : 'Them moi' }} - {{ tabLabels[activeTab] }}</h3>
        <h3 v-else-if="modalKind === 'nhom-lon'">{{ nhomLonEditingId ? 'Cap nhat nhom lon' : 'Them nhom lon' }}</h3>
        <h3 v-else>{{ nhomNhoEditingId ? 'Cap nhat nhom nho' : 'Them nhom nho' }}</h3>

        <template v-if="modalKind === 'simple'">
          <div class="patient-create-grid">
            <input v-model="formText" type="text" placeholder="Nhap ten" />
            <input
              v-if="activeTab !== 'vi-thuoc'"
              v-model="formNote"
              type="text"
              :placeholder="activeTab === 'bai-thuoc' ? 'Nguon goc (tuy chon)' : 'Ghi chu (tuy chon)'"
            />
          </div>
          <div v-if="activeTab === 'vi-thuoc'" class="patient-create-grid" style="margin-top: 8px">
            <select v-model="vtTinh">
              <option value="">— Chon tinh —</option>
              <option v-for="t in VT_TINH_OPTIONS" :key="`tinh-${t}`" :value="t">{{ t }}</option>
            </select>
            <div class="chip-field">
              <div class="chips-container">
                <span v-for="chip in vtViChips" :key="`vi-${chip}`" class="chip">
                  {{ chip }}
                  <span class="chip-remove" @click="removeViChip(chip)">×</span>
                </span>
                <input
                  v-model="vtViInput"
                  type="text"
                  class="chip-input"
                  placeholder="Vi (toi da 5)"
                  @keydown.enter.prevent="addViFromInput"
                  @keydown.backspace="!vtViInput && removeLastViChip()"
                />
              </div>
              <div v-if="vtViInput && filteredViOptions.length" class="chip-suggest">
                <div
                  v-for="o in filteredViOptions"
                  :key="`vi-opt-${o}`"
                  class="chip-suggest-item"
                  @mousedown.prevent="addViChip(o)"
                >
                  {{ o }}
                </div>
              </div>
            </div>
            <div class="chip-field">
              <div class="chips-container">
                <span v-for="chip in vtQuyKinhChips" :key="`qk-${chip}`" class="chip">
                  {{ chip }}
                  <span class="chip-remove" @click="removeKinhChip(chip)">×</span>
                </span>
                <input
                  v-model="vtQuyKinhInput"
                  type="text"
                  class="chip-input"
                  placeholder="Quy kinh (chon nhieu)"
                  @keydown.enter.prevent="addKinhFromInput"
                  @keydown.backspace="!vtQuyKinhInput && removeLastKinhChip()"
                />
              </div>
              <div v-if="vtQuyKinhInput && filteredKinhMachOptions.length" class="chip-suggest">
                <div
                  v-for="o in filteredKinhMachOptions"
                  :key="`qk-opt-${o.id}`"
                  class="chip-suggest-item"
                  @mousedown.prevent="addKinhChip(o.ten_kinh_mach)"
                >
                  <strong v-if="o.ten_viet_tat" class="chip-suggest-short">{{ o.ten_viet_tat }}</strong>{{ o.ten_kinh_mach }}
                </div>
              </div>
            </div>
            <input v-model="vtLieuDung" type="text" placeholder="Lieu dung" />
          </div>
          <div v-if="activeTab === 'vi-thuoc'" class="chi-tiet-box" style="margin-top:8px;">
            <h4>Ten goi khac (nhieu dong)</h4>
            <div v-for="(r, idx) in vtAliasRows" :key="`alias-${idx}`" class="row-actions" style="margin-bottom:6px;">
              <input v-model="r.text" type="text" placeholder="Nhap ten goi khac" style="flex:1;" />
              <button class="danger-btn" type="button" @click="removeAliasRow(idx)">Xoa</button>
            </div>
            <button class="ghost-btn" type="button" @click="addAliasRow">+ Them ten</button>
          </div>

          <div v-if="activeTab === 'vi-thuoc'" class="chi-tiet-box" style="margin-top:8px;">
            <h4>Cong dung (danh muc + ghi chu)</h4>
            <div v-for="(r, idx) in vtLinkCongRows" :key="`cd-${idx}`" class="patient-create-grid" style="margin-bottom:6px;">
              <select v-model="r.id_cong_dung">
                <option value="">-- Chon cong dung --</option>
                <option v-for="x in congDung" :key="x.id" :value="String(x.id)">{{ x.ten_cong_dung }}</option>
              </select>
              <input v-model="r.ghi_chu" type="text" placeholder="Ghi chu rieng" />
              <button class="danger-btn" type="button" @click="removeCongRow(idx)">Xoa</button>
            </div>
            <button class="ghost-btn" type="button" @click="addCongRow">+ Them cong dung</button>
          </div>

          <div v-if="activeTab === 'vi-thuoc'" class="chi-tiet-box" style="margin-top:8px;">
            <h4>Chu tri (danh muc + ghi chu)</h4>
            <div v-for="(r, idx) in vtLinkChuTriRows" :key="`ct-${idx}`" class="patient-create-grid" style="margin-bottom:6px;">
              <select v-model="r.id_chu_tri">
                <option value="">-- Chon chu tri --</option>
                <option v-for="x in chuTri" :key="x.id" :value="String(x.id)">{{ x.ten_chu_tri }}</option>
              </select>
              <input v-model="r.ghi_chu" type="text" placeholder="Ghi chu rieng" />
              <button class="danger-btn" type="button" @click="removeChuTriRow(idx)">Xoa</button>
            </div>
            <button class="ghost-btn" type="button" @click="addChuTriRow">+ Them chu tri</button>
          </div>

          <div v-if="activeTab === 'vi-thuoc'" class="chi-tiet-box" style="margin-top:8px;">
            <h4>Kieng ky (danh muc + ghi chu)</h4>
            <div v-for="(r, idx) in vtLinkKiengKyRows" :key="`kk-${idx}`" class="patient-create-grid" style="margin-bottom:6px;">
              <select v-model="r.id_kieng_ky">
                <option value="">-- Chon kieng ky --</option>
                <option v-for="x in kiengKy" :key="x.id" :value="String(x.id)">{{ x.ten_kieng_ky }}</option>
              </select>
              <input v-model="r.ghi_chu" type="text" placeholder="Ghi chu rieng" />
              <button class="danger-btn" type="button" @click="removeKiengKyRow(idx)">Xoa</button>
            </div>
            <button class="ghost-btn" type="button" @click="addKiengKyRow">+ Them kieng ky</button>
          </div>

          <div v-if="activeTab === 'bai-thuoc'" class="chi-tiet-box">
            <h4>Chi tiet vi thuoc</h4>
            <div class="patient-create-grid">
              <select v-model="btNewIdViThuoc">
                <option value="">-- Chon vi thuoc --</option>
                <option v-for="v in viThuoc" :key="v.id" :value="String(v.id)">{{ v.ten_vi_thuoc }}</option>
              </select>
              <input v-model="btNewLieuLuong" type="text" placeholder="Lieu luong (tuy chon)" />
              <input v-model="btNewVaiTro" type="text" placeholder="Vai tro (tuy chon)" />
              <input v-model="btNewGhiChu" type="text" placeholder="Ghi chu (tuy chon)" />
            </div>
            <div class="patient-create-grid" style="margin-top: 8px">
              <input v-model="btCachDung" type="text" placeholder="Cach dung (tuy chon)" />
              <input v-model="btChungTrang" type="text" placeholder="Chung trang (tuy chon)" />
              <input v-model="btPhapTriIdsCsv" type="text" placeholder="Phap tri IDs, vd: 1,2,3" style="grid-column: span 2" />
            </div>
            <button class="ghost-btn" type="button" @click="addChiTietRow">Them dong chi tiet</button>
            <ul class="simple-list" v-if="btDraftChiTiet.length">
              <li v-for="(d, idx) in btDraftChiTiet" :key="`${d.idViThuoc}-${idx}`" class="patient-row">
                <div>
                  <strong>{{ getViThuocNameById(d.idViThuoc) }}</strong>
                  <span v-if="d.lieu_luong"> - Lieu: {{ d.lieu_luong }}</span>
                  <span v-if="d.vai_tro"> - Vai tro: {{ d.vai_tro }}</span>
                  <span v-if="d.ghi_chu"> - Ghi chu: {{ d.ghi_chu }}</span>
                </div>
                <button class="danger-btn" type="button" @click="removeChiTietRow(idx)">Xoa</button>
              </li>
            </ul>
          </div>

          <div class="row-actions">
            <button class="primary-btn" type="button" @click="saveSimple">{{ editingId ? 'Luu' : 'Them' }}</button>
            <button class="ghost-btn" type="button" @click="closeModal">Dong</button>
          </div>
        </template>

        <template v-else-if="modalKind === 'nhom-lon'">
          <input v-model="nhomLonTen" type="text" placeholder="Ten nhom lon" />
          <div class="row-actions" style="margin-top: 10px">
            <button class="primary-btn" type="button" @click="saveNhomLon">{{ nhomLonEditingId ? 'Luu nhom lon' : 'Them nhom lon' }}</button>
            <button class="ghost-btn" type="button" @click="closeModal">Dong</button>
          </div>
        </template>

        <template v-else>
          <div class="patient-create-grid">
            <input v-model="nhomNhoTen" type="text" placeholder="Ten nhom nho" />
            <input v-model="nhomNhoMoTa" type="text" placeholder="Mo ta (tuy chon)" />
          </div>
          <div class="row-actions" style="margin-top: 10px">
            <button class="primary-btn" type="button" @click="saveNhomNho">{{ nhomNhoEditingId ? 'Luu nhom nho' : 'Them nhom nho' }}</button>
            <button class="ghost-btn" type="button" @click="closeModal">Dong</button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
