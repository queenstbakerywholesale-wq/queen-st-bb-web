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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tiramisu" component={Tiramisu} />
      <Route path="/gelato" component={Gelato} />
      <Route path="/space" component={Space} />
      <Route path="/objects" component={Objects} />
      <Route path="/wholesale" component={Wholesale} />
      <Route path="/cake-booking" component={CakeBooking} />
      <Route path="/about" component={About} />
      <Route path="/customer-care" component={CustomerCare} />
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
