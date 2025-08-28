import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: any[][];
  title?: string;
  height?: number;
  selectedYear?: number; // For pie/doughnut charts to select which year to display
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

const DataChart: React.FC<DataChartProps> = ({ type, data, title, height = 400, selectedYear }) => {
  console.log(`🎯 DataChart component props:`, {
    type,
    title,
    height,
    selectedYear,
    dataRows: data?.length || 0,
    dataCols: data?.[0]?.length || 0
  });

  // Force re-render when selectedYear changes for pie charts
  React.useEffect(() => {
    if (type === 'pie' || type === 'doughnut') {
      console.log(`🔄 Pie chart selectedYear changed to:`, selectedYear);
    }
  }, [selectedYear, type]);

  // Helper function for robust year matching
  const findYearColumnIndex = (headers: any[], targetYear: number): number => {
    console.log(`🔍 Finding column for year ${targetYear} in headers:`, headers);

    for (let i = 1; i < headers.length; i++) {
      const header = String(headers[i] || '').trim();

      // Method 1: Exact year match (e.g., "2023")
      if (header === targetYear.toString()) {
        console.log(`✅ Exact match found at column ${i}: "${header}"`);
        return i;
      }

      // Method 2: Parse as number
      const headerAsNumber = parseInt(header);
      if (!isNaN(headerAsNumber) && headerAsNumber === targetYear) {
        console.log(`✅ Number match found at column ${i}: "${header}" → ${headerAsNumber}`);
        return i;
      }

      // Method 3: Extract year from text (e.g., "Data 2023", "Tahun 2023")
      const yearMatch = header.match(/\b(20\d{2})\b/);
      if (yearMatch && parseInt(yearMatch[1]) === targetYear) {
        console.log(`✅ Pattern match found at column ${i}: "${header}" → ${yearMatch[1]}`);
        return i;
      }
    }

    console.log(`❌ No column found for year ${targetYear}`);
    return -1;
  };

  // Helper function to extract pie chart data for specific year
  const extractPieChartData = (headers: any[], dataRows: any[][], yearColumnIndex: number): { labels: string[], values: number[] } => {
    const year = headers[yearColumnIndex];
    console.log(`🥧 Extracting pie chart data for year column ${yearColumnIndex} (${year})`);

    const labels: string[] = [];
    const values: number[] = [];

    dataRows.forEach((row, rowIndex) => {
      const label = String(row[0] || `Item ${rowIndex + 1}`).trim();
      const rawValue = row[yearColumnIndex];

      // Parse value more robustly
      let value = 0;
      if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
        const cleanValue = String(rawValue).replace(/[^\d.-]/g, '');
        const parsedValue = parseFloat(cleanValue);
        if (!isNaN(parsedValue)) {
          value = parsedValue;
        }
      }

      // Only include rows with meaningful labels and positive values for pie chart
      if (label && !label.toLowerCase().includes('total') && value > 0) {
        labels.push(label);
        values.push(value);
        console.log(`📊 Added pie slice: "${label}" = ${value}`);
      } else {
        console.log(`⚠️ Skipped row ${rowIndex}: label="${label}", value=${value}`);
      }
    });

    console.log(`🥧 Final pie chart data: ${labels.length} slices, total value: ${values.reduce((sum, v) => sum + v, 0)}`);
    return { labels, values };
  };

  // Process data for chart
  const processDataForChart = (): ChartData => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🎨 DataChart processing data at ${timestamp}:`, {
      type,
      selectedYear,
      dataLength: data?.length || 0
    });

    if (!data || data.length < 2) {
      console.log(`❌ DataChart: Insufficient data (${data?.length || 0} rows)`);
      return {
        labels: [],
        datasets: []
      };
    }

    // Identify header row and data rows
    let headerRowIndex = 0;
    let headers = data[0];
    let dataRows = data.slice(1);

    // Check if first row contains only years/numbers (might be misplaced header)
    const firstRowHasOnlyYears = data[0].slice(1).every(cell => {
      const str = String(cell || '').trim();
      return str === '' || /^\d{4}$/.test(str) || /^20\d{2}$/.test(str);
    });

    // Check if second row contains years and first row contains actual data
    if (data.length > 1) {
      const secondRowHasYears = data[1].slice(1).every(cell => {
        const str = String(cell || '').trim();
        return str === '' || /^\d{4}$/.test(str) || /^20\d{2}$/.test(str);
      });

      // If first row has only years but second row has actual data, use first row as header
      if (firstRowHasOnlyYears && !secondRowHasYears) {
        console.log(`📋 Using row 0 as headers (contains only years)`);
        headers = data[0];
        dataRows = data.slice(1);
      }
      // If second row has years, it might be the header
      else if (secondRowHasYears && !firstRowHasOnlyYears) {
        console.log(`📋 Using row 1 as headers (row 0 seems to be data)`);
        headers = data[1];
        dataRows = [data[0], ...data.slice(2)];
      }
    }

    console.log(`📋 Final headers:`, headers);
    console.log(`📊 Final data rows (${dataRows.length}):`, dataRows);

    // Extract labels (first column - usually region names)
    // Exclude any row that looks like a header row (contains years)
    const filteredDataRows = dataRows.filter(row => {
      const firstCol = String(row[0] || '').trim();
      // Skip rows where first column looks like a header or contains years
      if (firstCol.toLowerCase().includes('tahun') ||
          firstCol.toLowerCase().includes('year') ||
          /^\d{4}$/.test(firstCol) ||
          firstCol === '') {
        console.log(`⚠️ Skipping potential header row: [${row.join(', ')}]`);
        return false;
      }
      return true;
    });

    const labels = filteredDataRows.map((row, index) => {
      const label = String(row[0] || `Row ${index + 1}`);
      return label.trim() || `Item ${index + 1}`;
    });

    console.log(`🏷️ DataChart labels (${labels.length}):`, labels);

    // Extract datasets (year columns)
    const datasets = [];
    const colors = [
      'rgba(30, 58, 138, 0.8)',   // BPS Navy
      'rgba(59, 130, 246, 0.8)',  // BPS Blue
      'rgba(16, 185, 129, 0.8)',  // Green
      'rgba(245, 158, 11, 0.8)',  // Orange
      'rgba(239, 68, 68, 0.8)',   // Red
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
      'rgba(34, 197, 94, 0.8)',   // Light Green
    ];

    // Different processing for different chart types
    if (type === 'pie' || type === 'doughnut') {
      // PIE CHART LOGIC: Focus on single year data
      console.log(`🥧 Processing pie chart data for selectedYear: ${selectedYear}`);

      let targetColumnIndex = -1;
      let targetYear = selectedYear;

      // Determine which year column to use
      if (selectedYear !== undefined && selectedYear !== null) {
        targetColumnIndex = findYearColumnIndex(headers, selectedYear);

        if (targetColumnIndex === -1) {
          console.log(`⚠️ Selected year ${selectedYear} not found, trying to find closest year`);

          // Find closest available year
          let closestYear = null;
          let minDifference = Infinity;

          for (let i = 1; i < headers.length; i++) {
            const header = String(headers[i] || '').trim();
            const yearMatch = header.match(/\b(20\d{2})\b/);
            if (yearMatch) {
              const year = parseInt(yearMatch[1]);
              const difference = Math.abs(year - selectedYear);
              if (difference < minDifference) {
                minDifference = difference;
                closestYear = year;
                targetColumnIndex = i;
              }
            }
          }

          if (closestYear) {
            console.log(`🎯 Using closest year ${closestYear} instead of ${selectedYear}`);
            targetYear = closestYear;
          }
        }
      }

      // Fallback to first data column if no year found
      if (targetColumnIndex === -1 && headers.length > 1) {
        targetColumnIndex = 1;
        targetYear = headers[1];
        console.log(`🔄 Fallback: Using first data column ${targetColumnIndex} (${targetYear})`);
      }

      if (targetColumnIndex > 0) {
        const pieData = extractPieChartData(headers, filteredDataRows, targetColumnIndex);

        if (pieData.labels.length > 0 && pieData.values.length > 0) {
          // Generate colors for pie slices
          const pieColors = pieData.values.map((_, index) => colors[index % colors.length]);

          datasets.push({
            label: `Data Tahun ${targetYear}`,
            data: pieData.values,
            backgroundColor: pieColors,
            borderColor: pieColors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
          });

          // Update labels for pie chart
          labels.length = 0;
          labels.push(...pieData.labels);

          console.log(`✅ Pie chart dataset created with ${pieData.labels.length} slices for year ${targetYear}`);
        } else {
          console.error(`❌ No valid pie chart data found for year ${targetYear}`);
        }
      }

    } else {
      // BAR/LINE CHART LOGIC: Process all year columns
      for (let i = 1; i < headers.length; i++) {
        const rawHeader = headers[i];
        let year = String(rawHeader || `Column ${i}`).trim();

        // Clean up the year label
        const yearMatch = year.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          year = yearMatch[1];
        } else if (year.match(/^\d{4}$/)) {
          year = year;
        }

        console.log(`📅 DataChart year column ${i}: "${rawHeader}" → "${year}"`);

        const values = filteredDataRows.map((row, rowIndex) => {
          const rawValue = row[i];
          let value = parseFloat(String(rawValue || 0).replace(/[^\d.-]/g, ''));

          if (isNaN(value)) {
            console.log(`⚠️ DataChart: Invalid value at row ${rowIndex}, col ${i}: "${rawValue}" → 0`);
            value = 0;
          }

          return value;
        });

        console.log(`💹 DataChart values for "${year}" (${values.length} values):`, values);

        const colorIndex = (i - 1) % colors.length;

        datasets.push({
          label: year,
          data: values,
          backgroundColor: type === 'bar' ? colors[colorIndex] : 'transparent',
          borderColor: colors[colorIndex],
          borderWidth: 2,
          fill: type === 'line' ? false : undefined,
        });
      }
    }

    console.log(`✅ DataChart final datasets:`, datasets.map(d => ({ label: d.label, dataPoints: d.data.length })));

    return {
      labels,
      datasets
    };
  };

  const chartData = processDataForChart();

  // Create a hash of chart data to help Chart.js detect changes
  const dataHash = React.useMemo(() => {
    const hash = JSON.stringify({
      labels: chartData.labels,
      datasets: chartData.datasets.map(d => ({ label: d.label, data: d.data })),
      selectedYear,
      type
    });
    console.log(`�� Chart data hash created:`, hash.substring(0, 100) + '...');
    return hash;
  }, [chartData.labels, chartData.datasets, selectedYear, type]);

  // Calculate Y-axis bounds to ensure zero line is visible
  const calculateYAxisBounds = () => {
    if (type === 'pie' || type === 'doughnut') return {};

    const allValues = chartData.datasets.flatMap(dataset => dataset.data);
    if (allValues.length === 0) return { includeZero: true };

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    console.log(`📊 DataChart Y-axis bounds: min=${minValue}, max=${maxValue}`);

    // Calculate appropriate padding
    const range = Math.abs(maxValue - minValue);
    const padding = range > 0 ? range * 0.15 : 1; // 15% padding or minimum 1

    // Always include 0 in the axis range for clear positive/negative separation
    let suggestedMin = minValue;
    let suggestedMax = maxValue;

    if (minValue < 0) {
      suggestedMin = minValue - padding;
    }
    if (maxValue > 0) {
      suggestedMax = maxValue + padding;
    }

    // Ensure 0 is always included in the range
    if (minValue > 0) {
      suggestedMin = 0;
    }
    if (maxValue < 0) {
      suggestedMax = 0;
    }

    console.log(`📊 Final Y-axis range: ${suggestedMin} to ${suggestedMax} (includes zero)`);

    return {
      min: suggestedMin,
      max: suggestedMax,
      // Always include zero for clear reference line
      includeZero: true
    };
  };

  const yAxisBounds = calculateYAxisBounds();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter',
            size: 12,
          },
          color: '#374151',
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Inter',
          size: 16,
          weight: 'bold',
        },
        color: '#1e3a8a',
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e3a8a',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${typeof value === 'number' ? value.toFixed(3) : value}`;
          }
        }
      },
    },
    scales: type === 'bar' || type === 'line' ? {
      x: {
        grid: {
          color: '#e5e7eb',
          display: true,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        ...yAxisBounds,
        position: 'left' as const,
        grid: {
          color: function(context: any) {
            // Make the zero line more prominent
            if (context.tick.value === 0) {
              return '#374151'; // Darker color for zero line
            }
            return '#e5e7eb'; // Regular grid lines
          },
          lineWidth: function(context: any) {
            // Make the zero line thicker
            return context.tick.value === 0 ? 3 : 1;
          },
          display: true,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          color: '#6b7280',
          callback: function(value: any) {
            // Format numbers with appropriate decimal places for negative values
            if (typeof value === 'number') {
              return value >= -1 && value <= 1 && value !== 0
                ? value.toFixed(3)
                : value.toLocaleString();
            }
            return value;
          }
        },
        // Ensure zero line is visible and styled
        border: {
          color: '#374151',
          width: 1,
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    console.log(`🎨 Rendering ${type} chart with data:`, {
      labels: chartData.labels,
      datasets: chartData.datasets.map(d => ({
        label: d.label,
        dataLength: d.data.length,
        data: d.data
      }))
    });

    // Enhanced validation for pie/doughnut charts
    if ((type === 'pie' || type === 'doughnut')) {
      // Check 1: No datasets available
      if (chartData.datasets.length === 0) {
        console.error(`❌ No datasets available for ${type} chart. SelectedYear: ${selectedYear}`);

        return (
          <div className="flex items-center justify-center h-64 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-center max-w-md">
              <div className="text-yellow-400 text-4xl mb-3">📅</div>
              <p className="text-yellow-800 font-medium mb-2">Data untuk tahun tidak ditemukan</p>
              <p className="text-sm text-yellow-700 mb-3">
                {selectedYear ?
                  `Tahun ${selectedYear} tidak tersedia dalam data ini.` :
                  'Tidak ada tahun yang dipilih untuk pie chart.'
                }
              </p>
              <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                💡 <strong>Tips:</strong> Pilih tahun yang tersedia dalam dropdown atau gunakan chart type lain seperti Bar Chart untuk melihat semua tahun.
              </div>
            </div>
          </div>
        );
      }

      // Check 2: No labels available (empty categories)
      if (chartData.labels.length === 0) {
        console.error(`❌ No labels available for ${type} chart`);
        return (
          <div className="flex items-center justify-center h-64 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-center max-w-md">
              <div className="text-orange-400 text-4xl mb-3">📋</div>
              <p className="text-orange-800 font-medium mb-2">Tidak ada kategori data</p>
              <p className="text-sm text-orange-700 mb-3">
                Data untuk tahun {selectedYear || 'yang dipilih'} tidak memiliki kategori yang valid atau semua nilai adalah nol.
              </p>
              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                💡 <strong>Solusi:</strong> Pastikan data memiliki kolom kategori (wilayah/sektor) dengan nilai positif.
              </div>
            </div>
          </div>
        );
      }

      // Check 3: All data values are zero or invalid
      const firstDataset = chartData.datasets[0];
      if (firstDataset) {
        const totalValue = firstDataset.data.reduce((sum, value) => sum + (value || 0), 0);
        const validValues = firstDataset.data.filter(value => value > 0).length;

        if (totalValue === 0 || validValues === 0) {
          console.error(`❌ All data values are zero or invalid for ${type} chart`);
          return (
            <div className="flex items-center justify-center h-64 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center max-w-md">
                <div className="text-blue-400 text-4xl mb-3">🔢</div>
                <p className="text-blue-800 font-medium mb-2">Semua data bernilai nol</p>
                <p className="text-sm text-blue-700 mb-3">
                  Data untuk tahun {selectedYear || 'yang dipilih'} tidak memiliki nilai positif untuk ditampilkan dalam pie chart.
                </p>
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 <strong>Tips:</strong> Pie chart hanya menampilkan nilai positif. Coba gunakan Bar Chart untuk melihat data termasuk nilai nol.
                </div>
              </div>
            </div>
          );
        }

        console.log(`✅ Pie chart validation passed: ${validValues} valid values out of ${firstDataset.data.length}, total: ${totalValue.toFixed(2)}`);
      }

      console.log(`✅ Pie chart data validation passed. Labels: ${chartData.labels.length}, Datasets: ${chartData.datasets.length}`);
    }

    switch (type) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
          <p className="text-sm text-gray-400">Pastikan data telah dipilih dan diproses</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      {renderChart()}
    </div>
  );
};

export default DataChart;
