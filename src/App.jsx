import { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScriptNext, MarkerF, InfoWindowF } from "@react-google-maps/api";

const API = "http://localhost:5000/api";
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = { width: "100%", height: "400px", borderRadius: "12px" };
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

/* ============================================================
   WISE CITIZEN REWARD HELPER
   ============================================================ */
/* ============================================================
   WISE CITIZEN REWARDS CARD (WITH REDEEM & 10-DIGIT CODE)
   ============================================================ */
function RewardsCard({ user, onRefresh }) {
  const points = user?.points || 0;
  const reward = getRewardInfo(points);
  const [redeeming, setRedeeming] = useState(false);
  const [latestCode, setLatestCode] = useState(null);

  const handleRedeem = async (tier) => {
    setRedeeming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API + "/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setLatestCode({ code: data.code, discount: data.discount });
        alert(`🎉 Redeemed! Your ${data.discount}% discount code is: ${data.code}`);
        onRefresh();
      } else {
        alert(data.message || "Failed to redeem discount");
      }
    } catch (err) {
      alert("Redeem failed: " + err.message);
    }
    setRedeeming(false);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("📋 Copied code: " + code);
  };

  return (
    <div className="section-card" style={{ borderLeft: "4px solid #f59e0b" }}>
      <div className="section-header" style={{ marginBottom: 10 }}>
        <h3>🏅 Wise Citizen Rewards</h3>
        <span
          className="badge"
          style={{
            background: reward.discount > 0 ? "#e8f5e9" : "#f3f4f6",
            color: reward.discount > 0 ? "#2e7d32" : "#555",
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 12,
          }}
        >
          {reward.discount > 0 ? `🎉 ${reward.discount}% Discount Ready` : "Earn 10 pts per verified report"}
        </span>
      </div>

      <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#444" }}>
        You have <strong>{points} Wise Citizen Points</strong>.{" "}
        {reward.nextTarget ? (
          <>
            Need <strong>{reward.nextTarget - points} more points</strong> to unlock{" "}
            <strong>{reward.nextDiscount}% discount</strong>.
          </>
        ) : (
          <>You have unlocked the maximum <strong>30% discount</strong> tier!</>
        )}
      </p>

      {/* Progress Bar */}
      <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 10 }}>
        <div
          style={{
            width: `${reward.progress}%`,
            height: "100%",
            background: reward.discount >= 30 ? "#2e7d32" : reward.discount >= 10 ? "#10b981" : "#f59e0b",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 14 }}>
        <span>0 pts</span>
        <span style={{ fontWeight: points >= 100 ? 700 : 400, color: points >= 100 ? "#2e7d32" : "#666" }}>
          100 pts → 10% OFF {points >= 100 ? "✅" : ""}
        </span>
        <span style={{ fontWeight: points >= 200 ? 700 : 400, color: points >= 200 ? "#2e7d32" : "#666" }}>
          200 pts → 30% OFF {points >= 200 ? "✅" : ""}
        </span>
      </div>

      {/* Redeem Buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          className="btn btn-success btn-small"
          disabled={points < 100 || redeeming}
          onClick={() => handleRedeem(100)}
        >
          🎟️ Redeem 10% OFF (100 pts)
        </button>
        <button
          className="btn btn-primary btn-small"
          disabled={points < 200 || redeeming}
          onClick={() => handleRedeem(200)}
        >
          🎟️ Redeem 30% OFF (200 pts)
        </button>
      </div>

      {/* Newly Generated Code */}
      {latestCode && (
        <div
          style={{
            background: "#e8f5e9",
            border: "1px dashed #2e7d32",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>
              🎉 {latestCode.discount}% Discount Referral Code
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#1b5e20" }}>
              {latestCode.code}
            </div>
          </div>
          <button className="btn btn-outline btn-small" onClick={() => copyCode(latestCode.code)}>
            📋 Copy
          </button>
        </div>
      )}

      {/* Past Redeemed Codes */}
      {user?.redeemedCodes?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px", color: "#555" }}>
            Your Redeemed Codes:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {user.redeemedCodes.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f9fafb",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <span>
                  <strong style={{ letterSpacing: 1 }}>{item.code}</strong> — {item.discount}% OFF
                </span>
                <button className="btn btn-outline btn-small" onClick={() => copyCode(item.code)}>
                  📋 Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   GOOGLE MAP COMPONENT
   ============================================================ */
function DustbinMap({ dustbins, userLocation }) {
  const [selected, setSelected] = useState(null);
  const center = userLocation || defaultCenter;

  return (
    <LoadScriptNext googleMapsApiKey={MAPS_KEY}>
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={13} center={center}>
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            title="Your Location"
          />
        )}
        {dustbins.map((bin) => (
          <MarkerF
            key={bin._id}
            position={{ lat: bin.latitude, lng: bin.longitude }}
            icon={{
              url: bin.status === "Full"
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
            onClick={() => setSelected(bin)}
          />
        ))}
        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ padding: "4px", maxWidth: 220 }}>
              <h4 style={{ margin: "0 0 4px" }}>{selected.binId}</h4>
              <p style={{ margin: "2px 0", fontSize: 13 }}>
                {selected.street}, {selected.area}, {selected.city}
              </p>
              {selected.landmark && (
                <p style={{ margin: "2px 0", fontSize: 13 }}>📌 {selected.landmark}</p>
              )}
              <span
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: selected.status === "Full" ? "#ffebee" : "#e8f5e9",
                  color: selected.status === "Full" ? "#c62828" : "#2e7d32",
                }}
              >
                {selected.status === "Full" ? "🔴 Full" : "🟢 Available"}
              </span>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </LoadScriptNext>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   WISE CITIZEN REWARDS CARD
   ============================================================ */
function RewardsCard({ points = 0 }) {
  const reward = getRewardInfo(points);

  return (
    <div className="section-card" style={{ borderLeft: "4px solid #f59e0b" }}>
      <div className="section-header" style={{ marginBottom: 10 }}>
        <h3>🏅 Wise Citizen Rewards</h3>
        <span
          className="badge"
          style={{
            background: reward.discount > 0 ? "#e8f5e9" : "#f3f4f6",
            color: reward.discount > 0 ? "#2e7d32" : "#555",
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 12,
          }}
        >
          {reward.discount > 0 ? `🎉 ${reward.discount}% Discount Active` : "Earn 10 pts per verified report"}
        </span>
      </div>

      <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#444" }}>
        You have <strong>{points} Wise Citizen Points</strong>.{" "}
        {reward.nextTarget ? (
          <>
            Need <strong>{reward.nextTarget - points} more points</strong> to unlock{" "}
            <strong>{reward.nextDiscount}% discount</strong>.
          </>
        ) : (
          <>You have unlocked the maximum <strong>30% discount</strong> tier!</>
        )}
      </p>

      {/* Progress Bar */}
      <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 10 }}>
        <div
          style={{
            width: `${reward.progress}%`,
            height: "100%",
            background: reward.discount >= 30 ? "#2e7d32" : reward.discount >= 10 ? "#10b981" : "#f59e0b",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" }}>
        <span>0 pts</span>
        <span style={{ fontWeight: points >= 100 ? 700 : 400, color: points >= 100 ? "#2e7d32" : "#666" }}>
          100 pts → 10% OFF {points >= 100 ? "✅" : ""}
        </span>
        <span style={{ fontWeight: points >= 200 ? 700 : 400, color: points >= 200 ? "#2e7d32" : "#666" }}>
          200 pts → 30% OFF {points >= 200 ? "✅" : ""}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
function LoginSlide({ setUser, setPage, goToSlide }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setPage("dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Login failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="slide">
      <div className="auth-header">
        <div className="auth-icon">🔐</div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>
      </div>
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <span className="input-icon">📧</span>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? "⏳ Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="auth-links">
        <button className="link-btn" onClick={() => goToSlide(1)}>📝 Create Account</button>
        <button className="link-btn" onClick={() => goToSlide(2)}>🔑 Forgot Password?</button>
      </div>
    </div>
  );
}

/* ============================================================
   REGISTER PAGE
   ============================================================ */
function RegisterSlide({ goToSlide }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("🎉 Registration successful! Please login.");
        setName(""); setEmail(""); setPassword("");
        goToSlide(0);
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="slide">
      <div className="auth-header">
        <div className="auth-icon">📝</div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Dustbin Finder today</p>
      </div>
      <form onSubmit={handleRegister}>
        <div className="input-group">
          <span className="input-icon">👤</span>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="input-group">
          <span className="input-icon">📧</span>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn btn-success btn-full" disabled={loading}>
          {loading ? "⏳ Creating..." : "Create Account"}
        </button>
      </form>
      <div className="auth-links">
        <button className="link-btn" onClick={() => goToSlide(0)}>← Back to Login</button>
      </div>
    </div>
  );
}

/* ============================================================
   FORGOT PASSWORD PAGE
   ============================================================ */
function ForgotSlide({ goToSlide }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sending, setSending] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(API + "/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.code) alert("Demo mode - Your code is: " + data.code);
      if (res.ok) setStep(2);
    } catch (err) {
      alert("Failed to send code");
    }
    setSending(false);
  };

  const verifyAndReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API + "/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        setStep(1); setEmail(""); setCode(""); setNewPassword("");
        goToSlide(0);
      }
    } catch (err) {
      alert("Reset failed");
    }
  };

  return (
    <div className="slide">
      <div className="auth-header">
        <div className="auth-icon">🔑</div>
        <h2>Reset Password</h2>
        <p className="auth-subtitle">
          {step === 1 ? "Enter your email to receive a reset code" : "Enter the code sent to your email"}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={sendCode}>
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-warning btn-full" disabled={sending}>
            {sending ? "📧 Sending..." : "📧 Send Reset Code"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyAndReset}>
          <p className="text-center mb-10" style={{ color: "#666" }}>
            Code sent to <strong>{email}</strong>
          </p>
          <div className="input-group">
            <span className="input-icon">🔢</span>
            <input className="otp-input" type="text" placeholder="------" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Reset Password</button>
          <div className="text-center">
            <button type="button" className="link-btn" onClick={() => setStep(1)}>Resend Code</button>
          </div>
        </form>
      )}

      <div className="auth-links">
        <button className="link-btn" onClick={() => { setStep(1); goToSlide(0); }}>← Back to Login</button>
      </div>
    </div>
  );
}

