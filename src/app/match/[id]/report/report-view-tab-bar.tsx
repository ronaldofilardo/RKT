export type ReportViewTab = 'summary' | 'advanced' | 'timeline';

interface TabBarProps {
  activeTab: ReportViewTab;
  onTabChange: (tab: ReportViewTab) => void;
  hasAdvancedStats: boolean;
}

export function TabBar({ activeTab, onTabChange, hasAdvancedStats }: TabBarProps) {
  const tabs: Array<{ id: ReportViewTab; label: string; disabled?: boolean }> = [
    { id: 'summary', label: 'Resumo' },
    { id: 'advanced', label: 'Estatísticas Avançadas', disabled: !hasAdvancedStats },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="flex gap-1 mb-6 bg-telemetry-elevated p-1 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-telemetry-card text-telemetry-text-primary shadow-sm border border-white/10'
              : tab.disabled
                ? 'text-telemetry-text-muted/50 cursor-not-allowed'
                : 'text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
