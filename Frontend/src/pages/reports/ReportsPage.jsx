import { useEffect, useState } from "react";
import { report } from "../../api/reportApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { Empty, Skeleton, ErrorState } from "../../components/common/PageState";
import ProductCard from "../../components/products/ProductCard";
import ProductViewToggle from "../../components/products/ProductViewToggle";

const tabs = [["inventory", "Inventory report"], ["stock-movement", "Stock movement"], ["low-stock", "Low stock"], ["transactions", "Transactions"]];

export default function ReportsPage() {
    const [tab, setTab] = useState("inventory");
    const [view, setView] = useState(() => localStorage.getItem("inventory_report_view") || "cards");
    const [data, setData] = useState();
    const [error, setError] = useState(false);
    const load = () => { setError(false); setData(null); report(tab).then((response) => setData(response.data.data || [])).catch(() => setError(true)); };
    useEffect(load, [tab]);
    const rows = Array.isArray(data) ? data : [];
    const changeView = (nextView) => { setView(nextView); localStorage.setItem("inventory_report_view", nextView); };
    if (error) return <ErrorState onRetry={load}/>;

    return <><div className="page-heading"><div><p className="eyebrow">ANALYSIS</p><h2>Reports</h2></div><button className="btn btn-outline-primary" onClick={() => window.print()}><i className="bi bi-printer"/> Print</button></div><section className="card-panel"><div className="report-tabs">{tabs.map(([id, label]) => <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}</button>)}</div>{tab === "inventory" && data && <div className="catalogue-toolbar report-toolbar"><span>{rows.length} active parts</span><ProductViewToggle view={view} onChange={changeView}/></div>}{!data ? <Skeleton rows={10}/> : rows.length ? tab === "inventory" && view === "cards" ? <div className="product-card-grid">{rows.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="table-responsive"><table className="table clean-table"><thead><tr>{tab === "inventory" && <><th>Product</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Price</th><th>Value</th><th>Status</th></>}{tab === "low-stock" && <><th>Product</th><th>SKU</th><th>Quantity</th><th>Threshold</th><th>Difference</th></>}{tab === "transactions" && <><th>Reference</th><th>Type</th><th>Items</th><th>Quantity</th><th>Value</th></>}{tab === "stock-movement" && <><th>Reference</th><th>Type</th><th>Quantity</th><th>Value</th></>}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{tab === "inventory" && <><td>{row.name}</td><td>{row.sku || "—"}</td><td>{row.category?.name || "—"}</td><td>{row.quantity}</td><td>{formatCurrency(row.price)}</td><td>{formatCurrency(row.inventoryValue)}</td><td><span className={`stock-badge ${row.stockStatus === "out_of_stock" ? "out" : row.stockStatus === "low_stock" ? "low" : "in"}`}>{row.stockStatus?.replaceAll("_", " ")}</span></td></>}{tab === "low-stock" && <><td>{row.name}</td><td>{row.sku || "—"}</td><td>{row.quantity}</td><td>{row.lowStockThreshold}</td><td>{row.difference}</td></>}{(tab === "transactions" || tab === "stock-movement") && <><td>{row.transactionNumber}</td><td>{row.type}</td><td>{row.items?.length || "—"}</td><td>{row.totalQuantity}</td><td>{formatCurrency(row.totalValue)}</td></>}</tr>)}</tbody></table></div> : <Empty icon="bar-chart" title="No report data" text="Try again after inventory activity is recorded."/>}</section></>;
}
