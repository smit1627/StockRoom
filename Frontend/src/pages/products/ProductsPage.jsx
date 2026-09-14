import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { listProducts, removeProduct } from "../../api/productApi";
import { listCategories } from "../../api/categoryApi";
import { AppContext } from "../../context/AppContext";
import { Empty, ErrorState, Skeleton } from "../../components/common/PageState";
import ConfirmButton from "../../components/common/ConfirmButton";
import ProductCard from "../../components/products/ProductCard";
import ProductViewToggle from "../../components/products/ProductViewToggle";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatProductName } from "../../utils/formatProductName";

const status = (product) => product.quantity === 0 ? "out" : product.quantity <= product.lowStockThreshold ? "low" : "in";

export default function ProductsPage() {
    const [data, setData] = useState();
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState(() => localStorage.getItem("product_view") || "cards");
    const [query, setQuery] = useState({ page: 1, limit: 20, search: "", category: "", stockStatus: "", sortBy: "created_at", sortOrder: "desc" });
    const [error, setError] = useState(false);
    const { notify } = useContext(AppContext);
    const load = () => { setError(false); listProducts(query).then((response) => setData(response.data.data)).catch(() => setError(true)); };
    useEffect(load, [query]);
    useEffect(() => { listCategories().then((response) => setCategories(response.data.data || [])).catch(() => {}); }, []);
    const update = (key, value) => setQuery((current) => ({ ...current, [key]: value, page: 1 }));
    const changeView = (nextView) => { setView(nextView); localStorage.setItem("product_view", nextView); };
    const del = async (id) => { try { await removeProduct(id); notify("Product permanently deleted"); load(); } catch (requestError) { notify(requestError.response?.data?.message || "Unable to delete product", "danger"); } };
    if (error) return <ErrorState onRetry={load}/>;
    const products = data?.products || [];

    return <><div className="page-heading"><div><p className="eyebrow">CATALOGUE</p><h2>Parts catalogue</h2></div><Link className="btn btn-primary" to="/products/new"><i className="bi bi-plus-lg"/> Add spare part</Link></div><section className="card-panel"><div className="filter-row"><input className="form-control" placeholder="Search name, part code, or SKU" value={query.search} onChange={(event) => update("search", event.target.value)}/><select className="form-select" value={query.category} onChange={(event) => update("category", event.target.value)}><option value="">All part families</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select className="form-select" value={query.stockStatus} onChange={(event) => update("stockStatus", event.target.value)}><option value="">All stock</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select><select className="form-select" value={query.sortBy} onChange={(event) => update("sortBy", event.target.value)}><option value="created_at">Newest</option><option value="name">Name</option><option value="quantity">Quantity</option><option value="price">Price</option></select></div><div className="catalogue-toolbar"><span>{data ? `${data.pagination?.total || products.length} parts found` : "Loading parts…"}</span><ProductViewToggle view={view} onChange={changeView}/></div>{!data ? <Skeleton rows={8}/> : products.length ? view === "cards" ? <div className="product-card-grid">{products.map((product) => <ProductCard key={product.id} product={product} actions/>)}</div> : <div className="table-responsive"><table className="table clean-table"><thead><tr><th>Product</th><th>Part code</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Price</th><th>Value</th><th>Status</th><th/></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><Link className="product-cell" to={`/products/${product.id}`}>{product.imageUrl ? <img src={product.imageUrl} alt=""/> : <span>{product.name?.[0]}</span>}<b>{formatProductName(product.name)}</b></Link></td><td>{product.partCode || "—"}</td><td>{product.sku || "—"}</td><td>{product.category?.name || "—"}</td><td>{product.quantity}</td><td>{formatCurrency(product.price)}</td><td>{formatCurrency(product.quantity * product.price)}</td><td><span className={`stock-badge ${status(product)}`}>{status(product) === "out" ? "Out of stock" : status(product) === "low" ? "Low stock" : "In stock"}</span></td><td className="row-actions"><Link to={`/products/${product.id}/edit`}><i className="bi bi-pencil"/></Link><ConfirmButton onConfirm={() => del(product.id)}><i className="bi bi-trash"/></ConfirmButton></td></tr>)}</tbody></table></div> : <Empty icon="box-seam" title="No parts found" text="Change filters or add your first spare part."/>}<div className="pagination"><button className="btn btn-light btn-sm" disabled={!data?.pagination?.page || data.pagination.page === 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {data?.pagination?.page || 1} of {data?.pagination?.totalPages || 1}</span><button className="btn btn-light btn-sm" disabled={!data?.pagination?.totalPages || data.pagination.page >= data.pagination.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></section></>;
}
