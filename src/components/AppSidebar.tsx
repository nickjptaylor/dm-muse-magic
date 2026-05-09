import { NavLink, useLocation, useParams } from "react-router-dom";
import { Scroll, BookOpen, Sparkles, LayoutDashboard, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const params = useParams();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const campaignId = params.campaignId;

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Campaigns", url: "/campaigns", icon: Scroll },
  ];

  const campaignItems = campaignId
    ? [
        { title: "Overview", url: `/campaigns/${campaignId}`, icon: BookOpen },
        { title: "Sessions", url: `/campaigns/${campaignId}/sessions`, icon: Scroll },
        { title: "DM Prep", url: `/campaigns/${campaignId}/dm-prep`, icon: Sparkles },
      ]
    : [];

  const isActive = (url: string) =>
    pathname === url || (url !== "/dashboard" && pathname.startsWith(url + "/"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-gold-subtle">
        <a href="/" className="flex items-center gap-2 px-2 py-2">
          <img src={tavernLogo} alt="TavernRecap" className="h-7 w-auto object-contain" />
          {!collapsed && (
            <span className="font-display text-lg tracking-wide">TavernRecap</span>
          )}
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {campaignItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Campaign</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {campaignItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}