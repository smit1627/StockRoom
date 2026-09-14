import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboard } from "../../api/reportApi";
import { Skeleton, Empty, ErrorState } from "../../components/common/PageState";
import { formatCurrency } from "../../utils/formatCurrency";

const cards = [
    ["Spare parts", "boxes", "totalProducts", "Active catalogue"],
    ["Pieces in stock", "layers", "totalStockUnits", "Across all parts"],
    ["Inventory value", "currency-rupee", "inventoryValue", "Current stock value"],
    ["Needs attention", "exclamation-triangle", "lowStockProducts", "Below the set threshold"],
];

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const load = () => { setError(false); dashboard().then((response) => setData(response.data.data || {})).catch(() => setError(true)); };
    useEffect(load, []);
    if (error) return <ErrorState onRetry={load}/>;

    return <><div className="page-heading"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h2>Inventory command centre</h2></div><div className="quick-actions"><Link className="btn btn-outline-primary" to="/transactions/new"><i className="bi bi-arrow-left-right"/> Record movement</Link><Link className="btn btn-primary" to="/products/new"><i className="bi bi-plus-lg"/> Add spare part</Link></div></div><div className="stat-grid">{cards.map(([label, icon, key, caption]) => <article className="stat-card" key={key}><span className="stat-icon"><i className={`bi bi-${icon}`}/></span><p>{label}</p><strong>{data ? (key === "inventoryValue" ? formatCurrency(data[key]) : data[key] ?? 0) : <Skeleton/>}</strong><small>{caption}</small></article>)}</div>{!data ? <div className="card-panel"><Skeleton rows={8}/></div> : <div className="dashboard-grid"><section className="card-panel chart-panel"><div className="panel-title"><div><h3>Stock movement</h3><p>Last 30 days</p></div><i className="bi bi-graph-up-arrow"/></div>{data.stockMovement?.length ? <ResponsiveContainer width="100%" height={255}><BarChart data={data.stockMovement}><XAxis dataKey="transactionDate" hide/><YAxis/><Tooltip/><Bar dataKey="totalQuantity" fill="#087d78" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer> : <Empty icon="bar-chart" title="No movement yet" text="Stock activity will appear here."/>}</section><section className="card-panel"><div className="panel-title"><div><h3>Low stock watchlist</h3><p>Parts at or below threshold</p></div><Link to="/reports">View report</Link></div>{data.lowStockItems?.length ? <div className="compact-list">{data.lowStockItems.slice(0, 5).map((item) => <div key={item.id}><span className="item-initial product-watch-image">{item.imageUrl ? <img src={item.imageUrl} alt=""/> : item.name?.[0]}</span><p><b>{item.name || "Unnamed part"}</b><small>{item.sku ? `SKU · ${item.sku}` : "No SKU"}{item.category?.name && <span className="category-tag">{item.category.name}</span>}</small></p><b>{item.quantity} left</b></div>)}</div> : <Empty icon="check-circle" title="Stock levels look good" text="No parts need attention."/>}</section><section className="card-panel recent-panel"><div className="panel-title"><div><h3>Recent movements</h3><p>Latest stock activity</p></div><Link to="/transactions">View all</Link></div>{data.recentTransactions?.length ? <div className="table-responsive"><table className="table clean-table"><thead><tr><th>Reference</th><th>Type</th><th>Quantity</th><th>Value</th></tr></thead><tbody>{data.recentTransactions.map((transaction) => <tr key={transaction.id}><td><Link to={`/transactions/${transaction.id}`}>{transaction.transactionNumber}</Link></td><td><span className={`type-badge ${transaction.type}`}>{transaction.type?.replace("_", " ")}</span></td><td>{transaction.totalQuantity}</td><td>{formatCurrency(transaction.totalValue)}</td></tr>)}</tbody></table></div> : <Empty icon="receipt" title="No movements yet" text="Record a stock movement to begin."/>}</section></div>}</>;
}
