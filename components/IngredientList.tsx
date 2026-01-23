"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, Snowflake, Thermometer, Box, AlertCircle } from 'lucide-react';

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('冷蔵');
  const [loading, setLoading] = useState(true);

  const fetchIngredients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. プロフィールから現在の所属グループを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    const groupId = profile?.group_id;
    let query = supabase.from('ingredients').select('*').eq('storage_type', activeFilter);

    // 2. 【決定表ロジック】グループIDがあれば共有モード、なければ個人モード
    if (groupId) {
      query = query.eq('group_id', groupId); // 共有モード：グループ優先
    } else {
      query = query.eq('user_id', user.id);    // 個人モード：自分のIDなら何でもOK
    }

    const { data, error } = await query.order('expiry_date', { ascending: true });
    
    if (!error && data) setIngredients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIngredients();
  }, [activeFilter]);

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (!error) fetchIngredients();
  };

  const getExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateStr);
    expiryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "expired";
    if (diffDays <= 3) return "urgent";
    return "safe";
  };

  return (
    <div className="w-full max-w-md mx-auto px-2">
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        {['冷蔵', '冷凍', '常温'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-black transition-all ${
              activeFilter === type 
                ? 'bg-white text-orange-500 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {type === '冷蔵' && <Snowflake size={14} />}
            {type === '冷凍' && <Box size={14} />}
            {type === '常温' && <Thermometer size={14} />}
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 animate-pulse text-sm font-bold">読み込み中...</div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <p className="text-gray-300 font-bold text-sm">{activeFilter}庫は空っぽです</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ingredients.map((item) => {
            const status = getExpiryStatus(item.expiry_date);
            return (
              <div 
                key={item.id} 
                className={`group flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all ${
                  status === 'expired' ? 'bg-red-50 border-red-100' : 
                  status === 'urgent' ? 'bg-white border-orange-200' : 
                  'bg-white border-gray-50'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className={`font-black tracking-tight ${status === 'expired' ? 'text-red-700' : 'text-gray-800'}`}>
                      {item.name}
                    </h3>
                    {/* --- 【追加】数量と単位の表示 --- */}
                    <span className="text-xs font-bold text-gray-400">
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    status === 'expired' ? 'bg-red-200 text-red-700 animate-pulse' :
                    status === 'urgent' ? 'bg-orange-100 text-orange-600' :
                    'bg-orange-50 text-orange-500'
                  }`}>
                    {status !== 'safe' ? <AlertCircle size={12} /> : <Calendar size={12} />}
                    期限: {item.expiry_date}
                    {status === 'expired' && " (期限切れ!)"}
                  </div>
                </div>
                <button 
                  onClick={() => deleteIngredient(item.id)}
                  className="p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}