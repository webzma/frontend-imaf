import AppSidebar from "./_components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
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
        <header className="flex h-12 items-center gap-3 bg-surface-container-low px-4 border-b border-outline-variant/30">
          <SidebarTrigger className="text-muted-foreground hover:text-on-surface transition-colors" />
          <div className="w-px h-4 bg-outline-variant/40" />
          <span className="font-sans text-xs text-muted-foreground/60 tracking-wide">IMAF Admin</span>
        </header>
        <div className="flex-1 min-h-screen overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
