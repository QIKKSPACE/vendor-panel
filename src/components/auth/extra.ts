import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Package, Wrench, BarChart3, LogOut, User, Phone, Mail, MapPin, ChevronDown, Megaphone } from 'lucide-react';
import Login from './components/Login';
import UploadProduct from './components/UploadProduct';
import AcceptOrders from './components/AcceptOrders';
import ProductHistory from './components/ProductHistory';
import ProductDetails from './components/ProductDetails';
import ManageSlots from './components/ManageSlots';
import ManageServices from './components/ManageServices';
import AcceptServiceRequests from './components/AcceptServiceRequests';
import ServiceHistory from './components/ServiceHistory';
import MobileSliderNav from './components/MobileSliderNav';
import Promotion from './components/Promotion';
import { Product, ProductOrder, Service, ServiceCategory, ServiceSlot, ServiceRequest } from './types';

type MainSection = 'products' | 'services' | 'dashboard' | 'profile' | 'promotion';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Main Dashboard Component
function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get current section from URL
  const getCurrentSection = (): MainSection => {
    const path = location.pathname;
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/services')) return 'services';
    if (path.startsWith('/promotion')) return 'promotion';
    if (path.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const getCurrentSubsection = (): string => {
    const path = location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1] || 'upload';
  };

  const mainSection = getCurrentSection();
  const currentSubsection = getCurrentSubsection();

  // Profile data
  const profileData = {
    name: "John Smith",
    mobile: "+91 98765 43210",
    email: "john.smith@groome.com",
    pincode: "110001"
  };

  // Profile dropdown data
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [newPincode, setNewPincode] = useState(profileData.pincode);

  const [products, setProducts] = useState<Product[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([
    {
      id: '1',
      productId: '1',
      productName: 'Sample Product',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      quantity: 2,
      totalAmount: 199.98,
      status: 'pending',
      orderDate: new Date()
    }
  ]);

  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceSlots, setServiceSlots] = useState<ServiceSlot[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([
    {
      id: '1',
      serviceId: '1',
      serviceName: 'Hair Cut & Styling',
      slotId: '1',
      slotDate: '2024-01-15',
      slotTime: '10:00 AM - 11:00 AM',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '+1234567890',
      customerAddress: '123 Main Street, Apartment 4B, New York, NY 10001',
      status: 'pending',
      requestDate: new Date()
    }
  ]);

  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      ...productData,
      createdAt: new Date()
    };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(products.map(product => {
      if (product.id === productId) {
        return { ...product, ...updates };
      }
      return product;
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handlePincodeChange = (newPincode?: string) => {
    if (newPincode) {
      // Called from mobile slider
      profileData.pincode = newPincode;
    } else {
      // Called from desktop profile dropdown
      if (isEditingPincode) {
        // Save the new pincode
        profileData.pincode = newPincode || profileData.pincode;
      setIsEditingPincode(false);
    } else {
      // Start editing
      setIsEditingPincode(true);
      }
    }
  };

  const handlePincodeCancel = () => {
    setNewPincode(profileData.pincode);
    setIsEditingPincode(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'accepted' | 'rejected' | 'completed') => {
    setProductOrders(productOrders.map(order => {
      if (order.id === orderId) {
        const updates: Partial<ProductOrder> = { status };
        if (status === 'accepted') updates.acceptedAt = new Date();
        if (status === 'completed') updates.completedAt = new Date();
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  const handleAddService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'categoryName'>) => {
    const category = serviceCategories.find(c => c.id === serviceData.categoryId);
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      ...serviceData,
      categoryName: category?.name || '',
      createdAt: new Date()
    };
    setServices([...services, newService]);
  };

  const handleUpdateService = (serviceId: string, updates: Partial<Service>) => {
    setServices(services.map(service => {
      if (service.id === serviceId) {
        if (updates.categoryId) {
          const category = serviceCategories.find(c => c.id === updates.categoryId);
          updates.categoryName = category?.name || service.categoryName;
        }
        return { ...service, ...updates };
      }
      return service;
    }));
  };

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  const handleAddCategory = (categoryData: Omit<ServiceCategory, 'id' | 'createdAt'>) => {
    const newCategory: ServiceCategory = {
      id: Math.random().toString(36).substr(2, 9),
      ...categoryData,
      createdAt: new Date()
    };
    setServiceCategories([...serviceCategories, newCategory]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setServiceCategories(serviceCategories.filter(c => c.id !== categoryId));
  };

  const handleAddSlot = (slotData: Omit<ServiceSlot, 'id' | 'createdAt'>) => {
    const newSlot: ServiceSlot = {
      id: Math.random().toString(36).substr(2, 9),
      ...slotData,
      createdAt: new Date()
    };
    setServiceSlots([...serviceSlots, newSlot]);
  };

  const handleDeleteSlot = (slotId: string) => {
    setServiceSlots(serviceSlots.filter(s => s.id !== slotId));
  };

  const handleToggleAvailability = (slotId: string) => {
    setServiceSlots(serviceSlots.map(slot =>
      slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
    ));
  };

  const handleUpdateRequestStatus = (requestId: string, status: 'accepted' | 'rejected' | 'completed') => {
    setServiceRequests(serviceRequests.map(request => {
      if (request.id === requestId) {
        const updates: Partial<ServiceRequest> = { status };
        if (status === 'accepted') updates.acceptedAt = new Date();
        if (status === 'completed') updates.completedAt = new Date();
        return { ...request, ...updates };
      }
      return request;
    }));
  };

  const mainNavigationItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { id: 'products', icon: Package, label: 'Products', path: '/products/upload' },
    { id: 'services', icon: Wrench, label: 'Services', path: '/services/manage' },
    { id: 'promotion', icon: Megaphone, label: 'Promotion', path: '/promotion' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  const getSubNavigationItems = (section: MainSection) => {
    switch (section) {
      case 'products':
        return [
          { id: 'upload', label: 'Add Product', path: '/products/upload' },
          { id: 'details', label: 'Product Details', path: '/products/details' },
          { id: 'accept-orders', label: 'Accept Orders', path: '/products/accept-orders' },
          { id: 'history', label: 'Product History', path: '/products/history' }
        ];
      case 'services':
        return [
          { id: 'manage', label: 'Add Service', path: '/services/manage' },
          { id: 'slots', label: 'Time Slots', path: '/services/slots' },
          { id: 'requests', label: 'Accept Requests', path: '/services/servicerequests' },
          { id: 'history', label: 'Service History', path: '/services/history' }
        ];
      default:
        return [];
    }
  };


          return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Slider Navigation */}
      <MobileSliderNav />

      {/* Desktop Main Navigation Sidebar */}
      <div className="hidden lg:flex w-16 bg-black flex-col items-center py-4">
        {mainNavigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-12 h-12 flex items-center justify-center rounded-lg mb-2 transition-all ${
                mainSection === item.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-200 hover:bg-gray-700 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
        
        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-200 hover:bg-gray-700 hover:text-white transition-all"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>


      {/* Desktop Secondary Navigation */}
      {getSubNavigationItems(mainSection).length > 0 && (
        <div className="hidden lg:block w-64 bg-white border-r border-gray-200 py-4">
          <div className="px-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {mainNavigationItems.find(item => item.id === mainSection)?.label}
            </h3>
          </div>
          <nav className="space-y-1">
            {getSubNavigationItems(mainSection).map((item) => {
              const isActive = currentSubsection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-all relative ${
                    isActive
                      ? 'text-black bg-gray-50 border-r-4 border-black'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/navlogo.png" 
                alt="Groome Logo" 
                className="w-80 h-16 object-contain"
              />
            </div>
            
            {/* Profile Section */}
            <div className="flex items-center gap-6">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {/* Profile Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{profileData.name}</h3>
                          <p className="text-sm text-gray-500">Vendor Admin</p>
                        </div>
                      </button>
                    </div>
                    
                    {/* Profile Details */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{profileData.mobile}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{profileData.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {isEditingPincode ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newPincode}
                                onChange={(e) => setNewPincode(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent w-20"
                                placeholder="Pincode"
                              />
                              <button
                                onClick={() => handlePincodeChange(newPincode)}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handlePincodeCancel}
                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">Pincode: {profileData.pincode}</span>
                              <button
                                onClick={() => handlePincodeChange()}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    
                    {/* Actions */}
                    <div className="px-4 py-3">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pt-16 lg:pt-6 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dashboard</h2>
                <p className="text-gray-800 font-semibold">Welcome to Groome Vendor CRM Panel</p>
              </div>
            } />
            <Route path="/products/upload" element={<UploadProduct onAddProduct={handleAddProduct} />} />
            <Route path="/products/details" element={
              <ProductDetails
                products={products}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            } />
            <Route path="/products/accept-orders" element={
              <AcceptOrders
                orders={productOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            } />
            <Route path="/products/history" element={<ProductHistory orders={productOrders} />} />
            <Route path="/services/manage" element={
              <ManageServices
                services={services}
                categories={serviceCategories}
                onAddService={handleAddService}
                onUpdateService={handleUpdateService}
                onDeleteService={handleDeleteService}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            } />
            <Route path="/services/slots" element={
              <ManageSlots
                slots={serviceSlots}
                services={services}
                onAddSlot={handleAddSlot}
                onDeleteSlot={handleDeleteSlot}
                onToggleAvailability={handleToggleAvailability}
              />
            } />
            <Route path="/services/servicerequests" element={
              <AcceptServiceRequests
                requests={serviceRequests}
                onUpdateRequestStatus={handleUpdateRequestStatus}
              />
            } />
            <Route path="/services/history" element={<ServiceHistory requests={serviceRequests} />} />
            <Route path="/promotion" element={<Promotion />} />
            <Route path="/profile" element={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Profile</h2>
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                      <p className="text-gray-500">Vendor Admin</p>
                    </div>
                  </div>
                  
                  {/* Profile Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-gray-900">{profileData.mobile}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-gray-900">{profileData.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Pincode</p>
                            <p className="text-gray-900">{profileData.pincode}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Account Settings</h4>
                      <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <p className="font-medium text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-500">Update your account password</p>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <p className="font-medium text-gray-900">Notification Settings</p>
                          <p className="text-sm text-gray-500">Manage your notification preferences</p>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <p className="font-medium text-gray-900">Privacy Settings</p>
                          <p className="text-sm text-gray-500">Control your privacy and data</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/products/upload" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Login Component with Authentication


// Main App Component with Router
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
