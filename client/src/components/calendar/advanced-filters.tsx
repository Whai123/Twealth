import { useState } from "react";
import { Filter, X, Calendar, DollarSign, Clock, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface FilterOptions {
  categories: string[];
  timeValueRange: [number, number];
  budgetRange: [number, number];
  roiThreshold: number;
  hasROI: boolean;
  hasTimeTracking: boolean;
  isUpcoming: boolean;
  groupId: string | null;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories: string[];
  availableGroups: Array<{ id: string; name: string }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AdvancedFilters({ 
  onFiltersChange, 
  availableCategories,
  availableGroups,
  open: controlledOpen,
  onOpenChange 
}: AdvancedFiltersProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    timeValueRange: [0, 2000],
    budgetRange: [0, 5000],
    roiThreshold: 0,
    hasROI: false,
    hasTimeTracking: false,
    isUpcoming: false,
    groupId: null
  });

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      categories: [],
      timeValueRange: [0, 2000],
      budgetRange: [0, 5000],
      roiThreshold: 0,
      hasROI: false,
      hasTimeTracking: false,
      isUpcoming: false,
      groupId: null
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.timeValueRange[0] > 0 || filters.timeValueRange[1] < 2000,
    filters.budgetRange[0] > 0 || filters.budgetRange[1] < 5000,
    filters.roiThreshold !== 0,
    filters.hasROI,
    filters.hasTimeTracking,
    filters.isUpcoming,
    filters.groupId !== null
  ].filter(Boolean).length;

  return (
    <>
      {/* Filter Trigger Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="relative transition-all"
            data-testid="button-open-filters"
          >
            <Filter size={16} className="mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="text-blue-600" size={20} />
              Advanced Event Filters
            </DialogTitle>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Refine your calendar view with smart filtering options
              </p>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-destructive hover:bg-destructive/10"
                  data-testid="button-clear-filters"
                >
                  <X size={14} className="mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Category Filter */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="text-blue-600" size={16} />
                  Event Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={filters.categories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      onClick={() => {
                        const newCategories = filters.categories.includes(category)
                          ? filters.categories.filter(c => c !== category)
                          : [...filters.categories, category];
                        updateFilter('categories', newCategories);
                      }}
                      data-testid={`filter-category-${category}`}
                    >
                      {category}
                    </Badge>
                  ))}
                  {availableCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No categories available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Value Filter */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="text-green-600" size={16} />
                    Time Value Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="px-2">
                    <Slider
                      value={filters.timeValueRange}
                      onValueChange={(value) => updateFilter('timeValueRange', value as [number, number])}
                      max={2000}
                      min={0}
                      step={50}
                      className="w-full"
                      data-testid="slider-time-value"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${filters.timeValueRange[0]}</span>
                    <span>${filters.timeValueRange[1]}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Filter */}
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="text-yellow-600" size={16} />
                    Budget Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="px-2">
                    <Slider
                      value={filters.budgetRange}
                      onValueChange={(value) => updateFilter('budgetRange', value as [number, number])}
                      max={5000}
                      min={0}
                      step={100}
                      className="w-full"
                      data-testid="slider-budget"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${filters.budgetRange[0]}</span>
                    <span>${filters.budgetRange[1]}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROI Filter */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={16} />
                  ROI Threshold
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="px-2">
                  <Slider
                    value={[filters.roiThreshold]}
                    onValueChange={(value) => updateFilter('roiThreshold', value[0])}
                    max={200}
                    min={-100}
                    step={10}
                    className="w-full"
                    data-testid="slider-roi"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>-100%</span>
                  <span className="font-medium">≥{filters.roiThreshold}%</span>
                  <span>+200%</span>
                </div>
              </CardContent>
            </Card>

            {/* Group Filter */}
            {availableGroups.length > 0 && (
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="text-indigo-600" size={16} />
                    Group Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Select 
                    value={filters.groupId || 'all'} 
                    onValueChange={(value) => updateFilter('groupId', value === 'all' ? null : value)}
                  >
                    <SelectTrigger data-testid="select-group-filter">
                      <SelectValue placeholder="All groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All groups</SelectItem>
                      {availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Toggle Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="has-roi" className="font-medium">Has ROI Data</Label>
                      <p className="text-sm text-muted-foreground">Show only events with calculated ROI</p>
                    </div>
                    <Switch
                      id="has-roi"
                      checked={filters.hasROI}
                      onCheckedChange={(value) => updateFilter('hasROI', value)}
                      data-testid="switch-has-roi"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="has-tracking" className="font-medium">Time Tracked</Label>
                      <p className="text-sm text-muted-foreground">Show only events with time tracking</p>
                    </div>
                    <Switch
                      id="has-tracking"
                      checked={filters.hasTimeTracking}
                      onCheckedChange={(value) => updateFilter('hasTimeTracking', value)}
                      data-testid="switch-has-tracking"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="upcoming-only" className="font-medium">Upcoming Only</Label>
                      <p className="text-sm text-muted-foreground">Show only future events</p>
                    </div>
                    <Switch
                      id="upcoming-only"
                      checked={filters.isUpcoming}
                      onCheckedChange={(value) => updateFilter('isUpcoming', value)}
                      data-testid="switch-upcoming-only"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} active
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        Your calendar is filtered based on your selections
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-apply-filters"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

