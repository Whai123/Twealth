import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDown, ArrowUp, Home, ShoppingCart, PiggyBank } from "lucide-react";

const getTransactionIcon = (category: string, type: string) => {
  if (type === "income") return ArrowDown;
  if (category === "rent" || category === "housing") return Home;
  if (category === "groceries" || category === "shopping") return ShoppingCart;
  if (category === "savings" || category === "investment") return PiggyBank;
  return ArrowUp;
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case "income":
      return { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600", amount: "text-green-600" };
    case "expense":
      return { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-600", amount: "text-red-600" };
    case "transfer":
      return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600", amount: "text-blue-600" };
    default:
      return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600", amount: "text-gray-600" };
  }
};

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => fetch("/api/transactions?limit=10").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <Card className="p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const recentTransactions = transactions || [];

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-transactions">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No transactions yet</p>
            <Button data-testid="button-add-first-transaction">
              <Plus size={16} className="mr-2" />
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.slice(0, 4).map((transaction: any) => {
              const Icon = getTransactionIcon(transaction.category, transaction.type);
              const colors = getTransactionColor(transaction.type);
              const amount = parseFloat(transaction.amount);
              const sign = transaction.type === "income" ? "+" : "-";
              
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={colors.text} size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground" data-testid={`text-transaction-${transaction.id}`}>
                        {transaction.description || transaction.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${colors.amount}`}>
                    {sign}${Math.abs(amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" data-testid="button-add-transaction">
          <Plus size={16} className="mr-2" />
          Add Transaction
        </Button>
      </CardContent>
    </Card>
  );
}
