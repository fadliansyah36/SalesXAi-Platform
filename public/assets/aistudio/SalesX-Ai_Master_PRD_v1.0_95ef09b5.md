# SalesX-Ai

## Master Product Requirements Document (Master PRD), Design System, Design Tokens & Monorepo Architecture

  -----------------------------------------------------------------------
  Dokumen                             Master PRD
  ----------------------------------- -----------------------------------
  Brand                               **SalesX-Ai**

  Versi                               1.0

  Status                              Baseline Product & Engineering
                                      Specification

  Cakupan                             Product, UX/UI, Design System,
                                      Design Tokens, Architecture,
                                      Monorepo, Deployment, Security, AI,
                                      GPS, Telegram, Remotion

  Platform                            Web PWA, React Native Expo, Python
                                      FastAPI, Supabase

  Repository Strategy                 Single GitHub Monorepo ---
                                      Independently Deployable
                                      Applications & Services
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 0. Tujuan Dokumen dan Aturan Penggunaan

Dokumen ini menjadi sumber acuan utama untuk perencanaan produk, desain,
arsitektur, implementasi, dan pengembangan SalesX-Ai.

Dokumen ini harus digunakan oleh: - Product Manager dan Business
Analyst. - UI/UX Designer dan Design System Engineer. - Frontend Web
Engineer. - React Native / Expo Engineer. - Backend Python / FastAPI
Engineer. - Database Engineer. - AI Engineer. - DevOps / Platform
Engineer. - QA dan Security Engineer.

## 0.1 Status dan batasan

Dokumen ini mendefinisikan **target product dan target architecture**
SalesX-Ai. Dokumen ini bukan bukti bahwa integrasi, fitur, API, atau
sistem Salesmart yang telah ada sudah diperiksa atau selesai
diimplementasikan.

Jika SalesX-Ai mengadopsi atau mengintegrasikan produk Salesmart seperti
SmartTeam, SmartOrder, atau SmartReward, implementasi harus terlebih
dahulu memetakan API, data, hak penggunaan, dan kontrak sistem aktual.
Jangan mengasumsikan ketersediaan source code atau akses internal.

## 0.2 Urutan sumber kebenaran

Jika terjadi perbedaan antar dokumen atau implementasi, gunakan urutan
berikut: 1. Keputusan arsitektur yang disetujui dan tercatat dalam
Architecture Decision Records (ADR). 2. Master PRD dan acceptance
criteria yang berlaku. 3. API contracts / OpenAPI. 4. Database
migrations dan schema contracts. 5. Design tokens dan Design System. 6.
Implementasi aplikasi. 7. Dokumentasi operasional.

Perubahan terhadap keputusan penting harus dicatat, bukan dilakukan
diam-diam.

## 0.3 Prinsip non-negotiable

1.  Satu GitHub monorepo untuk source code seluruh aplikasi dan service.
2.  Setiap portal dan service mempunyai folder, konfigurasi, build
    target, environment, dan deployment target mandiri.
3.  Aplikasi boleh dirilis secara independen, tetapi tetap menggunakan
    shared contracts dan shared design packages.
4.  Satu Supabase project / PostgreSQL logical source of truth untuk
    domain data yang disepakati; jangan membuat database bisnis terpisah
    per portal.
5.  FastAPI menjadi pusat business logic dan authorization untuk operasi
    bisnis.
6.  Frontend tidak boleh mengakses database secara langsung untuk
    melewati business logic atau permission.
7.  Satu Unified AI Orchestrator; jangan membuat AI engine terpisah yang
    menduplikasi fungsi.
8.  Harga, stok, diskon, order, reward, dan transaksi dihitung oleh
    business rules deterministik, bukan diciptakan LLM.
9.  GPS tracking harus transparan, memiliki consent/pemberitahuan,
    dibatasi sesuai kebijakan kerja, dan dapat diaudit.
10. Tidak ada mock/demo fallback dalam alur produksi.
11. Tidak boleh menyatakan fitur selesai tanpa implementasi dan bukti
    yang relevan.
12. Shared package harus menjaga kompatibilitas seluruh consumer.
13. Secret tidak boleh berada di source code, browser bundle, atau
    aplikasi mobile.
14. Deployment satu portal tidak boleh memaksa deployment seluruh portal
    lain.

------------------------------------------------------------------------

# BAGIAN I --- PRODUCT VISION & STRATEGY

# 1. Product Overview

## 1.1 Brand

**Nama brand:** SalesX-Ai

**Product category:** AI-Native Sales, Distribution & Field Operations
Platform.

**Brand positioning:**

> SalesX-Ai adalah platform operasional penjualan dan distribusi
> berbasis AI yang menghubungkan tim lapangan, outlet, produk, order,
> promosi, analitik, lokasi, dan komunikasi dalam satu ekosistem
> terintegrasi.

## 1.2 Vision

Membangun platform sales dan distribusi yang cerdas, terukur, realtime,
dan mudah dikembangkan, dengan AI sebagai lapisan intelligence yang
membantu manusia mengambil keputusan dan menjalankan pekerjaan secara
lebih efektif.

## 1.3 Mission

-   Meningkatkan produktivitas dan efektivitas sales lapangan.
-   Memperbaiki kualitas dan keterlacakan kunjungan outlet.
-   Mempercepat pemesanan dan proses distribusi.
-   Mengoptimalkan promosi berdasarkan data bisnis aktual.
-   Menyediakan laporan operasional dan eksekutif yang konsisten.
-   Mengurangi pekerjaan administratif melalui automation.
-   Mengintegrasikan AI ke dalam workflow sehari-hari.
-   Menyediakan content generation untuk kebutuhan pemasaran.
-   Menyediakan arsitektur multi-tenant dan deployment independen.

## 1.4 Product Outcomes

  -----------------------------------------------------------------------
  Outcome                             Indikator
  ----------------------------------- -----------------------------------
  Sales productivity                  Kunjungan efektif, aktivitas
                                      selesai, produktivitas per sales

  Outlet coverage                     Outlet aktif dikunjungi dibanding
                                      outlet yang ditugaskan

  Order performance                   Jumlah order, nilai order,
                                      conversion, reorder

  Distribution visibility             Ketersediaan stok dan status
                                      pemenuhan order

  Promotion effectiveness             Redemption, uplift, penjualan
                                      produk promosi

  Operational visibility              Freshness GPS, visit status, report
                                      tim

  AI adoption                         Penggunaan AI, rekomendasi yang
                                      ditindaklanjuti

  Content productivity                Waktu pembuatan konten, render
                                      success, approval

  Management insight                  Ketepatan, konsistensi, dan
                                      ketepatan waktu laporan
  -----------------------------------------------------------------------

Target numerik ditetapkan setelah baseline data dan kebutuhan bisnis
dikumpulkan. Jangan menetapkan KPI yang tidak memiliki definisi, sumber
data, atau periode pengukuran.

## 1.5 Product Principles

-   **API-first:** seluruh business action mempunyai kontrak API.
-   **Data-driven:** insight berasal dari data aktual dengan provenance.
-   **AI-assisted:** AI membantu, bukan menggantikan kontrol bisnis.
-   **Human-governed:** tindakan berdampak tinggi membutuhkan approval.
-   **Mobile-first:** aktivitas lapangan dirancang untuk perangkat
    mobile.
-   **Offline-resilient:** mobile mampu menyimpan antrean lokal saat
    koneksi terputus.
-   **Tenant-aware:** seluruh akses data dibatasi tenant dan organisasi.
-   **Modular:** domain mempunyai tanggung jawab yang jelas.
-   **Independently deployable:** portal/service mempunyai release
    boundary sendiri.
-   **Accessible:** desain memperhatikan WCAG dan aksesibilitas mobile.
-   **Observable:** status, error, biaya, dan performa dapat dipantau.

------------------------------------------------------------------------

# 2. Product Scope

## 2.1 In-scope

1.  Public Website.
2.  Customer / Outlet Portal.
3.  Company Portal.
4.  Sales Portal.
5.  Distributor Portal.
6.  Principal Portal.
7.  Supervisor Portal.
8.  Super Admin Portal.
9.  Sales Mobile App menggunakan React Native Expo.
10. FastAPI Backend.
11. Python background workers.
12. Realtime GPS dan route history.
13. Unified AI Orchestrator dan AI Agents.
14. Telegram Bot dan proactive notifications.
15. AI Content Studio dan Remotion rendering.
16. Supabase PostgreSQL, Auth, Storage, Realtime, PostGIS, dan pgvector.
17. CI/CD dan independent deployment.

## 2.2 Out-of-scope kecuali disetujui sebagai fase terpisah

-   Mengambil Timeline pribadi Google Maps pengguna secara diam-diam.
-   Mengakses akun Google pengguna dengan meminta password.
-   Menjadikan LLM sebagai sumber kebenaran harga, stok, transaksi, atau
    reward.
-   Menjalankan render video berat dalam proses API FastAPI.
-   Membuat microservices untuk setiap tabel atau fitur sejak awal.
-   Menyimpan credential provider dalam frontend.
-   Mengirim data pribadi atau informasi perusahaan ke Telegram group
    tanpa policy dan authorization.
-   Mengklaim tracking GPS 100% tanpa interupsi pada seluruh kondisi
    OS/perangkat.

------------------------------------------------------------------------

# 3. User Personas, Roles & Tenant Model

## 3.1 Personas

### Platform Super Admin

