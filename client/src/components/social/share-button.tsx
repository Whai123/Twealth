import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
 DropdownMenu, 
 DropdownMenuContent, 
 DropdownMenuItem, 
 DropdownMenuTrigger,
 DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
 Share2, 
 Twitter, 
 Facebook, 
 Linkedin, 
 MessageCircle, 
 Send, 
 Mail, 
 Copy,
 Sparkles
} from "lucide-react";
import { 
 ShareData, 
 shareToSocialMedia, 
 shareContent, 
 isNativeShareAvailable 
} from "@/lib/social-sharing";

interface ShareButtonProps {
 shareData: ShareData;
 variant?: "default" | "outline" | "ghost" | "secondary";
 size?: "default" | "sm" | "lg";
 showText?: boolean;
 achievement?: boolean;
 className?: string;
}

export default function ShareButton({ 
 shareData, 
 variant = "outline", 
 size = "default", 
 showText = true,
 achievement = false,
 className = ""
}: ShareButtonProps) {
 const [isLoading, setIsLoading] = useState(false);
 const { toast } = useToast();

 const handleShare = async (platform: string) => {
 setIsLoading(true);
 
 try {
 const result = await shareToSocialMedia(platform, shareData);
 
 if (result.success) {
 toast({
 title: "Shared successfully!",
 description: result.message,
 });
 } else {
 toast({
 title: "Share failed",
 description: result.message,
 variant: "destructive"
 });
 }
 } catch (error) {
 toast({
 title: "Share failed",
 description: "Something went wrong. Please try again.",
 variant: "destructive"
 });
 } finally {
 setIsLoading(false);
 }
 };

 const handleNativeShare = async () => {
 setIsLoading(true);
 
 try {
 const result = await shareContent(shareData);
 toast({
 title: "Shared! 📱",
 description: result.message,
 });
 } catch (error) {
 toast({
 title: "Share failed",
 description: "Something went wrong. Please try again.",
 variant: "destructive"
 });
 } finally {
 setIsLoading(false);
 }
 };

 // If native sharing is available on mobile, show simple share button
 if (isNativeShareAvailable()) {
 return (
 <Button
 onClick={handleNativeShare}
 variant={variant}
 size={size}
 disabled={isLoading}
 className={`${achievement ? 'bg-primary text-primary-foreground border-0' : ''} ${className}`}
 data-testid="button-native-share"
 >
 {achievement && <Sparkles className="w-4 h-4 mr-2" />}
 <Share2 className="w-4 h-4 mr-2" />
 {showText && (achievement ? 'Share Achievement' : 'Share')}
 </Button>
 );
 }

 // Desktop/web sharing with platform options
 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant={variant}
 size={size}
 disabled={isLoading}
 className={`${achievement ? 'bg-primary text-primary-foreground border-0' : ''} ${className}`}
 data-testid="button-share-dropdown"
 >
 {achievement && <Sparkles className="w-4 h-4 mr-2" />}
 <Share2 className="w-4 h-4 mr-2" />
 {showText && (achievement ? 'Share Achievement' : 'Share')}
 </Button>
 </DropdownMenuTrigger>
 
 <DropdownMenuContent align="end" className="w-48">
 <div className="p-2">
 <div className="text-xs font-medium text-muted-foreground mb-2">
 Share to social media
 </div>
 
 <DropdownMenuItem 
 onClick={() => handleShare('twitter')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-twitter"
 >
 <Twitter className="w-4 h-4 text-blue-500" />
 Twitter
 </DropdownMenuItem>
 
 <DropdownMenuItem 
 onClick={() => handleShare('facebook')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-facebook"
 >
 <Facebook className="w-4 h-4 text-blue-600" />
 Facebook
 </DropdownMenuItem>
 
 <DropdownMenuItem 
 onClick={() => handleShare('linkedin')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-linkedin"
 >
 <Linkedin className="w-4 h-4 text-blue-700" />
 LinkedIn
 </DropdownMenuItem>
 
 <DropdownMenuSeparator />
 
 <div className="text-xs font-medium text-muted-foreground mb-2 mt-2">
 Share via messaging
 </div>
 
 <DropdownMenuItem 
 onClick={() => handleShare('whatsapp')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-whatsapp"
 >
 <MessageCircle className="w-4 h-4 text-green-500" />
 WhatsApp
 </DropdownMenuItem>
 
 <DropdownMenuItem 
 onClick={() => handleShare('telegram')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-telegram"
 >
 <Send className="w-4 h-4 text-blue-400" />
 Telegram
 </DropdownMenuItem>
 
 <DropdownMenuItem 
 onClick={() => handleShare('email')}
 className="flex items-center gap-2 cursor-pointer"
 data-testid="share-email"
 >
 <Mail className="w-4 h-4 text-gray-600" />
 Email
 </DropdownMenuItem>
 
 <DropdownMenuSeparator />
 
 <DropdownMenuItem 
 onClick={() => handleShare('copy')}
 className="flex items-center gap-2 cursor-pointer font-medium"
 data-testid="share-copy"
 >
 <Copy className="w-4 h-4" />
 Copy Link
 </DropdownMenuItem>
 </div>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}

// Achievement Share Card Component
interface AchievementShareCardProps {
 achievement: {
 title: string;
 description: string;
 icon: React.ComponentType<any>;
 category: 'bronze' | 'silver' | 'gold' | 'platinum';
 points: number;
 };
 shareData: ShareData;
}

export function AchievementShareCard({ achievement, shareData }: AchievementShareCardProps) {
 const Icon = achievement.icon;
 
 const categoryColors = {
 bronze: 'from-orange-400 to-amber-600',
 silver: 'from-gray-300 to-gray-500', 
 gold: 'from-yellow-400 to-yellow-600',
 platinum: 'from-purple-400 to-purple-600'
 };

 const categoryEmojis = {
 bronze: '🥉',
 silver: '🥈',
 gold: '🥇', 
 platinum: '👑'
 };

 return (
 <Card className="relative overflow-hidden border-2 border-primary/20 bg-white dark:bg-gray-900 dark:from-gray-800 dark:to-purple-950/20">
 {/* Background decoration */}
 <div className="absolute inset-0 bg-muted/30" />
 <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-gray-900 rounded-full -translate-y-16 translate-x-16" />
 
 <CardContent className="relative p-6 space-y-4">
 {/* Achievement Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg`}>
 <Icon className="w-6 h-6 text-white" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-lg">{achievement.title}</h3>
 <Badge className="text-xs">
 {categoryEmojis[achievement.category]} {achievement.category.toUpperCase()}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">
 +{achievement.points} points earned
 </p>
 </div>
 </div>
 </div>

 {/* Achievement Description */}
 <p className="text-muted-foreground leading-relaxed">
 {achievement.description}
 </p>

 {/* Share Section */}
 <div className="flex items-center justify-between pt-2 border-t border-border/50">
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Sparkles className="w-4 h-4" />
 <span>Share your achievement</span>
 </div>
 
 <ShareButton 
 shareData={shareData}
 achievement={true}
 showText={false}
 data-testid="achievement-share-button"
 />
 </div>
 </CardContent>
 </Card>
 );
}