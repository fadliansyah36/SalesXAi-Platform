'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Building2,
  GitBranch,
  Users,
  Database,
  BarChart3,
  Server,
  ShieldCheck,
  Globe,
  Flag,
  CreditCard,
  Plug,
  Cpu,
  Bot,
  Send,
  Activity,
  AlertTriangle,
  FileClock,
  HeartPulse,
  Settings,
  Search,
  Plus,
  ChevronRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  Menu as MenuIcon,
  Info,
  KeyRound,
  Webhook,
  Sliders,
  MapPin,
  TrendingUp,
  Terminal,
  HardDriveDownload,
  Download,
  Filter,
  Film,
} from 'lucide-react';
import type { PlatformRole, PlatformUserSummary } from '@salesx-ai/api-client';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTheme } from '@/components/providers/AppProviders';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { PortalShell, type PortalNavGroup } from '@/components/design-system/PortalShell';
import { KpiMetricCard } from '@/components/design-system/KpiMetricCard';
import { StatusTag } from '@/components/design-system/StatusTag';
import { PluginActivationModal } from '@/components/design-system/PluginActivationModal';
import { PortalAiCoachModal } from '@/components/design-system/PortalAiCoachModal';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import { INITIAL_NOTIFICATIONS, type NotificationItem, type Outlet } from '@/lib/salesx-data';
import {
  SUPER_ADMIN_PROFILE,
  TENANT_GROWTH_TREND,
  AI_TOKEN_USAGE_TREND,
  PLATFORM_TENANT_OUTLETS,
  INITIAL_MASTER_DATA,
  INITIAL_SERVICES_REGISTRY,
  INITIAL_DOMAINS,
  INITIAL_FEATURE_FLAGS,
  INITIAL_SUBSCRIPTION_PACKAGES,
  INITIAL_SUBSCRIBERS,
  INITIAL_INTEGRATIONS,
  INITIAL_WEBHOOKS,
  INITIAL_API_KEYS,
  INITIAL_AI_PROVIDERS,
  INITIAL_AI_MODELS,
  INITIAL_AI_ROUTING,
  INITIAL_AI_AGENTS,
  INITIAL_AI_SKILLS,
  INITIAL_TELEGRAM_BOTS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_SYSTEM_HEALTH_ITEMS,
  INITIAL_CONTENT_TEMPLATES,
  INITIAL_RUNBOOKS,
  INITIAL_BACKUPS,
  type PlatformTenant,
  type OrganizationNode,
  type PlatformUserRecord,
  type MasterDataCategory,
  type ServiceRegistryItem,
  type DomainRegistryItem,
  type FeatureFlagItem,
  type SubscriptionPackageItem,
  type TenantSubscriberRecord,
  type IntegrationRegistryItem,
  type WebhookEndpointItem,
  type PlatformApiKeyItem,
  type AiProviderItem,
  type AiAgentItem,
  type TelegramBotItem,
  type SecurityEventItem,
  type AuditLogItem,
  type ContentTemplateGovernanceItem,
} from '@/lib/salesx-super-admin-data';
import {
  SuperAdminOtpModal,
  AddTenantModal,
  TenantDetailModal,
  AddOrganizationModal,
  OrganizationNodeDetailModal,
  MasterDataCrudModal,
  ServiceDetailModal,
  AddDomainModal,
  DomainDetailModal,
  AddFeatureFlagModal,
  AddPackageModal,
  SubscriberDetailModal,
  AddIntegrationModal,
  AddWebhookModal,
  AddApiKeyModal,
  AddAiProviderModal,
  AddAgentSkillModal,
  AiAgentDetailModal,
  AddTelegramBotModal,
  TelegramBotDetailModal,
  SecurityEventDetailModal,
  AuditLogDetailModal,
  PlatformSettingsModal,
  RunbookBackupModal,
  SuperAdminNotificationsModal,
} from './SuperAdminModals';

export type SuperAdminTab =
  | 'dashboard'
  | 'tenants'
  | 'organizations'
  | 'users'
  | 'master_data'
  | 'analytics'
  | 'services'
  | 'roles'
  | 'domains'
  | 'feature_flags'
  | 'subscriptions'
  | 'integrations'
  | 'ai_providers'
  | 'agents'
  | 'telegram_bots'
  | 'usage_cost'
  | 'security_events'
  | 'audit_logs'
  | 'system_health'
  | 'more';

