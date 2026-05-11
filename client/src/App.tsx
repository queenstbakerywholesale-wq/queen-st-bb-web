import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tiramisu from "./pages/Tiramisu";
import Gelato from "./pages/Gelato";
import Space from "./pages/Space";
import Objects from "./pages/Objects";
import Wholesale from "./pages/Wholesale";
import CakeBooking from "./pages/CakeBooking";
import About from "./pages/About";
import CustomerCare from "./pages/CustomerCare";
import OrderSuccess from "./pages/OrderSuccess";
import GiftCards from "./pages/GiftCards";
import GiftCardSuccess from "./pages/GiftCardSuccess";
import MyGiftCards from "./pages/MyGiftCards";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBranches from "./pages/admin/AdminBranches";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminPageImages from "./pages/admin/AdminPageImages";
import AdminGiftCards from "./pages/admin/AdminGiftCards";
import AdminBrandStickers from "./pages/admin/AdminBrandStickers";

const ADMIN_BASE = "/admin-angela91";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/tiramisu" component={Tiramisu} />
      <Route path="/gelato" component={Gelato} />
      <Route path="/space" component={Space} />
      <Route path="/objects" component={Objects} />
      <Route path="/wholesale" component={Wholesale} />
      <Route path="/cake-booking" component={CakeBooking} />
      <Route path="/about" component={About} />
      <Route path="/customer-care" component={CustomerCare} />
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/gift-cards/success" component={GiftCardSuccess} />
      <Route path="/gift-cards/balance" component={MyGiftCards} />

      {/* Admin login */}
      <Route path={`${ADMIN_BASE}/login`} component={AdminLogin} />

      {/* Admin protected routes */}
      <Route path={`${ADMIN_BASE}`}>
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/products`}>
        <AdminLayout>
          <AdminProducts />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/orders`}>
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/shipping`}>
        <AdminLayout>
          <AdminShipping />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/bookings`}>
        <AdminLayout>
          <AdminBookings />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/customers`}>
        <AdminLayout>
          <AdminCustomers />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/branches`}>
        <AdminLayout>
          <AdminBranches />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/enquiries`}>
        <AdminLayout>
          <AdminEnquiries />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/page-images`}>
        <AdminLayout>
          <AdminPageImages />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/gift-cards`}>
        <AdminLayout>
          <AdminGiftCards />
        </AdminLayout>
      </Route>
      <Route path={`${ADMIN_BASE}/brand-stickers`}>
        <AdminLayout>
          <AdminBrandStickers />
        </AdminLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
