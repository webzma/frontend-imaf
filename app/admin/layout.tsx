import AppSidebar from "./_components/Sidebar";
import AdminMobileNavbar from "./_components/MobileNavbar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center gap-3 bg-surface-container-low px-4 border-b border-outline-variant">
            <SidebarTrigger className="text-muted-foreground hover:text-on-surface transition-colors" />
            <div className="w-px h-4 bg-outline-variant" />
            <span className="font-sans text-xs text-muted-foreground tracking-wide">
              IMAF Admin
            </span>
          </header>
          <div className="flex-1 min-h-screen overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </div>
          <AdminMobileNavbar />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
