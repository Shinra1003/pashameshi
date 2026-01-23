"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, User, ChevronRight, Users, ShieldCheck, HelpCircle, Copy, Check, LogOut as LeaveIcon, Loader2, Trash2 } from 'lucide-react';

// プロップスの型定義を追加
interface SettingsTabProps {
  onStatusChange?: () => void;
}

export default function SettingsTab({ onStatusChange }: SettingsTabProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ユーザー情報とグループ情報の取得
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email ?? 'メールアドレス未設定');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();
      
      if (profile) setGroupId(profile.group_id);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 新規グループ作成
  const createGroup = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newGroupId = crypto.randomUUID();
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: newGroupId })
        .eq('id', user.id);

      if (error) throw error;
      setGroupId(newGroupId);
      
      // ヘッダーを更新
      if (onStatusChange) onStatusChange();
      
      alert("新しいグループを作成しました！");
    } catch (error) {
      alert("グループ作成に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 招待コードを使ってグループに参加
  const joinGroup = async () => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ group_id: inviteCode.trim() })
        .eq('id', user.id);

      if (error) throw error;
      setGroupId(inviteCode.trim());
      setInviteCode('');
      
      // ヘッダーを更新
      if (onStatusChange) onStatusChange();
      
      alert("グループに参加しました！個人在庫は一時的に隠れます。");
    } catch (error) {
      alert("参加に失敗しました。コードが正しいか確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  // グループから脱退
  const leaveGroup = async () => {
    const confirmLeave = confirm("グループから脱退しますか？個人在庫が再び表示されるようになります。");
    if (!confirmLeave) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ group_id: null })
        .eq('id', user.id);

      if (error) throw error;
      setGroupId(null);
      
      // ヘッダーを更新
      if (onStatusChange) onStatusChange();
      
      alert("脱退しました。個人モードに戻ります。");
    } catch (error) {
      alert("脱退に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!groupId) return;
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    const confirmLogout = confirm("ログアウトしますか？");
    if (!confirmLogout) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // --- アカウント削除機能 ---
  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (groupId) {
      const proceed = confirm(
        "※あなたは現在グループに参加しています。退会すると、あなたが登録した共有食材や買い物リストもすべて消去されます。\n\nこのまま退会を進めますか？"
      );
      if (!proceed) return;
    }

    const confirm1 = confirm("本当にアカウントを完全に削除しますか？");
    if (!confirm1) return;

    const confirm2 = confirm(
      "【最終確認】アカウントを削除すると、全てのデータが消去され復元できません。本当によろしいですか？"
    );
    if (!confirm2) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      alert("アカウントを削除しました。ご利用ありがとうございました。");
      window.location.href = '/login';
    } catch (error: any) {
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10 px-4">
      
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

      {/* 家族共有・グループ管理セクション */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-gray-400 ml-4 uppercase tracking-[0.2em]">Family & Sharing</h3>
        
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 space-y-4">
          {!groupId ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 font-bold mb-4">現在は個人モードです</p>
                <button 
                  onClick={createGroup}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Users size={18} /> 新しい家族グループを作る</>}
                </button>
              </div>
              
              <div className="relative pt-4 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 font-black mb-2 text-center">または招待コードで参加</p>
                <div className="flex gap-2">
                  <input 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="コードを入力"
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button 
                    onClick={joinGroup}
                    disabled={isLoading || !inviteCode}
                    className="bg-gray-800 text-white px-4 rounded-xl font-black text-xs active:scale-95 transition"
                  >
                    参加
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Your Group Invite Code</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-blue-800 break-all bg-white px-2 py-1 rounded border border-blue-200">{groupId}</code>
                  <button onClick={copyToClipboard} className="p-2 bg-white text-blue-500 rounded-lg shadow-sm active:scale-90 transition">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={leaveGroup}
                className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <LeaveIcon size={18} /> グループを脱退する
              </button>
            </div>
          )}
        </div>
      </div>

      {/* サポート */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-gray-400 ml-4 uppercase tracking-[0.2em]">Support</h3>
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
          <MenuButton icon={<ShieldCheck size={18} className="text-green-500" />} label="プライバシーポリシー" />
          <MenuButton icon={<HelpCircle size={18} className="text-purple-500" />} label="ヘルプ・使い方" last />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button 
          onClick={handleLogout}
          className="w-full py-5 bg-red-50 text-red-500 rounded-[32px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-100 border border-red-100 shadow-sm shadow-red-50"
        >
          <LogOut size={20} />
          ログアウト
        </button>

        <button 
          onClick={handleDeleteAccount}
          disabled={isLoading}
          className="w-full py-4 text-gray-300 hover:text-red-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors uppercase tracking-widest"
        >
          {isLoading ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
          アカウントを完全に削除する
        </button>
      </div>

      <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">
        Pashameshi v1.0.1
      </p>
    </div>
  );
}

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