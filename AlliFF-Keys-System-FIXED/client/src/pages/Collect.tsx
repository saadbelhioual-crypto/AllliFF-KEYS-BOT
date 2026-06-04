import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, Zap, ExternalLink, Trash2, CheckCircle } from "lucide-react";

export default function Collect() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: balance = 0 } = trpc.gems.getBalance.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: links = [], refetch: refetchLinks } = trpc.shortLinks.getAll.useQuery();
  const deleteLinkMutation = trpc.shortLinks.deleteLink.useMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login");
    }
  }, [user, userLoading, navigate]);

  const handleClaim = async (linkId: string, externalUrl?: string, isUsed?: boolean) => {
    if (isUsed) return;

    if (externalUrl) {
      window.open(externalUrl, "_blank");
      toast.info("يرجى إكمال الرابط للحصول على النقاط");
      return;
    }

    // إذا كان رابط بوت داخلي
    const botLink = `https://t.me/AlliFF_Store_Keysbot?start=points_${linkId}`;
    window.open(botLink, "_blank");
    toast.info("تم فتح البوت، اتبع التعليمات هناك");
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الرابط؟")) {
      deleteLinkMutation.mutate(
        { linkId },
        {
          onSuccess: () => {
            toast.success("تم حذف الرابط بنجاح");
            refetchLinks();
          },
          onError: (error: any) => {
            toast.error(error.message || "فشل حذف الرابط");
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

  const activeLinks = (links || []).filter(l => l.isActive && (l.remaining > 0 || l.isUsed));

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
            تجميع النقاط
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
          <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "10px" }}>اجمع نقاطك الآن ⚡</h2>
          <p style={{ color: "#666", fontSize: "16px" }}>استخدم الروابط المتاحة لزيادة رصيدك مجاناً</p>
        </div>

        {/* Links List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
          {activeLinks.length === 0 ? (
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
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#555" }}>لا توجد روابط متاحة حالياً</h3>
              <p style={{ color: "#333", fontSize: "14px", marginTop: "10px" }}>يرجى العودة لاحقاً أو متابعة البوت للجديد</p>
            </div>
          ) : (
            activeLinks.map((link) => (
              <div
                key={link.id}
                style={{
                  background: "#0a0a0a",
                  border: link.isUsed ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,212,255,0.1)",
                  borderRadius: "25px",
                  padding: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "0.3s",
                  opacity: link.isUsed ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      background: link.isUsed ? "rgba(255,255,255,0.02)" : "rgba(0,212,255,0.05)",
                      borderRadius: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      color: link.isUsed ? "#444" : "#00d4ff",
                    }}
                  >
                    {link.externalUrl ? <ExternalLink size={28} /> : <Zap size={28} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "900", marginBottom: "5px", color: link.isUsed ? "#666" : "#fff" }}>
                      {link.gemsPerUse} نقطة مجانية
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#555", fontSize: "13px" }}>
                      <span>👥 المتبقي: {link.remaining} / {link.maxUsers}</span>
                      <span>•</span>
                      <span>{link.externalUrl ? "رابط خارجي" : "رابط مباشر"}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => handleClaim(link.linkId, link.externalUrl, link.isUsed)}
                    disabled={link.isUsed}
                    style={{
                      padding: "12px 25px",
                      background: link.isUsed 
                        ? "rgba(255,255,255,0.05)" 
                        : "linear-gradient(135deg, #00d4ff, #0088ff)",
                      border: link.isUsed ? "1px solid rgba(255,255,255,0.1)" : "none",
                      borderRadius: "15px",
                      color: link.isUsed ? "#666" : "#000",
                      fontWeight: "900",
                      fontSize: "15px",
                      cursor: link.isUsed ? "default" : "pointer",
                      transition: "0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {link.isUsed ? (
                      <>
                        تم التجميع
                        <CheckCircle size={18} />
                      </>
                    ) : (
                      <>
                        تجميع
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  {user?.isAdmin && (
                    <button
                      onClick={() => handleDeleteLink(link.linkId)}
                      disabled={deleteLinkMutation.isPending}
                      style={{
                        padding: "12px 15px",
                        background: "rgba(255, 59, 48, 0.2)",
                        border: "1px solid rgba(255, 59, 48, 0.5)",
                        borderRadius: "12px",
                        color: "#ff3b30",
                        fontWeight: "bold",
                        fontSize: "14px",
                        cursor: deleteLinkMutation.isPending ? "not-allowed" : "pointer",
                        transition: "0.3s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        opacity: deleteLinkMutation.isPending ? 0.6 : 1,
                      }}
                      title="حذف الرابط"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