Mengelola platform global, tenant, service registry, konfigurasi,
billing, security, AI governance, dan monitoring.

### Tenant / Company Admin

Mengelola perusahaan, cabang, tim, master data, produk, pengguna,
kebijakan, dan laporan dalam tenant sendiri.

### Principal

Mengelola katalog produk, pricing, promosi, distributor, dan performa
distribusi sesuai kewenangan.

### Distributor Admin

Mengelola inventory, order, outlet, sales team, dan distribusi.

### Area Manager / Supervisor

Mengelola tim, wilayah, aktivitas sales, kunjungan, GPS, target, dan
performa.

### Sales Representative

Menggunakan mobile app untuk shift, kunjungan, order, katalog, promosi,
AI assistant, dan content generation.

### Customer / Outlet

Melihat katalog, promosi, membuat atau mengelola order, serta melihat
histori sesuai hak akses.

## 3.2 Role baseline

-   `platform_super_admin`
-   `platform_support`
-   `tenant_owner`
-   `tenant_admin`
-   `company_admin`
-   `principal_admin`
-   `distributor_admin`
-   `area_manager`
-   `supervisor`
-   `sales`
-   `customer`
-   `finance`
-   `analyst`
-   `content_manager`

Role di atas merupakan baseline. Permission aktual harus berbentuk
permission identifiers dan policy, bukan hanya pemeriksaan nama role.

## 3.3 Tenant hierarchy

Model konseptual:

``` text
Platform
└── Tenant
    ├── Organization
    │   ├── Branch
    │   ├── Territory
    │   ├── Teams
    │   ├── Users
    │   ├── Outlets
    │   ├── Products / Catalog Access
    │   ├── Orders
    │   └── Reports
    └── Tenant Configuration
```

Relasi principal-distributor dapat berupa relasi bisnis lintas
organisasi yang eksplisit dan terotorisasi. Jangan menganggap seluruh
distributor berada dalam tenant yang sama tanpa keputusan bisnis dan
data governance.

------------------------------------------------------------------------

# BAGIAN II --- APPLICATION PORTFOLIO & REQUIREMENTS

# 4. Application Portfolio

Setiap aplikasi di bawah ini merupakan deployable application
tersendiri. Pemisahan folder tidak otomatis berarti semua aplikasi harus
dibangun pada sprint yang sama.

  -----------------------------------------------------------------------------------
  Application       Pengguna utama    Runtime           Domain contoh
  ----------------- ----------------- ----------------- -----------------------------
  Public Website    Visitor           Next.js           `www.salesx-ai.com`

  Customer Portal   Outlet/customer   Next.js PWA       `customer.salesx-ai.com`

  Company Portal    Company admin     Next.js PWA       `company.salesx-ai.com`

  Sales Portal      Sales / field     Next.js PWA       `sales.salesx-ai.com`
                    staff                               

  Distributor       Distributor       Next.js PWA       `distributor.salesx-ai.com`
  Portal                                                

  Principal Portal  Principal         Next.js PWA       `principal.salesx-ai.com`

  Supervisor Portal Supervisor        Next.js PWA       `supervisor.salesx-ai.com`

  Super Admin       Platform operator Next.js           `admin.salesx-ai.com`

  Sales Mobile      Sales             React Native Expo Android / iOS

  Backend API       All applications  FastAPI           `api.salesx-ai.com`
  -----------------------------------------------------------------------------------

Domain di atas adalah contoh dan harus disesuaikan dengan domain yang
dimiliki perusahaan.

## 4.1 Public Website

Tujuan: - Menjelaskan produk dan value proposition. - Menyediakan
halaman fitur dan solusi. - Menyediakan lead/contact form. - Menyediakan
link login ke portal yang tepat. - Menyediakan legal, privacy, dan
support pages.

Acceptance: - SEO metadata. - Responsive. - Performance-conscious. -
Form menggunakan API yang tervalidasi. - Tidak menampilkan data internal
tenant.

## 4.2 Customer Portal

Fitur: - Login dan account profile. - Product catalog. - Product
detail. - Pricing yang berlaku untuk customer. - Promotion. - Cart /
order draft. - Order placement. - Order status. - Order history. -
Reward / loyalty bila diaktifkan. - Notification. - Customer support.

Acceptance: - Harga dan ketersediaan selalu divalidasi server-side. -
Order idempotent. - Customer hanya dapat melihat data yang berhak
diakses. - Empty, loading, error, dan success states tersedia.

## 4.3 Company Portal

Fitur: - Company dashboard. - Branch management. - User dan team
management. - Territory management. - Outlet management. -
Product/catalog access. - Sales target. - Attendance. - Visit
monitoring. - Order overview. - Promotion management sesuai
permission. - Reports. - Integration settings.

## 4.4 Sales Portal (Web)

Fitur: - Sales dashboard. - Assigned outlets. - Visit planner. - Visit
history. - Order history. - Product catalog. - Promotion. - Target and
performance. - AI Sales Assistant. - Content Studio entry point. -
Notification. - Profile dan settings.

Mobile Expo merupakan kanal utama untuk GPS background tracking. Web PWA
tidak dijadikan satu-satunya mekanisme background GPS.

## 4.5 Distributor Portal

Fitur: - Distributor overview. - Inventory visibility. - Product
catalog. - Order intake. - Order fulfillment. - Sales team. - Outlet
coverage. - Delivery status. - Reports. - Promotion participation.

## 4.6 Principal Portal

Fitur: - Product master / catalog. - Product availability view. -
Pricing policy. - Promotion campaign. - Distributor network. -
Distributor order visibility. - Sales-through reporting bila data
tersedia. - Campaign analytics. - AI business insight.

## 4.7 Supervisor Portal

Fitur: - Team overview. - Live location map. - Latest location
freshness. - Shift status. - Visit monitoring. - Route history and
replay. - Outlet coverage. - Target achievement. - Sales performance. -
AI Sales Coach. - Daily / weekly team reports. - Alerts and follow-ups.

## 4.8 Super Admin Portal

Fitur: - Global overview. - Tenant management. - Organization
management. - Service registry. - Domain registry. - User and role
governance. - Feature flags. - Subscription and package management. - AI
provider and model configuration. - Agent / Skill governance. -
Integration registry. - Telegram bot registry. - Usage and cost. -
Security events. - Audit logs. - System health. - Platform settings.

Super Admin harus memiliki authentication controls yang lebih kuat, MFA
untuk tindakan sensitif, audit trail, dan pemisahan tugas jika
diperlukan.

## 4.9 Sales Mobile App (React Native Expo)

Fitur: - Authentication. - Shift start / end. - Attendance. - Background
location session. - Assigned outlets. - Visit schedule. - Navigation
handoff. - Check-in / check-out. - Visit evidence. - Product catalog. -
Order creation. - Promotion. - Target and performance. - AI assistant. -
Content brief / generation request. - Notifications. - Offline queue. -
Profile and settings.

Mobile requirements: - Permission explanation sebelum meminta background
location. - Background task didefinisikan di module scope sesuai Expo
requirements. - Android foreground service notification jika
dibutuhkan. - iOS background location capability sesuai policy. - Local
encrypted/sensitive storage strategy. - Offline queue dengan retry dan
deduplication. - User dapat melihat tracking status. - Tracking berhenti
sesuai shift/policy. - Device-specific limitations didokumentasikan.

------------------------------------------------------------------------

# 5. Master Business Modules

## 5.1 SmartTeam / Field Operations

Submodules: - Employee directory. - Sales profiles. - Team and manager
hierarchy. - Territory. - Outlet assignment. - Visit planning. - Visit
scheduling. - Attendance. - Shift management. - Visit
check-in/check-out. - Visit evidence. - Daily activity. - Target
management. - Performance. - Location tracking. - Route history. -
Geofencing. - AI Sales Coach. - AI Visit Planner.

Business rules: - Visit harus memiliki owner, outlet, waktu, dan
status. - Check-in/check-out harus memiliki server timestamp. - GPS
accuracy dan source metadata disimpan. - Perubahan assignment dan target
diaudit. - GPS tidak menjadi satu-satunya dasar keputusan disipliner.

## 5.2 SmartOrder / Commerce

Submodules: - Product master. - Product category. - Variant / SKU. -
Pricing. - Price list. - Inventory. - Promotion. - Discount rule. -
Order. - Order item. - Approval. - Fulfillment. - Cancellation. - Return
/ adjustment jika diperlukan. - Order history.

Business rules: - Server menjadi sumber kebenaran harga dan stok. -
Harga yang digunakan pada order disimpan sebagai snapshot transaksi. -
Discount eligibility divalidasi backend. - Order creation harus
idempotent. - Order state transition harus tervalidasi. - AI hanya
menyarankan atau menyiapkan draft; transaksi tetap melalui domain order.

## 5.3 SmartReward / Loyalty

Submodules: - Reward program. - Points ledger. - Incentive rules. -
Reward catalog. - Eligibility. - Redemption. - Campaign. - Customer
segment. - Reward analytics.

Business rules: - Ledger append-oriented. - Reversal dilakukan melalui
compensating entry. - Redemption harus memvalidasi saldo dan
eligibility. - AI tidak dapat mengubah saldo atau melakukan payout tanpa
policy dan approval.

## 5.4 Analytics & Reporting

Reports: - Daily sales. - Weekly sales. - Monthly sales. - Sales by
territory. - Sales by product. - Sales by outlet. - Distributor
performance. - Visit performance. - Attendance. - Promotion
performance. - Order funnel. - Target achievement. - AI-generated
executive brief.

