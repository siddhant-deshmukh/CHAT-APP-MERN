import { useContext } from "react";
import { AppContext } from "@/context/AppContext";

// Create a custom hook for easy consumption of the context
const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a MyContextProvider');
  }
  return context;
};

export default useAppContext;