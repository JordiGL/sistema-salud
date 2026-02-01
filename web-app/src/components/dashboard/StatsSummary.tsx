import { useTranslations } from 'next-intl';
import { calculateStats } from '@/lib/stats';
import { ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface StatsSummaryProps {
  data: number[];
  colorClass?: string; // Made optional as you removed it from JSX, but keeping for compatibility if needed elsewhere
  bgClass?: string;    // Made optional
  unit?: string;
  label?: string;
  legendDotColor?: string;
  showAvg?: boolean;   // New prop to control showing average
}

export function StatsSummary({ data, colorClass, bgClass, unit = '', label, legendDotColor, showAvg = true }: StatsSummaryProps) {
  const t = useTranslations('Charts.stats');
  const stats = calculateStats(data);

  if (!stats) return null;

  return (
    <div className={`flex flex-col gap-2`}>
      {/* TÍTULO CON LEYENDA INTEGRADA */}
      {label && (
        <div className="flex items-center gap-2 mb-1">
          {/* Si pasamos un color, mostramos el punto */}
          {legendDotColor && (
            <span
              className="w-3 h-3 rounded-full shadow-sm border border-white"
              style={{ backgroundColor: legendDotColor }}
            />
          )}
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            {label}
          </span>
        </div>
      )}

      {/* TARJETAS DE ESTADÍSTICAS (Layout Flex) */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        {/* Targeta MIN */}
        <Card className="flex-1 min-w-[100px] border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <ArrowDown size={12} /> {t('min')}
            </span>
            <span className={`text-xl font-bold`}>
              {stats.min}<span className="text-xs text-slate-400 ml-0.5">{unit}</span>
            </span>
          </CardContent>
        </Card>

        {/* Targeta MAX */}
        <Card className="flex-1 min-w-[100px] border-slate-100 shadow-sm rounded-xl">
          <CardContent className="p-3 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <ArrowUp size={12} /> {t('max')}
            </span>
            <span className={`text-xl font-bold`}>
              {stats.max}<span className="text-xs text-slate-400 ml-0.5">{unit}</span>
            </span>
          </CardContent>
        </Card>

        {/* Targeta AVG - Conditionally rendered */}
        {showAvg && (
          <Card className="flex-1 min-w-[100px] border-slate-100 shadow-sm rounded-xl">
            <CardContent className="p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Activity size={12} /> {t('avg')}
              </span>
              <span className={`text-xl font-bold`}>
                {stats.avg}<span className="text-xs text-slate-400 ml-0.5">{unit}</span>
              </span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}