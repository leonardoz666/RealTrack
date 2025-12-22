import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MessageCircle, Moon, Sun, Menu } from 'lucide-react';
import { usePerfil } from '../contexts/PerfilContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import { subscribeToTelegramUpdate } from '../utils/telegramSync';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';

const SUPPORT_BOT_USERNAME = typeof import.meta.env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME === 'string' && import.meta.env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME.trim().length > 0
  ? import.meta.env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME.trim()
  : 'RealComandoSuporte_bot';

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { perfil } = usePerfil();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTelegramUpdate(() => {
      window.location.reload();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleOpenTelegramTicket = () => {
    const baseUrl = `https://t.me/${SUPPORT_BOT_USERNAME}`;
    const startParam = perfil?.id ? `?start=support_${perfil.id}` : '';
    window.open(`${baseUrl}${startParam}`, '_blank', 'noopener,noreferrer');
  };

  const ticketButtonTitle = perfil
    ? 'Abrir ticket com seus dados no Telegram'
    : 'Abrir bot de ticket no Telegram';

  return (
    <div className="flex min-h-full bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-app-layout-bg dark:text-white">
      {isMobile ? (
        <>
          <div className="fixed left-0 top-0 z-50 flex w-full items-center bg-white p-4 shadow-sm dark:bg-app-layout-bg dark:text-white dark:border-b dark:border-white/5">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="mr-4 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <Menu size={24} />
            </button>
            <span className="text-lg font-semibold">Real Comando</span>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              <SheetDescription className="sr-only">
                Menu lateral para navegação entre as páginas do sistema
              </SheetDescription>
              <Sidebar collapsed={false} onToggle={() => {}} mobile={true} />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <Sidebar collapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
      )}
      <div
        className={`flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 transition-all duration-300 ${
          isMobile ? 'ml-0 mt-16' : isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <Outlet />
        </div>
        
        <div className="fixed bottom-4 right-0 z-40 flex flex-col gap-3 sm:bottom-6 sm:right-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:-translate-y-0.5 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:bg-emerald-900/80 dark:text-emerald-100 dark:hover:bg-emerald-800 sm:h-12 sm:w-12"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            type="button"
            onClick={handleOpenTelegramTicket}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-emerald text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/40 sm:h-12 sm:w-12"
            title={ticketButtonTitle}
            aria-label="Abrir bot de ticket no Telegram"
          >
            <MessageCircle size={16} />
            <span className="sr-only">Ticket Telegram</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
