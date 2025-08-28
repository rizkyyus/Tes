import React, { useState } from 'react';
import { Download, Settings, Eye, EyeOff, FileSpreadsheet, FileText, FileImage, Grid, List, ChevronDown } from 'lucide-react';
import DataChart from './DataChart';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToCSV, getDataStatistics } from './ExportUtils';
import { exportChartToPDF, exportMultipleChartsToPDF, exportDashboardToPDF } from './PDFExportUtils';

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  height: number;
  selectedYearForPie?: number;
}

interface ChartDashboardProps {
  tables: Array<{
    id: string;
    name: string;
    years: number[];
    previewData: any[][];
  }>;
  selectedYears: number[];
}

const ChartDashboard: React.FC<ChartDashboardProps> = ({ tables, selectedYears }) => {
  // Initialize chart configs for each table
  const [chartConfigs, setChartConfigs] = useState<Record<string, ChartConfig>>(() => {
    const configs: Record<string, ChartConfig> = {};
    tables.forEach(table => {
      configs[table.id] = {
        type: 'bar',
        height: 400,
        selectedYearForPie: selectedYears.length > 0 ? selectedYears[0] : undefined
      };
    });
    return configs;
  });

  const [visibleTables, setVisibleTables] = useState<Set<string>>(new Set(tables.map(t => t.id)));
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [isExporting, setIsExporting] = useState(false);

  // Update chart configs when tables or selectedYears change
  React.useEffect(() => {
    console.log(`📅 ChartDashboard: selectedYears changed:`, selectedYears);

    setChartConfigs(prevConfigs => {
      const newConfigs = { ...prevConfigs };

      // Add configs for new tables
      tables.forEach(table => {
        if (!newConfigs[table.id]) {
          newConfigs[table.id] = {
            type: 'bar',
            height: 400,
            selectedYearForPie: selectedYears.length > 0 ? selectedYears[0] : undefined
          };
        } else {
          // Update selectedYearForPie if current selection is not available
          const currentConfig = newConfigs[table.id];
          if (selectedYears.length > 0) {
            if (!currentConfig.selectedYearForPie || !selectedYears.includes(currentConfig.selectedYearForPie)) {
              newConfigs[table.id] = {
                ...currentConfig,
                selectedYearForPie: selectedYears[0]
              };
            }
          } else {
            newConfigs[table.id] = {
              ...currentConfig,
              selectedYearForPie: undefined
            };
          }
        }
      });

      // Remove configs for tables that no longer exist
      Object.keys(newConfigs).forEach(tableId => {
        if (!tables.some(table => table.id === tableId)) {
          delete newConfigs[tableId];
        }
      });

      return newConfigs;
    });
  }, [tables, selectedYears]);

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', description: 'Bagus untuk perbandingan antar kategori' },
    { id: 'line', name: 'Line Chart', description: 'Ideal untuk tren waktu' },
    { id: 'pie', name: 'Pie Chart', description: 'Menampilkan proporsi data per tahun (dapat memilih tahun)' },
    { id: 'doughnut', name: 'Doughnut Chart', description: 'Variasi pie chart yang lebih modern (dapat memilih tahun)' },
  ];

  // Helper functions for individual chart configurations
  const updateChartConfig = (tableId: string, updates: Partial<ChartConfig>) => {
    setChartConfigs(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        ...updates
      }
    }));
  };

  const getChartConfig = (tableId: string): ChartConfig => {
    return chartConfigs[tableId] || {
      type: 'bar',
      height: 400,
      selectedYearForPie: selectedYears.length > 0 ? selectedYears[0] : undefined
    };
  };

  const toggleTableVisibility = (tableId: string) => {
    const newVisible = new Set(visibleTables);
    if (newVisible.has(tableId)) {
      newVisible.delete(tableId);
    } else {
      newVisible.add(tableId);
    }
    setVisibleTables(newVisible);
  };

  const exportChart = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      try {
        setIsExporting(true);
        const filename = `${table.name.replace(/[^a-zA-Z0-9]/g, '_')}_chart_${Date.now()}.pdf`;
        await exportChartToPDF(`chart-${tableId}`, {
          filename,
          orientation: 'landscape',
          format: 'a4'
        });
        alert(`✅ Chart ${table.name} berhasil diexport ke PDF!`);
      } catch (error) {
        console.error('Export error:', error);
        alert('❌ Gagal mengexport chart. Silakan coba lagi.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const exportAllVisibleCharts = async () => {
    try {
      setIsExporting(true);
      const visibleChartIds = Array.from(visibleTables).map(id => `chart-${id}`);
      const filename = `all_charts_${Date.now()}.pdf`;
      await exportMultipleChartsToPDF(visibleChartIds, {
        filename,
        orientation: 'portrait',
        format: 'a4'
      });
      alert(`✅ ${visibleChartIds.length} chart berhasil diexport ke PDF!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Gagal mengexport charts. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportDashboard = async () => {
    try {
      setIsExporting(true);
      const filename = `dashboard_${Date.now()}.pdf`;
      await exportDashboardToPDF('chart-dashboard', {
        filename,
        orientation: 'portrait',
        format: 'a4'
      });
      alert('✅ Dashboard berhasil diexport ke PDF!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Gagal mengexport dashboard. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportData = (format: 'excel' | 'csv') => {
    try {
      const exportData = { tables, selectedYears };
      let filename = '';
      
      if (format === 'excel') {
        filename = exportToExcel(exportData);
      } else {
        filename = exportToCSV(exportData);
      }
      
      alert(`Data berhasil diexport ke ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengexport data. Silakan coba lagi.');
    }
  };

  const getChartTitle = (tableName: string, tableId: string) => {
    const config = getChartConfig(tableId);
    if (config.type === 'pie' || config.type === 'doughnut') {
      const yearToShow = config.selectedYearForPie || selectedYears[0];
      return `${tableName} (Tahun ${yearToShow})`;
    }
    return `${tableName} (${selectedYears.join(', ')})`;
  };

  const getDataSummary = (data: any[][]) => {
    if (!data || data.length < 2) return null;

    const headers = data[0];
    const rows = data.slice(1);
    
    const summary = {
      totalRegions: rows.length,
      totalYears: headers.length - 1,
      dataPoints: (headers.length - 1) * rows.length,
      averageValue: 0,
      maxValue: 0,
      minValue: Infinity,
    };

    let totalSum = 0;
    let validValues = 0;

    // Calculate statistics
    for (let i = 1; i < headers.length; i++) {
      for (let j = 0; j < rows.length; j++) {
        const value = parseFloat(String(rows[j][i] || 0));
        if (!isNaN(value)) {
          totalSum += value;
          validValues++;
          summary.maxValue = Math.max(summary.maxValue, value);
          summary.minValue = Math.min(summary.minValue, value);
        }
      }
    }

    summary.averageValue = validValues > 0 ? totalSum / validValues : 0;
    summary.minValue = summary.minValue === Infinity ? 0 : summary.minValue;

    return summary;
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Data Dipilih</h3>
        <p className="text-gray-500">Pilih tabel dan tahun terlebih dahulu untuk melihat visualisasi</p>
      </div>
    );
  }

  return (
    <div id="chart-dashboard" className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📊 Dashboard Visualisasi Data</h1>
            <p className="text-blue-100">
              {tables.length} tabel • {selectedYears.length} tahun dipilih • {visibleTables.size} chart aktif
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">MULTI-CHART</div>
            <div className="text-blue-200">Mode Individual</div>
          </div>
        </div>
      </div>

      {/* Dashboard Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">🎛️ Kontrol Global</h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                💡 Mode Individual Chart
              </p>
              <p className="text-sm text-blue-700">
                Setiap chart memiliki kontrol sendiri. Konfigurasi chart (jenis, tinggi, tahun) dapat diatur secara terpisah di setiap grafik.
              </p>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">👁️ Kontrol Tampilan</h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setVisibleTables(new Set(tables.map(t => t.id)))}
                className="bps-btn-secondary text-sm justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tampilkan Semua
              </button>
              <button
                onClick={() => setVisibleTables(new Set())}
                className="bps-btn-secondary text-sm justify-start"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Sembunyikan Semua
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2 rounded text-sm border",
                    layoutMode === 'grid'
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2 rounded text-sm border",
                    layoutMode === 'list'
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">📥 Export Options</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExportData('excel')}
                disabled={isExporting}
                className="bps-btn-secondary text-sm w-full justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Data Excel
              </button>
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="bps-btn-secondary text-sm w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Data CSV
              </button>
              <button
                onClick={exportAllVisibleCharts}
                disabled={isExporting || visibleTables.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center disabled:opacity-50"
              >
                <FileImage className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Charts PDF'}
              </button>
              <button
                onClick={exportDashboard}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Dashboard PDF'}
              </button>
            </div>
          </div>
        </div>



        {/* Individual Chart Mode Description */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <strong>🎯 Mode Individual Chart:</strong> Setiap chart dapat dikonfigurasi secara terpisah dengan jenis grafik, tinggi, dan pengaturan tahun yang berbeda.
          </p>
          <p className="text-sm text-green-700 mt-2">
            <strong>✨ Fitur:</strong> Dropdown pengaturan tersedia di setiap chart untuk kontrol maksimal atas visualisasi data.
          </p>
        </div>

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border">
            <div className="text-xl font-bold text-blue-600">{tables.length}</div>
            <div className="text-sm text-blue-800">Total Tabel</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border">
            <div className="text-xl font-bold text-green-600">{selectedYears.length}</div>
            <div className="text-sm text-green-800">Tahun Dipilih</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border">
            <div className="text-xl font-bold text-purple-600">{visibleTables.size}</div>
            <div className="text-sm text-purple-800">Chart Aktif</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border">
            <div className="text-xl font-bold text-orange-600">{getDataStatistics({ tables, selectedYears }).totalDataPoints}</div>
            <div className="text-sm text-orange-800">Data Points</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={cn(
        "gap-6",
        layoutMode === 'grid'
          ? "grid grid-cols-1 lg:grid-cols-2"
          : "space-y-6"
      )}>
        {tables.map((table) => {
          const isVisible = visibleTables.has(table.id);
          const summary = getDataSummary(table.previewData);

          return (
            <div
              key={table.id}
              id={`chart-${table.id}`}
              className={cn(
                "bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
                isVisible ? "opacity-100" : "opacity-50",
                layoutMode === 'list' ? "w-full" : ""
              )}
            >
              {/* Chart Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTableVisibility(table.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{table.name}</h3>
                    <p className="text-xs text-gray-500">
                      {summary ? `${summary.totalRegions} wilayah, ${summary.totalYears} tahun` : 'Data tidak tersedia'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {summary && (
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      Avg: {summary.averageValue.toFixed(2)}
                    </div>
                  )}
                  <button
                    onClick={() => exportChart(table.id)}
                    disabled={isExporting}
                    className="p-2 rounded hover:bg-blue-100 text-blue-600 border border-blue-200 disabled:opacity-50"
                    title="Export Chart ke PDF"
                  >
                    <FileImage className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chart Content */}
              {isVisible && (() => {
                const config = getChartConfig(table.id);
                console.log(`🎨 Rendering chart for table ${table.id}:`, {
                  chartType: config.type,
                  selectedYearForPie: config.selectedYearForPie,
                  tableYears: table.years,
                  selectedYears,
                  dataRows: table.previewData?.length || 0
                });

                return (
                  <div className="p-6">
                    {/* Individual Chart Controls */}
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Chart Type Selector */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            📊 Jenis Chart
                          </label>
                          <select
                            value={config.type}
                            onChange={(e) => updateChartConfig(table.id, {
                              type: e.target.value as 'bar' | 'line' | 'pie' | 'doughnut'
                            })}
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {chartTypes.map(type => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Height Selector */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            📏 Tinggi Chart
                          </label>
                          <select
                            value={config.height}
                            onChange={(e) => updateChartConfig(table.id, {
                              height: Number(e.target.value)
                            })}
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={300}>Kecil (300px)</option>
                            <option value={400}>Sedang (400px)</option>
                            <option value={500}>Besar (500px)</option>
                            <option value={600}>Sangat Besar (600px)</option>
                          </select>
                        </div>

                        {/* Year Selector for Pie/Doughnut Charts */}
                        {(config.type === 'pie' || config.type === 'doughnut') && selectedYears.length > 1 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              🥧 Tahun untuk {config.type === 'pie' ? 'Pie' : 'Doughnut'}
                            </label>
                            <select
                              value={config.selectedYearForPie || selectedYears[0]}
                              onChange={(e) => updateChartConfig(table.id, {
                                selectedYearForPie: Number(e.target.value)
                              })}
                              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {selectedYears.map(year => (
                                <option key={year} value={year}>
                                  Tahun {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Chart Description */}
                        <div className={cn(
                          "col-span-1 md:col-span-3",
                          (config.type === 'pie' || config.type === 'doughnut') && selectedYears.length > 1 ? "md:col-span-1" : ""
                        )}>
                          <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                            <strong>💡 Info:</strong> {chartTypes.find(t => t.id === config.type)?.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actual Chart */}
                    <DataChart
                      key={`${table.id}-${config.type}-${config.selectedYearForPie || 'no-year'}`}
                      type={config.type}
                      data={table.previewData}
                      title={getChartTitle(table.name, table.id)}
                      height={config.height}
                      selectedYear={config.selectedYearForPie}
                    />

                    {/* Data Summary */}
                    {summary && (
                      <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center p-3 bg-gradient-to-b from-red-50 to-red-100 rounded-lg border border-red-200">
                          <div className="font-bold text-red-700 text-lg">{summary.maxValue.toFixed(2)}</div>
                          <div className="text-red-600">📈 Maksimum</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-b from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="font-bold text-green-700 text-lg">{summary.minValue.toFixed(2)}</div>
                          <div className="text-green-600">📉 Minimum</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="font-bold text-blue-700 text-lg">{summary.dataPoints}</div>
                          <div className="text-blue-600">�� Data Points</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default ChartDashboard;
