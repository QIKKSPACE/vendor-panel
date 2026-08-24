import { ProductProvider } from "./context/ProductContext";
import { ServiceProvider } from "./context/ServiceContext";
import { AuthProvider } from "./context/UserContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import { Route, Routes } from "react-router-dom";
import Profile from "./pages/Profile";
import UploadProduct from "./components/UploadProduct";
import ProductDetails from "./components/ProductDetails";
import ManageSlots from "./components/ManageSlots";
import ManageServices from "./components/ManageServices";
import { WebflowProvider } from "./context/WebflowContext";
import AcceptServiceRequests from "./components/AcceptServiceRequests";
import { VendorFlowProvider } from "./context/VendorFlowContext";
import Promotion from "./components/Promotion";
import AcceptOrders from "./components/AcceptOrders";

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <ServiceProvider>
          <WebflowProvider>
            <VendorFlowProvider>
              <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/all"
                element={
                  <ProtectedRoute>
                    <ProductDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/add"
                element={
                  <ProtectedRoute>
                    <UploadProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/orders"
                element={
                  <ProtectedRoute>
                    <AcceptOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services/slots"
                element={
                  <ProtectedRoute>
                    <ManageSlots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services/add"
                element={
                  <ProtectedRoute>
                    <ManageServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services/orders"
                element={
                  <ProtectedRoute>
                    <AcceptServiceRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/promotion"
                element={
                  <ProtectedRoute>
                    <Promotion />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </VendorFlowProvider>
          </WebflowProvider>
        </ServiceProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
