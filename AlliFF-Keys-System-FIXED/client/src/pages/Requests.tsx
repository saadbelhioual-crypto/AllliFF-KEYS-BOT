import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Requests() {
  const { isAuthenticated } = useAuth();
  const { data: purchases = [] } = trpc.purchases.getMyPurchases.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">يجب تسجيل الدخول أولاً</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            تمت الموافقة
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            مرفوضة
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500 text-white">غير معروف</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "approved":
        return "border-green-500/50 bg-green-500/10";
      case "rejected":
        return "border-red-500/50 bg-red-500/10";
      default:
        return "border-gray-500/50 bg-gray-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 طلباتي</h1>
          <p className="text-gray-300">عرض جميع طلباتك والحالات الخاصة بها</p>
        </div>

        {/* Requests List */}
        {purchases.length === 0 ? (
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardContent className="pt-8 text-center">
              <p className="text-gray-300 text-lg">لا توجد طلبات حالياً</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase: any) => (
              <Card
                key={purchase.id}
                className={`backdrop-blur border-white/20 ${getStatusColor(
                  purchase.status
                )}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">
                        {purchase.packageName || `${purchase.durationDays} يوم - ${purchase.botCount} بوت`}
                      </CardTitle>
                      <CardDescription className="text-gray-300 mt-1">
                        تاريخ الطلب: {new Date(purchase.createdAt).toLocaleDateString("ar-SA")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(purchase.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Price */}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">السعر</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {purchase.gemsPrice} 💎
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">المدة</p>
                      <p className="text-xl font-bold text-white">
                        {purchase.durationDays} يوم
                      </p>
                    </div>

                    {/* Bots */}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">عدد البوتات</p>
                      <p className="text-xl font-bold text-white">
                        {purchase.botCount} بوت
                      </p>
                    </div>
                  </div>

                  {/* Key Info */}
                  {purchase.status === "approved" && purchase.key && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-green-500/30">
                      <p className="text-gray-300 text-sm mb-2">بيانات المفتاح:</p>
                      <div className="space-y-1">
                        <p className="text-white">
                          <span className="text-gray-400">المفتاح:</span>{" "}
                          <code className="bg-black/30 px-2 py-1 rounded text-yellow-400">
                            {purchase.key}
                          </code>
                        </p>
                        <p className="text-white">
                          <span className="text-gray-400">اسم المستخدم:</span>{" "}
                          <code className="bg-black/30 px-2 py-1 rounded text-yellow-400">
                            {purchase.username}
                          </code>
                        </p>
                        <p className="text-white">
                          <span className="text-gray-400">كلمة المرور:</span>{" "}
                          <code className="bg-black/30 px-2 py-1 rounded text-yellow-400">
                            {purchase.password}
                          </code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {purchase.status === "rejected" && purchase.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <p className="text-gray-300 text-sm mb-1">سبب الرفض:</p>
                      <p className="text-red-300">{purchase.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legend */}
        <Card className="bg-white/10 border-white/20 backdrop-blur mt-8">
          <CardHeader>
            <CardTitle className="text-white">📌 حالات الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>قيد الانتظار - جاري المراجعة من قبل الأدمن</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>تمت الموافقة - تم إنشاء المفتاح بنجاح</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>مرفوضة - تم رفض الطلب (تحقق من السبب)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
