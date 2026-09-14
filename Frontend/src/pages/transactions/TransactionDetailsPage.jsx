import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getTransaction, removeTransaction } from "../../api/transactionApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { Skeleton, ErrorState } from "../../components/common/PageState";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import ConfirmButton from "../../components/common/ConfirmButton";
import { formatProductName } from "../../utils/formatProductName";

export default function TransactionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { notify } = useContext(AppContext);
    const [tx, setTx] = useState();
    const [error, setError] = useState(false);
    const load = () => { setError(false); getTransaction(id).then((response) => setTx(response.data.data)).catch(() => setError(true)); };
    useEffect(load, [id]);
    const remove = async () => {
        try {
            await removeTransaction(id);
            notify("Transaction deleted and stock reversed");
            navigate("/transactions");
        } catch (requestError) {
            notify(requestError.response?.data?.message || "Unable to delete transaction", "danger");
        }
    };

    if (error) return <ErrorState onRetry={load}/>;
    if (!tx) return <Skeleton rows={8}/>;
    const admin = user?.profile?.role === "admin";

    return <><div className="page-heading"><div><p className="eyebrow">TRANSACTION DETAILS</p><h2>{tx.transactionNumber}</h2></div><div className="quick-actions"><Link className="btn btn-light" to="/transactions">Back to transactions</Link>{admin && <ConfirmButton className="btn btn-outline-danger" onConfirm={remove}>Delete & reverse stock</ConfirmButton>}</div></div>{admin && <div className="alert alert-warning py-2 mb-3"><i className="bi bi-exclamation-triangle me-2"/>Deleting reverses this transaction’s stock movement. It is blocked when later movements have already consumed its quantity.</div>}<section className="card-panel"><div className="detail-metrics mb-4"><span><small>Type</small><b>{tx.type?.replace("_", " ")}</b></span><span><small>Date</small><b>{formatDate(tx.transactionDate)}</b></span><span><small>Total quantity</small><b>{tx.totalQuantity}</b></span><span><small>Total value</small><b>{formatCurrency(tx.totalValue)}</b></span></div><p className="text-muted">{tx.remarks || "No remarks"}</p><div className="table-responsive"><table className="table clean-table"><thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>{tx.items?.map((item) => <tr key={item.id}><td>{item.product?.id?<Link to={`/products/${item.product.id}`}>{formatProductName(item.product.name)}</Link>:item.product?.name||"—"}</td><td>{item.product?.sku || "—"}</td><td>{item.quantity}</td><td>{formatCurrency(item.price)}</td><td>{formatCurrency(item.total)}</td></tr>)}</tbody></table></div></section></>;
}
