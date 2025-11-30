import { Card, CardContent } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { ArrowLeft, Home, Search, Compass, Sparkles, TrendingUp } from"lucide-react";
import { useLocation } from"wouter";
import { useTranslation } from 'react-i18next';

export default function NotFound() {
 const [, setLocation] = useLocation();
 const { t } = useTranslation();

 const handleGoHome = () => setLocation("/");
 const handleGoBack = () => window.history.back();

 const quickActions = [
 { icon: Home, label: t('navigation.dashboard'), path:"/", color:"bg-blue-500" },
 { icon: TrendingUp, label: t('navigation.money'), path:"/money-tracking", color:"bg-green-500" },
 { icon: Sparkles, label: t('navigation.aiAssistant'), path:"/ai-assistant", color:"bg-blue-500" },
 { icon: Compass, label: t('navigation.goals'), path:"/financial-goals", color:"bg-orange-500" }
 ];

 return (
 <div className="min-h-screen w-full flex items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
 <div className="max-w-2xl w-full text-center space-y-8">
 {/* Animated 404 */}
 <div className="relative">
 <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"></div>
 <div className="relative">
 <h1 className="text-8xl md:text-9xl font-bold text-blue-600 dark:text-blue-400">
 404
 </h1>
 </div>
 </div>

 {/* Modern messaging */}
 <div className="space-y-4">
 <h2 className="text-3xl md:text-4xl font-bold text-foreground">
 {t('notFound.title')}
 </h2>
 <p className="text-lg text-muted-foreground max-w-md mx-auto">
 {t('notFound.message')}
 </p>
 </div>

 {/* Action buttons */}
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Button 
 onClick={handleGoBack}
 variant="outline"
 size="lg"
 className="group transition-all"
 data-testid="button-go-back"
 >
 <ArrowLeft className="w-5 h-5 mr-2 group-" />
 {t('notFound.goBack')}
 </Button>
 
 <Button 
 onClick={handleGoHome}
 size="lg"
 className="bg-primary text-primary-foreground shadow-lg"
 data-testid="button-go-home"
 >
 <Home className="w-5 h-5 mr-2" />
 {t('notFound.backToDashboard')}
 </Button>
 </div>

 {/* Quick navigation */}
 <Card className="bg-card/95 backdrop-blur-sm border border-border/50 p-6">
 <h3 className="text-xl font-semibold mb-4 text-foreground">{t('notFound.quickAccess')}</h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {quickActions.map((action, index) => (
 <Button
 key={index}
 variant="ghost"
 onClick={() => setLocation(action.path)}
 className="h-auto p-4 flex flex-col items-center gap-2 transition-all"
 data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
 >
 <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
 <action.icon className="w-5 h-5 text-white dark:text-white" />
 </div>
 <span className="text-sm font-medium">{action.label}</span>
 </Button>
 ))}
 </div>
 </Card>

 {/* Helpful tip */}
 <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
 <div className="flex items-center gap-2 mb-2">
 <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
 <span className="font-medium text-blue-900 dark:text-blue-100">{t('notFound.proTip')}</span>
 </div>
 <p className="text-sm text-blue-700 dark:text-blue-300">
 {t('notFound.proTipMessage')}
 </p>
 </div>
 </div>
 </div>
 );
}
