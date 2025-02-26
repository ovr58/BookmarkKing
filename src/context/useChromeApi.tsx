import { useContext } from "react";
import { ChromeContext } from "./ChromApiContext";

const useChromeApi = () => {
    const context = useContext(ChromeContext);
    if (context === undefined) {
      throw new Error('useChrome must be used within a ChromeProvider');
    }
    return context;
};

export default useChromeApi;