import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
  ChartOptions as ChartJSOptions
} from 'chart.js';
import {
  Line as ChartJSLine,
  Bar as ChartJSBar,
  Pie as ChartJSPie,
  Doughnut as ChartJSDoughnut,
  Radar as ChartJSRadar,
  PolarArea as ChartJSPolarArea,
  Scatter as ChartJSScatter,
  Bubble as ChartJSBubble
} from 'react-chartjs-2';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  LineChart,
  PieChart,
  Cell,
  ScatterChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Sankey,
  ComposedChart,
  ReferenceLine,
  ReferenceArea,
  Brush,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Calendar,
  Download,
  Share,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Grid,
  List,
  Clock,
  Target,
  Zap,
  Award,
  BookOpen,
  Brain,
  Heart,
  Star,
  ThumbsUp,
  MessageSquare,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Fullscreen,
  MousePointer,
  Move,
  RotateCcw,
  Save,
  Upload,
  FileText,
  Image,
  Video,
  Mic,
  Camera,
  Map,
  Globe,
  Compass,
  Navigation,
  Layers,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Sidebar,
  Menu,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Link,
  Bookmark,
  Tag,
  Flag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/utils/cn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  ChartTooltip,
  Legend,
  TimeScale
);

// Types and Interfaces
export interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[] | DataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  hidden?: boolean;
  type?: string;
  yAxisID?: string;
  stack?: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip: {
      enabled: boolean;
      mode: string;
      intersect: boolean;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      type?: string;
      time?: {
        unit: string;
        displayFormats: Record<string, string>;
      };
    };
    y?: {
      display: boolean;
      beginAtZero: boolean;
      min?: number;
      max?: number;
    };
  };
  interaction?: {
    mode: string;
    intersect: boolean;
  };
  animation?: {
    duration: number;
    easing: string;
  };
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'map' | 'timeline' | 'heatmap';
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble' | 'area' | 'funnel';
  data: any;
  options: any;
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  refreshInterval?: number;
  dataSource: string;
  filters?: FilterConfig[];
  customization: WidgetCustomization;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
}

export interface WidgetCustomization {
  colors: string[];
  theme: 'light' | 'dark' | 'auto';
  showGrid: boolean;
  showLegend: boolean;
  showTooltips: boolean;
  animation: boolean;
  borderRadius: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  settings: DashboardSettings;
  permissions: DashboardPermissions;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPublic: boolean;
  shareUrl?: string;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  showToolbar: boolean;
  showFilters: boolean;
  allowExport: boolean;
  allowSharing: boolean;
  gridSize: number;
  snapToGrid: boolean;
  backgroundColor: string;
  padding: number;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
  public: boolean;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'percentage' | 'currency' | 'time' | 'bytes';
  icon?: string;
  color?: string;
  description?: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface HeatmapData {
  x: number;
  y: number;
  value: number;
  label?: string;
}

export interface GeospatialData {
  latitude: number;
  longitude: number;
  value: number;
  label: string;
  category?: string;
  properties?: Record<string, any>;
}

export interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'dashboard' | 'table' | 'chart' | 'pdf' | 'excel';
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    recipients: string[];
  };
  dataSource: string;
  filters: FilterConfig[];
  aggregations: AggregationConfig[];
  sorting: SortConfig[];
  formatting: FormattingConfig;
  distribution: DistributionConfig;
}

