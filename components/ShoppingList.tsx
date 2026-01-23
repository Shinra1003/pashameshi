"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Loader2, Calendar, X } from 'lucide-react';

export default function ShoppingList() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: '個' });
  const [isLoading, setIsLoading] = useState(false);
  
  // 期限選択モーダル用の状態
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [expiryDate, setExpiryDate] = useState('');

  // リストの取得（決定表ルール適用）
  const fetchList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. プロフィールから所属グループを確認
    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    const groupId = profile?.group_id;
    let query = supabase.from('shopping_list').select('*');

    // 2. 【決定表】グループがあれば共有モード、なければ個人モード
    if (groupId) {
      query = query.eq('group_id', groupId); // 共有モード：グループ優先
    } else {
      query = query.eq('user_id', user.id);    // 個人モード：自分のIDなら何でもOK
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

  // アイテム追加（決定表ルール適用）
  const addItem = async () => {
    if (!newItem.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 現在のグループ状況を確認
    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    // 保存時に user_id と group_id 両方をセット（解除後の持ち帰りのため）
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

  // 「完了（冷蔵庫へ移動）」の処理
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
      const storageType = '冷蔵';

      // 在庫テーブル内での既存チェック
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
        // 新規登録時も user_id と group_id を両方保持
        await supabase.from('ingredients').insert([{
          name: selectedItem.name,
          quantity: selectedItem.quantity,
          unit: selectedItem.unit,
          expiry_date: expiryDate,
          storage_type: storageType,
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
            <input list="shopping-units" value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="w-full bg-transparent p-2 outline-none font-bold text-sm" />
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
              <h3 className="font-black text-gray-800">賞味期限を設定</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4 font-bold">「{selectedItem.name}」の期限</p>
            <div className="relative mb-6">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
              <input 
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-orange-50 rounded-xl font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-300"
              />
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
      )}

      <datalist id="shopping-units">
        <option value="個" /><option value="本" /><option value="g" /><option value="パック" /><option value="袋" />
      </datalist>
    </div>
  );
}