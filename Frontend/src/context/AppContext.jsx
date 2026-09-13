import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCompany } from "../api/companyApi";
import { AuthContext } from "./AuthContext";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
    const { user } = useContext(AuthContext);
    const [toast, setToast] = useState(null);
    const [company, setCompany] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const refreshCompany = useCallback(async () => {
        if (!user) {
            setCompany(null);
            return null;
        }
        try {
            const response = await getCompany();
            const nextCompany = response.data.data || null;
            setCompany(nextCompany);
            return nextCompany;
        } catch {
            return null;
        }
    }, [user]);

    useEffect(() => { refreshCompany(); }, [refreshCompany]);

    return <AppContext.Provider value={{ notify, company, setCompany, refreshCompany }}>
        {children}
        {toast && <div className={`app-toast alert alert-${toast.type}`} role="alert">{toast.message}</div>}
    </AppContext.Provider>;
}
