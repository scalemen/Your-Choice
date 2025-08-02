import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  PolarAreaController,
  RadarController,
  DoughnutController,
  PieController
} from 'chart.js';
import { Line as ChartJSLine, Bar as ChartJSBar, Pie as ChartJSPie, Doughnut as ChartJSDoughnut, Radar as ChartJSRadar, PolarArea as ChartJSPolarArea, Scatter as ChartJSScatter, Bubble as ChartJSBubble } from 'react-chartjs-2';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, addWeeks } from 'date-fns';
import { cn } from '@/utils/cn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  PolarAreaController,
  RadarController,
  DoughnutController,
  PieController
);

// Types and interfaces
export interface DataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface DataSeries {
  label: string;
  data: DataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter' | 'bubble';
  yAxisID?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble' | 'heatmap' | 'treemap' | 'sankey';
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: boolean;
  legend?: boolean;
  grid?: boolean;
  tooltips?: boolean;
  zoom?: boolean;
  export?: boolean;
  realTime?: boolean;
  interactive?: boolean;
  threshold?: number;
  colorScheme?: 'default' | 'academic' | 'wellness' | 'performance' | 'engagement';
}

export interface AdvancedChartProps {
  data: DataSeries[];
  config: ChartConfig;
  onDataPointClick?: (point: DataPoint, series: DataSeries) => void;
  onDataPointHover?: (point: DataPoint, series: DataSeries) => void;
  onZoom?: (range: { min: number; max: number }) => void;
  onExport?: (format: 'png' | 'jpg' | 'pdf' | 'svg') => void;
  className?: string;
  loading?: boolean;
  error?: string;
}

// Color schemes
const COLOR_SCHEMES = {
  default: [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ],
  academic: [
    '#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED',
    '#0891B2', '#EA580C', '#65A30D', '#BE185D', '#4F46E5'
  ],
  wellness: [
    '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5',
    '#ECFDF5', '#F0FDF4', '#F7FEE7', '#FEF3C7', '#FDE68A'
  ],
  performance: [
    '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2',
    '#FEF2F2', '#FFF5F5', '#FFFBEB', '#FEF3C7', '#FDE68A'
  ],
  engagement: [
    '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE',
    '#F5F3FF', '#FAF5FF', '#FEFCE8', '#FEF3C7', '#FDE68A'
  ]
};

