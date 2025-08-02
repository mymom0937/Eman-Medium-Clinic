"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();
export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  // Clinic Management State
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drug Inventory State
  const [drugs, setDrugs] = useState([]);
  const [lowStockDrugs, setLowStockDrugs] = useState([]);
  const [expiringDrugs, setExpiringDrugs] = useState([]);
  
  // Patient Management State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Sales & Payments State
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  
  // Services State
  const [services, setServices] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  
  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    totalDrugs: 0,
    totalSales: 0,
    totalServices: 0,
    lowStockCount: 0,
    pendingPayments: 0,
  });

  // Fetch user data and role
  const fetchUserData = async () => {
    try {
      if (!user) {
        setUserData(null);
        setUserRole(null);
        return;
      }

      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setUserData(data.user);
        setUserRole(data.user.role);
      } else {
        toast.error(data.message || "Failed to load user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    }
  };

  // Fetch drug inventory
  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/drugs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setDrugs(data.drugs);
        setLowStockDrugs(data.drugs.filter(drug => drug.stockQuantity <= drug.minStockLevel));
        setExpiringDrugs(data.drugs.filter(drug => {
          const expiryDate = new Date(drug.expiryDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expiryDate <= thirtyDaysFromNow;
        }));
      } else {
        toast.error(data.message || "Failed to load drugs");
      }
    } catch (error) {
      console.error("Error fetching drugs:", error);
      toast.error("Failed to load drug inventory");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setPatients(data.patients);
      } else {
        toast.error(data.message || "Failed to load patients");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patient records");
    }
  };

  // Fetch sales data
  const fetchSales = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/sales", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setSales(data.sales);
        
        // Calculate today's sales
        const today = new Date();
        const todaySalesData = data.sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.toDateString() === today.toDateString();
        });
        const todayTotal = todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
        setTodaySales(todayTotal);
        
        // Calculate monthly sales
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const monthlySalesData = data.sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
        });
        const monthlyTotal = monthlySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
        setMonthlySales(monthlyTotal);
      } else {
        toast.error(data.message || "Failed to load sales data");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setServices(data.services);
      } else {
        toast.error(data.message || "Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    }
  };

  // Fetch service bookings
  const fetchServiceBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/service-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setServiceBookings(data.bookings);
      } else {
        toast.error(data.message || "Failed to load service bookings");
      }
    } catch (error) {
      console.error("Error fetching service bookings:", error);
      toast.error("Failed to load service bookings");
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        setPayments(data.payments);
      } else {
        toast.error(data.message || "Failed to load payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    }
  };

  // Update dashboard stats
  const updateDashboardStats = () => {
    setDashboardStats({
      totalPatients: patients.length,
      totalDrugs: drugs.length,
      totalSales: sales.length,
      totalServices: services.length,
      lowStockCount: lowStockDrugs.length,
      pendingPayments: payments.filter(payment => payment.paymentStatus === 'PENDING').length,
    });
  };

  // Add new drug
  const addDrug = async (drugData) => {
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/drugs", drugData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        toast.success("Drug added successfully");
        await fetchDrugs();
        return true;
      } else {
        toast.error(data.message || "Failed to add drug");
        return false;
      }
    } catch (error) {
      console.error("Error adding drug:", error);
      toast.error("Failed to add drug");
      return false;
    }
  };

  // Add new patient
  const addPatient = async (patientData) => {
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/patients", patientData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        toast.success("Patient added successfully");
        await fetchPatients();
        return true;
      } else {
        toast.error(data.message || "Failed to add patient");
        return false;
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      toast.error("Failed to add patient");
      return false;
    }
  };

  // Record new sale
  const recordSale = async (saleData) => {
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/sales", saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        toast.success("Sale recorded successfully");
        await fetchSales();
        await fetchDrugs(); // Update inventory
        return true;
      } else {
        toast.error(data.message || "Failed to record sale");
        return false;
      }
    } catch (error) {
      console.error("Error recording sale:", error);
      toast.error("Failed to record sale");
      return false;
    }
  };

  // Record payment
  const recordPayment = async (paymentData) => {
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/payments", paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        toast.success("Payment recorded successfully");
        await fetchPayments();
        return true;
      } else {
        toast.error(data.message || "Failed to record payment");
        return false;
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
      return false;
    }
  };

  // Book service
  const bookService = async (bookingData) => {
    try {
      const token = await getToken();
      const { data } = await axios.post("/api/service-bookings", bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (data.success) {
        toast.success("Service booked successfully");
        await fetchServiceBookings();
        return true;
      } else {
        toast.error(data.message || "Failed to book service");
        return false;
      }
    } catch (error) {
      console.error("Error booking service:", error);
      toast.error("Failed to book service");
      return false;
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUserData(null);
    setUserRole(null);
    setDrugs([]);
    setPatients([]);
    setSales([]);
    setPayments([]);
    setServices([]);
    setServiceBookings([]);
    setSelectedPatient(null);
    setDashboardStats({
      totalPatients: 0,
      totalDrugs: 0,
      totalSales: 0,
      totalServices: 0,
      lowStockCount: 0,
      pendingPayments: 0,
    });
  };

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      handleLogout();
    }
  }, [user]);

  // Fetch all data when user is authenticated
  useEffect(() => {
    if (userData && userRole) {
      fetchDrugs();
      fetchPatients();
      fetchSales();
      fetchServices();
      fetchServiceBookings();
      fetchPayments();
    }
  }, [userData, userRole]);

  // Update dashboard stats when data changes
  useEffect(() => {
    updateDashboardStats();
  }, [drugs, patients, sales, services, lowStockDrugs, payments]);

  const value = {
    // User data
    user,
    userData,
    userRole,
    isLoading,
    
    // Drug inventory
    drugs,
    lowStockDrugs,
    expiringDrugs,
    fetchDrugs,
    addDrug,
    
    // Patient management
    patients,
    selectedPatient,
    setSelectedPatient,
    fetchPatients,
    addPatient,
    
    // Sales & payments
    sales,
    payments,
    todaySales,
    monthlySales,
    fetchSales,
    fetchPayments,
    recordSale,
    recordPayment,
    
    // Services
    services,
    serviceBookings,
    fetchServices,
    fetchServiceBookings,
    bookService,
    
    // Dashboard
    dashboardStats,
    
    // Utilities
    handleLogout,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
}; 