export function SuperAdminPortalApp() {
  const auth = useSalesXAuth();
  const { theme, toggleTheme } = useTheme();

  // Auth State
  const authenticated = auth.status === 'authenticated';
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('users');
  const [dashboardPeriod, setDashboardPeriod] = useState<
    'Bulan Ini' | 'Kuartal Ini' | 'Tahun Ini'
  >('Bulan Ini');

  // Core Domain State
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [orgNodes, setOrgNodes] = useState<OrganizationNode[]>([]);
  const [platformUsers,setPlatformUsers]=useState<PlatformUserRecord[]>([]);
  const [usersLoading,setUsersLoading]=useState(false);
  const [usersError,setUsersError]=useState<string|null>(null);
  const [userStatusBusyId,setUserStatusBusyId]=useState<string|null>(null);
  const [masterData, setMasterData] = useState<MasterDataCategory[]>(INITIAL_MASTER_DATA);
  const [services, setServices] = useState<ServiceRegistryItem[]>(
    INITIAL_SERVICES_REGISTRY
  );
  const [platformRoles,setPlatformRoles]=useState<PlatformRole[]>([]);
  const [rolesLoading,setRolesLoading]=useState(false);
  const [rolesError,setRolesError]=useState<string|null>(null);
  const [domains, setDomains] = useState<DomainRegistryItem[]>(INITIAL_DOMAINS);
  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlagItem[]>(INITIAL_FEATURE_FLAGS);
  const [packages, setPackages] = useState<SubscriptionPackageItem[]>(
    INITIAL_SUBSCRIPTION_PACKAGES
  );
  const [subscribers, setSubscribers] =
    useState<TenantSubscriberRecord[]>(INITIAL_SUBSCRIBERS);
  const [integrations, setIntegrations] =
    useState<IntegrationRegistryItem[]>(INITIAL_INTEGRATIONS);
  const [webhooks, setWebhooks] = useState<WebhookEndpointItem[]>(INITIAL_WEBHOOKS);
  const [apiKeys, setApiKeys] = useState<PlatformApiKeyItem[]>(INITIAL_API_KEYS);
  const [aiProviders, setAiProviders] =
    useState<AiProviderItem[]>(INITIAL_AI_PROVIDERS);
  const [aiAgents, setAiAgents] = useState<AiAgentItem[]>(INITIAL_AI_AGENTS);
  const [contentTemplates, setContentTemplates] = useState<
    ContentTemplateGovernanceItem[]
  >(INITIAL_CONTENT_TEMPLATES);
  const [telegramBots, setTelegramBots] =
    useState<TelegramBotItem[]>(INITIAL_TELEGRAM_BOTS);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>(
    INITIAL_SECURITY_EVENTS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading,setAuditLoading]=useState(false);
  const [auditError,setAuditError]=useState<string|null>(null);
  const [organizationsLoading,setOrganizationsLoading]=useState(false);
  const [organizationsError,setOrganizationsError]=useState<string|null>(null);
  const [organizationsRefreshKey,setOrganizationsRefreshKey]=useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );



  useEffect(()=>{
    if(activeTab!=="users")return;
    if(!auth.canPerformApiAction("platform.users.list")||!auth.apiClient){
      setPlatformUsers([]);
      setUsersError("Akses direktori pengguna platform tidak diizinkan.");
      return;
    }
    let active=true;
    setUsersLoading(true);
    setUsersError(null);
    void auth.apiClient.listPlatformUsers()
      .then((rows:PlatformUserSummary[])=>{
        if(!active)return;
        setPlatformUsers(rows.map(user=>({
          id:user.id,
          name:user.name,
          email:user.email,
          tenantId:user.tenant_id,
          tenantName:user.tenant_name||"Belum terhubung",
          role:user.role,
          status:user.status==="active"?"Aktif":user.status==="suspended"?"Suspended":user.status==="pending"?"Pending":"Deactivated",
          mfaEnabled:user.mfa_enabled,
          lastActive:user.last_active?new Date(user.last_active).toLocaleString("id-ID"):"Belum ada aktivitas",
        })));
      })
      .catch(error=>{if(active)setUsersError(error instanceof Error?error.message:"Direktori pengguna tidak dapat dimuat.");})
      .finally(()=>{if(active)setUsersLoading(false);});
    return()=>{active=false;};
  },[activeTab,auth.apiClient,auth.canPerformApiAction]);


  useEffect(() => {
    if (activeTab !== "tenants" && activeTab !== "organizations") return;
    if (!auth.canPerformApiAction("platform.organizations.list") || !auth.apiClient) {
      setTenants([]);
      setOrgNodes([]);
      setOrganizationsError("Akses manajemen tenant tidak diizinkan.");
      return;
    }
    let active = true;
    setOrganizationsLoading(true);
    setOrganizationsError(null);
    void auth.apiClient.listPlatformOrganizations()
      .then(async (rows) => {
        const mappedTenants: PlatformTenant[] = rows.map((org) => ({
          id: org.id,
          name: org.name,
          plan: "Belum dikonfigurasi",
          status: org.status === "active" ? "Aktif" : "Nonaktif",
          usersCount: org.member_count,
          monthlyOrders: 0,
          monthlyGmvM: 0,
          domain: "",
          picName: "",
          picEmail: "",
          city: "",
          lat: 0,
          lng: 0,
          renewalDate: "",
        }));
        const branchGroups = await Promise.all(rows.map(async (org) => ({
          org,
          branches: await auth.apiClient!.listOrganizationBranches(org.id),
        })));
        const mappedNodes: OrganizationNode[] = branchGroups.flatMap(({ org, branches }) => {
          if (branches.length === 0) return [{
            id: org.id, tenantId: org.id, name: org.name, nodeType: "Head Office" as const,
            city: "", managerName: "", usersCount: org.member_count,
            status: org.status === "active" ? "Aktif" as const : "Nonaktif" as const,
          }];
          return branches.map((branch) => ({
            id: String(branch.id), tenantId: org.id, name: String(branch.name ?? ""),
            nodeType: branch.branch_type === "head_office" ? "Head Office" as const
              : branch.branch_type === "warehouse" ? "Gudang Regional" as const : "Cabang" as const,
            city: typeof branch.city === "string" ? branch.city : "",
            managerName: typeof branch.manager_name === "string" ? branch.manager_name : "",
            usersCount: 0, status: branch.status === "active" ? "Aktif" as const : "Nonaktif" as const,
          }));
        });
        if (!active) return;
        setTenants(mappedTenants);
        setOrgNodes(mappedNodes);
        setSelectedOrgTenantId((current) => current || rows[0]?.id || "");
      })
      .catch((error: unknown) => {
        if (active) setOrganizationsError(error instanceof Error ? error.message : "Data tenant tidak dapat dimuat.");
      })
      .finally(() => { if (active) setOrganizationsLoading(false); });
    return () => { active = false; };
  }, [activeTab, auth.apiClient, auth.canPerformApiAction, organizationsRefreshKey]);

  // Filters & Sub-tabs
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>(
    'Semua'
  );
  const [tenantPlanFilter, setTenantPlanFilter] = useState<string>('Semua');
  const [selectedTenantOutlet, setSelectedTenantOutlet] = useState<Outlet>(
    PLATFORM_TENANT_OUTLETS[0]
  );

  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrgTenantId, setSelectedOrgTenantId] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('Semua');

  const [analyticsSubTab, setAnalyticsSubTab] = useState<
    'Platform' | 'Tenant' | 'User'
  >('Platform');
  const [domainSearch, setDomainSearch] = useState('');
  const [flagFilter, setFlagFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');
  const [subBillingTab, setSubBillingTab] = useState<'Paket' | 'Subscriber'>('Paket');
  const [integrationSubTab, setIntegrationSubTab] = useState<
    'Integrasi' | 'Webhook' | 'API'
  >('Integrasi');
  const [aiSubTab, setAiSubTab] = useState<'Provider' | 'Model' | 'Routing'>(
    'Provider'
  );
  const [agentSubTab, setAgentSubTab] = useState<'Agent' | 'Skill' | 'Library'>(
    'Agent'
  );
  const [botFilter, setBotFilter] = useState<'Semua' | 'Aktif' | 'Perusahaan'>('Semua');
  const [usageSubTab, setUsageSubTab] = useState<'Ringkasan' | 'Tenant' | 'Provider'>(
    'Ringkasan'
  );
  const [securityFilter, setSecurityFilter] = useState<
    'Semua' | 'Kritis' | 'Tinggi' | 'Terbuka'
  >('Semua');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditKindFilter, setAuditKindFilter] = useState<
    'Semua' | 'info' | 'warning' | 'success'
  >('Semua');

  // Modals & Toasts
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [selectedTenantDetail, setSelectedTenantDetail] =
    useState<PlatformTenant | null>(null);
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const [selectedOrgNode, setSelectedOrgNode] = useState<OrganizationNode | null>(
    null
  );
  const [activeMasterCategoryId, setActiveMasterCategoryId] = useState<string | null>(
    null
  );
  const [selectedService, setSelectedService] =
    useState<ServiceRegistryItem | null>(null);
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [selectedDomainDetail, setSelectedDomainDetail] =
    useState<DomainRegistryItem | null>(null);
  const [addFlagOpen, setAddFlagOpen] = useState(false);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<TenantSubscriberRecord | null>(null);
  const [addIntegrationOpen, setAddIntegrationOpen] = useState(false);
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [addApiKeyOpen, setAddApiKeyOpen] = useState(false);
  const [addAiProviderOpen, setAddAiProviderOpen] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [selectedAiAgent, setSelectedAiAgent] = useState<AiAgentItem | null>(null);
  const [addBotOpen, setAddBotOpen] = useState(false);
  const [selectedTelegramBot, setSelectedTelegramBot] =
    useState<TelegramBotItem | null>(null);
  const [selectedSecurityEvent, setSelectedSecurityEvent] =
    useState<SecurityEventItem | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [platformSettingsOpen, setPlatformSettingsOpen] = useState(false);
  const [runbookBackupOpen, setRunbookBackupOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pluginsModalOpen, setPluginsModalOpen] = useState(false);
  const [pluginDefaultTab, setPluginDefaultTab] = useState<
    'workspace' | 'maps' | 'ai' | 'telegram'
  >('workspace');
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const appendAudit = (
    action: string,
    moduleName: string,
    payloadSummary: string,
    kind: AuditLogItem['kind'] = 'info'
  ) => {
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        action,
        actorLabel: `Oleh: ${SUPER_ADMIN_PROFILE.name}`,
        timestamp: 'Baru saja',
        kind,
        module: moduleName,
        correlationId: `corr-${Math.floor(1000 + Math.random() * 8999)}`,
        payloadSummary,
      },
      ...prev,
    ]);
  };

  const activeMasterCategory = useMemo(
    () => masterData.find((c) => c.id === activeMasterCategoryId) || null,
    [masterData, activeMasterCategoryId]
  );

  const filteredTenants = useMemo(() => {
    const q = tenantSearch.toLowerCase();
    return tenants.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q);
      const matchFilter =
        tenantFilter === 'Semua'
          ? true
          : tenantFilter === 'Aktif'
          ? t.status === 'Aktif' || t.status === 'Trial'
          : t.status === 'Nonaktif';
      const matchPlan =
        tenantPlanFilter === 'Semua' || t.plan === tenantPlanFilter;
      return matchSearch && matchFilter && matchPlan;
    });
  }, [tenants, tenantSearch, tenantFilter, tenantPlanFilter]);

  const activeOrgTenant =
    tenants.find((t) => t.id === selectedOrgTenantId) || tenants[0];

  const filteredOrgNodes = useMemo(() => {
    const q = orgSearch.toLowerCase();
    return orgNodes.filter(
      (o) =>
        o.tenantId === selectedOrgTenantId &&
        (!q ||
          o.name.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.managerName.toLowerCase().includes(q))
    );
  }, [orgNodes, selectedOrgTenantId, orgSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return platformUsers.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.tenantName.toLowerCase().includes(q);
      const matchRole = userRoleFilter === 'Semua' || u.role.split(',').some(role=>role.trim()===userRoleFilter);
      return matchSearch && matchRole;
    });
  }, [platformUsers, userSearch, userRoleFilter]);

  const filteredDomains = useMemo(() => {
    const q = domainSearch.toLowerCase();
    return domains.filter(
      (d) =>
        !q ||
        d.domain.toLowerCase().includes(q) ||
        d.portalName.toLowerCase().includes(q)
    );
  }, [domains, domainSearch]);

  const filteredFlags = useMemo(() => {
    if (flagFilter === 'Semua') return featureFlags;
    if (flagFilter === 'Aktif') return featureFlags.filter((f) => f.enabled);
    return featureFlags.filter((f) => !f.enabled);
  }, [featureFlags, flagFilter]);

  const filteredBots = useMemo(() => {
    if (botFilter === 'Semua' || botFilter === 'Perusahaan') return telegramBots;
    return telegramBots.filter((b) => b.status === 'Aktif');
  }, [telegramBots, botFilter]);

  const filteredSecurityEvents = useMemo(() => {
    if (securityFilter === 'Semua') return securityEvents;
    if (securityFilter === 'Terbuka') {
      return securityEvents.filter((ev) => ev.status !== 'Selesai');
    }
    return securityEvents.filter((ev) => ev.severity === securityFilter);
  }, [securityEvents, securityFilter]);

  const filteredAudits = useMemo(() => {
    const q = auditSearch.toLowerCase();
    return auditLogs.filter((a) => {
      const matchSearch =
        !q ||
        a.action.toLowerCase().includes(q) ||
        a.actorLabel.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q);
      const matchKind = auditKindFilter === 'Semua' || a.kind === auditKindFilter;
      return matchSearch && matchKind;
    });
  }, [auditLogs, auditSearch, auditKindFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(()=>{
    if(activeTab!=="audit_logs")return;
    if(!auth.canPerformApiAction("platform.audit.read")||!auth.apiClient){
      setAuditLogs([]);setAuditError("Akses audit platform tidak diizinkan.");return;
    }
    let active=true;
    setAuditLoading(true);setAuditError(null);
    void auth.apiClient.listPlatformAuditLogs({limit:100})
      .then(rows=>{
        if(!active)return;
        setAuditLogs(rows.map(log=>{
          const metadata=log.metadata??{};
          const outcome=typeof metadata.outcome==="string"?metadata.outcome:"";
          const kind:AuditLogItem["kind"]=outcome==="denied"||log.action.includes("failed")?"warning":
            log.action.includes("applied")||log.action.includes("accepted")?"success":"info";
          return {
            id:log.id,action:log.action,actorLabel:log.actor_label,
            timestamp:new Date(log.occurred_at).toLocaleString("id-ID"),
            kind,module:log.resource_type,correlationId:log.correlation_id??"",
            payloadSummary:JSON.stringify(metadata),
          };
        }));
      })
      .catch(error=>{if(active){setAuditLogs([]);setAuditError(error instanceof Error?error.message:"Audit log platform tidak dapat dimuat.");}})
      .finally(()=>{if(active)setAuditLoading(false);});
    return()=>{active=false;};
  },[activeTab,auth.apiClient,auth.canPerformApiAction]);


  useEffect(()=>{
    if(activeTab!=="roles"&&!(activeTab==="analytics"&&analyticsSubTab==="User"))return;
    if(!auth.canPerformApiAction("platform.roles.list")||!auth.apiClient){
      setPlatformRoles([]);
      setRolesError("Akses katalog role platform tidak diizinkan.");
      return;
    }
    let active=true;
    setRolesLoading(true);
    setRolesError(null);
    void auth.apiClient.listPlatformRoles()
      .then(rows=>{if(active)setPlatformRoles(rows);})
      .catch(error=>{if(active)setRolesError(error instanceof Error?error.message:"Katalog role tidak dapat dimuat.");})
      .finally(()=>{if(active)setRolesLoading(false);});
    return()=>{active=false;};
  },[activeTab,analyticsSubTab,auth.apiClient,auth.canPerformApiAction]);

  const navGroups: PortalNavGroup<SuperAdminTab>[] = [
    {
      group: 'Overview & Tenant',
      items: [
        { id: 'dashboard', label: 'Global Dashboard', icon: Home },
        { id: 'tenants', label: 'Manajemen Tenant', icon: Building2 },
        { id: 'organizations', label: 'Organisasi', icon: GitBranch },
        { id: 'users', label: 'User Administration', icon: Users },
        { id: 'analytics', label: 'Analitik & Performa', icon: BarChart3 },
      ],
    },
    {
      group: 'Data & Akses',
      items: [
        { id: 'master_data', label: 'Master Data (CRUD)', icon: Database },
        { id: 'roles', label: 'Role & Permission', icon: ShieldCheck },
        { id: 'domains', label: 'Domain Registry', icon: Globe },
        { id: 'feature_flags', label: 'Feature Flags', icon: Flag },
      ],
    },
    {
      group: 'Sistem & Billing',
      items: [
        { id: 'services', label: 'Service Registry', icon: Server },
        { id: 'subscriptions', label: 'Subscription & Package', icon: CreditCard },
        { id: 'integrations', label: 'Integration Registry', icon: Plug },
      ],
    },
    {
      group: 'AI & Bot Governance',
      items: [
        { id: 'ai_providers', label: 'AI Provider & Model', icon: Cpu },
        { id: 'agents', label: 'Agent & Skill', icon: Bot },
        { id: 'telegram_bots', label: 'Telegram Bot', icon: Send },
        { id: 'usage_cost', label: 'Usage & Cost Monitoring', icon: Activity },
      ],
    },
    {
      group: 'Audit & Kesehatan',
      items: [
        { id: 'security_events', label: 'Security Events', icon: AlertTriangle },
        { id: 'audit_logs', label: 'Audit Logs', icon: FileClock },
        { id: 'system_health', label: 'System Health & Settings', icon: HeartPulse },
      ],
    },
  ];

  const hasAdminNavigationPermission=(id:SuperAdminTab):boolean=>{
    if(id==="tenants" || id==="organizations")return auth.canPerformApiAction("platform.organizations.list");
    if(id==="users")return auth.canPerformApiAction("platform.users.list");
    if(id==="roles")return auth.canPerformApiAction("platform.roles.list");
    if(id==="audit_logs")return auth.canPerformApiAction("platform.audit.read");
    // Other Super Admin modules are owned by later phases and remain closed until
    // their real API/action contracts are implemented.
    return false;
  };
  const authorizedNavGroups=navGroups.map(group=>({
    ...group,
    items:group.items.filter(item=>hasAdminNavigationPermission(item.id)),
  })).filter(group=>group.items.length>0);

  const firstAvailableAdminTab:SuperAdminTab|null=auth.canPerformApiAction("platform.organizations.list")?"tenants":
    auth.canPerformApiAction("platform.users.list")?"users":
    auth.canPerformApiAction("platform.roles.list")?"roles":
    auth.canPerformApiAction("platform.audit.read")?"audit_logs":null;
  const activeTabAllowed=hasAdminNavigationPermission(activeTab);
  useEffect(()=>{
    if(!activeTabAllowed&&firstAvailableAdminTab)setActiveTab(firstAvailableAdminTab);
  },[activeTab,activeTabAllowed,firstAvailableAdminTab]);

  const bottomNavItems = [
    { id: 'users' as SuperAdminTab, label: 'Pengguna', icon: Users },
    { id: 'roles' as SuperAdminTab, label: 'Role', icon: ShieldCheck },
    { id: 'audit_logs' as SuperAdminTab, label: 'Audit', icon: FileClock },
  ].filter(item=>hasAdminNavigationPermission(item.id));

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setAuthNotice(null);
    try { await auth.signInWithOAuth('google'); }
    catch (err) { setAuthNotice(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.'); setOauthBusy(false); }
  };

  /* -------------------- SCREEN 1: LOGIN / MASUK -------------------- */
  if (authenticated && !auth.canAccessPortal('super_admin')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Role aktif tidak memiliki permission untuk portal ini.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FAFC] via-[#E5F4F8] to-white dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[#194F70] dark:text-[#87CEEB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
            <Link href="/distributor" className="text-[#348CB2] hover:underline">
              Distributor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/principal" className="text-[#348CB2] hover:underline">
              Principal
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/supervisor" className="text-[#348CB2] hover:underline">
              Supervisor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/company" className="text-[#348CB2] hover:underline">
              Company
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/portal" className="text-[#348CB2] hover:underline">
              Sales
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/customer" className="text-[#348CB2] hover:underline">
              Customer
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
              aria-label="Ganti tema"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md my-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <BrandLogo subtitle="SUPER ADMIN PORTAL" />
            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
              Pusat Kendali Platform SalesX-Ai
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Governance multi-tenant, RBAC, AI Orchestrator, billing, & audit platform.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginEmail.trim() || !loginPassword.trim()) {
                setAuthNotice('Mohon isi Email / Username dan Password Super Admin.');
                return;
              }
              setAuthNotice(null);
              void auth.signInWithPassword(loginEmail, loginPassword)
                .then(() => setAuthNotice(null))
                .catch(err => setAuthNotice(err instanceof Error ? err.message : 'Login gagal.'));
            }}
            className="mt-6 space-y-3.5 text-sm"
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email / Username"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-4 py-3 text-xs sm:text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-10 py-3 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 text-[var(--color-text-muted)] cursor-pointer"
                aria-label="Lihat atau sembunyikan password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#348CB2]"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => { void auth.requestPasswordReset(loginEmail).then(() => setAuthNotice('Instruksi reset dikirim jika email terdaftar.')).catch(err => setAuthNotice(err instanceof Error ? err.message : 'Reset password gagal.')); }}
                className="font-semibold text-[#348CB2] hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            {authNotice && (
              <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3 text-xs text-[#194F70] dark:text-[#87CEEB]">
                {authNotice}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#194F70] hover:bg-[#123A54] py-3 text-sm font-bold text-white cursor-pointer"
            >
              Masuk
            </button>

            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span>atau</span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <button
              type="button"
              onClick={() => setOtpModalOpen(true)}
              className="w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Masuk dengan Kode OTP
            </button>

            <button
              type="button"
              disabled={oauthBusy}
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Mail className="h-4 w-4 text-[#348CB2]" />
              <span>
                {oauthBusy ? 'Menghubungkan...' : 'Masuk dengan Google Workspace'}
              </span>
            </button>
          
            <PortalSignupAction email={loginEmail} password={loginPassword} onMessage={setAuthNotice} />
</form>

          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 flex items-center gap-3 text-xs">
            <ShieldCheck className="h-5 w-5 text-[#194F70] dark:text-[#87CEEB] shrink-0" />
            <div>
              <p className="font-bold text-[#123A54] dark:text-white">
                Akses khusus Super Admin
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Platform SalesX-Ai · Dilindungi MFA & Audit Trail
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          © 2026 SalesX-Ai · admin.salesx-ai.com
        </p>

        <SuperAdminOtpModal
          open={otpModalOpen}
          onClose={() => setOtpModalOpen(false)}
          onSuccess={() => setAuthNotice('Nomor telepon berhasil diverifikasi melalui Supabase Auth.')}
        />
      </div>
    );
  }

  return (
    <PortalShell<SuperAdminTab>
      portalSubtitle="SUPER ADMIN PORTAL"
      entityName="Halo, Super Admin"
      entityBadge="Platform Governance"
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={authorizedNavGroups}
      bottomNavItems={bottomNavItems}
      unreadNotificationsCount={unreadCount}
      onOpenNotifications={() => setNotificationsOpen(true)}
      onOpenPlugins={() => {
        setPluginDefaultTab('workspace');
        setPluginsModalOpen(true);
      }}
      onOpenAiAssistant={() => setAiCoachOpen(true)}
      aiAssistantLabel="AI Platform Coach"
      onRequestLogout={() => void auth.signOut('local')}
      currentPortalPath="/super-admin"
    >
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] dark:bg-[#064E3B]/50 px-4 py-2.5 text-xs font-semibold text-[#047857] dark:text-[#34D399] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* -------------------- SCREEN 2: GLOBAL DASHBOARD -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                Halo, Super Admin
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Platform Overview · Pusat Kendali Multi-Tenant SalesX-Ai
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Periode:
              </span>
              <select
                value={dashboardPeriod}
                onChange={(e) =>
                  setDashboardPeriod(
                    e.target.value as 'Bulan Ini' | 'Kuartal Ini' | 'Tahun Ini'
                  )
                }
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
              >
                <option value="Bulan Ini">Bulan Ini</option>
                <option value="Kuartal Ini">Kuartal Ini</option>
                <option value="Tahun Ini">Tahun Ini</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="Total Tenant"
              value={`${tenants.length + 122}`}
              trend="+12,3%"
              trendTone="positive"
              icon={<Building2 className="h-5 w-5" />}
              onClick={() => setActiveTab('tenants')}
            />
            <KpiMetricCard
              label="Total User"
              value={
                dashboardPeriod === 'Bulan Ini'
                  ? '12.540'
                  : dashboardPeriod === 'Kuartal Ini'
                  ? '12.980'
                  : '14.210'
              }
              trend="+18,7%"
              trendTone="positive"
              icon={<Users className="h-5 w-5" />}
              onClick={() => setActiveTab('users')}
            />
            <KpiMetricCard
              label="Order Platform"
              value={
                dashboardPeriod === 'Bulan Ini'
                  ? '186.432'
                  : dashboardPeriod === 'Kuartal Ini'
                  ? '542.810'
                  : '1.894.120'
              }
              trend="+22,1%"
              trendTone="positive"
              accentBgClass="bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857]"
              icon={<TrendingUp className="h-5 w-5" />}
              onClick={() => setActiveTab('analytics')}
            />
            <KpiMetricCard
              label="Nilai Transaksi"
              value={
                dashboardPeriod === 'Bulan Ini'
                  ? 'Rp 42,58 M'
                  : dashboardPeriod === 'Kuartal Ini'
                  ? 'Rp 128,4 M'
                  : 'Rp 486,2 M'
              }
              trend="+20,4%"
              trendTone="positive"
              accentBgClass="bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#B45309]"
              icon={<CreditCard className="h-5 w-5" />}
              onClick={() => setActiveTab('subscriptions')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Pertumbuhan Tenant Bar Chart */}
            <div className="lg:col-span-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
                    Pertumbuhan Tenant
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Onboarding tenant aktif per bulan (Jan–Jun)
                  </p>
                </div>
                <span className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-2.5 py-1 text-[11px] font-bold text-[#194F70] dark:text-[#87CEEB] tabular-nums">
                  +39 Tenant Baru
                </span>
              </div>

              <div className="h-44 flex items-end gap-3 pt-4 border-b border-[var(--color-border)] pb-2">
                {TENANT_GROWTH_TREND.map((item) => {
                  const pct = Math.round((item.tenants / 42) * 100);
                  return (
                    <div
                      key={item.month}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <span className="text-[11px] font-bold font-mono tabular-nums text-[#194F70] dark:text-[#87CEEB]">
                        +{item.tenants}
                      </span>
                      <div
                        className="w-full max-w-[44px] rounded-t-xl bg-gradient-to-t from-[#194F70] via-[#348CB2] to-[#87CEEB] transition-all"
                        style={{ height: `${Math.max(16, pct)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between pt-2 text-[11px] font-semibold text-[var(--color-text-muted)]">
                {TENANT_GROWTH_TREND.map((item) => (
                  <span key={item.month} className="flex-1 text-center">
                    {item.month}
                  </span>
                ))}
              </div>
            </div>

            {/* Peta Hub Tenant Nasional (Google Maps Platform) */}
            <div className="lg:col-span-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#348CB2]" />
                    <span>Distribusi Hub Tenant Nasional</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Google Maps Platform · Klik marker untuk detail tenant
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPluginDefaultTab('maps');
                    setPluginsModalOpen(true);
                  }}
                  className="rounded-lg border border-[#348CB2]/40 bg-[#F3FAFC] dark:bg-[#172438] px-2.5 py-1 text-[11px] font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                >
                  Konfigurasi Maps
                </button>
              </div>
              <SalesGoogleMap
                currentPos={{ lat: -6.597147, lng: 106.806039 }}
                currentPosLabel="Hub Utama PT Maju Distribusi"
                outlets={PLATFORM_TENANT_OUTLETS}
                selectedOutlet={selectedTenantOutlet}
                onSelectOutlet={setSelectedTenantOutlet}
                showRouteToSelected={false}
                heightClass="h-[220px]"
              />
            </div>
          </div>

          {/* Quick Governance & Plugin Shortcuts */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
              Akses Cepat Kendali Platform & Plugin Ekosistem
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { id: 'tenants' as SuperAdminTab, label: 'Manajemen Tenant', icon: Building2 },
                { id: 'master_data' as SuperAdminTab, label: 'Master Data', icon: Database },
                { id: 'feature_flags' as SuperAdminTab, label: 'Feature Flags', icon: Flag },
                { id: 'ai_providers' as SuperAdminTab, label: 'AI & Model', icon: Cpu },
                { id: 'telegram_bots' as SuperAdminTab, label: 'Telegram Bot', icon: Send },
                { id: 'system_health' as SuperAdminTab, label: 'System Health', icon: HeartPulse },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActiveTab(card.id)}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-[#348CB2] mb-1.5" />
                    <p className="text-xs font-bold text-[#123A54] dark:text-white">
                      {card.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 3: MANAJEMEN TENANT -------------------- */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:flex-1 sm:min-w-[240px]">
              <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
                <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  placeholder="Cari tenant..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-xs sm:text-sm"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2">
                <Filter className="h-3.5 w-3.5 text-[#348CB2]" />
                <select
                  value={tenantPlanFilter}
                  onChange={(e) => setTenantPlanFilter(e.target.value)}
                  aria-label="Filter paket tenant"
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Paket</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Pro">Pro</option>
                  <option value="Basic">Basic</option>
                  <option value="Trial">Trial</option>
                  <option value="Belum dikonfigurasi">Belum dikonfigurasi</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAddTenantOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tenant</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'Semua', label: `Semua (${tenants.length + 122})` },
                {
                  key: 'Aktif',
                  label: `Aktif (${tenants.filter((t) => t.status !== 'Nonaktif').length + 115})`,
                },
                {
                  key: 'Nonaktif',
                  label: `Nonaktif (${tenants.filter((t) => t.status === 'Nonaktif').length + 7})`,
                },
              ] as const
            ).map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setTenantFilter(pill.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                  tenantFilter === pill.key
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredTenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => setSelectedTenantDetail(tenant)}
                className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB] shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white truncate">
                      {tenant.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span className="font-mono font-semibold">{tenant.id}</span>
                      <span>·</span>
                      <span>Paket {tenant.plan}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        {tenant.usersCount.toLocaleString('id-ID')} user
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusTag label={tenant.status} showIcon />
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 4: ORGANISASI / ORG MGMT -------------------- */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:flex-1">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Cari organisasi..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-xs sm:text-sm"
                />
              </div>
              <select
                value={selectedOrgTenantId}
                onChange={(e) => setSelectedOrgTenantId(e.target.value)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setAddOrgOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Organisasi</span>
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            {/* Root Tenant Header */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#348CB2]/40 bg-[#F3FAFC] dark:bg-[#172438] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#194F70] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#123A54] dark:text-white">
                    {activeOrgTenant.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">
                    {activeOrgTenant.id} · {activeOrgTenant.city}
                  </p>
                </div>
              </div>
              <StatusTag label={activeOrgTenant.status} />
            </div>

            {/* Hierarchy Branches with connector lines */}
            <div className="pl-5 sm:pl-7 border-l-2 border-[#ADD8E6] dark:border-[#348CB2]/40 space-y-2.5 ml-4">
              {filteredOrgNodes.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-3">
                  Belum ada cabang untuk tenant ini. Klik &ldquo;+ Tambah Organisasi&rdquo; untuk menambahkan unit baru.
                </p>
              ) : (
                filteredOrgNodes.map((node) => (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedOrgNode(node)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedOrgNode(node);
                      }
                    }}
                    className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 hover:border-[#348CB2] transition-colors cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -left-5 sm:-left-7 top-1/2 h-0.5 w-4 sm:w-6 bg-[#ADD8E6] dark:bg-[#348CB2]/40"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#123A54] dark:text-white">
                          {node.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {node.nodeType} · {node.city} · PIC: {node.managerName} ·{' '}
                          <span className="tabular-nums">{node.usersCount} user</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrgNodes((prev) =>
                            prev.map((o) =>
                              o.id === node.id
                                ? {
                                    ...o,
                                    status: o.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                                  }
                                : o
                            )
                          );
                          showToast(`Status ${node.name} diperbarui.`);
                        }}
                        className="cursor-pointer"
                      >
                        <StatusTag label={node.status} />
                      </button>
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 5: USER ADMINISTRATION -------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:flex-1">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, email, atau tenant..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-xs sm:text-sm"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold"
              >
                <option value="Semua">Semua Role</option>
                {Array.from(new Set(platformUsers.flatMap(user=>user.role.split(",").map(role=>role.trim()).filter(Boolean)))).sort().map(role=><option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <Link href="/portal/access" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-[#194F70] dark:text-[#87CEEB]">
              <Users className="h-4 w-4" />
              <span>Kelola undangan organisasi</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {usersLoading&&<p className="text-xs text-[var(--color-text-muted)]">Memuat direktori pengguna…</p>}
            {usersError&&<p role="alert" className="text-xs text-red-600">{usersError}</p>}
            {!usersLoading&&!usersError&&filteredUsers.length===0&&<p className="text-xs text-[var(--color-text-muted)]">Tidak ada pengguna yang cocok dengan filter.</p>}
            {filteredUsers.map((usr) => (
              <div
                key={usr.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#194F70] text-xs font-bold text-white shrink-0">
                    {usr.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white truncate">
                      {usr.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {usr.email} · {usr.tenantName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-md bg-[#E5F4F8] dark:bg-[#19394B] px-2 py-0.5 font-mono font-bold text-[#194F70] dark:text-[#87CEEB]">
                        {usr.role}
                      </span>
                      <span className="text-[var(--color-text-muted)]">
                        MFA: {usr.mfaEnabled ? 'Aktif' : 'Belum Aktif'} ·{' '}
                        {usr.lastActive}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {auth.canPerformApiAction("platform.users.status")?<button
                    type="button"
                    disabled={userStatusBusyId===usr.id}
                    onClick={()=>{
                      if(!auth.canPerformApiAction("platform.users.status"))return;
                      const api=auth.apiClient;
                      if(!api)return;
                      const nextStatus=usr.status==="Aktif"?"suspended":"active";
                      setUserStatusBusyId(usr.id);
                      void api.updateAccountStatus(usr.id,{status:nextStatus})
                        .then(result=>{
                          const label=result.status==="active"?"Aktif":result.status==="suspended"?"Suspended":result.status==="pending"?"Pending":"Deactivated";
                          setPlatformUsers(previous=>previous.map(user=>user.id===usr.id?{...user,status:label}:user));
                          showToast(`Status akun ${usr.name}: ${label}`);
                        })
                        .catch(error=>showToast(error instanceof Error?error.message:"Status akun gagal diperbarui."))
                        .finally(()=>setUserStatusBusyId(null));
                    }}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    <StatusTag label={userStatusBusyId===usr.id?"Memproses…":usr.status} />
                  </button>:<StatusTag label={usr.status} />}
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 6: MASTER DATA (CRUD) -------------------- */}
      {activeTab === 'master_data' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#123A54] dark:text-white">
                Master Data Platform Terpusat (CRUD)
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Klik salah satu kategori di bawah untuk menambah, mengubah, mengaktifkan, atau menghapus entri referensi global.
              </p>
            </div>
            <span className="rounded-lg bg-[#194F70] px-3 py-1 text-[11px] font-bold text-white tabular-nums">
              8 Domain Referensi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {masterData.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveMasterCategoryId(cat.id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB] shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white">
                      {cat.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-[#348CB2] tabular-nums">
                    {cat.recordsCount.toLocaleString('id-ID')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 7: ANALITIK & PERFORMA -------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(['Platform', 'Tenant', 'User'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAnalyticsSubTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                  analyticsSubTab === tab
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="MAU"
              value={analyticsSubTab === 'User' ? '14.820' : '18.540'}
              trend="+15,4%"
              trendTone="positive"
              icon={<Users className="h-5 w-5" />}
            />
            <KpiMetricCard
              label="Order"
              value="186.432"
              trend="+22,1%"
              trendTone="positive"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KpiMetricCard
              label="GMV"
              value="Rp 42,58 M"
              trend="+20,4%"
              trendTone="positive"
              icon={<CreditCard className="h-5 w-5" />}
            />
            <KpiMetricCard
              label="ARPU"
              value="Rp 227 rb"
              trend="+9,8%"
              trendTone="positive"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
                {analyticsSubTab === 'User'
                  ? 'Aktivitas Pengguna per Peran Ekosistem'
                  : 'Performance Tenant (Top 5)'}
              </h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                Nilai Transaksi Bulanan
              </span>
            </div>

            {analyticsSubTab === 'User' ? (
              <div className="space-y-2.5">
                {platformRoles.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#123A54] dark:text-white">
                        {r.name}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        {r.key}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#348CB2] tabular-nums">
                      {r.assigned_users.toLocaleString('id-ID')} assignment aktif
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...tenants]
                  .sort((a, b) => b.monthlyGmvM - a.monthlyGmvM)
                  .slice(0, 5)
                  .map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTenantDetail(t)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left text-xs sm:text-sm hover:border-[#348CB2] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums shrink-0 ${
                            idx === 0
                              ? 'bg-[#F59E0B] text-white'
                              : idx === 1
                              ? 'bg-[#94A3B8] text-white'
                              : idx === 2
                              ? 'bg-[#D97706] text-white'
                              : 'bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#123A54] dark:text-white truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                            {t.monthlyOrders.toLocaleString('id-ID')} order · Paket{' '}
                            {t.plan}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-[#194F70] dark:text-[#87CEEB] tabular-nums">
                          Rp {t.monthlyGmvM.toFixed(2).replace('.', ',')} M
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 8: SERVICE REGISTRY -------------------- */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedService(svc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedService(svc);
                }
              }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB] shrink-0">
                  <Server className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#123A54] dark:text-white">
                    {svc.name}{' '}
                    <span className="ml-1.5 text-xs font-mono font-semibold text-[#348CB2]">
                      {svc.version}
                    </span>
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {svc.runtime} ·{' '}
                    <span className="font-mono">{svc.endpoint}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs tabular-nums">
                  <p className="font-bold text-[#047857] dark:text-[#34D399]">
                    {svc.uptimePct}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {svc.latencyMs} ms
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setServices((prev) =>
                      prev.map((s) =>
                        s.id === svc.id
                          ? {
                              ...s,
                              status: s.status === 'Aktif' ? 'Degraded' : 'Aktif',
                            }
                          : s
                      )
                    );
                    showToast(`Health check ${svc.name} diperbarui.`);
                  }}
                  className="cursor-pointer"
                >
                  <StatusTag label={svc.status} showIcon />
                </button>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------- SCREEN 9: ROLE & PERMISSION GOVERNANCE -------------------- */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4">
            <h2 className="text-sm font-bold text-[#123A54] dark:text-white">
              Katalog RBAC dari Supabase
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Role, scope, hierarchy, jumlah assignment dan permission ditampilkan langsung dari FastAPI. Perubahan kebijakan role dilakukan melalui migration yang terkontrol, bukan state lokal browser.
            </p>
          </div>
          {rolesLoading&&<p className="text-xs text-[var(--color-text-muted)]">Memuat katalog role…</p>}
          {rolesError&&<p role="alert" className="text-xs text-red-600">{rolesError}</p>}
          {!rolesLoading&&!rolesError&&platformRoles.length===0&&<p className="text-xs text-[var(--color-text-muted)]">Belum ada role yang dapat ditampilkan.</p>}
          <div className="space-y-3">
            {platformRoles.map(role=>(
              <section key={role.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#123A54] dark:text-white">{role.name}</h3>
                    <p className="font-mono text-[11px] text-[var(--color-text-muted)]">{role.key} · {role.scope_type} · hierarchy {role.hierarchy_level}</p>
                  </div>
                  <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px]">{role.assigned_users.toLocaleString("id-ID")} assignment</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {role.permissions.map(permission=><span key={permission} className="rounded-md bg-[var(--color-background)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-secondary)]">{permission}</span>)}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 10: DOMAIN REGISTRY -------------------- */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                placeholder="Cari domain..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddDomainOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Domain</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredDomains.map((dom) => (
              <button
                key={dom.id}
                type="button"
                onClick={() => setSelectedDomainDetail(dom)}
                className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-[#123A54] dark:text-white truncate">
                      {dom.domain}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {dom.portalName} ·{' '}
                      <span className="font-mono text-[#348CB2]">
                        {dom.internalRoute}
                      </span>{' '}
                      · {dom.sslStatus}
                    </p>
                  </div>
                </div>
                <StatusTag label={dom.status} showIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 11: FEATURE FLAGS -------------------- */}
      {activeTab === 'feature_flags' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['Semua', 'Aktif', 'Nonaktif'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFlagFilter(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                    flagFilter === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddFlagOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Feature Flag</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB] shrink-0">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-[#123A54] dark:text-white truncate">
                      {flag.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {flag.description} · Scope: {flag.rolloutScope}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flag.enabled}
                  onClick={() => {
                    const nextVal = !flag.enabled;
                    setFeatureFlags((prev) =>
                      prev.map((f) =>
                        f.id === flag.id ? { ...f, enabled: nextVal } : f
                      )
                    );
                    appendAudit(
                      nextVal ? 'Aktifkan Feature Flag' : 'Nonaktifkan Feature Flag',
                      'Feature Flags',
                      `Flag ${flag.key} diubah menjadi ${nextVal ? 'Aktif' : 'Nonaktif'}.`,
                      'success'
                    );
                    showToast(
                      `Feature flag ${flag.key}: ${nextVal ? 'Aktif' : 'Nonaktif'}`
                    );
                  }}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    flag.enabled ? 'bg-[#194F70]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 12: SUBSCRIPTION & PACKAGE -------------------- */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['Paket', 'Subscriber'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSubBillingTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                    subBillingTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddPackageOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Paket</span>
            </button>
          </div>

          {subBillingTab === 'Paket' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                        {pkg.name}
                      </h3>
                      <StatusTag label={pkg.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {pkg.tagline}
                    </p>
                    <p className="mt-3 text-lg font-bold font-mono text-[#194F70] dark:text-[#87CEEB] tabular-nums">
                      {pkg.priceLabel}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                      <li>
                        Maks.{' '}
                        <strong className="tabular-nums">
                          {pkg.maxUsers.toLocaleString('id-ID')}
                        </strong>{' '}
                        pengguna
                      </li>
                      {pkg.features.map((ft) => (
                        <li key={ft} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#047857] shrink-0" />
                          <span>{ft}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPackages((prev) =>
                        prev.map((p) =>
                          p.id === pkg.id
                            ? {
                                ...p,
                                status: p.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                              }
                            : p
                        )
                      );
                      showToast(`Status paket ${pkg.name} diperbarui.`);
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] py-2 text-xs font-bold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  >
                    {pkg.status === 'Aktif' ? 'Nonaktifkan Paket' : 'Aktifkan Paket'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {subscribers.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubscriber(sub)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left text-xs sm:text-sm hover:border-[#348CB2] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-[#123A54] dark:text-white">
                      {sub.tenantName}{' '}
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        ({sub.tenantId})
                      </span>
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Paket {sub.packageName} · {sub.billingCycle} · Tagihan
                      berikutnya {sub.nextBillingDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold tabular-nums text-[#194F70] dark:text-[#87CEEB]">
                      {sub.amountLabel}
                    </span>
                    <StatusTag label={sub.status} />
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 13: INTEGRATION REGISTRY -------------------- */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['Integrasi', 'Webhook', 'API'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setIntegrationSubTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                    integrationSubTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (integrationSubTab === 'Integrasi') setAddIntegrationOpen(true);
                else if (integrationSubTab === 'Webhook') setAddWebhookOpen(true);
                else setAddApiKeyOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>
                {integrationSubTab === 'Integrasi'
                  ? 'Tambah Integrasi'
                  : integrationSubTab === 'Webhook'
                  ? 'Tambah Webhook'
                  : 'Buat API Key'}
              </span>
            </button>
          </div>

          {integrationSubTab === 'Integrasi' && (
            <div className="space-y-2.5">
              {integrations.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB] shrink-0">
                      <Plug className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#123A54] dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {item.description} · Latensi: {item.latencyLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.pluginShortcut && (
                      <button
                        type="button"
                        onClick={() => {
                          setPluginDefaultTab(item.pluginShortcut!);
                          setPluginsModalOpen(true);
                        }}
                        className="rounded-lg border border-[#348CB2] px-2.5 py-1 text-[11px] font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                      >
                        Aktifkan / Uji Plugin
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIntegrations((prev) =>
                          prev.map((x) =>
                            x.id === item.id
                              ? {
                                  ...x,
                                  status: x.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                                }
                              : x
                          )
                        );
                        showToast(`Konektor ${item.name} diperbarui.`);
                      }}
                      className="cursor-pointer"
                    >
                      <StatusTag label={item.status} showIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {integrationSubTab === 'Webhook' && (
            <div className="space-y-2.5">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-mono font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
                      <Webhook className="h-4 w-4 text-[#348CB2]" />
                      <span>{wh.url}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus: WebhookEndpointItem['status'] =
                          wh.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
                        setWebhooks((prev) =>
                          prev.map((w) =>
                            w.id === wh.id ? { ...w, status: nextStatus } : w
                          )
                        );
                        showToast(`Status webhook diperbarui: ${nextStatus}`);
                      }}
                      className="cursor-pointer"
                    >
                      <StatusTag label={wh.status} />
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Events: <span className="font-mono">{wh.events.join(', ')}</span> ·
                    Success: <strong className="tabular-nums">{wh.successRate}</strong> ·{' '}
                    {wh.lastDelivery}
                  </p>
                </div>
              ))}
            </div>
          )}

          {integrationSubTab === 'API' && (
            <div className="space-y-2.5">
              {apiKeys.map((api) => (
                <div
                  key={api.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-[#348CB2]" />
                      <span>{api.label}</span>
                    </p>
                    <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                      {api.prefix} · {api.scope} · {api.rateLimit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus =
                        api.status === 'Aktif' ? 'Dicabut' : 'Aktif';
                      setApiKeys((prev) =>
                        prev.map((k) =>
                          k.id === api.id ? { ...k, status: nextStatus } : k
                        )
                      );
                      appendAudit(
                        nextStatus === 'Dicabut' ? 'Cabut API Key' : 'Aktifkan API Key',
                        'Integration Registry',
                        `API Key ${api.label} diubah menjadi ${nextStatus}.`
                      );
                      showToast(`API Key ${api.label}: ${nextStatus}`);
                    }}
                    className="cursor-pointer"
                  >
                    <StatusTag label={api.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 14: AI PROVIDER & MODEL -------------------- */}
      {activeTab === 'ai_providers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['Provider', 'Model', 'Routing'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAiSubTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                    aiSubTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddAiProviderOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Provider</span>
            </button>
          </div>

          {aiSubTab === 'Provider' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {aiProviders.map((prov) => (
                  <div
                    key={prov.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#123A54] dark:text-white">
                          {prov.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {prov.subtitle} · Latensi {prov.latencyMs} ms
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAiProviders((prev) =>
                          prev.map((p) =>
                            p.id === prov.id
                              ? {
                                  ...p,
                                  status: p.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                                }
                              : p
                          )
                        );
                        showToast(`Provider AI ${prov.name} diperbarui.`);
                      }}
                      className="cursor-pointer"
                    >
                      <StatusTag label={prov.status} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Model Aktif
                </p>
                {INITIAL_AI_MODELS.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#123A54] dark:text-white">
                        {m.code}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {m.purpose} · {m.providerName}
                      </p>
                    </div>
                    <StatusTag label={m.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiSubTab === 'Model' && (
            <div className="space-y-2.5">
              {INITIAL_AI_MODELS.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-mono font-bold text-[#123A54] dark:text-white">
                      {m.code}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {m.purpose} · {m.modality} · {m.costPer1MTokens} / 1M token
                    </p>
                  </div>
                  <StatusTag label={m.status} />
                </div>
              ))}
            </div>
          )}

          {aiSubTab === 'Routing' && (
            <div className="space-y-2.5">
              {INITIAL_AI_ROUTING.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs sm:text-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#123A54] dark:text-white">
                      {r.taskCategory}
                    </p>
                    <span className="font-mono text-xs text-[#348CB2] tabular-nums">
                      Budget: {r.monthlyBudgetLimitRp}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Primary: <strong className="font-mono">{r.primaryModel}</strong> ·
                    Fallback: <strong className="font-mono">{r.fallbackModel}</strong> ·
                    SLA &lt; {r.maxLatencyMs} ms
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 15: AGENT & SKILL GOVERNANCE -------------------- */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['Agent', 'Skill', 'Library'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAgentSubTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                    agentSubTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddAgentOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Agent / Skill</span>
            </button>
          </div>

          {agentSubTab === 'Agent' && (
            <div className="space-y-2.5">
              {aiAgents.map((ag) => (
                <div
                  key={ag.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAiAgent(ag)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAiAgent(ag);
                    }
                  }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#123A54] dark:text-white">
                        {ag.name}{' '}
                        <span className="ml-1.5 rounded-md bg-[#E5F4F8] dark:bg-[#19394B] px-2 py-0.5 text-[10px] font-mono text-[#194F70] dark:text-[#87CEEB]">
                          Otonomi {ag.autonomyLevel}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {ag.roleDescription} · Skill:{' '}
                        <span className="font-mono">{ag.assignedSkill}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAiAgents((prev) =>
                          prev.map((x) =>
                            x.id === ag.id
                              ? {
                                  ...x,
                                  status: x.status === 'Aktif' ? 'Draft' : 'Aktif',
                                }
                              : x
                          )
                        );
                        showToast(`Status agent ${ag.name} diperbarui.`);
                      }}
                      className="cursor-pointer"
                    >
                      <StatusTag label={ag.status} />
                    </button>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {agentSubTab === 'Skill' && (
            <div className="space-y-2.5">
              {INITIAL_AI_SKILLS.map((sk) => (
                <div
                  key={sk.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs sm:text-sm"
                >
                  <div>
                    <p className="font-mono font-bold text-[#123A54] dark:text-white">
                      {sk.toolName}{' '}
                      <span className="text-xs text-[#348CB2]">{sk.version}</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Side-effect: {sk.sideEffectClass} · Timeout: {sk.timeoutMs} ms ·
                      Idempotent: {sk.idempotent ? 'Ya' : 'Tidak'}
                    </p>
                  </div>
                  <StatusTag label="Aktif" />
                </div>
              ))}
            </div>
          )}

          {agentSubTab === 'Library' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
                    System Prompt & Policy Library (Deterministik)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAiCoachOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Uji di AI Coach</span>
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Seluruh agen dilarang mengubah harga final, stok gudang, atau status order tanpa konfirmasi manusia (L2/L3 approval gate). Semua keluaran wajib menyertakan sitasi tenant ID & tanggal pengukuran.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-[#348CB2]" />
                      <span>Content Template Governance (Remotion Studio)</span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Kurasi template video promo, katalog SKU, dan kepatuhan branding lintas tenant
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-2.5 py-1 text-[11px] font-mono font-bold text-[#194F70] dark:text-[#87CEEB] tabular-nums">
                    {contentTemplates.length} Template
                  </span>
                </div>
                <div className="space-y-2.5">
                  {contentTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#123A54] dark:text-white">
                          {tpl.name}{' '}
                          <span className="ml-1.5 font-mono text-[11px] text-[#348CB2]">
                            {tpl.aspectRatio}
                          </span>
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          Kategori: {tpl.category} · Maks.{' '}
                          <span className="tabular-nums">{tpl.maxDurationSec} dtk</span> ·{' '}
                          {tpl.complianceCheckRequired
                            ? 'Wajib Pemeriksaan Kepatuhan'
                            : 'Pra-Terverifikasi'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus: ContentTemplateGovernanceItem['status'] =
                            tpl.status === 'Aktif'
                              ? 'Review'
                              : tpl.status === 'Review'
                              ? 'Nonaktif'
                              : 'Aktif';
                          setContentTemplates((prev) =>
                            prev.map((x) =>
                              x.id === tpl.id ? { ...x, status: nextStatus } : x
                            )
                          );
                          appendAudit(
                            'Moderasi Content Template',
                            'Agent & Skill Library',
                            `Template ${tpl.name} diubah menjadi ${nextStatus}.`
                          );
                          showToast(`Status template ${tpl.name}: ${nextStatus}`);
                        }}
                        className="cursor-pointer"
                      >
                        <StatusTag label={tpl.status} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 16: TELEGRAM BOT REGISTRY -------------------- */}
      {activeTab === 'telegram_bots' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['Semua', 'Aktif', 'Perusahaan'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBotFilter(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                    botFilter === tab
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddBotOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Bot</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredBots.map((bot) => (
              <div
                key={bot.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTelegramBot(bot)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTelegramBot(bot);
                  }
                }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white">
                      {bot.companyName}
                    </p>
                    <p className="text-xs font-mono text-[#348CB2]">{bot.botHandle}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                      {bot.linkedUsers} user terhubung · {bot.dailyMessages} pesan/hari ·
                      Quiet hours {bot.quietHours}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPluginDefaultTab('telegram');
                      setPluginsModalOpen(true);
                    }}
                    className="rounded-lg border border-[#348CB2] px-2.5 py-1 text-[11px] font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                  >
                    Uji Notifikasi
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTelegramBots((prev) =>
                        prev.map((b) =>
                          b.id === bot.id
                            ? {
                                ...b,
                                status: b.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                              }
                            : b
                        )
                      );
                      showToast(`Status bot ${bot.botHandle} diperbarui.`);
                    }}
                    className="cursor-pointer"
                  >
                    <StatusTag label={bot.status} />
                  </button>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#ADD8E6] bg-[#E5F4F8] dark:bg-[#172438] p-4 flex items-center gap-3 text-xs text-[#123A54] dark:text-[#87CEEB]">
            <Info className="h-5 w-5 shrink-0 text-[#194F70] dark:text-[#87CEEB]" />
            <span>
              Kelola bot Telegram per perusahaan (company) secara terisolasi untuk notifikasi order, ringkasan harian, peringatan GPS, dan interaksi AI.
            </span>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 17: USAGE & COST MONITORING -------------------- */}
      {activeTab === 'usage_cost' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['Ringkasan', 'Tenant', 'Provider'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setUsageSubTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                  usageSubTab === tab
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiMetricCard
              label="Total Penggunaan"
              value="12,48 jt token"
              trend="+18,2%"
              trendTone="positive"
              icon={<Activity className="h-5 w-5" />}
            />
            <KpiMetricCard
              label="Total Biaya"
              value="Rp 126,5 jt"
              trend="+15,7%"
              trendTone="warning"
              icon={<CreditCard className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
              Penggunaan AI (Token) · Jan–Jun
            </h3>
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 600 180"
                className="w-full h-44"
                role="img"
                aria-label="Grafik penggunaan token AI bulanan"
              >
                <defs>
                  <linearGradient id="aiTokenArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#348CB2" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#348CB2" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[30, 70, 110, 150].map((y) => (
                  <line
                    key={y}
                    x1="20"
                    y1={y}
                    x2="580"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="4 4"
                  />
                ))}
                <polygon
                  fill="url(#aiTokenArea)"
                  points="40,140 140,124 240,104 340,84 440,62 540,36 540,150 40,150"
                />
                <polyline
                  fill="none"
                  stroke="#194F70"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="40,140 140,124 240,104 340,84 440,62 540,36"
                />
                {AI_TOKEN_USAGE_TREND.map((pt, i) => {
                  const x = 40 + i * 100;
                  const yCoords = [140, 124, 104, 84, 62, 36];
                  const y = yCoords[i];
                  return (
                    <g key={pt.month}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#348CB2"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        className="fill-[#123A54] dark:fill-slate-200 text-[10px] font-bold"
                      >
                        {pt.tokensJt}jt
                      </text>
                      <text
                        x={x}
                        y={170}
                        textAnchor="middle"
                        className="fill-slate-500 text-[11px] font-semibold"
                      >
                        {pt.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {usageSubTab !== 'Ringkasan' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {usageSubTab === 'Tenant'
                  ? 'Konsumsi & Biaya AI per Tenant'
                  : 'Konsumsi per Provider AI'}
              </p>
              {usageSubTab === 'Tenant'
                ? tenants.slice(0, 4).map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs"
                    >
                      <span className="font-bold text-[#123A54] dark:text-white">
                        {t.name} ({t.id})
                      </span>
                      <span className="font-mono font-bold text-[#348CB2] tabular-nums">
                        {(3.8 - i * 0.7).toFixed(2)} jt token · Rp{' '}
                        {(38.5 - i * 6.5).toFixed(1)} jt
                      </span>
                    </div>
                  ))
                : aiProviders.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs"
                    >
                      <span className="font-bold text-[#123A54] dark:text-white">
                        {p.name}
                      </span>
                      <span className="font-mono font-bold text-[#348CB2] tabular-nums">
                        {(6.2 - i * 1.8).toFixed(2)} jt token · {p.latencyMs} ms avg
                      </span>
                    </div>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 18: SECURITY EVENTS -------------------- */}
      {activeTab === 'security_events' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Kritis', 'Tinggi', 'Terbuka'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSecurityFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                  securityFilter === tab
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredSecurityEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedSecurityEvent(ev)}
                className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                      ev.severity === 'Kritis'
                        ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Tenant {ev.tenantId} · IP{' '}
                      <span className="font-mono">{ev.sourceIp}</span> ·{' '}
                      {ev.timestamp}
                    </p>
                  </div>
                </div>
                <StatusTag label={ev.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 19: AUDIT LOGS -------------------- */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Cari aktivitas..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-10 pr-4 text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const header = 'ID,Action,Actor,Module,Timestamp,Kind,CorrelationId\n';
                const rows = filteredAudits
                  .map(
                    (a) =>
                      `"${a.id}","${a.action}","${a.actorLabel}","${a.module}","${a.timestamp}","${a.kind}","${a.correlationId}"`
                  )
                  .join('\n');
                const blob = new Blob([header + rows], {
                  type: 'text/csv;charset=utf-8;',
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'salesx-super-admin-audit-logs.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast('Audit log CSV berhasil diunduh.');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {auditLoading&&<p className="text-xs text-[var(--color-text-muted)]">Memuat audit log dari FastAPI…</p>}
          {auditError&&<p role="alert" className="text-xs text-red-600">{auditError}</p>}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'Semua', label: 'Semua' },
                { key: 'info', label: 'Info' },
                { key: 'warning', label: 'Peringatan' },
                { key: 'success', label: 'Sukses' },
              ] as const
            ).map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setAuditKindFilter(pill.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                  auditKindFilter === pill.key
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {!auditLoading&&!auditError&&filteredAudits.length===0&&<p className="py-6 text-center text-sm text-[var(--color-text-muted)]">Belum ada audit event platform untuk filter ini.</p>}
            {filteredAudits.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSelectedAuditLog(log)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                      log.kind === 'warning'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : log.kind === 'success'
                        ? 'bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B]/50 dark:text-[#34D399]'
                        : 'bg-[#E5F4F8] text-[#194F70] dark:bg-[#19394B] dark:text-[#87CEEB]'
                    }`}
                  >
                    {log.kind === 'warning' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : log.kind === 'success' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <FileClock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#123A54] dark:text-white truncate">
                      {log.action}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {log.actorLabel} ·{' '}
                      <span className="font-mono tabular-nums">{log.timestamp}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 20: SYSTEM HEALTH & SETTINGS -------------------- */}
      {activeTab === 'system_health' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] dark:bg-[#064E3B]/50 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981] text-white shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#065F46] dark:text-[#34D399]">
                Sistem Optimal
              </h2>
              <p className="text-xs text-[#047857] dark:text-[#A7F3D0]">
                Seluruh service, database, worker, & gateway berjalan normal
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {INITIAL_SYSTEM_HEALTH_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#047857]">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#123A54] dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono text-[#047857] dark:text-[#34D399] tabular-nums">
                      {item.status}
                    </p>
                  </div>
                </div>
                <StatusTag label="Online" />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPlatformSettingsOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl border border-[#348CB2]/40 bg-[var(--color-surface)] p-4 hover:border-[#348CB2] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]">
                <Settings className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#123A54] dark:text-white">
                  Platform Settings
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Kebijakan MFA, retensi GPS, Telegram quiet hours, & API rate limit
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#348CB2]" />
          </button>

          <button
            type="button"
            onClick={() => setRunbookBackupOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]">
                <Terminal className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
                  <span>Operational Runbooks &amp; Backup Recovery</span>
                  <HardDriveDownload className="h-3.5 w-3.5 text-[#348CB2]" />
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Prosedur insiden P0/P1 &amp; snapshot Point-in-Time Recovery (PITR) PostgreSQL
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#348CB2]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setPluginDefaultTab('workspace');
              setPluginsModalOpen(true);
            }}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                <Sliders className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#123A54] dark:text-white">
                  Aktivasi Plugin Ekosistem (Workspace, Maps, AI & Telegram)
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Hubungkan akun Google Workspace, Google Maps Places, & Gemini Server Proxy
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#348CB2]" />
          </button>
        </div>
      )}

      {/* -------------------- MENU LAINNYA (ALL SUPER ADMIN MODULES HUB) -------------------- */}
      {activeTab === 'more' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4">
            <h2 className="text-sm font-bold text-[#123A54] dark:text-white">
              Semua Modul Kendali Super Admin
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Pilih modul governance, data master, billing, AI, bot, atau audit sistem.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {authorizedNavGroups.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[#348CB2] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#194F70] dark:text-[#87CEEB]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#123A54] dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}
      <AddTenantModal
        open={addTenantOpen}
        onClose={() => setAddTenantOpen(false)}
        onAddTenant={(t) => {
          setTenants((prev) => [t, ...prev]);
          appendAudit(
            'Registrasi Tenant Baru',
            'Manajemen Tenant',
            `Tenant ${t.name} (${t.id}) terdaftar pada paket ${t.plan}.`,
            'success'
          );
          showToast(`Tenant ${t.name} (${t.id}) berhasil ditambahkan.`);
        }}
      />

      <TenantDetailModal
        tenant={selectedTenantDetail}
        onClose={() => setSelectedTenantDetail(null)}
        onUpdateTenant={(id, patch) => {
          setTenants((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
          );
          appendAudit(
            'Ubah Governance Tenant',
            'Manajemen Tenant',
            `Tenant ${id} diperbarui: paket ${patch.plan}, status ${patch.status}.`
          );
          showToast(`Governance tenant ${id} disimpan.`);
        }}
        onOpenOrganizations={(tid) => {
          setSelectedOrgTenantId(tid);
          setActiveTab('organizations');
        }}
      />

      <AddOrganizationModal
        open={addOrgOpen}
        onClose={() => setAddOrgOpen(false)}
        tenants={tenants}
        defaultTenantId={selectedOrgTenantId}
        onAddOrg={(node) => {
          setOrgNodes((prev) => [...prev, node]);
          appendAudit(
            'Tambah Unit Organisasi',
            'Organisasi',
            `${node.name} (${node.nodeType}) ditambahkan ke tenant ${node.tenantId}.`
          );
          showToast(`Organisasi ${node.name} ditambahkan.`);
        }}
      />

      <MasterDataCrudModal
        category={activeMasterCategory}
        onClose={() => setActiveMasterCategoryId(null)}
        onSaveItem={(categoryId, item) => {
          setMasterData((prev) =>
            prev.map((cat) => {
              if (cat.id !== categoryId) return cat;
              const exists = cat.items.some((x) => x.id === item.id);
              const nextItems = exists
                ? cat.items.map((x) => (x.id === item.id ? item : x))
                : [item, ...cat.items];
              return {
                ...cat,
                items: nextItems,
                recordsCount: exists ? cat.recordsCount : cat.recordsCount + 1,
                updatedLabel: 'Baru saja',
              };
            })
          );
          showToast(`Master data "${item.name}" disimpan.`);
        }}
        onDeleteItem={(categoryId, itemId) => {
          setMasterData((prev) =>
            prev.map((cat) =>
              cat.id !== categoryId
                ? cat
                : {
                    ...cat,
                    items: cat.items.filter((x) => x.id !== itemId),
                    recordsCount: Math.max(0, cat.recordsCount - 1),
                  }
            )
          );
          showToast('Entri master data dihapus.');
        }}
        onToggleItemStatus={(categoryId, itemId) => {
          setMasterData((prev) =>
            prev.map((cat) =>
              cat.id !== categoryId
                ? cat
                : {
                    ...cat,
                    items: cat.items.map((x) =>
                      x.id === itemId
                        ? {
                            ...x,
                            status: x.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                          }
                        : x
                    ),
                  }
            )
          );
        }}
      />

      <AddDomainModal
        open={addDomainOpen}
        onClose={() => setAddDomainOpen(false)}
        onAddDomain={(d) => {
          setDomains((prev) => [...prev, d]);
          appendAudit(
            'Tambah Domain Registry',
            'Domain Registry',
            `Domain ${d.domain} diarahkan ke ${d.internalRoute}.`,
            'success'
          );
          showToast(`Domain ${d.domain} berhasil didaftarkan.`);
        }}
      />

      <DomainDetailModal
        domainItem={selectedDomainDetail}
        onClose={() => setSelectedDomainDetail(null)}
        onToggleStatus={(id) => {
          setDomains((prev) =>
            prev.map((d) =>
              d.id === id
                ? { ...d, status: d.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
                : d
            )
          );
          setSelectedDomainDetail((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
                }
              : null
          );
          showToast('Status domain diperbarui.');
        }}
      />

      <AddFeatureFlagModal
        open={addFlagOpen}
        onClose={() => setAddFlagOpen(false)}
        onAddFlag={(ff) => {
          setFeatureFlags((prev) => [ff, ...prev]);
          appendAudit(
            'Tambah Feature Flag',
            'Feature Flags',
            `Flag baru ${ff.key} (${ff.rolloutScope}) diaktifkan.`
          );
          showToast(`Feature flag ${ff.key} ditambahkan.`);
        }}
      />

      <AddPackageModal
        open={addPackageOpen}
        onClose={() => setAddPackageOpen(false)}
        onAddPackage={(pkg) => {
          setPackages((prev) => [...prev, pkg]);
          appendAudit(
            'Tambah Paket Subscription',
            'Subscription & Package',
            `Paket ${pkg.name} (${pkg.priceLabel}) dipublikasikan.`
          );
          showToast(`Paket ${pkg.name} berhasil dibuat.`);
        }}
      />

      <AddIntegrationModal
        open={addIntegrationOpen}
        onClose={() => setAddIntegrationOpen(false)}
        onAddIntegration={(item) => {
          setIntegrations((prev) => [item, ...prev]);
          showToast(`Integrasi ${item.name} ditambahkan.`);
        }}
      />

      <AddAiProviderModal
        open={addAiProviderOpen}
        onClose={() => setAddAiProviderOpen(false)}
        onAddProvider={(p) => {
          setAiProviders((prev) => [...prev, p]);
          showToast(`AI Provider ${p.name} terdaftar.`);
        }}
      />

      <AddAgentSkillModal
        open={addAgentOpen}
        onClose={() => setAddAgentOpen(false)}
        onAddAgent={(ag) => {
          setAiAgents((prev) => [...prev, ag]);
          showToast(`Agent ${ag.name} (${ag.autonomyLevel}) didaftarkan.`);
        }}
      />

      <AddTelegramBotModal
        open={addBotOpen}
        onClose={() => setAddBotOpen(false)}
        tenants={tenants}
        onAddBot={(bot) => {
          setTelegramBots((prev) => [...prev, bot]);
          showToast(`Bot ${bot.botHandle} untuk ${bot.companyName} aktif.`);
        }}
      />

      <SecurityEventDetailModal
        eventItem={selectedSecurityEvent}
        onClose={() => setSelectedSecurityEvent(null)}
        onResolveEvent={(id, nextStatus) => {
          setSecurityEvents((prev) =>
            prev.map((ev) => (ev.id === id ? { ...ev, status: nextStatus } : ev))
          );
          appendAudit(
            'Penanganan Security Event',
            'Security Events',
            `Event ${id} ditandai ${nextStatus}.`,
            'success'
          );
          showToast(`Security event ditandai: ${nextStatus}`);
        }}
      />

      <AuditLogDetailModal
        auditItem={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />

      <PlatformSettingsModal
        open={platformSettingsOpen}
        onClose={() => setPlatformSettingsOpen(false)}
        onSave={(msg) => {
          appendAudit('Ubah Platform Settings', 'System Settings', msg);
          showToast(msg);
        }}
      />

      <OrganizationNodeDetailModal
        node={selectedOrgNode}
        onClose={() => setSelectedOrgNode(null)}
        onSave={(id, patch) => {
          setOrgNodes((prev) =>
            prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
          );
          appendAudit(
            'Ubah Unit Organisasi',
            'Organisasi',
            `Unit ${id} diperbarui: ${patch.name ?? ''} (${patch.status ?? ''}).`
          );
          showToast('Detail unit organisasi diperbarui.');
        }}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onAction={(id, actionType) => {
          setServices((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status:
                      actionType === 'restart'
                        ? 'Aktif'
                        : s.status === 'Aktif'
                        ? 'Degraded'
                        : 'Aktif',
                  }
                : s
            )
          );
          appendAudit(
            actionType === 'restart' ? 'Rolling Restart Service' : 'Toggle Service Status',
            'Service Registry',
            `Aksi ${actionType} dijalankan pada service ${id}.`,
            'success'
          );
          showToast(
            actionType === 'restart'
              ? 'Graceful rolling restart service selesai.'
              : 'Status service diperbarui.'
          );
        }}
      />

      <SubscriberDetailModal
        sub={selectedSubscriber}
        onClose={() => setSelectedSubscriber(null)}
        onUpdate={(id, patch) => {
          setSubscribers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
          );
          appendAudit(
            'Ubah Paket Langganan Subscriber',
            'Subscription & Package',
            `Subscriber ${id} diperbarui ke paket ${patch.packageName} (${patch.billingCycle}, ${patch.status}).`,
            'success'
          );
          showToast('Langganan subscriber diperbarui.');
        }}
      />

      <AddWebhookModal
        open={addWebhookOpen}
        onClose={() => setAddWebhookOpen(false)}
        onAddWebhook={(wh) => {
          setWebhooks((prev) => [wh, ...prev]);
          appendAudit(
            'Tambah Webhook Endpoint',
            'Integration Registry',
            `Webhook ${wh.url} ditambahkan untuk event ${wh.events.join(', ')}.`,
            'success'
          );
          showToast('Webhook endpoint berhasil didaftarkan.');
        }}
      />

      <AddApiKeyModal
        open={addApiKeyOpen}
        onClose={() => setAddApiKeyOpen(false)}
        onAddApiKey={(key) => {
          setApiKeys((prev) => [key, ...prev]);
          appendAudit(
            'Terbitkan Platform API Key',
            'Integration Registry',
            `API key ${key.label} (${key.prefix}) diterbitkan.`,
            'success'
          );
          showToast(`API Key ${key.label} diterbitkan.`);
        }}
      />

      <AiAgentDetailModal
        agent={selectedAiAgent}
        onClose={() => setSelectedAiAgent(null)}
        onUpdate={(id, patch) => {
          setAiAgents((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
          );
          appendAudit(
            'Ubah Policy Otonomi AI Agent',
            'Agent & Skill',
            `Agent ${id} diatur ke level otonomi ${patch.autonomyLevel}, skill ${patch.assignedSkill}.`
          );
          showToast('Policy otonomi AI Agent diperbarui.');
        }}
      />

      <TelegramBotDetailModal
        bot={selectedTelegramBot}
        onClose={() => setSelectedTelegramBot(null)}
        onUpdate={(id, patch) => {
          setTelegramBots((prev) =>
            prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
          );
          appendAudit(
            'Ubah Konfigurasi Telegram Bot',
            'Telegram Bot',
            `Bot ${id} diperbarui: quiet hours ${patch.quietHours}, status ${patch.status}.`
          );
          showToast('Konfigurasi bot Telegram disimpan.');
        }}
      />

      <RunbookBackupModal
        open={runbookBackupOpen}
        onClose={() => setRunbookBackupOpen(false)}
        runbooks={INITIAL_RUNBOOKS}
        backups={INITIAL_BACKUPS}
        onExecuteAction={(msg) => {
          appendAudit('Eksekusi Runbook / Backup PITR', 'System Health', msg, 'success');
          showToast(msg);
        }}
      />

      <SuperAdminNotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      <PluginActivationModal
        open={pluginsModalOpen}
        onClose={() => setPluginsModalOpen(false)}
        portalName="Super Admin Portal"
        outlets={PLATFORM_TENANT_OUTLETS}
        defaultTab={pluginDefaultTab}
        prefillEmailTo="admin@salesx-ai.com"
      />

      <PortalAiCoachModal
        open={aiCoachOpen}
        onClose={() => setAiCoachOpen(false)}
        title="SalesX-Ai Platform AI Coach"
        subtitle="Audit efisiensi multi-tenant, biaya token AI, SLA layanan, & governance"
        contextSummary={`Total Tenant Aktif: ${tenants.length + 122}, Total User: 12.540, GMV Bulanan: Rp 42,58 M, Pemakaian AI: 12,48 jt token (Rp 126,5 jt), Security Events terbuka: ${securityEvents.filter((e) => e.status !== 'Selesai').length}.`}
        quickPrompts={[
          'Ringkas performa Top 3 tenant dan rekomendasi upsell paket Enterprise.',
          'Evaluasi efisiensi biaya token AI bulan Juni dan strategi fallback model.',
          'Prioritas tindak lanjut Security Events dan feature flag bulan ini.',
        ]}
      />
    </PortalShell>
  );
}
