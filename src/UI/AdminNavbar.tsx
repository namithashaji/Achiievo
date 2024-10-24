import  { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext'; // Import the hook
import { useAuth } from '@/context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { Link } from 'react-router-dom';

export default function AdminNavbar() {
  const { theme, toggleTheme } = useTheme(); // Use the hook
  const { logout } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
          <Link to={"/"}>
          <div className="flex-shrink-0">
          <span className="text-2xl font-bold text-primary text-green-600">
            Achiievo
            </span>
            </div>
          </Link>
           
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="mr-4"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-4">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setModalOpen(true)}>
                  Change Password
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </nav>
  );
}
