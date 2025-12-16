
import React from 'react';
import { VIP_CATEGORIES } from '../constants';
import { Star } from 'lucide-react';

export const VIPShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif text-white mb-2">The Lord's Collection</h2>
        <p className="text-gold-500 uppercase tracking-[0.3em] text-sm">Exclusive VIP Categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {VIP_CATEGORIES.map((cat) => (
          <div key={cat.id} className="group relative bg-neutral-900 border border-neutral-800 overflow-hidden rounded-xl hover:border-gold-700 transition-all duration-300 h-64 flex flex-col justify-end p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            
            {/* Decorative BG pattern or placeholder */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1594938298603-c8148c472996?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-105 duration-700"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-gold-500 fill-gold-500" />
                <span className="text-xs text-gold-500 font-bold uppercase tracking-widest">Series {cat.id}</span>
              </div>
              <h3 className="text-xl font-serif text-white mb-2 group-hover:text-gold-400 transition-colors">{cat.title}</h3>
              <p className="text-neutral-400 text-sm line-clamp-2 group-hover:text-neutral-200 transition-colors">{cat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