export interface AggregationConfig {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'stddev' | 'variance';
  alias?: string;
  groupBy?: string[];
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

export interface FormattingConfig {
  numberFormat: {
    decimals: number;
    thousandsSeparator: string;
    decimalSeparator: string;
    prefix?: string;
    suffix?: string;
  };
  dateFormat: string;
  booleanFormat: {
    trueValue: string;
    falseValue: string;
  };
}

export interface DistributionConfig {
  email: {
    enabled: boolean;
    recipients: string[];
    subject: string;
    body: string;
    attachments: boolean;
  };
  slack: {
    enabled: boolean;
    webhook: string;
    channel: string;
    message: string;
  };
  teams: {
    enabled: boolean;
    webhook: string;
    message: string;
  };
}

// Main Advanced Data Visualization Component
export const AdvancedDataVisualization: React.FC = () => {
  // State Management
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  
  const [analyticsData, setAnalyticsData] = useState<Record<string, any>>({});
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'fullscreen'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const [exportOptions, setExportOptions] = useState({
    format: 'png' as 'png' | 'pdf' | 'excel' | 'csv',
    includeFilters: true,
    includeMetadata: true,
    quality: 'high' as 'low' | 'medium' | 'high'
  });

  // Refs
  const dashboardRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const resizeObserverRef = useRef<ResizeObserver>();

  // Color schemes for charts
  const colorSchemes = {
    default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
    pastel: ['#93C5FD', '#6EE7B7', '#FDE68A', '#FCA5A5', '#C4B5FD', '#F9A8D4', '#7DD3FC', '#FDBA74'],
    vibrant: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0891B2', '#EA580C'],
    monochrome: ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB'],
    sunset: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'],
    ocean: ['#006BA6', '#0496C7', '#0CC0DF', '#A2D5F2', '#B8336A', '#C490D1', '#EDE7F6', '#FFF3E0']
  };

  // Initialize dashboard
  useEffect(() => {
    initializeDashboard();
    setupResizeObserver();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshDashboardData();
      }, refreshInterval);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Data fetching
  useEffect(() => {
    if (activeDashboard) {
      loadDashboardData(activeDashboard);
    }
  }, [activeDashboard, activeFilters, dateRange]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Load available dashboards
      const dashboardsResponse = await fetch('/api/analytics/dashboards');
      const dashboardsData = await dashboardsResponse.json();
      setDashboards(dashboardsData);
      
      // Load default dashboard or first available
      if (dashboardsData.length > 0) {
        setActiveDashboard(dashboardsData[0].id);
      } else {
        // Create a default dashboard
        await createDefaultDashboard();
      }
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultDashboard = async () => {
    const defaultDashboard: DashboardLayout = {
      id: 'default',
      name: 'StudyGenius Analytics',
      description: 'Comprehensive learning analytics dashboard',
      widgets: createDefaultWidgets(),
      settings: {
        autoRefresh: true,
        refreshInterval: 30000,
        theme: 'light',
        showToolbar: true,
        showFilters: true,
        allowExport: true,
        allowSharing: true,
        gridSize: 20,
        snapToGrid: true,
        backgroundColor: '#f8fafc',
        padding: 16
      },
      permissions: {
        view: ['*'],
        edit: ['admin'],
        admin: ['admin'],
        public: false
      },
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['analytics', 'learning', 'default'],
      isPublic: false
    };

    setDashboards([defaultDashboard]);
    setActiveDashboard(defaultDashboard.id);
    setWidgets(defaultDashboard.widgets);
  };

  const createDefaultWidgets = (): DashboardWidget[] => {
    return [
      // User Engagement Metrics
      {
        id: 'user-engagement',
        title: 'User Engagement',
        type: 'chart',
        chartType: 'line',
        data: null,
        options: {},
        position: { x: 0, y: 0, w: 6, h: 4 },
        visible: true,
        refreshInterval: 30000,
        dataSource: 'user-engagement',
        customization: createDefaultCustomization()
      },
      
      // Learning Outcomes
      {
        id: 'learning-outcomes',
        title: 'Learning Outcomes',
        type: 'chart',
        chartType: 'bar',
        data: null,
        options: {},
        position: { x: 6, y: 0, w: 6, h: 4 },
        visible: true,
        refreshInterval: 60000,
        dataSource: 'learning-outcomes',
        customization: createDefaultCustomization()
      },
      
      // Content Performance
      {
        id: 'content-performance',
        title: 'Content Performance',
        type: 'chart',
        chartType: 'doughnut',
        data: null,
        options: {},
        position: { x: 0, y: 4, w: 4, h: 4 },
        visible: true,
        refreshInterval: 60000,
        dataSource: 'content-performance',
        customization: createDefaultCustomization()
      },
      
      // Key Metrics
      {
        id: 'key-metrics',
        title: 'Key Metrics',
        type: 'metric',
        data: null,
        options: {},
        position: { x: 4, y: 4, w: 4, h: 4 },
        visible: true,
        refreshInterval: 30000,
        dataSource: 'key-metrics',
        customization: createDefaultCustomization()
      },
      
      // User Activity Heatmap
      {
        id: 'activity-heatmap',
        title: 'User Activity Heatmap',
        type: 'heatmap',
        data: null,
        options: {},
        position: { x: 8, y: 4, w: 4, h: 4 },
        visible: true,
        refreshInterval: 300000,
        dataSource: 'activity-heatmap',
        customization: createDefaultCustomization()
      },
      
      // Learning Progress Timeline
      {
        id: 'progress-timeline',
        title: 'Learning Progress Timeline',
        type: 'timeline',
        data: null,
        options: {},
        position: { x: 0, y: 8, w: 12, h: 3 },
        visible: true,
        refreshInterval: 60000,
        dataSource: 'progress-timeline',
        customization: createDefaultCustomization()
      }
    ];
  };

  const createDefaultCustomization = (): WidgetCustomization => ({
    colors: colorSchemes.default,
    theme: 'light',
    showGrid: true,
    showLegend: true,
    showTooltips: true,
    animation: true,
    borderRadius: 8,
    opacity: 1,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif'
  });

  const loadDashboardData = async (dashboardId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load dashboard configuration
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (!dashboard) return;
      
      setWidgets(dashboard.widgets);
      
      // Load data for each widget
      for (const widget of dashboard.widgets) {
        if (widget.visible) {
          await loadWidgetData(widget);
        }
      }
      
      // Load metrics
      await loadMetrics();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWidgetData = async (widget: DashboardWidget) => {
    try {
      const params = new URLSearchParams({
        dataSource: widget.dataSource,
        dateRange: JSON.stringify(dateRange),
        filters: JSON.stringify(activeFilters)
      });
      
      const response = await fetch(`/api/analytics/widget-data?${params}`);
      const data = await response.json();
      
      // Update widget with new data
      setWidgets(prev => prev.map(w => 
        w.id === widget.id 
          ? { ...w, data: formatWidgetData(data, widget) }
          : w
      ));
      
    } catch (error) {
      console.error(`Failed to load data for widget ${widget.id}:`, error);
    }
  };

  const formatWidgetData = (data: any, widget: DashboardWidget) => {
    switch (widget.type) {
      case 'chart':
        return formatChartData(data, widget.chartType!);
      case 'metric':
        return formatMetricData(data);
      case 'table':
        return formatTableData(data);
      case 'heatmap':
        return formatHeatmapData(data);
      case 'timeline':
        return formatTimelineData(data);
      default:
        return data;
    }
  };

  const formatChartData = (data: any[], chartType: string): ChartData => {
    const labels = data.map(item => item.label || item.x);
    
    switch (chartType) {
      case 'line':
      case 'area':
        return {
          labels,
          datasets: [{
            label: 'Value',
            data: data.map(item => item.y || item.value),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: chartType === 'area',
            tension: 0.4
          }]
        };
        
      case 'bar':
        return {
          labels,
          datasets: [{
            label: 'Value',
            data: data.map(item => item.y || item.value),
            backgroundColor: colorSchemes.default,
            borderColor: colorSchemes.default.map(color => color.replace(')', ', 0.8)')),
            borderWidth: 1
          }]
        };
        
      case 'pie':
      case 'doughnut':
        return {
          labels,
          datasets: [{
            label: 'Value',
            data: data.map(item => item.y || item.value),
            backgroundColor: colorSchemes.default,
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        };
        
      default:
        return {
          labels,
          datasets: [{
            label: 'Value',
            data: data.map(item => item.y || item.value),
            backgroundColor: colorSchemes.default[0]
          }]
        };
    }
  };

  const formatMetricData = (data: any[]): AnalyticsMetric[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      value: item.value,
      previousValue: item.previousValue,
      change: item.change,
      changePercent: item.changePercent,
      trend: item.trend || 'stable',
      format: item.format || 'number',
      icon: item.icon,
      color: item.color,
      description: item.description,
      target: item.target,
      threshold: item.threshold
    }));
  };

  const formatTableData = (data: any[]) => {
    return {
      columns: Object.keys(data[0] || {}),
      rows: data
    };
  };

  const formatHeatmapData = (data: any[]): HeatmapData[] => {
    return data.map(item => ({
      x: item.x,
      y: item.y,
      value: item.value,
      label: item.label
    }));
  };

  const formatTimelineData = (data: any[]): TimeSeriesData[] => {
    return data.map(item => ({
      timestamp: new Date(item.timestamp),
      value: item.value,
      label: item.label,
      category: item.category,
      metadata: item.metadata
    }));
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          filters: activeFilters
        })
      });
      
      const data = await response.json();
      setMetrics(formatMetricData(data));
      
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const refreshDashboardData = useCallback(async () => {
    if (activeDashboard) {
      await loadDashboardData(activeDashboard);
    }
  }, [activeDashboard, activeFilters, dateRange]);

  const setupResizeObserver = () => {
    if (dashboardRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        // Handle responsive layout adjustments
        handleResponsiveLayout();
      });
      
      resizeObserverRef.current.observe(dashboardRef.current);
    }
  };

  const handleResponsiveLayout = () => {
    // Implement responsive layout logic
    const container = dashboardRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const breakpoints = {
      mobile: 640,
      tablet: 1024,
      desktop: 1280
    };
    
    let columns = 12;
    if (containerWidth < breakpoints.mobile) {
      columns = 1;
    } else if (containerWidth < breakpoints.tablet) {
      columns = 4;
    } else if (containerWidth < breakpoints.desktop) {
      columns = 8;
    }
    
    // Adjust widget layouts based on screen size
    setWidgets(prev => prev.map(widget => ({
      ...widget,
      position: {
        ...widget.position,
        w: Math.min(widget.position.w, columns)
      }
    })));
  };

  // Widget Management
  const addWidget = (type: DashboardWidget['type'], chartType?: DashboardWidget['chartType']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      title: `New ${type}`,
      type,
      chartType,
      data: null,
      options: {},
      position: { x: 0, y: 0, w: 4, h: 3 },
      visible: true,
      dataSource: 'default',
      customization: createDefaultCustomization()
    };
    
    setWidgets(prev => [...prev, newWidget]);
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, ...updates }
        : widget
    ));
  };

  const deleteWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const duplicateWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      const duplicatedWidget: DashboardWidget = {
        ...widget,
        id: `widget-${Date.now()}`,
        title: `${widget.title} (Copy)`,
        position: {
          ...widget.position,
          x: widget.position.x + widget.position.w,
          y: widget.position.y
        }
      };
      
      setWidgets(prev => [...prev, duplicatedWidget]);
    }
  };

  // Filter Management
  const applyFilter = (filter: FilterConfig, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter.field]: value
    }));
  };

  const clearFilter = (field: string) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  // Export Functions
  const exportDashboard = async (format: 'png' | 'pdf' | 'excel' | 'csv') => {
    try {
      setIsLoading(true);
      
      const exportData = {
        dashboard: dashboards.find(d => d.id === activeDashboard),
        widgets: widgets.filter(w => w.visible),
        metrics,
        filters: activeFilters,
        dateRange,
        options: exportOptions
      };
      
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          data: exportData
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-${format}-${Date.now()}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const shareDashboard = async () => {
    try {
      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId: activeDashboard,
          settings: {
            expiresIn: '7d',
            allowDownload: exportOptions.includeMetadata,
            requireAuth: false
          }
        })
      });
      
      const data = await response.json();
      
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        // Show success message
      }
      
    } catch (error) {
      console.error('Share failed:', error);
      setError('Share failed');
    }
  };

  // Chart Components
  const renderChart = (widget: DashboardWidget) => {
    if (!widget.data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-gray-400">No data available</div>
        </div>
      );
    }
    
    const chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: widget.customization.showLegend,
          position: 'top'
        },
        tooltip: {
          enabled: widget.customization.showTooltips,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: widget.customization.showGrid,
          ...(widget.chartType === 'line' && {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM dd'
              }
            }
          })
        },
        y: {
          display: widget.customization.showGrid,
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'nearest' as const,
        intersect: false
      },
      animation: {
        duration: widget.customization.animation ? 750 : 0,
        easing: 'easeInOutQuart'
      }
    };
    
    switch (widget.chartType) {
      case 'line':
        return <ChartJSLine data={widget.data} options={chartOptions} />;
      case 'bar':
                  return <ChartJSBar data={widget.data} options={chartOptions} />;
      case 'pie':
                  return <ChartJSPie data={widget.data} options={chartOptions} />;
      case 'doughnut':
                  return <ChartJSDoughnut data={widget.data} options={chartOptions} />;
      case 'radar':
                  return <ChartJSRadar data={widget.data} options={chartOptions} />;
      case 'scatter':
                  return <ChartJSScatter data={widget.data} options={chartOptions} />;
      case 'bubble':
                  return <ChartJSBubble data={widget.data} options={chartOptions} />;
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={widget.data.datasets[0].data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="y"
                stroke={widget.customization.colors[0]}
                fill={widget.customization.colors[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const renderMetricWidget = (widget: DashboardWidget) => {
    const metrics = widget.data as AnalyticsMetric[];
    if (!metrics) return <div>No metrics data</div>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {metrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700",
              metric.threshold && metric.value > metric.threshold.critical && "border-red-500",
              metric.threshold && metric.value > metric.threshold.warning && metric.value <= metric.threshold.critical && "border-yellow-500"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {metric.name}
              </h4>
              {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {metric.trend === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
            </div>
            
            <div className="mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMetricValue(metric.value, metric.format)}
              </span>
              {metric.change && (
                <span className={cn(
                  "ml-2 text-sm",
                  metric.change > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metric.change > 0 ? '+' : ''}{metric.change}
                  {metric.changePercent && ` (${metric.changePercent}%)`}
                </span>
              )}
            </div>
            
            {metric.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {metric.description}
              </p>
            )}
            
            {metric.target && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderHeatmapWidget = (widget: DashboardWidget) => {
    const data = widget.data as HeatmapData[];
    if (!data) return <div>No heatmap data</div>;
    
    // Group data by x and y coordinates
    const heatmapMatrix: number[][] = [];
    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => d.y));
    
    for (let y = 0; y <= maxY; y++) {
      heatmapMatrix[y] = [];
      for (let x = 0; x <= maxX; x++) {
        const point = data.find(d => d.x === x && d.y === y);
        heatmapMatrix[y][x] = point ? point.value : 0;
      }
    }
    
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxX + 1}, 1fr)` }}>
          {heatmapMatrix.flat().map((value, index) => {
            const intensity = value / maxValue;
            const opacity = Math.max(0.1, intensity);
            
            return (
              <div
                key={index}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                }}
                title={`Value: ${value}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimelineWidget = (widget: DashboardWidget) => {
    const data = widget.data as TimeSeriesData[];
    if (!data) return <div>No timeline data</div>;
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={widget.customization.colors[0]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const formatMetricValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'time':
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(value));
      case 'bytes':
        return formatBytes(value);
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Main render
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dashboard List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Dashboards
                  </h3>
                  <div className="space-y-1">
                    {dashboards.map((dashboard) => (
                      <button
                        key={dashboard.id}
                        onClick={() => setActiveDashboard(dashboard.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg transition-colors",
                          activeDashboard === dashboard.id
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="font-medium">{dashboard.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {dashboard.widgets.length} widgets
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Widget Types */}
                {isEditing && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Add Widget
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addWidget('chart', 'line')}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs">Line Chart</span>
                      </button>
                      <button
                        onClick={() => addWidget('chart', 'bar')}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <BarChart3 className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs">Bar Chart</span>
                      </button>
                      <button
                        onClick={() => addWidget('chart', 'pie')}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <PieChartIcon className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs">Pie Chart</span>
                      </button>
                      <button
                        onClick={() => addWidget('metric')}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Target className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs">Metrics</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {dashboards.find(d => d.id === activeDashboard)?.name || 'Dashboard'}
              </h1>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    showFilters
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                    autoRefresh
                      ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1", autoRefresh && "animate-spin")} />
                  Auto Refresh
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  isEditing
                    ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? 'Done' : 'Edit'}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => exportDashboard('png')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Download className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={shareDashboard}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Share className="h-5 w-5" />
              </button>
              
              <button
                onClick={refreshDashboardData}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Filters
                  </h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Range
                    </label>
                    <select
                      value="custom"
                      onChange={(e) => {
                        const value = e.target.value;
                        const end = new Date();
                        let start = new Date();
                        
                        switch (value) {
                          case '7d':
                            start = subDays(end, 7);
                            break;
                          case '30d':
                            start = subDays(end, 30);
                            break;
                          case '90d':
                            start = subDays(end, 90);
                            break;
                          default:
                            return;
                        }
                        
                        setDateRange({ start, end });
                      }}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  {/* Additional filters would go here */}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4" ref={dashboardRef}>
          {isLoading && widgets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={refreshDashboardData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ 
              gridTemplateColumns: `repeat(${viewMode === 'list' ? 1 : 'auto-fit, minmax(300px, 1fr)'})`
            }}>
              {widgets.filter(w => w.visible).map((widget) => (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
                    selectedWidget === widget.id && "ring-2 ring-blue-500",
                    isEditing && "cursor-move"
                  )}
                  style={{
                    gridColumn: viewMode === 'grid' ? `span ${Math.min(widget.position.w, 12)}` : 'span 1',
                    height: viewMode === 'grid' ? `${widget.position.h * 100}px` : '400px'
                  }}
                  onClick={() => isEditing && setSelectedWidget(widget.id)}
                >
                  {/* Widget Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {widget.title}
                    </h3>
                    
                    {isEditing && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateWidget(widget.id);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWidget(widget.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Widget Content */}
                  <div className="p-4 h-full">
                    {widget.type === 'chart' && renderChart(widget)}
                    {widget.type === 'metric' && renderMetricWidget(widget)}
                    {widget.type === 'heatmap' && renderHeatmapWidget(widget)}
                    {widget.type === 'timeline' && renderTimelineWidget(widget)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDataVisualization;