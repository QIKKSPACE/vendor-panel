import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';

const Promotion: React.FC = () => {
  const [formData, setFormData] = useState({
    promotionType: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Promotion Form Data:', formData);
    alert('Promotion created successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Promotion</h1>
              <p className="text-gray-600">Simple promotion form</p>
            </div>
          </div>
        </div>

        {/* Simple Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Promotion Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Type *
              </label>
              <select
                name="promotionType"
                required
                value={formData.promotionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select promotion type</option>
                <option value="discount">Discount Promotion</option>
                <option value="bundle">Bundle Offer</option>
                <option value="seasonal">Seasonal Promotion</option>
                <option value="referral">Referral Program</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your promotion..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Promotion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Promotion;