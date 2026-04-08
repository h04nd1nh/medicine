# Kế Hoạch Migrate Vue 3 + TypeScript (Tracking)

## Trạng thái tổng quan

### Đã làm
- Chốt mục tiêu: migrate `webapp/` sang Vue 3 + TypeScript, giữ 100% chức năng và giao diện.
- Khảo sát cấu trúc hiện tại: `index.html` + nhiều file JS global (đặc biệt `app.js`, `api.js`, `thuoc-management.js`).
- Chốt chiến lược triển khai: **incremental migration** (chạy song song cũ/mới, không big-bang).
- Chốt kiến trúc giai đoạn đầu: dùng sớm **Vue Router 4 + Pinia**.
- Xác định rủi ro chính cần giữ tương thích: auth token/localStorage, contract API, semantics payload.
- Đã scaffold `webapp/vue3-app` (Vite + Vue 3 + TypeScript), build thành công.
- Đã tích hợp `Vue Router` + `Pinia`, có auth guard cơ bản.
- Đã tạo bridge bật/tắt Vue3 từ legacy (`?vue3=1` / `?vue3=0`) trong `webapp/index.html`.
- Đã đồng bộ sidebar Vue theo **đúng 8 tab** của legacy.
- Đã migrate typed API bước đầu: `auth`, `patients`, `examinations`, `appointments`.
- Đã có CRUD bước đầu cho `patients` và `examinations` trên Vue shell (tạo/sửa/xóa + tìm kiếm/phân trang cơ bản).

### Đang làm
- Hoàn thiện parity UI/UX theo từng module khi chuyển từ placeholder sang feature thật.
- Migrate dần các tab còn lại theo đúng thứ tự nghiệp vụ legacy.

### Chưa làm
- Chưa hoàn tất typed services cho toàn bộ domain trong `api.js`.
- Chưa migrate sâu các tab: Tây Y, Kinh Lạc, Thuốc, Triệu chứng, Pháp trị.
- Chưa triển khai test tự động (contract test/E2E smoke).
- Chưa đạt parity visual cuối cùng để cutover production.

### Blockers / phụ thuộc
- Hiện **không có blocker kỹ thuật**.
- Phụ thuộc chính: cần giữ thứ tự/behavior legacy trong suốt giai đoạn chạy song song.

### Cập nhật tiến độ thực tế (latest)
- Vue shell đã có điều hướng đúng 8 tab sidebar theo legacy.
- Legacy và Vue đã chuyển đổi qua lại được bằng cờ `?vue3=1` / `?vue3=0`.
- Màn `Bệnh nhân` và `Phiếu khám` đã có CRUD bước đầu trên Vue.
- Màn `Lịch khám` đã có xem danh sách + cập nhật trạng thái.
- Màn `Quản lý Thuốc` đã migrate tab `Vị thuốc` theo hướng parity:
  - Bảng + popup thêm/sửa/xóa hoạt động theo flow legacy.
  - Form chi tiết `Vị thuốc` có `Tên gọi khác`, link `Công dụng/Chủ trị/Kiêng kỵ` (danh mục + ghi chú).
  - Input `Vị` và `Quy kinh` đã dùng chips + gợi ý (auto-suggest) như source cũ.
  - Trường `Tính` đã chuyển sang dropdown canonical: `Bình`, `Đại Hàn`, `Hàn`, `Hơi Hàn`, `Hơi Ôn`, `Lương`, `Nóng`, `Ôn`.
  - Đã bỏ fallback text fields không có trong form gốc (`cong_dung`, `chu_tri`, `kieng_ky` dạng text).
- Đã tinh chỉnh style parity cho modal `Vị thuốc`:
  - Đồng bộ input/select/chips/suggest box (border, spacing, focus, hover) theo tone legacy.
  - Build + lint pass sau mỗi vòng chỉnh.

---

## Project Overview
Convert existing vanilla HTML/CSS/JS webapp (in `webapp/` folder) to Vue 3 + TypeScript while maintaining 100% UI and behavior consistency.

## Current State Analysis

### Frontend Structure
- **HTML**: Single `index.html` with app skeleton and multiple hidden sections
- **JavaScript**: 
  - `api.js` - API calls to NestJS backend
  - `app.js` - Main app logic, state management, DOM manipulation (~3400 lines)
  - Additional modules: `appointment-management.js`, `diagnosis.js`, `dongy-management.js`, `tayy-management.js`, `the-benh-management.js`, `thuoc-management.js`, `thuoc-yhct-analysis.js`, `trieuchung-management.js`
- **CSS**: `style.css` with comprehensive styling using CSS variables and medical theme
- **Data**: JSON files for lookups (provinces, diseases, etc.)

### Key Features
- Authentication (JWT-based login)
- Patient management (CRUD)
- Medical records/examinations
- Disease models and diagnosis
- Appointment management
- Herbal medicine management
- Traditional Chinese medicine analysis

### Global State (from app.js)
- `patientData[]` - Patient list
- `recordData[]` - Medical records
- `diseaseModels[]` - Disease models
- `provinceList[]` - Province data
- `activeAnalysisRecord` - Current analysis
- Various editing/selection flags

