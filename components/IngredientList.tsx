"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, Snowflake, Thermometer, Box, AlertCircle, Edit2, Check, X, Loader2 } from 'lucide-react';

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('冷蔵');
  const [loading, setLoading] = useState(true);
  
  // 編集用の状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: 0, unit: '', expiry_date: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIngredients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('group_id').eq('id', user.id).single();
    const groupId = profile?.group_id;

    let query = supabase.from('ingredients').select('*').eq('storage_type', activeFilter);
    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.eq('user_id', user.id).is('group_id', null);
    }

    const { data, error } = await query.order('expiry_date', { ascending: true });
    if (!error && data) setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchIngredients(); }, [activeFilter]);

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ 
      name: item.name, 
      quantity: item.quantity, 
      unit: item.unit,
      expiry_date: item.expiry_date 
    });
  };

  const saveEdit = async (id: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: editForm.name,
          quantity: editForm.quantity,
          unit: editForm.unit,
          expiry_date: editForm.expiry_date
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      fetchIngredients();
    } catch (error) {
      alert("更新に失敗しました。");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("削除しますか？")) return;
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
    <div className="w-full max-w-md mx-auto">
      {/* タブ部分：背景 #F2F2F7, 角丸 22px */}
      <div className="flex gap-1 mb-8 bg-[#F2F2F7] p-1.5 rounded-[22px]">
        {[
          { label: '冷蔵', icon: <Snowflake size={16} /> },
          { label: '冷凍', icon: <Box size={16} /> },
          { label: '常温', icon: <Thermometer size={16} /> }
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveFilter(tab.label)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-sm font-black transition-all ${
              activeFilter === tab.label 
                ? 'bg-white text-orange-500 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                : 'text-[#8E8E93]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 animate-pulse text-sm font-bold">読み込み中...</div>
      ) : ingredients.length === 0 ? (
        /* 空の状態：背景白、点線枠 #E5E5EA、角丸 45px */
        <div className="mt-2 flex items-center justify-center min-h-[220px] bg-white rounded-[45px] border-[2px] border-dashed border-[#E5E5EA]">
          <p className="text-[#C7C7CC] font-black text-base tracking-widest text-center">
            {activeFilter}庫は空っぽです
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ingredients.map((item) => {
            const status = getExpiryStatus(item.expiry_date);
            
            if (editingId === item.id) {
              return (
                <div key={item.id} className="flex flex-col gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="flex gap-2">
                    <input className="flex-1 p-2 rounded-lg border-none font-bold text-sm outline-none bg-white" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                    <input type="number" className="w-14 p-2 rounded-lg border-none font-bold text-sm text-center outline-none bg-white" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: Number(e.target.value)})} />
                    <input 
                      list="unit-choices-list" 
                      className="w-16 p-2 rounded-lg border-none font-bold text-sm outline-none bg-white text-center" 
                      value={editForm.unit} 
                      onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <input type="date" className="p-2 rounded-lg border-none font-bold text-xs outline-none bg-white text-gray-600" value={editForm.expiry_date} onChange={(e) => setEditForm({...editForm, expiry_date: e.target.value})} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(item.id)} className="p-2 bg-green-500 text-white rounded-xl shadow-sm">{isUpdating ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>}</button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-500 rounded-xl shadow-sm"><X size={16}/></button>
                    </div>
                  </div>
                </div>
              );
            }

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
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(item)} className="p-2 text-gray-200 hover:text-blue-400 transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteIngredient(item.id)} className="p-2 text-gray-200 hover:text-red-400 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 単位の datalist */}
      <datalist id="unit-choices-list">
        <option value="個" />
        <option value="本" />
        <option value="g" />
        <option value="パック" />
        <option value="枚" />
        <option value="袋" />
        <option value="玉" />
        <option value="ml" />
      </datalist>
    </div>
  );
}