import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Zap, Lock, Bell, Trash2, Clock } from "lucide-react";

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiresAt).getTime() - now;

      if (distance < 0) {
        setTimeLeft("منتهي");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}س ${minutes}د`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#ff4d4d", fontSize: "12px", fontWeight: "bold" }}>
      <Clock size={14} />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function Shop() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: balance = 0 } = trpc.gems.getBalance.useQuery(undefined, { enabled: !!user });
  const { data: packages = [], isLoading: packagesLoading, refetch: refetchPackages } = trpc.keyPackages.getAll.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery(undefined, { enabled: !!user });
  const purchaseMutation = trpc.purchases.purchaseWithGems.useMutation();
  const deletePackageMutation = trpc.keyPackages.deletePackage.useMutation();
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  const handlePurchase = async (packageId: number) => {
    setPurchasingId(packageId);
    try {
      const result = await purchaseMutation.mutateAsync({ packageId });
      toast.success(
        result.message || "جاري إنشاء المفتاح وإرساله لك خلال دقيقة على الإشعارات",
        {
          duration: 6000,
          action: {
            label: "عرض الإشعارات",
            onClick: () => navigate("/notifications"),
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || "فشل الشراء");
    } finally {
      setPurchasingId(null);
    }
  };

  const handleDeletePackage = async (packageId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      deletePackageMutation.mutate(
        { packageId },
        {
          onSuccess: () => {
            toast.success("تم حذف العرض بنجاح");
            refetchPackages();
          },
          onError: (error: any) => {
            toast.error(error.message || "فشل حذف العرض");
          },
        }
      );
    }
  };

  if (userLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#00d4ff", fontSize: "18px", fontWeight: "bold" }}>جاري التحميل...</div>
      </div>
    );
  }

  const activePackages = packages.filter(p => p.isActive && (p.remaining === -1 || p.remaining > 0));

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
            متجر المفاتيح
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
            }}
          >
            💰 {balance} نقطة
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Intro */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "10px" }}>
            اختر عرضك المفضل 🔑
          </h2>
          <p style={{ color: "#666", fontSize: "16px" }}>
            استخدم نقاطك لشراء مفاتيح البوتات
          </p>
        </div>

        {/* Packages Grid */}
        {packagesLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ color: "#00d4ff", fontSize: "18px", fontWeight: "bold" }}>جاري تحميل العروض...</div>
          </div>
        ) : activePackages.length === 0 ? (
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
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#555" }}>لا توجد عروض متاحة حالياً</h3>
            <p style={{ color: "#333", fontSize: "14px", marginTop: "10px" }}>يرجى العودة لاحقاً</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "25px",
              marginBottom: "40px",
            }}
          >
            {activePackages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  background: "#0a0a0a",
                  border: pkg.isSpecial ? "2px solid #00d4ff" : "1px solid rgba(0,212,255,0.15)",
                  borderRadius: "25px",
                  padding: "30px 20px",
                  display: "flex",
                  flexDirection: "column",
                  transition: "0.3s",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: pkg.isSpecial ? "0 0 20px rgba(0,212,255,0.1)" : "none",
                }}
              >
                {/* Special Offer Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  {pkg.isSpecial ? (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #00d4ff, #0088ff)",
                        color: "#000",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      عرض خاص
                    </div>
                  ) : <div></div>}
                  
                  {pkg.expiresAt && <Countdown expiresAt={pkg.expiresAt} />}
                </div>

                {/* Delete Button for Admin */}
                {user?.isAdmin && (
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    disabled={deletePackageMutation.isPending}
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      background: "rgba(255, 59, 48, 0.2)",
                      border: "1px solid rgba(255, 59, 48, 0.5)",
                      borderRadius: "8px",
                      padding: "6px 8px",
                      color: "#ff3b30",
                      cursor: deletePackageMutation.isPending ? "not-allowed" : "pointer",
                      transition: "0.3s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: deletePackageMutation.isPending ? 0.6 : 1,
                      zIndex: 10,
                    }}
                    title="حذف العرض"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Package Info */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔑</div>
                  <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "10px" }}>
                    {pkg.durationDays} يوم
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                    <Zap size={16} color="#00d4ff" />
                    {pkg.botCount} بوت
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666", fontSize: "14px" }}>
                    <Lock size={16} color="#00d4ff" />
                    {pkg.maxUsers === -1 ? "عروض غير محدودة" : `${pkg.remaining} عرض متبقي`}
                  </div>
                </div>

                {/* Price */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,136,255,0.05))",
                    border: "1px solid rgba(0,212,255,0.3)",
                    borderRadius: "15px",
                    padding: "15px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ color: "#00d4ff", fontSize: "24px", fontWeight: "900" }}>
                    {pkg.gemsPrice}
                  </div>
                  <div style={{ color: "#666", fontSize: "12px", marginTop: "5px" }}>نقطة</div>
                </div>

                {/* Status */}
                {pkg.maxUsers !== -1 && pkg.remaining <= 0 && (
                  <div
                    style={{
                      background: "rgba(255,77,77,0.1)",
                      border: "1px solid rgba(255,77,77,0.3)",
                      borderRadius: "12px",
                      padding: "12px",
                      textAlign: "center",
                      color: "#ff4d4d",
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginBottom: "15px",
                    }}
                  >
                    ❌ وصل للحد الأقصى من المستخدمين
                  </div>
                )}

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasingId === pkg.id || (pkg.maxUsers !== -1 && pkg.remaining <= 0)}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background:
                      pkg.maxUsers !== -1 && pkg.remaining <= 0
                        ? "rgba(255,77,77,0.2)"
                        : "linear-gradient(135deg, #00d4ff, #0088ff)",
                    border: "none",
                    borderRadius: "15px",
                    color: pkg.maxUsers !== -1 && pkg.remaining <= 0 ? "#666" : "#000",
                    fontWeight: "900",
                    fontSize: "15px",
                    cursor:
                      purchasingId === pkg.id || (pkg.maxUsers !== -1 && pkg.remaining <= 0)
                        ? "not-allowed"
                        : "pointer",
                    transition: "0.3s",
                    opacity: purchasingId === pkg.id ? 0.7 : 1,
                  }}
                >
                  {purchasingId === pkg.id ? "جاري الشراء..." : "شراء الآن"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
