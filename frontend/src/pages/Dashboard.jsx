import React from "react";
import AppLayout from "../components/layout/AppLayout";
import { Package, Users, ShoppingCart, TrendingUp } from "lucide-react";

const statCards = [
  { title: "Total Revenue", value: "$45,231.89", trend: "+20.1%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
  { title: "Total Orders", value: "356", trend: "+5.4%", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Active Customers", value: "1,245", trend: "+12.5%", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  { title: "Total Products", value: "84", trend: "-2.3%", icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className={stat.trend.startsWith("+") ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {stat.trend}
                  </span>
                  <span className="ml-2 text-gray-400">from last month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Placeholder for charts or recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col items-center justify-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Revenue Chart Placeholder</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-96 flex flex-col items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Recent Orders Placeholder</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
