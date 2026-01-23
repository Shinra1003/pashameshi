"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("エラー: " + error.message);
    } else if (data.user || data.session) {
        if (isSignUp) {
        alert("登録しました！ログインしてください。");
        setIsSignUp(false);
        } else {
        // --- ここが重要 ---
        // 1. まず現在のページ情報をリフレッシュ
        router.refresh();
        // 2. 少しだけ待ってからトップへ移動（middlewareとの同期を確実にするため）
        setTimeout(() => {
            router.push('/');
            // 万が一 push が動かない時のために強制移動
            window.location.href = '/';
        }, 100);
        }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl p-8 space-y-8 border-4 border-orange-100">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-orange-500 italic tracking-tighter">パシャ飯</h1>
          <p className="text-gray-400 font-bold text-sm">
            {isSignUp ? '新しくアカウントを作る' : 'おかえりなさい！'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Email</label>
            <input 
              type="email" 
              placeholder="example@mail.com" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-orange-300 font-bold text-gray-700 transition-all"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-orange-300 font-bold text-gray-700 transition-all"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <><UserPlus size={20} /> 登録する</> : <><LogIn size={20} /> ログイン</>)}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'まだアカウントをお持ちでない方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}