Setiap report harus mendefinisikan: - Metric name. - Formula. - Source
tables / API. - Timezone. - Time range. - Tenant scope. - Data
freshness. - Aggregation rules. - Access policy.

------------------------------------------------------------------------

# BAGIAN III --- REALTIME LOCATION INTELLIGENCE

# 6. GPS, Live Tracking & Route History

## 6.1 Objective

Menyediakan visibilitas aktivitas sales lapangan dengan: - Live latest
position. - Tracking session. - Route history. - Route replay. -
Geofence. - Visit correlation. - Location freshness. - Audit access.

## 6.2 Google Maps Timeline distinction

Google Maps Timeline merupakan data perjalanan pribadi yang dikelola
oleh pengguna dan perangkatnya. SalesX-Ai tidak boleh mengasumsikan
perusahaan dapat mengambil seluruh Timeline pribadi melalui API publik.

Target implementation: - Kumpulkan GPS melalui SalesX-Ai Mobile App. -
Gunakan Google Maps Platform atau provider lain untuk map display,
geocoding, dan route calculation. - Simpan route history operasional
sendiri. - Jika kelak ada fitur import data pengguna, harus dimulai dan
disetujui oleh pemilik data melalui mekanisme resmi yang tersedia.

Jangan meminta password Google pengguna atau mengambil Timeline secara
diam-diam.

## 6.3 Tracking lifecycle

``` text
User Login
  -> Start Shift
  -> Explain / verify location permission
  -> Start Location Session
  -> Expo background location task
  -> Local offline queue
  -> FastAPI batch ingestion
  -> Validate identity / tenant / session / timestamp
  -> Deduplicate and persist GPS points
  -> Update latest location
  -> Process geofence / stop / route events
  -> Publish private realtime update
  -> Supervisor live map
  -> End Shift
  -> End Location Session
```

## 6.4 Adaptive tracking policy

Initial configurable policy: - Moving: 15--30 seconds. - At visit / low
movement: 1--2 minutes. - Idle: 3--5 minutes. - Shift ended: stop
tracking.

These values are starting configuration, not guaranteed OS delivery
intervals. Battery optimization, permissions, connectivity, device
vendors, app termination, and operating system policies can change
actual behavior.

## 6.5 Location data model

Core tables: - `location_sessions` - `location_points` -
`latest_locations` - `route_segments` - `geofences` -
`geofence_events` - `location_policies` - `location_access_audit` -
`field_visits` - `visit_evidence`

Point attributes: - tenant_id. - user_id. - session_id. - device_id. -
recorded_at. - received_at. - latitude / longitude or PostGIS
geography. - accuracy_m. - speed_mps. - heading. - provider metadata. -
validation status.

Spatial: - `geography(Point, 4326)` for GPS points. -
`geometry(LineString, 4326)` for route geometry. -
`geometry(Polygon, 4326)` for geofences. - GiST indexes. - Partition by
time when volume and query profile justify it. - Install PostGIS in a
dedicated schema as recommended by Supabase guidance.

## 6.6 Location API

``` text
POST /api/v1/location/sessions/start
POST /api/v1/location/sessions/end
POST /api/v1/location/batch

GET  /api/v1/location/me/latest
GET  /api/v1/location/me/history
GET  /api/v1/location/team/live

GET  /api/v1/location/routes/{route_id}
GET  /api/v1/location/routes/{route_id}/replay

POST /api/v1/location/geofences
GET  /api/v1/location/visits
POST /api/v1/location/events
```

## 6.7 Realtime

Preferred flow:

``` text
Expo Mobile
  -> FastAPI
  -> PostgreSQL / PostGIS
  -> Latest Location Projection
  -> Private Realtime Broadcast
  -> Supervisor Portal
```

Use private channels scoped by tenant, team, and region. Do not expose
raw location updates to unauthorized clients. Broadcast is preferred for
scalable live update delivery where appropriate.

## 6.8 Privacy and retention

-   Tracking hanya pada konteks kerja yang dijelaskan dan diotorisasi.
-   Visible tracking indicator.
-   Clear permission explanation.
-   Role- and territory-based access.
-   Audit setiap akses riwayat lokasi.
-   Retention period ditetapkan melalui kebijakan perusahaan dan hukum
    yang berlaku.
-   User dapat melihat status tracking dan informasi yang relevan.
-   GPS accuracy ditampilkan dan dipertimbangkan.
-   Location data tidak digunakan di luar tujuan yang dinyatakan.

------------------------------------------------------------------------

# BAGIAN IV --- AI INTELLIGENCE PLATFORM

# 7. Unified AI Architecture

## 7.1 Core components

1.  AI Gateway.
2.  Unified AI Orchestrator.
3.  Model Router.
4.  Context Engine.
5.  Memory Coordinator.
6.  Agent Registry.
7.  Skill Registry.
8.  Tool Gateway.
9.  Knowledge / RAG.
10. Approval Engine.
11. Usage Metering.
12. AI Audit.

## 7.2 Model Router

Routing berdasarkan: - Task category. - Required modality. - Quality
target. - Latency. - Cost budget. - Tenant policy. - Data sensitivity. -
Provider availability.

Task categories: - Reasoning / chat. - Classification. - Structured
extraction. - OCR / vision. - Embeddings. - Forecasting. - Content
generation. - Speech / transcription.

## 7.3 Memory Coordinator

Memory types: - Working. - Conversation. - Episodic. - Semantic. -
Long-term. - Procedural.

Memory governance: - Consent. - Tenant isolation. - User scope. -
Retention. - Deletion. - Provenance. - Access control. - Sensitive-data
filtering.

## 7.4 Agent Registry

Baseline agents: - Sales Assistant. - Sales Coach. - Visit Planner. -
Territory Analyst. - Outlet Intelligence. - Order Assistant. - Promotion
Advisor. - Demand Planner. - Customer Intelligence. - Executive
Analyst. - Content Strategist. - Script Writer. - Storyboard Agent. -
Brand Compliance Agent.

## 7.5 Tool Gateway

Tools must have: - Tool name and version. - Input schema. - Output
schema. - Tenant scope. - Permission requirements. - Validation. -
Idempotency policy. - Timeout. - Retry policy. - Audit. - Side-effect
classification.

Tool execution must re-check authorization at execution time. Model
output is untrusted input and must not directly execute arbitrary SQL or
shell commands.

## 7.6 Autonomy levels

  Level   Behavior
  ------- ------------------------------------------
  L0      Explain / answer
  L1      Recommend
  L2      Draft action
  L3      Execute after approval
  L4      Bounded automation under explicit policy

Default is L1/L2. High-impact business actions require approval or
deterministic policy controls.

## 7.7 AI Sales Intelligence

Examples: - Outlet priority recommendation. - Reorder opportunity. -
Sales target gap analysis. - Product affinity. - Visit planning. -
Territory coverage analysis. - Promotion fit. - Follow-up drafting. -
Daily sales summary.

Every recommendation should provide: - Relevant period. - Source data
references. - Reasoning summary. - Assumptions. - Confidence or
uncertainty where meaningful. - Suggested next action.

AI must not fabricate metrics. If data is unavailable, it must say so.

------------------------------------------------------------------------

# BAGIAN V --- TELEGRAM AI PROACTIVE

# 8. Telegram Assistant

## 8.1 Purpose

Telegram menjadi communication channel dan AI Sales Companion, bukan
business database atau independent business engine.

Personas: - Sales. - Supervisor. - Area Manager. - Company Admin. -
Management.

## 8.2 Capabilities

-   `/start`: activate bot.
-   `/link`: link account.
-   `/help`: help.
-   `/today`: daily briefing.
-   `/daily`: daily report.
-   `/weekly`: weekly report.
-   `/monthly`: monthly report.
-   `/sales`: sales summary.
-   `/target`: target progress.
-   `/visit`: visit plan and status.
-   `/promotion`: promotion recommendation.
-   `/content`: content generation.
-   `/analysis`: AI analysis.
-   `/ask`: general SalesX-Ai assistant.
-   `/settings`: notification preferences.
-   `/stop`: stop proactive messages.

## 8.3 Proactive triggers

  Trigger               Action
  --------------------- --------------------------------
  Start of workday      Daily briefing
  Shift not started     Configured reminder
  Visit due             Visit reminder
  Visit completed       Follow-up prompt
  Order created         Order summary
  Target threshold      Target insight
  Promotion activated   Relevant outlet recommendation
  End of workday        Daily report
  Weekly schedule       Weekly analysis
  Monthly schedule      Monthly review

Proactive policy: - Quiet hours. - Frequency cap. - Priority. - User
preferences. - Duplicate suppression. - Retry. - Delivery logs. -
Opt-out.

## 8.4 Account linking

``` text
SalesX-Ai Web / Mobile
  -> Generate one-time link token
  -> User opens Telegram deep link
  -> Bot receives /start token
  -> FastAPI validates token
  -> Link Telegram user ID to SalesX-Ai user
  -> Mark token used
  -> Record audit
```

Do not use Telegram username as authorization identity. Use verified
Telegram user ID and explicit account linking.

## 8.5 Telegram security

-   Store bot token in secret manager.
-   Verify webhook secret token.
-   Deduplicate `update_id`.
-   Apply user and tenant authorization.
-   Scope group data to all authorized recipients.
-   Avoid sending sensitive data to broad groups.
-   Store delivery and audit records.
-   Allow unlinking and notification preference management.
-   Do not expose service credentials to the bot client.

