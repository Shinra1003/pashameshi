"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // インポート先を CameraCapture と合わせる
import { Trash2, Calendar } from 'lucide-react';

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<any[]>([]);

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('expiry_date', { ascending: true });
    
    if (!error && data) setIngredients(data);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id); // match より eq が推奨
    if (!error) fetchIngredients();
  };

  if (ingredients.length === 0) return (
    <div className="text-center p-10 text-gray-500">冷蔵庫は空っぽです</div>
  );

  return (
    <div className="grid gap-3 w-full max-w-md mx-auto p-4">
      {ingredients.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
            <div className="flex items-center gap-1 text-sm text-orange-600 font-medium">
              <Calendar size={14} />
              期限: {item.expiry_date}
            </div>
          </div>
          <button onClick={() => deleteIngredient(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition">
            <Trash2 size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}