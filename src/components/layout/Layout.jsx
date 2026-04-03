import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    setSearchTerm("");
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100">

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        <Header 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ searchTerm }} />
        </main>

      </div>
    </div>
  );
}