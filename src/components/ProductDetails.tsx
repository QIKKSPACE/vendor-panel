import { useState } from 'react';
import { Edit2, Trash2, Package, IndianRupee, Search, Filter, X } from 'lucide-react';
import { Product } from '../types';
import { useProductContext } from '../context/ProductContext';
import MobileSliderNav from "../components/MobileSliderNav";

// Helper to resolve backend image paths safely
const resolveImageUrl = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://api.thegroome.com${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProductDetails() {
  const { products, loading, updateProduct, deleteProduct } = useProductContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | any | null>(null);

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    selling_price: '', // Matches backend property keys perfectly
    stockQuantity: '',
    category_id: '',
    sub_category_id: '',
  });

  // State to handle complex image edits
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Safe checks for filtering using both camelCase and snake_case fallbacks
  const filteredProducts = products.filter(product => {
    const stockQty = product.stock_quantity !== undefined ? product.stock_quantity : (product.stockQuantity ?? 0);
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'in-stock' && stockQty > 0) ||
                        (stockFilter === 'out-of-stock' && stockQty === 0);
    return matchesSearch && matchesStock;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => (p.stock_quantity !== undefined ? p.stock_quantity : (p.stockQuantity ?? 0)) > 0).length,
    outOfStock: products.filter(p => (p.stock_quantity !== undefined ? p.stock_quantity : (p.stockQuantity ?? 0)) === 0).length
  };

  const handleEditProduct = (product: Product | any) => {
    const stockQty = product.stock_quantity !== undefined ? product.stock_quantity : (product.stockQuantity ?? 0);
    
    setEditFormData({
      name: product.name,
      description: product.description,
      mrp: (product.mrp || product.price || 0).toString(),
      selling_price: (product.selling_price || 0).toString(), // Populates properly from API snake_case format
      stockQuantity: stockQty.toString(),
      category_id: product.category_id ?? '',
      sub_category_id: product.sub_category_id ?? '',
    });
    
    // Fallback to legacy structure if type context hasn't changed yet
    const productImages = product.images || (product.imageUrl ? [{ id: 'legacy', image_url: product.imageUrl, is_primary: true }] : []);
    setExistingImages(productImages);
    setNewFiles([]); 
    setEditingProduct(product);
    setShowEditForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveExistingImage = (id: number | string) => {
    setExistingImages(existingImages.filter(img => img.id !== id));
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    // Extract only the string URLs that your backend expects for existingImages evaluation
    const keptImageUrls = existingImages.map(img => img.image_url);

    // Structure a clean data object matching your updated ProductContext API signature
    const updatePayload = {
      name: editFormData.name,
      description: editFormData.description,
      mrp: Number(editFormData.mrp),
      selling_price: Number(editFormData.selling_price),
      stockQuantity: Number(editFormData.stockQuantity),
      category_id: editFormData.category_id || undefined,
      sub_category_id: editFormData.sub_category_id || undefined,
      status: 'active' as const,
      existingImages: keptImageUrls, // Extracted paths for the JSON payload
      images: newFiles,       // Unprocessed file binaries
    };

    // Forward the structural payload directly to the custom handler logic
    await updateProduct(editingProduct.id, updatePayload);

    setShowEditForm(false);
    setEditingProduct(null);
    setNewFiles([]);
    setExistingImages([]);
    setEditFormData({
      name: '',
      description: '',
      mrp: '',
      selling_price: '',
      stockQuantity: '',
      category_id: "",
      sub_category_id: "",
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  const getStockBadge = (stockQuantity: number) => {
    return stockQuantity > 0 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <MobileSliderNav />

      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Product Details</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">In Stock</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.inStock}</p>
            </div>
            <Filter className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.outOfStock}</p>
            </div>
            <Filter className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      {/* Edit Form */}
      {showEditForm && editingProduct && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Product</h3>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP (Original Price) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.mrp}
                  onChange={(e) => setEditFormData({ ...editFormData, mrp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.selling_price}
                  onChange={(e) => setEditFormData({ ...editFormData, selling_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={editFormData.stockQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Images Managing UI */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <p className="block text-sm font-medium text-gray-700 mb-3">Product Images</p>
              
              {/* Existing Server Images list */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Currently Stored:</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                        <img 
                          src={resolveImageUrl(img.image_url)} 
                          alt="Product detail view" 
                          className="w-full h-full object-cover"
                        />
                        {img.is_primary && (
                          <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-[10px] text-white text-center font-bold py-0.5">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Multiple New Binaries */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Upload New Image Files:</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {newFiles.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    {newFiles.length} new file(s) selected to upload.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Update Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProduct(null);
                  setNewFiles([]);
                  setExistingImages([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {products.length === 0 ? 'No products found. Upload your first product!' : 'No products match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: any) => {
            const primaryImgObj = product.images?.find((img: any) => img.is_primary) || product.images?.[0];
            const renderUrl = primaryImgObj ? primaryImgObj.image_url : product.imageUrl;
            
            // Handles data mapping variant safeguards seamlessly
            const originalPrice = Number(product.mrp || product.price || 0);
            const sellingPrice = Number(product.selling_price || 0);
            const displayStock = product.stock_quantity !== undefined ? product.stock_quantity : (product.stockQuantity ?? 0);

            return (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Product Image Display with Resolved URL */}
                {renderUrl && (
                  <div className="mb-4">
                    <img
                      src={resolveImageUrl(renderUrl)}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-800 truncate">{product.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStockBadge(displayStock)}`}>
                      {displayStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                  <div className="flex items-center flex-wrap gap-x-2">
                    {/* Selling Price Display */}
                    <div className="flex items-center gap-0.5 text-green-600 font-bold text-base">
                      <IndianRupee className="w-4 h-4" />
                      {sellingPrice.toFixed(2)}
                    </div>
                    {/* MRP Display if higher than selling price */}
                    {originalPrice > sellingPrice && (
                      <div className="flex items-center gap-0.5 text-gray-400 line-through text-xs">
                        <IndianRupee className="w-3 h-3" />
                        {originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500">
                    Stock: {displayStock}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(product.created_at || product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}