import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Splash from "./pages/Splash";
import License from "./pages/License";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewSale from "./pages/NewSale";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchase from "./pages/Purchase";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import OrderHistory from "./pages/OrderHistory";
import ValaBuilder from "./pages/ValaBuilder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/license" element={<License />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/new-sale" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['admin', 'reseller']}><Suppliers /></ProtectedRoute>} />
          <Route path="/purchase" element={<ProtectedRoute allowedRoles={['admin', 'reseller']}><Purchase /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'reseller']}><Reports /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
          <Route path="/vala-builder" element={<ProtectedRoute allowedRoles={['admin']}><ValaBuilder /></ProtectedRoute>} />

          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/sales" element={<Navigate to="/new-sale" replace />} />
          <Route path="/sale" element={<Navigate to="/new-sale" replace />} />
          <Route path="/product" element={<Navigate to="/products" replace />} />
          <Route path="/product-list" element={<Navigate to="/products" replace />} />
          <Route path="/category" element={<Navigate to="/categories" replace />} />
          <Route path="/client" element={<Navigate to="/customers" replace />} />
          <Route path="/customer" element={<Navigate to="/customers" replace />} />
          <Route path="/vendor" element={<Navigate to="/suppliers" replace />} />
          <Route path="/supplier" element={<Navigate to="/suppliers" replace />} />
          <Route path="/purchases" element={<Navigate to="/purchase" replace />} />
          <Route path="/stock" element={<Navigate to="/inventory" replace />} />
          <Route path="/order-history" element={<Navigate to="/orders" replace />} />
          <Route path="/report" element={<Navigate to="/reports" replace />} />
          <Route path="/factory" element={<Navigate to="/vala-builder" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