## 8.6 Telegram APIs

``` text
POST /api/v1/integrations/telegram/webhook
POST /api/v1/integrations/telegram/link
GET  /api/v1/integrations/telegram/status
PUT  /api/v1/integrations/telegram/preferences
POST /api/v1/integrations/telegram/test-message
GET  /api/v1/integrations/telegram/deliveries
```

------------------------------------------------------------------------

# BAGIAN VI --- AI CONTENT STUDIO & REMOTION

# 9. Content Generation

## 9.1 Objective

Menghasilkan materi promosi yang konsisten dengan data produk, harga,
stok, promosi, dan brand guideline.

## 9.2 Workflow

``` text
Select Product
  -> Create Brief
  -> Generate Script
  -> Generate Storyboard
  -> Generate / Select Assets
  -> Validate Brand and Claims
  -> Select Remotion Template
  -> Preview with Remotion Player
  -> Edit
  -> Approval
  -> Queue Render
  -> Node.js Remotion Renderer
  -> Save Output to Supabase Storage
  -> Notify Web / Mobile / Telegram
```

## 9.3 Responsibilities

  Component              Responsibility
  ---------------------- ------------------------------------------
  LLM                    Brief, script, storyboard, captions
  Image/video provider   Generate or transform media assets
  TTS provider           Voiceover
  Brand Compliance       Check price, claims, assets, brand rules
  Remotion Player        Preview
  Remotion Renderer      Final video rendering
  FastAPI                Project, job, status, authorization
  Python worker          AI and orchestration jobs
  Supabase Storage       Media and output storage

Remotion is a React-based programmatic video framework. It is not itself
an LLM or complete AI video-generation provider.

## 9.4 Templates

-   Product Showcase.
-   Discount / Flash Sale.
-   Product Education.
-   Testimonial.
-   New Product Launch.
-   Sales Activity Recap.
-   Brand Story.
-   Weekly Promotion.
-   Distributor Campaign.
-   Store Visit Recap.

## 9.5 Content database

-   `content_projects`
-   `content_briefs`
-   `content_scripts`
-   `content_storyboards`
-   `content_templates`
-   `content_assets`
-   `content_render_jobs`
-   `content_render_outputs`
-   `content_approvals`
-   `content_publications`
-   `content_usage_ledger`

## 9.6 Render lifecycle

``` text
DRAFT
-> GENERATING_SCRIPT
-> GENERATING_ASSETS
-> READY_FOR_PREVIEW
-> AWAITING_APPROVAL
-> QUEUED
-> RENDERING
-> COMPLETED

Alternative:
FAILED / RETRYING / CANCELLED
```

Renderer must support: - Job idempotency. - Concurrency control. -
Timeout. - Cancellation. - Retry. - Progress. - Checkpoint where
practical. - Output validation. - Cleanup. - Cost and usage tracking.

Node.js renderer runs separately from FastAPI due browser, CPU, memory,
and FFmpeg requirements.

------------------------------------------------------------------------

# BAGIAN VII --- MASTER DESIGN SYSTEM

# 10. Brand Identity & Visual Direction

## 10.1 Brand name

**SalesX-Ai**

Brand personality: - Professional. - Modern. - Intelligent. -
Trustworthy. - Clear. - Calm. - Efficient. - Enterprise-ready.

## 10.2 Visual direction

-   Light theme as default.
-   Light blue brand identity.
-   White and neutral surfaces.
-   Navy / deep blue for readable text and primary contrast.
-   Minimalist layouts.
-   Consistent grid.
-   Subtle borders and shadows.
-   No excessive gradients.
-   No unnecessary glassmorphism.
-   No decorative elements that reduce usability.
-   Data-heavy screens must remain readable.
-   Mobile interactions must be touch-friendly.

## 10.3 Required brand colors

  Name          HEX         RGB               Role
  ------------- ----------- ----------------- ------------------
  Light Blue    `#ADD8E6`   `173, 216, 230`   Core brand
  Sky Blue      `#87CEEB`   `135, 206, 235`   Supporting brand
  Powder Blue   `#B0E0E6`   `176, 224, 230`   Supporting brand

These colors are identity colors. They must not automatically be used as
small text on white backgrounds because contrast may be insufficient.

# 11. Color Tokens

## 11.1 Brand primitive palette

  Token         HEX         Intended usage
  ------------- ----------- ---------------------------
  `brand.50`    `#F3FAFC`   Very subtle brand surface
  `brand.100`   `#E5F4F8`   Soft background
  `brand.200`   `#ADD8E6`   Light Blue identity
  `brand.300`   `#B0E0E6`   Powder Blue identity
  `brand.400`   `#87CEEB`   Sky Blue identity
  `brand.500`   `#5BAFD0`   Stronger brand accent
  `brand.600`   `#348CB2`   Accessible primary action
  `brand.700`   `#236D91`   Hover / emphasis
  `brand.800`   `#194F70`   Strong text / dark brand
  `brand.900`   `#123A54`   Deep brand

## 11.2 Neutral palette

  Token           HEX
  --------------- -----------
  `neutral.0`     `#FFFFFF`
  `neutral.50`    `#F8FAFC`
  `neutral.100`   `#F1F5F9`
  `neutral.200`   `#E2E8F0`
  `neutral.300`   `#CBD5E1`
  `neutral.400`   `#94A3B8`
  `neutral.500`   `#64748B`
  `neutral.600`   `#475569`
  `neutral.700`   `#334155`
  `neutral.800`   `#1E293B`
  `neutral.900`   `#0F172A`

## 11.3 Semantic palette

  Token           HEX         Use
  --------------- ----------- -----------------
  `success.50`    `#ECFDF5`   Success surface
  `success.500`   `#10B981`   Success state
  `success.700`   `#047857`   Success text
  `warning.50`    `#FFFBEB`   Warning surface
  `warning.500`   `#F59E0B`   Warning state
  `warning.700`   `#B45309`   Warning text
  `danger.50`     `#FEF2F2`   Error surface
  `danger.500`    `#EF4444`   Error state
  `danger.700`    `#B91C1C`   Error text
  `info.50`       `#EFF6FF`   Info surface
  `info.500`      `#3B82F6`   Info state
  `info.700`      `#1D4ED8`   Info text

## 11.4 Semantic role mapping

  Semantic token                  Light theme
  ------------------------------- ---------------
  `color.background`              `neutral.50`
  `color.surface`                 `neutral.0`
  `color.surface.raised`          `neutral.0`
  `color.surface.muted`           `neutral.100`
  `color.text.primary`            `neutral.900`
  `color.text.secondary`          `neutral.600`
  `color.text.muted`              `neutral.500`
  `color.border`                  `neutral.200`
  `color.border.strong`           `neutral.300`
  `color.action.primary`          `brand.600`
  `color.action.primary.hover`    `brand.700`
  `color.action.primary.subtle`   `brand.50`
  `color.focus`                   `brand.600`
  `color.status.success`          `success.500`
  `color.status.warning`          `warning.500`
  `color.status.danger`           `danger.500`
  `color.status.info`             `info.500`

## 11.5 Dark theme

Dark theme must map semantic roles, not invert every color mechanically.

  Semantic token                  Dark theme
  ------------------------------- ------------
  `color.background`              `#0B1220`
  `color.surface`                 `#111C2D`
  `color.surface.raised`          `#172438`
  `color.surface.muted`           `#1A2A3F`
  `color.text.primary`            `#F8FAFC`
  `color.text.secondary`          `#CBD5E1`
  `color.text.muted`              `#94A3B8`
  `color.border`                  `#26374B`
  `color.border.strong`           `#3A506A`
  `color.action.primary`          `#87CEEB`
  `color.action.primary.hover`    `#ADD8E6`
  `color.action.primary.subtle`   `#19394B`

Dark theme semantic combinations must be checked for contrast before
release.

## 11.6 Contrast rules

-   Normal text: WCAG AA contrast ratio at least 4.5:1.
-   Large text: at least 3:1.
-   Meaningful graphical objects and control boundaries: target at least
    3:1.
-   Never rely on color alone to communicate status.
-   Use dark brand tokens for text on light surfaces.
-   Run automated and manual contrast checks for light and dark themes.

# 12. Typography Tokens

Primary typeface: Inter.

Fallback: - system-ui - -apple-system - BlinkMacSystemFont - Segoe UI -
sans-serif

  Token                  Size   Line height   Weight
  -------------------- ------ ------------- --------
  `font.display.2xl`     48px          56px      700
  `font.display.xl`      40px          48px      700
  `font.heading.xl`      32px          40px      700
  `font.heading.lg`      28px          36px      650
  `font.heading.md`      24px          32px      600
  `font.heading.sm`      20px          28px      600
  `font.title.lg`        18px          28px      600
  `font.title.md`        16px          24px      600
  `font.body.lg`         16px          24px      400
  `font.body.md`         14px          22px      400
  `font.body.sm`         13px          20px      400
  `font.caption`         12px          18px      400
  `font.overline`        11px          16px      600

Rules: - Body text default 14--16px. - Important numeric metrics use
tabular numbers. - Avoid very small table text. - Use consistent heading
hierarchy. - Do not use font weight alone to communicate status.

# 13. Spacing Tokens

