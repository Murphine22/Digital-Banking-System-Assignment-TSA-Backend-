import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Home, Users, Send, History, Settings, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AdminDashboardProps {
  children?: React.ReactNode;
}

export default function AdminDashboard({ children }: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                PB
              </div>
              <h1 className="text-xl font-bold text-white">Phoenix Bank</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">
              <p className="font-medium text-white">{user?.name || "Admin"}</p>
              <p className="text-xs">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } bg-slate-950 border-r border-slate-700 transition-all duration-300 overflow-hidden`}
        >
          <nav className="p-6 space-y-2">
            <NavItem icon={Home} label="Dashboard" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <NavItem icon={Users} label="Customers" active={activeTab === "customers"} onClick={() => setActiveTab("customers")} />
            <NavItem icon={Send} label="Transfers" active={activeTab === "transfers"} onClick={() => setActiveTab("transfers")} />
            <NavItem icon={History} label="Transactions" active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} />
            <NavItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children || (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-800 border border-slate-700">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="data-[state=active]:bg-emerald-600">
                    Customers
                  </TabsTrigger>
                  <TabsTrigger value="transfers" className="data-[state=active]:bg-emerald-600">
                    Transfers
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="data-[state=active]:bg-emerald-600">
                    Transactions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <DashboardOverview />
                </TabsContent>

                <TabsContent value="customers" className="space-y-6 mt-6">
                  <CustomersSection />
                </TabsContent>

                <TabsContent value="transfers" className="space-y-6 mt-6">
                  <TransfersSection />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6 mt-6">
                  <TransactionsSection />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-emerald-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value="0" icon="👥" trend="+0%" />
        <StatCard title="Total Accounts" value="0" icon="🏦" trend="+0%" />
        <StatCard title="Total Transactions" value="0" icon="💳" trend="+0%" />
        <StatCard title="Total Volume" value="₦0" icon="💰" trend="+0%" />
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
          <CardDescription>Latest banking activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-center py-8">
            No transactions yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomersSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Customers</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Add Customer</Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Customer List</CardTitle>
          <CardDescription>Manage bank customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-center py-8">
            No customers yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransfersSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Fund Transfers</h2>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">New Transfer</CardTitle>
          <CardDescription>Initiate a fund transfer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300">From Account</label>
              <input
                type="text"
                placeholder="Account number"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">To Account</label>
              <input
                type="text"
                placeholder="Recipient account"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Amount (₦)</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Description</label>
              <input
                type="text"
                placeholder="Optional"
                className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
            </div>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Initiate Transfer</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Transaction History</h2>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Transactions</CardTitle>
          <CardDescription>Complete transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-center py-8">
            No transactions to display
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-emerald-600 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            <p className="text-xs text-emerald-400 mt-2">{trend} from last month</p>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
