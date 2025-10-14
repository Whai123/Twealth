import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Copy, Share2, Gift, Users, ChevronRight, AlertCircle, Trophy, Star, Zap, Crown, Target, Award, TrendingUp, Sparkles, Rocket } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
}

interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCodeId: string;
  createdAt: string;
  referredUserName?: string;
}

interface BonusCredit {
  id: string;
  userId: string;
  amount: number;
  source: string;
  referralId?: string;
  description: string;
  usedAmount: number;
  createdAt: string;
}

export default function ReferralsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [shareCode, setShareCode] = useState('');

  // Fetch user's referral code
  const { data: referralCode, isLoading: isLoadingCode } = useQuery<ReferralCode>({
    queryKey: ['/api/referrals/my-code']
  });

  // Fetch user's referrals
  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery<Referral[]>({
    queryKey: ['/api/referrals/my-referrals']
  });

  // Fetch bonus credits
  const { data: bonusData, isLoading: isLoadingCredits } = useQuery<{
    credits: BonusCredit[];
    availableAmount: number;
  }>({
    queryKey: ['/api/referrals/bonus-credits']
  });

  // Use referral code mutation
  const useCodeMutation = useMutation({
    mutationFn: async (referralCode: string) => {
      const response = await apiRequest('POST', '/api/referrals/use-code', { referralCode });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: t('referrals.success'),
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/bonus-credits'] });
      setShareCode('');
    },
    onError: (error: any) => {
      // Extract the actual error message from the API response
      let errorMessage = 'An error occurred';
      if (error?.message) {
        // Parse error message format: "400: {\"message\":\"Invalid referral code\"}"
        const match = error.message.match(/^\d+:\s*(.+)$/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            errorMessage = parsed.message || errorMessage;
          } catch {
            errorMessage = match[1];
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: t('referrals.error'),
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('referrals.copied'),
        description: t('referrals.copiedDescription'),
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareReferralCode = async () => {
    if (!referralCode) return;
    
    const shareData = {
      title: t('referrals.shareTitle'),
      text: t('referrals.shareText', { code: referralCode.code }),
      url: `${window.location.origin}?ref=${referralCode.code}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(`${shareData.text} ${shareData.url}`);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleUseCode = () => {
    if (!shareCode.trim()) return;
    useCodeMutation.mutate(shareCode.trim());
  };

  if (isLoadingCode || isLoadingReferrals || isLoadingCredits) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6" data-testid="page-referrals">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate referral level based on successful referrals
  const referralLevel = Math.floor((referrals.length) / 5) + 1;
  const nextLevelReferrals = (referralLevel * 5) - referrals.length;
  const levelProgress = ((referrals.length % 5) / 5) * 100;

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { icon: Crown, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20", title: "👑 Referral Royalty" };
    if (level >= 7) return { icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20", title: "🏆 Referral Champion" };
    if (level >= 4) return { icon: Star, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", title: "⭐ Referral Expert" };
    if (level >= 2) return { icon: Award, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20", title: "🎖️ Referral Pro" };
    return { icon: Target, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20", title: "🎯 Referral Starter" };
  };

  const levelBadge = getLevelBadge(referralLevel);

  return (
    <>
      {/* Gamified Header */}
      <header className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-orange-900/50 border-b border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent" data-testid="heading-referrals">
                    🎁 Referral Rewards
                  </h1>
                  <p className="text-xl text-muted-foreground">Share the wealth, grow together!</p>
                </div>
              </div>
              
              {/* Gamification Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <levelBadge.icon className={`w-5 h-5 ${levelBadge.color}`} />
                    <span className="text-sm font-medium">Current Level</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{referralLevel}</div>
                  <div className="text-xs text-muted-foreground">{levelBadge.title}</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Total Referrals</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{referrals.length}</div>
                  <div className="text-xs text-muted-foreground">Friends joined</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Total Earned</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {bonusData?.credits.reduce((sum, credit) => sum + credit.amount, 0) || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Bonus credits</div>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Available</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bonusData?.availableAmount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Ready to use</div>
                </div>
              </div>
              
              {/* Level Progress */}
              <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress to Level {referralLevel + 1}</span>
                  <span className="text-xs text-muted-foreground">{nextLevelReferrals} more referrals needed</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500 relative"
                    style={{ width: `${levelProgress}%` }}
                  >
                    <div className="absolute right-0 top-0 h-full w-2 bg-white/30 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6" data-testid="page-referrals">

        {/* Enhanced Bonus Credits Summary */}
        {bonusData && (
          <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="card-bonus-credits">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                💎 Your Treasure Chest
              </CardTitle>
              <p className="text-muted-foreground">Credits earned through referrals</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2" data-testid="text-available-credits">
                    {bonusData.availableAmount}
                  </div>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">💰 Available Credits</p>
                  <p className="text-sm text-muted-foreground">Ready to spend!</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {bonusData.credits.reduce((sum, credit) => sum + credit.amount, 0)}
                  </div>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">🏆 Total Earned</p>
                  <p className="text-sm text-muted-foreground">All time rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Enhanced My Referral Code */}
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="card-my-code">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                🔗 Your Magic Code
              </CardTitle>
              <CardDescription className="text-base">
                Share this special code and earn rewards together!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {referralCode && (
                <>
                  <div className="relative">
                    <Input 
                      value={referralCode.code} 
                      readOnly 
                      className="font-mono text-xl text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-2 border-blue-200 dark:border-blue-700 h-14 text-blue-800 dark:text-blue-200 font-bold" 
                      data-testid="input-referral-code"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(referralCode.code)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-blue-100 dark:hover:bg-blue-800"
                      data-testid="button-copy-code"
                    >
                      <Copy className="h-5 w-5 text-blue-600" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium" data-testid="text-uses">Used: {referralCode.currentUses}/{referralCode.maxUses}</span>
                    </div>
                    <Badge variant={referralCode.isActive ? "default" : "secondary"} className="bg-green-100 text-green-800 border-green-300">
                      {referralCode.isActive ? '✅ Active' : '❌ Inactive'}
                    </Badge>
                  </div>

                  <Button 
                    onClick={shareReferralCode} 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    data-testid="button-share-code"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    📤 Share & Earn Together
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Use Referral Code */}
          <Card className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 border-orange-200/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="card-use-code">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                🎫 Redeem Invitation
              </CardTitle>
              <CardDescription className="text-base">
                Got a friend's code? Claim your bonus here!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referral-code" className="text-sm font-semibold">Enter Your Friend's Code</Label>
                <Input
                  id="referral-code"
                  placeholder="TYPE-FRIEND-CODE"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg text-center bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/50 dark:to-pink-900/50 border-2 border-orange-200 dark:border-orange-700 h-12 text-orange-800 dark:text-orange-200 font-bold"
                  data-testid="input-use-code"
                />
              </div>
              
              <Button 
                onClick={handleUseCode}
                disabled={!shareCode.trim() || useCodeMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold py-3 h-12 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
                data-testid="button-use-code"
              >
                {useCodeMutation.isPending ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    ⏳ Processing Magic...
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    🎁 Claim Bonus Now
                  </>
                )}
              </Button>

              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-100 via-red-50 to-pink-100 dark:from-orange-900/30 dark:via-red-900/30 dark:to-pink-900/30 rounded-xl border border-orange-200/50 dark:border-orange-700/50">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">💰 Free Bonus Waiting!</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Use a friend's code to get instant bonus credits - completely free! 🎉
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Referral History */}
      <Card data-testid="card-referral-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('referrals.history')}
          </CardTitle>
          <CardDescription>
            {t('referrals.historyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-referrals">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('referrals.noReferrals')}</p>
              <p className="text-sm mt-2">{t('referrals.startSharing')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((referral, index) => (
                <div key={referral.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-referred-user-${index}`}>
                        {referral.referredUserName || t('referrals.friend')} #{index + 1}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-referral-date-${index}`}>
                        {format(new Date(referral.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">+10 {t('referrals.credits')}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bonus Credits History */}
      {bonusData && bonusData.credits.length > 0 && (
        <Card data-testid="card-credits-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {t('referrals.creditsHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bonusData.credits.map((credit, index) => (
                <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium" data-testid={`text-credit-description-${index}`}>
                      {credit.description}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-credit-date-${index}`}>
                      {format(new Date(credit.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600" data-testid={`text-credit-amount-${index}`}>
                      +{credit.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('referrals.used')}: {credit.usedAmount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}