Base unit: 4px.

  Token          Value
  ------------ -------
  `space.0`        0px
  `space.1`        4px
  `space.2`        8px
  `space.3`       12px
  `space.4`       16px
  `space.5`       20px
  `space.6`       24px
  `space.8`       32px
  `space.10`      40px
  `space.12`      48px
  `space.16`      64px
  `space.20`      80px
  `space.24`      96px

Guidelines: - Mobile page gutter: 16px. - Desktop page gutter:
24--32px. - Card padding: 16--24px. - Form field gap: 12--16px. -
Section gap: 24--32px. - Use token values; arbitrary values require
documented justification.

# 14. Radius Tokens

  Token              Value
  --------------- --------
  `radius.none`        0px
  `radius.sm`          4px
  `radius.md`          8px
  `radius.lg`         12px
  `radius.xl`         16px
  `radius.2xl`        20px
  `radius.3xl`        24px
  `radius.full`     9999px

Usage: - Inputs: 8--10px. - Buttons: 8--10px. - Cards: 12--16px. -
Dialogs: 16px. - Avatar: full.

# 15. Shadow Tokens

  Token         Usage
  ------------- ---------------------------
  `shadow.xs`   Subtle surface separation
  `shadow.sm`   Small card
  `shadow.md`   Dropdown / popover
  `shadow.lg`   Dialog
  `shadow.xl`   Large overlay

Prefer borders and surface contrast over heavy shadows.

# 16. Layout, Grid & Breakpoints

## 16.1 Breakpoints

  Token                 Width Use
  ------------------ -------- ---------------
  `breakpoint.xs`       360px Small mobile
  `breakpoint.sm`       640px Large mobile
  `breakpoint.md`       768px Tablet
  `breakpoint.lg`      1024px Small desktop
  `breakpoint.xl`      1280px Desktop
  `breakpoint.2xl`     1536px Wide desktop

## 16.2 Application shell

Desktop: - Sidebar: 248px. - Collapsed sidebar: 72px. - Header: 64px. -
Content max width: 1440px. - Main content uses fluid layout.

Mobile: - Header: 56px. - Bottom navigation: 64--72px plus safe-area
inset. - Page gutter: 16px. - Full-screen or bottom-sheet dialogs where
appropriate.

## 16.3 Responsive behavior

-   Mobile: single-column first.
-   Tablet: compact navigation / drawer.
-   Desktop: sidebar and multi-column layouts.
-   Data table: card/list alternative or controlled horizontal
    scrolling.
-   Map: full-screen mobile mode and large workspace desktop mode.
-   Content editor: responsive preview and controls.

# 17. Motion Tokens

  Token               Duration
  ----------------- ----------
  `motion.fast`          120ms
  `motion.normal`        200ms
  `motion.slow`          300ms

Rules: - Respect reduced-motion preferences. - Avoid decorative
continuous animation. - Loading animations must communicate progress. -
Map and chart transitions should not impair interaction.

# 18. Z-Index Tokens

  Token            Value
  -------------- -------
  `z.base`             0
  `z.dropdown`       100
  `z.sticky`         200
  `z.overlay`        300
  `z.modal`          400
  `z.toast`          500
  `z.critical`       600

# 19. Component Library Requirements

Every component must document: - Purpose. - API / props. - Variants. -
States. - Accessibility. - Responsive behavior. - Keyboard behavior. -
Usage examples. - Do / don't guidance.

## 19.1 Foundation components

-   Button.
-   IconButton.
-   Input.
-   Textarea.
-   Select.
-   Checkbox.
-   Radio.
-   Switch.
-   DatePicker.
-   TimePicker.
-   Search.
-   Avatar.
-   Badge.
-   Tooltip.
-   Divider.
-   Skeleton.
-   Spinner.
-   Progress.
-   Toast.
-   Dialog.
-   Drawer.
-   Popover.

## 19.2 Navigation components

-   AppSidebar.
-   SidebarItem.
-   AppHeader.
-   Breadcrumb.
-   Tabs.
-   BottomNavigation.
-   Pagination.
-   DropdownMenu.
-   CommandMenu.
-   MobileNavigationDrawer.

## 19.3 Data components

-   DataTable.
-   MetricCard.
-   KPIGrid.
-   ChartContainer.
-   FilterBar.
-   SearchableTable.
-   EmptyState.
-   ErrorState.
-   LoadingState.
-   StatusIndicator.
-   Timeline.
-   ActivityFeed.
-   ExportMenu.

## 19.4 Business components

-   SalesPerformanceCard.
-   OutletCard.
-   ProductCard.
-   OrderSummary.
-   PromotionCard.
-   RewardCard.
-   VisitStatus.
-   AttendanceStatus.
-   SalesTargetProgress.
-   RouteSummary.
-   GPSStatus.
-   AIRecommendationCard.

## 19.5 AI components

-   AIAssistantPanel.
-   ChatMessage.
-   PromptInput.
-   AgentSelector.
-   ModelSelector.
-   ToolExecutionStatus.
-   AIInsightCard.
-   AIRecommendation.
-   ApprovalCard.
-   SourceCitation.
-   AIUsageMeter.

## 19.6 Content components

-   ContentBriefForm.
-   ScriptEditor.
-   StoryboardTimeline.
-   AssetLibrary.
-   TemplateGallery.
-   VideoPlayer.
-   RenderProgress.
-   ApprovalPanel.
-   ExportAction.

## 19.7 Location components

-   LiveMap.
-   SalesMarker.
-   OutletMarker.
-   GeofenceOverlay.
-   RoutePolyline.
-   RouteReplayControls.
-   VisitTimeline.
-   LocationAccuracyIndicator.
-   TrackingSessionStatus.

## 19.8 Component states

Where relevant: - Default. - Hover. - Focus. - Active. - Selected. -
Disabled. - Loading. - Error. - Success. - Empty. - Read-only.

## 19.9 Accessibility

-   Keyboard navigation.
-   Visible focus.
-   Semantic labels.
-   Screen-reader support.
-   Touch target at least 44×44px for primary controls.
-   Color is not the only status signal.
-   Form errors are announced and associated with inputs.
-   Respect reduced motion.
-   Contrast follows WCAG AA.

# 20. Design Token Source of Truth

Use one canonical token source, then generate: - CSS variables for
web. - TypeScript token exports. - React Native token exports. - Theme
maps. - Documentation / token reference.

Recommended location:

``` text
packages/design-system/
├── tokens/
│   ├── primitives.json
│   ├── semantic-light.json
│   ├── semantic-dark.json
│   ├── components.json
│   └── token.schema.json
├── src/
│   ├── web/
│   ├── native/
│   ├── themes/
│   └── components/
└── scripts/
    └── build-tokens.ts
```

Do not manually maintain divergent color values in each app.

## 20.1 CSS token example

``` css
:root {
  --brand-50: #F3FAFC;
  --brand-100: #E5F4F8;
  --brand-200: #ADD8E6;
  --brand-300: #B0E0E6;
  --brand-400: #87CEEB;
  --brand-500: #5BAFD0;
  --brand-600: #348CB2;
  --brand-700: #236D91;
  --brand-800: #194F70;
  --brand-900: #123A54;

  --neutral-0: #FFFFFF;
  --neutral-50: #F8FAFC;
  --neutral-100: #F1F5F9;
  --neutral-200: #E2E8F0;
  --neutral-300: #CBD5E1;
  --neutral-400: #94A3B8;
  --neutral-500: #64748B;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1E293B;
  --neutral-900: #0F172A;

  --color-background: var(--neutral-50);
  --color-surface: var(--neutral-0);
  --color-surface-muted: var(--neutral-100);
  --color-text-primary: var(--neutral-900);
  --color-text-secondary: var(--neutral-600);
  --color-border: var(--neutral-200);
  --color-primary: var(--brand-600);
  --color-primary-hover: var(--brand-700);

  --font-sans: Inter, system-ui, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;

  --shadow-xs: 0 1px 2px rgba(15, 23, 42, .04);
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, .06);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, .08);

  --sidebar-width: 248px;
  --header-height: 64px;

  --motion-fast: 120ms;
  --motion-normal: 200ms;
  --motion-slow: 300ms;
}
```

## 20.2 React Native token example

``` ts
export const colors = {
  brand: {
    50: "#F3FAFC",
    100: "#E5F4F8",
    200: "#ADD8E6",
    300: "#B0E0E6",
    400: "#87CEEB",
    500: "#5BAFD0",
    600: "#348CB2",
    700: "#236D91",
    800: "#194F70",
    900: "#123A54",
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },
} as const;

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

export const radius = {
  sm: 4, md: 8, lg: 12, xl: 16,
  "2xl": 20, full: 9999,
} as const;
```

The JSON token source remains canonical; these snippets are examples of
generated outputs, not independent sources of truth.

------------------------------------------------------------------------

# BAGIAN VIII --- MONOREPO ARCHITECTURE

# 21. Architecture Decision

**Pattern:** Domain-oriented modular monorepo with independently
deployable applications and services.

Goals: - One GitHub repository. - Independent application folders. -
Independent service folders. - Shared packages for reusable UI and
contracts. - One controlled database migration history. - Independent
deployment and scaling. - Dependency-aware CI/CD.

## 21.1 High-level architecture

