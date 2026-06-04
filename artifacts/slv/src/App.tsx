import { Switch, Route, Router as WouterRouter } from "wouter";
import { LanguageProvider } from "@/lib/i18n";
import { Layout } from "@/components/layout";
import { SupportWidget } from "@/components/support-widget";

import Home from "@/pages/home";
import Like from "@/pages/like";
import Visit from "@/pages/visit";
import AutoLike from "@/pages/auto-like";
import PlayerInfo from "@/pages/player-info";
import PriceList from "@/pages/price-list";
import Giveaway from "@/pages/giveaway";
import CheckKey from "@/pages/check-key";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/like" component={Like} />
      <Route path="/visit" component={Visit} />
      <Route path="/auto-like" component={AutoLike} />
      <Route path="/player-info" component={PlayerInfo} />
      <Route path="/price-list" component={PriceList} />
      <Route path="/giveaway" component={Giveaway} />
      <Route path="/check-key" component={CheckKey} />
      <Route path="/nirobff360adminp" component={AdminLogin} />
      <Route path="/nirobff360adminp/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Router />
        </Layout>
        <SupportWidget />
      </WouterRouter>
    </LanguageProvider>
  );
}

export default App;
