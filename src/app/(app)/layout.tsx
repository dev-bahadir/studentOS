import { Sidebar } from '@/components/Navigation'; 

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 'h-[100dvh]' fixt das Problem mit der Safari-Adressleiste auf iOS
    <div className="flex h-[100dvh] w-full bg-canvas overflow-hidden">
      
      {/* SIDEBAR CONTAINER (Desktop & iPad Landscape)
        - 'hidden lg:flex': Versteckt die Sidebar auf iPad Portrait und Handys.
          Dort nutzen wir das mobile Menü (Overlay), das in der <Sidebar /> Komponente steckt.
        - 'fixed': Damit sie beim Scrollen stehen bleibt.
      */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-gray-200 bg-panel">
        <Sidebar />
      </aside>

      {/* HAUPTINHALT
        - 'lg:pl-64': Schiebt den Inhalt nur auf großen Screens nach rechts.
        - 'transition-all': Macht das Umschalten beim Drehen des iPads weicher.
      */}
      <div className="flex-1 flex flex-col h-full lg:pl-64 transition-all duration-300 ease-in-out">
        
        {/* SCROLL AREA
          - Hier findet das eigentliche Scrollen statt.
          - 'pb-24': Extra Platz unten, damit auf Handys nichts hinter der Home-Bar verschwindet.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 scroll-smooth">
          {/*
             Kleiner Trick: Auf Mobile rendert die Sidebar-Komponente oft auch 
             den Hamburger-Button oben. Falls dein Hamburger-Button teil der Sidebar ist 
             und hier 'hidden' ist, musst du evtl. den <Sidebar /> auch hier 
             für Mobile einbinden (als reine Navbar), oder er steckt im Page-Flow.
             
             Falls du das Mobile-Menü vermisst, füge hier optional eine Mobile-Nav ein.
             Standardmäßig gehen wir davon aus, dass die Pages selbst sauber rendern.
          */}
          
          {/* Mobile Sidebar (falls deine Sidebar-Logik das Overlay hier braucht) */}
          <div className="lg:hidden mb-4">
             {/* Falls deine Sidebar Komponente smart ist, rendert sie sich hier als Mobile Header */}
             <Sidebar /> 
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