``` text
                         GitHub Monorepo
                               |
        +----------------------+----------------------+
        |                      |                      |
   Applications             Services               Packages
        |                      |                      |
  Next.js Portals           FastAPI API           Design System
  Expo Mobile               AI Worker             API Client
  Super Admin               GPS Worker            Shared Types
                            Telegram Service      API Contracts
                            Analytics Worker       Event Contracts
                            Remotion Renderer     Validation
        |                      |                      |
        +----------------------+----------------------+
                               |
                        Shared Data Platform
                               |
             Supabase PostgreSQL / Auth / Storage
                   PostGIS / Realtime / pgvector
```

## 21.2 Monorepo folder structure

``` text
salesx-ai/
│
├── apps/
│   ├── website/
│   ├── customer-portal/
│   ├── company-portal/
│   ├── sales-portal/
│   ├── distributor-portal/
│   ├── principal-portal/
│   ├── supervisor-portal/
│   ├── super-admin/
│   └── mobile-sales/
│
├── services/
│   ├── api/
│   ├── ai-worker/
│   ├── location-worker/
│   ├── telegram-service/
│   ├── analytics-worker/
│   ├── notification-worker/
│   └── remotion-renderer/
│
├── packages/
│   ├── design-system/
│   ├── shared-types/
│   ├── api-client/
│   ├── api-contracts/
│   ├── event-contracts/
│   ├── auth-client/
│   ├── permissions/
│   ├── validation/
│   ├── shared-utils/
│   ├── maps/
│   ├── ai-contracts/
│   ├── content-contracts/
│   └── config/
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── tests/
│
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   ├── environments/
│   ├── monitoring/
│   ├── reverse-proxy/
│   └── scripts/
│
├── .github/
│   ├── workflows/
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
├── docs/
│   ├── master-prd/
│   ├── architecture/
│   ├── design-system/
│   ├── api/
│   ├── database/
│   ├── security/
│   ├── deployment/
│   ├── operations/
│   └── adr/
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── pyproject.toml
├── .gitignore
├── .editorconfig
├── .nvmrc
├── AGENTS.md
└── README.md
```

## 21.3 Application folder standard

Each Next.js application:

``` text
apps/<application>/
├── src/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── layouts/
│   ├── hooks/
│   ├── lib/
│   ├── providers/
│   ├── styles/
│   └── types/
├── public/
├── tests/
├── next.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

Each app owns: - Its routes. - Its layouts. - Its feature composition. -
Its app-specific configuration. - Its environment variables. - Its build
and start commands. - Its deployment target. - Its monitoring
configuration.

Apps may consume shared packages but must not import another app's
internal source code.

## 21.4 Expo folder standard

``` text
apps/mobile-sales/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── visits/
│   ├── orders/
│   ├── location/
│   ├── assistant/
│   └── settings/
├── src/
│   ├── features/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── storage/
│   ├── tasks/
│   ├── providers/
│   └── types/
├── assets/
├── plugins/
├── tests/
├── app.config.ts
├── eas.json
├── package.json
└── README.md
```

Background task definitions must be registered at module scope according
to Expo TaskManager requirements. Native configuration and development
builds are required for background location capabilities.

## 21.5 FastAPI folder standard

``` text
services/api/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── auth.py
│   │   ├── tenant.py
│   │   ├── permissions.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── api/
│   │   └── v1/
│   ├── domains/
│   │   ├── identity/
│   │   ├── tenants/
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── promotions/
│   │   ├── rewards/
│   │   ├── location/
│   │   ├── intelligence/
│   │   ├── content/
│   │   ├── telegram/
│   │   ├── analytics/
│   │   ├── workflows/
│   │   └── integrations/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── storage/
│   │   ├── redis/
│   │   ├── event_bus/
│   │   ├── telemetry/
│   │   └── external_apis/
│   └── middleware/
├── migrations/
├── tests/
├── pyproject.toml
├── Dockerfile
└── README.md
```

Domain internal pattern: - `models` - `schemas` - `repository` -
`service` - `policies` - `events` - `routes` - `tests`

Keep API handlers thin. Business logic belongs in domain services.

## 21.6 Worker folder standard

Each worker must have: - Own entrypoint. - Own configuration. - Own
dependencies. - Own queue subscriptions. - Own concurrency limits. - Own
health checks. - Own metrics. - Own Dockerfile. - Own deployment
configuration.

Workers: - AI Worker. - Location Worker. - Telegram Service. - Analytics
Worker. - Notification Worker. - Remotion Renderer.

## 21.7 Remotion renderer folder

``` text
services/remotion-renderer/
├── src/
│   ├── compositions/
│   ├── components/
│   ├── templates/
│   ├── assets/
│   ├── render/
│   ├── workers/
│   └── validation/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 21.8 Shared packages

  Package               Responsibility
  --------------------- ----------------------------------------
  `design-system`       UI components and themes
  `shared-types`        Shared primitive types
  `api-client`          Typed API client
  `api-contracts`       Request/response contracts
  `event-contracts`     Event schemas
  `auth-client`         Client-side session integration
  `permissions`         Permission identifiers and UI helpers
  `validation`          Shared validation schemas
  `shared-utils`        Safe generic utilities
  `maps`                Shared map abstractions
  `ai-contracts`        Agent and AI request contracts
  `content-contracts`   Content and render contracts
  `config`              Shared lint / TypeScript configuration

Backend remains the authority for permissions. Frontend helpers are only
for UI behavior.

------------------------------------------------------------------------

# BAGIAN IX --- BACKEND, DATA & INTEGRATION ARCHITECTURE

# 22. Backend Service Boundaries

  Domain         Responsibility
  -------------- -------------------------------------
  Identity       User, session, roles
  Tenant         Company and organization scope
  Sales          Sales activity and visit
  Commerce       Product, pricing, inventory, order
  Loyalty        Reward and incentive
  Location       GPS, route, geofence
  Intelligence   AI orchestration, agents, memory
  Content        Brief, assets, render lifecycle
  Telegram       Bot, account linking, notifications
  Analytics      Metrics, aggregation, reports
  Workflow       Schedule, approvals, executions
  Integration    External systems and webhooks
  Audit          Security and action history

## 22.1 API versioning

Base: `/api/v1`

Use: - Pydantic schemas. - OpenAPI. - Typed clients. - Consistent
pagination. - Consistent error response. - Idempotency keys for
sensitive operations. - Correlation IDs. - Tenant context. - Request
tracing.

Example endpoint groups:

``` text
/api/v1/auth/*
/api/v1/tenants/*
/api/v1/sales/*
/api/v1/outlets/*
/api/v1/products/*
/api/v1/orders/*
/api/v1/rewards/*
/api/v1/location/*
/api/v1/routes/*
/api/v1/ai/*
/api/v1/content/*
/api/v1/integrations/telegram/*
/api/v1/analytics/*
/api/v1/workflows/*
/api/v1/admin/*
```

## 22.2 Event envelope

``` json
{
  "event_id": "uuid",
  "event_type": "order.created",
  "event_version": 1,
  "tenant_id": "uuid",
  "aggregate_id": "uuid",
  "occurred_at": "ISO-8601 timestamp",
  "producer": "commerce",
  "correlation_id": "uuid",
  "payload": {}
}
```

Use Transactional Outbox where reliable event publication is required.
Consumers must be idempotent and support retry and dead-letter handling.

## 22.3 Core events

-   `shift.started`
-   `shift.ended`
-   `location.updated`
-   `geofence.entered`
-   `visit.checked_in`
-   `visit.checked_out`
-   `order.created`
-   `order.approved`
-   `promotion.activated`
-   `reward.earned`
-   `content.project.created`
-   `content.render.requested`
-   `content.render.completed`
-   `daily.report.ready`
-   `workflow.approval.requested`

------------------------------------------------------------------------

# 23. Supabase Database Architecture

## 23.1 Logical schemas

-   `identity`
-   `core`
-   `sales`
-   `commerce`
-   `loyalty`
-   `location`
-   `intelligence`
-   `content`
-   `telegram`
-   `workflow`
-   `analytics`
-   `integration`
-   `audit`

## 23.2 Core tables

### Identity

-   tenants
-   organizations
-   branches
-   users
-   user_profiles
-   roles
-   permissions
-   user_roles
-   role_permissions

### Sales

-   sales_profiles
-   sales_teams
-   territories
-   outlets
-   visits
-   visit_evidence
-   attendance
-   sales_targets
-   sales_activities

### Commerce

-   products
-   product_categories
-   product_variants
-   pricing
-   inventory
-   promotions
-   orders
-   order_items
-   order_status_history

### Loyalty

-   reward_programs
-   reward_catalog
-   reward_ledger
-   incentive_rules
-   reward_redemptions

### Location

-   location_sessions
-   location_points
-   latest_locations
-   route_segments
-   geofences
-   geofence_events
-   location_policies
-   location_access_audit

### Intelligence

-   ai_providers
-   ai_models
-   ai_agents
-   ai_skills
-   ai_tools
-   ai_conversations
-   ai_memory
-   ai_usage_ledger
-   knowledge_documents
-   knowledge_chunks

### Content

-   content_projects
-   content_briefs
-   content_scripts
-   content_storyboards
-   content_templates
-   content_assets
-   content_render_jobs
-   content_render_outputs
-   content_approvals
-   content_publications

### Telegram

-   telegram_bots
-   telegram_accounts
-   telegram_chat_bindings
-   telegram_groups
-   telegram_update_inbox
-   telegram_message_outbox
-   telegram_notification_preferences
-   telegram_delivery_logs

### Workflow

-   workflow_definitions
-   workflow_runs
-   workflow_steps
-   workflow_approvals
-   scheduled_jobs
-   event_outbox

