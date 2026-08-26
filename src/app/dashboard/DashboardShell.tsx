'use client';

import type { User } from './dashboard.types';

type MenuItem = { emoji: string; label: string; action: () => void };

export function DashboardHeader({ user, onNewMatch, onLogout, onToggleMenu }: { user: User | null; onNewMatch: () => void; onLogout: () => void; onToggleMenu: () => void }) {
  return <header className="bg-white border-b border-gray-200 sticky top-0 z-40"><div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-3"><button type="button" data-testid="hamburger-menu-button" aria-label="Abrir menu" onClick={onToggleMenu} className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-gray-700"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button><h1 className="text-lg font-bold text-gray-900">Início</h1></div>{user && <div className="flex items-center gap-3"><button type="button" onClick={onNewMatch} className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors" aria-label="Nova partida">+ Nova Partida</button><span className="text-sm text-gray-500">{user.name}</span>{user.role === 'ADMIN' && <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">Admin</span>}<button type="button" onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Sair">Sair</button></div>}</div></header>;
}

export function DashboardMenu({ open, items, onClose }: { open: boolean; items: MenuItem[]; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex"><div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} aria-hidden="true" /><nav className="relative z-[70] bg-white w-72 max-w-full h-full shadow-xl flex flex-col p-4 select-none" aria-label="Menu"><div className="flex items-center justify-between mb-4"><span className="text-sm font-semibold text-gray-500 uppercase">Menu</span><button type="button" onClick={onClose} aria-label="Fechar menu" className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">×</button></div><ul className="flex-1 space-y-1">{items.map((item) => <li key={item.label}><button type="button" onClick={() => { onClose(); item.action(); }} className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><span className="text-lg" aria-hidden="true">{item.emoji}</span><span>{item.label}</span></button></li>)}</ul></nav></div>;
}

export function DeleteMatchModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" /><div className="relative bg-white rounded-lg p-6 max-w-sm"><h3 className="font-bold mb-2">Excluir partida?</h3><p className="text-sm text-gray-500 mb-4">Esta ação não pode ser desfeita.</p><div className="flex gap-2"><button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button><button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Excluir</button></div></div></div>;
}
