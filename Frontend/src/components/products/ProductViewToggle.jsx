export default function ProductViewToggle({ view, onChange }) {
    return <div className="product-view-toggle" aria-label="Product display mode">
        <button type="button" className={view === "cards" ? "active" : ""} onClick={() => onChange("cards")} aria-label="Card view"><i className="bi bi-grid-3x3-gap"/> Cards</button>
        <button type="button" className={view === "table" ? "active" : ""} onClick={() => onChange("table")} aria-label="Table view"><i className="bi bi-list-ul"/> Table</button>
    </div>;
}
