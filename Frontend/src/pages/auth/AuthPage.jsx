import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import veerLogo from "../../assets/veer-logo.png";

export default function AuthPage({ mode }) {
    const { authenticate } = useContext(AuthContext);
    const { register, watch, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { role: "staff" },
        shouldUnregister: true,
    });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const isRegister = mode === "register";
    const selectedRole = watch("role");

    const submit = async (values) => {
        setBusy(true);
        setError("");
        try {
            await authenticate(isRegister ? "register" : "login", values);
            navigate("/dashboard");
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Unable to continue.");
        } finally {
            setBusy(false);
        }
    };

    return <div className="auth-page"><section className="auth-panel"><div className="auth-logo"><span>VE</span> Veer Inventory</div><div><p className="eyebrow">TEXTILE PARTS OPERATIONS</p><h1>{isRegister ? "Create your workspace" : "Welcome back"}</h1><p className="text-muted">{isRegister ? "Start organising your parts catalogue with confidence." : "Sign in to manage your parts inventory."}</p></div><form onSubmit={handleSubmit(submit)} noValidate>{isRegister && <><label>Full name<input className="form-control" {...register("name", { required: "Your name is required" })}/>{errors.name && <small>{errors.name.message}</small>}</label><label>Account role<select className="form-select" {...register("role")}><option value="staff">Staff</option><option value="admin">Administrator</option></select></label>{selectedRole === "admin" && <label>Admin registration code<input type="password" className="form-control" autoComplete="off" {...register("adminCode", { required: "An admin registration code is required" })}/>{errors.adminCode && <small>{errors.adminCode.message}</small>}</label>}</>}<label>Email address<input type="email" className="form-control" {...register("email", { required: "Email is required" })}/>{errors.email && <small>{errors.email.message}</small>}</label><label>Password<input type="password" className="form-control" {...register("password", { required: "Password is required", minLength: { value: 8, message: "Use at least 8 characters" } })}/>{errors.password && <small>{errors.password.message}</small>}</label>{error && <div className="alert alert-danger py-2">{error}</div>}<button className="btn btn-primary w-100" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"} <i className="bi bi-arrow-right"/></button></form><p className="auth-switch">{isRegister ? "Already have an account?" : "New to Veer Inventory?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create account"}</Link></p></section><aside className="auth-aside"><img className="auth-enterprise-logo" src={veerLogo} alt="Veer Enterprise"/><p className="eyebrow">ONE SOURCE OF TRUTH</p><h2>Every loom part, exactly where it should be.</h2><p>Clear stock control for textile loom spare-parts trading—receipts, issues, adjustments and insight in one workspace.</p></aside></div>;
}
