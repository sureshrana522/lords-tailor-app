
import React from 'react';
import { MOCK_INVENTORY } from '../constants';
import { AlertCircle, Plus } from 'lucide-react';

export const MaterialInventory: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-white">Material Inventory</h2>
        <button className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded flex items-center gap-2 font-bold text-sm">
          <Plus className="h-4 w-4" /> Add Stock
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-neutral-900 text-gold-500 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-4">Item Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-black/50">
            {MOCK_INVENTORY.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-900/50 transition-colors">
                <td className="p-4 font-medium text-white">{item.name}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4 font-mono">{item.quantity} {item.unit}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    item.status === 'Low Stock' 
                      ? 'bg-red-900/20 text-red-500 border-red-900' 
                      : 'bg-green-900/20 text-green-500 border-green-900'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                   <button className="text-gold-600 hover:text-gold-400 font-bold text-xs uppercase">Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Low Stock Alert */}
      {MOCK_INVENTORY.some(i => i.status === 'Low Stock') && (
        <div className="bg-red-900/10 border border-red-900 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="text-red-500 font-bold text-sm">Attention Needed</h4>
            <p className="text-neutral-400 text-xs mt-1">Some items are running low. Please create a purchase order for vendors.</p>
          </div>
        </div>
      )}
    </div>
  );
};