### Analytics

-   report_definitions
-   report_runs
-   metric_snapshots
-   sales_aggregates
-   territory_aggregates

### Integration

-   external_connections
-   webhook_endpoints
-   webhook_inbox
-   webhook_delivery_logs

### Audit

-   audit_logs
-   access_logs
-   security_events
-   admin_actions

## 23.3 Database rules

-   Tenant ownership must be enforceable through relational constraints
    and policies.
-   Foreign keys and uniqueness constraints must protect integrity.
-   RLS enabled for exposed tables.
-   Service role remains server-side only.
-   Database migrations are version controlled.
-   Avoid direct browser writes to business-critical tables.
-   Use PostGIS for spatial workloads.
-   Partition high-volume location history when justified by volume and
    query patterns.
-   Use pgvector for semantic retrieval.
-   Storage buckets private by default for business evidence and
    generated content.
-   Use short-lived signed URLs.
-   Define retention and deletion policy.

## 23.4 Storage buckets

-   `tenant-assets`
-   `field-evidence`
-   `content-media`
-   `content-outputs`
-   `report-exports`

Suggested path pattern:

``` text
tenant-assets/{tenant_id}/brand/
tenant-assets/{tenant_id}/products/
field-evidence/{tenant_id}/{user_id}/{visit_id}/
content-media/{tenant_id}/{project_id}/
content-outputs/{tenant_id}/{project_id}/
report-exports/{tenant_id}/{report_id}/
```

------------------------------------------------------------------------

# BAGIAN X --- MONOREPO TOOLING & DEPLOYMENT

# 24. Workspace Tooling

Recommended: - pnpm workspaces. - Turborepo. - TypeScript. - Python
`pyproject.toml`. - Docker. - GitHub Actions.

## 24.1 pnpm workspace

`pnpm-workspace.yaml`:

``` yaml
packages:
  - "apps/*"
  - "services/remotion-renderer"
  - "packages/*"
```

Python services retain independent `pyproject.toml` and dependency
environments. They do not need to be forced into the JavaScript
workspace.

## 24.2 Turborepo

Example `turbo.json`:

