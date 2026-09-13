import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import veerMark from "../../assets/veer-mark.png";

const links = [
    ["/dashboard", "grid-1x2", "Dashboard"],
    ["/products", "boxes", "Parts catalogue"],
    ["/transactions", "arrow-left-right", "Stock movements"],
    ["/categories", "diagram-3", "Part families"],
    ["/reports", "bar-chart-line", "Reports"],
    ["/settings", "sliders", "Company settings", "admin"],
];

export default function Sidebar({ open, onClose }) {
    const { user, logout } = useContext(AuthContext);
    const { company } = useContext(AppContext);
    const isAdmin = user?.profile?.role === "admin";
    const companyName = company?.name || "Loom inventory";

    return <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
            <span className="brand-glyph"><img src={veerMark} alt=""/></span>
            <span>Veer Enterprises</span>
            <button className="btn-close d-lg-none" onClick={onClose} aria-label="Close navigation"/>
        </div>
        <div className="sidebar-caption">OPERATIONS WORKSPACE</div>
        <nav>{links.filter(([, , , role]) => !role || (role === "admin" && isAdmin)).map(([to, icon, label]) => <NavLink key={to} to={to} onClick={onClose}><i className={`bi bi-${icon}`}/><span>{label}</span></NavLink>)}</nav>
        <div className="sidebar-footer">
            <div className="company-mini">
                <div className="company-mark">{company?.logoUrl ? <img src={company.logoUrl} alt=""/> : <img src={veerMark} alt="Veer Enterprise"/>}</div>
                <span title={companyName}>{companyName}<small>Textile parts trading</small></span>
            </div>
            <div className="user-row"><span className="avatar">{user?.profile?.name?.[0] || "U"}</span><span>{user?.profile?.name || user?.email}<small>{user?.profile?.role || "Staff"}</small></span><button title="Log out" onClick={logout} aria-label="Log out"><i className="bi bi-box-arrow-right"/></button></div>
        </div>
    </aside>;
}
