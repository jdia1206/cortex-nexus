import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Company from "./pages/settings/Company";
import Users from "./pages/settings/Users";
import Branches from "./pages/settings/Branches";
import Warehouses from "./pages/settings/Warehouses";
import Billing from "./pages/settings/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected App Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="/purchases" element={
              <ProtectedRoute>
                <Purchases />
              </ProtectedRoute>
            } />
            
            {/* Settings Routes */}
            <Route path="/settings/company" element={
              <ProtectedRoute>
                <Company />
              </ProtectedRoute>
            } />
            <Route path="/settings/users" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/settings/branches" element={
              <ProtectedRoute>
                <Branches />
              </ProtectedRoute>
            } />
            <Route path="/settings/warehouses" element={
              <ProtectedRoute>
                <Warehouses />
              </ProtectedRoute>
            } />
            <Route path="/settings/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
