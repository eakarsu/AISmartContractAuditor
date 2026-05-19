import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileCode, Shield, FolderOpen, ClipboardList, History,
  Search, Fuel, CheckCircle, TestTube, Star, Lock, LogOut, Menu, X, ChevronDown, ChevronRight,
  AlertTriangle, Wrench, FileText, Layers
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/contracts', icon: FileCode, label: 'Smart Contracts' },
      { to: '/audits', icon: Shield, label: 'Audit Reports' },
      { to: '/projects', icon: FolderOpen, label: 'Projects' },
      { to: '/compliance-templates', icon: ClipboardList, label: 'Compliance Templates' },
      { to: '/audit-history', icon: History, label: 'Audit History' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/vulnerability-scan', icon: Search, label: 'Vulnerability Scan' },
      { to: '/gas-optimization', icon: Fuel, label: 'Gas Optimization' },
      { to: '/compliance-check', icon: CheckCircle, label: 'Compliance Check' },
      { to: '/test-generation', icon: TestTube, label: 'Test Generation' },
      { to: '/code-quality', icon: Star, label: 'Code Quality' },
      { to: '/reentrancy-detection', icon: Lock, label: 'Reentrancy Detection' },
      { to: '/advanced-analysis', icon: Layers, label: 'Advanced Analysis' },
    ],
  },
  {
    label: 'Security Center',
    items: [
      { to: '/vulnerabilities', icon: AlertTriangle, label: 'Vulnerability List' },
      { to: '/audit-pdf', icon: FileText, label: 'PDF Reports' },
      { to: '/custom-views', icon: Layers, label: 'Security Views' },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 bg-gray-900 text-white flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span>SC Auditor</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI-Powered Security</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200"
              >
                {group.label}
                {collapsed[group.label] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {!collapsed[group.label] && group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="ml-4 text-sm text-gray-500">AI Smart Contract Auditor</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