// Utility functions
const generateChartOptions = (config: ChartConfig, colorScheme: string[]) => {
  const baseOptions: any = {
    responsive: config.responsive !== false,
    maintainAspectRatio: config.maintainAspectRatio !== false,
    animation: config.animation !== false ? {
      duration: 750,
      easing: 'easeInOutQuart'
    } : false,
    plugins: {
      legend: {
        display: config.legend !== false,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter'
          }
        }
      },
      title: {
        display: !!config.title,
        text: config.title,
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        enabled: config.tooltips !== false,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            if (context[0]?.parsed?.x !== undefined) {
              return `${config.xAxisLabel || 'X'}: ${context[0].parsed.x}`;
            }
            return context[0]?.label || '';
          },
          label: (context: any) => {
            const value = context.parsed?.y || context.parsed || context.raw;
            return `${context.dataset.label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
          }
        }
      }
    },
    scales: {},
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  // Configure scales for different chart types
  if (['line', 'bar', 'scatter', 'bubble'].includes(config.type)) {
    baseOptions.scales = {
      x: {
        display: true,
        title: {
          display: !!config.xAxisLabel,
          text: config.xAxisLabel,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: config.grid !== false,
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        title: {
          display: !!config.yAxisLabel,
          text: config.yAxisLabel,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: config.grid !== false,
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        },
        beginAtZero: true
      }
    };
  }

  // Add zoom plugin if enabled
  if (config.zoom) {
    baseOptions.plugins.zoom = {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x' as const,
      },
      pan: {
        enabled: true,
        mode: 'x' as const,
      }
    };
  }

  return baseOptions;
};

const transformDataForChart = (data: DataSeries[], config: ChartConfig, colorScheme: string[]) => {
  const chartData: any = {
    labels: [],
    datasets: []
  };

  if (config.type === 'pie' || config.type === 'doughnut' || config.type === 'polarArea') {
    // For pie/doughnut charts, use the first series
    const series = data[0];
    if (series) {
      chartData.labels = series.data.map(point => point.label || point.x);
      chartData.datasets = [{
        label: series.label,
        data: series.data.map(point => point.y),
        backgroundColor: series.data.map((_, index) => colorScheme[index % colorScheme.length]),
        borderColor: '#ffffff',
        borderWidth: 2
      }];
    }
  } else {
    // For other chart types
    const allLabels = new Set<string>();
    data.forEach(series => {
      series.data.forEach(point => {
        allLabels.add(String(point.x));
      });
    });
    
    chartData.labels = Array.from(allLabels).sort();
    
    chartData.datasets = data.map((series, index) => {
      const color = series.color || colorScheme[index % colorScheme.length];
      
      const dataset: any = {
        label: series.label,
        data: series.data.map(point => point.y),
        backgroundColor: config.type === 'bar' ? color : `${color}20`,
        borderColor: color,
        borderWidth: series.borderWidth || 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      };

      if (series.fill !== undefined) {
        dataset.fill = series.fill;
      }

      if (series.tension !== undefined) {
        dataset.tension = series.tension;
      }

      if (series.type) {
        dataset.type = series.type;
      }

      if (series.yAxisID) {
        dataset.yAxisID = series.yAxisID;
      }

      return dataset;
    });
  }

  return chartData;
};

// Advanced Chart Component
export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  data,
  config,
  onDataPointClick,
  onDataPointHover,
  onZoom,
  onExport,
  className,
  loading = false,
  error
}) => {
  const chartRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf' | 'svg'>('png');

  const colorScheme = useMemo(() => {
    return COLOR_SCHEMES[config.colorScheme || 'default'];
  }, [config.colorScheme]);

  const chartOptions = useMemo(() => {
    const options = generateChartOptions(config, colorScheme);
    
    // Add click handler
    if (onDataPointClick) {
      options.onClick = (event: any, elements: any[]) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const dataIndex = element.index;
          const series = data[datasetIndex];
          const point = series?.data[dataIndex];
          
          if (point && series) {
            onDataPointClick(point, series);
          }
        }
      };
    }

    // Add hover handler
    if (onDataPointHover) {
      options.onHover = (event: any, elements: any[]) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const dataIndex = element.index;
          const series = data[datasetIndex];
          const point = series?.data[dataIndex];
          
          if (point && series) {
            onDataPointHover(point, series);
          }
        }
      };
    }

    return options;
  }, [config, colorScheme, onDataPointClick, onDataPointHover, data]);

  const chartData = useMemo(() => {
    return transformDataForChart(data, config, colorScheme);
  }, [data, config, colorScheme]);

  const handleExport = useCallback((format: 'png' | 'jpg' | 'pdf' | 'svg') => {
    if (chartRef.current && onExport) {
      onExport(format);
    }
  }, [onExport]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const renderChart = () => {
    const chartProps = {
      ref: chartRef,
      data: chartData,
      options: chartOptions,
      height: config.height
    };

    switch (config.type) {
      case 'line':
        return <ChartJSLine {...chartProps} />;
      case 'bar':
        return <ChartJSBar {...chartProps} />;
      case 'pie':
        return <ChartJSPie {...chartProps} />;
      case 'doughnut':
        return <ChartJSDoughnut {...chartProps} />;
      case 'radar':
        return <ChartJSRadar {...chartProps} />;
      case 'polarArea':
        return <ChartJSPolarArea {...chartProps} />;
      case 'scatter':
        return <ChartJSScatter {...chartProps} />;
      case 'bubble':
        return <ChartJSBubble {...chartProps} />;
      case 'heatmap':
        return <HeatmapChart data={data} config={config} />;
      case 'treemap':
        return <TreemapChart data={data} config={config} />;
      case 'sankey':
        return <SankeyChart data={data} config={config} />;
      default:
        return <ChartJSLine {...chartProps} />;
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800", className)}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Error loading chart</p>
          <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm", className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          {config.title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h3>
          )}
          {config.subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {config.subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {config.export && (
            <div className="relative">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="pdf">PDF</option>
                <option value="svg">SVG</option>
              </select>
              <button
                onClick={() => handleExport(exportFormat)}
                className="ml-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Export
              </button>
            </div>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ height: config.height || 400 }}
        >
          {renderChart()}
        </motion.div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onClick={toggleFullscreen}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {config.title || 'Chart'}
                </h3>
                <button
                  onClick={toggleFullscreen}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ height: 'calc(100vh - 200px)' }}>
                {renderChart()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Specialized Chart Components
const HeatmapChart: React.FC<{ data: DataSeries[]; config: ChartConfig }> = ({ data, config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple heatmap implementation
    const cellSize = 20;
    const margin = 40;
    
    canvas.width = data[0].data.length * cellSize + margin * 2;
    canvas.height = data.length * cellSize + margin * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find min and max values for color scaling
    const allValues = data.flatMap(series => series.data.map(point => point.y));
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // Draw heatmap cells
    data.forEach((series, rowIndex) => {
      series.data.forEach((point, colIndex) => {
        const intensity = (point.y - minValue) / (maxValue - minValue);
        const alpha = Math.max(0.1, intensity);
        
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.fillRect(
          margin + colIndex * cellSize,
          margin + rowIndex * cellSize,
          cellSize - 1,
          cellSize - 1
        );
        
        // Add value text
        ctx.fillStyle = intensity > 0.5 ? '#ffffff' : '#000000';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          point.y.toString(),
          margin + colIndex * cellSize + cellSize / 2,
          margin + rowIndex * cellSize + cellSize / 2
        );
      });
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    
    // Y-axis labels (series names)
    data.forEach((series, index) => {
      ctx.fillText(
        series.label,
        5,
        margin + index * cellSize + cellSize / 2
      );
    });
    
    // X-axis labels
    if (data[0]) {
      data[0].data.forEach((point, index) => {
        ctx.save();
        ctx.translate(margin + index * cellSize + cellSize / 2, margin - 10);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(String(point.x), 0, 0);
        ctx.restore();
      });
    }

  }, [data]);

  return (
    <div className="flex items-center justify-center overflow-auto">
      <canvas ref={canvasRef} className="border border-gray-200 dark:border-gray-700 rounded" />
    </div>
  );
};

const TreemapChart: React.FC<{ data: DataSeries[]; config: ChartConfig }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Simple treemap implementation using HTML/CSS
    // In a real implementation, you'd use a library like d3-hierarchy
    
  }, [data]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500 dark:text-gray-400">
        <p>Treemap visualization</p>
        <p className="text-sm">(Requires d3-hierarchy for full implementation)</p>
      </div>
    </div>
  );
};

const SankeyChart: React.FC<{ data: DataSeries[]; config: ChartConfig }> = ({ data, config }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500 dark:text-gray-400">
        <p>Sankey diagram</p>
        <p className="text-sm">(Requires d3-sankey for full implementation)</p>
      </div>
    </div>
  );
};

// Learning Analytics Specific Charts
export const LearningProgressChart: React.FC<{
  studentData: Array<{
    date: string;
    completedLessons: number;
    studyTime: number;
    quizScore: number;
  }>;
  className?: string;
}> = ({ studentData, className }) => {
  const chartData: DataSeries[] = [
    {
      label: 'Completed Lessons',
      data: studentData.map(item => ({
        x: item.date,
        y: item.completedLessons
      })),
      color: '#10B981',
      type: 'bar'
    },
    {
      label: 'Study Time (hours)',
      data: studentData.map(item => ({
        x: item.date,
        y: item.studyTime
      })),
      color: '#3B82F6',
      type: 'line',
      yAxisID: 'y1'
    },
    {
      label: 'Quiz Score (%)',
      data: studentData.map(item => ({
        x: item.date,
        y: item.quizScore
      })),
      color: '#8B5CF6',
      type: 'line',
      yAxisID: 'y1'
    }
  ];

  const config: ChartConfig = {
    type: 'line',
    title: 'Learning Progress Over Time',
    xAxisLabel: 'Date',
    yAxisLabel: 'Progress Metrics',
    colorScheme: 'academic',
    height: 300,
    grid: true,
    zoom: true,
    export: true
  };

  return (
    <AdvancedChart
      data={chartData}
      config={config}
      className={className}
    />
  );
};

export const EngagementHeatmap: React.FC<{
  engagementData: Array<{
    hour: number;
    day: string;
    engagement: number;
  }>;
  className?: string;
}> = ({ engagementData, className }) => {
  // Transform data for heatmap
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const heatmapData: DataSeries[] = days.map(day => ({
    label: day,
    data: hours.map(hour => {
      const dataPoint = engagementData.find(item => item.day === day && item.hour === hour);
      return {
        x: hour,
        y: dataPoint?.engagement || 0
      };
    })
  }));

  const config: ChartConfig = {
    type: 'heatmap',
    title: 'Student Engagement Heatmap',
    subtitle: 'Engagement levels by day and hour',
    colorScheme: 'engagement',
    height: 250
  };

  return (
    <AdvancedChart
      data={heatmapData}
      config={config}
      className={className}
    />
  );
};

export const PerformanceRadarChart: React.FC<{
  performanceData: {
    mathematics: number;
    science: number;
    literature: number;
    history: number;
    languages: number;
    arts: number;
  };
  className?: string;
}> = ({ performanceData, className }) => {
  const chartData: DataSeries[] = [{
    label: 'Performance Score',
    data: Object.entries(performanceData).map(([subject, score]) => ({
      x: subject.charAt(0).toUpperCase() + subject.slice(1),
      y: score
    })),
    color: '#8B5CF6',
    fill: true
  }];

  const config: ChartConfig = {
    type: 'radar',
    title: 'Subject Performance Analysis',
    colorScheme: 'performance',
    height: 300,
    legend: false
  };

  return (
    <AdvancedChart
      data={chartData}
      config={config}
      className={className}
    />
  );
};

// Real-time Chart Component
export const RealTimeChart: React.FC<{
  dataStream: (callback: (data: DataPoint) => void) => () => void;
  maxDataPoints?: number;
  updateInterval?: number;
  className?: string;
}> = ({ dataStream, maxDataPoints = 50, updateInterval = 1000, className }) => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const unsubscribe = dataStream((newDataPoint) => {
      setData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-maxDataPoints);
      });
    });

    return unsubscribe;
  }, [dataStream, maxDataPoints]);

  const chartData: DataSeries[] = [{
    label: 'Real-time Data',
    data: data,
    color: '#3B82F6',
    type: 'line'
  }];

  const config: ChartConfig = {
    type: 'line',
    title: 'Real-time Data Stream',
    animation: false,
    height: 200,
    realTime: true
  };

  return (
    <AdvancedChart
      data={chartData}
      config={config}
      className={className}
    />
  );
};

export default AdvancedChart;