"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, User, ChevronRight, Bell, Users, ShieldCheck, HelpCircle } from 'lucide-react';

export default function SettingsTab() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? 'メールアドレス未設定');
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = confirm("ログアウトしますか？");
    if (!confirmLogout) return;
    
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      
      {/* ユーザー情報カード */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex items-center gap-4">
        <div className="w-16 h-16 bg-orange-100 rounded-[24px] flex items-center justify-center shadow-inner">
          <User className="text-orange-500" size={32} />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated User</p>
          <p className="font-black text-gray-800 truncate text-base">{userEmail}</p>
        </div>
      </div>

      {/* 設定項目グループ 1 */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-gray-400 ml-4 uppercase tracking-[0.2em]">Family & Social</h3>
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
          <MenuButton icon={<Users size={18} className="text-blue-500" />} label="家族共有・グループ管理" />
          <MenuButton icon={<Bell size={18} className="text-yellow-500" />} label="通知・リマインド設定" last />
        </div>
      </div>

      {/* 設定項目グループ 2 */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-gray-400 ml-4 uppercase tracking-[0.2em]">Support</h3>
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
          <MenuButton icon={<ShieldCheck size={18} className="text-green-500" />} label="プライバシーポリシー" />
          <MenuButton icon={<HelpCircle size={18} className="text-purple-500" />} label="ヘルプ・使い方" last />
        </div>
      </div>

      {/* ログアウトボタン */}
      <button 
        onClick={handleLogout}
        className="w-full py-5 bg-red-50 text-red-500 rounded-[32px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-100 mt-4 border border-red-100 shadow-sm shadow-red-50"
      >
        <LogOut size={20} />
        ログアウト
      </button>

      <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">
        Pashameshi v1.0.0
      </p>
    </div>
  );
}

// 汎用メニューボタンコンポーネント
function MenuButton({ icon, label, last = false }: { icon: any, label: string, last?: boolean }) {
  return (
    <button className={`w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group ${!last ? 'border-b border-gray-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
          {icon}
        </div>
        <span className="font-bold text-gray-700">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
    </button>
  );
}