### Navigation
- Hash-based routing (#/dashboard, #/patients, #/analysis/:id, etc.)
- Manual section toggling via `showSection()` function

---

## Vue 3 Architecture Design

### Project Structure
```
vue3-medicine-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.vue
│   │   │   ├── Header.vue
│   │   │   └── MainLayout.vue
│   │   ├── pages/
│   │   │   ├── Dashboard.vue
│   │   │   ├── Patients.vue
│   │   │   ├── Appointments.vue
│   │   │   ├── Models.vue
│   │   │   ├── Analysis.vue
│   │   │   └── NewRecord.vue
│   │   └── common/
│   │       ├── Modal.vue
│   │       ├── Button.vue
│   │       └── FormField.vue
│   ├── composables/
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useRecords.ts
│   │   └── useModels.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── patientStore.ts
│   │   ├── recordStore.ts
│   │   ├── modelStore.ts
│   │   └── appStore.ts
│   ├── types/
│   │   ├── patient.ts
│   │   ├── record.ts
│   │   ├── model.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── apiClient.ts
│   │   └── validators.ts
│   ├── styles/
│   │   ├── main.css
│   │   └── variables.css
│   ├── App.vue
│   ├── main.ts
│   └── router.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

### Technology Stack
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Fetch API (wrapped in composables)
- **Styling**: CSS (scoped + global)

### Key Composables
- `useApi()` - Centralized API calls with error handling
- `useAuth()` - Authentication logic
- `usePatients()` - Patient CRUD operations
- `useRecords()` - Medical record operations
- `useModels()` - Disease model operations

### Pinia Stores
- `authStore` - User authentication state
- `patientStore` - Patient list and current patient
- `recordStore` - Medical records
- `modelStore` - Disease models
- `appStore` - Global UI state (loading, notifications, etc.)

### Vue Router Routes
```
/login - Login page
/dashboard - Dashboard
/patients - Patient list
/patients/:id - Patient detail
/appointments - Appointments
/models - Disease models
/analysis/:id - Analysis view
/new-record - New medical record
```

---

## Implementation Steps (Roadmap + trạng thái)

### Phase 0: Baseline & parity gate (**In Progress**)
1. Lập checklist parity theo màn hình/luồng (login, patient, examination, appointment, analysis, thuốc).
2. Chốt “contract không đổi”: token key, auth header, base URL local/prod, semantics `null` vs `undefined`.
3. Chốt bộ tiêu chí pass/fail trước khi cắt logic legacy.

### Phase 1: Project Setup (**Pending**)
1. Create Vue 3 + Vite + TypeScript project
2. Install dependencies (Pinia, Vue Router, etc.)
3. Configure TypeScript, Vite, and ESLint
4. Setup project structure

#### Phase 1 - Task breakdown chi tiết (không code, chỉ kế hoạch thực thi)

##### 1) Tạo workspace Vue song song với legacy
- Chọn vị trí code Vue trong `webapp` (khuyến nghị: `webapp/vue3-app/` để tách biệt rõ).
- Giữ `webapp/index.html` legacy nguyên trạng ở lần đầu, chưa thay script cũ.
- Chuẩn bị cơ chế build output để có thể nhúng dần vào legacy (ví dụ mount vào container riêng).

##### 2) Khởi tạo nền tảng TypeScript + Vue
- Dùng Vue 3 + Vite + TypeScript strict mode.
- Thiết lập alias import (`@/`) và chuẩn module resolution.
- Chốt convention naming: component PascalCase, composable `useXxx`, store `xxxStore`.

##### 3) Cài và cấu hình core dependencies
- Bắt buộc: `vue-router`, `pinia`.
- Hỗ trợ chất lượng: ESLint + TypeScript rules + Prettier (nếu team đang dùng).
- Không thay thư viện UI hiện có trong Phase 1 để tránh lệch giao diện.

##### 4) Thiết lập Vue Router tối thiểu
- Tạo route map tương ứng section hiện tại (dashboard/patients/appointments/models/analysis...).
- Thiết lập route placeholder pages (chưa migrate logic), chỉ dựng skeleton.
- Thêm route guard khung cho auth (chưa thay hành vi login hiện tại).

##### 5) Thiết lập Pinia stores tối thiểu
- `authStore`: token, user, trạng thái đăng nhập.
- `uiStore`: loading global, thông báo/toast, trạng thái sidebar/tab chính.
- Chỉ khai báo state/action nền tảng, chưa chuyển business logic nặng.

##### 6) Dựng AppShell parity với layout cũ
- Tạo `MainLayout` (sidebar/header/content) bám sát `index.html` hiện tại.
- Mapping class/CSS hiện có để không lệch spacing, màu, typography.
- Dùng slot/router-view để cắm page placeholder.

##### 7) Bridge compatibility (điểm then chốt)
- Thiết kế lớp bridge để Vue có thể gọi hàm legacy khi module chưa migrate.
- Định nghĩa boundary rõ: phần nào do Vue quản lý, phần nào vẫn do legacy JS.
- Tránh xung đột event listener/global function trong giai đoạn chạy song song.

##### 8) Build & run song song
- Thêm script dev/build riêng cho Vue app, không phá luồng chạy cũ.
- Xác minh có thể mở legacy bình thường ngay cả khi chưa mount Vue.
- Xác minh có thể mount Vue shell trong một vùng độc lập để demo luồng mới.

#### Phase 1 - Definition of Done
- Có project Vue 3 + TS chạy được độc lập trong thư mục đã chọn.
- `Vue Router` + `Pinia` đã hoạt động ở mức khung.
- Có `AppShell` parity layout cơ bản với bản cũ (chưa cần full feature).
- Legacy app vẫn chạy bình thường, không regressions từ thay đổi Phase 1.
- Có tài liệu ngắn mô tả cách chạy dev/build cho cả legacy và Vue shell.

#### Phase 1 - Checklist kỹ thuật
- [ ] Cập nhật tài liệu run/deploy tạm thời cho giai đoạn song song
- [x] Tạo cấu trúc thư mục Vue song song trong `webapp`
- [x] Khởi tạo Vite + Vue 3 + TypeScript
- [x] Cài `vue-router` và `pinia`
- [x] Cấu hình `tsconfig`, alias path, lint/format cơ bản
- [x] Tạo `main.ts`, `App.vue`, `router/index.ts`, `stores/authStore.ts`, `stores/uiStore.ts`
- [x] Tạo layout khung `MainLayout.vue` parity với layout cũ
- [x] Tạo page placeholders theo route chính
- [x] Thiết kế interface cho compatibility bridge (chưa cần migrate logic nặng)
- [x] Xác minh chạy song song: legacy OK + Vue shell mount OK
- [ ] Cập nhật tài liệu run/deploy tạm thời cho giai đoạn song song

#### Phase 1 - Rủi ro và cách giảm thiểu
- Rủi ro xung đột DOM/event giữa Vue và legacy -> cô lập vùng mount + namespace event.
- Rủi ro lệch UI sớm -> dùng lại class/CSS cũ, chưa refactor style ở Phase 1.
- Rủi ro team đổi scope quá sớm -> khóa phạm vi Phase 1 chỉ ở khung hạ tầng, không migrate nghiệp vụ sâu.

### Phase 2: Type Definitions (**Pending**)
1. Create TypeScript interfaces for all data models
2. Define API response/request types
3. Create utility types for common patterns

#### Phase 2 - Task breakdown chi tiết

##### 1) Thiết kế chiến lược typing theo domain
- Chia type theo domain hiện hữu: auth, patient, examination, model, appointment, thuoc, analysis.
- Tách type transport (API DTO) và type UI/state để giảm coupling.
- Chốt chuẩn naming: ưu tiên `camelCase` trong app, có mapper cho `snake_case` từ backend nếu cần.

##### 2) Thiết kế bộ type gốc và generic chung
- Tạo type chung cho pagination, filter query, API error, metadata response.
- Tạo utility types cho create/update payload (`CreateXPayload`, `UpdateXPayload`).
- Định nghĩa kiểu `Nullable<T>` rõ ràng cho các field có semantics xóa dữ liệu.

##### 3) Khóa semantics dữ liệu nhạy cảm
- Mô tả rõ field nào bắt buộc gửi `null` để clear, field nào bỏ qua để giữ nguyên.
- Quy định parse/serialize date thống nhất (string ISO hay timestamp tùy contract hiện tại).
- Giữ tương thích với shape legacy nếu backend đang trả dữ liệu không đồng nhất.

##### 4) Tạo mapper contract layer
- Tạo mapper từ `ApiDto -> DomainModel` và ngược lại cho các domain chính.
- Cô lập mọi logic chuyển đổi tên field/casing vào mapper, không rải trong component/store.
- Gắn unit test cho mapper của domain rủi ro cao (thuốc, examination, analysis).

#### Phase 2 - Definition of Done
- Có đầy đủ type interfaces cho domain cốt lõi và endpoint cốt lõi.
- Có bộ utility type dùng chung cho create/update/list/detail.
- Có mapper layer cho các chỗ lệch shape giữa legacy/backend.
- Không còn dùng `any` ở các luồng chính của API/store khung.

#### Phase 2 - Checklist kỹ thuật
- [x] Tạo thư mục `types/` theo domain
- [x] Tạo type `ApiResponse`, `ApiError`, `Pagination`, `QueryParams`
- [x] Tạo payload types cho create/update từng domain chính
- [x] Định nghĩa rõ nullable/optional fields theo contract hiện tại
- [x] Tạo mapper `dtoToModel` / `modelToDto` cho domain cốt lõi
- [ ] Viết unit test cho mapper quan trọng
- [ ] Soát và loại bỏ `any` ở lớp service/store nền

#### Phase 2 - Rủi ro và cách giảm thiểu
- Sai map field dẫn tới lỗi dữ liệu âm thầm -> bắt buộc mapper test và sample payload thực.
- Nhầm `null`/`undefined` -> mô tả semantics bằng type alias + test case rõ ràng.
- Over-type quá sớm -> ưu tiên endpoint core trước, mở rộng dần theo module migrate.

### Phase 3: API Layer (**Pending**)
1. Convert `api.js` functions to TypeScript composables
2. Implement error handling and loading states
3. Create typed API client wrapper

#### Phase 3 - Task breakdown chi tiết

##### 1) Dựng HTTP client typed wrapper
- Tạo `apiClient` thống nhất cho `GET/POST/PUT/PATCH/DELETE`.
- Giữ nguyên cách build base URL local/prod như legacy.
- Giữ nguyên cách gắn `Authorization: Bearer <token>` từ storage hiện tại.

##### 2) Tách service theo domain
- Từ `webapp/js/api.js`, tách thành `services/authService`, `patientService`, `examinationService`, `appointmentService`, `thuocService`, `analysisService`.
- Mỗi service trả dữ liệu typed theo Phase 2, không trả raw JSON mơ hồ.
- Không đổi endpoint path/method/query để tránh regression backend.

##### 3) Chuẩn hóa error handling
- Thống nhất format lỗi app-level (message, code, status, details).
- Bảo toàn hành vi parse lỗi mềm của legacy (trường hợp response text/JSON không ổn định).
- Bổ sung timeout/retry có kiểm soát (nếu phù hợp) mà không làm đổi UX hiện tại.

##### 4) Tích hợp Pinia và route guard nền
- Dùng `authStore` để cung cấp token cho API client.
- Route guard đọc auth state từ store nhưng chưa thay luồng login UI cũ.
- Đảm bảo logout/expired token có hành vi nhất quán với legacy.

##### 5) Contract tests và smoke verification
- Viết contract test cho endpoint trọng yếu: auth, patients, examinations, appointments, bai-thuoc.
- So sánh payload/request giữa service mới và legacy bằng case thực tế.
- Chạy smoke test các flow gọi API chính trước khi migrate UI component.

#### Phase 3 - Definition of Done
- Toàn bộ API core đã có typed services thay cho gọi trực tiếp raw fetch.
- Auth header/base URL hoạt động giống legacy ở local và production.
- Error handling thống nhất, không làm đổi behavior hiển thị lỗi chính.
- Contract tests của endpoint core pass.

#### Phase 3 - Checklist kỹ thuật
- [x] Tạo `apiClient` typed wrapper
- [x] Giữ nguyên base URL strategy local/prod
- [x] Tích hợp auth token từ storage/store hiện tại
- [x] Tách services theo domain từ `api.js`
- [x] Chuẩn hóa error object và parser lỗi
- [ ] Viết contract tests cho endpoint core
- [ ] Chạy smoke test API flow với dữ liệu thật/staging

#### Phase 3 - Rủi ro và cách giảm thiểu
- Sai khác endpoint/query params -> snapshot request cũ/mới để đối chiếu.
- Sai khác auth behavior -> test lại toàn bộ login/refresh/logout trước khi migrate UI.
- Backend response không đồng nhất -> parser phòng thủ + mapper chặt + logging.

### Phase 4: State Management (**In Progress**)
1. Implement Pinia stores for each domain
2. Create actions for API calls
3. Setup getters for computed state

#### Phase 4 - Task breakdown chi tiết

##### 1) Chuẩn hóa mô hình store theo domain
- Tách store theo nghiệp vụ: `auth`, `patients`, `records/examinations`, `models`, `appointments`, `thuoc`, `analysis`, `ui`.
- Mỗi store chỉ giữ state cần thiết; tránh nhồi toàn bộ state global vào một nơi như legacy.
- Quy định rõ state có thể persisted và state tạm thời (session-only).

##### 2) Thiết kế action pattern nhất quán
- Action phải có lifecycle rõ: `startLoading -> callService -> success/fail -> stopLoading`.
- Chuẩn hóa xử lý lỗi trong action để UI có thông điệp nhất quán.
- Dùng optimistic update có chọn lọc (chỉ áp dụng nơi an toàn, rollback được).

##### 3) Đồng bộ với Router và Auth
- Guard route đọc auth từ store.
- Store phản ứng khi route đổi (clear draft/filter tạm thời ở page tương ứng nếu cần).
- Đồng bộ logout với reset store liên quan để tránh data leak session.

##### 4) Tối ưu hiệu năng và tính ổn định
- Tạo getters/computed cho dữ liệu derived thay vì lặp lọc/sắp xếp ở component.
- Chia loading flag theo scope (global/page/action) để UX mượt.
- Tránh watch vòng lặp giữa stores; nếu cần, dùng event rõ ràng.

#### Phase 4 - Definition of Done
- Có Pinia stores ổn định cho toàn bộ domain core.
- Actions gọi API typed thành công và xử lý lỗi/loading nhất quán.
- Đồng bộ route/auth/store không gây state leak hay bug điều hướng.
- Không còn phụ thuộc state global legacy ở các luồng đã migrate.

#### Phase 4 - Checklist kỹ thuật
- [ ] Tạo stores theo domain cốt lõi
- [ ] Chuẩn hóa action lifecycle và error handling
- [ ] Thiết lập persistence policy (token/user/settings cần giữ)
- [ ] Tạo getters cho dữ liệu derived quan trọng
- [ ] Tích hợp auth + route guard + reset store khi logout
- [ ] Viết unit test tối thiểu cho store actions/getters core

#### Phase 4 - Rủi ro và cách giảm thiểu
- Store phình to như legacy -> enforce domain boundaries + code review checklist.
- Race condition khi gọi API song song -> chuẩn hóa cancel/debounce theo use case.
- State leak sau logout -> reset store tập trung và test explicit.

### Phase 5: Components (**In Progress**)
1. Create layout components (Sidebar, Header)
2. Convert each page/section to Vue component
3. Implement form components with validation
4. Create reusable UI components

#### Phase 5 - Task breakdown chi tiết

##### 1) Dựng component layout parity
- Hoàn thiện `Sidebar/Header/MainLayout` bám sát HTML/CSS cũ.
- Giữ class naming và cấu trúc DOM ở mức cần thiết để hạn chế lệch giao diện.
- Tách block lặp lại thành component presentational nhỏ.

##### 2) Migrate page theo thứ tự rủi ro thấp -> cao
- Bắt đầu từ `appointments`, `the-benh` (ít phụ thuộc chéo).
- Tiếp theo `models`, `patients/examinations`.
- Cuối cùng module nặng: `thuoc-management`, `thuoc-yhct-analysis`, phần orchestration trong `app.js`.

##### 3) Chuẩn hóa form và validation
- Tạo form primitives dùng lại: input/select/textarea/date/chips/modal form.
- Giữ behavior validation giống bản cũ (thời điểm validate, thông báo lỗi, disable submit).
- Tách schema validate theo domain để dễ kiểm soát regression.

##### 4) Wrapper cho third-party libs
- Tạo wrapper component cho FullCalendar/Chart.js/XLSX/Quill/DOMPurify tương ứng.
- Cô lập lifecycle init/destroy để tránh memory leak khi route đổi.
- Kiểm soát props/events rõ để thay thư viện hoặc nâng cấp dễ hơn.

##### 5) Strategy thay thế incremental
- Dùng feature flag hoặc route-level switch để bật module Vue từng phần.
- Luôn có fallback về màn legacy cho đến khi pass parity checklist.
- Chỉ xóa logic legacy sau khi module mới pass test + UAT.

#### Phase 5 - Definition of Done
- Layout và page components core đã migrate theo thứ tự ưu tiên.
- Các form chính hoạt động đúng validation và UX như legacy.
- Third-party wrappers ổn định, không rò rỉ tài nguyên.
- Module đã bật Vue không còn phụ thuộc trực tiếp DOM manipulation legacy.

#### Phase 5 - Checklist kỹ thuật
- [x] Hoàn thiện layout components parity (mức nền, tiếp tục fine-tune theo module)
- [ ] Migrate pages rủi ro thấp trước
- [ ] Tạo reusable form components + validation schema
- [ ] Tạo wrapper components cho libs bên thứ ba
- [x] Bật feature flag/route switch cho từng module migrate (đang dùng bridge `?vue3=1`)
- [ ] Chạy parity test trước khi cắt fallback legacy

#### Phase 5 - Rủi ro và cách giảm thiểu
- Lệch UI do khác cấu trúc DOM -> snapshot visual + so sánh theo checklist từng màn.
- Re-render nặng ở bảng/danh sách lớn -> phân trang, virtualize nếu cần, memo hóa computed.
- Wrapper bên thứ ba thiếu event tương thích -> định nghĩa contract props/events từ đầu.

### Phase 6: Routing (**In Progress**)
1. Setup Vue Router with all routes
2. Implement route guards for authentication
3. Setup lazy loading for pages

#### Phase 6 - Task breakdown chi tiết

##### 1) Thiết kế route map tương đương hash legacy
- Map route cũ sang route mới giữ ý nghĩa nghiệp vụ không đổi.
- Quy định redirect mặc định, 404, và deep-link handling.
- Giữ khả năng mở trực tiếp URL màn hình chính.

##### 2) Auth guards và phân quyền
- Guard bắt buộc login cho route private.
- Chốt hành vi khi token hết hạn (redirect/login prompt) nhất quán với legacy.
- Nếu có vai trò người dùng, áp dụng meta permission ở cấp route.

##### 3) Lazy loading và chunk strategy
- Chia chunk theo page/domain để tối ưu first load.
- Prefetch có chọn lọc cho route truy cập thường xuyên.
- Đảm bảo loading/error boundary rõ khi tải động thất bại.

##### 4) Tương thích chuyển tiếp từ legacy
- Bridge hash cũ sang router mới trong giai đoạn song song.
- Không phá bookmark/link cũ của người dùng nội bộ.
- Theo dõi analytics điều hướng để phát hiện route lỗi sớm.

#### Phase 6 - Definition of Done
- Toàn bộ route core hoạt động đúng điều hướng.
- Auth guard ổn định, không tạo loop redirect.
- Lazy loading giảm tải ban đầu mà không làm xấu UX.
- Tương thích deep-link và bookmark cũ trong giai đoạn migrate.

#### Phase 6 - Checklist kỹ thuật
- [ ] Hoàn thiện route map full
- [ ] Cấu hình redirect mặc định + 404
- [ ] Triển khai auth guard và xử lý token hết hạn
- [ ] Bật lazy loading theo page/domain
- [ ] Kiểm thử deep-link/bookmark cũ
- [ ] Theo dõi lỗi điều hướng qua logging cơ bản

#### Phase 6 - Rủi ro và cách giảm thiểu
- Loop redirect do guard sai điều kiện -> test matrix route public/private.
- Mất tương thích hash legacy -> thêm bridge redirect rule giai đoạn chuyển tiếp.
- Chunk load fail trong môi trường thật -> error boundary + retry nhẹ.

### Phase 7: Styling (**In Progress**)
1. Migrate CSS to Vue components
2. Setup scoped styles where appropriate
3. Maintain CSS variables and theme

#### Phase 7 - Task breakdown chi tiết

##### 1) Chiến lược style parity-first
- Giữ nguyên `style.css` làm nguồn chuẩn trong giai đoạn đầu.
- Chỉ tách scoped style khi chắc chắn không làm đổi giao diện.
- Tránh refactor thiết kế/spacing trước khi hoàn tất parity chức năng.

##### 2) Quản lý CSS variables và theme
- Duy trì toàn bộ CSS variables hiện có.
- Chuẩn hóa nơi định nghĩa biến (global) và nơi sử dụng (component).
- Đảm bảo dark/light (nếu có) vẫn đúng như legacy.

##### 3) Ngăn xung đột style
- Đặt convention class cho component mới để không đè class legacy ngoài ý muốn.
- Dùng quy tắc ưu tiên rõ (global trước, scoped sau).
- Giảm `!important` tối đa để tránh khó bảo trì.

#### Phase 7 - Definition of Done
- Giao diện các màn đã migrate đạt parity cao với legacy.
- Không có xung đột style giữa Vue components và phần legacy còn lại.
- CSS variables/theme hoạt động ổn định như ban đầu.

#### Phase 7 - Checklist kỹ thuật
- [x] Giữ global styles chuẩn từ legacy (đã import CSS legacy vào Vue app)
- [ ] Tách scoped styles có kiểm soát
- [ ] Kiểm thử parity UI theo màn hình trọng yếu (đang làm sâu module Thuốc)
- [ ] Rà soát xung đột class và specificity
- [ ] Chốt convention style cho phần còn lại của dự án

#### Phase 7 - Rủi ro và cách giảm thiểu
- Lệch spacing/font nhỏ nhưng lan rộng -> visual regression checklist theo component.
- Scoped style vô tình ghi đè global -> review CSS specificity và naming.
- Refactor style quá sớm -> khóa nguyên tắc parity-first đến hết migrate chức năng.

### Phase 8: Testing & Validation (**Pending**)
1. Test all features against original app
2. Verify UI consistency
3. Test API integration
4. Performance optimization

#### Phase 8 - Task breakdown chi tiết

##### 1) Thiết kế test pyramid tối thiểu khả thi
- Unit test cho mapper, utils, store actions trọng yếu.
- Integration test cho services + stores theo flow nghiệp vụ.
- E2E smoke cho luồng core (login -> CRUD -> appointment -> analysis -> export/import).

##### 2) Parity verification bắt buộc
- So sánh behavior giữa legacy và Vue theo checklist baseline.
- So sánh UI theo snapshot thủ công/tự động tại các màn chính.
- Log và phân loại sai lệch: blocker, major, minor.

##### 3) Kiểm thử tương thích môi trường
- Chạy local và môi trường giống production.
- Test tình huống mạng lỗi/chậm, backend trả lỗi bất thường.
- Test dữ liệu lớn cho màn danh sách và phân tích.

##### 4) Performance & hardening
- Đo time-to-interactive và tương tác chính trước/sau migrate.
- Tối ưu bundle/chunk ở route nặng.
- Rà soát memory leak từ chart/editor/calendar wrappers.

#### Phase 8 - Definition of Done
- E2E smoke core pass.
- Contract/API integration pass cho endpoint trọng yếu.
- UI parity đạt ngưỡng chấp nhận đã chốt.
- Không còn blocker severity cao trước cutover.

#### Phase 8 - Checklist kỹ thuật
- [ ] Hoàn thiện bộ unit/integration test tối thiểu
- [ ] Hoàn thiện E2E smoke core flows
- [ ] Chạy parity checklist toàn bộ module đã migrate
- [ ] Chạy test lỗi mạng/backend edge cases
- [ ] Đánh giá hiệu năng trước/sau và tối ưu cần thiết
- [ ] Chốt báo cáo nghiệm thu trước cutover

#### Phase 8 - Rủi ro và cách giảm thiểu
- Thiếu test coverage ở luồng hiếm gặp -> bổ sung case từ bug history thực tế.
- False positive parity -> chuẩn hóa checklist định lượng, có người review chéo.
- Tối ưu hiệu năng quá muộn -> theo dõi metric từ sớm ở từng phase.

### Phase 7: Styling (**Pending**)
1. Migrate CSS to Vue components
2. Setup scoped styles where appropriate
3. Maintain CSS variables and theme

### Phase 8: Testing & Validation (**Pending**)
1. Test all features against original app
2. Verify UI consistency
3. Test API integration
4. Performance optimization

---

## Migration Checklist

- [x] Chốt chiến lược migration incremental
- [x] Chốt dùng sớm Vue Router + Pinia
- [x] Hoàn thành phân tích hiện trạng frontend legacy
- [ ] Baseline parity checklist hoàn chỉnh
- [x] Project initialization
- [x] TypeScript configuration
- [x] Type definitions created
- [x] API composables implemented
- [x] Pinia stores setup
- [x] Layout components created
- [x] Page components created
- [x] Routing configured
- [ ] CSS migrated (đang parity dần theo module)
- [ ] CSS migrated (đã parity sâu `Vị thuốc`, còn các tab/module khác)
- [x] Authentication flow tested
- [x] Patient management tested
- [x] Record management tested
- [ ] Model management tested
- [ ] UI consistency verified
- [ ] Performance optimized
- [ ] Documentation completed

---

## Gợi ý timeline thực thi
- Tuần 1: Phase 0 + Phase 1
- Tuần 2: Phase 2 + Phase 3
- Tuần 3: Phase 4 + Phase 6
- Tuần 4: Phase 5 + Phase 7 + bắt đầu Phase 8
- Tuần 5: Hoàn tất Phase 8, UAT, cutover checklist

## Cutover Runbook (Go-live)

### Mục tiêu cutover
- Chuyển traffic chính sang Vue app mà không gián đoạn nghiệp vụ.
- Đảm bảo luôn có phương án rollback nhanh về legacy nếu có lỗi nghiêm trọng.

### Điều kiện trước cutover (Go/No-Go checklist)
- [ ] Toàn bộ checklist parity của module scope go-live đã pass.
- [ ] Contract tests endpoint core pass trên môi trường gần production.
- [ ] E2E smoke core flows pass (login, CRUD chính, appointment, analysis, export/import).
- [ ] Monitoring/logging đã bật cho lỗi frontend và API failures.
- [ ] Team đã thống nhất danh sách owner on-call trong ngày cutover.
- [ ] Có snapshot cấu hình/phiên bản hiện tại để rollback ngay khi cần.

### Trình tự cutover đề xuất
1. **Pre-deploy**
   - Freeze code trong cửa sổ cutover.
   - Xác nhận artifact build và checksum/version.
   - Backup cấu hình deploy hiện tại.
2. **Deploy canary**
   - Bật Vue app cho nhóm người dùng nội bộ hoặc một tỷ lệ nhỏ traffic.
   - Giám sát error rate, latency, tỉ lệ thành công API, hành vi route/auth.
3. **Ramp-up**
   - Tăng traffic theo bước (ví dụ 10% -> 30% -> 60% -> 100%) nếu ổn định.
   - Sau mỗi bước, chạy smoke checklist ngắn.
4. **Full cutover**
   - Chuyển mặc định sang Vue app.
   - Giữ fallback legacy sẵn sàng trong suốt hypercare window.

### Tiêu chí dừng cutover khẩn cấp
- Tăng lỗi đăng nhập hoặc lỗi API core vượt ngưỡng đã chốt.
- Lỗi dữ liệu nghiêm trọng (ghi sai, mất dữ liệu, sai mapping domain).
- UI regression ảnh hưởng trực tiếp thao tác nghiệp vụ chính.

## Rollback Plan

### Nguyên tắc rollback
- Rollback phải thực hiện được trong vài phút và không cần sửa code nóng.
- Ưu tiên rollback bằng cấu hình/toggle thay vì redeploy toàn bộ nếu có thể.

### Cơ chế rollback đề xuất
- Dùng feature flag hoặc switch entry để chuyển route/module từ Vue về legacy.
- Giữ artifact legacy bản ổn định ngay trước cutover.
- Tách rõ dữ liệu tương thích 2 chiều để rollback không làm hỏng trạng thái phiên.

### Quy trình rollback
1. Kích hoạt trạng thái incident và thông báo stakeholders.
2. Tắt Vue routes/modules bị lỗi qua toggle hoặc đổi entry về legacy.
3. Xác minh nhanh các luồng nghiệp vụ core trên legacy.
4. Thu thập log + root cause và quyết định cutover lại sau khi fix.

### Điều kiện “rollback xong”
- Người dùng thao tác ổn định trên legacy.
- Error rate trở về ngưỡng an toàn.
- Incident report đã ghi rõ nguyên nhân tạm thời và hành động tiếp theo.

## Hypercare Sau Go-live (48-72h)

### Mục tiêu
- Phát hiện và xử lý sớm lỗi phát sinh trong môi trường thực.
- Ổn định trải nghiệm người dùng sau chuyển đổi.

### Checklist hypercare
- [ ] Theo dõi dashboard lỗi frontend/API theo giờ.
- [ ] Kiểm tra các luồng có tần suất cao mỗi ca trực.
- [ ] Tổng hợp bug mới theo severity (blocker/major/minor).
- [ ] Hotfix theo SLA đã chốt và cập nhật lại regression checklist.
- [ ] Chốt báo cáo “go-live health” sau 24h, 48h, 72h.

## RACI đề xuất (vai trò tối thiểu)
- **Tech Lead Frontend**: quyết định go/no-go, chịu trách nhiệm chất lượng tổng thể.
- **Frontend Implementer**: xử lý bug/hotfix phía UI, store, router, integration.
- **Backend Owner**: xác nhận contract API và hỗ trợ incident dữ liệu.
- **QA/UAT Owner**: xác nhận parity theo checklist và ký nghiệm thu.
- **Ops/DevOps**: phụ trách deploy, toggle, rollback, monitoring.

## KPI theo dõi thành công migration
- Tỉ lệ lỗi frontend sau cutover không vượt ngưỡng baseline đã chốt.
- Tỉ lệ thành công API core duy trì ổn định.
- Không có incident dữ liệu mức nghiêm trọng.
- Thời gian hoàn thành luồng nghiệp vụ chính không xấu hơn đáng kể so với legacy.
- Tỉ lệ rollback module sau go-live ở mức chấp nhận được (mục tiêu: 0 với core flow).

## Phase 1 Execution Board (tuần triển khai đầu tiên)

### Mục tiêu tuần
- Dựng xong khung Vue 3 + TypeScript + Router + Pinia chạy song song legacy.
- Không tạo regression cho luồng đang chạy của `webapp` hiện tại.

### Day 1 - Khởi tạo nền tảng
- **Công việc**
  - Chốt vị trí app Vue song song trong `webapp`.
  - Khởi tạo Vite + Vue 3 + TypeScript.
  - Cài `vue-router`, `pinia`, lint/typecheck cơ bản.
- **Deliverable**
  - Skeleton app chạy local được.
  - Cấu trúc thư mục chuẩn đã tạo.
- **Done khi**
  - `dev server` lên ổn định.
  - Legacy vẫn chạy bình thường, chưa bị ảnh hưởng.

### Day 2 - Router + Store khung
- **Công việc**
  - Tạo route map khung theo section chính.
  - Tạo `authStore`, `uiStore` bản tối thiểu.
  - Dựng route guard khung.
- **Deliverable**
  - Điều hướng route placeholder hoạt động.
  - Store có state/action cơ bản.
- **Done khi**
  - Route public/private chạy đúng kỳ vọng baseline.
  - Không phát sinh loop redirect.

### Day 3 - AppShell parity cơ bản
- **Công việc**
  - Dựng `MainLayout` (sidebar/header/content).
  - Mapping class/CSS để gần giống layout legacy.
  - Cắm `router-view` và placeholder pages.
- **Deliverable**
  - Shell Vue hiển thị được khung chính tương đương bản cũ.
- **Done khi**
  - Layout không lệch lớn về cấu trúc/spacing.
  - Không xung đột CSS nghiêm trọng với legacy.

### Day 4 - Compatibility bridge
- **Công việc**
  - Thiết kế bridge interface giữa Vue và legacy.
  - Xác định boundary module nào vẫn chạy bằng JS cũ.
  - Thử gọi một hành vi legacy từ Vue shell (POC).
- **Deliverable**
  - Tài liệu bridge contract + POC hoạt động.
- **Done khi**
  - Không phát sinh xung đột global function/event.
  - Có fallback rõ ràng về legacy.

### Day 5 - Hardening + demo nội bộ
- **Công việc**
  - Chạy smoke checklist ngắn cho shell mới và legacy.
  - Chốt tài liệu run/build song song.
  - Demo nội bộ + ghi issue backlog cho Phase 2.
- **Deliverable**
  - Bản demo Phase 1 ổn định.
  - Danh sách việc vào Phase 2 đã ưu tiên.
- **Done khi**
  - Team đồng ý “Go Phase 2”.
  - Không còn blocker mức cao cho hạ tầng khung.

## Owner đề xuất cho Phase 1
- **Frontend Lead**
  - Chốt kiến trúc khung, route/store conventions, go/no-go cuối tuần.
- **Frontend Dev 1**
  - Setup project, tooling, cấu hình TypeScript/lint.
- **Frontend Dev 2**
  - Router + Pinia + AppShell.
- **QA**
  - Smoke checklist, parity visual baseline.
- **Ops (part-time)**
  - Hỗ trợ script chạy/build và chuẩn bị luồng deploy song song.

## Backlog vào Phase 2 (đầu vào đã sẵn sàng)
- Chốt type contracts theo domain từ `api.js`.
- Tách typed `apiClient` + services core.
- Viết contract tests cho auth/patients/examinations/appointments.

## Notes
- Maintain exact CSS styling to ensure 100% visual consistency.
- Preserve all existing functionality and behavior.
- Use TypeScript for type safety and better DX.
- Implement proper error handling and loading states.
- Consider accessibility improvements during migration.