/* ============================================================
   REPORT MODAL
   ============================================================ */
function ReportModal({ dustbin, onSubmit, onClose }) {
  const [message, setMessage] = useState("Dustbin is full");
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>🚨 Report: {dustbin.binId}</h3>
        <p style={{ color: "#666", margin: "8px 0 8px" }}>
          {dustbin.street}, {dustbin.area}, {dustbin.city}
        </p>
        <p style={{ color: "#2e7d32", fontSize: 13, margin: "0 0 12px" }}>
          🏅 Earn <strong>+10 Wise Citizen Points</strong> once verified by admin!
        </p>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} required />
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={() => onSubmit(dustbin._id, message)}>Submit Report</button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   USER DASHBOARD
   ============================================================ */
function UserDashboard({ user, dustbins, onRefresh }) {
  const [selectedDustbin, setSelectedDustbin] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [finding, setFinding] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleReport = async (dustbinId, message) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API + "/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify({
          dustbinId,
          message,
          userId: user?._id || user?.id,
        }),
      });
      if (res.ok) {
        alert("✅ Report submitted! You will receive 10 Wise Citizen Points once verified.");
        setSelectedDustbin(null);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to submit report");
      }
    } catch (err) {
      alert("Failed to submit report");
    }
  };

  const findNearest = () => {
    setFinding(true);
    setSuggestion(null);
    if (!navigator.geolocation) { alert("Geolocation not supported"); setFinding(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        try {
          const res = await fetch(API + "/dustbins/suggest?lat=" + loc.lat + "&lng=" + loc.lng);
          const data = await res.json();
          if (data.dustbin) setSuggestion(data);
          else alert(data.message || "No available dustbins found");
        } catch (err) { alert("Failed to find nearest dustbin"); }
        setFinding(false);
      },
      () => { alert("Location access denied"); setFinding(false); }
    );
  };

  const available = dustbins.filter((b) => b.status === "Available").length;
  const full = dustbins.filter((b) => b.status === "Full").length;
  const points = user?.points || 0;
  const reward = getRewardInfo(points);

  const filtered = dustbins.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.binId?.toLowerCase().includes(term) ||
      b.city?.toLowerCase().includes(term) ||
      b.area?.toLowerCase().includes(term) ||
      b.street?.toLowerCase().includes(term) ||
      b.landmark?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard-content">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🗑️" label="Total Dustbins" value={dustbins.length} color="#667eea" />
        <StatCard icon="🟢" label="Available" value={available} color="#4caf50" />
        <StatCard icon="🔴" label="Full" value={full} color="#ef5350" />
        <StatCard
          icon="🏅"
          label={reward.discount > 0 ? `Wise Citizen (${reward.discount}% OFF)` : "Wise Citizen Points"}
          value={points}
          color="#f59e0b"
        />
      </div>

      {/* Wise Citizen Rewards */}
{/* Wise Citizen Rewards */}
<RewardsCard user={user} onRefresh={onRefresh} />

      {/* Map */}
      <div className="section-card">
        <div className="section-header">
          <h3>📍 Dustbin Map</h3>
          <button className="btn btn-success" onClick={findNearest} disabled={finding}>
            {finding ? "📡 Finding..." : "📍 Find Nearest"}
          </button>
        </div>
        <DustbinMap dustbins={dustbins} userLocation={userLocation} />
        <p className="map-legend">
          <span><img src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="" width="16" /> Available</span>
          <span><img src="http://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="" width="16" /> Full</span>
          <span><img src="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="" width="16" /> Your Location</span>
        </p>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <div className="suggestion-card">
          <div className="suggestion-header">
            <h3>📍 Nearest Available Dustbin</h3>
            <button className="btn btn-small btn-outline" onClick={() => setSuggestion(null)}>✕</button>
          </div>
          <div className="suggestion-body">
            <p><strong>{suggestion.dustbin.binId}</strong> — {suggestion.dustbin.street}, {suggestion.dustbin.area}, {suggestion.dustbin.city}</p>
            {suggestion.dustbin.landmark && <p>📌 {suggestion.dustbin.landmark}</p>}
            <p className="distance-text">
              📏 {suggestion.distance >= 1000 ? (suggestion.distance / 1000).toFixed(1) + " km" : suggestion.distance + " meters"} away
            </p>
            <a
              href={"https://www.google.com/maps/dir/?api=1&destination=" + suggestion.dustbin.latitude + "," + suggestion.dustbin.longitude}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn btn-success">🗺️ Open in Google Maps</button>
            </a>
          </div>
        </div>
      )}

      {/* Dustbin List */}
      <div className="section-card">
        <div className="section-header">
          <h3>🗑️ All Dustbins ({dustbins.length})</h3>
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search dustbins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {filtered.length === 0 && <p className="empty-msg">No dustbins found.</p>}
        <div className="dustbin-grid">
          {filtered.map((bin) => (
            <div className="dustbin-card" key={bin._id}>
              <div className="dustbin-card-header">
                <span className="bin-id">{bin.binId}</span>
                <span className={bin.status === "Full" ? "badge badge-full" : "badge badge-available"}>
                  {bin.status === "Full" ? "🔴 Full" : "🟢 Available"}
                </span>
              </div>
              <p className="bin-location">{bin.street}, {bin.area}, {bin.city}</p>
              {bin.landmark && <p className="bin-landmark">📌 {bin.landmark}</p>}
              <div className="dustbin-card-actions">
                {bin.status !== "Full" && (
                  <button className="btn btn-danger btn-small" onClick={() => setSelectedDustbin(bin)}>🚨 Report Full</button>
                )}
                <a
                  href={"https://www.google.com/maps/dir/?api=1&destination=" + bin.latitude + "," + bin.longitude}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="btn btn-outline btn-small">🗺️ Navigate</button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDustbin && <ReportModal dustbin={selectedDustbin} onSubmit={handleReport} onClose={() => setSelectedDustbin(null)} />}
    </div>
  );
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */
function AdminDashboard({ dustbins, reports, onRefresh }) {
  const [tab, setTab] = useState("overview");
  const [binId, setBinId] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API + "/dustbins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          binId, city, area, street, landmark,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });
      if (res.ok) {
        alert("✅ Dustbin added!");
        setBinId(""); setCity(""); setArea(""); setStreet(""); setLandmark(""); setLatitude(""); setLongitude("");
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add dustbin");
      }
    } catch (err) {
      alert("Failed to add dustbin");
    }
  };

  const toggleStatus = async (id, current) => {
    try {
      await fetch(API + "/dustbins/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: current === "Full" ? "Available" : "Full" }),
      });
      onRefresh();
    } catch (err) { alert("Failed to update"); }
  };

  const verifyReport = async (reportId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API + "/reports/" + reportId + "/verify", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Report verified! +10 Wise Citizen Points awarded to the user.");
        onRefresh();
      } else {
        alert(data.message || "Failed to verify report");
      }
    } catch (err) {
      alert("Failed to verify report");
    }
  };

  const autoFill = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); },
      () => alert("Location access denied")
    );
  };

  const available = dustbins.filter((b) => b.status === "Available").length;
  const full = dustbins.filter((b) => b.status === "Full").length;
  const pending = reports.filter((r) => r.status === "Pending").length;

  return (
    <div className="dashboard-content">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🗑️" label="Total Dustbins" value={dustbins.length} color="#667eea" />
        <StatCard icon="🟢" label="Available" value={available} color="#4caf50" />
        <StatCard icon="🔴" label="Full" value={full} color="#ef5350" />
        <StatCard icon="📝" label="Pending Reports" value={pending} color="#ff9800" />
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: "overview", icon: "📊", label: "Overview" },
          { key: "add", icon: "➕", label: "Add Dustbin" },
          { key: "manage", icon: "📋", label: "Manage" },
          { key: "reports", icon: "📝", label: "Reports" },
        ].map((t) => (
          <button key={t.key} className={"admin-tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="section-card">
          <h3>📍 Dustbin Map Overview</h3>
          <DustbinMap dustbins={dustbins} userLocation={null} />
        </div>
      )}

      {/* Add */}
      {tab === "add" && (
        <div className="section-card">
          <h3>➕ Add New Dustbin</h3>
          <form onSubmit={handleAdd} className="add-form">
            <div className="form-grid">
              <div className="input-group">
                <span className="input-icon">🏷️</span>
                <input placeholder="Bin ID (e.g. BIN-001)" value={binId} onChange={(e) => setBinId(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🏙️</span>
                <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">📍</span>
                <input placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🛤️</span>
                <input placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">📌</span>
                <input placeholder="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              </div>
            </div>
            <div className="coord-row">
              <div className="input-group">
                <span className="input-icon">🌐</span>
                <input placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🌐</span>
                <input placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
              </div>
              <button type="button" className="btn btn-outline btn-small" onClick={autoFill} title="Auto-fill from GPS">📍 GPS</button>
            </div>
            <button type="submit" className="btn btn-primary mt-10">➕ Add Dustbin</button>
          </form>
        </div>
      )}

      {/* Manage */}
      {tab === "manage" && (
        <div className="section-card">
          <h3>📋 Manage Dustbins ({dustbins.length})</h3>
          {dustbins.length === 0 && <p className="empty-msg">No dustbins added yet.</p>}
          <div className="dustbin-grid">
            {dustbins.map((bin) => (
              <div className="dustbin-card" key={bin._id}>
                <div className="dustbin-card-header">
                  <span className="bin-id">{bin.binId}</span>
                  <span className={bin.status === "Full" ? "badge badge-full" : "badge badge-available"}>
                    {bin.status === "Full" ? "🔴 Full" : "🟢 Available"}
                  </span>
                </div>
                <p className="bin-location">{bin.street}, {bin.area}, {bin.city}</p>
                <p className="bin-coords">📍 {bin.latitude}, {bin.longitude}</p>
                {bin.landmark && <p className="bin-landmark">📌 {bin.landmark}</p>}
                <div className="dustbin-card-actions">
                  <button className="btn btn-outline btn-small" onClick={() => toggleStatus(bin._id, bin.status)}>
                    Mark {bin.status === "Full" ? "Available" : "Full"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="section-card">
          <h3>📝 Reports ({reports.length})</h3>
          {reports.length === 0 && <p className="empty-msg">No reports yet.</p>}
          <div className="reports-list">
            {reports.map((r) => (
              <div className="report-card" key={r._id}>
                <div className="report-header">
                  <span className="bin-id">{r.dustbinId?.binId || "N/A"}</span>
                  <span className={r.status === "Pending" ? "badge badge-pending" : "badge badge-resolved"}>
                    {r.status === "Pending" ? "⏳ Pending" : r.status === "Verified" ? "✅ Verified (+10 pts)" : "✅ Resolved"}
                  </span>
                </div>
                <p className="report-message">💬 {r.message}</p>
                {r.userId?.name && (
                  <p className="report-date">👤 Reported by: <strong>{r.userId.name}</strong> ({r.userId.points || 0} pts)</p>
                )}
                <p className="report-date">🕐 {new Date(r.createdAt).toLocaleString()}</p>
                {r.status === "Pending" && (
                  <div style={{ marginTop: 10 }}>
                    <button className="btn btn-success btn-small" onClick={() => verifyReport(r._id)}>
                      ✅ Verify & Award +10 pts
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
function App() {
  const [page, setPage] = useState("auth");
  const [user, setUser] = useState(null);
  const [authSlide, setAuthSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("user");
  const [dustbins, setDustbins] = useState([]);
  const [reports, setReports] = useState([]);

  const loadData = useCallback(() => {
    fetch(API + "/dustbins").then((r) => r.json()).then(setDustbins).catch(() => {});
    fetch(API + "/reports").then((r) => r.json()).then(setReports).catch(() => {});

    // Keep logged-in user's Wise Citizen Points synced
    const token = localStorage.getItem("token");
    if (token) {
      fetch(API + "/auth/me", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && (data._id || data.user)) {
            const updatedUser = data.user || data;
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Check for saved session
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setPage("dashboard");
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (page === "dashboard") loadData();
  }, [page, loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (page !== "dashboard") return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [page, loadData]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("auth");
    setAuthSlide(0);
    setActiveTab("user");
  };

  return (
    <div className="app">
      {/* ========== AUTH ========== */}
      {page === "auth" && (
        <div className="auth-container">
          <div className="auth-brand">
            <h1>🗑️ Dustbin Finder</h1>
            <p>Locate the nearest dustbin in your area</p>
          </div>
          <div className="slider-wrapper">
            <div className="slider-track" style={{ transform: "translateX(-" + (authSlide * 100) + "%)" }}>
              <LoginSlide setUser={setUser} setPage={setPage} goToSlide={setAuthSlide} />
              <RegisterSlide goToSlide={setAuthSlide} />
              <ForgotSlide goToSlide={setAuthSlide} />
            </div>
          </div>
          <div className="slide-nav">
            {["Login", "Register", "Reset"].map((label, i) => (
              <button key={i} className={"dot" + (authSlide === i ? " active" : "")} onClick={() => setAuthSlide(i)} title={label} />
            ))}
          </div>
        </div>
      )}

      {/* ========== DASHBOARD ========== */}
      {page === "dashboard" && user && (
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-brand">
              <h2>🗑️</h2>
              <span>Dustbin Finder</span>
            </div>
            <nav className="sidebar-nav">
              <button className={"nav-item" + (activeTab === "user" ? " active" : "")} onClick={() => setActiveTab("user")}>
                <span className="nav-icon">👤</span>
                <span>Dashboard</span>
              </button>
              {user.role === "admin" && (
                <button className={"nav-item" + (activeTab === "admin" ? " active" : "")} onClick={() => setActiveTab("admin")}>
                  <span className="nav-icon">🛡️</span>
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
            <div className="sidebar-footer">
              <div className="user-info">
                <div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div>
                <div>
                  <p className="user-name">{user.name}</p>
                  <p className="user-role">
                    {user.role === "admin" ? "🛡️ Admin" : `🏅 ${user.points || 0} pts`}
                  </p>
                </div>
              </div>
              <button className="btn btn-danger btn-small" onClick={logout}>🚪 Logout</button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <header className="content-header">
              <div>
                <h2>{activeTab === "user" ? "👤 User Dashboard" : "🛡️ Admin Panel"}</h2>
                <p className="header-subtitle">Welcome back, {user.name}!</p>
              </div>
              <button className="btn btn-outline btn-small" onClick={loadData}>🔄 Refresh</button>
            </header>

            {activeTab === "user" && <UserDashboard user={user} dustbins={dustbins} onRefresh={loadData} />}
            {activeTab === "admin" && <AdminDashboard dustbins={dustbins} reports={reports} onRefresh={loadData} />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
