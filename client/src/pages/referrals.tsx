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
import { Copy, Share2, Gift, Users, ChevronRight, AlertCircle } from 'lucide-react';
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" data-testid="page-referrals">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-referrals">
          {t('referrals.title')}
        </h1>
        <p className="text-muted-foreground" data-testid="text-referrals-description">
          {t('referrals.description')}
        </p>
      </div>

      {/* Bonus Credits Summary */}
      {bonusData && (
        <Card data-testid="card-bonus-credits">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {t('referrals.bonusCredits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-available-credits">
              {bonusData.availableAmount} {t('referrals.availableCredits')}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('referrals.totalEarned')}: {bonusData.credits.reduce((sum, credit) => sum + credit.amount, 0)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Referral Code */}
        <Card data-testid="card-my-code">
          <CardHeader>
            <CardTitle>{t('referrals.myCode')}</CardTitle>
            <CardDescription>
              {t('referrals.myCodeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referralCode && (
              <>
                <div className="flex items-center gap-2">
                  <Input 
                    value={referralCode.code} 
                    readOnly 
                    className="font-mono text-lg" 
                    data-testid="input-referral-code"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(referralCode.code)}
                    data-testid="button-copy-code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span data-testid="text-uses">{t('referrals.uses')}: {referralCode.currentUses}/{referralCode.maxUses}</span>
                  <Badge variant={referralCode.isActive ? "default" : "secondary"}>
                    {referralCode.isActive ? t('referrals.active') : t('referrals.inactive')}
                  </Badge>
                </div>

                <Button 
                  onClick={shareReferralCode} 
                  className="w-full"
                  data-testid="button-share-code"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('referrals.shareCode')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Use Referral Code */}
        <Card data-testid="card-use-code">
          <CardHeader>
            <CardTitle>{t('referrals.useCode')}</CardTitle>
            <CardDescription>
              {t('referrals.useCodeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-code">{t('referrals.enterCode')}</Label>
              <Input
                id="referral-code"
                placeholder={t('referrals.codePlaceholder')}
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                className="font-mono"
                data-testid="input-use-code"
              />
            </div>
            
            <Button 
              onClick={handleUseCode}
              disabled={!shareCode.trim() || useCodeMutation.isPending}
              className="w-full"
              data-testid="button-use-code"
            >
              {useCodeMutation.isPending ? t('referrals.processing') : t('referrals.useCodeButton')}
            </Button>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('referrals.bonusInfo')}
              </p>
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
  );
}