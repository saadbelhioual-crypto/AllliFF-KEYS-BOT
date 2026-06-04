import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { ArrowRight, Trash2, CheckCircle2, Bell, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BOT_MANAGER_SITE = "https://alliff-alliff-bot-manager.hf.space/";

export default function Notifications() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: balance = 0 } = trpc.gems.getBalance.useQuery(undefined, { enabled: !!user });

  const {
    data: notifications = [],
    isLoading: notifLoading,
    refetch,
  } = trpc.notifications.getMyNotifications.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 15000,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteNotifMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الإشعار");
      refetch();
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    deleteNotifMutation.mutate({ id });
  };

  // تحديد إذا كان الإشعار إشعار مفتاح ناجح
  const isKeySuccessNotif = (title: string) => {
    return title.includes("تم شراء المفتاح") || title.includes("✅");
  };

  if (userLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#00d4ff", fontSize: "18px", fontWeight: "bold" }}>جاري التحميل...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

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
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "8px",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight size={20} />
          </button>
          <h1 style={{ color: "#00d4ff", fontSize: "20px", fontWeight: "900", margin: 0 }}>
            الإشعارات
          </h1>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,136,255,0.05))",
            border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: "12px",
            padding: "8px 16px",
            color: "#00d4ff",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          💰 {balance} نقطة
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Intro */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "10px" }}>
            إشعاراتك 🔔
          </h2>
          <p style={{ color: "#666", fontSize: "16px" }}>
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار جديد` : "لا توجد إشعارات جديدة"}
          </p>
        </div>

        {/* Notifications List */}
        {notifLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ color: "#00d4ff", fontSize: "18px", fontWeight: "bold" }}>جاري تحميل الإشعارات...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "25px",
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>📭</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#555" }}>لا توجد إشعارات</h3>
            <p style={{ color: "#333", fontSize: "14px", marginTop: "10px" }}>ستظهر الإشعارات هنا عند وصول رسائل جديدة</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "40px" }}>
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                style={{
                  background: notif.isRead ? "#0a0a0a" : "rgba(0,212,255,0.05)",
                  border: notif.isRead ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,212,255,0.2)",
                  borderRadius: "20px",
                  padding: "20px",
                  transition: "0.3s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "900", margin: 0, color: notif.isRead ? "#999" : "#00d4ff" }}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span style={{
                          background: "#ff4d4d",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}>جديد</span>
                      )}
                    </div>
                    <p style={{ color: "#888", fontSize: "14px", margin: "0 0 8px", whiteSpace: "pre-line", lineHeight: "1.8" }}>
                      {notif.message}
                    </p>
                    <div style={{ color: "#444", fontSize: "12px" }}>
                      {new Date(notif.createdAt).toLocaleString("ar-SA")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginLeft: "15px", flexShrink: 0 }}>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        style={{
                          background: "rgba(0,212,255,0.1)",
                          border: "1px solid rgba(0,212,255,0.3)",
                          borderRadius: "12px",
                          padding: "8px",
                          color: "#00d4ff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      style={{
                        background: "rgba(255,77,77,0.1)",
                        border: "1px solid rgba(255,77,77,0.3)",
                        borderRadius: "12px",
                        padding: "8px",
                        color: "#ff4d4d",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* زر زيارة الموقع - يظهر فقط في إشعارات المفاتيح الناجحة */}
                {isKeySuccessNotif(notif.title) && (
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(0,212,255,0.1)" }}>
                    <a
                      href={BOT_MANAGER_SITE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "linear-gradient(135deg, #00d4ff, #0088ff)",
                        color: "#000",
                        padding: "10px 20px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "14px",
                        textDecoration: "none",
                        transition: "opacity 0.2s",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <ExternalLink size={16} />
                      زيارة الموقع
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "25px",
            padding: "30px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell size={20} color="#00d4ff" />
            معلومات الإشعارات
          </h3>
          <ul style={{ color: "#666", fontSize: "14px", lineHeight: "1.8", listStyle: "none", padding: 0, margin: 0 }}>
            <li>• ستتلقى إشعارات عند إرسال الأدمن رسائل مهمة.</li>
            <li>• عند شراء مفتاح، ستصل بيانات الحساب خلال دقيقة.</li>
            <li>• يمكنك تحديد الإشعار كمقروء بالضغط على الزر الأزرق.</li>
            <li>• يمكنك حذف الإشعارات التي لا تريدها.</li>
            <li>• الإشعارات الجديدة ستظهر في أعلى القائمة.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
