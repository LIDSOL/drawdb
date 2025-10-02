import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      const isDev = import.meta.env.DEV;
      window.gtag("config", "G-JMYXZ0DKNV", {
        page_path: location.pathname + location.search,
        traffic_type: isDev ? "development" : "production",
      });
    }
  }, [location]);

  return null;
};

export default Analytics;
