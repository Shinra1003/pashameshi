"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Loader2, Calendar, X, Snowflake, Box, Thermometer } from 'lucide-react';

export default function ShoppingList() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: '個' });
  const [isLoading, setIsLoading] = useState(false);
  
  // 期限選択モーダル用の状態
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [storageType, setStorageType] = useState('冷蔵'); // 保存場所の状態を追加

  const fetchList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    const groupId = profile?.group_id;
    let query = supabase.from('shopping_list').select('*');

    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { 
    fetchList(); 
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setExpiryDate(d.toISOString().split('T')[0]);
  }, []);

  const addItem = async () => {
    if (!newItem.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    const { error } = await supabase.from('shopping_list').insert([{ 
      ...newItem, 
      user_id: user.id,
      group_id: profile?.group_id
    }]);

    if (!error) {
      setNewItem({ name: '', quantity: 1, unit: '個' });
      fetchList();
    }
  };

  const handleConfirmMove = async () => {
    if (!selectedItem) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();
      
      const groupId = profile?.group_id;

      // 保存場所 (storageType) を既存チェックの条件に含める
      let fetchQuery = supabase.from('ingredients').select('id, quantity')
        .eq('name', selectedItem.name)
        .eq('storage_type', storageType)
        .eq('expiry_date', expiryDate);

      if (groupId) {
        fetchQuery = fetchQuery.eq('group_id', groupId);
      } else {
        fetchQuery = fetchQuery.eq('user_id', user.id).is('group_id', null);
      }

      const { data: existing } = await fetchQuery.maybeSingle();

      if (existing) {
        await supabase
          .from('ingredients')
          .update({ quantity: existing.quantity + selectedItem.quantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('ingredients').insert([{
          name: selectedItem.name,
          quantity: selectedItem.quantity,
          unit: selectedItem.unit,
          expiry_date: expiryDate,
          storage_type: storageType, // 選択された保存場所を使用
          genre: 'その他',
          user_id: user.id,
          group_id: groupId
        }]);
      }

      await supabase.from('shopping_list').delete().eq('id', selectedItem.id);
      setSelectedItem(null);
      fetchList();
    } catch (error) {
      alert("移動に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);
    if (!error) fetchList();
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-20">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <input 
          value={newItem.name}
          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
          placeholder="買うものをメモ..."
          className="w-full p-2 outline-none font-black text-base border-b border-gray-50"
        />
        <div className="flex gap-2 items-center">
          <div className="flex-[2] flex items-center bg-gray-50 rounded-xl px-2">
            <span className="text-[10px] font-black text-gray-400 mr-2">QTY</span>
            <input type="number" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})} className="w-full bg-transparent p-2 outline-none font-bold text-sm" />
          </div>
          <div className="flex-[2] flex items-center bg-gray-50 rounded-xl px-2">
            <span className="text-[10px] font-black text-gray-400 mr-2">UNIT</span>
            <input 
              list="shopping-units" 
              value={newItem.unit} 
              onChange={(e) => setNewItem({...newItem, unit: e.target.value})} 
              onFocus={(e) => e.target.value = ''}
              onBlur={(e) => { if(!e.target.value) e.target.value = newItem.unit }}
              className="w-full bg-transparent p-2 outline-none font-bold text-sm" 
            />
          </div>
          <button onClick={addItem} className="flex-1 p-3 bg-orange-500 text-white rounded-xl active:scale-95 transition flex justify-center"><Plus size={20} /></button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
            <div className="flex flex-col">
              <span className="font-black text-gray-800">{item.name}</span>
              <span className="text-[10px] text-orange-500 font-black bg-orange-50 px-2 py-0.5 rounded-full w-fit">{item.quantity} {item.unit}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedItem(item)}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black active:scale-95 transition"
              >
                完了
              </button>
              <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-200 hover:text-red-400"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800">在庫へ移動</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              {/* 保存場所の選択 */}
              <div>
                <label className="text-[10px] text-gray-400 font-black ml-1 uppercase tracking-widest">Storage Type</label>
                <div className="flex gap-2 mt-1 bg-gray-50 p-1 rounded-xl">
                  {['冷蔵', '冷凍', '常温'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setStorageType(type)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black transition-all ${
                        storageType === type 
                          ? 'bg-white text-orange-500 shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {type === '冷蔵' && <Snowflake size={12} />}
                      {type === '冷凍' && <Box size={12} />}
                      {type === '常温' && <Thermometer size={12} />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 期限設定 */}
              <div>
                <label className="text-[10px] text-gray-400 font-black ml-1 uppercase tracking-widest">Expiry Date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none z-10" size={18} />
                  <input 
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50 rounded-xl font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-300 appearance-none"
                    style={{ WebkitAppearance: 'none', minHeight: '3rem' }}
                  />
                </div>
              </div>

              <button 
                onClick={handleConfirmMove}
                disabled={isLoading}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95 transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "冷蔵庫へ入れる"}
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="shopping-units">
          <option value="個" /><option value="本" /><option value="g" /><option value="パック" /><option value="枚" /><option value="袋" /><option value="玉" /><option value="ml" />
      </datalist>
    </div>
  );
}