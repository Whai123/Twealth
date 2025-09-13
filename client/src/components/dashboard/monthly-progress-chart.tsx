import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MonthlyProgressChart() {
  // Mock data for the chart
  const monthlyData = [
    { month: "Aug", income: 3200, target: 6000 },
    { month: "Sep", income: 4100, target: 6000 },
    { month: "Oct", income: 2800, target: 6000 },
    { month: "Nov", income: 4600, target: 6000 },
    { month: "Dec", income: 5200, target: 6000 },
    { month: "Jan", income: 5200, target: 6000, projected: true },
  ];

  const maxValue = 6000;
  const currentMonth = monthlyData[monthlyData.length - 1];

  return (
    <Card className="p-6 shadow-sm">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Monthly Financial Progress</CardTitle>
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Chart Area */}
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-4 text-xs text-muted-foreground space-y-8">
            <div>$6k</div>
            <div>$4k</div>
            <div>$2k</div>
            <div>$0</div>
          </div>
          
          {/* Chart bars */}
          <div className="flex items-end justify-center space-x-6 h-full pt-8 pl-12 pr-4 pb-8">
            {monthlyData.map((data, index) => {
              const height = (data.income / maxValue) * 100;
              const isProjected = data.projected;
              
              return (
                <div key={data.month} className="flex flex-col items-center">
                  <div 
                    className={`w-8 rounded-t transition-all duration-300 ${
                      isProjected 
                        ? "bg-primary/60 border-2 border-primary border-dashed" 
                        : "bg-primary"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${data.month}: $${data.income.toLocaleString()}`}
                    data-testid={`chart-bar-${data.month.toLowerCase()}`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-4 flex justify-between text-xs text-muted-foreground">
            {monthlyData.map((data) => (
              <span key={data.month}>{data.month}</span>
            ))}
          </div>
          
          {/* Chart Legend */}
          <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span className="text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-primary border-dashed rounded"></div>
              <span className="text-muted-foreground">Target</span>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-lg font-semibold text-foreground" data-testid="text-current-month-income">
              ${currentMonth.income.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Monthly Target</p>
            <p className="text-lg font-semibold text-foreground" data-testid="text-monthly-target">
              ${currentMonth.target.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-primary" data-testid="text-remaining-target">
              ${(currentMonth.target - currentMonth.income).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