``` json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

Tune tasks to actual package capabilities. Do not define a task in a
package that does not implement it.

# 25. Independent Deployment Architecture

## 25.1 Deployment principle

Each app is configured as an independent deployment project with: - Its
own root directory. - Build command. - Install/build configuration. -
Environment variables. - Domain. - Deployment target. - Preview
behavior. - Production release policy. - Monitoring and logs.

Shared dependencies are built as part of the affected application
pipeline.

## 25.2 Vercel project mapping

  Vercel Project         Monorepo Root
  ---------------------- ---------------------------
  `salesx-website`       `apps/website`
  `salesx-customer`      `apps/customer-portal`
  `salesx-company`       `apps/company-portal`
  `salesx-sales`         `apps/sales-portal`
  `salesx-distributor`   `apps/distributor-portal`
  `salesx-principal`     `apps/principal-portal`
  `salesx-supervisor`    `apps/supervisor-portal`
  `salesx-admin`         `apps/super-admin`

Each Vercel project should be connected to the same GitHub repository
but configured with its own root directory and domain.

## 25.3 Backend deployment mapping

  Service               Root
  --------------------- --------------------------------
  API                   `services/api`
  AI Worker             `services/ai-worker`
  Location Worker       `services/location-worker`
  Telegram Service      `services/telegram-service`
  Analytics Worker      `services/analytics-worker`
  Notification Worker   `services/notification-worker`
  Remotion Renderer     `services/remotion-renderer`

Container platform can be selected per runtime and workload. API and
workers need not share the same provider as Vercel.

## 25.4 Example domain map

  Service       Example domain
  ------------- -----------------------------
  Website       `www.salesx-ai.com`
  Customer      `customer.salesx-ai.com`
  Company       `company.salesx-ai.com`
  Sales         `sales.salesx-ai.com`
  Distributor   `distributor.salesx-ai.com`
  Principal     `principal.salesx-ai.com`
  Supervisor    `supervisor.salesx-ai.com`
  Super Admin   `admin.salesx-ai.com`
  API           `api.salesx-ai.com`

These are examples only; verify domain ownership and DNS configuration
before deployment.

## 25.5 Independent release rules

-   A change in Sales Portal should not deploy Super Admin.
-   A change in Super Admin should not deploy Customer Portal.
-   A Telegram service change should not deploy all web portals.
-   An API change deploys API and triggers contract compatibility
    checks.
-   A Design System change identifies all affected applications.
-   A shared API contract change identifies all consumers.
-   Database migrations follow a controlled, backward-compatible rollout
    policy.
-   A shared package change may require rebuilding multiple consumers,
    but does not require deploying all of them simultaneously.

## 25.6 GitHub Actions workflow structure

``` text
.github/workflows/
├── ci-monorepo.yml
├── deploy-website.yml
├── deploy-customer.yml
├── deploy-company.yml
├── deploy-sales.yml
├── deploy-distributor.yml
├── deploy-principal.yml
├── deploy-supervisor.yml
├── deploy-super-admin.yml
├── deploy-api.yml
├── deploy-ai-worker.yml
├── deploy-location-worker.yml
├── deploy-telegram.yml
├── deploy-analytics-worker.yml
├── deploy-notification-worker.yml
├── deploy-remotion.yml
├── supabase-migration.yml
└── security-scan.yml
```

Workflow must: 1. Identify changed paths. 2. Resolve affected apps and
dependencies. 3. Install reproducibly from lockfile. 4. Run relevant
lint/type checks/builds. 5. Validate configuration. 6. Produce artifact.
7. Deploy only the intended target. 8. Record commit SHA and deployment
metadata. 9. Support rollback / previous release strategy.

Production deployment must follow the organization's release approval
policy.

------------------------------------------------------------------------

# BAGIAN XI --- AUTHENTICATION, SECURITY & PRIVACY

# 26. Authentication

Supabase Auth is the primary identity provider.

Every application must use consistent: - Session handling. - Token
refresh. - Logout. - MFA policy. - Session expiration. - Account
recovery. - User linking. - Tenant context.

Cross-subdomain cookies must not be assumed to work as the only
authentication mechanism. Define cookie scope, secure attributes,
refresh strategy, CSRF protections where applicable, and domain trust
boundaries.

## 26.1 Authorization

Use: - RBAC. - ABAC. - Tenant scope. - Organization scope. - Team /
territory scope. - Resource ownership. - Action-level permission.

Frontend may hide controls for UX, but backend must always enforce
authorization.

## 26.2 API security

-   CORS allowlist.
-   Rate limiting.
-   Input validation.
-   Request size limits.
-   Authentication.
-   Authorization.
-   Idempotency for critical mutations.
-   Correlation IDs.
-   Audit.
-   Safe error messages.
-   Webhook verification.
-   Secret management.

## 26.3 AI security

-   Never provide database credentials to the model.
-   Tool Gateway validates every tool call.
-   Re-check permissions at execution time.
-   Treat model output as untrusted.
-   Protect against prompt injection.
-   Limit data returned to context.
-   Maintain AI usage and action audit.
-   Require approval for sensitive actions.
-   Apply tenant-aware retrieval filters.

## 26.4 Privacy

-   GPS notice and consent/policy.
-   Location tracking bounded by work context.
-   Telegram preferences and unlink.
-   Memory retention and deletion.
-   Private storage.
-   Data access audit.
-   Defined retention periods.
-   Data export/deletion workflows where required.
-   Comply with applicable data protection laws and company policy.

------------------------------------------------------------------------

# BAGIAN XII --- OBSERVABILITY & OPERATIONS

# 27. Observability

Recommended: - OpenTelemetry. - Prometheus. - Grafana or equivalent. -
Centralized logs. - Error tracking. - Deployment health tracking.

Metrics:

### Web

-   Availability.
-   Core Web Vitals.
-   Frontend errors.
-   API latency.
-   Auth failures.

### Mobile

-   Crash rate.
-   Offline queue size.
-   GPS task health.
-   Permission state.
-   Battery impact.
-   Sync success.

### API

-   Request rate.
-   p50/p95/p99 latency.
-   Error rate.
-   Database connection health.
-   Rate limit events.

### Location

-   Ingestion success.
-   Stale location rate.
-   Accuracy distribution.
-   Route completeness.
-   Geofence processing delay.

### AI

-   Model latency.
-   Token / usage cost.
-   Tool failures.
-   Policy denials.
-   Retrieval quality.
-   User feedback.

### Telegram

-   Webhook success.
-   Update processing delay.
-   Delivery success.
-   Retry and duplicate rate.
-   Bot API errors.

### Remotion

-   Queue depth.
-   Render duration.
-   Failure rate.
-   Output size.
-   Worker resource utilization.

# 28. Reliability Requirements

-   Idempotent operations.
-   Exponential backoff.
-   Dead-letter handling.
-   Event replay.
-   Offline sync.
-   Cancellation.
-   Checkpoint recovery where applicable.
-   Graceful degradation.
-   Database backup and recovery.
-   Worker health checks.
-   Service-specific scaling.
-   Clear incident ownership.

------------------------------------------------------------------------

# BAGIAN XIII --- NON-FUNCTIONAL REQUIREMENTS

# 29. Performance

Performance targets must be validated against actual traffic, devices,
network conditions, and data volume.

Initial engineering goals: - Responsive user interactions. - Pagination
for large data. - Lazy loading for heavy modules. - Optimized images. -
Map marker clustering. - Realtime subscription lifecycle management. -
AI timeout and cost limits. - Render concurrency controls. - Database
query plans reviewed for high-volume paths.

Do not claim performance targets are achieved without measurement.

# 30. Scalability

-   Scale web applications independently.
-   Scale API independently from workers.
-   Scale worker concurrency by job type.
-   Separate CPU-heavy Remotion rendering.
-   Partition high-volume location history when justified.
-   Use aggregate tables/materialized views for expensive analytics when
    appropriate.
-   Avoid excessive realtime subscriptions.
-   Use queue backpressure and concurrency limits.

# 31. Maintainability

-   Domain boundaries.
-   Shared contracts.
-   Type checking.
-   Linting.
-   Migration discipline.
-   ADRs.
-   Component documentation.
-   Service READMEs.
-   Dependency update policy.
-   Code ownership.

------------------------------------------------------------------------

# BAGIAN XIV --- IMPLEMENTATION ROADMAP

# 32. Master Phases

## Phase 01 --- Monorepo Foundation

-   Create repository.
-   Configure pnpm workspace.
-   Configure Turborepo.
-   Create app/service/package boundaries.
-   Add coding conventions.
-   Add CI baseline.
-   Add AGENTS.md.
-   Add architecture documentation.

## Phase 02 --- Design System

-   Canonical token source.
-   CSS token generation.
-   Native token generation.
-   Theme provider.
-   Typography.
-   Component primitives.
-   Responsive rules.
-   Accessibility documentation.
-   Component documentation.

## Phase 03 --- Identity & Tenant Foundation

-   Tenant model.
-   Organization model.
-   Auth.
-   Role / permission.
-   Session.
-   Audit.
-   API contracts.

## Phase 04 --- Business Core

-   SmartTeam.
-   SmartOrder.
-   SmartReward.
-   Master data.
-   Business rules.
-   Reporting foundations.

## Phase 05 --- Web Portals

-   Website.
-   Customer.
-   Company.
-   Sales.
-   Distributor.
-   Principal.
-   Supervisor.
-   Super Admin.

## Phase 06 --- Mobile Sales

-   Expo app.
-   Auth.
-   Shift.
-   Attendance.
-   Visit.
-   Order.
-   Offline sync.
-   Notifications.

## Phase 07 --- Location Intelligence

-   Background GPS.
-   Ingestion.
-   PostGIS.
-   Latest position.
-   Route history.
-   Geofence.
-   Live map.
-   Replay.

## Phase 08 --- Unified AI Foundation

-   Orchestrator.
-   Model Router.
-   Memory.
-   Agent Registry.
-   Skill Registry.
-   Tool Gateway.
-   Usage ledger.

## Phase 09 --- Sales Intelligence

-   Sales Assistant.
-   Sales Coach.
-   Visit Planner.
-   Promotion Advisor.
-   Sales Analysis.

## Phase 10 --- Telegram AI

-   Bot.
-   Webhook.
-   Account linking.
-   Daily report.
-   Proactive engine.
-   Group governance.
-   AI commands.

## Phase 11 --- Remotion Foundation

-   Player.
-   Composition.
-   Templates.
-   Renderer.
-   Render queue.
-   Storage integration.

## Phase 12 --- AI Content Studio

-   Brief.
-   Script.
-   Storyboard.
-   Media generation.
-   Brand compliance.
-   Approval.
-   Render.
-   Delivery.

## Phase 13 --- Cross-Domain Automation

-   Workflow.
-   Events.
-   Scheduling.
-   Approval.
-   Retry.
-   Recovery.
-   Notifications.

## Phase 14 --- Enterprise Governance

-   Monitoring.
-   Security.
-   Cost control.
-   Retention.
-   Audit.
-   Release governance.
-   Disaster recovery.

------------------------------------------------------------------------

# BAGIAN XV --- ACCEPTANCE CRITERIA & DEFINITION OF DONE

# 33. Product Acceptance

-   Every portal has role-appropriate navigation.
-   All business operations use FastAPI.
-   No production demo/mock fallback.
-   Sales mobile supports defined offline behavior.
-   Location history is first-party and replayable.
-   Location access is permission-controlled and audited.
-   AI recommendations use actual data and show their period/source.
-   Telegram proactive respects identity, preferences, and access
    control.
-   Remotion jobs have a complete lifecycle.
-   Super Admin can govern platform-level configuration within its
    permissions.

# 34. Design System Acceptance

-   Brand colors match the specified HEX/RGB values.
-   Primitive and semantic tokens are defined.
-   Web and native consume one canonical token source.
-   Light and dark themes are supported.
-   Contrast is validated.
-   Components have documented variants and states.
-   Responsive rules are consistent.
-   No arbitrary hardcoded colors where tokens exist.
-   Accessibility requirements are documented.

# 35. Architecture Acceptance

-   Single GitHub monorepo.
-   Each app has its own folder and package configuration.
-   Each service has its own runtime boundary.
-   Each portal can build independently.
-   Each portal has an independent deployment target and domain.
-   Shared packages do not create app-to-app source dependencies.
-   Database migrations are centrally versioned.
-   API and event contracts are documented.
-   Frontend does not bypass backend business logic.
-   CI/CD detects affected applications.
-   Deployment of one portal does not require deployment of all portals.
-   Secrets are isolated per environment and service.

# 36. Service Definition of Done

Every service must include: - Purpose and ownership. - Entry point. -
Configuration schema. - Dependency declaration. - Health endpoint or
health check. - Logs and metrics. - Error handling. - Security policy. -
Deployment configuration. - README. - Operational runbook. - Relevant
tests and verification evidence.

------------------------------------------------------------------------

# BAGIAN XVI --- ENGINEERING GOVERNANCE

# 37. Mandatory Rules

1.  Master PRD controls product scope.
2.  Design System controls visual behavior.
3.  Token source controls design values.
4.  OpenAPI controls API contracts.
5.  Migrations control database evolution.
6.  Event contracts control async communication.
7.  FastAPI owns business logic and authorization.
8.  Supabase is the agreed primary data platform.
9.  All portal applications use shared design packages.
10. Each application deploys independently.
11. AI actions go through Tool Gateway.
12. No duplicate AI orchestration engines.
13. No client-side secrets.
14. No direct business database mutation from frontend.
15. No unauthorized GPS collection.
16. No invented business figures.
17. No feature-completion claim without evidence.
18. Shared package changes require consumer impact analysis.
19. Database schema changes require migration and compatibility review.
20. Every production service must be observable.

# 38. Required Repository Documentation

``` text
docs/
├── master-prd/
│   ├── master-prd.md
│   ├── product-scope.md
│   ├── user-personas.md
│   ├── user-roles.md
│   └── acceptance-criteria.md
├── design-system/
│   ├── principles.md
│   ├── color-system.md
│   ├── typography.md
│   ├── spacing.md
│   ├── components.md
│   ├── accessibility.md
│   └── responsive-guidelines.md
├── architecture/
│   ├── system-architecture.md
│   ├── monorepo-architecture.md
│   ├── service-boundaries.md
│   ├── deployment-architecture.md
│   ├── security-architecture.md
│   └── event-architecture.md
├── api/
│   ├── api-guidelines.md
│   ├── auth-contract.md
│   ├── error-contract.md
│   └── versioning.md
├── database/
│   ├── schema-map.md
│   ├── tenant-model.md
│   ├── rls-policy.md
│   └── migration-policy.md
└── deployment/
    ├── domain-mapping.md
    ├── vercel-projects.md
    ├── backend-services.md
    ├── environment-matrix.md
    └── release-policy.md
```

# 39. Architecture Decision Summary

  Layer                Decision
  -------------------- ----------------------------------------------
  Brand                SalesX-Ai
  Repository           Single GitHub Monorepo
  Web                  Next.js + React + TypeScript PWA
  Mobile               React Native Expo
  Backend              Python FastAPI
  Database             Supabase PostgreSQL
  Spatial              PostGIS
  Auth                 Supabase Auth
  Realtime             Supabase Realtime Broadcast
  Storage              Supabase Storage
  Vector               pgvector
  AI                   Unified AI Orchestrator
  Messaging            Telegram Bot API
  Video                Remotion
  Renderer             Separate Node.js worker
  Background jobs      Python workers
  Queue/cache          Redis or durable queue according to workload
  Web deployment       Independent Vercel projects
  Backend deployment   Independent container services
  Mobile release       Expo EAS
  CI/CD                GitHub Actions
  Workspace            pnpm + Turborepo

# FINAL ARCHITECTURE STATEMENT

SalesX-Ai menggunakan **Single GitHub Monorepo + Multiple Independently
Deployable Applications + Shared Design System + Unified FastAPI
Backend + Supabase Data Platform + Unified AI Intelligence**.

Satu repository menjadi pusat source code dan governance. Setiap portal,
mobile app, API, worker, dan renderer tetap memiliki folder serta
deployment boundary masing-masing. Masing-masing dapat menggunakan
domain, environment, resource allocation, dan release cycle sendiri.

Seluruh aplikasi tetap terhubung melalui API contracts, event contracts,
shared design tokens, identity, authorization, dan data platform yang
sama.

Dokumen ini adalah baseline Master PRD v1.0. Perubahan ruang lingkup,
schema, service boundary, token, atau deployment policy harus dicatat
melalui versioning dan Architecture Decision Records (ADR).
