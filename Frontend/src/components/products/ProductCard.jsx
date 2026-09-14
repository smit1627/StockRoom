import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatProductName } from "../../utils/formatProductName";

const getStockState = (product) => product.quantity === 0 ? ["out", "Out of stock"] : product.quantity <= product.lowStockThreshold ? ["low", "Low stock"] : ["in", "In stock"];

export default function ProductCard({ product, actions = false }) {
    const [stockClass, stockLabel] = getStockState(product);
    const value = Number(product.quantity || 0) * Number(product.price || 0);
    return <article className="product-card">
        <Link className="product-card-image" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
            {product.imageUrl ? <img src={product.imageUrl} alt={formatProductName(product.name)}/> : <span>{product.name?.[0] || "P"}</span>}
            <em className={`stock-badge ${stockClass}`}>{stockLabel}</em>
        </Link>
        <div className="product-card-body">
            <div className="product-card-heading"><div><p className="product-card-category">{product.category?.name || "Uncategorised"}</p><Link to={`/products/${product.id}`}>{formatProductName(product.name) || "Unnamed part"}</Link></div>{actions && <Link className="product-card-edit" to={`/products/${product.id}/edit`} aria-label={`Edit ${formatProductName(product.name)}`}><i className="bi bi-pencil"/></Link>}</div>
            <p className="product-card-sku">{product.sku ? `SKU · ${product.sku}` : "No SKU assigned"}{product.partCode && <> · Part code · {product.partCode}</>}</p>
            <div className="product-card-metrics"><span><small>In stock</small><b>{product.quantity ?? 0}</b></span><span><small>Unit price</small><b>{formatCurrency(product.price)}</b></span><span><small>Stock value</small><b>{formatCurrency(value)}</b></span></div>
        </div>
    </article>;
}
