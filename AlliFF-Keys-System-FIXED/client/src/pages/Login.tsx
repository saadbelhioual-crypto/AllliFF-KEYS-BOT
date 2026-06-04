import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Swal from "sweetalert2";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const loginMutation = trpc.auth.loginWithCredentials.useMutation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!userLoading && user) {
      navigate("/");
    }
  }, [user, userLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى إدخال جميع البيانات!",
        background: "#0a0a0a",
        color: "#ffffff",
        confirmButtonColor: "#00d4ff",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        username: username.trim(),
        password: password.trim(),
      });

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "تم تسجيل الدخول!",
          text: "أهلاً بك مجدداً 🚀",
          showConfirmButton: false,
          timer: 1500,
          background: "#0a0a0a",
          color: "#ffffff",
        }).then(() => {
          navigate("/");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "فشل الدخول",
          text: result.message || "بيانات غير صحيحة",
          background: "#0a0a0a",
          color: "#ffffff",
          confirmButtonColor: "#ff4d4d",
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: error.message || "حدث خطأ في الاتصال بالسيرفر",
        background: "#0a0a0a",
        color: "#ffffff",
        confirmButtonColor: "#ff4d4d",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin(e as any);
    }
  };

  if (userLoading) {
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
        width: "100%",
        backgroundColor: "#050505", // Matte Black
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        direction: "rtl",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Effects */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(0,136,255,0.05) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>

      <div style={{ width: "100%", maxWidth: "450px", padding: "20px", zIndex: 1 }}>
        {/* Login Card */}
        <div
          style={{
            background: "rgba(10,10,10,0.8)",
            border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: "40px",
            padding: "50px 40px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "50px", marginBottom: "15px", filter: "drop-shadow(0 0 15px rgba(0,212,255,0.3))" }}>🔑</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#ffffff", margin: 0, letterSpacing: "2px" }}>
              ALLIFF <span style={{ color: "#00d4ff" }}>STORE</span>
            </h1>
            <p style={{ color: "#555", fontSize: "14px", fontWeight: "bold", marginTop: "10px", letterSpacing: "1px" }}>
              متجر المفاتيح الذكي
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <label style={{ display: "block", color: "#00d4ff", fontSize: "12px", fontWeight: "900", marginBottom: "10px", marginRight: "10px" }}>
                👤 اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أدخل حسابك"
                style={{
                  width: "100%",
                  padding: "18px 25px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "20px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "0.3s",
                  textAlign: "right",
                }}
                disabled={isLoading}
              />
            </div>

            <div style={{ textAlign: "right" }}>
              <label style={{ display: "block", color: "#00d4ff", fontSize: "12px", fontWeight: "900", marginBottom: "10px", marginRight: "10px" }}>
                🔒 كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أدخل الرمز السري"
                style={{
                  width: "100%",
                  padding: "18px 25px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "20px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "0.3s",
                  textAlign: "right",
                }}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "20px",
                background: "linear-gradient(135deg, #00d4ff, #0088ff)",
                border: "none",
                borderRadius: "20px",
                color: "#000",
                fontWeight: "900",
                fontSize: "17px",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "0.3s",
                boxShadow: "0 15px 30px rgba(0,212,255,0.2)",
              }}
            >
              {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: "40px", color: "#333", fontSize: "11px", fontWeight: "bold" }}>
            جميع الحقوق محفوظة <span style={{ color: "#00d4ff" }}>AlliFF ©2026</span>
          </div>
        </div>

        {/* Telegram Info */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <p style={{ color: "#555", fontSize: "13px", fontWeight: "bold" }}>
            ليس لديك حساب؟ أنشئ حسابك عبر البوت
          </p>
          <a
            href="https://t.me/AlliFF_Store_Keysbot"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00d4ff", fontSize: "14px", fontWeight: "900", textDecoration: "none", display: "inline-block", marginTop: "10px" }}
          >
            📱 اذهب إلى البوت الآن
          </a>
        </div>
      </div>
    </div>
  );
}
