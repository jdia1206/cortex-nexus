import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  Users,
  Truck,
  Settings,
  CreditCard,
  Building2,
  ChevronDown,
  RotateCcw,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { key: 'dashboard', icon: LayoutDashboard, url: '/dashboard' },
  { key: 'products', icon: Package, url: '/products' },
  { key: 'inventory', icon: Warehouse, url: '/inventory' },
  { key: 'sales', icon: ShoppingCart, url: '/sales' },
  { key: 'purchases', icon: ShoppingBag, url: '/purchases' },
  { key: 'returns', icon: RotateCcw, url: '/returns' },
  { key: 'transfers', icon: ArrowRightLeft, url: '/transfers' },
  { key: 'customers', icon: Users, url: '/customers' },
  { key: 'suppliers', icon: Truck, url: '/suppliers' },
  { key: 'reports', icon: FileText, url: '/reports' },
];

const settingsNavItems = [
  { key: 'company', icon: Building2, url: '/settings/company' },
  { key: 'users', icon: Users, url: '/settings/users' },
  { key: 'activityLog', icon: FileText, url: '/settings/activity' },
  { key: 'branches', icon: Building2, url: '/settings/branches' },
  { key: 'warehouses', icon: Warehouse, url: '/settings/warehouses' },
  { key: 'billing', icon: CreditCard, url: '/settings/billing' },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith('/settings')
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <span className={cn(
            "font-bold text-sidebar-foreground transition-all",
            collapsed ? "text-lg" : "text-xl"
          )}>
            {collapsed ? 'VS' : t('common.appName')}
          </span>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-4 py-2">
            {!collapsed && t('nav.dashboard')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? t(`nav.${item.key}`) : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-4 py-2 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{t('nav.settings')}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      settingsOpen && "rotate-180"
                    )}
                  />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="pl-2">
                  {settingsNavItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={collapsed ? t(`nav.${item.key}`) : undefined}
                      >
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-4 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
