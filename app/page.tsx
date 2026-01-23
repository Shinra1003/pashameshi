"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LayoutGrid, Camera, Utensils, Settings, ShoppingCart, Users, User, Copy, LogOut, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CameraCapture from '@/components/CameraCapture';
import IngredientList from '@/components/IngredientList';
import RecipeSuggestion from '@/components/RecipeSuggestion';
import ShoppingList from '@/components/ShoppingList';
import SettingsTab from '@/components/SettingsTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();
      setGroupId(profile?.group_id || null);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refreshStatus]);

  const copyInviteCode = () => {
    if (!groupId) return;
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLeave = async () => {
    const confirmLeave = confirm("グループを脱退して個人モードに戻りますか？");
    if (!confirmLeave) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ group_id: null }).eq('id', user.id);
    await refreshStatus();
    setShowQuickMenu(false);
    alert("個人モードに戻りました。");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                📦 食材管理
              </h2>
              <span className="text-[10px] font-black text-gray-300 bg-gray-100 px-2 py-1 rounded">ALL ITEMS</span>
            </div>
            <IngredientList />
          </div>
        );
      case 'camera':
        return (
          <div className="animate-in zoom-in-95 duration-300">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-2 flex items-center gap-2">
              📸 食材を登録
            </h2>
            <CameraCapture />
          </div>
        );
      case 'recipe':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-2 flex items-center gap-2">
              🍳 レシピ提案
            </h2>
            <RecipeSuggestion />
          </div>
        );
      case 'shopping':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-4 flex items-center gap-2">
              🛒 買い物リスト
            </h2>
            <ShoppingList />
          </div>
        );
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-4 flex items-center gap-2">
              ⚙ 設定
            </h2>
            <SettingsTab onStatusChange={refreshStatus} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="p-4 bg-white shadow-sm sticky top-0 z-50 flex justify-between items-center border-b border-gray-50">
        <div className="w-12" /> 

        <h1 className="text-xl font-black text-orange-500 flex items-center gap-2">
          パシャ飯 <span className="text-[10px] font-normal text-gray-500 tracking-widest uppercase">PASHAMESHI</span>
        </h1>

        <div className="w-12 flex justify-end relative" ref={menuRef}>
          <button 
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform outline-none"
          >
            {groupId ? (
              <div className="flex flex-col items-center gap-0.5 animate-in zoom-in duration-300">
                <Users size={16} className="text-orange-500" />
                <span className="text-[7px] font-black text-orange-500 uppercase tracking-tighter">Shared</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 animate-in zoom-in duration-300"> 
                <User size={16} className="text-gray-700" /> 
                <span className="text-[7px] font-black text-gray-700 uppercase tracking-tighter">Solo</span>
              </div>
            )}
          </button>

          {showQuickMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[60]">
              {groupId ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 border-b border-gray-50 mb-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Invite Code</p>
                    <p className="text-[10px] font-mono font-bold text-gray-600 truncate">{groupId}</p>
                  </div>
                  <button onClick={copyInviteCode} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                    <span className="text-xs font-black text-gray-700">{copied ? 'コピー完了' : 'コードをコピー'}</span>
                  </button>
                  <button onClick={quickLeave} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-red-50 rounded-xl transition-colors text-red-500">
                    <LogOut size={14} />
                    <span className="text-xs font-black">グループを脱退</span>
                  </button>
                </div>
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                  <p className="text-xs font-bold text-gray-600">個人モード</p>
                  <p className="text-[9px] text-gray-400 mt-2">設定からグループ作成</p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {renderContent()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 flex justify-center items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="w-full flex items-center">
          <TabButton label="食材管理" icon={<LayoutGrid size={22} />} isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <TabButton label="パシャッ！" icon={<Camera size={22} />} isActive={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
          <TabButton label="レシピ" icon={<Utensils size={22} />} isActive={activeTab === 'recipe'} onClick={() => setActiveTab('recipe')} />
          <TabButton label="買い物" icon={<ShoppingCart size={22} />} isActive={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} />
          <TabButton label="設定" icon={<Settings size={22} />} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </nav>
    </main>
  );
}

function TabButton({ label, icon, isActive, onClick }: { label: string, icon: any, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
        isActive ? 'text-orange-500 scale-110' : 'text-gray-300'
      }`}
    >
      <div className="flex items-center justify-center w-6 h-6">
        {icon}
      </div>
      <span className="text-[9px] font-black whitespace-nowrap">{label}</span>
    </button>
  );
}