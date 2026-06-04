import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Bell } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: balance } = trpc.gems.getBalance.useQuery();
  const { data: links } = trpc.shortLinks.getAll.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(undefined, { enabled: !!user });
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.reload();
  };

  const activeLinksCount = (links || []).filter(l => l.isActive && l.remaining > 0).length;

  if (userLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#00d4ff", fontSize: "18px", fontWeight: "bold" }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        color: "#ffffff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(0,0,0,0.8)",
          borderBottom: "1px solid rgba(0,212,255,0.2)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "24px" }}>🔑</div>
          <h1 style={{ color: "#00d4ff", fontSize: "20px", fontWeight: "900", margin: 0, letterSpacing: "1px" }}>
            ALLIFF STORE
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate("/notifications")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "8px 12px",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                background: "#ff4d4d",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
              }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,136,255,0.05))",
              border: "1px solid rgba(0,212,255,0.3)",
              borderRadius: "12px",
              padding: "8px 16px",
              color: "#00d4ff",
              fontSize: "14px",
              fontWeight: "bold",
              boxShadow: "0 0 15px rgba(0,212,255,0.1)",
            }}
          >
            💰 {balance || 0} نقطة
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,50,50,0.1)",
              border: "1px solid rgba(255,50,50,0.3)",
              borderRadius: "12px",
              padding: "8px 16px",
              color: "#ff4d4d",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            خروج
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 20px" }}>
        {/* Welcome Section */}
        <div
          style={{
            background: "linear-gradient(160deg, #0a0a0a 0%, #111111 100%)",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: "30px",
            padding: "40px",
            marginBottom: "30px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "rgba(0,212,255,0.05)", borderRadius: "50%", blur: "50px" }}></div>
          
          <h2 style={{ color: "#ffffff", fontSize: "28px", fontWeight: "900", margin: "0 0 10px" }}>
            أهلاً وسهلاً بك، {user.name} 👋
          </h2>
          <p style={{ color: "#888", fontSize: "16px", margin: "0 0 25px" }}>
            مرحباً في AlliFF Store - منصتك المتكاملة لجمع النقاط وشراء مفاتيح البوتات
          </p>
          
          <div style={{ display: "inline-block", padding: "20px 40px", background: "rgba(0,212,255,0.05)", borderRadius: "20px", border: "1px solid rgba(0,212,255,0.1)" }}>
            <div style={{ color: "#00d4ff", fontSize: "48px", fontWeight: "900", textShadow: "0 0 20px rgba(0,212,255,0.3)" }}>
              {balance || 0}
            </div>
            <div style={{ color: "#555", fontSize: "14px", fontWeight: "bold", marginTop: "5px", letterSpacing: "2px" }}>نقطة</div>
          </div>
        </div>


        {/* Main Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
          <button
            onClick={() => navigate("/collect")}
            style={{
              padding: "30px",
              background: "#0a0a0a",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: "25px",
              cursor: "pointer",
              transition: "0.3s",
              textAlign: "center",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)")}
          >
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>⚡</div>
            <div style={{ color: "#00d4ff", fontWeight: "900", fontSize: "18px", marginBottom: "8px" }}>تجميع النقاط</div>
            <div style={{ color: "#555", fontSize: "13px" }}>
              {activeLinksCount > 0 ? `${activeLinksCount} روابط متاحة` : "لا توجد روابط حالياً"}
            </div>
          </button>

          <button
            onClick={() => navigate("/shop")}
            style={{
              padding: "30px",
              background: "#0a0a0a",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: "25px",
              cursor: "pointer",
              transition: "0.3s",
              textAlign: "center",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)")}
          >
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>🛒</div>
            <div style={{ color: "#a78bfa", fontWeight: "900", fontSize: "18px", marginBottom: "8px" }}>متجر المفاتيح</div>
            <div style={{ color: "#555", fontSize: "13px" }}>استبدل نقاطك بمفاتيح</div>
          </button>
        </div>

        {/* Telegram Bot Card */}
        <div
          style={{
            background: "linear-gradient(90deg, rgba(0,136,255,0.1) 0%, rgba(0,0,0,0) 100%)",
            border: "1px solid rgba(0,136,255,0.2)",
            borderRadius: "20px",
            padding: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#ffffff", fontSize: "18px", fontWeight: "bold", marginBottom: "5px" }}>📱 بوت التلجرام</div>
            <div style={{ color: "#666", fontSize: "14px" }}>تابع آخر التحديثات واجمع النقاط بسهولة من البوت</div>
          </div>
          <a
            href="https://t.me/AlliFF_Store_Keysbot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#0088ff",
              color: "#fff",
              padding: "12px 25px",
              borderRadius: "15px",
              fontWeight: "bold",
              textDecoration: "none",
              boxShadow: "0 10px 20px rgba(0,136,255,0.2)",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            دخول البوت
          </a>
        </div>
      </div>
    </div>
  );
}
